import { Database } from "../db";

export interface QuestionWithDomain {
  question_id: string;
  title: string;
  domain: string;
}

export class QuestionService {
  constructor(private database: Database) {}

  async getAllQuestions(): Promise<QuestionWithDomain[]> {
    const result = await this.database.query<QuestionWithDomain>(`
        SELECT q.question_id, q.title, d.name AS domain
        FROM questions q
        JOIN domains d ON q.domain_id = d.id
      `);
    return result;
  }
}
