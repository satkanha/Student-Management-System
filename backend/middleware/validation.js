import { HttpError } from './errors.js';
export function id(value) {
 if (!['string', 'number'].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 4294967295) throw new HttpError(400, 'ID must be a positive integer.');
 return Number(value);
}
export function validate(resource, body) {
 if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'A JSON object is required.');
 const data = {};
 const str = (key, max, required = true) => {
  if (body[key] !== undefined && !(body[key] === null && !required) && typeof body[key] !== 'string') throw new HttpError(400, `${key} must be text.`);
  const value = (body[key] ?? '').trim();
  if ((required && !value) || value.length > max) throw new HttpError(400, `${key} is required and must be at most ${max} characters.`);
  data[key] = value;
 };
 const choice = (key, choices, fallback) => { data[key] = body[key] ?? fallback; if (!choices.includes(data[key])) throw new HttpError(400, `Invalid ${key}.`); };
 if (resource === 'students') {
  str('student_code',20); str('first_name',100); str('last_name',100); str('email',150); str('phone',20,false);
  data.email = data.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new HttpError(400, 'Enter a valid email address.');
  choice('gender',['Male','Female','Other',null],null); choice('status',['Active','Inactive'],'Active');
  data.phone = data.phone || null;
  const date = body.date_of_birth;
  data.date_of_birth = date === '' || date === undefined || date === null ? null : date;
  if (data.date_of_birth !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date < '1000-01-01' || date > new Date().toISOString().slice(0,10))) throw new HttpError(400,'Enter a valid date of birth that is not in the future.');
 } else if (resource === 'courses') {
  str('course_code',20); str('course_name',150); str('description',10000,false); data.description = data.description || null;
  if (!['string', 'number'].includes(typeof body.credits) || !/^[0-9]+$/.test(String(body.credits)) || Number(body.credits)<1 || Number(body.credits)>30) throw new HttpError(400,'Credits must be an integer from 1 to 30.');
  data.credits = Number(body.credits);
 } else {
  data.student_id=id(body.student_id); data.course_id=id(body.course_id);
  choice('status',['Enrolled','Completed','Dropped'],'Enrolled');
 }
 return data;
}
