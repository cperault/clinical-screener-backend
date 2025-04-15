import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

interface QuestionnaireContext {
  domain?: string;
  questionCount?: number;
  validationErrors?: string[];
  isComplete?: boolean;
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  correlationId: string;
  sessionId?: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  requestInfo?: {
    hasBody: boolean;
    bodySize?: number;
    queryParams?: Record<string, boolean>;
    questionnaireContext?: QuestionnaireContext;
  };
}

const getCorrelationId = (req: Request): string => {
  const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();
  req.headers["x-correlation-id"] = correlationId;
  return correlationId;
};

const getSessionId = (req: Request): string | undefined => {
  return req.body?.session_id || (req.query?.session_id as string) || (req.headers["x-session-id"] as string);
};

const getQuestionnaireContext = (req: Request): QuestionnaireContext | undefined => {
  const context: QuestionnaireContext = {};

  if (req.path.includes("/depression")) {
    context.domain = "depression";
  } else if (req.path.includes("/anxiety")) {
    context.domain = "anxiety";
  } else if (req.path.includes("/mania")) {
    context.domain = "mania";
  } else if (req.path.includes("/substance_use")) {
    context.domain = "substance_use";
  }

  if (req.path === "/api/answers" && Array.isArray(req.body?.answers)) {
    context.questionCount = req.body.answers.length;
  }

  if (req.body?.isComplete !== undefined) {
    context.isComplete = req.body.isComplete;
  }

  return Object.keys(context).length > 0 ? context : undefined;
};

const sanitizeRequestInfo = (req: Request) => {
  return {
    hasBody: !!req.body,
    bodySize: req.body ? JSON.stringify(req.body).length : undefined,
    queryParams:
      Object.keys(req.query).length > 0
        ? Object.keys(req.query).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        : undefined,
    questionnaireContext: getQuestionnaireContext(req),
  };
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const correlationId = getCorrelationId(req);
  const sessionId = getSessionId(req);

  // Log request start
  logger.info("Request started", {
    correlationId,
    sessionId,
    method: req.method,
    path: req.path,
    requestInfo: sanitizeRequestInfo(req),
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "error" : "info";

    // Log request completion
    logger.log(level, "Request completed", {
      correlationId,
      sessionId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestInfo: sanitizeRequestInfo(req),
    });
  });

  res.on("error", (error: Error) => {
    // Log request error
    logger.error("Request error", {
      correlationId,
      sessionId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      requestInfo: sanitizeRequestInfo(req),
    });
  });

  next();
};
