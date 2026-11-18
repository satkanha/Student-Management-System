import test from 'node:test';
import assert from 'node:assert/strict';
import {id,validate} from '../middleware/validation.js';
const student={student_code:' ST-100 ',first_name:' Ada ',last_name:'Lovelace',email:'ADA@example.com'};
test('student values are trimmed and email normalized',()=>{const data=validate('students',student);assert.equal(data.student_code,'ST-100');assert.equal(data.first_name,'Ada');assert.equal(data.email,'ada@example.com');assert.equal(data.status,'Active');assert.equal(data.date_of_birth,null);});
test('missing and malformed student fields rejected',()=>{for(const body of [{},null,[],{...student,email:'invalid'},{...student,first_name:42},{...student,status:'Unknown'},{...student,date_of_birth:'2024-02-30'},{...student,date_of_birth:'2999-01-01'},{...student,date_of_birth:false},{...student,date_of_birth:0}])assert.throws(()=>validate('students',body),{status:400});});
test('IDs reject zero, negative, fractional, overflow and injection',()=>{for(const value of [0,-1,'1 OR 1=1','1.5','4294967296',undefined,[1],true])assert.throws(()=>id(value),{status:400});assert.equal(id('12'),12);});
test('courses enforce credit range and required name',()=>{const course={course_code:'CS101',course_name:'Web',credits:'3'};assert.equal(validate('courses',course).credits,3);for(const credits of [0,31,1.5,'abc',true,[3]])assert.throws(()=>validate('courses',{...course,credits}),{status:400});assert.throws(()=>validate('courses',{...course,course_name:''}),{status:400});});
test('enrollment validates both foreign IDs and status',()=>{assert.deepEqual(validate('enrollments',{student_id:'1',course_id:'2'}),{student_id:1,course_id:2,status:'Enrolled'});assert.throws(()=>validate('enrollments',{student_id:1,course_id:0}),{status:400});assert.throws(()=>validate('enrollments',{student_id:1,course_id:2,status:'Active'}),{status:400});});
test('revised schema limits and nullable fields',()=>{
 const valid=validate('students',{...student,first_name:'A'.repeat(100),phone:null,gender:null});
 assert.equal(valid.phone,null);assert.equal(valid.gender,null);
 for(const patch of [{student_code:'X'.repeat(21)},{email:'a'.repeat(140)+'@example.com'},{phone:'1'.repeat(21)},{gender:'Prefer not to say'}])assert.throws(()=>validate('students',{...student,...patch}),{status:400});
 assert.equal(validate('courses',{course_code:'C',course_name:'A'.repeat(150),description:null,credits:3}).description,null);
});
