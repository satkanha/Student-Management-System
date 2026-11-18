# Deployment: GitHub Pages + Render + hosted MySQL

## Current status and URLs

Prepared locally, **not deployed**. Nothing in this change has been pushed. The existing repository remains https://github.com/satkanha/Student-Management-System .

| Component | URL / state |
| --- | --- |
| Local application | http://localhost:3000 — existing local development server |
| GitHub Pages | https://satkanha.github.io/Student-Management-System/ — expected address after successful workflow; not verified live |
| Render backend | Not provisioned/verified; record actual service HTTPS URL here after deployment |
| Hosted database | Provider, hostname, port, and verified connection pending; never publish credentials |

Required access: permission to configure the existing repository's Pages/Actions settings; a connected Render account; and a hosted MySQL service supporting verified TLS and network access restrictions. GitHub CLI is not currently signed in, and no Render account connection or hosted database credentials have been confirmed. Keep passwords in provider dashboards or ignored local environment files, not chat or source control.

## Architecture

Browser → GitHub Pages static HTML/CSS/JS → HTTPS fetch with administrator Authorization header → Render Express MRC API → verified TLS connection → hosted MySQL. Navicat separately connects to MySQL using verified TLS or a provider-approved private tunnel. It is never between Node and MySQL.

The Pages artifact contains only frontend files. Database credentials and the administrator password remain exclusively on Render. Production refuses to start without a strong administrator password, an explicit frontend origin, required database variables, and DB_SSL=true. Authentication applies to all data endpoints; /api/health remains public and reveals only readiness.

## 1. Provision hosted MySQL securely

Use your chosen managed MySQL provider/account. Do not forward your Mac's port 3306 or expose a home database to the internet.

1. Provision a MySQL service and a database named `student_management` using the provider's administrative interface.
2. Obtain the provider DNS hostname, actual port, credentials, and CA certificate where required. A localhost address on Render points to the Render instance, not your Mac.
3. Create a dedicated runtime database user with SELECT/INSERT/UPDATE/DELETE on this schema. Use a separate administrative account for importing tables/migrations.
4. Enable provider network restrictions. Allow the Render service's outbound IP ranges and, for Navicat, only your Mac's current public IP. Prefer private networking or a provider-supported SSH/VPN tunnel when available. Do not use an unrestricted 0.0.0.0/0 rule. Render's shared outbound ranges are not identity; TLS plus individual DB credentials are still required.
5. Download the provider's CA if it is not already trusted by Node. Never disable certificate or hostname verification to work around a failure.
6. Connect with Navicat as described below and import the schema once. Schema import is not an automatic Render startup action.

Some providers assign a fixed database name and prohibit CREATE DATABASE. Prefer one that permits student_management. If your provider forces another name, execute only the table/seed section in the selected provider database using the query editor, omit CREATE DATABASE/USE, and set DB_NAME to the actual assigned name. Do not change local application data to make hosting work.

The schema is non-destructive: CREATE TABLE IF NOT EXISTS preserves existing tables and INSERT IGNORE does not replace rows. Reimport can add missing fictional samples/enrollments. For existing live data, back up first and review migrations instead of assuming IF NOT EXISTS upgrades tables. Real student records should not be copied into a public capstone demo; use fictional data.

## 2. Navicat hosted connection and import

1. New Connection → MySQL. Name it `Campus hosted`.
2. Host: provider's exact DNS hostname. Port: provider's MySQL port (not the Render website port). User/password: provider account entered privately. Do not use the local Mac's root account for the hosted application.
3. In SSL settings enable TLS/SSL, select the provider CA where needed, and enable server-certificate and hostname/identity verification. If your Navicat version cannot verify server identity, use a supported version or the provider's secure tunnel configuration. Client certificate/key fields are needed only if the provider requires mutual TLS.
4. If using a provider-approved private tunnel, configure Navicat's SSH/tunnel tab with that provider's documented settings; never invent a public database endpoint.
5. Test Connection. Open student_management. Use Execute SQL File to import the repository-root schema.sql with the administrative account, then refresh Tables.
6. Run docs/verify-database.sql. Also run `SHOW SESSION STATUS LIKE 'Ssl_cipher';` — a direct TLS connection should have a nonempty cipher value. Confirm the hostname verification setting separately; a cipher alone does not prove server identity was verified.
7. Switch routine app access to the restricted user. Keep the administrative credential separate.

These hosted GUI steps are **Not Run** until the provider/account and access are available.

## 3. Render backend

After approval and push, connect Render to the **existing** GitHub repository. Create a Blueprint from render.yaml, or configure a Web Service with:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Branch | main |
| Root directory | Leave empty (repository root) |
| Build command | npm ci --prefix backend --omit=dev |
| Start command | npm start --prefix backend |
| Node version | 24 |
| Health check | /api/health |
| Auto deploy | Off until configuration/approval is complete |

Render supplies PORT; Express already reads it and listens on the provided port. Do not set it to the database port. The Blueprint uses a free web-service plan; review account availability and service limits before creation. It does not provision or charge for a database automatically. Choose the Render region deliberately before creation, near your hosted database, if you need a different region from the platform default.

