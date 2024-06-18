import { Joi, Segments, celebrate } from "celebrate";

import { UnprocessableEntityError } from "../errors";

export default class Costumer {
  createdAt: Date;
  updatedAt: Date;
  constructor(
    readonly costumer_id: string,
    readonly debts_ids: string[],
    readonly name: string,
    readonly last_name: string,
    readonly phone: string,
    readonly email: string,
    readonly adress: string,
    readonly cep: string,
    readonly rg: string,
    readonly cpf: string,
    readonly details?: string,
    readonly cpfDoc?: String,
    readonly rgDoc?: String,
    readonly otherDoc?: string,

    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.costumer_id = costumer_id;
    this.debts_ids = debts_ids;
    this.email = email;
    this.phone = phone;
    this.name = name;
    this.last_name = last_name;
    this.cep = cep;
    this.adress = adress;
    this.rg = rg;
    this.cpf = cpf;
    this.details = details;
    this.cpfDoc = cpfDoc;
    this.rgDoc = rgDoc;
    this.otherDoc = otherDoc;

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
      phone: Joi.string().min(8).required(),
      rg: Joi.string().min(7).required(),
      cpf: Joi.string().min(11).required(),
    }),
  });
}
