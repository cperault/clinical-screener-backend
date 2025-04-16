# Clinical Screener (Backend)

URL: https://clinical-screener-frontend.netlify.app

### Clinical Screener Backend

The backend for serving diagnostic screeners to patients. Built with:

- Node.js
- Express
- TypeScript
- PostgreSQL
- Docker
- Jest
- Heroku for deployment

### Project Structure

```
.
├── Procfile
├── README.md
├── data
│   ├── domainMap.json
│   ├── questions.json
│   └── screener.json
├── db
│   └── seed.ts
├── docker-compose.yml
├── jest.config.js
├── logs
│   ├── combined.log
│   └── error.log
├── package-lock.json
├── package.json
├── src
│   ├── app.ts
│   ├── config.ts
│   ├── controller
│   │   ├── AnswerController.ts
│   │   ├── QuestionController.ts
│   │   ├── ScreenerController.ts
│   │   └── __tests__
│   │       └── AnswerController.test.ts
│   ├── db.ts
│   ├── middleware
│   │   ├── __tests__
│   │   ├── errorHandler.ts
│   │   └── logging.ts
│   ├── route
│   │   ├── BaseRouter.ts
│   │   ├── answers
│   │   │   └── AnswerRouter.ts
│   │   ├── api
│   │   │   └── ApiRouter.ts
│   │   ├── questions
│   │   │   └── QuestionsRouter.ts
│   │   └── screener
│   │       └── ScreenerRouter.ts
│   ├── server.ts
│   ├── service
│   │   ├── AnswerService.ts
│   │   ├── QuestionService.ts
│   │   ├── ScoringService.ts
│   │   ├── ScreenerService.ts
│   │   └── __tests__
│   │       ├── AnswerService.test.ts
│   │       ├── QuestionService.test.ts
│   │       ├── ScoringService.test.ts
│   │       └── ScreenerService.test.ts
│   └── utils
│       ├── logger.ts
│       └── testLogger.ts
├── tsconfig.json
└── tsconfig.seed.json
```

### Running Locally

## Backend

1. Navigate to the root of the `clinical-screener-backend` directory

2. Install dependencies:

```bash
npm install
```

3. Start up a Docker container for PostgreSQL based on our `docker-compose.yml` config:

```bash
docker compose up -d
```

4. Run the database seed script:

```bash
npm run seed
```

5. Start the backend server:

```bash
npm run dev
```

The backend server will be running on `http://localhost:3001` which you should see as per below:

```
> clinical-screener-backend@1.0.0 dev
> nodemon src/server.ts

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts,json
[nodemon] starting `ts-node src/server.ts`
info: Initializing database connection... {"timestamp":"2025-04-15 21:07:22"}
info: Server is running on http://localhost:3001 {"timestamp":"2025-04-15 21:07:22"}
[nodemon] clean exit - waiting for changes before restart
```

### Verifying Database Updates Locally

For this project, we have a Docker container called `screener_db` with a PostgreSQL database called `screener` in which the following tables are defined:

- `answers`
- `submissions`
- `domains`
- `questions`

---

## 🧠 Answers Table

Stores a single numeric response to a given question in a particular submission session.

| Column        | Type      | Constraints                                  |
| ------------- | --------- | -------------------------------------------- |
| id            | SERIAL    | PRIMARY KEY                                  |
| submission_id | UUID      | REFERENCES submissions(id) ON DELETE CASCADE |
| question_id   | TEXT      | REFERENCES questions(question_id)            |
| value         | INTEGER   | NOT NULL, CHECK (value >= 0)                 |
| created_at    | TIMESTAMP | DEFAULT NOW()                                |

---

## 🗂️ Submissions Table

Tracks a completed questionnaire session (all answers) given to a patient by a clinician.

| Column          | Type      | Constraints                            |
| --------------- | --------- | -------------------------------------- |
| id              | UUID      | PRIMARY KEY, DEFAULT gen_random_uuid() |
| session_id      | TEXT      | NOT NULL, UNIQUE                       |
| created_at      | TIMESTAMP | DEFAULT NOW()                          |

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

