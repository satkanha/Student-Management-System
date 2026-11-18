import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { databaseOptions } from './databaseOptions.js';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
export const pool = mysql.createPool(databaseOptions());

// A lightweight startup/CLI check; errors expose codes, never credentials.
export async function checkDatabase() {
 await pool.execute('SELECT 1');
 await pool.execute('SELECT id FROM students LIMIT 0');
 await pool.execute('SELECT id FROM courses LIMIT 0');
 await pool.execute('SELECT id FROM enrollments LIMIT 0');
}
