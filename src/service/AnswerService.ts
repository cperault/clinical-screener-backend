import { PoolClient } from "pg";
import { Database } from "../db";
import { ScoringService } from "./ScoringService";
import { QuestionService } from "./QuestionService";
import { ValidationError } from "../middleware/errorHandler";

export interface Submission {
  id: string;
  session_id: string;
  created_at: string;
  clinician_notes?: string;
}

interface Answer {
  id: number;
  question_id: string;
  value: number;
  created_at: Date;
  submission_id: string;
}

export interface NewAnswer {
  question_id: string;
  value: number;
}

export interface ScreenerResult {
  submission_id: string;
  results: string[];
}

export class AnswerService {
  constructor(
    private database: Database,
    private scoringService: ScoringService,
    private questionService: QuestionService
  ) {}

  async getAllAnswers(): Promise<Answer[]> {
    const result = await this.database.query<Answer>("SELECT * FROM answers ORDER BY created_at DESC");
    return result;
  }

  async createSubmission(sessionId: string, clinicianNotes?: string): Promise<Submission> {
    const result = await this.database.query<Submission>(
      `
      INSERT INTO submissions (session_id, clinician_notes)
      VALUES ($1, $2)
      RETURNING *
    `,
      [sessionId, clinicianNotes ?? null]
    );
    return result[0];
  }

  async saveAnswers(submissionId: string, answers: { question_id: string; value: number }[]) {
    const client: PoolClient = await this.database.getClient();

    try {
      await client.query("BEGIN");

      for (const answer of answers) {
        if (!answer.question_id || typeof answer.value !== "number") {
          throw new Error("Invalid answer input");
        }

        await client.query(
          `INSERT INTO answers (submission_id, question_id, value)
           VALUES ($1, $2, $3)`,
          [submissionId, answer.question_id, answer.value]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async processScreenerSubmission(
    sessionId: string,
    answers: Array<{ question_id: string; value: number }>,
    clinicianNotes?: string
  ) {
    if (!sessionId) {
      throw new ValidationError("Missing session_id");
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new ValidationError("Answers must be a non-empty array");
    }

    if (answers.some((a) => !a.question_id || typeof a.value !== "number" || a.value < 0 || a.value > 4)) {
      throw new ValidationError("Each answer must have a question_id and value between 0 and 4");
    }

    const allQuestions = await this.questionService.getAllQuestions();
    const answeredQuestionIds = new Set(answers.map((a) => a.question_id));
    const missingQuestions = allQuestions.filter((q) => !answeredQuestionIds.has(q.question_id));

    if (missingQuestions.length > 0) {
      throw new ValidationError(
        `Missing answers for questions: ${missingQuestions.map((q) => q.question_id).join(", ")}`
      );
    }

    const client = await this.database.getClient();
    try {
      await client.query("BEGIN");

      const existingSubmission = await client.query("SELECT id FROM submissions WHERE session_id = $1", [sessionId]);

      if (existingSubmission.rows.length > 0) {
        throw new ValidationError(
          "This screener has already been completed. Please contact your clinician for further assistance."
        );
      }

      const submissionResult = await client.query(
        "INSERT INTO submissions (session_id, clinician_notes) VALUES ($1, $2) RETURNING id",
        [sessionId, clinicianNotes]
      );
      const submissionId = submissionResult.rows[0].id;

      for (const answer of answers) {
        await client.query("INSERT INTO answers (submission_id, question_id, value) VALUES ($1, $2, $3)", [
          submissionId,
          answer.question_id,
          answer.value,
        ]);
      }

      const results = await this.scoringService.calculateResults(answers);

      await client.query("COMMIT");

      return {
        submission_id: submissionId,
        results,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
