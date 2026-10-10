import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('../com-site-2/',import.meta.url));
const html=readFileSync(base+'cafea.html','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const log=[];
class Element {
 constructor(){this.handlers={};this.attrs={};this.dataset={};this.textContent='';this.animations=[];}
 addEventListener(k,fn){this.handlers[k]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
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
const root={querySelector:s=>elements.get(s),querySelectorAll:s=>({'[data-drink]':choices,'[data-choices]':groups,'[data-category]':tabs,'[data-interactive]':[]}[s])};
const reduce={matches:false,addEventListener(k,f){this.change=f;}};
let fail=false;
class Image { set src(value){this._src=value;setTimeout(()=>{if(fail&&value.includes('cold-brew.png')){fail=false;this.onerror();}else this.onload();},3);} get src(){return this._src;} decode(){return Promise.resolve();} }
vm.runInNewContext(readFileSync(base+'assets/js/menu.js','utf8'),{document:{querySelector:()=>root},matchMedia:()=>reduce,Image,console});
choices[1].click();choices[4].click();choices[6].click();await pause(70);
assert.equal(elements.get('[data-drink-name]').textContent,'Latte');assert.equal(choices[6].attrs['aria-pressed'],'true');assert.equal(elements.get('[data-drink-next]').disabled,true);
tabs[1].click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');assert.equal(groups[0].hidden,true);
choices[8].click();tabs[0].click();await pause(70);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso');assert.equal(groups[1].hidden,true);
tabs[1].click();await pause(40);fail=true;choices[9].click();await pause(30);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');assert.match(elements.get('[data-menu-status]').textContent,/nu s-a încărcat/);
choices[9].click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Cold Brew');
assert.equal(elements.get('[data-drink-beans]').hidden,true);
reduce.matches=true;reduce.change();const count=log.length;choices[11].click();await pause(30);assert.equal(log.length,count);assert.equal(elements.get('[data-drink-name]').textContent,'Babyccino');
assert.equal(elements.get('[data-drink-beans]').hidden,false);assert.equal(elements.get('[data-drink-beans]').attrs['data-beans'],'0');assert.equal(elements.get('[data-coffee-volume]').textContent,'0 ml');
groups[1].handlers.keydown({key:'Home',preventDefault(){}});await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');
console.log('PASS: 12 photo assets, rapid selection, category changes, boundaries, failed-image retry, reduced motion and keyboard Home.');
