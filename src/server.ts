import app from "./app";
import logger from "./utils/logger";
import { config } from "./config";

const startServer = () => {
  try {
    app.listen(config.port, () => {
      logger.info(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

startServer();
