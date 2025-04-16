import { Database } from "../db";
import fs from "fs";
import path from "path";

interface Screener {
  id: string;
  name: string;
  disorder: string;
  content: {
    sections: Array<{
      type: string;
      title: string;
      answers: Array<{
        title: string;
        value: number;
      }>;
      questions: Array<{
        question_id: string;
        title: string;
      }>;
    }>;
    display_name: string;
  };
  full_name: string;
}

export class ScreenerService {
  async getScreener(): Promise<Screener> {
    const screenerPath = path.join(__dirname, "../../data/screener.json");
    const screenerData = JSON.parse(fs.readFileSync(screenerPath, "utf8"));
    return screenerData;
  }
}
