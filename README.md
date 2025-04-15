### Clinical Screener Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Docker
- Jest

### Verifying Database Updates

For this project, we have a Docker container called `screener_db` with a PostgreSQL database called `screener` in which the following tables are defined:

- `answers`
- `submissions`
- `domains`
- `questions`

---

## 🧠 Answers Table

Stores a single numeric response to a given question in a particular submission session.

| Column        | Type    | Constraints                                  |
| ------------- | ------- | -------------------------------------------- |
| id            | SERIAL  | PRIMARY KEY                                  |
| submission_id | UUID    | REFERENCES submissions(id) ON DELETE CASCADE |
| question_id   | TEXT    | REFERENCES questions(question_id)            |
| value         | INTEGER | NOT NULL, CHECK (value >= 0)                 |
| created_at    | TIMESTAMP | DEFAULT NOW()                              |

---

## 🗂️ Submissions Table

Tracks a completed questionnaire session (all answers) given to a patient by a clinician.

| Column          | Type      | Constraints                            |
| --------------- | --------- | -------------------------------------- |
| id              | UUID      | PRIMARY KEY, DEFAULT gen_random_uuid() |
| session_id      | TEXT      | NOT NULL, UNIQUE                       |
| created_at      | TIMESTAMP | DEFAULT NOW()                          |
| clinician_notes | TEXT      | NULLABLE                               |

---

## 🏷️ Domains Table

Defines categories for grouping related questions (e.g., Depression, Anxiety).

| Column | Type   | Constraints      |
| ------ | ------ | ---------------- |
| id     | SERIAL | PRIMARY KEY      |
| name   | TEXT   | NOT NULL, UNIQUE |

---

## ❓ Questions Table

Represents each individual question presented in a screening.

| Column      | Type    | Constraints            |
| ----------- | ------- | ---------------------- |
| question_id | TEXT    | PRIMARY KEY            |
| title       | TEXT    | NOT NULL               |
| domain_id   | INTEGER | REFERENCES domains(id) |

You can access the PostgreSQL tables (in pgsql shell mode) via Docker by running:

```bash
docker exec -it screener_db psql -U user -d screener
```

Then, you should see:

```bash
screener=#
```

After which you can run an example query like so:

```sql
SELECT * FROM questions;
```

You should then see:

```
screener=# SELECT * FROM questions;
| question_id | title                                                                         | domain_id |
| ----------- | ----------------------------------------------------------------------------- | --------- |
| question_a  | Little interest or pleasure in doing things?                                  | 1         |
| question_b  | Feeling down, depressed, or hopeless?                                         | 1         |
| question_c  | Sleeping less than usual, but still have a lot of energy?                     | 2         |
| question_d  | Starting lots more projects than usual or doing more risky things than usual? | 2         |
| question_e  | Feeling nervous, anxious, frightened, worried, or on edge?                    | 3         |
| question_f  | Feeling panic or being frightened?                                            | 3         |
| question_g  | Avoiding situations that make you feel anxious?                               | 3         |
| question_h  | Drinking at least 4 drinks of any kind of alcohol in a single day?            | 4         |
(8 rows)
```

Alternatively, if you don't wish to be in pgsql shell mode, you can run (as an example):

```bash
docker exec -it screener_db psql -U user -d screener -c 'SELECT * FROM questions'
```
