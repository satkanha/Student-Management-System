import { createModel } from './baseModel.js';
export default createModel("students", ["student_code", "first_name", "last_name", "email", "phone", "gender", "date_of_birth", "status"], "SELECT students.* FROM students", ["first_name", "last_name", "CONCAT(first_name, ' ', last_name)", "student_code", "email"]);
