import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
export const pool = mysql.createPool({
 host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
 user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
 database: process.env.DB_NAME || 'student_management', waitForConnections: true,
 connectionLimit: 10, queueLimit: 100, dateStrings: true
});

// A lightweight startup/CLI check; errors expose codes, never credentials.
export async function checkDatabase() {
 await pool.execute('SELECT 1');
 await pool.execute('SELECT id FROM students LIMIT 0');
 await pool.execute('SELECT id FROM courses LIMIT 0');
 await pool.execute('SELECT id FROM enrollments LIMIT 0');
}
