import { Request, Response } from "express";

import Project from "../../../entities/Project";
import { randomUUID } from "crypto";
import { ProjectModel } from "../../../mongoose/mongodb";
import { UpdateOrCreate } from "../../../mongoose/utils";
import { deleteFromAWS, uploadAWS } from "../../../services/aws";
// import { sendEmail } from "../../../utils/messager";

export class ProjectsController {
  static async getAll(req: Request, res: Response) {
    const query = req?.query || {};
    const result = await ProjectModel.find({ ...query });

    if (result) {
      res.status(200).json({ result });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async getSingle(req: Request, res: Response) {
    const params = req.params.id as string;
    const query = req?.query || {};
    const result = await ProjectModel.find({ costumer_id: params, ...query });

    if (result) {
      res.status(200).json({ result });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async add(req: Request, res: Response) {
    const files = (req as any)?.files;
    const { data } = req.body;

    const { title, desc } = JSON.parse(data);

    const project_id = randomUUID();
    let thumbLocation, imagesLocation;

    const awsError = [];

    if (files?.thumb?.[0]?.buffer) {
      const s3BucketRef = await uploadAWS(files?.thumb?.[0]);

      thumbLocation = await s3BucketRef?.Location;
      if (!thumbLocation) {
        awsError.push({ result: false, msg: "AWS S3 Bucket Error - thumb" });
      }
    }
    if (files?.images?.[0]?.buffer) {
      files?.images?.forEach(async (file: any) => {
        if (file.buffer) {
          const s3BucketRef = await uploadAWS(file);
          if (s3BucketRef?.location) {
            imagesLocation.push(s3BucketRef?.location);
          } else {
            awsError.push({
              result: false,
              msg: "AWS S3 Bucket Error - images",
            });
          }
        }
      });
    }

    // console.log({ awsError });

    const newProjectData = new Project(
      project_id,
      title,
      desc,
      thumbLocation,
      imagesLocation,
    );

    const dbres = await UpdateOrCreate(
      ProjectModel,
      { project_id: newProjectData.project_id },
      newProjectData,
    );

    if (dbres?.result) {
      res.status(200).json({
        message: "Project Added Sucessfully",
        project_id: project_id,
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async update(req: Request, res: Response) {
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
      ProjectModel,
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
        message: "Project Update Sucessfully",
        costumer_id: updateObj.costumer_id,
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async remove(req: Request, res: Response) {
    if (!req?.body?.costumer_id) {
      return res.status(422).json({ error: "Missing Parameter costumer_id" });
    }

    const { project_id } = req.body;

    const projectToDelete = await ProjectModel.findOneAndDelete({
      project_id,
    });

    const projectImagesToDelete = [
      projectToDelete?.thumb || undefined,
      ...(projectToDelete?.images || []),
    ].filter(e => Boolean(e));

    const projectResult = await ProjectModel.findOneAndDelete({
      project_id,
    });
    const imagesToDelete: any[] = [];
    let imagesDeletionResult: any = [true];

    imagesToDelete.push(projectImagesToDelete);

    if (imagesToDelete.length > 0) {
      imagesDeletionResult = imagesToDelete.map(async (e: string) => {
        const res = await deleteFromAWS(e || "");
        return Boolean(res) as boolean;
      });
    }

    const deletionResult = imagesDeletionResult.some((e: any) => e === false);

    if (projectResult) {
      res.status(200).json({
        message: "Project Removed Sucessfully",
      });
    } else {
      res.status(500).json({ error: "Internal Server Error", projectResult });
    }
  }

  // static async sendContact(req: Request, res: Response) {
  //   const {
  //     subject = undefined,
  //     message = undefined,
  //     contact = undefined,
  //   } = req.body;

  //   try {
  //     const resMail = await sendEmail({ subject, message, contact });
  //     return res.status(200).json({ result: true, email: resMail });
  //   } catch (err) {
  //     console.log({ err });
  //     return res.status(500).json({ result: false, err });
  //   }
  // }
}
