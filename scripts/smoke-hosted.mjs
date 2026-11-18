// Opt-in HTTPS smoke test: creates/deletes only its own uniquely named records.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const url=new URL(process.env.API_BASE_URL||'');
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname.replace(/\/$/,'')!=='/api')throw new Error('Set API_BASE_URL to the real HTTPS backend URL ending in /api.');
if(process.env.SMS_HOSTED_TEST!=='1')throw new Error('Set SMS_HOSTED_TEST=1 to authorize temporary hosted test records.');
if(!process.env.ADMIN_PASSWORD)throw new Error('Provide ADMIN_PASSWORD privately through the environment.');
const base=url.href.replace(/\/$/,'');
const authorization='Basic '+Buffer.from((process.env.ADMIN_USERNAME||'admin')+':'+process.env.ADMIN_PASSWORD).toString('base64');
const tag='QA-'+randomBytes(5).toString('hex');
let studentId,courseId,enrollmentId;
async function request(path,method='GET',data){const response=await fetch(base+path,{method,headers:{Authorization:authorization,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(120000)});const text=await response.text();return {status:response.status,data:text?JSON.parse(text).data:null,text};}
const student={student_code:tag,first_name:'Hosted',last_name:'QA',email:tag.toLowerCase()+'@example.com'};
const course={course_code:tag,course_name:'Hosted QA course',credits:3};
async function create(resource,data){const r=await request('/'+resource,'POST',data);assert.equal(r.status,201);return r.data.id;}
try{
 assert.equal((await request('/health')).status,200);
 studentId=await create('students',student);courseId=await create('courses',course);enrollmentId=await create('enrollments',{student_id:studentId,course_id:courseId});
 for(const [resource,id,data]of [['students',studentId,student],['courses',courseId,course],['enrollments',enrollmentId,{student_id:studentId,course_id:courseId,status:'Completed'}]]){
  assert.equal((await request('/'+resource)).status,200);
  assert.equal((await request('/'+resource+'/'+id)).status,200);
  const search=await request('/'+resource+'?q='+encodeURIComponent(tag));assert.equal(search.status,200);assert.ok(search.data.some(row=>row.id===id));
  assert.equal((await request('/'+resource+'/'+id,'PUT',data)).status,200);
  assert.equal((await request('/'+resource+'?q=NoMatchingRecord'+tag)).status,200);
  console.log('PASS hosted '+resource+' create/list/detail/search/update');
 }
 assert.equal((await request('/students/'+studentId,'DELETE')).status,409);
 assert.equal((await request('/enrollments','POST',{student_id:studentId,course_id:courseId})).status,409);
 for(const [resource,id]of [['enrollments',enrollmentId],['students',studentId],['courses',courseId]]){
  const r=await request('/'+resource+'/'+id,'DELETE');assert.equal(r.status,204);assert.equal(r.text,'');assert.equal((await request('/'+resource+'/'+id)).status,404);console.log('PASS hosted '+resource+' delete');
 }
 enrollmentId=studentId=courseId=null;
 console.log('PASS hosted API smoke test. Verify browser HTTPS/CORS and Navicat TLS separately.');
}finally{
 // On failure, clean only IDs created during this run. Log no credentials or record details.
 for(const [resource,id]of [['enrollments',enrollmentId],['students',studentId],['courses',courseId]])if(id){try{await request('/'+resource+'/'+id,'DELETE');}catch{console.error('Temporary '+resource+' cleanup needs retry; inspect records with prefix '+tag);}}
}
