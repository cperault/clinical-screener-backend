import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS answers, submissions, questions, domains CASCADE;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS questions (
        question_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        domain_id INTEGER REFERENCES domains(id)
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        clinician_notes TEXT
      );

      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        question_id TEXT REFERENCES questions(question_id),
        submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
        value INTEGER NOT NULL CHECK (value >= 0),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const questionsPath = path.join(__dirname, "../data/questions.json");
    const domainMapPath = path.join(__dirname, "../data/domainMap.json");

    const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf-8")).questions;
    const domainMap: Record<string, string> = JSON.parse(fs.readFileSync(domainMapPath, "utf-8"));

    const uniqueDomains: string[] = [...new Set(Object.values(domainMap))];
    const domainIdMap: Record<string, number> = {};

    for (const domain of uniqueDomains) {
      const res = await pool.query(
        `INSERT INTO domains (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
        [domain]
      );

      if (res.rows.length > 0) {
        domainIdMap[domain] = res.rows[0].id;
      } else {
        const fallback = await pool.query(`SELECT id FROM domains WHERE name = $1`, [domain]);
        domainIdMap[domain] = fallback.rows[0].id;
      }
    }

    for (const q of questionsData) {
      const domainName = domainMap[q.question_id];
      const domainId = domainIdMap[domainName];

      await pool.query(
        `INSERT INTO questions (question_id, title, domain_id) VALUES ($1, $2, $3)
         ON CONFLICT (question_id) DO NOTHING`,
        [q.question_id, q.title, domainId]
      );
    }

    console.log("✅ Database seeded successfully.");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await pool.end();
  }
}

seedDatabase();
