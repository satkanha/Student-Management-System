import {api,init,escapeHTML as esc,toast,person,badge,table} from './api.js';
const studentFields=[['student_code','Student code','text',20],['first_name','First name','text',100],['last_name','Last name','text',100],['email','Email address','email',150],['phone','Phone','tel',20],['gender','Gender',[['','Not specified'],'Male','Female','Other']],['date_of_birth','Date of birth','date'],['status','Status',['Active','Inactive']]];
const courseFields=[['course_code','Course code','text',20],['course_name','Course name','text',150],['description','Description','textarea',10000],['credits','Credits','number']];
export function startModule(resource) {
 init(); let records=[],request=0, timer; const results=document.querySelector('#results'), dialog=document.querySelector('#record-dialog'),body=document.querySelector('#dialog-body'),title=document.querySelector('#dialog-title');
 const singular=resource.slice(0,-1);
 document.querySelector('#close-dialog').onclick=()=>dialog.close();
 function showError(message){const el=document.querySelector('#page-error');el.textContent=message;el.className=message?'error':'';}
 async function load(){ const current=++request; results.innerHTML='<div class="loading">Loading records…</div>'; showError(''); try { const rows=await api(`/${resource}?q=${encodeURIComponent(document.querySelector('#search').value.trim())}`); if(current!==request)return; records=rows; render(); }catch(e){if(current!==request)return;results.innerHTML='<div class="empty">Unable to load records. Use Refresh to try again.</div>';showError(e.message);document.querySelector('#record-count').textContent='Records unavailable';} }
 function render(){document.querySelector('#record-count').textContent=`${records.length} ${records.length===1?singular:resource}`;
 const headers=resource==='students'?['Student','Code','Phone','Status','Actions']:resource==='courses'?['Course','Code','Credits','Actions']:['Student','Course','Enrolled','Status','Actions'];
 results.innerHTML=table(headers,records.map(row=>{
 const cells=resource==='students'?[person(row),esc(row.student_code),esc(row.phone)||'—',badge(row.status)]:resource==='courses'?[`<span class="course-name">${esc(row.course_name)}</span>`,esc(row.course_code),esc(row.credits)]:[`${esc(row.student_name)}<br><small>${esc(row.student_code)}</small>`,esc(row.course_name),esc(row.enrolled_at.slice(0,10)),badge(row.status)];
 return `<tr>${cells.map(c=>`<td>${c}</td>`).join('')}<td><div class="actions"><button data-action="view" data-id="${row.id}">View</button><button data-action="edit" data-id="${row.id}">Edit</button><button class="danger" data-action="delete" data-id="${row.id}">Delete</button></div></td></tr>`;
 })); }
 function open(heading,html){ title.textContent=heading; body.innerHTML=html;if(!dialog.open)dialog.showModal(); }
 async function form(record={}){
  let fields=resource==='students'?studentFields:courseFields;
  if(resource==='enrollments'){
   const [students,courses]=await Promise.all([api('/students'),api('/courses')]);
   if(!students.length||!courses.length){toast('Add at least one student and course before enrolling.');return;}
   fields=[['student_id','Student',students.map(s=>[s.id,`${s.student_code} · ${s.first_name} ${s.last_name}`])],['course_id','Course',courses.map(c=>[c.id,`${c.course_code} · ${c.course_name}`])],['status','Status',['Enrolled','Completed','Dropped']]];
  }
  open(`${record.id?'Edit':'Add'} ${singular}`,`<form id="record-form"><div id="form-error" role="alert"></div><div class="form-grid">${fields.map(([key,label,type,max])=>{
   const value=record[key]??'';const optional=['phone','description','date_of_birth','gender'].includes(key); let control;
   if(Array.isArray(type))control=`<select name="${key}" id="field-${key}" ${optional?'':'required'}>${value && !type.some(item=>String(Array.isArray(item)?item[0]:item)===String(value))?`<option value="${esc(value)}" selected>${esc(value)}</option>`:''}${type.map(item=>{const [v,text]=Array.isArray(item)?item:[item,item];return `<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(text)}</option>`;}).join('')}</select>`;
   else if(type==='textarea')control=`<textarea id="field-${key}" name="${key}" maxlength="${max}">${esc(value)}</textarea>`;
   else control=`<input id="field-${key}" name="${key}" type="${type}" value="${esc(value)}" ${optional?'':'required'} ${max?`maxlength="${max}"`:''} ${type==='number'?'min="1" max="30" step="1"':''} ${type==='date'?`max="${new Date().toISOString().slice(0,10)}" min="1000-01-01"`:''}>`;
   return `<label class="field ${type==='textarea'?'full':''}" for="field-${key}">${label}${optional?'':' *'}${control}</label>`;
  }).join('')}</div><div class="form-actions"><button type="button" class="button secondary" id="cancel">Cancel</button><button class="button" type="submit">${record.id?'Save changes':'Create '+singular}</button></div></form>`);
  document.querySelector('#cancel').onclick=()=>dialog.close();
  document.querySelector('#record-form').onsubmit=async e=>{ e.preventDefault(); const submit=e.submitter;submit.disabled=true;const data=Object.fromEntries(new FormData(e.target));if(resource==='students'&&!data.gender)data.gender=null;try{await api(`/${resource}${record.id?'/'+record.id:''}`,{method:record.id?'PUT':'POST',body:JSON.stringify(data)});dialog.close();toast(`${singular[0].toUpperCase()+singular.slice(1)} ${record.id?'updated':'created'} successfully.`);await load();}catch(error){const el=document.querySelector('#form-error');el.className='error';el.textContent=error.message;}finally{submit.disabled=false;} };
 }
 document.querySelector('#add-record').onclick=()=>form().catch(e=>showError(e.message));
 document.querySelector('#refresh').onclick=load;
 document.querySelector('#search').oninput=()=>{clearTimeout(timer);++request;timer=setTimeout(load,250);};
 results.onclick=async e=>{const button=e.target.closest('button[data-action]');if(!button)return;button.disabled=true;try{const record=await api(`/${resource}/${button.dataset.id}`);if(button.dataset.action==='edit'){await form(record);}else if(button.dataset.action==='view'){open(`${singular[0].toUpperCase()+singular.slice(1)} details`,`<dl>${Object.entries(record).map(([k,v])=>`<dt>${esc(k.replaceAll('_',' '))}</dt><dd>${esc(v)||'—'}</dd>`).join('')}</dl>`);}else{
 open('Delete '+singular+'?',`<p>This permanently deletes this record. Students and courses with related enrollments must have those enrollments removed first.</p><div id="delete-error" role="alert"></div><div class="form-actions"><button class="button secondary" id="cancel-delete">Cancel</button><button class="button" id="confirm-delete">Delete record</button></div>`);
 document.querySelector('#cancel-delete').onclick=()=>dialog.close();document.querySelector('#confirm-delete').onclick=async event=>{event.target.disabled=true;try{await api(`/${resource}/${record.id}`,{method:'DELETE'});dialog.close();toast('Record deleted successfully.');await load();}catch(error){const el=document.querySelector('#delete-error');el.className='error';el.textContent=error.message;event.target.disabled=false;}};
 }}catch(error){showError(error.message);}finally{button.disabled=false;}};
 load();
}
