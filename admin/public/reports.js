/* Profit & statistics. buildReport() is pure (no DOM) so scripts/test-admin-reports.mjs can check the math;
   reportsView() draws the page with helpers passed from app.js. All amounts are integer bani (RON × 100). */

const shiftMonth=(key,delta)=>{const [y,m]=key.split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return d.toISOString().slice(0,7);};
const lastDay=key=>{const [y,m]=key.split('-').map(Number);return key+'-'+String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,'0');};
const dayDiff=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const addDays=(day,n)=>new Date(Date.parse(day)+n*864e5).toISOString().slice(0,10);
export const TYPE_LABELS={nunta:'Nuntă',corporate:'Corporate','targ-festival':'Târg / festival','petrecere-privata':'Eveniment privat',altceva:'Altă ocazie',manual:'Adăugat manual'};

/* Period presets. `today` is YYYY-MM-DD in Europe/Bucharest. */
export function periodRange(preset,today,custom={},data={}){
 const month=today.slice(0,7),[y,m]=month.split('-').map(Number);
 if(preset==='month')return {from:month+'-01',to:lastDay(month),label:'luna aceasta'};
 if(preset==='quarter'){const q=Math.floor((m-1)/3)*3+1,start=y+'-'+String(q).padStart(2,'0');return {from:start+'-01',to:lastDay(shiftMonth(start,2)),label:'trimestrul acesta'};}
 if(preset==='year')return {from:y+'-01-01',to:y+'-12-31',label:'anul '+y};
 if(preset==='12m')return {from:shiftMonth(month,-11)+'-01',to:lastDay(month),label:'ultimele 12 luni'};
 if(preset==='custom'&&custom.from&&custom.to&&custom.from<=custom.to)return {from:custom.from,to:custom.to,label:'intervalul ales'};
 const dates=[...(data.ledger||[]).filter(e=>!e.deleted).map(e=>e.date),...(data.events||[]).map(e=>e.date)].sort();
 return {from:dates[0]||month+'-01',to:dates.length?(dates.at(-1)>today?dates.at(-1):today):lastDay(month),label:'de la început'};
}
/* The equally long period right before, for "vs. perioada anterioară". */
export function previousRange({from,to}){const length=dayDiff(from,to);const end=addDays(from,-1);return {from:addDays(end,-length),to:end};}

/* mode 'event': money linked to an event counts on the event's date (true profit per event);
   costs without an event count on their payment date. mode 'cash': everything on its payment date. */
