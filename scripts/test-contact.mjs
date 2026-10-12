import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../site/contact.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../site/assets/js/contact.js', import.meta.url), 'utf8');
const attributes = source => Object.fromEntries([...source.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)].map(([, key, double, single]) => [key, double ?? single ?? '']));
const formMatch = html.match(/<form\b([^>]*)>([\s\S]*?)<\/form>/i);
assert.ok(formMatch, 'The contact page must contain a real form.');
const formAttributes = attributes(formMatch[1]);
const controls = [...formMatch[2].matchAll(/<(input|select|textarea)\b([^>]*)(?:>([\s\S]*?)<\/\1\s*>|>)/gi)].map(([, tag, source, content = '']) => ({tag, attributes: attributes(source), content}));

// This harness executes the production script without a browser or network.
// Its checkValidity double covers only the declared constraints used here;
// browser rendering, CAPTCHA, actual delivery and native validation UI are not tested.
class Element {
  constructor(attrs = {}) {
    this.attrs = attrs;
    this.listeners = new Map();
    this.value = attrs.value ?? '';
    this.min = attrs.min ?? '';
    this.checked = false;
    this.hidden = true;
    this.disabled = Object.hasOwn(attrs, 'disabled');
    this.textContent = '';
    this.validationMessage = '';
  }
  set innerHTML(_) { throw new Error('User-controlled data must not be written with innerHTML.'); }
  addEventListener(name, handler) {
    const handlers = this.listeners.get(name) ?? [];
    handlers.push(handler);
    this.listeners.set(name, handlers);
  }
  dispatch(name) {
    const event = {defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }};
    for (const handler of this.listeners.get(name) ?? []) handler(event);
    return event;
  }
  setCustomValidity(message) { this.validationMessage = message; }
  get selectedIndex() { return this.options.findIndex(option => option.value === this.value); }
}

function setup({protocol = 'https:', search = '', initial = {}} = {}) {
  const fields = new Map();
  for (const {tag, attributes: attrs, content} of controls) {
    if (!attrs.id) continue;
    const element = new Element(attrs);
    element.tag = tag;
    if (tag === 'select') {
      element.options = [...content.matchAll(/<option\b([^>]*)>([^<]*)<\/option>/g)].map(([, source, textContent]) => ({...attributes(source), textContent}));
      element.value = element.options[0]?.value ?? '';
    }
    if (Object.hasOwn(initial, attrs.id)) element.value = initial[attrs.id];
    fields.set(attrs.id, element);
  }
  const form = new Element();
  form.querySelector = selector => fields.get(selector.slice(1));
  form.validityChecks = 0;
  form.validityReports = 0;
  form.checkValidity = () => {
    form.validityChecks++;
    return [...fields.values()].every(field => {
      if (field.disabled) return true;
      if (field.validationMessage) return false;
      const {type, required, step} = field.attrs;
      if (required !== undefined && (type === 'checkbox' ? !field.checked : field.value === '')) return false;
      if (!field.value) return true;
      if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) return false;
      if (type === 'date' && field.min && field.value < field.min) return false;
      if (type === 'number') {
        const number = Number(field.value);
        if (!Number.isFinite(number) || (field.min !== '' && number < Number(field.min))) return false;
        if (step && step !== 'any' && !Number.isInteger((number - Number(field.min || 0)) / Number(step))) return false;
      }
      return true;
    });
  };
  form.reportValidity = () => { form.validityReports++; return form.checkValidity(); };
  const status = new Element();
  const notice = new Element();
  const summary = new Element();
  const summaryValues = new Map(['tip', 'data', 'invitati'].map(key => [key, new Element()]));
  summary.querySelector = selector => summaryValues.get(selector.match(/"([^"]+)"/)?.[1]);
  const window = new Element();
  window.location = {protocol, search};
  let now = new Date(2026, 9, 12, 0, 15);
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now.getTime()])); }
    static now() { return now.getTime(); }
  }
  const elements = new Map([
    ['[data-booking-form]', form], ['[data-booking-status]', status],
    ['[data-booking-summary]', summary], ['[data-local-preview]', notice],
  ]);
  vm.runInNewContext(script, {document: {querySelector: selector => elements.get(selector)}, window, Date: Clock, URLSearchParams}, {filename: 'contact.js'});
  return {
    form, fields, status, notice, summary, summaryValues, window,
    setDate: next => { now = next; },
    input(id, value) { const field = fields.get(id); field.value = value; field.dispatch('input'); form.dispatch('input'); },
    change(id, value) { fields.get(id).value = value; form.dispatch('change'); },
    complete() {
      for (const [id, value] of Object.entries({tip: 'nunta', data: '2026-11-14', invitati: '120', oras: 'Cluj-Napoca', nume: 'Test local', email: 'test@example.invalid', telefon: '+40 771 793 146'})) this.input(id, value);
      fields.get('acord').checked = true;
    },
  };
}

