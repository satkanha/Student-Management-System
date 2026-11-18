// Local simulation of GitHub Pages -> Render: separate origins, authenticated reads only.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import express from 'express';
if(!process.env.QA_PLAYWRIGHT_MODULE)throw new Error('Set QA_PLAYWRIGHT_MODULE to optional playwright-core index.mjs.');
const {chromium}=await import(pathToFileURL(resolve(process.env.QA_PLAYWRIGHT_MODULE)).href);
const password=randomBytes(32).toString('hex');
let backendBase;
const frontend=express();
frontend.get('/Student-Management-System/js/config.js',(req,res)=>res.type('application/javascript').send(`export const API_BASE_URL = ${JSON.stringify(backendBase+'/api')};`));
frontend.use('/Student-Management-System',express.static(fileURLToPath(new URL('../../frontend',import.meta.url))));
const staticServer=frontend.listen(0,'127.0.0.1');await new Promise(resolve=>staticServer.once('listening',resolve));
const frontendOrigin=`http://127.0.0.1:${staticServer.address().port}`;
process.env.ADMIN_PASSWORD=password;process.env.FRONTEND_ORIGINS=frontendOrigin;
const {app}=await import('../app.js');const {pool}=await import('../config/db.js');
const backend=app.listen(0,'127.0.0.1');await new Promise(resolve=>backend.once('listening',resolve));backendBase=`http://127.0.0.1:${backend.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let preflights=0;backend.on('request',req=>{if(req.method==='OPTIONS')preflights++;});
 await page.goto(frontendOrigin+'/Student-Management-System/index.html');
 await page.locator('dialog[open] [name=password]').waitFor();
 await page.locator('dialog[open] [name=password]').fill('wrong-password');
 await page.locator('dialog[open] button[type=submit]').click();
 await page.locator('dialog[open] [role=alert]:not([hidden])').waitFor();
 assert.ok((await page.locator('dialog[open] [role=alert]').innerText()).includes('Sign-in failed'));
 await page.locator('dialog[open] [name=password]').fill(password);
 await page.locator('dialog[open] button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('#total-students')?.textContent!=='—');
 assert.ok(Number(await page.locator('#total-students').innerText())>=0);assert.equal(await page.locator('dialog[open]').count(),0);
 assert.ok(preflights>0);assert.deepEqual(errors,[]);
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 // Credentials are intentionally kept in module memory and never in local/session storage.
 await page.goto(frontendOrigin+'/Student-Management-System/students.html');
 await page.locator('dialog[open] [name=password]').waitFor();await page.locator('dialog[open] button[type=button]').click();
 await page.locator('#page-error.error').waitFor();assert.ok((await page.locator('#page-error').innerText()).includes('cancelled'));
 const unauth=await fetch(backendBase+'/api/students');assert.equal(unauth.status,401);
 assert.equal((await fetch(backendBase+'/api/health')).status,200);
 const blocked=await fetch(backendBase+'/api/students',{headers:{Origin:'https://untrusted.example'}});assert.equal(blocked.status,403);
 console.log('PASS: project subpath assets, cross-origin preflight, sign-in failure/success/cancel, protected reads, health, disallowed origin, and no credential persistence.');
 console.log('Local simulation only: hosted HTTPS, database TLS handshake, and remote CRUD remain Not Run.');
}finally{
 if(browser)await browser.close();await new Promise(resolve=>backend.close(resolve));await new Promise(resolve=>staticServer.close(resolve));await pool.end();
}
