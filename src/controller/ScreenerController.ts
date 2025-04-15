import { Request, Response } from "express";
import { ScreenerService } from "../service/ScreenerService";

export class ScreenerController {
  constructor(private screenerService: ScreenerService) {}

  async getScreener(req: Request, res: Response): Promise<void> {
    try {
      const screener = await this.screenerService.getScreener();
      res.json(screener);
    } catch (error) {
      console.error("Error fetching screener:", error);
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch screener data",
      });
    }
  }
}
