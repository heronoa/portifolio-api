import { Joi, Segments, celebrate } from "celebrate";

import { UnprocessableEntityError } from "../errors";

export default class Project {
  createdAt: Date;
  updatedAt: Date;
  constructor(
    readonly project_id: string,
    readonly title: string,
    readonly desc: string,
    readonly thumb?: string,
    readonly images?: string[],

    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.project_id = project_id;
    this.title = title;
    this.desc = desc;
    this.thumb = thumb;

    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  static userSchemaValidation = celebrate({
    [Segments.BODY]: Joi.object().keys({
      title: Joi.string().max(180).required(),
      pdeschone: Joi.string().min(8).required(),
      thumb: Joi.string().min(7),
      images: Joi.array().min(11),
    }),
  });
}