Set these environment variables privately in Render:

| Variable | Production value |
| --- | --- |
| NODE_ENV | production |
| FRONTEND_ORIGINS | https://satkanha.github.io |
| DB_HOST | Provider DNS hostname |
| DB_PORT | Provider port |
| DB_USER | Restricted runtime username |
| DB_PASSWORD | Runtime database password — secret |
| DB_NAME | student_management, or provider-assigned schema |
| DB_SSL | true |
| DB_SSL_CA | Provider CA PEM, when needed; real newlines or escaped backslash-n supported |
| DB_SSL_CA_FILE | Alternative: path to uploaded CA secret file, e.g. /etc/secrets/mysql-ca.pem |
| ADMIN_USERNAME | admin, or chosen account name |
| ADMIN_PASSWORD | Unique random secret of at least 16 characters; Blueprint generates one |

Use DB_SSL_CA or DB_SSL_CA_FILE as appropriate. If both are set, the file takes precedence. For a server certificate issued by a trusted public CA, leave both empty; verification remains enabled. Do not set rejectUnauthorized=false. Retrieve the generated ADMIN_PASSWORD privately from Render and store it in your password manager.

FRONTEND_ORIGINS is an exact origin, **not** the Pages project path. Multiple allowed origins may be comma-separated, without trailing slashes. Wildcards are rejected. No DB or administrator secrets belong in frontend configuration.

Deploy manually once the database is reachable and initialized. Confirm logs show the connection/table check, then request the actual `https://<service-host>/api/health`; expect HTTP 200 and status ok. A failed database readiness check returns 503. Data endpoints should return 401 without administrator credentials. Save the actual Render URL in the status table above.

## 4. GitHub Pages

1. Review and approve the prepared local commit before pushing to origin/main.
2. In the existing repository, Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → Variables: create **API_BASE_URL** containing the real Render HTTPS URL ending in `/api`. It is public configuration, not a secret. Example format only: `https://<actual-service>.onrender.com/api`.
4. In Actions, run **Deploy frontend to GitHub Pages** manually. The workflow intentionally uses workflow_dispatch so an approved source push does not accidentally publish an unconfigured site.
5. The build copies only frontend/ into pages-dist/, generates js/config.js using the variable, and uploads that artifact. HTML navigation, CSS, and script paths are relative and work under /Student-Management-System/.
6. Wait for both build and deploy jobs to succeed. Use the URL returned by the deployment job, confirm HTTPS, and update the status table. Do not claim the expected URL is active before this succeeds.
7. Open the site, enter the Render administrator credentials, and check the dashboard. Credentials remain in page-module memory; they are never stored in localStorage/sessionStorage. Navigation/reload requires sign-in again. This is a single-administrator capstone gate, not a multi-user identity system. Wrong sign-ins are throttled per API process/IP.

For future API URL changes update the GitHub variable and rerun the workflow. Updating the variable alone does not modify an existing static artifact. Keep the local frontend default `/api`; it continues to work with Express on localhost:3000.

## 5. Verify after actual deployment

Hosted checks remain **Not Run** until all real URLs/accounts exist. First verify health, unauthenticated 401, TLS, and CORS in the browser. Then use fictional temporary records for Students, Courses, and Enrollments; verify CRUD, all searches, duplicates, invalid references, and protected deletion. Refresh Navicat to confirm writes. Delete only the records created for the demonstration.

An opt-in script is prepared:

```sh
# Set API_BASE_URL, ADMIN_USERNAME, and ADMIN_PASSWORD privately in your environment.
# Do not paste a password into a command that becomes shell history.
SMS_HOSTED_TEST=1 node scripts/smoke-hosted.mjs
```

For example, enter values in a secure environment-management tool or an ignored local environment file and run Node with --env-file pointing to that file. Do not replace your working local .env just to run hosted tests. The script refuses HTTP and requires explicit opt-in, creates uniquely prefixed test records, verifies CRUD/search/status codes, and cleans only its own records. It does not copy production data. Browser checks are still necessary for HTTPS mixed-content/CORS and UI behavior; this script does not prove those.

## 6. Local checks already executed

- Existing MySQL/API plus deployment tests: 28 passed, zero failed/skipped.
- Existing capstone regression suite: 49/49 passed against an isolated database, including actual Chrome CRUD flows.
- Separate-origin browser simulation: Pages project subpath, CORS preflight, sign-in failure/success/cancel, protected API reads, blocked origin, health readiness, and no credential persistence passed.
- TLS options were tested for certificate verification and refusal of insecure production configuration. A real hosted TLS handshake is **Not Run**.
- Hosted service creation, GitHub Pages deployment, hosted CRUD, hosted Navicat connection, and final URL verification are **Not Run**. Local success is not a hosted deployment result.

## Official references

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Render Express deployment](https://render.com/docs/deploy-node-express-app)
- [Render Blueprint fields and secrets](https://render.com/docs/blueprint-spec)
- [Render outbound IP restrictions](https://render.com/docs/outbound-ip-addresses)
- [mysql2 verified SSL configuration](https://sidorares.github.io/node-mysql2/docs/documentation/ssl)
