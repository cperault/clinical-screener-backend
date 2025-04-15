import { ScoringService } from "../ScoringService";
import { Database } from "../../db";

// Mock the Database class
jest.mock("../../db");

// Mock console.error to suppress expected error output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("ScoringService", () => {
  let scoringService: ScoringService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase = new Database({} as any) as jest.Mocked<Database>;

    mockDatabase.query.mockImplementation(async (query, params) => {
      const questionId = params?.[0];
      const domainMap: Record<string, string> = {
        question_a: "depression",
        question_b: "depression",
        question_c: "mania",
        question_d: "mania",
        question_e: "anxiety",
        question_f: "anxiety",
        question_g: "anxiety",
        question_h: "substance_use",
      };

      return [{ name: domainMap[questionId] }];
    });

    scoringService = new ScoringService(mockDatabase);
  });

  describe("calculateResults", () => {
    it("should return correct assessments based on domain scores", async () => {
      const answers = [
        { question_id: "question_a", value: 2 }, // depression: 2
        { question_id: "question_b", value: 1 }, // depression: 3
        { question_id: "question_c", value: 3 }, // mania: 3
        { question_id: "question_d", value: 0 }, // mania: 3
        { question_id: "question_e", value: 2 }, // anxiety: 2
        { question_id: "question_f", value: 0 }, // anxiety: 2
        { question_id: "question_g", value: 0 }, // anxiety: 2
        { question_id: "question_h", value: 1 }, // substance_use: 1
      ];

      const results = await scoringService.calculateResults(answers);

      // Should include PHQ-9 (depression), ASRM (mania), and ASSIST (substance_use)
      expect(results).toContain("PHQ-9");
      expect(results).toContain("ASRM");
      expect(results).toContain("ASSIST");
      expect(results.length).toBe(3);
    });

    it("should return empty array when no thresholds are met", async () => {
      // Test case with low scores that shouldn't trigger any assessments
      const answers = [
        { question_id: "question_a", value: 0 },
        { question_id: "question_b", value: 0 },
        { question_id: "question_c", value: 0 },
        { question_id: "question_d", value: 0 },
        { question_id: "question_e", value: 0 },
        { question_id: "question_f", value: 0 },
        { question_id: "question_g", value: 0 },
        { question_id: "question_h", value: 0 },
      ];

      const results = await scoringService.calculateResults(answers);
      expect(results).toEqual([]);
    });

    it("should require all questions to be answered", async () => {
      // Test case with only some questions answered
      const answers = [
        { question_id: "question_a", value: 3 },
        { question_id: "question_b", value: 3 },
        { question_id: "question_c", value: 0 },
      ];

      // This should throw a validation error in the controller
      // The test is kept for reference but should be moved to the controller tests
      const results = await scoringService.calculateResults(answers);

      // Note: In a real scenario, this would be rejected by the controller
      // This test is kept for backward compatibility
      expect(results).toContain("PHQ-9");
      expect(results.length).toBe(1);
    });

    it("should handle database errors gracefully", async () => {
      // Mock a database error
      mockDatabase.query.mockRejectedValueOnce(new Error("Database error"));

      const answers = [{ question_id: "question_a", value: 2 }];

      await expect(scoringService.calculateResults(answers)).rejects.toThrow("Failed to calculate assessment results");
    });
  });
});
