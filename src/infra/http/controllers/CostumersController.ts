import { Request, Response } from "express";

import { prisma } from "../../../../prisma/prismaClient";
import Costumer from "../../../entities/Costumers";
import { randomUUID } from "crypto";
import { CostumerModel, DebtModel } from "../../../mongoose/mongodb";
import { UpdateOrCreate } from "../../../mongoose/utils";
import { deleteFromAWS, uploadAWS } from "../../../services/aws";

export class CostumersController {
  // TODO: adicionar queries para filtrar cliente sem dividas, dividas ativas e dividas fora do prazo

  static async getAllCostumers(req: Request, res: Response) {
    const query = req?.query || {};
    const result = await CostumerModel.find({ ...query });

    if (result) {
      res.status(200).json({ result });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async getSingleCostumer(req: Request, res: Response) {
    const params = req.params.id as string;
    const query = req?.query || {};
    const result = await CostumerModel.find({ costumer_id: params, ...query });

    if (result) {
      res.status(200).json({ result });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async addCostumer(req: Request, res: Response) {
    const files = (req as any)?.files;
    const { data } = req.body;

    const {
      debts_ids,
      email,
      name,
      last_name,
      phone,
      adress,
      cep,
      rg,
      cpf,
      details,
    } = JSON.parse(data);

    console.log({ files });

    const costumer_id = randomUUID();
    let rgDocLocation, cpfDocLocation, otherDocLocation;

    const awsError = [];

    if (files?.rgDoc?.[0]?.buffer) {
      const s3BucketRef = await uploadAWS(files?.rgDoc?.[0]);

      rgDocLocation = await s3BucketRef?.Location;
      if (files?.rgDoc?.[0] && !rgDocLocation) {
        awsError.push({ result: false, msg: "AWS S3 Bucket Error - rgDoc" });
      }

      console.log({ s3BucketRef });
    }
    if (files?.cpfDoc?.[0]?.buffer) {
      const s3BucketRef = await uploadAWS(files?.cpfDoc?.[0]);

      cpfDocLocation = await s3BucketRef?.Location;
      if (files?.cpfDoc?.[0] && !cpfDocLocation) {
        awsError.push({ result: false, msg: "AWS S3 Bucket Error - cpfDoc" });
      }

      console.log({ s3BucketRef });
    }
    if (files?.otherDoc?.[0]?.buffer) {
      const s3BucketRef = await uploadAWS(files?.cpfDoc?.[0]);

      otherDocLocation = await s3BucketRef?.Location;
      if (files?.otherDoc?.[0] && !otherDocLocation) {
        awsError.push({ result: false, msg: "AWS S3 Bucket Error - OtherDoc" });
      }

      console.log({ s3BucketRef });
    }

    console.log({ awsError });

    // const getLocations = (): string[] => {
    //   return [files?.rgDoc?.[0], files?.cpfDoc?.[0], files?.otherDoc?.[0]]
    //     .map((doc): string | null => {
    //       if (doc?.buffer) {
    //         const s3BucketRef = uploadAWS(doc).then(data => data) as any;

    //         const docLocation: string = s3BucketRef?.Location;
    //         if (doc && !docLocation) {
    //           res
    //             .status(500)
    //             .json({ result: false, msg: "AWS S3 Bucket Error" });
    //         }
    //         console.log({ s3BucketRef });
    //         if (typeof docLocation === "string") return docLocation;
    //       }
    //       return null;
    //     })
    //     .filter((e: string | null) => Boolean(e)) as string[];
    // };

    // const locationsArr = getLocations();

    const newCostumerData = new Costumer(
      costumer_id,
      debts_ids,
      name,
      last_name,
      phone,
      email,
      adress,
      cep,
      rg,
      cpf,
      details,
      cpfDocLocation || undefined,
      rgDocLocation || undefined,
      otherDocLocation || undefined,
    );

    const dbres = await UpdateOrCreate(
      CostumerModel,
      { costumer_id: newCostumerData.costumer_id },
      newCostumerData,
    );

    if (dbres?.result) {
      res.status(200).json({
        message: "Costumer Added Sucessfully",
        costumer_id: costumer_id,
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async updateCostumer(req: Request, res: Response) {
    const updateObj = JSON.parse(JSON.stringify(req.body));

    for (let key in updateObj) {
      if (updateObj[key] === undefined) {
        if (key === "costumer_id") {
          return res.status(422).json({
            error: "Missing costumer id to update",
          });
        }

        delete updateObj[key];
      }
    }

    const result = await UpdateOrCreate(
      CostumerModel,
      {
        costumer_id: updateObj.costumer_id,
      },
      updateObj,
    ).catch(err =>
      res.status(500).json({
        message: "DB error",
        details: err,
      }),
    );

    if (result) {
      res.status(200).json({
        message: "Costumer Update Sucessfully",
        costumer_id: updateObj.costumer_id,
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async removeCostumer(req: Request, res: Response) {
    if (!req?.body?.costumer_id) {
      return res.status(422).json({ error: "Missing Parameter costumer_id" });
    }

    const { costumer_id } = req.body;

    const costumerToDelete = await CostumerModel.findOneAndDelete({
      costumer_id,
    });

    const costumerImagesToDelete = [
      costumerToDelete?.cpfDoc,
      costumerToDelete?.rgDoc,
      costumerToDelete?.otherDoc,
    ].filter(e => Boolean(e));

    const costumerResult = await CostumerModel.findOneAndDelete({
      costumer_id,
    });
    const debtsResult = await DebtModel.find({ costumer_id });
    const imagesToDelete: any[] = debtsResult
      .map(e => e.doc)
      .filter(e => Boolean(e));
    let imagesDeletionResult: any = [true];

    imagesToDelete.push(costumerImagesToDelete);

    if (imagesToDelete.length > 0) {
      imagesDeletionResult = imagesToDelete.map(async (e: string) => {
        const res = await deleteFromAWS(e);
        return Boolean(res) as boolean;
      });
    }

    const deletionResult = imagesDeletionResult.some((e: any) => !e);

    console.log({ imagesToDelete, imagesDeletionResult, deletionResult });

    if (costumerResult && debtsResult && deletionResult) {
      res.status(200).json({
        message: "Costumer Removed Sucessfully",
      });
    } else {
      res
        .status(500)
        .json({ error: "Internal Server Error", costumerResult, debtsResult });
    }
  }
}
