import { Request, Response } from "express";
import { AnswerService } from "../service/AnswerService";
import { ValidationError, DatabaseError } from "../middleware/errorHandler";

export class AnswerController {
  constructor(private answerService: AnswerService) {}

  async getAllAnswers(req: Request, res: Response): Promise<void> {
    try {
      const answers = await this.answerService.getAllAnswers();
      res.status(200).json(answers);
    } catch (error: unknown) {
      console.error("Error fetching answers:", error instanceof Error ? error.message : error);

      if (error instanceof DatabaseError) {
        res.status(500).json({
          error: error.code,
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: "UNKNOWN_ERROR",
          message: "An unexpected error occurred while retrieving answers",
        });
      }
    }
  }

  async createAnswersWithSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { session_id, answers } = req.body;

      const result = await this.answerService.processScreenerSubmission(session_id, answers);

      res.status(201).json({
        message: "Screener processed successfully",
        ...result,
      });
    } catch (error: unknown) {
      console.error("Detailed error in createAnswersWithSubmission:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          error: error.code,
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing the screener",
        });
      }
    }
  }
}
