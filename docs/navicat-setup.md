# MySQL and Navicat setup

Navicat is the administration client; Node connects directly to MySQL Server using mysql2/promise. No Workbench installation is needed.

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
