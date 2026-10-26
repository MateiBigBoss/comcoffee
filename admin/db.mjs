import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export const hashToken=value=>createHash('sha256').update(value).digest('hex');
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+(await derive(password,salt,64)).toString('hex');}
export async function passwordMatches(password,hash){const [salt,key]=hash.split(':');const actual=await derive(password,salt,64);const expected=Buffer.from(key,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
export function database(path){
 mkdirSync(dirname(path),{recursive:true});const db=new DatabaseSync(path);
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','admin')),active INTEGER NOT NULL DEFAULT 1,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,type TEXT NOT NULL,date TEXT NOT NULL,guests INTEGER NOT NULL,city TEXT NOT NULL,details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','accepted','rejected')),fingerprint TEXT NOT NULL,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,enquiry_id INTEGER UNIQUE REFERENCES enquiries(id),title TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,duration REAL NOT NULL,location TEXT NOT NULL,guests INTEGER NOT NULL,price INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS ledger(id INTEGER PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('expense','income')),amount INTEGER NOT NULL CHECK(amount>0),date TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,event_id INTEGER REFERENCES events(id),reference TEXT NOT NULL DEFAULT '',created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY,title TEXT NOT NULL,date TEXT NOT NULL DEFAULT '',done INTEGER NOT NULL DEFAULT 0,event_id INTEGER REFERENCES events(id),created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),action TEXT NOT NULL,entity TEXT NOT NULL,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS events_date ON events(date); CREATE INDEX IF NOT EXISTS enquiries_created ON enquiries(created); CREATE INDEX IF NOT EXISTS ledger_date ON ledger(date);
 CREATE TABLE IF NOT EXISTS attachments(id INTEGER PRIMARY KEY,ledger_id INTEGER NOT NULL REFERENCES ledger(id),name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,data BLOB NOT NULL,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS supplies(id INTEGER PRIMARY KEY,event_id INTEGER NOT NULL REFERENCES events(id),name TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),unit TEXT NOT NULL,unit_price INTEGER NOT NULL CHECK(unit_price>=0),total INTEGER NOT NULL CHECK(total>=0),ledger_id INTEGER UNIQUE REFERENCES ledger(id),created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS attachments_ledger ON attachments(ledger_id);
 CREATE INDEX IF NOT EXISTS supplies_event ON supplies(event_id);
 CREATE TABLE IF NOT EXISTS imports(fingerprint TEXT PRIMARY KEY,event_id INTEGER NOT NULL REFERENCES events(id),created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); PRAGMA user_version=3;`);
 for(const table of ['ledger','supplies'])if(!db.prepare('PRAGMA table_info('+table+')').all().some(c=>c.name==='deleted'))db.exec('ALTER TABLE '+table+' ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0');
 for(const [name,type]of [['unit_price_4','INTEGER'],['notes',"TEXT NOT NULL DEFAULT ''"]])if(!db.prepare('PRAGMA table_info(supplies)').all().some(c=>c.name===name))db.exec('ALTER TABLE supplies ADD COLUMN '+name+' '+type);
 return db;
}
export async function createUser(db,email,password,role='admin'){
 email=String(email).trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Email invalid.');
 if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Parola trebuie să aibă între 12 și 128 de caractere.');
 if(!['owner','admin'].includes(role))throw Error('Rol invalid.');
 return Number(db.prepare('INSERT INTO users(email,password,role) VALUES(?,?,?)').run(email,await passwordHash(password),role).lastInsertRowid);
}
