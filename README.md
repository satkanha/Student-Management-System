# Student Management System

A full-stack capstone for a school administrator to manage students, courses, and enrollments. Built with Node.js, Express, MySQL, HTML5, CSS3, and vanilla JavaScript. No ORM or frontend framework.

## Features

- Blue and white responsive dashboard with totals and five recently added students.
- Student CRUD, details, and name/code/email search.
- Course CRUD and code/name/description search.
- Enrollment CRUD, joined student/course details, and search.
- Unique codes/email/enrollments, foreign key protection, server/client validation.
- Fetch-based forms and tables, loading indicators, notifications, and delete confirmation.
- Model–Route–Controller architecture, prepared statements, pooled connections, consistent errors.

## Requirements

- Node.js 22 or newer with npm (Node 24 LTS recommended).
- MySQL 8.0.16+ or newer (CHECK constraints must be enforced).
- A modern browser. No frontend build step required.

These tools were found in the development environment: Node 26.3.0, npm 11.16.0, MySQL 9.5.0. During the latest repair, MySQL was running on port 3306 but student_management was missing. It has now been created non-destructively; the dashboard returns HTTP 200. See [Navicat setup](docs/navicat-setup.md).

### Installing missing tools

macOS with Homebrew:

```sh
brew install node@24 mysql
brew services start mysql
```

If Node is not on PATH after installing the versioned formula, follow Homebrew's printed PATH instructions. Alternatively install Node's LTS package from https://nodejs.org/ .

Ubuntu/Debian:

```sh
sudo apt update
sudo apt install mysql-server
sudo systemctl enable --now mysql
```

Install a supported Node LTS release using the installer/instructions at https://nodejs.org/en/download; distro packages may be older than Node 22.

Windows: install Node LTS from https://nodejs.org/ and MySQL Community Server from https://dev.mysql.com/downloads/mysql/ . Select the MySQL server/service during installation; retain the root password. Add the MySQL `bin` folder to PATH or run its client from that folder.

Verify:

```sh
node --version
npm --version
mysql --version
```

## Local setup

Run all commands from the project root unless specified otherwise.

```sh
npm install --prefix backend
cp -n .env.example .env
mysql -u root -p < schema.sql
```

On Windows PowerShell, use `Copy-Item .env.example .env` and import through the MySQL client:

```sh
mysql -u root -p
```

Then at the MySQL prompt:

```sql
SOURCE /absolute/path/to/Student Management System/schema.sql;
```

Edit `.env` with your local credentials. Do not commit it. For shared installations, create a dedicated account rather than using root:

```sql
CREATE USER 'sms_app'@'localhost' IDENTIFIED BY 'choose-your-own-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON student_management.* TO 'sms_app'@'localhost';
```

Import the schema as an administrative account, then put the application's account/password in `.env`.

| Variable | Default | Meaning |
| --- | --- | --- |
| PORT | 3000 | Express HTTP port |
| DB_HOST | localhost | MySQL hostname |
| DB_PORT | 3306 | MySQL TCP port |
| DB_USER | root | MySQL account |
| DB_PASSWORD | empty | MySQL password |
| DB_NAME | student_management | Database name |

The pool reads the root `.env` regardless of the launch directory. The schema creates tables and inserts 3 students, 3 courses, and 2 enrollments. Re-import does not drop tables or erase records; duplicate sample records are ignored. It is an initial schema, not a migration tool for incompatible existing tables.

## Run

```sh
npm start --prefix backend
```

For automatic backend restarts while developing:

```sh
npm run dev --prefix backend
```

Open **http://localhost:3000**. Express serves both the frontend and API from one origin. Use the sidebar to visit `/students.html`, `/courses.html`, and `/enrollments.html`. Do not open the HTML files directly using `file://`. Stop the server with Ctrl+C.

## REST API

For each of `students`, `courses`, and `enrollments`:

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | /api/RESOURCE | List all records, newest ID first |
| GET | /api/RESOURCE?q=keyword | Search records |
| GET | /api/RESOURCE/:id | Retrieve one record |
| POST | /api/RESOURCE | Create a record |
| PUT | /api/RESOURCE/:id | Replace editable fields |
| DELETE | /api/RESOURCE/:id | Delete a record |

`GET /api/dashboard` returns `{ students, courses, enrollments, recent }` inside `data`.

Success JSON: `{ "success": true, "data": ... }`. Error JSON: `{ "success": false, "error": "message" }`. DELETE returns 204 with no body. Status codes: 200 retrieval/update, 201 create, 204 delete, 400 invalid input/reference, 404 missing record/endpoint, 409 duplicate or related records, 500 unexpected server/database failure.

Example student request:

```sh
curl -X POST http://localhost:3000/api/students \
  -H 'Content-Type: application/json' \
  -d '{"student_code":"STU-010","first_name":"Ada","last_name":"Lovelace","email":"ada@example.com","status":"Active"}'
```

See [the plan](docs/plan.md) for field contracts and database details.

## Testing

```sh
npm test --prefix backend
```

Runs six validation tests. The older integration suite is skipped unless `SMS_INTEGRATION=1` is set. Run it only with a disposable database selected through DB_NAME and appropriate connection variables.

