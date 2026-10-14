import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../site/assets/js/logo-reveal.js', import.meta.url), 'utf8');
function scenario({ reduced = false, finePointer = true } = {}) {
  const node = () => ({
    attrs: {}, events: {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(k, fn) { this.events[k] = fn; }
  });
  const logo = node(), light = node(), texture = node(), window = node(), document = node();
  const hover = { ...node(), matches: finePointer }, reduce = { ...node(), matches: reduced };
  let box = { left: 100, top: 200, width: 790, height: 205, right: 890, bottom: 405 };
  logo.getBoundingClientRect = () => box;
  logo.querySelector = selector => selector === '[data-brand-light]' ? light : texture;
  document.querySelector = () => logo;
  const frames = new Map();
  let id = 0;
  vm.runInNewContext(source, {
    document, window, matchMedia: query => query.includes('reduced-motion') ? reduce : hover,
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  return {
    logo, light, texture, window, document, hover, reduce, frames,
    move(x = 495, y = 302.5, pointerType = 'mouse') { logo.events.pointermove({ clientX: x, clientY: y, pointerType }); },
    flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
    get active() { return 'data-reveal-active' in logo.attrs; },
    resize(next) { box = next; window.events.resize(); }
  };
}

const s = scenario();
s.move(150, 220); s.move();
assert.equal(s.frames.size, 1, 'rapid movement uses a single pending frame');
s.flush();
assert(s.active);
assert.equal(s.light.attrs.cx, '535', 'latest cursor position maps to SVG coordinates');
assert.equal(s.light.attrs.cy, '292.5');
assert.equal(s.frames.size, 0, 'idle pointer does not schedule a permanent animation loop');
s.move(); s.logo.events.pointerleave(); s.flush();
assert(!s.active, 'leaving before a pending frame cannot reactivate the effect');
assert.equal(s.frames.size, 0);
s.resize({ left: 0, top: 0, width: 395, height: 102.5, right: 395, bottom: 102.5 });
s.move(197.5, 51.25); s.flush();
assert.equal(s.light.attrs.cx, '535', 'responsive coordinates stay centered');
assert.equal(s.light.attrs.cy, '292.5');
s.move(-1, 20); s.flush(); assert(!s.active, 'outside pointer hides the light');
for (const event of ['scroll', 'resize', 'blur']) {
  s.move(100, 40); s.flush(); s.window.events[event]();
  assert(!s.active, `${event} clears stale light position`);
}
s.move(100, 40); s.flush(); s.reduce.matches = true; s.reduce.events.change();
assert(!s.active, 'changing motion preference immediately hides the light');
for (const settings of [{ reduced: true }, { finePointer: false }]) {
  const fallback = scenario(settings); fallback.move(); fallback.flush();
  assert(!fallback.active, 'motion/pointer preferences retain the normal logo');
}
const touch = scenario(); touch.move(495, 302.5, 'touch'); touch.flush(); assert(!touch.active);
const failed = scenario(); failed.move(); failed.flush(); failed.texture.events.error();
failed.move(); failed.flush(); assert(!failed.active, 'missing texture keeps the original black logo');
vm.runInNewContext(source, { document: { querySelector: () => null } });
console.log('PASS: logo spotlight coordinates, responsive layout, frame cleanup, touch/reduced-motion and asset-error fallback.');
