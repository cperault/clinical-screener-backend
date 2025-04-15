import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Pool } from "pg";
import { errorHandler } from "./middleware/errorHandler";
import { ApiRouter } from "./route/api/ApiRouter";
import logger from "./utils/logger";
import { Database } from "./db";
import { QuestionService } from "./service/QuestionService";
import { AnswerService } from "./service/AnswerService";
import { ScoringService } from "./service/ScoringService";
import { ScreenerService } from "./service/ScreenerService";
import { config } from "./config";

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://clinical-screener-frontend.netlify.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "x-correlation-id"],
  })
);

app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || "no-correlation-id";
  logger.info(`Incoming ${req.method} request to ${req.path}`, {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
  });
  next();
});

const pool = new Pool({
  connectionString: config.databaseURL,
  ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
});
const database = new Database(pool);
const questionService = new QuestionService(database);
const scoringService = new ScoringService(database);
const answerService = new AnswerService(database, scoringService, questionService);
const screenerService = new ScreenerService(database);

const apiRouter = new ApiRouter(questionService, answerService, screenerService);
app.use("/api", apiRouter.getRouter());

app.use(errorHandler);

export default app;
