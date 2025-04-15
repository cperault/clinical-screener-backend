import winston from "winston";
import path from "path";
import fs from "fs";

const errorFormat = winston.format((info) => {
  if (info.error instanceof Error) {
    return {
      ...info,
      error: {
        message: info.error.message,
        stack: info.error.stack,
      },
    };
  }
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    errorFormat(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
      }`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

const initializeFileTransports = () => {
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    })
  );
};

if (process.env.NODE_ENV !== "test") {
  initializeFileTransports();
}

export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
