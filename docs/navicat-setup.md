# MySQL and Navicat setup

Navicat is the administration client; Node connects directly to MySQL Server using mysql2/promise. No Workbench installation is needed.

## Verified local connection settings

Checked on 2026-11-18 on this Mac. MySQL Server 9.5.0 is installed and listening on 127.0.0.1:3306. Both the configured localhost backend connection and an explicit TCP connection to 127.0.0.1 passed SELECT 1 and all required-table checks.

| Navicat field | Current setting |
| --- | --- |
| Connection type | MySQL |
| Connection name | Campus local (any label is fine) |
| Host name / IP | 127.0.0.1 |
| Port | 3306 |
| User name | root |
| Password | Leave blank for the current local configuration; DB_PASSWORD is not configured |
| Database / schema | student_management (select after connecting) |
| SSH tunnel | Disabled for this direct local connection |

If you configure a MySQL password later, enter it privately in Navicat and the project-root .env DB_PASSWORD, then restart Node. Do not share it or commit .env. Navicat's Test Connection and table-grid actions still require you to execute them in the GUI; TCP connectivity has been verified programmatically.

The current .env already works and does not need replacing. For a fresh checkout, copy .env.example only if .env does not exist, then set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME to match your local MySQL connection. PORT controls the website (3000), not MySQL (3306). dotenv loads the root .env independently of the terminal working directory.

## Connect and inspect

1. Open Navicat and choose Connection → MySQL (or New Connection → MySQL, depending on version).
2. Name the connection `Campus local`. Use host `127.0.0.1`, port `3306`, and the local MySQL account. Enter your own local MySQL username and password. Keep those values in your local .env file only.
3. Click Test Connection, then save/open the connection. If connection testing fails, confirm MySQL Server is running and that the host/port/account match. Navicat itself does not start a database server automatically.
4. Refresh the connection. Double-click `student_management` to open it. The repair already created it, so importing again is unnecessary.
5. On a fresh computer, use the connection/database context menu's Execute SQL File action to select the project's `schema.sql`. Alternatively open it in a new query editor and run the complete file, including CREATE DATABASE and USE. This creates missing tables and adds sample records without dropping existing tables or replacing user rows.
6. Refresh Tables; confirm `students`, `courses`, and `enrollments` appear.
7. Open each table's Design Table view. Check the primary key on id; indexes on student_code/email/course_code and the enrollment pair; and the two enrollment foreign keys with RESTRICT deletion. Names of these tabs vary by Navicat version.
8. Open students to view records. Add a student in the website, then refresh the Navicat table to see it stored. Navicat's grid may require Refresh to show changes from Node.
9. Open `docs/verify-database.sql` in a query editor and run it for connection, tables, counts, constraints, and sample student verification.

## Match backend configuration

The project-root `.env` must use the same MySQL host, port, user, password, and database as the working Navicat connection. Never paste passwords into chat. The repair created a local ignored `.env` with the confirmed development defaults; `.env.example` remains a placeholder file.

```sh
npm run db:check --prefix backend
npm start --prefix backend
```

Open http://localhost:3000/index.html. Restart Node after editing `.env`.

If MySQL is unavailable on this Mac:

```sh
brew install mysql
brew services start mysql
```

If the server is already installed, only the second command is needed. Do not start a second server on port 3306.

## Existing older schema

`CREATE TABLE IF NOT EXISTS` deliberately does not change existing tables. For the original generated schema, export a backup using Navicat before running `migrations/001-align-capstone.sql`. It preflights shrinking field lengths and the removed `Prefer not to say` gender value. Incompatible data causes an explicit stop rather than truncation or automatic rewriting. Review those values locally and choose how to resolve them; do not erase records to make the migration pass. The script is intended for the original generated schema, not arbitrary third-party structures.

MySQL DDL commits implicitly, so keep the backup even when preflight passes. On an interrupted run, inspect SHOW CREATE TABLE before resuming. If a failed CALL leaves the helper procedure, remove only `sms_align_capstone_v1` via Navicat's procedure view before rerunning the complete script. No application tables need to be dropped.

## Verified repair state

The initial schema seeds 3 students, 3 courses, and 2 enrollments. Your live database may contain additional records. The separate `sms_repair_qa_20261118` schema was created solely for migration/empty-state checks and left empty. No application records were deleted during QA. Navicat GUI connection and grid interaction remain manual acceptance tasks; MySQL queries verified the database is available for a compatible client.

## Latest actual-database verification

The 2026-11-18 verification ran `SMS_INTEGRATION=1 npm test --prefix backend` against the configured local student_management database: **24 tests passed, 0 failed, 0 skipped**. Coverage includes create/read/update/delete and keyword searches for Students, Courses, and Enrollments, plus validation, duplicate conflicts, invalid references, protected parent deletion, dashboard response, and HTTP status codes.

Tests created temporary records and removed only those records. Fingerprints of all student/course/enrollment records matched before and after testing; final counts remain **4 students, 4 courses, 3 enrollments**. Auto-increment counters may advance during successful or rejected insert tests. No existing records were overwritten or deleted. The existing schema/model/pool/prepared-statement configuration was correct, so no backend code changes or live schema import were needed. No new GitHub repository, commit, or push was performed for this verification.

For the existing database, do not re-import just to connect Navicat. If importing on a fresh installation, execute the entire schema.sql via Execute SQL File, refresh the connection, and open student_management → Tables. Re-importing preserves existing rows but can add missing sample rows/enrollments; CREATE TABLE IF NOT EXISTS does not migrate incompatible existing tables.

## Hosted deployment

The settings above refer to your Mac only. For remote hosted MySQL, use the provider hostname/port, a dedicated restricted user, verified TLS with its CA, and IP restrictions/private tunneling. Follow [the hosted Navicat and deployment guide](deployment.md). Do not reuse localhost:3306 as the Render database address, and do not publish database credentials.
