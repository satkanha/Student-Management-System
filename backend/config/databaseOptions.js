import {readFileSync} from 'node:fs';
import {isIP} from 'node:net';
export function databaseOptions(env=process.env) {
 const production=env.NODE_ENV==='production';
 if(production)for(const key of ['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME'])if(!env[key])throw new Error(`${key} must be configured in production.`);
 const sslValue=env.DB_SSL ?? (production?'true':'false');
 if(!['true','false'].includes(sslValue))throw new Error('DB_SSL must be true or false.');
 if(production&&sslValue!=='true')throw new Error('Production MySQL connections require verified TLS (DB_SSL=true).');
 const port=Number(env.DB_PORT||3306);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('DB_PORT must be a valid port.');
 const options={host:env.DB_HOST||'localhost',port,user:env.DB_USER||'root',password:env.DB_PASSWORD||'',database:env.DB_NAME||'student_management',waitForConnections:true,connectionLimit:10,queueLimit:100,dateStrings:true,connectTimeout:10000};
 if(sslValue==='true') {
  const ca=env.DB_SSL_CA_FILE?readFileSync(env.DB_SSL_CA_FILE,'utf8'):env.DB_SSL_CA?.replace(/\\n/g,'\n');
  if(production&&isIP(options.host))throw new Error('Use the provider DNS hostname for verified database TLS.');
  options.ssl={verifyIdentity:true,rejectUnauthorized:true,minVersion:'TLSv1.2',...(ca?{ca}:{})};
 }
 return options;
}
