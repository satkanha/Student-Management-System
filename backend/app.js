import express from 'express';
import { fileURLToPath } from 'node:url';
import { pool, checkDatabase } from './config/db.js';
import students from './routes/studentRoutes.js';
import courses from './routes/courseRoutes.js';
import enrollments from './routes/enrollmentRoutes.js';
import { deploymentMiddleware } from './middleware/deployment.js';
import { errorHandler } from './middleware/errors.js';
export const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const deployment = deploymentMiddleware();
app.use('/api', deployment.cors);
app.use((req,res,next) => { res.set('X-Content-Type-Options','nosniff'); res.set('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'"); next(); });
app.use(express.json({limit:'32kb'}));
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.get('/api/health', async (req,res) => {
 try { await checkDatabase(); res.json({success:true,data:{status:'ok'}}); }
 catch { res.status(503).json({success:false,error:'Database is not ready.'}); }
});
app.use('/api', deployment.auth);
app.get('/api/session', (req,res) => res.json({success:true,data:{authenticated:true}}));
app.use('/api/students', students);
app.use('/api/courses', courses);
app.use('/api/enrollments', enrollments);
app.get('/api/dashboard', async (req,res) => {
 const [[counts]] = await pool.execute('SELECT (SELECT COUNT(*) FROM students) AS students, (SELECT COUNT(*) FROM courses) AS courses, (SELECT COUNT(*) FROM enrollments) AS enrollments');
 const [recent] = await pool.execute('SELECT * FROM students ORDER BY created_at DESC, id DESC LIMIT 5');
 res.json({success:true,data:{...counts,recent}});
});
app.use('/api',(req,res)=>res.status(404).json({success:false,error:'API endpoint not found.'}));
app.use(express.static(fileURLToPath(new URL('../frontend', import.meta.url))));
app.use((req,res)=>res.status(404).send('Page not found.'));
app.use(errorHandler);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
 await checkDatabase().then(()=>console.log('MySQL connection and required tables verified.')).catch(error=>console.error('Database setup required:', error.code || 'CONNECTION_ERROR', 'Run npm run db:check for guidance.'));
 const server=app.listen(Number(process.env.PORT || 3000),()=>console.log(`Student Management System listening on port ${process.env.PORT || 3000}`));
 const shutdown=()=>server.close(async()=>{await pool.end();process.exit(0);});
 process.on('SIGINT',shutdown); process.on('SIGTERM',shutdown);
}
