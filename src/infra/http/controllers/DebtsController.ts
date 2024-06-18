import { Request, Response } from "express";

import { prisma } from "../../../../prisma/prismaClient";
import Debt from "../../../entities/Debt";
import { randomUUID } from "crypto";
import { CostumerModel, DebtModel } from "../../../mongoose/mongodb";
import { UpdateOrCreate } from "../../../mongoose/utils";
import {
  mailToLateDebts,
  sendEmail,
  sendWppMsg,
} from "../../../utils/messager";
import { updateDebtValueByLateFee } from "../../../utils/debtDbCalcs";
import { deleteFromAWS, uploadAWS } from "../../../services/aws";

export class DebtsController {
  // TODO: adicionar queries para filtrar dividas ativas e dividas fora do prazo
  static async getAllDebts(req: Request, res: Response) {
    const query = req.query || {};
    const result = await DebtModel.find({ ...query });

    if (result) {
      res.status(200).json({ result });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async getSingleDebt(req: Request, res: Response) {
    const params = req.params.id as string;
    const query = req.query || {};
    const result = await DebtModel.find({
      debt_id: params,
      ...query,
    });

    if (result) {
      res.status(200).json({ result });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async addDebt(req: Request, res: Response) {
    const body = req.body;
    const str = JSON.stringify(body);
    const file = (req as any)?.file;
    console.log({ body, str, file });
    const { data } = req.body;
    const {
      costumer_id,
      due_dates,
      fee,
      value,
      payed,
      initial_value,
      payment_method,
      initial_date,
      late_fee,
      description,
    } = JSON.parse(data);

    let docLocation;

    if (file?.buffer) {
      const s3BucketRef = await uploadAWS(file);

      docLocation = s3BucketRef?.Location;
      if (file && !docLocation) {
        res.status(500).json({ result: false, msg: "AWS S3 Bucket Error" });
      }

      console.log({ s3BucketRef });
    }

    const olderDebtIds = (
      await CostumerModel.find({
        costumer_id: costumer_id,
      })
    )[0]?.debts_ids;

    if (!Array.isArray(olderDebtIds)) {
      return res.status(500).json({ error: "DB Find Debt Error" });
    }

    const debt_id = randomUUID();

    const newDebtData = new Debt(
      debt_id,
      costumer_id,
      value,
      initial_value,
      payment_method,
      fee,
      initial_date,
      due_dates,
      payed,
      late_fee,
      0,
      description,
      docLocation,
    );

    const result = await UpdateOrCreate(
      DebtModel,
      { debt_id: newDebtData.debt_id },
      newDebtData,
    );

    if (result.result) {
      const updateResult = await UpdateOrCreate(
        CostumerModel,
        { costumer_id: costumer_id },
        { debts_ids: [...olderDebtIds, debt_id] },
      );

      if (updateResult.result) {
        return res
          .status(200)
          .json({ message: "Debt Added Sucessfully", id: debt_id });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async updateDebt(req: Request, res: Response) {
    const body = req.body;
    const str = JSON.stringify(body);
    const file = (req as any)?.file;
    console.log({ body, str, file });
    const { data } = req.body;
    const dataObj = JSON.parse(data);
    const updateObj = JSON.parse(JSON.stringify(dataObj));

    for (let key in updateObj) {
      if (updateObj[key] === undefined) {
        if (key === "debt_id") {
          return res.status(422).json({
            error: "Missing debt id to update",
          });
        }

        delete updateObj[key];
      }
    }

    let imageDeletionResult = true;

    if (file?.buffer) {
      const s3BucketRef = await uploadAWS(file);

      const docLocation = s3BucketRef?.Location;
      if (file && !docLocation) {
        res.status(500).json({ result: false, msg: "AWS S3 Bucket Error" });
      }
      updateObj.doc = docLocation;
      console.log({ s3BucketRef });

      const debtToDelete = await DebtModel.find({ debt_id: updateObj.debt_id });

      const imageToDelete = debtToDelete?.[0]?.doc;

      if (imageToDelete)
        imageDeletionResult = imageToDelete
          ? Boolean(await deleteFromAWS(imageToDelete))
          : true;

      console.log({ imageDeletionResult, imageToDelete });
    }

    const result = await UpdateOrCreate(
      DebtModel,
      {
        debt_id: updateObj.debt_id,
      },
      updateObj,
    );

    if (result) {
      return res
        .status(200)
        .json({ message: "Debt Updated Sucessfully", id: updateObj.debt_id });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // static async updateCalcDebt(req: Request, res: Response) {
  //   try {
  //     const result = await updateDebtValueByLateFee();
  //     res.status(200).json({ result: true, msg: result });
  //   } catch (err) {
  //     res.status(500).json({ result: true, msg: err });
  //   }
  // }

  static async sendLateMessages(req: Request, res: Response) {
    const allDebts = await DebtModel.find();
    console.log("[sendLateMessages] start");

    // const lateDebts = allDebts.filter(debt => {
    //   const currentDueDate =
    //     debt.due_dates?.[debt.callings] ||
    //     debt.due_dates[debt.due_dates.length - 1];
    //   if (!currentDueDate) {
    //     console.log({ result: false, msg: "Chegou na ultima data programada" });
    //   }
    //   if (currentDueDate?.getTime() < Date.now() && debt.value > debt.payed)
    //     return true;
    // });

    try {
      const lateFeeResult = await updateDebtValueByLateFee(allDebts);
      res.status(200).json({ lateFeeResult });
    } catch (err) {
      console.log({ err });
      res.status(500).json({ err });
    }

    console.log("[sendLateMessages] end");
  }

  static async removeDebt(req: Request, res: Response) {
    if (!req?.body?.debt_id) {
      return res.status(422).json({ error: "Missing Parameter debt_id" });
    }

    const { debt_id } = req.body;

    const result = (await DebtModel.find({ debt_id }))[0];
    const costumerResult = (
      await CostumerModel.find({
        costumer_id: result.costumer_id,
      })
    )[0];

    const newCostumerData = JSON.parse(JSON.stringify(costumerResult));

    const newDebtsArray: string[] = newCostumerData.debts_ids;
    newDebtsArray.splice(newDebtsArray.indexOf(result.debt_id), 1);

    newCostumerData.debts_ids = newDebtsArray;

    const updateResult = await UpdateOrCreate(
      CostumerModel,
      { costumer_id: newCostumerData.costumer_id },
      newCostumerData,
    );

    const debtToDelete = await DebtModel.find({ debt_id });

    const imageToDelete = debtToDelete?.[0]?.doc;

    const deleteResult = await DebtModel.deleteOne({ debt_id });

    let imageDeletionResult;

    if (imageToDelete)
      imageDeletionResult = imageToDelete
        ? await deleteFromAWS(imageToDelete)
        : true;

    console.log({ imageDeletionResult, imageToDelete });

    if (
      result &&
      costumerResult &&
      updateResult &&
      deleteResult &&
      imageDeletionResult
    ) {
      res.status(200).json({
        message: "Debt Removed Sucessfully",
      });
    } else {
      console.log({ updateResult, costumerResult, deleteResult });
      res.status(500).json({
        error: "Internal Server Error",
        result,
        updateResult,
        costumerResult,
        deleteResult,
      });
    }
  }
}