The submission suite in `backend/scripts/qa-capstone.js` defines **49 numbered cases** spanning database setup/constraints, dashboard counts and empty state, CRUD/search/validation for all modules, HTTP errors, browser workflows, responsiveness, and submission checks. It creates a uniquely named QA database from schema.sql, serves the app on a temporary loopback port, verifies that live application records remain unchanged, and removes only its own QA database. The MySQL QA account needs CREATE/DROP DATABASE permissions. The application account itself does not need those permissions.

Install optional browser tooling outside the project (no change to application dependencies):

```sh
npm install --prefix /tmp/sms-qa-tools playwright-core
SMS_QA=1 \
QA_PLAYWRIGHT_MODULE=/tmp/sms-qa-tools/node_modules/playwright-core/index.mjs \
QA_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run qa --prefix backend
```

Use your installed Chrome executable and a writable temporary tooling directory on other operating systems. `QA_PLAYWRIGHT_MODULE` must point to playwright-core's index.mjs. In PowerShell, set each variable with `$env:NAME="value"` before running `npm run qa --prefix backend`. If browser tooling is unavailable, UI cases are recorded **Not Run**, and the command exits unsuccessfully rather than claiming full acceptance.

The suite saves machine-readable actual results in [docs/qa-results.json](docs/qa-results.json). See [the 49-case QA matrix](docs/qa-test.md) for executed results, scope, and limitations. Screenshot output goes to `/tmp/sms-qa-desktop.png` by default, outside version control. Override QA_SCREENSHOT_PATH if needed.

## Troubleshooting

- **ECONNREFUSED / cannot connect:** start MySQL; check host and port. The server may still serve HTML while API calls report a database error.
- **Access denied:** check DB_USER/DB_PASSWORD and MySQL account grants. A CLI socket login and TCP login can use different account rules.
- **Unknown database/table:** import `schema.sql` and verify DB_NAME.
- **EADDRINUSE:** stop the other HTTP process or change PORT, then use that port in your browser.
- **Duplicate / 409:** use a new code/email, or edit the existing enrollment rather than enrolling the same student twice.
- **Delete conflict / 409:** remove the associated enrollments first. This restriction also applies to Completed/Dropped enrollment records.
- **Empty search:** try a shorter name, student code, email, or course name. Search uses literal substring matching, including `%` and `_` as literal characters.
- **npm network error:** confirm internet/proxy access to registry.npmjs.org and run the install command again.
- **MySQL initialization crash in a restricted executor:** use a normally launched local MySQL service. The development test instance required permission to run outside the executor sandbox.

## Structure

```text
.
├── backend/
│   ├── config/db.js
│   ├── models/{baseModel,studentModel,courseModel,enrollmentModel}.js
│   ├── controllers/{baseController,studentController,courseController,enrollmentController}.js
│   ├── routes/{studentRoutes,courseRoutes,enrollmentRoutes}.js
│   ├── middleware/{errors,validation}.js
│   ├── tests/{validation.test,api.integration.test}.js
│   ├── app.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   ├── students.html
│   ├── courses.html
│   ├── enrollments.html
│   ├── css/style.css
│   └── js/{api,dashboard,management,students,courses,enrollments}.js
├── docs/{plan,qa-test}.md
├── schema.sql
├── .env.example
├── .gitignore
└── README.md
```

The open workspace is already the project root; no extra enclosing directory is needed. Shared model/controller/UI helpers avoid repeating CRUD logic while retaining each module's required MRC files.

## Submission and scope

Include the source, schema, docs, example environment file, and package lock. Exclude `.env` and `node_modules`. No GitHub publication has been performed. This capstone has no authentication/authorization and should run locally or in a trusted classroom environment; public multi-user deployment would require that additional scope.

## Navicat and repaired local setup

See [step-by-step Navicat instructions](docs/navicat-setup.md), [verification SQL](docs/verify-database.sql), and the [guarded legacy migration](migrations/001-align-capstone.sql). Use `npm run db:check --prefix backend` to verify SELECT 1 and all three tables without printing credentials. Keep your existing `.env`; do not overwrite local credentials when copying the example.

For this repaired machine, MySQL is available on port 3306 and the root `.env` has been created. Run `npm start --prefix backend` if the server is not already running. The local environment intentionally remains ignored.

## GitHub submission

The existing repository is https://github.com/satkanha/Student-Management-System.git . The local branch is main, and origin points to that repository. No second GitHub repository was created.

Before submission:

```sh
git status --short
git remote -v
git check-ignore .env backend/node_modules/express/package.json
git ls-files .env '*/node_modules/*'
```

The final command should return no files. `.env`, environment variants, credentials/key files, logs, dependencies, and test screenshots are ignored. Only `.env.example` with empty DB_PASSWORD belongs in the repository. The schema contains fictional example records, not an export of the live database.

Inspect the local commit and QA report. Push **only after explicit approval**:

```sh
git push -u origin main
```

If HTTPS authentication is required, sign in locally with `gh auth login` or Git's credential helper. Never embed a token in the remote URL, source code, or README. The repository was inspected read-only; no remote publication was performed during preparation.