test('HTML submits the complete booking by native POST with CAPTCHA and validation enabled', () => {
  assert.equal(formAttributes.action, 'https://formsubmit.co/comcoffee.events@gmail.com');
  assert.equal(formAttributes.method.toLowerCase(), 'post');
  assert.equal(Object.hasOwn(formAttributes, 'novalidate'), false);
  assert.equal(controls.some(control => control.attributes.name === '_captcha' && control.attributes.value === 'false'), false);
  assert.ok(controls.some(control => control.attributes.name === '_honey'));
  const byId = new Map(controls.filter(control => control.attributes.id).map(control => [control.attributes.id, control.attributes]));
  for (const id of ['tip', 'data', 'invitati', 'oras', 'nume', 'email', 'telefon', 'acord']) {
    assert.ok(byId.get(id)?.name, `${id} needs a payload name.`);
    assert.ok(Object.hasOwn(byId.get(id), 'required'), `${id} must be required.`);
  }
  for (const id of ['ora', 'durata', 'locatie', 'amplasare', 'organizatie', 'preferinte', 'detalii']) assert.ok(byId.get(id)?.name, `${id} needs a payload name.`);
  for (const [id, attrs] of byId) {
    assert.equal(Object.hasOwn(attrs, 'disabled'), false, `${id} must be sent.`);
    assert.ok(new RegExp(`<label\\b[^>]*\\bfor="${id}"`).test(formMatch[2]), `${id} needs a label.`);
  }
  assert.equal(byId.get('invitati').type, 'number');
  assert.equal(byId.get('invitati').min, '1');
  assert.equal(byId.get('invitati').step, '1');
  assert.equal(byId.get('email').type, 'email');
  assert.equal(byId.get('data').type, 'date');
  assert.equal(byId.get('acord').type, 'checkbox');
  assert.doesNotMatch(html + script, /cererea a fost trimisă|rezervarea (?:ta )?este confirmată/i);
});

test('event links accept only known choices and preserve restored selections', () => {
  for (const type of ['nunta', 'corporate', 'targ-festival', 'petrecere-privata', 'altceva']) {
    const app = setup({search: `?tip=${type}`});
    assert.equal(app.fields.get('tip').value, type);
    assert.notEqual(app.summaryValues.get('tip').textContent, 'De ales');
  }
  for (const type of ['', 'necunoscut', '<img src=x onerror=alert(1)>']) {
    const app = setup({search: `?tip=${encodeURIComponent(type)}`});
    assert.equal(app.fields.get('tip').value, '');
    assert.equal(app.summaryValues.get('tip').textContent, 'De ales');
  }
  assert.equal(setup({search: '?tip=nunta', initial: {tip: 'corporate'}}).fields.get('tip').value, 'corporate');
});

test('summary updates through textContent on input/change without HTML injection', () => {
  const app = setup();
  assert.equal(app.summary.hidden, false);
  const label = '<img src=x onerror=alert(1)>';
  app.fields.get('tip').options.find(option => option.value === 'nunta').textContent = label;
  app.change('tip', 'nunta');
  assert.equal(app.summaryValues.get('tip').textContent, label);
  app.input('invitati', '150');
  assert.equal(app.summaryValues.get('invitati').textContent, '150');
  app.input('data', '2026-11-14');
  assert.equal(app.summaryValues.get('data').textContent, new Date(2026, 10, 14, 12).toLocaleDateString('ro-RO', {day: 'numeric', month: 'long', year: 'numeric'}));
  app.input('data', '');
  assert.equal(app.summaryValues.get('data').textContent, 'De ales');
});

test('date minimum uses the local day and revalidates after midnight', () => {
  const app = setup();
  const date = app.fields.get('data');
  assert.equal(date.min, '2026-10-12');
  app.input('data', '2026-10-11');
  assert.notEqual(date.validationMessage, '');
  app.input('data', '2026-10-12');
  assert.equal(date.validationMessage, '');
  app.setDate(new Date(2026, 9, 13, 0, 1));
  date.dispatch('focus');
  assert.equal(date.min, '2026-10-13');
  assert.notEqual(date.validationMessage, '');
  app.input('data', '2026-10-14');
  assert.equal(date.validationMessage, '');
});

