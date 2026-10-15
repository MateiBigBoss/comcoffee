import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('../site/',import.meta.url));
const html=readFileSync(base+'cafea.html','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const log=[];
class Element {
 constructor(){this.handlers={};this.attrs={};this.dataset={};this.textContent='';this.animations=[];this.children=[];this.style={setProperty(k,v){this[k]=v;}};const names=new Set();this.classList={add:n=>names.add(n),remove:n=>names.delete(n),contains:n=>names.has(n)};}
 addEventListener(k,fn){this.handlers[k]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k]??null;}
 append(...nodes){nodes.forEach(n=>{n.parentElement=this;this.children.push(n);});}
 set src(value){this.attrs.src=value;} get src(){return this.attrs.src;}
 click(){this.handlers.click?.();}
 focus(){}
 animate(frames){log.push(['animate',frames[0].transform||'copy']);let end;const finished=new Promise(r=>{end=r;setTimeout(r,4);});const a={finished,cancel:end};this.animations.push(a);return a;}
 getAnimations(){return this.animations.splice(0);}
}
const choices=[...html.matchAll(/<button[^>]*data-drink="\d+"[^>]*>[\s\S]*?<span>([^<]+)<\/span><\/button>/g)].map(m=>{const b=new Element();b.dataset=Object.fromEntries([...m[0].matchAll(/data-([\w-]+)="([^"]+)"/g)].map(a=>[a[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),a[2]]));b.lastElementChild={textContent:m[1]};assert(existsSync(base+`assets/img/menu/${b.dataset.slug}.png`),`Missing ${b.dataset.slug}`);return b;});
assert.equal(choices.length,12);
const elements=new Map();
for(const selector of ['[data-drink-photo]','.drink-copy','[data-drink-prev]','[data-drink-next]','[data-menu-status]','[data-drink-name]','[data-drink-note]','[data-drink-counter]','[data-stage-number]','[data-drink-volume]','[data-coffee-label]','[data-coffee-volume]','[data-drink-beans]']) elements.set(selector,new Element());
const groups=[new Element(),new Element()],tabs=[new Element(),new Element()];
const wheelHost=new Element();wheelHost.parentElement=new Element();elements.set('[data-wheel]',wheelHost);
const root={querySelector:s=>elements.get(s),querySelectorAll:s=>({'[data-drink]':choices,'[data-choices]':groups,'[data-category]':tabs,'[data-interactive]':[]}[s])};
const listeners=[];const reduce={matches:false,addEventListener(k,f){listeners.push(f);},change(){listeners.forEach(f=>f());}};
let fail=false;
class Image { set src(value){this._src=value;setTimeout(()=>{if(fail&&value.includes('cold-brew.png')){fail=false;this.onerror();}else this.onload();},3);} get src(){return this._src;} decode(){return Promise.resolve();} }
vm.runInNewContext(readFileSync(base+'assets/js/menu-wheel.js','utf8')+'\n'+readFileSync(base+'assets/js/menu.js','utf8'),{document:{querySelector:()=>root,createElement:()=>new Element()},matchMedia:()=>reduce,Image,console});
function assertWheel(slug,color){
 const selected=wheelHost.children.map(spoke=>spoke.children[0]).find(card=>card.style.opacity===1);
 assert.match(selected.children[0].src,new RegExp('/'+slug+'\\.png$'));
 assert.equal(selected.style.opacity,1);
 assert.equal(selected.disabled,true);
 assert.equal(wheelHost.parentElement.style['--coffee-accent'],color);
 const cards=wheelHost.children.map(spoke=>spoke.children[0]);
 assert.equal(cards.filter(card=>card.style.opacity===.26).length,2);
 assert.equal(cards.filter(card=>card.style.opacity===0&&card.disabled).length,2);
 cards.forEach(card=>assert.match(card.style.transform,/scale\(1\)$/, 'all cups keep their size'));
 assert(!wheelHost.classList.contains('is-turning'),'wheel releases pointer after movement');
}
assertWheel('espresso','#513222');
choices[1].click();choices[4].click();choices[6].click();await pause(70);
assert.equal(elements.get('[data-drink-name]').textContent,'Latte');assert.equal(choices[6].attrs['aria-pressed'],'true');assert.equal(elements.get('[data-drink-next]').disabled,false);
assertWheel('latte','#ddc6a7');
const incoming=wheelHost.children.find(spoke=>spoke.style.transform==='rotate(52deg)').children[0].children[0];
elements.get('[data-drink-next]').click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso');
assert.equal(wheelHost.children.find(spoke=>spoke.style.transform==='rotate(0deg)').children[0].children[0],incoming,'arrival keeps the same image node without a visible source swap');
elements.get('[data-drink-prev]').click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Latte');
tabs[1].click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');assert.equal(groups[0].hidden,true);
assertWheel('iced-latte','#b79c7d');
choices[8].click();tabs[0].click();await pause(70);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso');assert.equal(groups[1].hidden,true);
tabs[1].click();await pause(40);fail=true;choices[9].click();await pause(30);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');assert.match(elements.get('[data-menu-status]').textContent,/nu s-a încărcat/);
choices[9].click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Cold Brew');
assert.equal(elements.get('[data-drink-beans]').hidden,true);
assertWheel('cold-brew','#663c27');
reduce.matches=true;reduce.change();const count=log.length;choices[11].click();await pause(30);assert.equal(log.length,count);assert.equal(elements.get('[data-drink-name]').textContent,'Babyccino');
assert.equal(elements.get('[data-drink-beans]').hidden,false);assert.equal(elements.get('[data-drink-beans]').attrs['data-beans'],'0');assert.equal(elements.get('[data-coffee-volume]').textContent,'0 ml');
assertWheel('babyccino','#e2d8c6');
elements.get('[data-drink-next]').click();await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');
wheelHost.children.find(spoke=>spoke.style.transform==='rotate(52deg)').children[0].click();await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso Tonic');
groups[1].handlers.keydown({key:'Home',preventDefault(){}});await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');
tabs[0].click();await pause(20);
for(let i=0;i<7;i++){elements.get('[data-drink-next]').click();await pause(15);}
assertWheel('espresso','#513222');
wheelHost.children.find(spoke=>spoke.style.transform==='rotate(-52deg)').children[0].click();await pause(20);
assert.equal(elements.get('[data-drink-name]').textContent,'Latte','recycled neighbor retains its current click target');
console.log('PASS: 12 photos, wheel/copy synchronization, colors, circular navigation, neighbor click, rapid/category selections, failed-image retry, reduced motion and keyboard Home.');
