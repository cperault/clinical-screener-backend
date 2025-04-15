import { Router } from "express";

export abstract class BaseRouter {
  protected router: Router;

  constructor() {
    this.router = Router();
  }

  protected abstract initializeRoutes(): void;

  public getRouter(): Router {
    this.initializeRoutes();
    return this.router;
  }
}