test('phone validation rejects malformed input and clears errors after correction', () => {
  const app = setup();
  for (const phone of ['abc1234567', '123456', '1234567890123456', '<script>']) {
    app.input('telefon', phone);
    assert.notEqual(app.fields.get('telefon').validationMessage, '', phone);
  }
  for (const phone of ['+40 771 793 146', '(0771) 793-146', '0771.793.146']) {
    app.input('telefon', phone);
    assert.equal(app.fields.get('telefon').validationMessage, '', phone);
  }
  app.input('telefon', '');
  assert.equal(app.fields.get('telefon').validationMessage, '', 'Empty field is handled by required.');
});

test('HTTP submission preserves all values and delegates to the native POST', () => {
  for (const protocol of ['http:', 'https:']) {
    const app = setup({protocol});
    app.complete();
    const before = [...app.fields].map(([id, field]) => [id, field.value, field.checked]);
    assert.equal(app.form.dispatch('submit').defaultPrevented, false);
    assert.equal(app.form.validityReports, 0);
    assert.deepEqual([...app.fields].map(([id, field]) => [id, field.value, field.checked]), before);
    assert.ok([...app.fields.values()].every(field => !field.disabled));
    assert.match(app.status.textContent, /nu reprezintă încă o rezervare confirmată/);
    assert.equal(app.notice.hidden, true);
  }
});

test('invalid submissions remain on the form, including native number and required constraints', () => {
  for (const [id, value] of [['invitati', '-1'], ['invitati', '1.5'], ['invitati', '0'], ['email', 'invalid'], ['nume', ''], ['tip', ''], ['data', '2026-10-11'], ['telefon', 'letters']]) {
    const app = setup();
    app.complete();
    app.input(id, value);
    assert.equal(app.form.dispatch('submit').defaultPrevented, true, `${id}=${value}`);
    assert.equal(app.form.validityReports, 1);
    assert.equal(app.status.textContent, '');
    if (id === 'invitati') assert.equal(app.summaryValues.get(id).textContent, 'De estimat');
  }
  const app = setup();
  app.complete();
  app.fields.get('acord').checked = false;
  assert.equal(app.form.dispatch('submit').defaultPrevented, true, 'Contact consent is required.');
  app.fields.get('acord').checked = true;
  assert.equal(app.form.dispatch('submit').defaultPrevented, false, 'Corrected form can proceed.');
});

test('file previews do not send and explain the direct email alternative honestly', () => {
  const app = setup({protocol: 'file:'});
  app.complete();
  assert.equal(app.notice.hidden, false);
  assert.equal(app.form.dispatch('submit').defaultPrevented, true);
  assert.match(app.status.textContent, /Copia locală nu trimite cereri/);
  assert.match(app.status.textContent, /comcoffee\.events@gmail\.com/);
  assert.equal(app.fields.get('email').value, 'test@example.invalid');
});

test('pageshow refreshes restored/autofilled values and clears stale navigation status', () => {
  const app = setup();
  app.complete();
  app.form.dispatch('submit');
  app.fields.get('tip').value = 'corporate';
  app.fields.get('invitati').value = '80';
  app.fields.get('data').value = '2026-10-12';
  app.fields.get('telefon').value = 'invalid';
  app.setDate(new Date(2026, 9, 13));
  app.window.dispatch('pageshow');
  assert.equal(app.status.textContent, '');
  assert.equal(app.summaryValues.get('tip').textContent, 'Eveniment corporate');
  assert.equal(app.summaryValues.get('invitati').textContent, '80');
  assert.equal(app.fields.get('data').min, '2026-10-13');
  assert.notEqual(app.fields.get('data').validationMessage, '');
  assert.notEqual(app.fields.get('telefon').validationMessage, '');
  app.fields.get('data').value = '2026-11-14';
  app.fields.get('telefon').value = '+40 771 793 146';
  app.window.dispatch('pageshow');
  assert.equal(app.fields.get('data').validationMessage, '');
  assert.equal(app.fields.get('telefon').validationMessage, '');
});

test('enhancement is safe on pages without a booking form', () => {
  vm.runInNewContext(script, {document: {querySelector: () => null}});
});
