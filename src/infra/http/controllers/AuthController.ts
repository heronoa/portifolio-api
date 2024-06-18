import bcrypt from "bcrypt";
import { Request, Response } from "express";

import { prisma } from "../../../../prisma/prismaClient";
import { AuthTokensModel, UserModel } from "../../../mongoose/mongodb";
import { randomUUID } from "crypto";
import { UpdateOrCreate } from "../../../mongoose/utils";
import { timestampFromNow } from "../../../utils/time";
import { sendEmail, sendRecoverEmail } from "../../../utils/messager";

export class AuthController {
  static async token(req: Request, res: Response) {
    const { email, password } = req.body;
    let statusCode, resObj;

    // Retrieve the stored hash from the database or file
    // Here, we'll use a hardcoded hash for demonstration purposes
    const findedUser = await UserModel.find({
      email,
    });

    const storedUser = findedUser?.[0];
    const hash_pass = storedUser?.hash_password;
    const token = storedUser?.acess_token;

    if (!storedUser || !hash_pass || !token) {
      statusCode = 401;
      resObj = { error: "Invalid username or password" };
    } else {
      return bcrypt.compare(
        password,
        hash_pass,
        (err: any, result: boolean) => {
          if (err) {
            return res.status(500).json({ error: err });
          } else if (result) {
            return res.status(200).json({
              token,
              email: storedUser.email,
              uid: storedUser.id,
              permission: storedUser.permission,
            });
          } else {
            return res
              .status(401)
              .json({ error: "Invalid username or password" });
          }
        },
      );
    }

    return res.status(500).json({ error: "Internal server error" });
  }

  static async ping(req: Request, res: Response) {
    return res.status(200).json({ result: "pong", user: req.user });
  }

  static async updatePassword(req: Request, res: Response) {
    const { password = undefined, token = undefined } = req.body;

    if (!password) {
      return res.status(422).json({ result: false, msg: "Password missing" });
    }
    if (!token) {
      return res.status(422).json({ result: false, msg: "Token missing" });
    }

    const findToken = (await AuthTokensModel.find({ token }))[0];

    if (findToken.expires_at > Date.now()) {

      UpdateOrCreate(UserModel, { email: findToken.email }, { password });
      return res.status(200).json({ result: true });
    }
    return res
      .status(500)
      .json({ result: false, msg: "Internal server error" });
  }
  static async forgotPassword(req: Request, res: Response) {
    const { email = undefined } = req.body;

    if (!email) {
      return res.status(422).json({ result: false, msg: "Email missing" });
    }

    const token = await bcrypt.hash(randomUUID(), 10);
    const expires_at = timestampFromNow({ minutes: 15 });

    const tokenResult = await UpdateOrCreate(
      AuthTokensModel,
      { email },
      { email, token, expires_at },
    );

    sendRecoverEmail(
      email,
      `${process.env.CLIENT_URL}/redefinepassword?token=${token}`,
    );
    if (tokenResult.result) {
      return res.status(200).json({ result: true });
    }
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
  static async validateToken(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
      return res.status(422).json({ result: false, msg: "Token missing" });
    }

    const findToken = (await AuthTokensModel.find({ token }))[0];

    if (findToken.expires_at > Date.now()) {
      return res.status(200).json({ result: true });
    }
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
}
