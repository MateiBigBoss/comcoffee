/* Original event photos, revealed only inside the homepage album. */
(() => {
  'use strict';
  const section = document.querySelector('[data-moments]');
  if (!section) return;
  const stage = section.querySelector('[data-moment-stage]');
  const layer = section.querySelector('[data-moment-trail]');
  const feature = section.querySelector('[data-moment-feature]');
  const button = section.querySelector('[data-moment-next]');
  const hint = section.querySelector('[data-moment-hint]');
  const status = section.querySelector('[data-moment-status]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  const photos = Array.from(section.querySelectorAll('.moment-photo'), card => ({
    src:card.querySelector('img').getAttribute('src'),
    alt:card.querySelector('img').alt,
    caption:card.querySelector('figcaption').textContent
  }));
  photos.push(
    {src:'assets/img/events/espresso-in-pregatire-360.webp', alt:'Două pahare com. sub espressor, în timpul extracției.', caption:'Totul începe cu un espresso.'},
    {src:'assets/img/events/iced-latte-in-pregatire-360.webp', alt:'Espresso turnat peste lapte și gheață.', caption:'Pentru zile cu soare.'}
  );
  // Keep the central album photo distinct from the two fixed photographs.
  const featureOrder = [1, 3, 4];
  const cache = new Map();
  function load(photo) {
    if (!cache.has(photo.src)) {
      const image = new Image();
      image.src = photo.src;
      cache.set(photo.src, image.decode().then(() => image).catch(() => null));
    }
    return cache.get(photo.src);
  }
  let visible = false, cursor = null, last = null, lastTime = 0, frame = 0;
  let sequence = 0, featureIndex = 0, request = 0, scrollStep = -1, fadeTimer;
  let featureAnimation;
  const active = new Set();
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function clearTrail() {
    active.forEach(item => { item.animation.cancel(); item.node.remove(); });
    active.clear();
    clearTimeout(fadeTimer);
    stage.classList.remove('is-tracing');
    last = null;
  }
  async function selectPhoto(index, announce = false) {
    const id = ++request;
    const photo = photos[featureOrder[index]];
    const image = await load(photo);
    if (!image || id !== request) return;
    featureAnimation?.cancel();
    feature.querySelector('img').src = photo.src;
    feature.querySelector('img').alt = photo.alt;
    feature.querySelector('figcaption').textContent = photo.caption;
    if (!reduce.matches) featureAnimation = feature.animate([
      {opacity:.25, translate:'0 12px'}, {opacity:1, translate:'0 0'}
    ], {duration:420, easing:'cubic-bezier(.22,1,.36,1)'});
    if (announce) status.textContent = photo.caption;
  }
  async function stamp(x, y, dx, dy) {
    const epoch = sequence++;
    const photo = photos[epoch % photos.length];
    const source = await load(photo);
    // A decoded photo must still belong to the current gesture and visible stage.
    if (!source || epoch !== sequence - 1 || !visible || reduce.matches || !mouse.matches || !cursor) return;
    if (active.size >= 6) {
      const oldest = active.values().next().value;
      oldest.animation.cancel(); oldest.node.remove(); active.delete(oldest);
    }
    const node = source.cloneNode();
    node.alt = ''; node.draggable = false;
    layer.append(node);
    const w = node.offsetWidth, h = node.offsetHeight;
    node.style.left = clamp(x - w / 2, 12, layer.clientWidth - w - 12) + 'px';
    node.style.top = clamp(y - h / 2, 8, layer.clientHeight - h - 8) + 'px';
    const angle = [-9, 6, -4, 10, -7][epoch % 5];
    const tx = clamp(dx * .15, -24, 24), ty = clamp(dy * .15, -16, 16);
    const animation = node.animate([
      {opacity:0, transform:`translate(${-tx}px, ${12-ty}px) rotate(${angle-4}deg) scale(.85)`, offset:0},
      {opacity:1, transform:`translate(0, 0) rotate(${angle}deg) scale(1)`, offset:.2},
      {opacity:1, transform:`translate(${tx}px, ${ty}px) rotate(${angle+1}deg) scale(1)`, offset:.55},
      {opacity:0, transform:`translate(${tx}px, ${ty-28}px) rotate(${angle+3}deg) scale(.94)`, offset:1}
    ], {duration:1600, easing:'cubic-bezier(.2,.65,.3,1)'});
    const item = {node, animation}; active.add(item);
    animation.onfinish = () => {node.remove(); active.delete(item);};
    stage.classList.add('is-tracing');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => stage.classList.remove('is-tracing'), 1100);
  }
  function update() {
    frame = 0;
    if (!visible || reduce.matches || document.hidden) return;
    const rect = layer.getBoundingClientRect();
    if (mouse.matches && cursor) {
      const x = cursor.x - rect.left, y = cursor.y - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) { last = null; return; }
      const dx = last ? x - last.x : 80, dy = last ? y - last.y : 0;
      const time = performance.now();
      if ((!last || Math.hypot(dx,dy) > 68) && time - lastTime > 95) {
        last = {x,y}; lastTime = time; stamp(x,y,dx,dy);
      }
    } else {
      const box = stage.getBoundingClientRect();
      const step = Math.floor(clamp((innerHeight - box.top) / (innerHeight + box.height), 0, .999) * featureOrder.length);
      if (step !== scrollStep) { scrollStep = step; featureIndex = step; selectPhoto(step); }
    }
  }
  function schedule() { if (visible && !frame) frame = requestAnimationFrame(update); }
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !mouse.matches || reduce.matches) return;
    if (event.target.closest('button,a')) { cursor = null; last = null; return; }
    cursor = {x:event.clientX, y:event.clientY}; schedule();
  }, {passive:true});
  stage.addEventListener('pointerleave', () => { cursor = null; last = null; sequence++; });
  button.hidden = false;
  button.addEventListener('click', () => {
    featureIndex = (featureIndex + 1) % featureOrder.length;
    selectPhoto(featureIndex, true);
  });
  function setMode() {
    clearTrail(); sequence++; cursor = null; scrollStep = -1;
    hint.textContent = reduce.matches ? 'Un album de momente împreună.' : mouse.matches ? 'Mișcă mouse-ul. Descoperă momentele.' : 'Derulează și descoperă momentele.';
    schedule();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { photos.forEach(load); schedule(); }
    else { clearTrail(); cursor = null; sequence++; }
  }, {rootMargin:'0px', threshold:0});
  observer.observe(stage);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', () => { last = null; schedule(); }, {passive:true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) {clearTrail(); sequence++; cursor = null;} });
  reduce.addEventListener('change', setMode);
  mouse.addEventListener('change', setMode);
  setMode();
})();
