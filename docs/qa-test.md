# Capstone QA Test Matrix

Executed: **2026-11-18**, Asia/Phnom_Penh. Environment: Node 26.3.0, npm 11.16.0, MySQL 9.5.0, installed Google Chrome driven headlessly by optional playwright-core tooling.

**49 Pass · 0 Fail · 0 Not Run.** Each row below was actually executed by `backend/scripts/qa-capstone.js`. Machine-readable results: [qa-results.json](qa-results.json).

The prior documentation contained 24 initial cases and 10 repair cases, rather than a supplied 49-case instructor checklist. This matrix expands and consolidates those requirements into 49 explicit, reproducible cases. If the instructor has a separate numbered checklist, map it to these IDs before submission.

## Safety and evidence

- Tests created a uniquely named disposable MySQL database using schema.sql and launched a separate Express listener on an ephemeral loopback port.
- No CRUD tests ran against the live student_management database. Its records were fingerprinted before/after and verified unchanged. Only the newly created QA database was removed.
- The existing live database was separately checked: connection and required tables succeed; the live dashboard responds HTTP 200. Counts at inspection were 4 students, 4 courses, 3 enrollments.
- Browser cases used actual Chrome interactions and native fetch. Window markers and navigation-request listeners verified no document reload for CRUD actions.
- The error-handling case QA-39 simulates a pool failure; it does not stop the user's MySQL service. QA-47 aborts browser requests to test network errors and restores them for recovery.
- The first submission-suite run reported 42 passing cases and 7 failures. One real issue was mobile navigation overflow at 375px. Other UI failures followed assertions that ran before asynchronous detail dialogs opened. The layout and test synchronization were corrected; the full suite was rerun and all 49 cases passed.
- Navicat GUI interactions are outside these 49 automated cases and remain a manual demonstration. Database queries and constraints were verified directly through MySQL.

## Executed matrix

| Test ID | Module | Action | Test data | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| QA-01 | Database | Pool connectivity | SELECT 1 | Successful pooled query | All assertions passed | Pass |
| QA-02 | Database | Tables and constraints | information_schema | 3 tables; PK/UK/FK/CHECK; utf8mb4; RESTRICT | All assertions passed | Pass |
| QA-03 | Database | Schema reimport preserves data | Existing QA student + schema.sql | Same row remains; no duplicate seeds | All assertions passed | Pass |
| QA-04 | Dashboard | Seed counts and recent records | Seed database | 200; 3/3/2; newest students | All assertions passed | Pass |
| QA-05 | Dashboard | Empty database | Own disposable QA tables | 200; 0/0/0; recent [] | All assertions passed | Pass |
| QA-06 | Students | Create | Valid unique student | 201 with generated ID | All assertions passed | Pass |
| QA-07 | Students | List | GET /students | 200 including created record | All assertions passed | Pass |
| QA-08 | Students | Details | Created ID | 200 matching fields | All assertions passed | Pass |
| QA-09 | Students | Update and unchanged update | Change phone; repeat PUT | 200 both times, values persist | All assertions passed | Pass |
| QA-10 | Students | Delete | Separate temporary student | 204 empty; subsequent GET 404 | All assertions passed | Pass |
| QA-11 | Students | Required fields | Omit each required field | 400 each time | All assertions passed | Pass |
| QA-12 | Students | Invalid data types and limits | Bad email/date/status/length/arrays | 400; no insertion | All assertions passed | Pass |
| QA-13 | Students | Duplicate email | New code, same email | 409 | All assertions passed | Pass |
| QA-14 | Students | Duplicate code | New email, same code | 409 | All assertions passed | Pass |
| QA-15 | Students | Malformed IDs | abc, zero, negative, overflow | 400 | All assertions passed | Pass |
| QA-16 | Students | Nonexistent record | Missing ID: GET/PUT/DELETE | 404 for each | All assertions passed | Pass |
| QA-17 | Students | Name search | Quality Tester | 200 matching student | All assertions passed | Pass |
| QA-18 | Students | Code and email search | QA-STUDENT, quality@example.com | Matching student for both | All assertions passed | Pass |
| QA-19 | Students | Search no match | NoSuchStudentQA | 200 and [] | All assertions passed | Pass |
| QA-20 | Courses | Create | Valid course | 201 generated ID | All assertions passed | Pass |
| QA-21 | Courses | List and details | Created course ID | 200, matching code/name | All assertions passed | Pass |
| QA-22 | Courses | Update | Credits 4 | 200, persisted credits | All assertions passed | Pass |
| QA-23 | Courses | Delete | Separate temporary course | 204 empty, repeated DELETE 404 | All assertions passed | Pass |
| QA-24 | Courses | Input validation | Missing code/name; invalid credits/type | 400 for all | All assertions passed | Pass |
| QA-25 | Courses | Duplicates and invalid/missing IDs | Existing code; abc; missing unsigned ID | 409 / 400 / 404 | All assertions passed | Pass |
| QA-26 | Courses | Keyword search | Name, code, description, no match | Correct matches; 200 [] when absent | All assertions passed | Pass |
| QA-27 | Enrollments | Create | Valid student/course pair | 201 joined record | All assertions passed | Pass |
| QA-28 | Enrollments | List and details | Created enrollment | 200 with joined names and IDs | All assertions passed | Pass |
| QA-29 | Enrollments | Update status and course reference | Completed; alternate course | 200; both fields changed | All assertions passed | Pass |
| QA-30 | Enrollments | Delete | Separate pair | 204 empty; detail 404 | All assertions passed | Pass |
| QA-31 | Enrollments | Duplicate pair | Same student/course | 409 | All assertions passed | Pass |
| QA-32 | Enrollments | Missing student reference | student_id 4294967295 | 400 | All assertions passed | Pass |
| QA-33 | Enrollments | Missing course reference | course_id 4294967295 | 400 | All assertions passed | Pass |
| QA-34 | Enrollments | Invalid body and IDs | Missing fields, array IDs, status, missing record | 400 invalid / 404 missing | All assertions passed | Pass |
| QA-35 | Relationships | Restrict parent deletion | Enrolled student/course | 409 both; records preserved | All assertions passed | Pass |
| QA-36 | Enrollments | Keyword search | Student name/code; course name/code; absent | Matches and 200 [] | All assertions passed | Pass |
| QA-37 | API | Malformed JSON / query / route | Broken JSON, repeated q, >200 chars, unknown route | Consistent 400/404 JSON | All assertions passed | Pass |
| QA-38 | SQL | Literal wildcard and injection search | %, _, !, backslash, SQL-looking text | Literal safe search, no unintended rows | All assertions passed | Pass |
| QA-39 | API | Safe 500 response | Simulated database failure | Generic JSON; no credential details | All assertions passed | Pass |
| QA-40 | Frontend | Dashboard and navigation | All four pages | Visible totals, recent records, active nav | All assertions passed | Pass |
| QA-41 | Frontend | Student create/view/edit/search | UI-STUDENT with optional null fields | Bound edit fields; persisted change; filtered row | All assertions passed | Pass |
| QA-42 | Frontend | Student browser validation / duplicate feedback | Missing required fields, malformed email, duplicate email | Native validity blocks invalid; API 409 displayed | All assertions passed | Pass |
| QA-43 | Frontend | Student cancel / confirm delete | Separate UI deletion record | Cancel preserves; confirm removes without reload | All assertions passed | Pass |
| QA-44 | Frontend | Course CRUD/search and safe detail rendering | UI-COURSE; HTML-looking description | Create/view/edit/delete; escaped text; no reload | All assertions passed | Pass |
| QA-45 | Frontend | Enrollment CRUD/search / duplicate / relationship errors | UI student/course pair | Joined names; edits bind; 409 feedback; delete | All assertions passed | Pass |
| QA-46 | Frontend | CRUD updates without document reload | Instrumented student/course/enrollment actions | Same window marker and zero navigation requests | All assertions passed | Pass |
| QA-47 | Frontend | Loading / empty / network error / recovery | Delayed and aborted fetch, no matches | Visible loading/empty/error; Refresh recovers | All assertions passed | Pass |
| QA-48 | Frontend | Responsive layout / keyboard dialogs | 375 / 768 / 1440px widths; Escape and Tab | No document overflow, visible navigation, trapped focus | All assertions passed | Pass |
| QA-49 | Submission | Structure / asset delivery / secrets / data preservation | Required docs, source, ignore rules, live data | Files present; assets 200; secrets ignored; live data unchanged | All assertions passed | Pass |

