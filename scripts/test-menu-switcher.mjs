import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('../site/',import.meta.url));
const html=readFileSync(base+'cafea.html','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const log=[];
const animationRuns=[];
class Element {
 constructor(){this.handlers={};this.attrs={};this.dataset={};this.textContent='';this.animations=[];this.children=[];this.style={setProperty(k,v){this[k]=v;}};const names=new Set();this.classList={add:n=>names.add(n),remove:n=>names.delete(n),contains:n=>names.has(n)};}
 addEventListener(k,fn){this.handlers[k]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k]??null;}
 append(...nodes){nodes.forEach(n=>{n.parentElement=this;this.children.push(n);});}
 set src(value){this.attrs.src=value;} get src(){return this.attrs.src;}
 click(){this.handlers.click?.();}
 focus(){}
 animate(frames){animationRuns.push(frames);log.push(['animate',frames[0].transform||'copy']);let end;const finished=new Promise(r=>{end=r;setTimeout(r,4);});const a={finished,cancel:end};this.animations.push(a);return a;}
 getAnimations(){return this.animations.splice(0);}
}
const choices=[...html.matchAll(/<button[^>]*data-drink="\d+"[^>]*>[\s\S]*?<span>([^<]+)<\/span><\/button>/g)].map(m=>{const b=new Element();b.dataset=Object.fromEntries([...m[0].matchAll(/data-([\w-]+)="([^"]+)"/g)].map(a=>[a[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),a[2]]));b.lastElementChild={textContent:m[1]};assert(existsSync(base+`assets/img/menu/${b.dataset.slug}.png`),`Missing ${b.dataset.slug}`);return b;});
assert.equal(choices.length,12);
const elements=new Map();
for(const selector of ['[data-drink-photo]','.drink-copy','[data-drink-prev]','[data-drink-next]','[data-menu-status]','[data-drink-name]','[data-drink-note]','[data-drink-description]','[data-drink-composition]','[data-drink-serving]','[data-menu-retry]','[data-drink-counter]','[data-stage-number]','[data-drink-volume]','[data-coffee-label]','[data-coffee-volume]','[data-drink-beans]']) elements.set(selector,new Element());
const groups=[new Element(),new Element()],tabs=[new Element(),new Element()];
const wheelHost=new Element();wheelHost.parentElement=new Element();wheelHost.parentElement.parentElement=new Element();elements.set('[data-wheel]',wheelHost);
const root={querySelector:s=>elements.get(s),querySelectorAll:s=>({'[data-drink]':choices,'[data-choices]':groups,'[data-category]':tabs,'[data-interactive]':[]}[s])};
const listeners=[];const reduce={matches:false,addEventListener(k,f){listeners.push(f);},change(){listeners.forEach(f=>f());}};
let fail=false, failInitial=true;
let holdSlug=null;
const pendingImages=new Map();
class Image { set src(value){this._src=value;if(holdSlug&&value.endsWith(`/${holdSlug}.png`)){pendingImages.set(holdSlug,()=>this.onload());return;}setTimeout(()=>{if(failInitial&&value.endsWith('/espresso.png')){failInitial=false;this.onerror();}else if(fail&&value.includes('cold-brew.png')){fail=false;this.onerror();}else this.onload();},3);} get src(){return this._src;} decode(){return Promise.resolve();} }
vm.runInNewContext(readFileSync(base+'assets/js/menu-wheel.js','utf8')+'\n'+readFileSync(base+'assets/js/menu.js','utf8'),{document:{querySelector:()=>root,createElement:()=>new Element()},matchMedia:()=>reduce,Image,console});
function assertWheel(slug,color){
 const selected=wheelHost.children.map(spoke=>spoke.children[0]).find(card=>card.style.opacity===1);
 assert.match(selected.children[0].src,new RegExp('/'+slug+'\\.png$'));
 assert.equal(selected.style.opacity,1);
 assert.equal(selected.disabled,true);
 assert.equal(wheelHost.parentElement.style['--coffee-accent'],color);
 assert.equal(wheelHost.parentElement.parentElement.style['--scene-color'],choices.find(choice=>choice.dataset.slug===slug).dataset.scene);
 const cards=wheelHost.children.map(spoke=>spoke.children[0]);
 assert.equal(cards.filter(card=>card.style.opacity===.26).length,2);
 assert.equal(cards.filter(card=>card.style.opacity===0&&card.disabled).length,2);
 cards.forEach(card=>assert.match(card.style.transform,card.style.opacity===1 ? /scale\(1\)$/ : /scale\(0\.32\)$/, 'only the selected cup uses full size'));
 assert(!wheelHost.classList.contains('is-turning'),'wheel releases pointer after movement');
}
choices[0].click(); // Reselecting the initial cup must not hide its load failure.
await pause(20);
assert.equal(elements.get('[data-menu-retry]').hidden,false,'initial image failure exposes retry');
elements.get('[data-menu-retry]').click();await pause(25);
assert.equal(elements.get('[data-menu-retry]').hidden,true);
assert.equal(elements.get('[data-menu-status]').textContent,'');
assertWheel('espresso','#513222');
holdSlug='flat-white';choices[3].click();await pause(5);
choices[4].click();await pause(40);
assert.equal(elements.get('[data-drink-name]').textContent,'Cappuccino','a stalled old image must not block the latest selection');
holdSlug=null;pendingImages.get('flat-white')();await pause(10);
assert.equal(elements.get('[data-drink-name]').textContent,'Cappuccino','late image completion cannot replace the selected drink');
choices[1].click();choices[4].click();choices[6].click();await pause(70);
assert.equal(elements.get('[data-drink-name]').textContent,'Latte');assert.equal(choices[6].attrs['aria-pressed'],'true');assert.equal(elements.get('[data-drink-next]').disabled,false);
assertWheel('latte','#ddc6a7');
const orbitXY = transform => [...transform.matchAll(/var\(--orbit-radius\) \* ([-.\de+]+)/g)].map(m=>Number(m[1]));
const neighborCard = direction => wheelHost.children.find(spoke=>spoke.children[0].style.opacity===.26 && Math.sign(orbitXY(spoke.style.transform)[1])===direction).children[0];
const incoming=neighborCard(1).children[0];
const runStart=animationRuns.length;
elements.get('[data-drink-next]').click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso');
// Sample the actual upright cup keyframes, including between keyframes. Their
// conservative visible bounds must remain separate. All 12 PNG alpha bounds
// were measured: x .158..841, y .050..955; use x .15..85 and y .04..96.
// CSS clips the stage to prevent any photo from painting over text.
const travel=animationRuns.slice(runStart);
const cupFrames=travel.filter(frames=>frames.length===21&&frames[0].transform.includes('scale('));
const departing=cupFrames.find(frames=>frames[0].transform.endsWith('scale(1)'));
const arriving=cupFrames.find(frames=>frames.at(-1).transform.endsWith('scale(1)'));
assert(departing&&arriving);
const orbitFrames = frames => travel[travel.indexOf(frames)-1];
assert(orbitXY(orbitFrames(arriving)[0].transform).every(value=>value>0),'next cup starts below and to the right');
assert(orbitXY(orbitFrames(departing).at(-1).transform).every(value=>value<0),'previous cup retreats above and to the left');
function interpolate(frames,progress,value){const at=progress*20,lo=Math.floor(at),hi=Math.min(20,lo+1);const a=value(frames[lo]),b=value(frames[hi]);return a+(b-a)*(at-lo);}
function assertSeparation(cupFrames,orbitFrames) {
for(const [width,mobile,cap] of [[252,true,280],[302,true,280],[346,true,280],[500,true,280],[400,false,330],[514,false,330],[550,false,330],[560,false,350],[720,false,350]]){
 const radius=Math.min(width*.7,cap),size=Math.min(width*.84,mobile?336:500);
 for(let step=0;step<=100;step++){
  const boxes=cupFrames.filter(frames=>interpolate(frames,step/100,frame=>frame.opacity)>.01).map(frames=>({
   x:radius*interpolate(orbitFrames(frames),step/100,frame=>orbitXY(frame.transform)[0]),
   y:radius*interpolate(orbitFrames(frames),step/100,frame=>orbitXY(frame.transform)[1]),
   size:size*interpolate(frames,step/100,frame=>Number(frame.transform.match(/scale\(([-.\d]+)\)/)[1]))
  }));
  for (let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) {
   const a=boxes[i],b=boxes[j],totalX=(a.size+b.size)*.35,totalY=(a.size+b.size)*.46;
   assert(Math.abs(a.x-b.x)>=totalX||Math.abs(a.y-b.y)>=totalY,`cup boxes overlap at width ${width}, progress ${step}%, pair ${i}/${j}`);
  }
 }
}
}
assertSeparation(cupFrames,orbitFrames);
assert.equal(wheelHost.children.find(spoke=>spoke.children[0].style.opacity===1).children[0].children[0],incoming,'arrival keeps the same image node without a visible source swap');
elements.get('[data-drink-prev]').click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Latte');
tabs[1].click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');assert.equal(groups[0].hidden,true);
assertWheel('iced-latte','#b79c7d');
choices[8].click();tabs[0].click();await pause(70);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso');assert.equal(groups[1].hidden,true);
tabs[1].click();await pause(40);fail=true;choices[9].click();await pause(30);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');assert.match(elements.get('[data-menu-status]').textContent,/nu s-a încărcat/);
assert.equal(elements.get('[data-menu-retry]').hidden,false);
elements.get('[data-menu-retry]').click();await pause(40);assert.equal(elements.get('[data-drink-name]').textContent,'Cold Brew');
assert.equal(elements.get('[data-drink-beans]').hidden,true);
assertWheel('cold-brew','#663c27');
reduce.matches=true;reduce.change();const count=log.length;choices[11].click();await pause(30);assert.equal(log.length,count);assert.equal(elements.get('[data-drink-name]').textContent,'Babyccino');
assert.equal(elements.get('[data-drink-beans]').hidden,false);assert.equal(elements.get('[data-drink-beans]').attrs['data-beans'],'0');assert.equal(elements.get('[data-coffee-volume]').textContent,'0 ml');
assertWheel('babyccino','#e2d8c6');
elements.get('[data-drink-next]').click();await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');
neighborCard(1).click();await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Espresso Tonic');
groups[1].handlers.keydown({key:'Home',preventDefault(){}});await pause(25);assert.equal(elements.get('[data-drink-name]').textContent,'Iced Latte');
tabs[0].click();await pause(20);
for(let i=0;i<7;i++){elements.get('[data-drink-next]').click();await pause(15);}
assertWheel('espresso','#513222');
neighborCard(-1).click();await pause(20);
assert.equal(elements.get('[data-drink-name]').textContent,'Latte','recycled neighbor retains its current click target');
elements.get('[data-drink-next]').handlers.keydown({key:'Home',preventDefault(){}});await pause(25);
assert.equal(elements.get('[data-drink-name]').textContent,'Espresso','keyboard navigation works beside the title');
// Choosing an old visible neighbor while the new category is loading must
// restore the category belonging to that selected drink.
tabs[1].click();neighborCard(1).click();await pause(40);
assert.equal(elements.get('[data-drink-name]').textContent,'Cortado');
assert.equal(tabs[0].attrs['aria-pressed'],'true');
assert.equal(groups[0].hidden,false);
elements.get('[data-drink-next]').handlers.keydown({key:'End',preventDefault(){}});await pause(20);
const keyboardIncoming=neighborCard(1).children[0];
elements.get('[data-drink-next]').handlers.keydown({key:'ArrowRight',preventDefault(){}});await pause(20);
assert.equal(elements.get('[data-drink-name]').textContent,'Espresso','keyboard arrows wrap like buttons');
assert.equal(wheelHost.children.find(spoke=>spoke.children[0].style.opacity===1).children[0].children[0],keyboardIncoming,'keyboard wrap follows the forward neighbor instead of jumping backward');
// Every recipe keeps its full description, composition, serving and quantities.
for(let i=0;i<choices.length;i++) {
 choices[i].click();await pause(20);
 const data=choices[i].dataset;
 assert(data.description.length>40 && data.composition && data.serving);
 assert.equal(elements.get('[data-drink-description]').textContent,data.description);
 assert.equal(elements.get('[data-drink-composition]').textContent,data.composition);
 assert.equal(elements.get('[data-drink-serving]').textContent,data.serving);
 assert.equal(elements.get('[data-drink-volume]').textContent,`${data.volume} ml`);
 assert.equal(elements.get('[data-coffee-volume]').textContent,`${data.coffeeMl} ml`);
 assert.equal(elements.get('[data-drink-beans]').attrs['data-beans'],data.beans);
}
// Turning reduced motion on during a transition must settle the chosen drink.
reduce.matches=false;
choices[2].click();await pause(5);reduce.matches=true;reduce.change();await pause(35);
assertWheel('macchiato','#79513b');
assert.equal(elements.get('[data-drink-name]').textContent,'Macchiato');
// Audit every recorded wheel phase: forward, backward and direct/category jumps.
const allFrames=animationRuns.filter(frames=>frames.length===21);
assert.equal(allFrames.length%10,0);
for(let i=0;i<allFrames.length;i+=10) {
 const phase=allFrames.slice(i,i+10);
 assertSeparation(phase.filter((_,n)=>n%2),frames=>phase[phase.indexOf(frames)-1]);
}
// At rest all three visible cup envelopes fit within their clipped stage.
for(const [width,mobile,height,cap] of [[252,true,460,280],[302,true,460,280],[346,true,530,280],[500,true,600,280],[400,false,740,330],[514,false,740,330],[550,false,740,330],[560,false,780,350],[720,false,780,350]]) {
 const radius=Math.min(width*.7,cap),size=Math.min(width*.84,mobile?336:500);
 for(const spoke of wheelHost.children) {
  const card=spoke.children[0]; if(card.style.opacity===0) continue;
  const [dx,dy]=orbitXY(spoke.style.transform),scale=Number(card.style.transform.match(/scale\(([-.\d]+)\)/)[1]);
  const x=width*.48+radius*dx,y=height/2+radius*dy,halfX=size*scale*.35,halfY=size*scale*.46;
  assert(x-halfX>=0 && x+halfX<=width && y-halfY>=0 && y+halfY<=height,`clipped cup at ${width}px`);
 }
}
// Conservative contrast: darkest background overlay, ignoring white highlights.
const css=readFileSync(base+'assets/css/menu.css','utf8');
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const blend=(a,b,alpha)=>a.map((c,i)=>c*(1-alpha)+b[i]*alpha);
const luminance=rgb=>rgb.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const bodyInk=rgb(css.match(/\.drink-description \{[^}]*color:(#[a-f0-9]{6})/)[1]);
const tabInk=rgb(css.match(/\.menu-tabs button \{[^}]*color:(#[a-f0-9]{6})/)[1]);
for(const choice of choices) {
 const bg=blend(rgb(choice.dataset.scene),rgb('#3e291b'),18/255);
 assert(contrast(bg,bodyInk)>=4.5,`description contrast for ${choice.dataset.slug}`);
 assert(contrast(blend(bg,rgb('#30291f'),18/255),tabInk)>=4.5,`category contrast for ${choice.dataset.slug}`);
}
console.log('PASS: 12 photos, wheel/copy synchronization, colors, circular navigation, neighbor click, rapid/category selections, failed-image retry, reduced motion, circular keyboard controls, descriptions, initial-image retry, category races and palette contrast.');
