import dotenv from "dotenv";
dotenv.config();

export const config = {
  databaseURL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/clinical_screener",
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
};
