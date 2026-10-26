/* Evenimente: every event as a card, and one page per event with money, supplies, payments,
   client, tasks and notes. eventMoney() and the preset helpers are pure for scripts/test-admin-events.mjs.
   Amounts are integer bani; supply quantities are ×1000 and precise unit prices ×10000, as in the API. */

// Common stand supplies. Prices are never invented: the last price used for the same item is offered.
export const PRESETS=[
 {name:'Cafea boabe',unit:'kg'},{name:'Lapte',unit:'litri'},{name:'Lapte vegetal',unit:'litri'},
 {name:'Pahare 4oz',unit:'buc'},{name:'Pahare 8oz',unit:'buc'},{name:'Pahare 10oz',unit:'buc'},{name:'Pahare 12oz',unit:'buc'},
 {name:'Capace pahare',unit:'buc'},{name:'Zahăr (plicuri)',unit:'buc'},{name:'Agitatoare',unit:'buc'},{name:'Sirop',unit:'sticle'},
 {name:'Gheață',unit:'kg'},{name:'Apă',unit:'litri'},{name:'Apă tonică',unit:'sticle'},{name:'Șervețele',unit:'pachete'},
 {name:'Barista',unit:'ore'},{name:'Transport',unit:'cursă'},
];
const key=s=>s.trim().toLocaleLowerCase('ro');
const preciseOf=i=>i.unit_price_4!=null?i.unit_price_4:(i.unit_price||0)*100;

/* Last price and unit used for an item name, from the newest supply with that name. */
export function lastUsed(supplies,name){
 const match=[...supplies].filter(s=>key(s.name)===key(name)).sort((a,b)=>b.id-a.id)[0];
 return match?{unit:match.unit,unitPrice:preciseOf(match)/10000}:null;
}
/* Items typed by hand before, to offer them next to the presets. */
export function usedBefore(supplies,limit=8){
 const preset=new Set(PRESETS.map(p=>key(p.name))),seen=new Map();
 for(const s of [...supplies].sort((a,b)=>b.id-a.id))if(!preset.has(key(s.name))&&!seen.has(key(s.name)))seen.set(key(s.name),{name:s.name,unit:s.unit});
 return [...seen.values()].slice(0,limit);
}
/* Same rounding as the server: quantity to 3 decimals, price to 4, total to the ban. */
export const lineTotal=(quantity,unitPrice)=>Math.round(Math.round(quantity*1000)*Math.round(unitPrice*10000)/100000);

export function eventMoney(state,event,today){
 const ledger=state.ledger.filter(e=>e.event_id===event.id&&!e.deleted),supplies=state.supplies.filter(s=>s.event_id===event.id&&!s.deleted);
 const income=ledger.filter(e=>e.kind==='income').reduce((n,e)=>n+e.amount,0),paid=ledger.filter(e=>e.kind==='expense').reduce((n,e)=>n+e.amount,0);
 const planned=supplies.filter(s=>!s.ledger_id).reduce((n,s)=>n+s.total,0),price=event.price||0;
 const owed=event.status==='confirmed'?Math.max(0,price-income):0;
 const status=event.status==='cancelled'?'cancelled':event.date>today?'upcoming':owed>0?'owed':!income&&!paid?'empty':income-paid>=0?'profit':'loss';
 return {ledger,supplies,income,paid,planned,price,owed,costs:paid+planned,profitNow:income-paid,expected:Math.max(price,income)-paid-planned,
  progress:price?Math.min(1,income/price):income?1:0,status};
}

const STATUS={profit:'Profit',loss:'Pierdere',owed:'De încasat',upcoming:'Urmează',empty:'Fără plăți',cancelled:'Anulat'};
const ui={selected:null,filter:'upcoming',search:''};
export const openEvent=id=>{ui.selected=id;};
export const closeEvent=()=>{ui.selected=null;};

export function eventsView(ctx){
 const event=ui.selected&&ctx.state.events.find(e=>e.id===ui.selected);
 if(event)return detail(ctx,event);
 ui.selected=null;list(ctx);
}

