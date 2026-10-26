import {Worker} from 'node:worker_threads';
const problem=message=>{throw Object.assign(Error(message),{status:400});};
export function csvRows(text){
 const rows=[];let row=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');const delimiter=text.split(/\r?\n/).find(l=>/Articol|Cantitate/i.test(l))?.includes(';')?';':',';
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;if(cell.length>10000||rows.length>2000||row.length>100)problem('Tabel prea mare (maximum 2.000 rânduri și 100 coloane).');}
 if(quoted)problem('CSV invalid: ghilimele neînchise.');if(cell||row.length){row.push(cell);rows.push(row);}return rows;
}
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.:]/g,'').trim();
function decimal(value,maxPlaces){const s=String(value??'').trim().replace(/\s/g,'').replace(',','.');if(!new RegExp('^\\d+(?:\\.\\d{1,'+maxPlaces+'})?$').test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
export function parseRows(rows){
 const header=rows.findIndex(r=>r.some(c=>norm(c)==='articol')&&r.some(c=>norm(c)==='cantitate'));
 if(header<0)problem('Nu am găsit coloanele Articol și Cantitate. Folosește structura tabelului de cheltuieli.');
 const heads=rows[header].map(norm),col=(test)=>heads.findIndex(test),name=col(h=>h==='articol'),qty=col(h=>h==='cantitate'),unit=col(h=>h==='um'||h==='unitate'),price=col(h=>h.includes('pret unitar fara tva')),total=col(h=>h==='total (lei)'||h==='total'),vendor=col(h=>h==='furnizor'),notes=col(h=>h==='observatii');
 if(price<0||unit<0)problem('Lipsesc U.M. sau Pret unitar fara TVA (lei).');
 const result={title:'',date:'',items:[],warnings:[],blankRows:0,total:0};
 for(const r of rows.slice(0,header)){if(norm(r[0])==='nume eveniment')result.title=String(r[1]??'').trim().slice(0,180);if(norm(r[0])==='data eveniment'){const s=String(r[1]??'').trim(),m=s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);result.date=m?`${m[3]}-${m[2]}-${m[1]}`:s.slice(0,10);}}
 for(let i=header+1;i<rows.length;i++){
  const r=rows[i];if(r.every(c=>String(c??'').trim()==='')){result.blankRows++;continue;}
  const label=String(r[name]??'').trim();if(!label)continue;
  if(/^(total|din care|tva)/.test(norm(label)))continue;
  const skip=why=>result.warnings.push(`Rând ${i+1} · ${label}: ${why}`);
  if(r.some(c=>/^#(REF!|VALUE!|DIV\/0!|N\/A|NAME\?|NUM!|SPILL!|ERROR!)/.test(String(c)))){skip('eroare în formulă; nu se importă.');continue;}
  const q=decimal(r[qty],3),p=decimal(r[price],4),u=String(r[unit]??'').trim();
  if(q===null||p===null||!u){skip('cantitate, unitate sau preț necompletat / invalid; nu se importă.');continue;}
  if(q<=0||q>1000000||p>10000000||label.length>180||u.length>30){skip('valoare în afara limitelor; nu se importă.');continue;}
  const quantity=Math.round(q*1000),unit_price_4=Math.round(p*10000),amount=Math.round(quantity*unit_price_4/100000);
  if(!Number.isSafeInteger(quantity*unit_price_4)||amount>1000000000){skip('total prea mare; nu se importă.');continue;}
  const supplied=total<0?null:decimal(r[total],2);if(supplied!==null&&Math.abs(Math.round(supplied*100)-amount)>1)result.warnings.push(`Rând ${i+1} · ${label}: totalul este recalculat fără TVA din cantitate × preț.`);
  result.items.push({name:label,quantity,unit:u,unit_price_4,total:amount,notes:[vendor>=0&&r[vendor]?`Furnizor: ${r[vendor]}`:'',notes>=0?r[notes]:''].filter(Boolean).join(' · ').slice(0,1000)});result.total+=amount;
 }
 if(!result.items.length)problem('Nu există materiale complete și valide pentru import.');if(result.items.length>300)problem('Maximum 300 de materiale per import.');return result;
}
export function googleExportURL(link){let u;try{u=new URL(link);}catch{problem('Link Google Sheets invalid.');}const match=u.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,100})(?:\/|$)/);if(u.protocol!=='https:'||u.hostname!=='docs.google.com'||u.port||u.username||u.password||!match)problem('Folosește un link https://docs.google.com/spreadsheets/d/…');const gid=u.searchParams.get('gid')||new URLSearchParams(u.hash.slice(1)).get('gid')||'0';if(!/^\d{1,20}$/.test(gid))problem('Foaie Google invalidă.');return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;}
export async function googleRows(link){
 let url=googleExportURL(link);const signal=AbortSignal.timeout(15000);
 for(let i=0;i<4;i++){const response=await fetch(url,{redirect:'manual',signal});if([301,302,303,307,308].includes(response.status)){const next=new URL(response.headers.get('location'),url);if(next.protocol!=='https:'||next.port||next.username||next.password||!(next.hostname==='docs.google.com'||next.hostname.endsWith('.googleusercontent.com')))problem('Tabel privat sau redirecționare neacceptată. Încarcă exportul Excel.');url=next.href;continue;}if(!response.ok||!response.headers.get('content-type')?.includes('text/csv'))problem('Tabelul nu este accesibil. Încarcă exportul Excel sau oferă acces de citire prin link unei copii.');const parts=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>2*1024*1024)problem('Tabelul depășește 2 MB.');parts.push(chunk);}return csvRows(Buffer.concat(parts).toString('utf8'));}problem('Prea multe redirecționări. Încarcă un fișier Excel.');
}
export function excelSheets(buffer){
 // Bound the ZIP's declared expansion before handing it to the isolated reader.
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)return Promise.reject(Object.assign(Error('Excel invalid.'),{status:400}));
 const count=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16),expanded=0;
 if(count>500)return Promise.reject(Object.assign(Error('Excel prea complex.'),{status:400}));
 for(let i=0;i<count;i++){if(offset+46>buffer.length||buffer.readUInt32LE(offset)!==0x02014b50)return Promise.reject(Object.assign(Error('Excel invalid.'),{status:400}));expanded+=buffer.readUInt32LE(offset+24);offset+=46+buffer.readUInt16LE(offset+28)+buffer.readUInt16LE(offset+30)+buffer.readUInt16LE(offset+32);if(expanded>20*1024*1024)return Promise.reject(Object.assign(Error('Excel depășește 20 MB decomprimat.'),{status:400}));}
 return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./xlsx-worker.mjs',import.meta.url),{workerData:buffer,resourceLimits:{maxOldGenerationSizeMb:96,maxYoungGenerationSizeMb:16}});
 const timer=setTimeout(()=>{worker.terminate();reject(Object.assign(Error('Excel prea complex. Exportă foaia ca CSV.'),{status:400}));},10000);
 const finish=(error,value)=>{clearTimeout(timer);worker.terminate();error?reject(Object.assign(Error(error),{status:400})):resolve(value);};worker.once('message',m=>finish(m.error,m.sheets));worker.once('error',()=>finish('Fișier Excel invalid sau prea complex.'));worker.once('exit',code=>{if(code)finish('Nu am putut citi fișierul Excel.');});
});}
