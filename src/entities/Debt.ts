import { Joi, Segments, celebrate } from "celebrate";

import { UnprocessableEntityError } from "../errors";

export default class Debt {
  createdAt: Date;
  updatedAt: Date;
  constructor(
    readonly debt_id: string,
    readonly costumer_id: string,
    readonly value: number,
    readonly initial_value: number,
    readonly payment_method: string,
    readonly fee: number,
    readonly initial_date: Date,
    readonly due_dates: Date[],
    readonly payed: number,
    readonly late_fee: number,
    readonly callings: number,
    readonly description?: string,
    readonly doc?: string,

    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.costumer_id = costumer_id;
    this.debt_id = debt_id;
    this.value = value;
    this.initial_value = initial_value;
    this.payment_method = payment_method;
    this.fee = fee;
    this.initial_date = initial_date;
    this.due_dates = due_dates;
    this.payed = payed;

    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  static userSchemaValidation = celebrate({
    [Segments.BODY]: Joi.object().keys({
      value: Joi.number().required(),
      fee: Joi.number().min(0).max(1).required(),
      due_dates: Joi.array().required(),
    }),
  });
}
