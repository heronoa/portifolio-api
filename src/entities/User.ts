import { Joi, Segments, celebrate } from "celebrate";

import { UnprocessableEntityError } from "../errors";

export default class User {
  createdAt: Date;
  updatedAt: Date;
  constructor(
    readonly id: string,
    readonly email: string,
    readonly hash_password: string,
    readonly acess_token: string,
    readonly permission: number,

    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.email = email;
    this.acess_token = acess_token;
    this.permission = permission;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.validateEmail();
  }

  private validateEmail() {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(this.email)) {
      throw new UnprocessableEntityError("Invalid email");
    }
  }

  static userSchemaValidation = celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().max(180).required(),
      acess_token: Joi.string().min(20).required(),
      permission: Joi.number().required(),
    }),
  });
}