export function buildReport(data,{from,to,mode='event',today}){
 const events=data.events||[],ledger=(data.ledger||[]).filter(e=>!e.deleted),byId=new Map(events.map(e=>[e.id,e]));
 const enquiryType=new Map((data.enquiries||[]).map(q=>[q.id,q.type]));
 const when=e=>mode==='event'&&byId.has(e.event_id)?byId.get(e.event_id).date:e.date;
 const inRange=d=>d>=from&&d<=to;
 const entries=ledger.filter(e=>inRange(when(e)));
 const sum=(list,kind)=>list.filter(e=>e.kind===kind).reduce((n,e)=>n+e.amount,0);
 const income=sum(entries,'income'),expense=sum(entries,'expense'),general=entries.filter(e=>e.kind==='expense'&&!byId.has(e.event_id)).reduce((n,e)=>n+e.amount,0);

 // Monthly buckets: the selected months, at least 6 for context, at most the latest 24.
 let first=from.slice(0,7);const last=to.slice(0,7);
 if(shiftMonth(first,5)>last)first=shiftMonth(last,-5);
 const keys=[];for(let k=first;k<=last;k=shiftMonth(k,1))keys.push(k);
 const months=keys.slice(-24).map(key=>{const list=ledger.filter(e=>when(e).startsWith(key));const i=sum(list,'income'),x=sum(list,'expense');return {key,income:i,expense:x,profit:i-x,inPeriod:key>=from.slice(0,7)&&key<=last};});
 let running=0;for(const month of months){if(month.inPeriod)running+=month.profit;month.cumulative=month.inPeriod?running:null;}

 const totals={};for(const e of entries.filter(e=>e.kind==='expense'))totals[e.category]=(totals[e.category]||0)+e.amount;
 const categories=Object.entries(totals).map(([name,total])=>({name,total,share:expense?total/expense:0})).sort((a,b)=>b.total-a.total);

 // Every event dated in the period, with all of its payments whatever their date.
 const rows=events.filter(e=>inRange(e.date)).map(event=>{
  const linked=ledger.filter(e=>e.event_id===event.id),inc=sum(linked,'income'),exp=sum(linked,'expense'),profit=inc-exp;
  const receivable=event.status==='confirmed'?Math.max(0,(event.price||0)-inc):0;
  // A past event still waiting for money is not a loss yet: it is 'owed', with an expected profit.
  const status=event.status==='cancelled'?'cancelled':event.date>today?'upcoming':receivable>0?'owed':!inc&&!exp?'empty':profit>=0?'profit':'loss';
  return {event,type:enquiryType.get(event.enquiry_id)||'manual',income:inc,expense:exp,profit,margin:inc?profit/inc:null,guests:event.guests,
   perGuest:event.guests?Math.round(profit/event.guests):0,costPerGuest:event.guests?Math.round(exp/event.guests):0,
   receivable,expected:inc+receivable-exp,status};
 });
 const typeTotals=new Map();for(const r of rows.filter(r=>r.status!=='cancelled'&&r.event.date<=today)){ /* only events that took place */const t=typeTotals.get(r.type)||{type:r.type,label:TYPE_LABELS[r.type]||r.type,count:0,income:0,expense:0,profit:0};t.count++;t.income+=r.income;t.expense+=r.expense;t.profit+=r.profit;typeTotals.set(r.type,t);}
 const types=[...typeTotals.values()].sort((a,b)=>b.profit-a.profit);
 const done=rows.filter(r=>r.status==='profit'||r.status==='loss');
 const owedAll=events.filter(e=>e.status==='confirmed').map(e=>({event:e,owed:Math.max(0,(e.price||0)-sum(ledger.filter(x=>x.event_id===e.id),'income'))})).filter(x=>x.owed>0);

 const insights=[];
 const best=[...done].sort((a,b)=>b.profit-a.profit)[0];
 if(best&&best.profit>0)insights.push({tone:'good',title:'Cel mai profitabil',text:`${best.event.title}: ${fmt(best.profit)} profit`+(best.margin!==null?`, marjă ${pct(best.margin)}.`:'.'),event:best.event});
 const losses=done.filter(r=>r.status==='loss');
 if(losses.length)insights.push({tone:'warn',title:losses.length===1?'Un eveniment pe pierdere':`${losses.length} evenimente pe pierdere`,text:losses.slice(0,3).map(r=>`${r.event.title} (${fmt(r.profit)})`).join(', ')+'. Verifică prețul sau costurile.',event:losses[0].event});
 const pastOwed=owedAll.filter(x=>x.event.date<=today);
 if(pastOwed.length)insights.push({tone:'warn',title:'Bani de recuperat',text:`${fmt(pastOwed.reduce((n,x)=>n+x.owed,0))} de încasat de la ${pastOwed.length===1?'un eveniment care a avut loc':pastOwed.length+' evenimente care au avut loc'}.`,event:pastOwed[0].event});
 const futureOwed=owedAll.filter(x=>x.event.date>today);
 if(futureOwed.length)insights.push({tone:'info',title:'Urmează să încasezi',text:`${fmt(futureOwed.reduce((n,x)=>n+x.owed,0))} din ${futureOwed.length===1?'evenimentul viitor':futureOwed.length+' evenimente viitoare'}, conform prețurilor convenite.`});
 const noCosts=rows.filter(r=>r.status!=='cancelled'&&r.event.date<=today&&r.income>0&&r.expense===0);
 if(noCosts.length)insights.push({tone:'info',title:'Costuri lipsă?',text:`${noCosts.slice(0,3).map(r=>r.event.title).join(', ')} ${noCosts.length===1?'are încasări, dar nicio cheltuială':'au încasări, dar nicio cheltuială'}. Profitul poate părea mai mare decât e.`,event:noCosts[0].event});
 if(categories[0]&&expense)insights.push({tone:'info',title:'Unde merg banii',text:`${categories[0].name} — ${pct(categories[0].share)} din cheltuieli (${fmt(categories[0].total)}).`});

 return {from,to,mode,months,categories,types,rows,insights,
  totals:{income,expense,profit:income-expense,margin:income?(income-expense)/income:null,general,
   events:rows.filter(r=>r.status!=='cancelled').length,avgProfit:done.length?Math.round(done.reduce((n,r)=>n+r.profit,0)/done.length):null,
   receivable:rows.reduce((n,r)=>n+r.receivable,0),guests:rows.filter(r=>r.status!=='cancelled').reduce((n,r)=>n+r.guests,0)}};
}
const fmt=n=>new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON',maximumFractionDigits:0}).format(n/100);
const pct=x=>new Intl.NumberFormat('ro-RO',{style:'percent',maximumFractionDigits:0}).format(x);

