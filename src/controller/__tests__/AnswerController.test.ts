import { Request, Response } from "express";
import { AnswerController } from "../AnswerController";
import { AnswerService } from "../../service/AnswerService";
import { QuestionService } from "../../service/QuestionService";
import { ValidationError, DatabaseError } from "../../middleware/errorHandler";

jest.mock("../../service/AnswerService");
jest.mock("../../service/QuestionService");

describe("AnswerController", () => {
  let answerController: AnswerController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAnswerService: jest.Mocked<AnswerService>;
  let mockQuestionService: jest.Mocked<QuestionService>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      headers: {
        "x-correlation-id": "test-correlation-id",
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockAnswerService = new AnswerService({} as any, {} as any, {} as any) as jest.Mocked<AnswerService>;
    mockQuestionService = new QuestionService({} as any) as jest.Mocked<QuestionService>;
    answerController = new AnswerController(mockAnswerService);
  });

  describe("createAnswersWithSubmission", () => {
    it("should validate basic input requirements", async () => {
      mockRequest.body = {
        session_id: "",
        answers: [],
      };

      mockAnswerService.processScreenerSubmission.mockRejectedValue(new ValidationError("Missing session_id"));

      await answerController.createAnswersWithSubmission(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "VALIDATION_ERROR",
          message: "Missing session_id",
        })
      );
    });

    it("should validate answer format", async () => {
      mockRequest.body = {
        session_id: "test-session",
        answers: [
          { question_id: "question_a", value: 5 }, // Invalid value > 4
        ],
      };

      mockAnswerService.processScreenerSubmission.mockRejectedValue(
        new ValidationError("Each answer must have a question_id and value between 0 and 4")
      );

      await answerController.createAnswersWithSubmission(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "VALIDATION_ERROR",
          message: "Each answer must have a question_id and value between 0 and 4",
        })
      );
    });

    it("should handle successful submission", async () => {
      const mockResult = {
        submission_id: 1,
        results: ["PHQ-9"],
      };

      mockRequest.body = {
        session_id: "test-session",
        answers: [
          { question_id: "question_a", value: 1 },
          { question_id: "question_b", value: 2 },
          { question_id: "question_c", value: 3 },
          { question_id: "question_d", value: 4 },
          { question_id: "question_e", value: 0 },
          { question_id: "question_f", value: 1 },
          { question_id: "question_g", value: 2 },
          { question_id: "question_h", value: 3 },
        ],
      };

      mockAnswerService.processScreenerSubmission.mockResolvedValue(mockResult);

      await answerController.createAnswersWithSubmission(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Screener processed successfully",
          ...mockResult,
        })
      );
    });
  });
});
