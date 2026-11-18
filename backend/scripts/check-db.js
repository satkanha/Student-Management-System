import { pool, checkDatabase } from '../config/db.js';
const hints = {
 ER_BAD_DB_ERROR: 'Import schema.sql using Navicat or the MySQL client.',
 ER_NO_SUCH_TABLE: 'Required tables are missing. Import schema.sql.',
 ER_ACCESS_DENIED_ERROR: 'Set DB_USER and DB_PASSWORD locally in the project-root .env file. Never share the password.',
 ECONNREFUSED: 'Start MySQL Server and check DB_HOST / DB_PORT in .env.',
 ENOTFOUND: 'Check DB_HOST in .env.'
};
try {
 await checkDatabase();
 const [[counts]] = await pool.execute('SELECT (SELECT COUNT(*) FROM students) AS students, (SELECT COUNT(*) FROM courses) AS courses, (SELECT COUNT(*) FROM enrollments) AS enrollments');
 console.log('MySQL SELECT 1 and all required tables: OK');
 console.log('Record counts:', counts);
} catch(error) {
 console.error('Database check failed:', error.code || 'UNKNOWN');
 console.error(hints[error.code] || 'Check local MySQL settings and schema. No credentials were printed.');
 process.exitCode=1;
} finally { await pool.end(); }
