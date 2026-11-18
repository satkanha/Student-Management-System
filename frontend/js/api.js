export async function api(path, options = {}) {
 const response = await fetch('/api' + path, { ...options, headers: {'Content-Type':'application/json', ...options.headers} });
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
