import { ScreenerService } from "../ScreenerService";
import { Database } from "../../db";
import fs from "fs";
import path from "path";

// Mock the Database class and fs module
jest.mock("../../db");
jest.mock("fs");
jest.mock("path");

describe("ScreenerService", () => {
  let screenerService: ScreenerService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Create a mock database instance
    mockDatabase = new Database({} as any) as jest.Mocked<Database>;

    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        id: "test-id",
        name: "Test Screener",
        content: {
          sections: [
            {
              questions: [{ question_id: "question_a", title: "Test Question A" }],
            },
          ],
        },
      })
    );

    // Mock path.join
    (path.join as jest.Mock).mockReturnValue("/mock/path/screener.json");

    screenerService = new ScreenerService();
  });

  describe("getScreener", () => {
    it("should return screener data from file", async () => {
      const screener = await screenerService.getScreener();

      expect(screener).toEqual({
        id: "test-id",
        name: "Test Screener",
        content: {
          sections: [
            {
              questions: [{ question_id: "question_a", title: "Test Question A" }],
            },
          ],
        },
      });

      expect(fs.readFileSync).toHaveBeenCalledWith("/mock/path/screener.json", "utf8");
    });

    it("should handle file read errors", async () => {
      // Mock a file read error
      (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error("File not found");
      });

      await expect(screenerService.getScreener()).rejects.toThrow("File not found");
    });
  });
});
