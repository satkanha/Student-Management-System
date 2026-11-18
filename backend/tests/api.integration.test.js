import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from '../app.js';
import {pool} from '../config/db.js';
// Opt in only against a disposable database: these tests create and delete records.
test('REST API integration against MySQL', {skip:process.env.SMS_INTEGRATION!=='1'}, async t=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function req(path,method='GET',body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:r.status===204?null:await r.json()};}
 const student={student_code:`TEST-${Date.now()}`,first_name:'Test',last_name:'Student',email:`test-${Date.now()}@example.com`,phone:'01234567',gender:'Other',date_of_birth:'2000-01-01',status:'Active'};
 const course={course_code:`T-${Date.now()}`,course_name:'Test Course',description:'Test',credits:3};
 let sid,cid,eid;
 try {
 await t.test('create student / 201',async()=>{const r=await req('/api/students','POST',student);assert.equal(r.status,201);sid=r.data.data.id;});
 await t.test('student detail / 200',async()=>assert.equal((await req(`/api/students/${sid}`)).data.data.email,student.email));
 await t.test('required fields / 400',async()=>assert.equal((await req('/api/students','POST',{})).status,400));
 await t.test('duplicate email and code / 409',async()=>{assert.equal((await req('/api/students','POST',{...student,student_code:student.student_code+'X'})).status,409);assert.equal((await req('/api/students','POST',{...student,email:'other@example.com'})).status,409);});
 await t.test('invalid and nonexistent IDs',async()=>{assert.equal((await req('/api/students/abc')).status,400);assert.equal((await req('/api/students/4294967295')).status,404);});
 await t.test('search by name, code, email and no matches',async()=>{for(const q of ['Test Student',student.student_code,student.email])assert.ok((await req('/api/students?q='+encodeURIComponent(q))).data.data.some(s=>s.id===sid));assert.deepEqual((await req('/api/students?q=zzzzNoSuchStudentzzzz')).data.data,[]);});
 await t.test('literal search and injection',async()=>{assert.deepEqual((await req('/api/students?q=%25')).data.data,[]);assert.equal((await req('/api/students?q='+encodeURIComponent("' OR 1=1 --"))).status,200);assert.equal((await req('/api/students?q=a&q=b')).status,400);});
 await t.test('student update / 200',async()=>{const r=await req(`/api/students/${sid}`,'PUT',{...student,first_name:'Updated'});assert.equal(r.status,200);assert.equal(r.data.data.first_name,'Updated');});
 await t.test('course CRUD, search, duplicates, validation',async()=>{const r=await req('/api/courses','POST',course);assert.equal(r.status,201);cid=r.data.data.id;assert.equal((await req(`/api/courses/${cid}`)).status,200);assert.equal((await req('/api/courses?q='+course.course_code)).data.data[0].id,cid);assert.equal((await req('/api/courses','POST',course)).status,409);assert.equal((await req('/api/courses','POST',{...course,credits:0})).status,400);assert.equal((await req(`/api/courses/${cid}`,'PUT',{...course,credits:4})).data.data.credits,4);});
 await t.test('enrollment create, joins, search, update',async()=>{const r=await req('/api/enrollments','POST',{student_id:sid,course_id:cid});assert.equal(r.status,201);eid=r.data.data.id;assert.equal(r.data.data.course_name,course.course_name);assert.equal((await req(`/api/enrollments/${eid}`)).status,200);assert.equal((await req('/api/enrollments?q='+course.course_code)).data.data[0].id,eid);assert.equal((await req(`/api/enrollments/${eid}`,'PUT',{student_id:sid,course_id:cid,status:'Completed'})).data.data.status,'Completed');});
 await t.test('duplicate enrollment / 409 and invalid references / 400',async()=>{assert.equal((await req('/api/enrollments','POST',{student_id:sid,course_id:cid})).status,409);assert.equal((await req('/api/enrollments','POST',{student_id:4294967295,course_id:cid})).status,400);});
 await t.test('foreign keys protect both parents / 409',async()=>{assert.equal((await req(`/api/students/${sid}`,'DELETE')).status,409);assert.equal((await req(`/api/courses/${cid}`,'DELETE')).status,409);});
 await t.test('course and enrollment missing IDs, invalid input, empty searches',async()=>{
  for(const resource of ['courses','enrollments']){
   assert.equal((await req('/api/'+resource+'/abc')).status,400);
   assert.equal((await req('/api/'+resource+'/4294967295')).status,404);
   assert.equal((await req('/api/'+resource,'POST',{})).status,400);
   assert.deepEqual((await req('/api/'+resource+'?q=zzzzNoMatchingRecordzzzz')).data.data,[]);
  }
  assert.equal((await req('/api/enrollments','POST',{student_id:sid,course_id:4294967295})).status,400);
 });
 await t.test('dashboard totals and recent students',async()=>{const r=await req('/api/dashboard');assert.equal(r.status,200);assert.ok(r.data.data.students>0);assert.ok(Array.isArray(r.data.data.recent));});
 await t.test('unknown route, malformed JSON',async()=>{assert.equal((await req('/api/unknown')).status,404);const r=await fetch(base+'/api/students',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(r.status,400);});
 await t.test('static frontend pages and security headers',async()=>{for(const file of ['index.html','students.html','courses.html','enrollments.html','js/management.js','css/style.css']){const r=await fetch(base+'/'+file);assert.equal(r.status,200);assert.equal(r.headers.get('x-content-type-options'),'nosniff');}});
 await t.test('delete all three resources / 204; repeated delete / 404',async()=>{for(const path of [`enrollments/${eid}`,`students/${sid}`,`courses/${cid}`]){const r=await req('/api/'+path,'DELETE');assert.equal(r.status,204);assert.equal(r.data,null);assert.equal((await req('/api/'+path,'DELETE')).status,404);}eid=sid=cid=null;});
 }finally{if(eid)await pool.execute('DELETE FROM enrollments WHERE id=?',[eid]);if(sid)await pool.execute('DELETE FROM students WHERE id=?',[sid]);if(cid)await pool.execute('DELETE FROM courses WHERE id=?',[cid]);await new Promise(resolve=>server.close(resolve));await pool.end();}
});
