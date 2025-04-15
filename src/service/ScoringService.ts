import { Database } from "../db";

export interface DomainScore {
  domain: string;
  score: number;
}

export class ScoringService {
  private static readonly THRESHOLDS: Record<string, number> = {
    depression: 2,
    mania: 2,
    anxiety: 2,
    substance_use: 1,
  };

  private static readonly ASSESSMENTS: Record<string, string> = {
    depression: "PHQ-9",
    mania: "ASRM",
    anxiety: "PHQ-9",
    substance_use: "ASSIST",
  };

  constructor(private database: Database) {}

  async calculateResults(answers: { question_id: string; value: number }[]): Promise<string[]> {
    try {
      const domainScores = await this.calculateDomainScores(answers);
      return this.determineAssessments(domainScores);
    } catch (error) {
      console.error("Error calculating results:", error);
      throw new Error("Failed to calculate assessment results");
    }
  }

  private async calculateDomainScores(
    answers: { question_id: string; value: number }[]
  ): Promise<Record<string, number>> {
    const domainScores: Record<string, number> = {};

    for (const answer of answers) {
      const result = await this.database.query<{ name: string }>(
        `
        SELECT d.name
        FROM questions q
        JOIN domains d ON q.domain_id = d.id
        WHERE q.question_id = $1
      `,
        [answer.question_id]
      );

      const domain = result[0]?.name;

      if (domain) {
        domainScores[domain] = (domainScores[domain] || 0) + answer.value;
      }
    }

    return domainScores;
  }

  private determineAssessments(domainScores: Record<string, number>): string[] {
    const assessments = new Set<string>();

    Object.entries(domainScores).forEach(([domain, score]) => {
      if (score >= ScoringService.THRESHOLDS[domain]) {
        assessments.add(ScoringService.ASSESSMENTS[domain]);
      }
    });

    return Array.from(assessments);
  }
}
