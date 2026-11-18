import {createHash,timingSafeEqual} from 'node:crypto';
function parseOrigins(value,production) {
 return value.split(',').map(v=>v.trim()).filter(Boolean).map(origin=>{
  const url=new URL(origin);
  if(!['https:','http:'].includes(url.protocol)||url.origin!==origin)throw new Error('FRONTEND_ORIGINS must contain exact origins without paths or trailing slashes.');
  if(production&&url.protocol!=='https:')throw new Error('Production frontend origins must use HTTPS.');
  return origin;
 });
}
export function deploymentMiddleware(env=process.env) {
 const production=env.NODE_ENV==='production';
 const origins=parseOrigins(env.FRONTEND_ORIGINS||'',production);
 const password=env.ADMIN_PASSWORD||'';
 const username=env.ADMIN_USERNAME||'admin';
 if(production&&password.length<16)throw new Error('Set a unique ADMIN_PASSWORD of at least 16 characters in Render.');
 if(production&&!origins.length)throw new Error('Configure FRONTEND_ORIGINS before production deployment.');
 const digest=value=>createHash('sha256').update(value).digest();
 const expected=digest(username+':'+password);
 // Limit failed sign-ins per IP. Render uses one trusted reverse proxy.
 const failures=new Map();
 const cors=(req,res,next)=>{
  const origin=req.get('Origin');res.vary('Origin');
  const sameOrigin=origin===`${req.protocol}://${req.get('host')}`;
  if(origin&&!sameOrigin&&!origins.includes(origin))return res.status(403).json({success:false,error:'This frontend origin is not allowed.'});
  if(origin){res.set('Access-Control-Allow-Origin',origin);res.set('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.set('Access-Control-Allow-Headers','Content-Type, Authorization');}
  if(req.method==='OPTIONS')return res.status(204).end();
  next();
 };
 const auth=(req,res,next)=>{
  if(!password)return next(); // Local classroom mode only; production requires a password above.
  const now=Date.now(),key=req.ip;
  for(const [ip,state]of failures)if(state.until<=now)failures.delete(ip);
  const state=failures.get(key);
  if(state?.count>=10)return res.status(429).json({success:false,error:'Too many failed sign-ins. Try again in 15 minutes.'});
  const header=req.get('Authorization')||'';
  let supplied='';
  if(header.startsWith('Basic '))supplied=Buffer.from(header.slice(6),'base64').toString('utf8');
  if(!supplied||!timingSafeEqual(expected,digest(supplied))) {
   // Initial anonymous API requests prompt the UI; count only actual failed credentials.
   if(header){if(failures.size>=10000)failures.delete(failures.keys().next().value);failures.set(key,{count:(state?.count||0)+1,until:state?.until||now+15*60*1000});}
   return res.status(401).json({success:false,error:'Administrator sign-in is required.'});
  }
  failures.delete(key);next();
 };
 return {cors,auth};
}
