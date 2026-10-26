import {database,createUser,passwordHash} from './db.mjs';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),command=process.argv[2],email=process.argv[3]?.trim().toLowerCase();
if(!['create-owner','reset-password','backup'].includes(command)){console.log('node admin/manage.mjs create-owner EMAIL\nnode admin/manage.mjs reset-password EMAIL\nnode admin/manage.mjs backup');process.exit(1);}
const db=database(process.env.DB_PATH||resolve(here,'data/comcoffee.sqlite'));
try{
 if(command==='backup'){const target=resolve(here,'data','backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');db.prepare('VACUUM INTO ?').run(target);console.log('Backup creat: '+target);}
 else{
  if(!email)throw Error('Specifică adresa de email în comandă.');if(command==='create-owner'&&db.prepare("SELECT id FROM users WHERE role='owner'").get())throw Error('Proprietarul există deja. Creează administratori din dashboard.');if(command==='reset-password'&&!db.prepare('SELECT id FROM users WHERE email=?').get(email))throw Error('Cont inexistent.');if(!process.stdin.isTTY)throw Error('Rulează comanda într-un terminal interactiv.');
  let muted=false;const output=new Writable({write(chunk,encoding,callback){if(!muted)process.stdout.write(chunk,encoding);callback();}});const rl=createInterface({input:process.stdin,output,terminal:true});const ask=async label=>{process.stdout.write(label);muted=true;const value=await rl.question('');muted=false;process.stdout.write('\n');return value;};
  const password=await ask('Parolă (minimum 12 caractere, ascunsă): '),again=await ask('Repetă parola: ');rl.close();if(password!==again)throw Error('Parolele nu coincid.');if(password.length<12||password.length>128)throw Error('Folosește între 12 și 128 de caractere.');
  if(command==='create-owner')await createUser(db,email,password,'owner');else{const u=db.prepare('SELECT id FROM users WHERE email=?').get(email);db.exec('BEGIN');try{db.prepare('UPDATE users SET password=? WHERE id=?').run(await passwordHash(password),u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}console.log('Contul este pregătit. Deschide http://127.0.0.1:4194/admin/');
 }
}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