/* CSV for Excel in Romania: semicolon separator, decimal comma, UTF-8 BOM. */
export function reportCsv(report,labelOf=s=>s){
 const lei=n=>(n/100).toFixed(2).replace('.',','),q=v=>{const s=String(v??'');return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 const lines=[['Eveniment','Data','Tip','Invitați','Încasat (lei)','Cheltuieli (lei)','Profit (lei)','Marjă','De încasat (lei)','Stare'].join(';')];
 for(const r of report.rows)lines.push([r.event.title,r.event.date,TYPE_LABELS[r.type]||r.type,r.guests,lei(r.income),lei(r.expense),lei(r.profit),r.margin===null?'':Math.round(r.margin*100)+'%',lei(r.receivable),labelOf(r.status)].map(q).join(';'));
 lines.push('',['Total perioadă '+report.from+' – '+report.to,'','','',lei(report.totals.income),lei(report.totals.expense),lei(report.totals.profit),report.totals.margin===null?'':Math.round(report.totals.margin*100)+'%',lei(report.totals.receivable),''].map(q).join(';'));
 return '﻿'+lines.join('\r\n');
}

/* ---------------------------------------------------------------- view */
const STATUS={profit:'Profit',loss:'Pierdere',owed:'De încasat',upcoming:'Urmează',empty:'Fără plăți',cancelled:'Anulat'};
const PRESETS=[['month','Luna'],['quarter','Trimestrul'],['year','Anul'],['12m','12 luni'],['all','Tot'],['custom','Interval']];
const ui={preset:'year',mode:'event',from:'',to:'',sort:'date',dir:-1,filter:'all',search:''};

export function reportsView(ctx){
 const {state,el,btn,cash,pretty,panel,empty,today,content}=ctx;
 const range=periodRange(ui.preset,today(),ui,state),report=buildReport(state,{...range,mode:ui.mode,today:today()});
 const before=ui.preset==='all'?null:buildReport(state,{...previousRange(range),mode:ui.mode,today:today()}).totals;
 const prev=before&&(before.income||before.expense)?before:null; // no comparison against an empty period
 const rerender=()=>{content.replaceChildren();reportsView(ctx);};

 // Toolbar: period, calculation basis, export, add.
 const tools=el('div',undefined,'report-tools'),periods=el('div',undefined,'segmented report-periods');periods.setAttribute('role','group');periods.setAttribute('aria-label','Perioada');
 for(const [value,label]of PRESETS){const b=btn(label,()=>{ui.preset=value;if(value==='custom'&&!ui.from){ui.from=range.from;ui.to=range.to;}rerender();});b.setAttribute('aria-pressed',String(ui.preset===value));periods.append(b);}
 tools.append(periods);
 if(ui.preset==='custom'){const box=el('div',undefined,'report-dates');for(const [key,label]of [['from','De la'],['to','Până la']]){const l=el('label',label),i=el('input');i.type='date';i.value=ui[key];i.addEventListener('change',()=>{ui[key]=i.value;if(ui.from&&ui.to&&ui.from<=ui.to)rerender();});l.append(i);box.append(l);}tools.append(box);}
 const side=el('div',undefined,'report-actions'),basis=el('div',undefined,'segmented report-basis');basis.setAttribute('role','group');basis.setAttribute('aria-label','Calculează după');
 for(const [value,label,hint]of [['event','Pe evenimente','Banii unui eveniment intră la data evenimentului'],['cash','Pe plăți','Fiecare plată intră la data ei']]){const b=btn(label,()=>{ui.mode=value;rerender();});b.title=hint;b.setAttribute('aria-pressed',String(ui.mode===value));basis.append(b);}
 const exportBtn=btn('Export Excel ↧',()=>{const blob=new Blob([reportCsv(report,s=>STATUS[s]||s)],{type:'text/csv;charset=utf-8'}),a=el('a');a.href=URL.createObjectURL(blob);a.download=`raport-com-${range.from}-${range.to}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 side.append(basis,exportBtn,btn('+ Operațiune',()=>ctx.ledgerForm(),'primary'));tools.append(side);content.append(tools);
 content.append(el('p',`${capital(range.label)} · ${pretty(range.from)} – ${pretty(range.to)} · `+(ui.mode==='event'?'banii fiecărui eveniment sunt socotiți la data evenimentului; costurile generale, la data plății.':'fiecare încasare și cheltuială e socotită la data plății (fluxul de numerar).'),'muted report-caption'));

 // KPI cards.
 const t=report.totals,kpis=el('div',undefined,'report-kpis');
 const delta=(now,before,goodUp=true)=>{if(!prev||before===undefined)return null;if(!before&&!now)return null;const d=el('p',undefined,'delta');if(!before){d.textContent='nou față de perioada anterioară';return d;}const change=(now-before)/Math.abs(before),up=change>=0;d.textContent=(up?'▲ ':'▼ ')+pct(Math.abs(change))+' vs. perioada anterioară';d.classList.add((up===goodUp)?'good':'bad');return d;};
 const kpi=(label,value,cls,extra)=>{const c=el('div',undefined,'kpi '+(cls||''));c.append(el('span',label),el('strong',value));for(const x of extra||[])if(x)c.append(x);kpis.append(c);};
 kpi(t.profit<0?'Pierdere':'Profit',cash(t.profit),'kpi-profit'+(t.profit<0?' negative':''),[el('small',t.margin===null?'Fără încasări în perioadă':'Marjă '+pct(t.margin)),delta(t.profit,prev?.profit)]);
 kpi('Încasări',cash(t.income),'kpi-income',[delta(t.income,prev?.income)]);
 kpi('Cheltuieli',cash(t.expense),'kpi-expense',[el('small','din care generale '+cash(t.general)),delta(t.expense,prev?.expense,false)]);
 content.append(kpis);
 const strip=el('div',undefined,'report-strip');for(const [label,value]of [['Evenimente',String(t.events)],['Profit mediu / eveniment',t.avgProfit===null?'—':cash(t.avgProfit)],['Invitați serviți',new Intl.NumberFormat('ro-RO').format(t.guests)],['De încasat',cash(t.receivable)]]){const s=el('div');s.append(el('span',label),el('strong',value));strip.append(s);}content.append(strip);

 if(!state.ledger.length&&!state.events.length){const p=panel('Începe cu primele cifre');empty(p,'Adaugă un eveniment și înregistrează încasările și cheltuielile lui. Graficele și profitul apar automat.');content.append(p);return;}

 // Monthly chart.
 const chartPanel=panel('Încasări, cheltuieli și profit pe luni'),legend=el('div',undefined,'chart-legend');
 for(const [cls,label]of [['income','Încasări'],['expense','Cheltuieli'],['profit','Profit cumulat']]){const i=el('span',label);i.className='legend-'+cls;legend.append(i);}
 chartPanel.querySelector('.panel-heading').append(legend);
 // Drawn at the real width so labels stay readable on phones; redrawn when the panel resizes.
 const holder=el('div',undefined,'chart-holder');chartPanel.append(holder);let drawn=0;
 const drawChart=()=>{const w=Math.round(holder.clientWidth);if(!w||Math.abs(w-drawn)<30)return;drawn=w;holder.replaceChildren(chart(report.months,el,cash,w));};
 new ResizeObserver(drawChart).observe(holder);
 const details=el('details',undefined,'chart-table'),sum=el('summary','Vezi cifrele lunare');details.append(sum);const table=el('table'),head=el('tr');for(const h of ['Luna','Încasări','Cheltuieli','Profit'])head.append(el('th',h));const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');
 for(const m of report.months.filter(m=>m.inPeriod)){const r=el('tr');[monthName(m.key,true),cash(m.income),cash(m.expense),cash(m.profit)].forEach((v,i)=>{const c=el('td',v);c.dataset.label=['Luna','Încasări','Cheltuieli','Profit'][i];if(i===3)c.className='money '+(m.profit<0?'expense':'income');r.append(c);});body.append(r);}
 table.append(body);details.append(table);chartPanel.append(details);content.append(chartPanel);drawChart();

 // Categories + insights.
 const cols=el('div',undefined,'report-columns'),cat=panel('Unde merg cheltuielile');
 if(!report.categories.length)empty(cat,'Nicio cheltuială în perioada aleasă.');
 for(const c of report.categories){const r=el('div',undefined,'cat-row'),top=el('div',undefined,'cat-top');top.append(el('span',c.name),el('strong',cash(c.total)));const track=el('div',undefined,'cat-track'),fill=el('span');fill.style.width=Math.max(2,c.share*100)+'%';track.append(fill);r.append(top,track,el('small',pct(c.share)+' din cheltuieli'));cat.append(r);}
 const notes=panel('Ce merită știut');
 if(!report.insights.length)empty(notes,'Când ai mai multe evenimente și plăți, aici apar observații utile.');
 for(const i of report.insights){const n=el('div',undefined,'insight '+i.tone);n.append(el('strong',i.title),el('p',i.text));if(i.event)n.append(btn('Deschide finanțele →',()=>ctx.eventFinance(i.event),'link'));notes.append(n);}
 cols.append(cat,notes);content.append(cols);

 // By event type.
 if(report.types.length){const p=panel('Pe tip de eveniment'),grid=el('div',undefined,'type-grid');for(const x of report.types){const c=el('div',undefined,'type-card');c.append(el('span',x.label),el('strong',cash(x.profit),x.profit<0?'negative':''),el('small',`${x.count} ${x.count===1?'eveniment':'evenimente'} · încasări ${cash(x.income)} · costuri ${cash(x.expense)}`));grid.append(c);}p.append(grid);content.append(p);}

 // Profit per event.
 const list=panel('Profit pe fiecare eveniment'),filters=el('div',undefined,'report-table-tools'),search=el('input'),seg=el('div',undefined,'segmented');
 search.type='search';search.placeholder='Caută un eveniment';search.setAttribute('aria-label','Caută un eveniment');search.value=ui.search;
 for(const [value,label]of [['all','Toate'],['profit','Pe profit'],['loss','Pe pierdere'],['owed','De încasat']]){const b=btn(label,()=>{ui.filter=value;draw();seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});b.setAttribute('aria-pressed',String(ui.filter===value));seg.append(b);}
 filters.append(search,seg);list.append(filters,el('p','Evenimentele din perioadă, cu toate plățile lor. Apasă pe un eveniment ca să adaugi o încasare sau o cheltuială.','muted'));
 const wrap=el('div',undefined,'table-wrap');list.append(wrap);content.append(list);
 const columns=[['title','Eveniment'],['date','Data'],['income','Încasat'],['expense','Cheltuieli'],['profit','Profit'],['margin','Marjă'],['receivable','De încasat']];
 const draw=()=>{
  const q=ui.search.trim().toLowerCase();let rows=report.rows.filter(r=>(ui.filter==='all'||(ui.filter==='owed'?r.receivable>0:r.status===ui.filter))&&(!q||(r.event.title+' '+r.event.location).toLowerCase().includes(q)));
  const val=r=>ui.sort==='title'?r.event.title.toLowerCase():ui.sort==='date'?r.event.date:ui.sort==='margin'?(r.margin??-Infinity):r[ui.sort];
  rows=[...rows].sort((a,b)=>(val(a)>val(b)?1:val(a)<val(b)?-1:0)*ui.dir);
  wrap.replaceChildren();if(!rows.length){empty(wrap,report.rows.length?'Niciun eveniment nu corespunde filtrului.':'Niciun eveniment în perioada aleasă.');return;}
  const table=el('table',undefined,'report-table'),thead=el('thead'),hr=el('tr');
  for(const [key,label]of columns){const th=el('th');th.setAttribute('aria-sort',ui.sort===key?(ui.dir>0?'ascending':'descending'):'none');const b=btn(label+(ui.sort===key?(ui.dir>0?' ↑':' ↓'):''),()=>{ui.dir=ui.sort===key?-ui.dir:(key==='title'?1:-1);ui.sort=key;draw();},'sort');th.append(b);hr.append(th);}
  hr.append(el('th','Stare'));thead.append(hr);table.append(thead);const tbody=el('tbody');
  for(const r of rows){const tr=el('tr',undefined,'status-'+r.status),name=el('td');name.dataset.label='Eveniment';const open=btn(r.event.title,()=>ctx.eventFinance(r.event),'link event-link');name.append(open,el('small',`${TYPE_LABELS[r.type]||r.type} · ${r.guests} invitați`+(r.guests&&r.expense?' · cost/invitat '+cash(r.costPerGuest):'')));tr.append(name);
   for(const [label,value,cls]of [['Data',pretty(r.event.date)],['Încasat',cash(r.income),'money'],['Cheltuieli',cash(r.expense),'money'],['Profit',cash(r.profit),'money profit-cell '+(r.profit<0?'expense':'income')],['Marjă',r.margin===null?'—':pct(r.margin)],['De încasat',r.receivable?cash(r.receivable):'—',r.receivable?'money owed':'']]){const td=el('td',value,cls);td.dataset.label=label;if(label==='Profit'&&r.receivable)td.append(el('small','după încasare: '+cash(r.expected)));tr.append(td);}
   const st=el('td');st.dataset.label='Stare';st.append(el('span',STATUS[r.status],'badge '+r.status));tr.append(st);tbody.append(tr);}
  table.append(tbody);wrap.append(table);
 };
 search.addEventListener('input',()=>{ui.search=search.value;draw();});draw();
}

const capital=s=>s.charAt(0).toUpperCase()+s.slice(1);
const monthName=(key,withYear)=>new Date(key+'-15T12:00:00').toLocaleDateString('ro-RO',withYear?{month:'long',year:'numeric'}:{month:'short'}).replace('.','');

/* SVG bars for income/expense per month plus a cumulative profit line, with a hover/focus tooltip. */
function chart(months,el,cash,width){
 const NS='http://www.w3.org/2000/svg',svg=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
 const W=Math.max(300,width),H=W<520?230:280,L=W<520?40:52,R=8,T=14,B=30,iw=W-L-R,ih=H-T-B;
 const values=months.flatMap(m=>[m.income,m.expense,m.cumulative??0]);let max=Math.max(1,...values),min=Math.min(0,...values);
 const step=niceStep((max-min)/4);max=Math.ceil(max/step)*step;min=Math.floor(min/step)*step;
 const y=v=>T+ih-(v-min)/(max-min)*ih,slot=iw/months.length,bw=Math.min(26,slot*.32),every=slot<36?2:1;
 const root=svg('svg',{viewBox:`0 0 ${W} ${H}`,class:'chart',role:'img','aria-label':'Grafic lunar: '+months.filter(m=>m.inPeriod).map(m=>`${monthName(m.key,true)} încasări ${cash(m.income)}, cheltuieli ${cash(m.expense)}`).join('; ')});
 for(let v=min;v<=max+1;v+=step){const line=svg('line',{x1:L,x2:W-R,y1:y(v),y2:y(v),class:v===0?'axis zero':'axis'});const label=svg('text',{x:L-8,y:y(v)+4,class:'tick','text-anchor':'end'});label.textContent=compact(v);root.append(line,label);}
 const wrap=el('div',undefined,'chart-wrap'),tip=el('div',undefined,'chart-tip');tip.hidden=true;
 const points=[];
 months.forEach((m,i)=>{const cx=L+slot*i+slot/2,g=svg('g',{class:'month'+(m.inPeriod?'':' outside'),tabindex:m.inPeriod?'0':'-1'});
  const hit=svg('rect',{x:L+slot*i,y:T,width:slot,height:ih,class:'hit'});
  const inc=svg('rect',{x:cx-bw-1,y:y(Math.max(0,m.income)),width:bw,height:Math.max(0,y(0)-y(m.income)),rx:4,class:'bar income'});
  const exp=svg('rect',{x:cx+1,y:y(Math.max(0,m.expense)),width:bw,height:Math.max(0,y(0)-y(m.expense)),rx:4,class:'bar expense'});
  const label=svg('text',{x:cx,y:H-12,class:'tick month-label','text-anchor':'middle'});label.textContent=(months.length-1-i)%every?'':monthName(m.key)+(m.key.endsWith('-01')||i===0?' '+m.key.slice(2,4):'');
  g.append(hit,inc,exp,label);root.append(g);if(m.cumulative!==null)points.push([cx,y(m.cumulative)]);
  const show=()=>{tip.replaceChildren(el('strong',monthName(m.key,true)));for(const [text,value,cls]of [['Încasări',m.income,'income'],['Cheltuieli',m.expense,'expense'],['Profit',m.profit,m.profit<0?'expense':'income']]){const r=el('span',undefined,cls);r.append(el('b',text),document.createTextNode(cash(value)));tip.append(r);}if(m.cumulative!==null){const r=el('span',undefined,'cumulative');r.append(el('b','Cumulat'),document.createTextNode(cash(m.cumulative)));tip.append(r);}tip.hidden=false;tip.style.left=(cx/W*100)+'%';g.classList.add('active');};
  const hide=()=>{tip.hidden=true;g.classList.remove('active');};
  g.addEventListener('mouseenter',show);g.addEventListener('mouseleave',hide);g.addEventListener('focus',show);g.addEventListener('blur',hide);
 });
 if(points.length>1)root.append(svg('polyline',{points:points.map(p=>p.join(',')).join(' '),class:'profit-line'}));
 for(const [cx,cy]of points)root.append(svg('circle',{cx,cy,r:3.5,class:'profit-dot'}));
 wrap.append(root,tip);return wrap;
}
function niceStep(raw){const p=10**Math.floor(Math.log10(Math.max(raw,1))),f=raw/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p;}
function compact(bani){const lei=bani/100;return new Intl.NumberFormat('ro-RO',{notation:'compact',maximumFractionDigits:1}).format(lei);}
