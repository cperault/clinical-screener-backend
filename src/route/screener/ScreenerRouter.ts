import { ScreenerController } from "../../controller/ScreenerController";
import { ScreenerService } from "../../service/ScreenerService";
import { BaseRouter } from "../BaseRouter";
import { Request, Response, NextFunction } from "express";

export class ScreenerRouter extends BaseRouter {
  private screenerController: ScreenerController;

  constructor(screenerService: ScreenerService) {
    super();
    this.screenerController = new ScreenerController(screenerService);
  }

  protected initializeRoutes(): void {
    this.router.get("/", async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.screenerController.getScreener(req, res);
      } catch (error) {
        next(error);
      }
    });
  }
}
