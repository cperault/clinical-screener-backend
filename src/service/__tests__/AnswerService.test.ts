import { AnswerService } from "../AnswerService";
import { Database } from "../../db";
import { ScoringService } from "../ScoringService";
import { QuestionService } from "../QuestionService";
import { ValidationError } from "../../middleware/errorHandler";

jest.mock("../../db");
jest.mock("../ScoringService");
jest.mock("../QuestionService");

describe("AnswerService", () => {
  let answerService: AnswerService;
  let mockDatabase: jest.Mocked<Database>;
  let mockScoringService: jest.Mocked<ScoringService>;
  let mockQuestionService: jest.Mocked<QuestionService>;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockDatabase = {
      query: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    } as any;

    mockScoringService = {
      calculateResults: jest.fn().mockResolvedValue(["PHQ-9"]),
    } as any;

    mockQuestionService = {
      getAllQuestions: jest.fn().mockResolvedValue([
        { question_id: "question_a", title: "Question A" },
        { question_id: "question_b", title: "Question B" },
        { question_id: "question_c", title: "Question C" },
        { question_id: "question_d", title: "Question D" },
        { question_id: "question_e", title: "Question E" },
        { question_id: "question_f", title: "Question F" },
        { question_id: "question_g", title: "Question G" },
        { question_id: "question_h", title: "Question H" },
      ]),
    } as any;

    answerService = new AnswerService(mockDatabase, mockScoringService, mockQuestionService);
  });

  describe("processScreenerSubmission", () => {
    it("should save answers and return results", async () => {
      const sessionId = "test-session-id";
      const answers = [
        { question_id: "question_a", value: 1 },
        { question_id: "question_b", value: 2 },
        { question_id: "question_c", value: 3 },
        { question_id: "question_d", value: 4 },
        { question_id: "question_e", value: 0 },
        { question_id: "question_f", value: 1 },
        { question_id: "question_g", value: 2 },
        { question_id: "question_h", value: 3 },
      ];

      mockClient.query.mockImplementation((query: string, params?: any[]) => {
        if (query === "SELECT id FROM submissions WHERE session_id = $1") {
          return Promise.resolve({ rows: [] });
        }
        if (query.includes("INSERT INTO submissions")) {
          return Promise.resolve({ rows: [{ id: "test-uuid-123" }] });
        }
        if (query === "BEGIN" || query === "COMMIT") {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await answerService.processScreenerSubmission(sessionId, answers);

      expect(result).toEqual({
        submission_id: "test-uuid-123",
        results: ["PHQ-9"],
      });

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    it("should throw error when questions are missing", async () => {
      const sessionId = "test-session";
      const answers = [
        { question_id: "question_a", value: 1 },
        { question_id: "question_b", value: 2 },
      ];

      await expect(answerService.processScreenerSubmission(sessionId, answers)).rejects.toThrow(
        new ValidationError(
          "Missing answers for questions: question_c, question_d, question_e, question_f, question_g, question_h"
        )
      );
    });
  });
});
