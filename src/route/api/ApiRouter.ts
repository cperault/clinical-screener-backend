import { AnswerService } from "../../service/AnswerService";
import { QuestionService } from "../../service/QuestionService";
import { ScreenerService } from "../../service/ScreenerService";
import { AnswerRouter } from "../answers/AnswerRouter";
import { BaseRouter } from "../BaseRouter";
import { QuestionsRouter } from "../questions/QuestionsRouter";
import { ScreenerRouter } from "../screener/ScreenerRouter";

export class ApiRouter extends BaseRouter {
  constructor(
    private questionService: QuestionService,
    private answerService: AnswerService,
    private screenerService: ScreenerService
  ) {
    super();
  }

  protected initializeRoutes(): void {
    const questionsRouter = new QuestionsRouter(this.questionService);
    const answerRouter = new AnswerRouter(this.answerService);
    const screenerRouter = new ScreenerRouter(this.screenerService);

    this.router.use("/questions", questionsRouter.getRouter());
    this.router.use("/answers", answerRouter.getRouter());
    this.router.use("/screener", screenerRouter.getRouter());
  }
}
