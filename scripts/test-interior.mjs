// Behavioral safeguards: motion must never hide content permanently or trap focus.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../site/assets/js/interior.js', import.meta.url), 'utf8');
function scenario({ reduced = false, supported = true, failObserver = false } = {}) {
  const nodes = [40, 1000, 1800].map(top => ({
    classes: new Set(), parentElement: { closest: () => null },
    getBoundingClientRect: () => ({ top })
  }));
  nodes.forEach(node => { node.classList = { add: name => node.classes.add(name), remove: name => node.classes.delete(name) }; });
  const events = {}, properties = {}, observed = new Set();
  let callback, preferenceChange, disconnects = 0, nextFrame;
  const preference = { matches: reduced, addEventListener: (_, fn) => { preferenceChange = fn; } };
  class Observer {
    constructor(fn) { if (failObserver) throw new Error('observer unavailable'); callback = fn; }
    observe(node) { observed.add(node); }
    unobserve(node) { observed.delete(node); }
    disconnect() { observed.clear(); disconnects++; }
  }
  const window = {
    matchMedia: () => preference, innerHeight: 800, scrollY: 0,
    requestAnimationFrame: fn => { nextFrame = fn; return 1; },
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  if (supported) window.IntersectionObserver = Observer;
  const document = {
    body: { classList: { contains: () => true }, appendChild() {} },
    documentElement: { scrollHeight: 2400 },
    querySelectorAll: () => nodes,
    createElement: () => ({ setAttribute() {}, style: { setProperty: (k, v) => { properties[k] = v; } } }),
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  vm.runInNewContext(source, { window, document, IntersectionObserver: Observer });
  return { nodes, events, properties, observed, window, document,
    intersect(node) { callback([{ target: node, isIntersecting: true }]); },
    reduce() { preference.matches = true; preferenceChange(); },
    flush() { const fn = nextFrame; nextFrame = null; fn?.(); },
    get disconnects() { return disconnects; } };
}
const normal = scenario();
assert.equal(normal.nodes[0].classes.size, 0, 'above-fold hero stays visible');
assert.equal(normal.observed.size, 2);
normal.intersect(normal.nodes[1]);
assert.equal(normal.nodes[1].classes.size, 0, 'scroll reveals content once');
normal.events.focusin({ target: { closest: () => normal.nodes[2] } });
assert.equal(normal.nodes[2].classes.size, 0, 'keyboard navigation reveals its target');
normal.window.scrollY = 800;
normal.events.scroll(); normal.flush();
assert.equal(normal.properties['--read-progress'], '0.5');
normal.window.scrollY = 4000;
normal.events.scroll(); normal.flush();
assert.equal(normal.properties['--read-progress'], '1', 'overscroll clamps progress');
normal.document.documentElement.scrollHeight = 600;
normal.events.resize(); normal.flush();
assert.equal(normal.properties['--read-progress'], '0', 'short documents avoid division by zero');
const switched = scenario(); switched.reduce();
assert(switched.nodes.every(node => node.classes.size === 0), 'live reduced-motion preference reveals everything');
assert.equal(switched.disconnects, 1);
for (const settings of [{ reduced: true }, { supported: false }, { failObserver: true }]) {
  assert(scenario(settings).nodes.every(node => node.classes.size === 0), 'fallback must never hide content');
}
console.log('PASS: scroll reveal, keyboard focus, reduced motion, observer failure fallback and reading progress.');