/* ---------------------------------------------------------------- list */
function list(ctx){
 const {state,el,btn,cash,pretty,panel,empty,today,content}=ctx;
 const tools=el('div',undefined,'events-tools'),search=el('input'),seg=el('div',undefined,'segmented');
 search.type='search';search.placeholder='Caută după nume sau locație';search.setAttribute('aria-label','Caută un eveniment');search.value=ui.search;
 for(const [value,label]of [['upcoming','Viitoare'],['past','Trecute'],['all','Toate'],['cancelled','Anulate']]){const b=btn(label,()=>{ui.filter=value;content.replaceChildren();list(ctx);});b.setAttribute('aria-pressed',String(ui.filter===value));seg.append(b);}
 const actions=el('div',undefined,'events-actions');actions.append(btn('Importă tabel',ctx.importStart),btn('+ Eveniment',()=>ctx.eventForm(),'primary'));
 tools.append(search,seg,actions);content.append(tools);
 const summary=el('div',undefined,'report-strip events-summary'),grid=el('div',undefined,'event-grid');content.append(summary,grid);
 const draw=()=>{
  const q=key(ui.search),day=today();
  let items=state.events.filter(e=>(ui.filter==='all'?true:ui.filter==='cancelled'?e.status==='cancelled':e.status==='confirmed'&&(ui.filter==='upcoming'?e.date>=day:e.date<day))&&(!q||key(e.title+' '+e.location).includes(q)));
  items=[...items].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)*(ui.filter==='upcoming'?1:-1));
  const money=items.map(e=>eventMoney(state,e,day));
  summary.replaceChildren();
  for(const [label,value]of [['Evenimente',String(items.length)],['Prețuri convenite',cash(money.reduce((n,m)=>n+m.price,0))],['Încasat',cash(money.reduce((n,m)=>n+m.income,0))],['De încasat',cash(money.reduce((n,m)=>n+m.owed,0))]]){const s=el('div');s.append(el('span',label),el('strong',value));summary.append(s);}
  grid.replaceChildren();
  if(!items.length){empty(grid,state.events.length?'Niciun eveniment aici. Schimbă filtrul sau caută altceva.':'Încă nu ai evenimente. Adaugă unul sau acceptă o cerere.');return;}
  items.forEach((e,i)=>grid.append(card(ctx,e,money[i])));
 };
 search.addEventListener('input',()=>{ui.search=search.value;draw();});draw();
}

function card(ctx,event,m){
 const {el,cash}=ctx,b=el('button',undefined,'event-card status-'+m.status);b.type='button';
 const d=new Date(event.date+'T12:00:00'),date=el('span',undefined,'event-date');date.append(el('span',String(d.getDate()),'day-number'),el('span',d.toLocaleDateString('ro-RO',{month:'short'}).replace('.',''),'month-short'),el('span',String(d.getFullYear()),'year'));
 const body=el('span',undefined,'event-card-body');
 body.append(el('span',event.title,'event-card-title'),el('span',`${event.time} · ${event.location} · ${event.guests} invitați`,'event-card-meta'));
 const bar=el('span',undefined,'pay-bar');const fill=el('span');fill.style.width=(m.progress*100)+'%';bar.append(fill);
 const line=el('span',undefined,'event-card-money');line.append(el('span',m.price?`Încasat ${cash(m.income)} din ${cash(m.price)}`:`Încasat ${cash(m.income)} · fără preț convenit`),el('span',STATUS[m.status],'badge '+m.status));
 const chips=el('span',undefined,'event-card-chips');
 if(m.owed)chips.append(el('span','Rest '+cash(m.owed),'chip owed'));
 if(m.planned)chips.append(el('span','Necesar neplătit '+cash(m.planned),'chip'));
 chips.append(el('span','Profit estimat '+cash(m.expected),'chip '+(m.expected<0?'negative':'positive')));
 body.append(bar,line,chips);b.append(date,body,el('span','→','event-card-arrow'));
 b.setAttribute('aria-label',`${event.title}, ${ctx.pretty(event.date)}, ${STATUS[m.status]}`);
 b.addEventListener('click',()=>{openEvent(event.id);ctx.rerender();window.scrollTo({top:0,behavior:'instant'});});
 return b;
}

