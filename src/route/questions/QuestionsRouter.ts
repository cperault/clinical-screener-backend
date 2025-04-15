import { QuestionController } from "../../controller/QuestionController";
import { QuestionService } from "../../service/QuestionService";
import { BaseRouter } from "../BaseRouter";
import { Request, Response, NextFunction } from "express";

export class QuestionsRouter extends BaseRouter {
  private questionController: QuestionController;

  constructor(questionService: QuestionService) {
    super();
    this.questionController = new QuestionController(questionService);
  }

  protected initializeRoutes(): void {
    this.router.get("/", async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.questionController.getAllQuestions(req, res);
      } catch (error) {
        next(error);
      }
    });
  }
}
