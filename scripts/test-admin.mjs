import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {start} from '../admin/server.mjs';
import {createUser} from '../admin/db.mjs';
const dir=await mkdtemp(join(tmpdir(),'com-admin-test-')),dbPath=join(dir,'test.sqlite');
let app=await start({port:0,dbPath});
const password='Test-only-password-398!';
async function transport(url,options){
 if(!process.env.ADMIN_TEST_IN_PROCESS)return fetch(url,options);
 const req=Readable.from(options.body?[Buffer.from(options.body)]:[]);req.url=new URL(url).pathname;req.method=options.method;req.headers=Object.fromEntries(Object.entries(options.headers).map(([k,v])=>[k.toLowerCase(),v]));req.socket={remoteAddress:'127.0.0.1'};
 return new Promise(resolve=>{let code,headers;app.server.emit('request',req,{writeHead(status,h){code=status;headers=h;},end(value){resolve(new Response(value||null,{status:code,headers}));}});});
}
async function call(path,{method='GET',data,cookie,csrf,origin=app.origin}={}){return transport(app.origin+path,{method,redirect:'manual',headers:{Origin:origin,...(data!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});}
async function login(email){const r=await call('/api/login',{method:'POST',data:{email,password}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);const cookie=r.headers.get('set-cookie').split(';')[0];const me=await(await call('/api/me',{cookie})).json();return {cookie,csrf:me.csrf};}
try{
 await createUser(app.db,'owner@example.test',password,'owner');
 assert.equal((await call('/admin/')).status,303);
 assert.equal((await call('/api/data')).status,401);
 assert.equal((await call('/admin/data/comcoffee.sqlite')).status,404);
 {const r=await call('/admin/reports.js');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);assert.match(await r.text(),/export function buildReport/);}
 {const r=await call('/admin/events.js');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);assert.match(await r.text(),/export function eventsView/);}
 assert.equal((await call('/api/login',{method:'POST',data:{email:'owner@example.test',password:'incorrect-password'}})).status,401);
 const owner=await login('owner@example.test');
 assert.equal((await call('/api/tasks',{method:'POST',...owner,data:null})).status,400);
 assert.equal((await call('/api/tasks',{method:'POST',...owner,data:[]})).status,400);
 assert.equal((await call('/api/tasks',{method:'POST',cookie:owner.cookie,data:{title:'bad'}})).status,403);
 assert.equal((await call('/api/tasks',{method:'POST',...owner,origin:'https://evil.example',data:{title:'bad'}})).status,403);
 const day='2099-06-20';
 const enquiry={name:'Client test',email:'client@example.test',Telefon:'0712345678','Tip eveniment':'nunta','Data evenimentului':day,'Număr estimat de invitați':'80','Localitate și județ':'Cluj','Acord contact pentru ofertă':'Da','Detalii suplimentare':'Test local, fără email'};
 assert.equal((await call('/api/enquiries',{method:'POST',data:enquiry})).status,200);
 assert.equal((await call('/api/enquiries',{method:'POST',data:enquiry})).status,200);
 let data=await(await call('/api/data',owner)).json();assert.equal(data.enquiries.length,1);assert.equal(data.enquiries[0].details['Detalii suplimentare'],enquiry['Detalii suplimentare']);
 const event={title:'Eveniment test',date:day,time:'10:00',duration:4,location:'Cluj',guests:80,price:2500,notes:'Test'};
 assert.equal((await call('/api/enquiries/1/accept',{method:'POST',...owner,data:{...event,date:'invalid'}})).status,400);
 assert.equal((await call('/api/enquiries/1/accept',{method:'POST',...owner,data:event})).status,201);
 assert.equal((await call('/api/enquiries/1/accept',{method:'POST',...owner,data:event})).status,200);
 data=await(await call('/api/data',owner)).json();assert.equal(data.events.length,1);assert.equal(data.enquiries[0].status,'accepted');assert.equal(data.events[0].price,250000);
 const ledger={kind:'expense',amount:123.45,date:day,category:'Cafea',description:'Test',event_id:1};
 assert.equal((await call('/api/ledger',{method:'POST',...owner,data:{...ledger,amount:-1}})).status,400);
 assert.equal((await call('/api/ledger',{method:'POST',...owner,data:ledger})).status,201);
 assert.equal((await call('/api/ledger/1',{method:'PATCH',...owner,data:{...ledger,amount:125}})).status,200);
 assert.equal((await call('/api/tasks',{method:'POST',...owner,data:{title:'Pregătire',date:day,event_id:1}})).status,201);
 assert.equal((await call('/api/tasks/1',{method:'PATCH',...owner,data:{done:true}})).status,200);
 assert.equal((await call('/api/users',{method:'POST',...owner,data:{email:'admin@example.test',password,role:'owner'}})).status,201);
 const admin=await login('admin@example.test');
 assert.equal((await call('/api/users',admin)).status,403);assert.equal((await call('/api/export',admin)).status,403);
 assert.equal((await call('/api/users/1',{method:'PATCH',...owner,data:{active:false}})).status,400);
 assert.equal((await call('/api/users/2',{method:'PATCH',...owner,data:{active:false}})).status,200);
 assert.equal((await call('/api/data',admin)).status,401);
 const exported=await(await call('/api/export',owner)).json();assert.equal(exported.users,undefined);assert.equal(exported.sessions,undefined);

 const supply={name:'Lapte',quantity:2.5,unit:'litri',unit_price:8.99};
 assert.equal((await call('/api/events/1/supplies',{method:'POST',...owner,data:supply})).status,201);
 assert.equal((await call('/api/events/1/supplies',{method:'POST',...owner,data:{...supply,quantity:-1}})).status,400);
 assert.equal((await call('/api/events/1/supplies',{method:'POST',...owner,data:{...supply,quantity:1.0001}})).status,400);
 assert.equal(app.db.prepare('SELECT total FROM supplies WHERE id=1').get().total,2248);
 assert.equal((await call('/api/supplies/1',{method:'PATCH',...owner,data:{...supply,quantity:3}})).status,200);
 const pay={date:day,category:'Consumabile',reference:'Test receipt'};
 const paid=await call('/api/supplies/1/expense',{method:'POST',...owner,data:pay});assert.equal(paid.status,201);const payment=await paid.json();
 const repeat=await call('/api/supplies/1/expense',{method:'POST',...owner,data:pay});assert.equal((await repeat.json()).id,payment.id);
 assert.equal(app.db.prepare('SELECT amount FROM ledger WHERE id=?').get(payment.id).amount,2697);
 assert.equal((await call('/api/supplies/1',{method:'PATCH',...owner,data:supply})).status,409);
 assert.equal((await call('/api/ledger/'+payment.id,{method:'PATCH',...owner,data:{...ledger,amount:5}})).status,409);
 const pdf=Buffer.from('%PDF-1.4\nTest fixture\n%%EOF');
 const upload=(data,name='bon.pdf',auth=owner,ledgerId=payment.id)=>transport(app.origin+'/api/ledger/'+ledgerId+'/attachments',{method:'POST',headers:{Origin:app.origin,Cookie:auth.cookie||'','X-CSRF-Token':auth.csrf||'','X-File-Name':encodeURIComponent(name),'Content-Type':'application/octet-stream'},body:data});
 assert.equal((await upload(pdf,'bon.pdf',{})).status,401);
 assert.equal((await upload(pdf,'bon.pdf',{cookie:owner.cookie})).status,403);
 assert.equal((await upload(Buffer.from('<svg>unsafe</svg>'),'bon.svg')).status,400);
 assert.equal((await upload(pdf,'bon.jpg')).status,400);
 assert.equal((await upload(Buffer.alloc(10*1024*1024+1),'large.pdf')).status,413);
 const uploaded=await upload(pdf);assert.equal(uploaded.status,201);const file=await uploaded.json();
 assert.equal((await call('/api/attachments/'+file.id)).status,401);
 const downloaded=await call('/api/attachments/'+file.id,owner);assert.equal(downloaded.status,200);assert.match(downloaded.headers.get('content-disposition'),/^attachment/);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),pdf);
 const income=await(await call('/api/ledger',{method:'POST',...owner,data:{...ledger,kind:'income',amount:500,category:'Avans eveniment'}})).json();
 assert.equal((await upload(pdf,'factura.pdf',owner,income.id)).status,201);
 assert.equal((await call('/api/ledger/'+payment.id+'/delete',{method:'POST',...owner,data:{}})).status,200);
 assert.equal(app.db.prepare('SELECT deleted FROM supplies WHERE id=1').get().deleted,1);
 assert.equal((await call('/api/attachments/'+file.id,owner)).status,200);
 assert.equal((await call('/api/supplies/1/restore',{method:'POST',...owner,data:{}})).status,200);
 assert.equal(app.db.prepare('SELECT deleted FROM ledger WHERE id=?').get(payment.id).deleted,0);
 const listing=await(await call('/api/data',owner)).json();assert.equal(listing.attachments[0].data,undefined);
 assert.equal((await call('/api/password',{method:'POST',...owner,data:{current:password,next:'New-test-password-123!'}})).status,200);
 assert.equal((await call('/api/data',owner)).status,401);
 await app.close();app=await start({port:0,dbPath});
 assert.equal(app.db.prepare('SELECT amount FROM ledger').get().amount,12500);
 assert.equal(app.db.prepare('SELECT count(*) AS n FROM attachments').get().n,2);
 assert.equal(app.db.prepare('SELECT total FROM supplies').get().total,2697);
 assert.equal(app.db.prepare('SELECT done FROM tasks').get().done,1);
 assert.equal(app.db.prepare('SELECT count(*) AS n FROM events').get().n,1);
 const contact=await(await call('/contact.html')).text();assert.match(contact,/action="\/api\/enquiries"/);assert.match(contact,/booking.js/);
 await assert.rejects(start({port:0,dbPath,production:true}),/HTTPS/);
 console.log('PASS admin: access, roles, CSRF, enquiries, idempotent acceptance, calendar, finances, tasks, private receipts, supply totals, duplicate prevention, sessions and persistence');
}finally{await app.close();await rm(dir,{recursive:true,force:true});}
