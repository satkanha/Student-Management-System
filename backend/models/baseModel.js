import { pool } from '../config/db.js';
// Table/column fragments below are developer constants, never request input.
export function createModel(table, fields, select, search) {
 return {
 async list(q = '') { const term = '%' + q.replace(/[!%_]/g, '!$&') + '%'; const [rows] = await pool.execute(select + (q ? ` WHERE ${search.map(field => `${field} LIKE ? ESCAPE '!'`).join(' OR ')}` : '') + ` ORDER BY ${table}.id DESC`, q ? search.map(() => term) : []); return rows; },
 async find(id) { const [rows] = await pool.execute(select + ` WHERE ${table}.id = ?`,[id]); return rows[0]; },
 async create(data) { const [result] = await pool.execute(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,fields.map(f => data[f])); return this.find(result.insertId); },
 async update(id,data) { const [result] = await pool.execute(`UPDATE ${table} SET ${fields.map(f => `${f} = ?`).join(',')} WHERE id = ?`,[...fields.map(f => data[f]),id]); return result.affectedRows ? this.find(id) : null; },
 async remove(id) { const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`,[id]); return result.affectedRows > 0; }
 };
}