## Reproduce

1. Configure a local `.env` and verify `npm run db:check --prefix backend`. The QA account needs permission to create/remove a disposable database. Runtime application credentials need only CRUD permissions.
2. Run `npm test --prefix backend` for the six validation tests; the older integration suite is opt-in.
3. Install optional browser tooling outside the project and run:

```sh
npm install --prefix /tmp/sms-qa-tools playwright-core
SMS_QA=1 \
QA_PLAYWRIGHT_MODULE=/tmp/sms-qa-tools/node_modules/playwright-core/index.mjs \
QA_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run qa --prefix backend
```

Use the path to your own Chrome installation on other operating systems. Browser unavailability produces Not Run results and a nonzero exit; it never produces a false Pass. The JSON report is regenerated by the suite. This Markdown matrix describes the recorded run; update it after future runs.

4. Review `docs/qa-results.json` and confirm 49 cases. The desktop screenshot is written to `/tmp/sms-qa-desktop.png` by default and is not committed.
5. For a classroom demonstration, open Navicat and refresh the student_management tables, then perform a visible student/course/enrollment workflow in the browser. See [Navicat instructions](navicat-setup.md).

## Submission checklist

- [x] Existing Node/Express MRC implementation preserved.
- [x] mysql2/promise pool, prepared inputs, keys, uniqueness, and RESTRICT relationships verified.
- [x] Student, course, and enrollment CRUD/details/keyword search tested.
- [x] Vanilla frontend, native fetch, preventDefault, and dynamic DOM integration verified.
- [x] Dashboard counts, recent students, empty/loading/error states verified.
- [x] Mobile/tablet/desktop layouts and keyboard dialog behavior tested.
- [x] Plan, schema, migration, environment example, setup guide, and actual QA results included.
- [x] Existing GitHub repository selected as origin; no second remote repository created.
- [x] Submission files prepared for a local commit; final commit ID and clean-tree verification are recorded in the handoff.
- [ ] User approves pushing the reviewed local commit.
- [ ] Push to the existing repository after approval, then confirm files on GitHub.
- [ ] Complete the Navicat/classroom demonstration and instructor-specific submission materials.

## Deployment preparation

The 49-case suite was rerun after adding the configurable frontend API URL, production admin gate, exact CORS allowlist, verified database TLS options, and health endpoint: all 49 cases passed locally. New deployment/security checks and hosted Not Run items are reported separately in [deployment-test.md](deployment-test.md). No local result is presented as a completed Render/Pages deployment.
