import { Request, Response } from "express";
import { QuestionService } from "../service/QuestionService";

export class QuestionController {
  constructor(private questionService: QuestionService) {}

  async getAllQuestions(req: Request, res: Response): Promise<void> {
    try {
      const questions = await this.questionService.getAllQuestions();
      res.status(200).json(questions);
    } catch (error: unknown) {
      console.error("Error fetching questions:", error instanceof Error ? error.message : error);

      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        message: "An unexpected error occurred while retrieving questions",
      });
    }
  }
}
