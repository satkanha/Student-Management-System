import { createModel } from './baseModel.js';
export default createModel("courses", ["course_code", "course_name", "description", "credits"], "SELECT courses.* FROM courses", ["course_code", "course_name", "description"]);
