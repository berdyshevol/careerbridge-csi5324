# CareerBridge — Setup / Installation Guide

> Part of the CareerBridge specification — see the [index](README.md).

## 11. Setup / Installation Guide

How to run CareerBridge on your own computer. The default setup needs no database server, no
accounts and no configuration: the backend starts on an in-memory database loaded with sample data.

The running system is also online, nothing to install: <https://careerbridge-csi5324.vercel.app>.

### 11.1 Required tools

| Tool | Version | Used for |
| --- | --- | --- |
| Java JDK | 17 | The backend. Maven comes with the project (`./mvnw`); it need not be installed. |
| Node.js with npm | 22 | The frontend. |
| Git | any | Getting the code (not needed when you start from the zip). |
| Docker | optional | The backend tests run on PostgreSQL in Docker when it is running, on the in-memory database otherwise. |

Ports 8080 (backend) and 3000 (frontend) must be free.

### 11.2 Step-by-step

1. **Get the code.** Unzip the implementation package, or clone the repository:

   ```bash
   git clone https://github.com/berdyshevol/careerbridge-csi5324.git
   cd careerbridge-csi5324
   ```

2. **Start the backend** in a first terminal. The first start downloads the libraries and takes a
   few minutes.

   ```bash
   cd app/backend
   ./mvnw spring-boot:run
   ```

   It is ready when <http://localhost:8080/api/postings> shows a list of postings.

3. **Start the frontend** in a second terminal.

   ```bash
   cd app/frontend
   npm install
   npm run dev
   ```

4. **Open** <http://localhost:3000> and log in with a demo account. Every demo account uses the
   password `Baylor@2026`:

   | Role | Email |
   | --- | --- |
   | Administrator | `admin@careerbridge.example` |
   | Recruiter | `riley.chen@example.com`, `recruiter1@example.com` to `recruiter6@example.com` |
   | Applicant with three applications | `jordan.lee@example.com` |
   | Applicant with none | `sam.rivera@example.com`, `applicant1@example.com` to `applicant3@example.com` |

   You can also register a new applicant on the site. The User Manual (§12) explains what each role
   can do.

### 11.3 Environment configuration

None is needed for the steps above. Every setting has a default, and the in-memory database starts
empty and is filled with the sample organizations, postings, applications and demo accounts on every
start; what you change is gone when the backend stops.

To keep data, the backend can use a PostgreSQL database instead. Copy `app/backend/.env.example` to
`app/backend/.env` and fill in:

| Setting | Meaning |
| --- | --- |
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | The PostgreSQL database, as a JDBC URL (the team uses Neon). |
| `JWT_SECRET` | At least 32 characters; signs the log-in sessions. Without it a restart logs everybody out. |
| `DEMO_APPLICANT_PASSWORD`, `DEMO_RECRUITER_PASSWORD`, `DEMO_ADMINISTRATOR_PASSWORD` | The password of that role's demo accounts; empty means no demo accounts of that role. |

The frontend finds the backend at `http://localhost:8080`; set `NEXT_PUBLIC_API_URL` to use another
address.

### 11.4 Running the tests

| Tests | Command |
| --- | --- |
| Backend (JUnit) | `cd app/backend && ./mvnw test` |
| Frontend (Vitest) | `cd app/frontend && npm test` |
| End to end and acceptance scenarios (Playwright, Gherkin) | `cd app/frontend && npx playwright install chromium` once, then `npm run test:e2e` |

The end-to-end run starts its own backend and frontend on a fresh database, so stop the ones from
§11.2 first.

### 11.5 Deployment

The online system runs the frontend on Vercel and the backend on Render, with its database on Neon.
A deploy is started by hand from GitHub (Actions → Deploy → Run workflow on `main`); it runs every
test first. The settings and secrets are described in
[app/README.md](https://github.com/berdyshevol/careerbridge-csi5324/blob/main/app/README.md).

### 11.6 If something goes wrong

- **The online site waits about a minute on the first page:** the free backend sleeps after
  15 minutes without requests and is waking up.
- **"Port 8080 was already in use" when the backend starts:** another backend is running; stop it first.
- **A demo account is refused right after the backend starts:** wait until the start has finished.
  Five failed log-ins within 15 minutes lock an account for 15 minutes.
