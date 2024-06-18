import { isCelebrateError } from "celebrate";
import { NextFunction, Request, Response } from "express";

import { ApiError } from "../errors/ApiError";
export const errorMiddleware = (
  error: Error & Partial<ApiError>,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error);
  if (isCelebrateError(error)) {
    const errors: Record<string, string> = {};

    error.details.forEach((value, key) => {
      errors[key] = value.message;
    });

    return res.status(422).json({ errors });
  }
  const statusCode = error.statusCode ?? 500;
  const message = error.message ? error.message : "Internal Server Error";

  return res.status(statusCode).json({ message });
};
