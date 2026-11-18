import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {databaseOptions} from '../config/databaseOptions.js';
import {deploymentMiddleware} from '../middleware/deployment.js';
const password='test-only-password-for-deployment-checks';
const production={NODE_ENV:'production',ADMIN_PASSWORD:password,FRONTEND_ORIGINS:'https://satkanha.github.io'};
test('production requires admin credentials and exact HTTPS origins',()=>{
 assert.throws(()=>deploymentMiddleware({...production,ADMIN_PASSWORD:''}));
 assert.throws(()=>deploymentMiddleware({...production,FRONTEND_ORIGINS:'*'}));
 assert.throws(()=>deploymentMiddleware({...production,FRONTEND_ORIGINS:'http://example.com'}));
 assert.throws(()=>deploymentMiddleware({...production,FRONTEND_ORIGINS:'https://satkanha.github.io/Student-Management-System/'}));
});
test('TLS pool settings verify certificates and require production DB secrets',()=>{
 const env={NODE_ENV:'production',DB_HOST:'db.example.com',DB_USER:'sms_app',DB_PASSWORD:password,DB_NAME:'student_management',DB_SSL:'true'};
 assert.equal(databaseOptions(env).ssl.rejectUnauthorized,true);
 assert.equal(databaseOptions(env).ssl.verifyIdentity,true);
 assert.throws(()=>databaseOptions({...env,DB_HOST:'127.0.0.1'}));
 assert.equal(databaseOptions(env).ssl.minVersion,'TLSv1.2');
 assert.equal(databaseOptions({...env,DB_SSL_CA:'line1\\nline2'}).ssl.ca,'line1\nline2');
 assert.throws(()=>databaseOptions({...env,DB_SSL:'false'}));
 assert.throws(()=>databaseOptions({...env,DB_PASSWORD:''}));
 assert.throws(()=>databaseOptions({...env,DB_PORT:'bad'}));
 assert.equal(databaseOptions({}).ssl,undefined);
});
test('cross-origin preflight, authentication, and failure throttling',async()=>{
 const app=express();const {cors,auth}=deploymentMiddleware(production);
 app.use(cors);app.get('/health',(req,res)=>res.json({ok:true}));app.use(auth);app.get('/data',(req,res)=>res.json({ok:true}));
 const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const good='Basic '+Buffer.from('admin:'+password).toString('base64');
 try {
  const preflight=await fetch(base+'/data',{method:'OPTIONS',headers:{Origin:'https://satkanha.github.io','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://satkanha.github.io');assert.ok(preflight.headers.get('access-control-allow-headers').includes('Authorization'));
  assert.equal((await fetch(base+'/data',{headers:{Origin:'https://evil.example',Authorization:good}})).status,403);
  assert.equal((await fetch(base+'/health')).status,200);
  assert.equal((await fetch(base+'/data')).status,401);
  const success=await fetch(base+'/data',{headers:{Origin:'https://satkanha.github.io',Authorization:good}});assert.equal(success.status,200);assert.equal(success.headers.get('access-control-allow-origin'),'https://satkanha.github.io');assert.equal(success.headers.get('access-control-allow-credentials'),null);
  for(let i=0;i<10;i++)assert.equal((await fetch(base+'/data',{headers:{Authorization:'Basic '+Buffer.from('admin:wrong').toString('base64')}})).status,401);
  assert.equal((await fetch(base+'/data',{headers:{Authorization:good}})).status,429);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('Pages artifact uses HTTPS API URL and contains only frontend assets',()=>{
 const root=fileURLToPath(new URL('../../',import.meta.url));
 const script=fileURLToPath(new URL('../../scripts/build-pages.mjs',import.meta.url));
 const env={...process.env,API_BASE_URL:'https://api.example.com/api'};
 execFileSync(process.execPath,[script],{cwd:root,env});
 const config=readFileSync(root+'pages-dist/js/config.js','utf8');assert.ok(config.includes('https://api.example.com/api'));
 for(const file of ['.env','backend','schema.sql','node_modules'])assert.equal(existsSync(root+'pages-dist/'+file),false);
 const html=readFileSync(root+'pages-dist/index.html','utf8');assert.ok(html.includes('href="css/style.css"'));assert.ok(!html.includes('href="/css/'));
 assert.throws(()=>execFileSync(process.execPath,[script],{cwd:root,env:{...env,API_BASE_URL:'http://insecure.example/api'},stdio:'pipe'}));
});
