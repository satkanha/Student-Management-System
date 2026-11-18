import {api,init,person,badge,table,escapeHTML as esc} from './api.js';
init();
const results=document.querySelector('#results'); results.innerHTML='<div class="loading">Loading your campus overview…</div>';
try { const data=await api('/dashboard'); for (const key of ['students','courses','enrollments']) document.querySelector('#total-'+key).textContent=data[key].toLocaleString(); results.innerHTML=table(['Student','Student code','Status','Added'],data.recent.map(row=>`<tr><td>${person(row)}</td><td>${esc(row.student_code)}</td><td>${badge(row.status)}</td><td>${esc(row.created_at.slice(0,10))}</td></tr>`)); }
catch(error) {results.innerHTML='<div class="empty">Overview unavailable. Check the server and database connection.</div>';document.querySelector('#page-error').textContent=error.message;document.querySelector('#page-error').className='error';}