/* ---------------------------------------------------------------- detail */
function detail(ctx,event){
 const {state,el,btn,cash,pretty,labels,panel,empty,today,content,api,refresh,report}=ctx,m=eventMoney(state,event,today());
 const enquiry=state.enquiries.find(q=>q.id===event.enquiry_id);
 const top=el('div',undefined,'event-top');top.append(btn('← Toate evenimentele',()=>{closeEvent();ctx.rerender();},'link'),btn('Editează detaliile',()=>ctx.eventForm(event)));content.append(top);

 const hero=el('section',undefined,'event-hero'),heading=el('div');
 heading.append(el('p',(enquiry?labels[enquiry.type]||enquiry.type:'Eveniment')+' · '+STATUS[m.status],'eyebrow'),el('h2',event.title));
 const facts=el('dl',undefined,'event-facts');
 for(const [k,v]of [['Data',pretty(event.date)],['Ora',event.time+' · '+String(event.duration).replace('.',',')+' ore'],['Locație',event.location],['Invitați',String(event.guests)]]){const d=el('div');d.append(el('dt',k),el('dd',v));facts.append(d);}
 hero.append(heading,facts);content.append(hero);

 // Money at a glance.
 const money=el('div',undefined,'event-money');
 const tile=(label,value,cls,extra)=>{const t=el('div',undefined,'money-tile '+(cls||''));t.append(el('span',label),el('strong',value));if(extra)t.append(extra);money.append(t);return t;};
 tile('Preț convenit',cash(m.price),'',m.price?null:btn('Setează prețul',()=>ctx.eventForm(event),'link'));
 const bar=el('div',undefined,'pay-bar');const fill=el('span');fill.style.width=(m.progress*100)+'%';bar.append(fill);
 tile('Încasat',cash(m.income),'paid',bar);
 tile('Rest de încasat',cash(m.owed),m.owed?'owed':'');
 tile('Costuri',cash(m.costs),'',el('small',`plătite ${cash(m.paid)} · planificate ${cash(m.planned)}`));
 tile(m.expected<0?'Pierdere estimată':'Profit estimat',cash(m.expected),'expected'+(m.expected<0?' negative':''),el('small',m.price?'preț − toate costurile':'încasat − toate costurile'));
 content.append(money);

 const cols=el('div',undefined,'event-columns'),main=el('div',undefined,'event-main'),side=el('div',undefined,'event-side');cols.append(main,side);content.append(cols);

 // Supplies: quick presets, then the list.
 const need=panel('Necesar & costuri');need.querySelector('.panel-heading').append(el('span','Planificat '+cash(m.planned)+' · Plătit '+cash(m.supplies.filter(s=>s.ledger_id).reduce((n,s)=>n+s.total,0)),'muted'));
 const adder=el('div',undefined,'supply-adder');adder.hidden=true;
 const quick=el('div',undefined,'preset-grid');quick.setAttribute('role','group');quick.setAttribute('aria-label','Adaugă rapid');
 const present=new Set(m.supplies.map(s=>key(s.name)));
 const open=(item)=>openAdder(ctx,event,adder,item,quick);
 for(const p of [...PRESETS,...usedBefore(state.supplies)]){const b=btn('',()=>open(p),'preset');b.append(el('span',p.name),el('small',p.unit));if(present.has(key(p.name)))b.classList.add('in-list');quick.append(b);}
 const custom=btn('+ Produs nou',()=>open({name:'',unit:'buc'}),'preset custom');quick.append(custom);
 need.append(el('p','Alege un produs, scrie cantitatea și prețul. Prețul ultimei folosiri se completează singur.','muted'),quick,adder);
 if(!m.supplies.length)empty(need,'Lista e goală. Începe cu cafea, lapte și pahare.');
 else{
  const wrap=el('div',undefined,'table-wrap'),table=el('table',undefined,'supply-table'),thead=el('thead'),hr=el('tr');for(const h of ['Produs','Cantitate','Preț unitar','Total','Stare',''])hr.append(el('th',h));thead.append(hr);table.append(thead);const tbody=el('tbody');
  for(const s of [...m.supplies].sort((a,b)=>Number(Boolean(a.ledger_id))-Number(Boolean(b.ledger_id))||a.id-b.id)){
   const tr=el('tr');[s.name,String(s.quantity/1000).replace('.',',')+' '+s.unit,ctx.unitCash(s),cash(s.total)].forEach((v,i)=>{const td=el('td',v,i===3?'money':'');td.dataset.label=['Produs','Cantitate','Preț unitar','Total'][i];tr.append(td);});
   const st=el('td');st.dataset.label='Stare';st.append(el('span',s.ledger_id?'Plătit':'Planificat','badge '+(s.ledger_id?'profit':'empty')));tr.append(st);
   const act=el('td',undefined,'supply-actions');
   if(s.ledger_id)act.append(btn('Bon / factură',()=>ctx.documents(s.ledger_id)));
   else act.append(btn('Am plătit',()=>ctx.supplyExpense(event,s),'primary'),btn('Editează',()=>ctx.supplyForm(event,s,()=>{})));
   act.append(btn('Șterge',()=>ctx.removeEntry('supplies',s,event,()=>{}),'danger'));tr.append(act);tbody.append(tr);
  }
  table.append(tbody);wrap.append(table);need.append(wrap);
 }
 main.append(need);

 // Other costs paid for this event (not from the supply list).
 const linked=new Set(m.supplies.map(s=>s.ledger_id).filter(Boolean)),other=m.ledger.filter(e=>e.kind==='expense'&&!linked.has(e.id));
 const costs=panel('Alte cheltuieli');costs.querySelector('.panel-heading').append(btn('+ Cheltuială',()=>ctx.ledgerForm({kind:'expense',event_id:event.id})));
 if(!other.length)empty(costs,'Transport, personal sau alte costuri plătite pentru acest eveniment.');
 for(const e of other)costs.append(entryRow(ctx,e,event));
 main.append(costs);

 // Payments received.
 const pay=panel('Încasări');
 const payActions=el('div',undefined,'pay-actions');
 payActions.append(btn('+ Avans',()=>ctx.ledgerForm({kind:'income',category:'Avans eveniment',event_id:event.id}),'primary'));
 if(m.owed)payActions.append(btn('+ Rest '+cash(m.owed),()=>ctx.ledgerForm({kind:'income',category:'Plată eveniment',event_id:event.id,amount:m.owed,description:'Rest plată · '+event.title})));
 payActions.append(btn('+ Altă încasare',()=>ctx.ledgerForm({kind:'income',category:'Plată eveniment',event_id:event.id})));
 pay.append(payActions);
 const incomes=m.ledger.filter(e=>e.kind==='income');if(!incomes.length)empty(pay,'Nicio încasare încă.');for(const e of incomes)pay.append(entryRow(ctx,e,event));
 side.append(pay);

 // Client from the original enquiry.
 if(enquiry){const c=panel('Client'),dl=el('dl',undefined,'client-facts');for(const [k,v]of [['Nume',enquiry.name],['Telefon',enquiry.phone],['Email',enquiry.email]]){dl.append(el('dt',k),el('dd',v));}
  const links=el('div',undefined,'contact-actions');for(const [text,href]of [['Sună','tel:'+enquiry.phone.replace(/[^+\d]/g,'')],['Email','mailto:'+enquiry.email]]){const a=el('a',text,'quiet');a.href=href;links.append(a);}
  c.append(dl,links);const extra=Object.entries(enquiry.details||{}).filter(([,v])=>v);if(extra.length){const more=el('details'),sum=el('summary','Tot ce a scris în cerere');more.append(sum);const all=el('dl',undefined,'client-facts');for(const [k,v]of extra)all.append(el('dt',k),el('dd',String(v)));more.append(all);c.append(more);}side.append(c);}

 // Tasks for this event.
 const tasks=panel('De pregătit'),form=el('form',undefined,'task-inline'),input=el('input'),add=el('button','Adaugă','primary');
 input.placeholder='Ex. confirmă locul pentru bar';input.setAttribute('aria-label','Sarcină nouă');input.maxLength=300;input.required=true;add.type='submit';form.append(input,add);
 form.addEventListener('submit',async e=>{e.preventDefault();add.disabled=true;try{await api('tasks','POST',{title:input.value,date:'',event_id:String(event.id)});await refresh();}catch(error){report(error);add.disabled=false;}});
 tasks.append(form);const list=state.tasks.filter(t=>t.event_id===event.id);if(!list.length)empty(tasks,'Nimic de bifat pentru acest eveniment.');
 for(const t of list){const label=el('label',undefined,'task-label'),check=el('input',undefined,'taskcheck');check.type='checkbox';check.checked=Boolean(t.done);
  check.addEventListener('change',async()=>{check.disabled=true;try{await api(`tasks/${t.id}`,'PATCH',{done:check.checked});await refresh();}catch(error){check.checked=!check.checked;check.disabled=false;report(error);}});
  const text=el('span',t.title,t.done?'done':'');label.append(check,text);tasks.append(label);}
 side.append(tasks);

 // Notes.
 const notes=panel('Notițe');notes.querySelector('.panel-heading').append(btn('Editează',()=>ctx.eventForm(event)));
 if(event.notes)notes.append(el('p',event.notes,'event-notes'));else empty(notes,'Echipamente, acces, contact la locație…');
 side.append(notes);
}

