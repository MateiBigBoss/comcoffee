/* Load before moving; adjacent cups orbit together. Latest selection wins. */
(() => {
  'use strict';
  const root = document.querySelector('[data-menu]');
  if (!root) return;
  const choices = [...root.querySelectorAll('[data-drink]')];
  const groups = [...root.querySelectorAll('[data-choices]')];
  const tabs = [...root.querySelectorAll('[data-category]')];
  const photo = root.querySelector('[data-drink-photo]');
  const copy = root.querySelector('.drink-copy');
  const prev = root.querySelector('[data-drink-prev]');
  const next = root.querySelector('[data-drink-next]');
  const status = root.querySelector('[data-menu-status]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cache = new Map();
  let current = 0, desired = 0, category = 0, running = false, requestedDirection = 1;
  const bounds = () => category === 0 ? [0,6] : [7,11];
  function load(index) {
    if (!cache.has(index)) {
      const image = new Image();
      const promise = new Promise((resolve,reject) => {
        image.onload = () => image.decode().then(() => resolve(image), reject);
        image.onerror = reject;
        image.src = `assets/img/menu/${choices[index].dataset.slug}.png`;
      }).catch(error => { cache.delete(index); throw error; });
      cache.set(index,promise);
    }
    return cache.get(index);
  }
  function controls() {
    tabs.forEach((tab,i) => tab.setAttribute('aria-pressed', String(i === category)));
    groups.forEach((group,i) => { group.hidden = i !== category; });
    choices.forEach((button,i) => button.setAttribute('aria-pressed', String(i === current)));
    prev.disabled = false;
    next.disabled = false;
  }
  function render(index,image) {
    const button = choices[index];
    const name = button.lastElementChild.textContent;
    photo.src = image.src;
    photo.alt = `${name} în paharul com.`;
    root.querySelector('[data-drink-name]').textContent = name;
    root.querySelector('[data-drink-note]').textContent = button.dataset.note;
    root.querySelector('[data-drink-volume]').textContent = `${button.dataset.volume} ml`;
    root.querySelector('[data-coffee-label]').textContent = button.dataset.coffeeLabel;
    root.querySelector('[data-coffee-volume]').textContent = `${button.dataset.coffeeMl} ml`;
    const beans = root.querySelector('[data-drink-beans]');
    beans.hidden = button.dataset.beans === 'none';
    beans.setAttribute('data-beans', button.dataset.beans);
    beans.setAttribute('aria-label', button.dataset.beans === '0' ? 'Fără cafea' : button.dataset.beans === '1' ? '1 shot de espresso' : `${button.dataset.beans} shoturi de espresso`);
    root.querySelector('[data-drink-counter]').textContent = index < 7 ? 'Meniu clasic' : 'Selecția Signature';
    current = index;
    controls();
  }
  async function motion(out,direction) {
    if (reduce.matches || !photo.animate) return;
    const frames = out ? [{transform:'translateX(0)',opacity:1},{transform:`translateX(${-direction*75}%)`,opacity:0}] : [{transform:`translateX(${direction*75}%)`,opacity:0},{transform:'translateX(0)',opacity:1}];
    const a = photo.animate(frames,{duration:out?250:550,easing:'cubic-bezier(.22,.75,.22,1)',fill:'forwards'});
    const b = copy.animate(out?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],{duration:out?180:400,fill:'forwards'});
    await Promise.all([a.finished.catch(()=>{}),b.finished.catch(()=>{})]);
  }
  function clearAnimations() { photo.getAnimations().forEach(a=>a.cancel()); copy.getAnimations().forEach(a=>a.cancel()); }
  async function switchDrink() {
    if (running) return;
    running = true;
    try {
      while (current !== desired) {
        const target = desired;
        let image;
        status.textContent = 'Pregătim fotografia…';
        try { image = await load(target); }
        catch { if(target !== desired) continue; desired=current; category=current<7?0:1; controls(); status.textContent='Fotografia nu s-a încărcat. Alege din nou băutura pentru a reîncerca.'; break; }
        if (target !== desired) continue;
        status.textContent = '';
        const direction = requestedDirection;
        if (wheel) {
          // Keep the current details readable until the next cup reaches the center.
          await wheel.move(target,direction);
          render(target,image);
          if (!reduce.matches && copy.animate) {
            const reveal = copy.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
            await reveal.finished.catch(()=>{});
            reveal.cancel();
          }
        } else {
          await motion(true,direction);
          render(target,image);
          clearAnimations();
          await motion(false,direction);
          clearAnimations();
        }
      }
    } finally { running=false; }
  }
  function choose(index, direction = index >= desired ? 1 : -1) { requestedDirection=direction || 1; desired=index; controls(); switchDrink(); }
  const wheelHost = root.querySelector('[data-wheel]');
  const wheel = wheelHost && typeof CoffeeWheel !== 'undefined' ? new CoffeeWheel(wheelHost,choices,choose,reduce) : null;
  choices.forEach((button,i)=>button.addEventListener('click',()=>choose(i)));
  tabs.forEach((button,i)=>button.addEventListener('click',()=>{ category=i; choose(i===0?0:7); }));
  prev.addEventListener('click',()=>choose(desired <= bounds()[0] ? bounds()[1] : desired-1,-1));
  next.addEventListener('click',()=>choose(desired >= bounds()[1] ? bounds()[0] : desired+1,1));
  const keyTargets = wheel ? [...groups,wheelHost.parentElement] : groups;
  keyTargets.forEach(group=>group.addEventListener('keydown',event=>{
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const [start,end]=bounds();
    let index = event.key==='Home'?start:event.key==='End'?end:Math.max(start,Math.min(end,desired+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)));
    if (groups.includes(group)) choices[index].focus();
    choose(index);
  }));
  reduce.addEventListener('change',()=>{ if(reduce.matches) clearAnimations(); });
  root.querySelectorAll('[data-interactive]').forEach(el=>{el.hidden=false;});
  controls();
  load(0).catch(()=>{});
  // Fetch likely next image only, instead of downloading the whole menu on arrival.
  load(1).catch(()=>{});
})();
