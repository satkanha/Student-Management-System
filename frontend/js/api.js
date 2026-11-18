import {API_BASE_URL} from './config.js';
const base=API_BASE_URL.replace(/\/$/,'');
let credentials=null, signInPromise=null;
async function signIn() {
 if(signInPromise)return signInPromise;
 signInPromise=new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','sign-in-title');
  dialog.innerHTML='<h2 id="sign-in-title">Administrator sign-in</h2><p>Sign in to access student records.</p><form><div class="form-grid"><label class="field full">Username<input name="username" autocomplete="username" value="admin" required></label><label class="field full">Password<input name="password" type="password" autocomplete="current-password" required></label></div><p class="error" role="alert" hidden></p><div class="form-actions"><button class="button" type="submit">Sign in</button><button class="button secondary" type="button">Cancel</button></div></form>';
  document.body.append(dialog);dialog.showModal();
  const form=dialog.querySelector('form'),error=dialog.querySelector('[role=alert]');
  const cancel=()=>{dialog.close();dialog.remove();reject(new Error('Administrator sign-in was cancelled.'));};
  dialog.querySelector('[type=button]').onclick=cancel;
  dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});
  form.onsubmit=async event=>{
   event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;
   try {
    const values=new FormData(form);
    const bytes=new TextEncoder().encode(values.get('username')+':'+values.get('password'));
    const value='Basic '+btoa(String.fromCharCode(...bytes));
    const response=await fetch(base+'/session',{headers:{Authorization:value},credentials:'omit'});
    if(!response.ok)throw new Error(response.status===429?'Too many failed sign-ins. Try again later.':'Sign-in failed. Check your credentials.');
    credentials=value;form.reset();dialog.close();dialog.remove();resolve();
   }catch(e){error.textContent=e.message;error.hidden=false;}finally{button.disabled=false;}
  };
 }).finally(()=>{signInPromise=null;});
 return signInPromise;
}
export async function api(path, options = {}) {
 const send=()=>fetch(base+path,{...options,credentials:'omit',headers:{'Content-Type':'application/json',...(credentials?{Authorization:credentials}:{}),...options.headers}});
 let response=await send();
 if(response.status===401){credentials=null;await signIn();response=await send();}
 if (response.status === 204) return null;
 const json = await response.json().catch(() => ({error:'Unexpected server response.'}));
 if (!response.ok) throw new Error(json.error || 'Request failed.');
 return json.data;
}
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.hidden=false; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.hidden=true,4000); }
export function init() { const a=document.querySelector(`nav [data-page="${document.body.dataset.page}"]`); a?.classList.add('active'); a?.setAttribute('aria-current','page'); }
export function person(row) { return `<div class="person"><span class="initials">${escapeHTML((row.first_name?.[0]||'')+(row.last_name?.[0]||''))}</span><span><strong>${escapeHTML(row.first_name)} ${escapeHTML(row.last_name)}</strong><small>${escapeHTML(row.email)}</small></span></div>`; }
export function badge(status) { return `<span class="badge ${escapeHTML(status.toLowerCase())}">${escapeHTML(status)}</span>`; }
export function table(headers, rows) { return rows.length ? `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<div class="empty">No records found. Add a record or try another search.</div>'; }