function entryRow(ctx,e,event){
 const {el,btn,cash,pretty,state}=ctx,r=el('div',undefined,'entry-row'),copy=el('div');
 copy.append(el('strong',e.description),el('span',pretty(e.date)+' · '+e.category+(e.reference?' · '+e.reference:'')));
 const right=el('div',undefined,'entry-right');right.append(el('span',(e.kind==='income'?'+':'−')+cash(e.amount),'money '+e.kind));
 const files=state.attachments.filter(f=>f.ledger_id===e.id).length,actions=el('div',undefined,'entry-actions');
 actions.append(btn(files?`Documente (${files})`:'Bon',()=>ctx.documents(e.id)),btn('Editează',()=>ctx.ledgerForm(e)),btn('Șterge',()=>ctx.removeEntry('ledger',e,event,()=>{}),'danger'));
 right.append(actions);r.append(copy,right);return r;
}

/* Inline form for one supply line, opened from a preset or "+ Produs nou". */
function openAdder(ctx,event,box,item,quick){
 const {el,btn,cash,api,refresh,notice}=ctx,last=item.name?lastUsed(ctx.state.supplies,item.name):null;
 box.hidden=false;box.replaceChildren();quick.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.querySelector('span')?.textContent===item.name));
 const form=el('form'),grid=el('div',undefined,'adder-grid');
 const field=(label,attrs)=>{const l=el('label',label),i=el('input');Object.assign(i,attrs);l.append(i);grid.append(l);return i;};
 const name=field('Produs',{value:item.name,required:true,maxLength:180,placeholder:'Ex. Cacao'});
 const qty=field('Cantitate',{type:'number',min:.001,max:1000000,step:.001,required:true,inputMode:'decimal',placeholder:'0'});
 const unit=field('Unitate',{value:last?.unit||item.unit,required:true,maxLength:30});
 const price=field('Preț unitar (RON)',{type:'number',min:0,max:10000000,step:.0001,required:true,inputMode:'decimal',value:last?String(last.unitPrice):'',placeholder:'0,00'});
 const total=el('output',undefined,'adder-total');total.setAttribute('aria-live','polite');
 const hint=el('small',last?'Preț și unitate de data trecută. Le poți schimba.':'Prima dată: completează prețul plătit pe unitate.','muted');
 const error=el('p','','form-error');error.setAttribute('role','alert');
 const actions=el('div',undefined,'adder-actions'),save=el('button','Adaugă în necesar','primary');save.type='submit';
 actions.append(btn('Renunță',()=>{box.hidden=true;quick.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));}),save);
 const update=()=>{const q=Number(qty.value),p=Number(price.value);total.textContent='Total '+cash(q>0&&p>=0?lineTotal(q,p):0);};
 form.addEventListener('input',update);update();
 form.append(grid,total,hint,error,actions);box.append(form);
 (item.name?qty:name).focus();
 form.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;error.textContent='';
  try{await api(`events/${event.id}/supplies`,'POST',{name:name.value,quantity:qty.value,unit:unit.value,unit_price:price.value||'0'});await refresh();notice.className='success';notice.textContent=`${name.value.trim()} a fost adăugat în necesar.`;}
  catch(err){error.textContent=err.message;save.disabled=false;}});
}