## Problem

Mental health providers would like a way to have their patients take a preliminary diagnostic screener to help narrow down additional potential assessments for their consultations. It needs to be pleasant and intuitive to use while keeping their privacy in mind. The diagnostic screener will ask a series of questions. Once completed, their answers are scored to identify additional assessments for which they will consult their provider.

This backend implementation provides:
1. A RESTful API endpoint that accepts patient answers in the required JSON format
2. Scoring logic that evaluates answers across different domains (Depression, Mania, Anxiety, Substance Use)
3. Persistence of answers and submissions for future reference
4. Privacy-focused design that decouples patient identifiers from answers
5. Comprehensive error handling and request tracing

The scoring system follows these criteria:
| Domain        | Total Score | Level-2 Assessment |
|---------------|-------------|--------------------|
| Depression    | >= 2        | PHQ-9             |
| Mania         | >= 2        | ASRM              |
| Anxiety       | >= 2        | PHQ-9             |
| Substance Use | >= 1        | ASSIST            |

## Technical Considerations

I chose this stack for the backend out of familiarity so that I could build a solid solution quickly. I didn't want to spend too much time on this given the timeframe constraint; there are so many things you must consider when it comes to application security, monitoring, and performance optimization, notably: caching, emitting logs to a service like Splunk (which I've used extensively in previous roles for application flow tracing) as well as log rotation, authentication and authorization (trade offs I considered would include having a patient sign in to a dedicated provider portal so that we can leverage RBAC and/or securing the endpoints behind an authorized session or have them receive a magic link with expiration (TTL)).

The requirements said to store answers in the same format as Part 1, which I do, but I went further and added some additional properties like `created_at` and `submission_id`. While we store each answer, each completed diagnostic screener is stored as a `submission`, representing a full session of completed answers. Individual responses to each question are stored in the `answers` table, linked to their corresponding submission. This separation allows for:

- clear tracking of when and by whom a screener was completed
- flexible analysis of individual answers across submissions
- normalized data that scales well for querying and reporting

...but it also supports anonymity and privacy by decoupling answers from identifiable user data. If the provider were to want to get all submissions for a particular patient, we could later on come up with a way for them to assign pseudonyms or unique identifiers (such as, by way of generated URL/magic link) that only they have access or full knowledge to. For now, it's a unique value that generates on each page reload.

### Security & Request Tracing

#### Security Measures

The application implements several security measures to protect patient data:

1. Rate Limiting:

   - Limits to 100 requests per IP per 15 minutes
   - Protects against brute force attacks and DoS attempts

2. Security Headers (via Helmet):

   - Protects against common web vulnerabilities
   - Includes XSS protection, content security policy, and other security headers

3. CORS Configuration:

   - Restricts which domains can access the API
   - Only allows necessary headers and methods

4. Data Security:
   - UUID-based session IDs for patient data
   - Sanitized logging (no sensitive patient data in logs)

#### Request Tracing

The application implements correlation IDs for request tracing:

- Enables end-to-end request tracing across frontend and backend
- Makes debugging easier by linking all logs from a single request together
- Particularly valuable when investigating issues in production, as you can trace a patient's entire session through the system

### Production Deployment Considerations

#### High Availability & Performance
- Horizontal scaling using container orchestration (e.g., Kubernetes)
- Load balancing across multiple instances
- Database replication for redundancy
- Caching layer (e.g., Redis) for frequently accessed data
- CDN for static assets
- Database connection pooling for optimal performance

#### Monitoring & Troubleshooting
- Structured logging with correlation IDs (implemented)
- APM tools for performance monitoring
- Error tracking service integration
- Health check endpoints
- Metrics collection for:
  - Response times
  - Error rates
  - Database query performance
  - Resource utilization

#### Future Enhancements
Given additional time, I would consider:
1. Implementing user authentication and authorization
2. Adding magic link functionality for secure patient access
3. Enhanced caching strategies
4. Automated deployment pipeline with staging environment
5. More comprehensive test coverage
6. Real-time notifications for critical errors
