import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,dirname,extname,relative,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {database,createUser,hashToken,passwordMatches,passwordHash} from './db.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const str=(v,max=500)=>{if(typeof v!=='string'||v.trim().length>max)fail(400,'Text invalid sau prea lung.');return v.trim();};
const required=(v,max=500)=>{const s=str(v,max);if(!s)fail(400,'Completează câmpurile obligatorii.');return s;};
const date=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail(400,'Dată invalidă.');return v;};
const number=(v,min,max)=>{const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)fail(400,'Valoare numerică invalidă.');return n;};
const integer=(v,min,max)=>{const n=number(v,min,max);if(!Number.isInteger(n))fail(400,'Este necesar un număr întreg.');return n;};
const money=v=>Math.round(number(v,0,10000000)*100);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>32768)fail(413,'Cerere prea mare.');chunks.push(chunk);}const raw=Buffer.concat(chunks).toString('utf8');try{const parsed=req.headers['content-type']?.includes('application/json')?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(400,'Date invalide.');return parsed;}catch{fail(400,'Date invalide.');}}
export async function start({port=Number(process.env.PORT||4194),host=process.env.HOST||'127.0.0.1',dbPath=process.env.DB_PATH||resolve(here,'data/comcoffee.sqlite'),origin=process.env.APP_ORIGIN,production=process.env.NODE_ENV==='production'}={}){
 if(production&&(!origin||!origin.startsWith('https://')))throw Error('În producție APP_ORIGIN trebuie să fie adresa HTTPS publică.');
 const db=database(dbPath),root=await realpath(resolve(here,'../site'));const dummy=await passwordHash(randomBytes(24).toString('hex'));
 const limits=new Map();let base=origin;
 const rate=(key,max,ms)=>{const now=Date.now();if(limits.size>10000){for(const [k,v]of limits)if(v.until<now)limits.delete(k);if(limits.size>10000)fail(503,'Încearcă din nou mai târziu.');}let l=limits.get(key);if(!l||l.until<now){l={count:0,until:now+ms};limits.set(key,l);}if(++l.count>max)fail(429,'Prea multe încercări. Încearcă din nou mai târziu.');};
 const audit=(user,action,entity)=>db.prepare('INSERT INTO audit(user_id,action,entity) VALUES(?,?,?)').run(user.id,action,String(entity));
 const server=createServer(async(req,res)=>{
  const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
  const send=(status,data,type='application/json; charset=utf-8',extra={})=>{res.writeHead(status,{...headers,'Content-Type':type,...extra});res.end(type.startsWith('application/json')?JSON.stringify(data):data);};
  const redirect=url=>send(303,'','text/plain',{Location:url});
  try{
   const url=new URL(req.url,base);const path=url.pathname;
   if(!['GET','POST','PATCH'].includes(req.method))fail(405,'Metodă nepermisă.');
   if(req.method!=='GET'&&req.headers.origin!==base)fail(403,'Originea cererii nu este permisă.');
   const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('com_session='))?.slice(12);
   const session=cookie?db.prepare('SELECT s.*,u.email,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1').get(hashToken(cookie),Date.now()):null;
   const user=session?{id:session.user_id,email:session.email,role:session.role}:null;
   const auth=()=>{if(!user)fail(401,'Autentifică-te pentru a continua.');};
   const owner=()=>{auth();if(user.role!=='owner')fail(403,'Doar proprietarul poate gestiona administratorii.');};
   const csrf=()=>{auth();if(req.headers['x-csrf-token']!==session.csrf)fail(403,'Sesiune invalidă. Reîncarcă pagina.');};
   if(path==='/api/login'&&req.method==='POST'){
    rate('login-ip:'+req.socket.remoteAddress,60,900000);const b=await body(req),email=required(b.email,254).toLowerCase(),password=required(b.password,128);rate('login:'+email,5,900000);
    const u=db.prepare('SELECT * FROM users WHERE email=?').get(email);const valid=await passwordMatches(password,u?.password||dummy);
    if(!u||!u.active||!valid)fail(401,'Email sau parolă incorectă.');limits.delete('login:'+email);
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());const token=randomBytes(32).toString('hex');const nonce=randomBytes(24).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hashToken(token),u.id,nonce,Date.now()+43200000);
    return send(200,{ok:true},undefined,{'Set-Cookie':`com_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${production?'; Secure':''}`});
   }
   if(path==='/api/enquiries'&&req.method==='POST'){
    rate('enquiry:'+req.socket.remoteAddress,30,3600000);const b=await body(req);if(b._honey)fail(400,'Cererea nu a fost acceptată.');
    const name=required(b.name,120),email=required(b.email,254),phone=required(b.Telefon,25),type=required(b['Tip eveniment'],60),day=date(b['Data evenimentului']),guests=integer(b['Număr estimat de invitați'],1,100000),city=required(b['Localitate și județ'],150);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[+\d\s().-]{7,25}$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15||b['Acord contact pentru ofertă']!=='Da')fail(400,'Verifică emailul, telefonul și acordul de contact.');
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest'}).format(new Date());if(day<today)fail(400,'Alege o dată de astăzi înainte.');
    const allowed=['nunta','corporate','targ-festival','petrecere-privata','altceva'];if(!allowed.includes(type))fail(400,'Tip de eveniment invalid.');
    const details={};for(const key of ['Ora de începere a servirii','Durata servirii în ore','Locație și adresă','Amplasarea barului','Companie sau organizator','Preferințe pentru meniu','Detalii suplimentare'])details[key]=str(b[key]||'',key==='Detalii suplimentare'?3000:300);
    const fingerprint=hashToken(JSON.stringify({name,email,phone,type,day,guests,city,details}));const existing=db.prepare("SELECT id FROM enquiries WHERE fingerprint=? AND created>datetime('now','-5 minutes')").get(fingerprint);
    if(!existing)db.prepare('INSERT INTO enquiries(name,email,phone,type,date,guests,city,details,fingerprint) VALUES(?,?,?,?,?,?,?,?,?)').run(name,email,phone,type,day,guests,city,JSON.stringify(details),fingerprint);
    return send(200,'<!doctype html><html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/assets/css/style.css"><title>Cerere înregistrată — com.</title><main class="page-cta"><h1>Mulțumim! Cererea ta este înregistrată.</h1><p>Vom lua legătura cu tine pentru detalii. Rezervarea nu este încă confirmată.</p><a class="page-button" href="/index.html">Înapoi la com.</a></main></html>','text/html; charset=utf-8');
   }
   if(path.startsWith('/api/')){
    auth();if(req.method!=='GET')csrf();
    if(path==='/api/me'&&req.method==='GET')return send(200,{user,csrf:session.csrf});
    if(path==='/api/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token=?').run(session.token);return send(200,{ok:true},undefined,{'Set-Cookie':`com_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${production?'; Secure':''}`});}
    if(path==='/api/password'&&req.method==='POST'){rate('password:'+user.id,5,900000);const b=await body(req),u=db.prepare('SELECT password FROM users WHERE id=?').get(user.id);if(!await passwordMatches(required(b.current,128),u.password))fail(400,'Parola curentă nu este corectă.');const next=required(b.next,128);if(next.length<12)fail(400,'Parola nouă trebuie să aibă minimum 12 caractere.');db.prepare('UPDATE users SET password=? WHERE id=?').run(await passwordHash(next),user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);audit(user,'parolă schimbată',user.id);return send(200,{ok:true});}
    if(path==='/api/data'&&req.method==='GET')return send(200,{enquiries:db.prepare('SELECT * FROM enquiries ORDER BY id DESC').all().map(e=>({...e,details:JSON.parse(e.details)})),events:db.prepare('SELECT * FROM events ORDER BY date,time').all(),ledger:db.prepare('SELECT * FROM ledger ORDER BY date DESC,id DESC').all(),tasks:db.prepare('SELECT * FROM tasks ORDER BY done,date,id DESC').all(),audit:db.prepare('SELECT a.*,u.email FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 25').all()});
    if(path==='/api/export'&&req.method==='GET'){owner();const data={version:1,exported:new Date().toISOString()};for(const table of ['enquiries','events','ledger','tasks','audit'])data[table]=db.prepare('SELECT * FROM '+table).all();return send(200,data,undefined,{'Content-Disposition':'attachment; filename="comcoffee-export.json"'});}
    const b=req.method==='GET'?{}:await body(req);
    const eventData=b=>{const day=date(b.date),time=required(b.time,5);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))fail(400,'Oră invalidă.');return [required(b.title,180),day,time,number(b.duration,.5,72),required(b.location,400),integer(b.guests,1,100000),money(b.price||0),str(b.notes||'',3000)];};
    const match=path.match(/^\/api\/enquiries\/(\d+)\/(accept|reject|reopen)$/);
    if(match&&req.method==='POST'){
     const e=db.prepare('SELECT * FROM enquiries WHERE id=?').get(match[1]);if(!e)fail(404,'Cerere inexistentă.');
     if(match[2]==='accept'){
      const old=db.prepare('SELECT id FROM events WHERE enquiry_id=?').get(e.id);if(old)return send(200,{id:old.id});
      if(e.status!=='new')fail(409,'Redeschide cererea înainte de acceptare.');const values=eventData(b);
      db.exec('BEGIN IMMEDIATE');try{const result=db.prepare('INSERT INTO events(enquiry_id,title,date,time,duration,location,guests,price,notes) VALUES(?,?,?,?,?,?,?,?,?)').run(e.id,...values);db.prepare("UPDATE enquiries SET status='accepted' WHERE id=?").run(e.id);audit(user,'acceptare cerere',e.id);db.exec('COMMIT');return send(201,{id:Number(result.lastInsertRowid)});}catch(error){db.exec('ROLLBACK');throw error;}
     }
     if(e.status==='accepted')fail(409,'Gestionează evenimentul din calendar.');db.prepare('UPDATE enquiries SET status=? WHERE id=?').run(match[2]==='reject'?'rejected':'new',e.id);audit(user,match[2],e.id);return send(200,{ok:true});
    }
    if(path==='/api/events'&&req.method==='POST'){const result=db.prepare('INSERT INTO events(title,date,time,duration,location,guests,price,notes) VALUES(?,?,?,?,?,?,?,?)').run(...eventData(b));audit(user,'eveniment nou',result.lastInsertRowid);return send(201,{ok:true});}
    const eventMatch=path.match(/^\/api\/events\/(\d+)$/);if(eventMatch&&req.method==='PATCH'){
     if(!db.prepare('SELECT id FROM events WHERE id=?').get(eventMatch[1]))fail(404,'Eveniment inexistent.');if(!['confirmed','cancelled'].includes(b.status))fail(400,'Stare invalidă.');db.prepare('UPDATE events SET title=?,date=?,time=?,duration=?,location=?,guests=?,price=?,notes=?,status=? WHERE id=?').run(...eventData(b),b.status,eventMatch[1]);audit(user,'actualizare eveniment',eventMatch[1]);return send(200,{ok:true});
    }
    const related=()=>{if(!b.event_id)return null;const id=integer(b.event_id,1,1e9);if(!db.prepare('SELECT id FROM events WHERE id=?').get(id))fail(400,'Eveniment inexistent.');return id;};
    if(path==='/api/ledger'&&req.method==='POST'){if(!['expense','income'].includes(b.kind))fail(400,'Tip invalid.');const amount=money(b.amount);if(amount<=0)fail(400,'Suma trebuie să fie pozitivă.');const r=db.prepare('INSERT INTO ledger(kind,amount,date,category,description,event_id,reference) VALUES(?,?,?,?,?,?,?)').run(b.kind,amount,date(b.date),required(b.category,80),required(b.description,500),related(),str(b.reference||'',150));audit(user,'înregistrare financiară',r.lastInsertRowid);return send(201,{ok:true});}
    const ledgerMatch=path.match(/^\/api\/ledger\/(\d+)$/);if(ledgerMatch&&req.method==='PATCH'){const old=db.prepare('SELECT * FROM ledger WHERE id=?').get(ledgerMatch[1]);if(!old)fail(404,'Înregistrare inexistentă.');if(!['expense','income'].includes(b.kind))fail(400,'Tip invalid.');const amount=money(b.amount);if(amount<=0)fail(400,'Suma trebuie să fie pozitivă.');db.prepare('UPDATE ledger SET kind=?,amount=?,date=?,category=?,description=?,event_id=?,reference=? WHERE id=?').run(b.kind,amount,date(b.date),required(b.category,80),required(b.description,500),related(),str(b.reference||'',150),old.id);audit(user,'corecție financiară',JSON.stringify({id:old.id,before:{kind:old.kind,amount:old.amount,date:old.date,category:old.category}}));return send(200,{ok:true});}
    if(path==='/api/tasks'&&req.method==='POST'){const r=db.prepare('INSERT INTO tasks(title,date,event_id) VALUES(?,?,?)').run(required(b.title,300),b.date?date(b.date):'',related());audit(user,'sarcină nouă',r.lastInsertRowid);return send(201,{ok:true});}
    const taskMatch=path.match(/^\/api\/tasks\/(\d+)$/);if(taskMatch&&req.method==='PATCH'){if(typeof b.done!=='boolean')fail(400,'Stare invalidă.');const r=db.prepare('UPDATE tasks SET done=? WHERE id=?').run(b.done?1:0,taskMatch[1]);if(!r.changes)fail(404,'Sarcină inexistentă.');audit(user,'sarcină actualizată',taskMatch[1]);return send(200,{ok:true});}
    if(path==='/api/users'){owner();if(req.method==='GET')return send(200,db.prepare('SELECT id,email,role,active FROM users ORDER BY id').all());if(req.method==='POST'){try{const id=await createUser(db,b.email,b.password);audit(user,'administrator nou',id);return send(201,{ok:true});}catch(e){fail(400,e.message.includes('UNIQUE')?'Acest email există deja.':e.message);}}}
    const userMatch=path.match(/^\/api\/users\/(\d+)$/);if(userMatch&&req.method==='PATCH'){owner();const u=db.prepare('SELECT * FROM users WHERE id=?').get(userMatch[1]);if(!u||u.role==='owner')fail(400,'Contul proprietarului nu poate fi dezactivat aici.');if(typeof b.active!=='boolean')fail(400,'Stare invalidă.');db.prepare('UPDATE users SET active=? WHERE id=?').run(b.active?1:0,u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);audit(user,'acces administrator',u.id);return send(200,{ok:true});}
    fail(404,'Resursă inexistentă.');
   }
   if(req.method!=='GET')fail(405,'Metodă nepermisă.');
   if(path==='/admin'||path==='/admin/'){if(!user)return redirect('/admin/login');return send(200,await readFile(resolve(here,'public/dashboard.html')),'text/html; charset=utf-8');}
   if(path==='/admin/login'){if(user)return redirect('/admin/');return send(200,await readFile(resolve(here,'public/login.html')),'text/html; charset=utf-8');}
   if(['/admin/app.js','/admin/admin.css','/admin/login.js','/admin/booking.js'].includes(path))return send(200,await readFile(resolve(here,'public',path.split('/').pop())),types[extname(path)]);
   if(path.startsWith('/admin'))fail(404,'Pagină inexistentă.');
   const decoded=decodeURIComponent(path==='/'?'/index.html':path);if(decoded.split(/[\\/]/).some(p=>p.startsWith('.')||p.includes(':')))fail(404,'Pagină inexistentă.');
   const file=await realpath(resolve(root,'.'+decoded));const rel=relative(root,file);if(rel.startsWith('..'+sep)||rel==='..'||!types[extname(file)]||!(await stat(file)).isFile())fail(404,'Pagină inexistentă.');
   let content=await readFile(file);if(rel==='contact.html'){
    content=content.toString().replace('</head>','<script src="/admin/booking.js" defer></script></head>').replace('https://formsubmit.co/comcoffee.events@gmail.com','/api/enquiries').replace(/Datele completate sunt transmise prin[\s\S]*?pentru a discuta oferta\./,'Datele completate sunt stocate în sistemul privat com. și folosite de echipă pentru a discuta oferta.');
   }
   return send(200,content,types[extname(file)]);
  }catch(e){const status=e.status||((e.code==='ENOENT'||e.code==='ENOTDIR')?404:500);if(status===500)console.error('Eroare server:',e.code||e.name);return send(status,{error:status===500?'Nu am putut salva. Încearcă din nou.':e.message});}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});base=origin||`http://${host}:${server.address().port}`;
 return {server,db,origin:base,close:()=>new Promise(resolve=>server.close(()=>{db.close();resolve();}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const app=await start();console.log(`com. — ${app.origin}/admin/`);console.log('Datele sunt private. Creează proprietarul cu: node admin/manage.mjs create-owner EMAIL');}
