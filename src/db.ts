import { Pool, PoolClient, QueryArrayConfig } from "pg";
import { config } from "./config";
import { DatabaseError } from "./middleware/errorHandler";
import logger from "./utils/logger";

export class Database {
  constructor(private pool: Pool) {
    logger.info("Initializing database connection...");
    this.pool = new Pool({
      connectionString: config.databaseURL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    this.pool.on("error", (err) => {
      logger.error("Unexpected error on idle client", { error: err });
    });
  }

  async query<T>(query: string, params?: any[]): Promise<T[]> {
    try {
      const res = await this.pool.query(query, params);
      return res.rows;
    } catch (err) {
      logger.error("Database query error", { error: err, query });
      throw new DatabaseError(
        err instanceof Error ? err.message : "Unknown database error",
        err instanceof Error && (err as any).code ? (err as any).code : "DB_ERROR"
      );
    }
  }

  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (err) {
      logger.error("Error getting database client", { error: err });
      throw new DatabaseError(
        err instanceof Error ? err.message : "Failed to get database client",
        err instanceof Error && (err as any).code ? (err as any).code : "DB_CLIENT_ERROR"
      );
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      logger.info("Successfully connected to database");
      client.release();

      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error("Database connection error", {
          message: error.message,
          code: (error as any).code,
          stack: error.stack,
          config: this.pool.options,
        });
      } else {
        logger.error("Database connection error: unknown error type", {
          error,
          config: this.pool.options,
        });
      }

      return false;
    }
  }
}
