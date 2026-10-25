import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../site/assets/js/home-moments.js',import.meta.url),'utf8');
const handlers={}, frames=[], animations=[], nodes=[];
let observer, now=200, top=100;
const reduce={matches:false,addEventListener:(type,fn)=>handlers.reduce=fn};
const mouse={matches:true,addEventListener:(type,fn)=>handlers.mouse=fn};
const classes=new Set();
const makeAnimation=()=>{const a={cancelled:false,cancel(){this.cancelled=true;}};animations.push(a);return a;};
const img={src:'team.webp',alt:''},caption={textContent:''};
const feature={querySelector:s=>s==='img'?img:caption,animate:makeAnimation};
const button={hidden:true,addEventListener:(type,fn)=>handlers.button=fn};
const hint={},status={};
const layer={clientWidth:1100,clientHeight:585,getBoundingClientRect:()=>({left:0,top:75,width:1100,height:585}),append:n=>nodes.push(n)};
const stage={classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},addEventListener:(type,fn)=>handlers[type]=fn,getBoundingClientRect:()=>({top,height:740})};
const cards=['garden','team','latte'].map(name=>({querySelector:s=>s==='img'?{getAttribute:()=>name+'.webp',alt:name}:{textContent:name}}));
const section={querySelector:s=>({'[data-moment-stage]':stage,'[data-moment-trail]':layer,'[data-moment-feature]':feature,'[data-moment-next]':button,'[data-moment-hint]':hint,'[data-moment-status]':status}[s]),querySelectorAll:()=>cards};
class Image {
 decode(){return Promise.resolve();}
 cloneNode(){return {style:{},offsetWidth:190,offsetHeight:240,remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);},animate:makeAnimation};}
}
const document={hidden:false,querySelector:()=>section,addEventListener:(type,fn)=>handlers[type]=fn};
vm.runInNewContext(source,{document,Image,matchMedia:q=>q.includes('reduced')?reduce:mouse,IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}},window:{addEventListener:(type,fn)=>handlers[type]=fn},innerHeight:800,requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){}});
const flush=async()=>{while(frames.length)frames.shift()();await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const move=async(x,y)=>{now+=120;handlers.pointermove({pointerType:'mouse',clientX:x,clientY:y,target:{closest:()=>null}});await flush();};
assert.equal(button.hidden,false);
observer([{isIntersecting:true}]);await flush();
await move(160,260);assert.equal(nodes.length,1,'first movement creates a decoded photograph');
await move(165,265);assert.equal(nodes.length,1,'small movement does not flood the gallery');
for(let i=0;i<12;i++)await move(i%2?200:900,350);
assert.equal(nodes.length,6,'trail is bounded under rapid movement');
await move(900,740);assert.equal(nodes.length,6,'controls/outside zone cannot spawn photos');
reduce.matches=true;handlers.reduce();await flush();assert.equal(nodes.length,0,'reduced motion cancels and removes the trail');
const previousAnimationCount=animations.length;
handlers.button();await flush();assert.match(status.textContent,/soare/);assert.equal(animations.length,previousAnimationCount,'manual selection works without animation');
const current=img.src;top=-250;handlers.scroll();await flush();assert.equal(img.src,current,'reduced motion disables scroll changes');
reduce.matches=false;mouse.matches=false;handlers.reduce();await flush();assert.match(img.src,/iced-latte/,'mobile scroll selects a photograph');
assert.equal(nodes.length,0,'mobile has no cursor trail');
observer([{isIntersecting:false}]);await flush();assert.equal(nodes.length,0);
document.hidden=true;handlers.visibilitychange();assert.equal(nodes.length,0);
console.log('PASS: decoded images, distance threshold, rapid-input cap, bounded area, reduced-motion manual control, mobile scroll and cleanup.');
