import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3333;
export const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
export const MAILCHIMP_SERVER_ID = process.env.MAILCHIMP_SERVER_ID;
export const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
export const secret = process.env.SECRET as string;

export const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : "*";

export const allowedOrigins = CORS_ORIGIN;
