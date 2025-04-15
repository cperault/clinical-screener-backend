import { AnswerController } from "../../controller/AnswerController";
import { AnswerService } from "../../service/AnswerService";
import { BaseRouter } from "../BaseRouter";
import { Request, Response, NextFunction } from "express";

export class AnswerRouter extends BaseRouter {
  private answerController: AnswerController;

  constructor(answerService: AnswerService) {
    super();
    this.answerController = new AnswerController(answerService);
  }

  protected initializeRoutes(): void {
    this.router.get("/", async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.answerController.getAllAnswers(req, res);
      } catch (error) {
        next(error);
      }
    });

    this.router.post("/", async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.answerController.createAnswersWithSubmission(req, res);
      } catch (error) {
        next(error);
      }
    });
  }
}
