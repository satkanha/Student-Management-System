# Deployment preparation — actual results

Date: 2026-11-18 (Asia/Phnom_Penh). Source changes are prepared locally. No hosting creation or source push is included in this result.

| Test | Environment | Actual result | Status |
| --- | --- | --- | --- |
| Existing CRUD/search and API errors | Local actual MySQL | Existing integration checks passed using temporary records | Pass |
| Production startup configuration | Unit tests | Missing admin secret/origin rejected; wildcard, HTTP, and path-valued origins rejected | Pass |
| Hosted DB TLS options | Unit tests | CA parsing, certificate/hostname verification, minimum TLS version, and refusal of missing/insecure production settings verified | Pass |
| CORS/auth/throttle | Local HTTP listeners | Allowed preflight 204, blocked origin 403, anonymous data 401, correct credentials 200, repeated failures 429 | Pass |
| Pages artifact | Local build | HTTPS endpoint generated; relative assets preserved; no backend/environment files published | Pass |
| Existing capstone regression | Isolated MySQL + Chrome | All 49 cases passed; application data unchanged | Pass |
| Pages project path and cross-origin browser | Local separate HTTP origins | Assets under repository subpath loaded; actual CORS preflight, sign-in failure/success/cancellation and protected reads passed | Pass |
| Browser credential persistence | Chrome | No localStorage or sessionStorage credentials; no browser runtime errors | Pass |
| Render service deployment | Hosted | Account not connected; no actual service URL verified | Not Run |
| Hosted MySQL TLS handshake | Hosted | No hosted provider/endpoint/CA credentials available | Not Run |
| Hosted Navicat TLS and access restriction | Hosted GUI | Provider setup and GUI action required | Not Run |
| GitHub Pages deployment | GitHub | Workflow prepared; repository Pages settings and workflow dispatch pending | Not Run |
| Hosted CRUD/search and final website | HTTPS deployment | Prepared smoke script; real URLs and admin credentials not available | Not Run |

Commands executed:

```sh
SMS_INTEGRATION=1 npm test --prefix backend
SMS_QA=1 QA_PLAYWRIGHT_MODULE=/tmp/sms-qa-tools/node_modules/playwright-core/index.mjs node backend/scripts/qa-capstone.js
QA_PLAYWRIGHT_MODULE=/tmp/sms-qa-tools/node_modules/playwright-core/index.mjs node backend/scripts/qa-deployment-browser.js
```

The main test run contained **28 passed, 0 failed, 0 skipped** (including the parent integration test); the independent capstone suite contained **49 Pass, 0 Fail, 0 Not Run**. These counts describe local verification, not production success. The local browser simulation uses HTTP loopback ports; it does not prove hosted HTTPS or a hosted TLS database connection.

Initial unprivileged tests could not bind loopback listeners because the execution sandbox denied it. They were rerun with permission and passed. Actual deployment must follow [deployment.md](deployment.md) and record real URLs/results only after execution.
