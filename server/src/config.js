import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

