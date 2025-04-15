import { QuestionService } from "../QuestionService";
import { Database } from "../../db";

// Mock the Database class
jest.mock("../../db");

describe("QuestionService", () => {
  let questionService: QuestionService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Create a mock database instance
    mockDatabase = new Database({} as any) as jest.Mocked<Database>;

    // Mock the query method
    mockDatabase.query.mockResolvedValue([
      { question_id: "question_a", title: "Test Question A", domain: "depression" },
      { question_id: "question_b", title: "Test Question B", domain: "depression" },
    ]);

    questionService = new QuestionService(mockDatabase);
  });

  describe("getAllQuestions", () => {
    it("should return all questions with domains", async () => {
      const questions = await questionService.getAllQuestions();

      expect(questions).toEqual([
        { question_id: "question_a", title: "Test Question A", domain: "depression" },
        { question_id: "question_b", title: "Test Question B", domain: "depression" },
      ]);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT q.question_id, q.title, d.name AS domain")
      );
    });

    it("should handle database errors", async () => {
      // Mock a database error
      mockDatabase.query.mockRejectedValueOnce(new Error("Database error"));

      await expect(questionService.getAllQuestions()).rejects.toThrow("Database error");
    });
  });
});
