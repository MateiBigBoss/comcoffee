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
const parseControls = source => [...source.matchAll(/<(input|select|textarea)\b([^>]*)(?:>([\s\S]*?)<\/\1\s*>|>)/gi)].map(([, tag, source, content = '']) => ({tag, attributes: attributes(source), content}));
const controls = parseControls(formMatch[2]);
// Each step is a top-level fieldset of the form; nested fieldsets group radio tiles.
const stepSources = formMatch[2].split(/<fieldset class="booking-group"/).slice(1);
const stepIds = stepSources.map(source => parseControls(source).map(control => control.attributes.id).filter(Boolean));
const EVENT_TYPES = ['nunta', 'corporate', 'targ-festival', 'petrecere-privata', 'altceva'];

// This harness executes the production script without a browser or network.
// Its checkValidity double covers only the declared constraints used here;
// browser rendering, CAPTCHA, actual delivery and native validation UI are not tested.
class Element {
  constructor(attrs = {}) {
    this.attrs = attrs;
    this.listeners = new Map();
    this.value = attrs.value ?? '';
    this.min = attrs.min ?? '';
    this.max = attrs.max ?? '';
    this.type = attrs.type ?? '';
    this.name = attrs.name ?? '';
    this.id = attrs.id ?? '';
    this.required = Object.hasOwn(attrs, 'required');
    this.checked = Object.hasOwn(attrs, 'checked');
    this.defaultChecked = this.checked;
    this.hidden = true;
    this.disabled = Object.hasOwn(attrs, 'disabled');
    this.textContent = '';
    this.validationMessage = '';
    this.dataset = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5).replace(/-(\w)/g, (_, letter) => letter.toUpperCase()), value]));
    const classes = new Set();
    this.classList = {add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle: (name, force) => (force ?? !classes.has(name)) ? classes.add(name) : classes.delete(name)};
  }
  set innerHTML(_) { throw new Error('User-controlled data must not be written with innerHTML.'); }
  addEventListener(name, handler) {
    const handlers = this.listeners.get(name) ?? [];
    handlers.push(handler);
    this.listeners.set(name, handlers);
  }
  dispatch(name, extra = {}) {
    const event = {defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra};
    for (const handler of this.listeners.get(name) ?? []) handler(event);
    return event;
  }
  setCustomValidity(message) { this.validationMessage = message; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
}

class MemoryStorage {
  constructor(entries = {}) { this.data = new Map(Object.entries(entries)); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}
const DRAFT_KEY = 'com-contact-draft';

function setup({protocol = 'https:', search = '', initial = {}, stepped = false, storage} = {}) {
  const fields = new Map();
  for (const {tag, attributes: attrs, content} of controls) {
    if (!attrs.id) continue;
    const element = new Element(attrs);
    element.tag = tag;
    if (tag === 'select') {
      element.options = [...content.matchAll(/<option\b([^>]*)>([^<]*)<\/option>/g)].map(([, source, textContent]) => ({...attributes(source), textContent}));
      element.value = element.options[0]?.value ?? '';
    }
    if (Object.hasOwn(initial, attrs.id)) {
      if (attrs.type === 'radio') element.checked = initial[attrs.id];
      else element.value = initial[attrs.id];
    }
    fields.set(attrs.id, element);
  }
  const form = new Element();
  const group = name => [...fields.values()].filter(field => field.attrs.name === name);
  const valid = field => {
    if (field.disabled) return true;
    if (field.validationMessage) return false;
    const {type, required, step} = field.attrs;
    if (type === 'radio') return required === undefined || group(field.attrs.name).some(other => other.checked);
    if (required !== undefined && (type === 'checkbox' ? !field.checked : field.value === '')) return false;
    if (!field.value) return true;
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) return false;
    if (type === 'date' && field.min && field.value < field.min) return false;
    if (type === 'number') {
      const number = Number(field.value);
      if (!Number.isFinite(number) || (field.min !== '' && number < Number(field.min)) || (field.max !== '' && number > Number(field.max))) return false;
      if (step && step !== 'any' && !Number.isInteger((number - Number(field.min || 0)) / Number(step))) return false;
    }
    return true;
  };
  form.focused = [];
  for (const field of fields.values()) {
    field.checkValidity = () => valid(field);
    field.focus = () => { form.focused.push(field.attrs.id); };
  }
  const steps = stepIds.map(ids => {
    const step = new Element();
    step.hidden = false;
    step.focused = 0;
    step.focus = () => { step.focused++; };
    step.querySelectorAll = selector => (selector === 'input, select, textarea' ? ids.map(id => fields.get(id)) : []);
    return step;
  });
  form.querySelector = selector => fields.get(selector.slice(1));
  form.querySelectorAll = selector => {
    const name = selector.match(/^input\[name="([^"]+)"\]$/)?.[1];
    if (name) return group(name);
    if (selector === '[data-step]') return stepped ? steps : [];
    if (selector === 'input[id], textarea[id]') return [...fields.values()];
    return [];
  };
  form.reset = () => {
    for (const field of fields.values()) {
      field.value = field.attrs.value ?? '';
      field.checked = field.defaultChecked;
    }
  };
  form.getBoundingClientRect = () => ({top: 0});
  form.scrollIntoView = () => {};
  form.validityChecks = 0;
  form.validityReports = 0;
  form.checkValidity = () => {
    form.validityChecks++;
    return [...fields.values()].every(valid);
  };
  form.reportValidity = () => { form.validityReports++; return form.checkValidity(); };
  const status = new Element();
  const notice = new Element();
  const summary = new Element();
  const summaryValues = new Map(['tip', 'data', 'invitati', 'durata', 'ora', 'oras'].map(key => [key, new Element()]));
  summary.querySelector = selector => summaryValues.get(selector.match(/"([^"]+)"/)?.[1]);
  const window = new Element();
  window.location = {protocol, search};
  window.innerHeight = 800;
  if (storage !== undefined) Object.defineProperty(window, 'localStorage', {get: () => { if (storage === 'blocked') throw new Error('SecurityError'); return storage; }});
  let now = new Date(2026, 9, 12, 0, 15);
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now.getTime()])); }
    static now() { return now.getTime(); }
  }
  const draftNote = new Element();
  const draftClear = new Element();
  const elements = new Map([
    ['[data-booking-form]', form], ['[data-booking-status]', status],
    ['[data-booking-summary]', summary], ['[data-local-preview]', notice],
    ['[data-draft-note]', draftNote], ['[data-draft-clear]', draftClear],
  ]);
  vm.runInNewContext(script, {document: {querySelector: selector => elements.get(selector), querySelectorAll: () => []}, window, Date: Clock, URLSearchParams}, {filename: 'contact.js'});
  const checkType = type => { for (const field of group('Tip eveniment')) field.checked = field.value === type; form.dispatch('change'); };
  return {
    form, fields, steps, status, notice, summary, summaryValues, window, draftNote, draftClear,
    checkType,
    checkedType: () => group('Tip eveniment').find(field => field.checked)?.value ?? '',
    visibleStep: () => steps.findIndex(step => !step.hidden),
    click: attribute => form.dispatch('click', {target: {closest: () => ({hasAttribute: name => name === attribute.split('=')[0], dataset: {goto: attribute.split('=')[1]}})}}),
    setDate: next => { now = next; },
    input(id, value) { const field = fields.get(id); field.value = value; field.dispatch('input'); form.dispatch('input', {target: field}); },
    change(id, value) { fields.get(id).value = value; form.dispatch('change', {target: fields.get(id)}); },
    complete() {
      checkType('nunta');
      for (const [id, value] of Object.entries({data: '2026-11-14', invitati: '120', oras: 'Cluj-Napoca', nume: 'Test local', email: 'test@example.invalid', telefon: '+40 771 793 146'})) this.input(id, value);
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
  for (const id of ['data', 'invitati', 'oras', 'nume', 'email', 'telefon', 'acord']) {
    assert.ok(byId.get(id)?.name, `${id} needs a payload name.`);
    assert.ok(Object.hasOwn(byId.get(id), 'required'), `${id} must be required.`);
  }
  for (const id of ['ora', 'durata', 'locatie', 'organizatie', 'preferinte', 'detalii']) assert.ok(byId.get(id)?.name, `${id} needs a payload name.`);
  const types = controls.filter(control => control.attributes.name === 'Tip eveniment').map(control => control.attributes);
  assert.deepEqual(types.map(attrs => attrs.value), EVENT_TYPES);
  assert.ok(types.every(attrs => attrs.type === 'radio' && Object.hasOwn(attrs, 'required') && attrs['data-label']), 'Event type is one required radio group with summary labels.');
  const placement = controls.filter(control => control.attributes.name === 'Amplasarea barului').map(control => control.attributes);
  assert.deepEqual(placement.map(attrs => attrs.value), ['De stabilit', 'Interior', 'Exterior acoperit', 'Exterior']);
  assert.deepEqual(placement.filter(attrs => Object.hasOwn(attrs, 'checked')).map(attrs => attrs.value), ['De stabilit'], 'Placement defaults to deciding together.');
  for (const [id, attrs] of byId) {
    assert.equal(Object.hasOwn(attrs, 'disabled'), false, `${id} must be sent.`);
    assert.ok(new RegExp(`<label\\b[^>]*\\bfor="${id}"`).test(formMatch[2]), `${id} needs a label.`);
  }
  assert.equal(byId.get('invitati').type, 'number');
  assert.equal(byId.get('invitati').min, '1');
  assert.equal(byId.get('invitati').step, '1');
  assert.equal(byId.get('invitati').max, '3000');
  assert.deepEqual([byId.get('durata').min, byId.get('durata').max, byId.get('durata').step], ['0.5', '12', '0.5']);
  assert.equal(byId.get('email').type, 'email');
  assert.equal(byId.get('data').type, 'date');
  assert.equal(byId.get('acord').type, 'checkbox');
  assert.doesNotMatch(html + script, /cererea a fost trimisă|rezervarea (?:ta )?este confirmată/i);
});

test('without JavaScript every step is visible and only enhancement controls start hidden', () => {
  assert.equal(stepIds.length, 4);
  assert.deepEqual(stepIds.flat().sort(), controls.filter(control => control.attributes.id).map(control => control.attributes.id).sort(), 'Every named field belongs to a step.');
  for (const match of formMatch[2].matchAll(/<fieldset\b([^>]*)>/g)) {
    assert.equal(Object.hasOwn(attributes(match[1]), 'hidden'), false, 'Steps must not be hidden in HTML.');
    assert.equal(Object.hasOwn(attributes(match[1]), 'disabled'), false, 'Steps must not disable their fields.');
  }
  for (const match of html.matchAll(/<\w+\b([^>]*\bdata-(?:step-ui|js-only)\b[^>]*)>/g)) assert.ok(Object.hasOwn(attributes(match[1]), 'hidden'), match[0]);
  assert.ok(stepIds[3].includes('acord'), 'Consent and sending sit in the final step.');
});

test('event links accept only known choices and preserve restored selections', () => {
  for (const type of EVENT_TYPES) {
    const app = setup({search: `?tip=${type}`});
    assert.equal(app.checkedType(), type);
    assert.notEqual(app.summaryValues.get('tip').textContent, '—');
  }
  for (const type of ['', 'necunoscut', '<img src=x onerror=alert(1)>']) {
    const app = setup({search: `?tip=${encodeURIComponent(type)}`});
    assert.equal(app.checkedType(), '');
    assert.equal(app.summaryValues.get('tip').textContent, '—');
  }
  assert.equal(setup({search: '?tip=nunta', initial: {'tip-corporate': true}}).checkedType(), 'corporate');
});

test('summary updates through textContent on input/change without HTML injection', () => {
  const app = setup();
  assert.equal(app.summary.hidden, false);
  const label = '<img src=x onerror=alert(1)>';
  app.fields.get('tip-nunta').dataset.label = label;
  app.checkType('nunta');
  assert.equal(app.summaryValues.get('tip').textContent, label);
  assert.equal(app.summaryValues.get('tip').classList.contains('is-set'), true);
  app.input('invitati', '150');
  assert.equal(app.summaryValues.get('invitati').textContent, '150');
  app.input('data', '2026-11-14');
  assert.equal(app.summaryValues.get('data').textContent, new Date(2026, 10, 14, 12).toLocaleDateString('ro-RO', {day: 'numeric', month: 'long', year: 'numeric'}));
  app.input('data', '');
  assert.equal(app.summaryValues.get('data').textContent, '—');
  assert.equal(app.summaryValues.get('data').classList.contains('is-set'), false);
  app.input('oras', '  Cluj-Napoca ');
  assert.equal(app.summaryValues.get('oras').textContent, 'Cluj-Napoca');
  app.input('oras', '12');
  assert.equal(app.summaryValues.get('oras').textContent, '—', 'Only a real place reaches the sheet.');
  app.input('ora', '14:00');
  assert.equal(app.summaryValues.get('ora').textContent, '14:00');
  for (const [value, label] of [['4', '4 ore'], ['1', '1 oră'], ['0.5', '0,5 ore'], ['57', '—'], ['', '—']]) {
    app.input('durata', value);
    assert.equal(app.summaryValues.get('durata').textContent, label, value);
  }
  app.input('invitati', '1200');
  assert.equal(app.summaryValues.get('invitati').textContent, (1200).toLocaleString('ro-RO'));
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
    for (const stepped of [false, true]) {
      const app = setup({protocol, stepped});
      app.complete();
      if (stepped) app.click('data-goto=3');
      const before = [...app.fields].map(([id, field]) => [id, field.value, field.checked]);
      assert.equal(app.form.dispatch('submit').defaultPrevented, false);
      assert.equal(app.form.validityReports, 0);
      assert.deepEqual([...app.fields].map(([id, field]) => [id, field.value, field.checked]), before);
      assert.ok([...app.fields.values()].every(field => !field.disabled));
      assert.match(app.status.textContent, /nu reprezintă încă o rezervare confirmată/);
      assert.equal(app.notice.hidden, true);
    }
  }
});

test('invalid submissions remain on the form, including native number and required constraints', () => {
  for (const [id, value] of [['invitati', '-1'], ['invitati', '1.5'], ['invitati', '0'], ['email', 'invalid'], ['nume', ''], ['tip', ''], ['data', '2026-10-11'], ['telefon', 'letters']]) {
    const app = setup();
    app.complete();
    if (id === 'tip') app.checkType(value);
    else app.input(id, value);
    assert.equal(app.form.dispatch('submit').defaultPrevented, true, `${id}=${value}`);
    assert.equal(app.form.validityReports, 1);
    assert.equal(app.status.textContent, '');
    if (id === 'invitati') assert.equal(app.summaryValues.get(id).textContent, '—');
  }
  const app = setup();
  app.complete();
  app.fields.get('acord').checked = false;
  assert.equal(app.form.dispatch('submit').defaultPrevented, true, 'Contact consent is required.');
  app.fields.get('acord').checked = true;
  assert.equal(app.form.dispatch('submit').defaultPrevented, false, 'Corrected form can proceed.');
});

test('steps show one fieldset, check the step being left and never lose values', () => {
  const app = setup({stepped: true});
  assert.equal(app.form.classList.contains('is-stepped'), true);
  assert.deepEqual(app.steps.map(step => step.hidden), [false, true, true, true]);
  app.click('data-step-next');
  assert.equal(app.visibleStep(), 0, 'Empty first step stays visible.');
  assert.equal(app.form.focused.at(-1), 'tip-nunta');
  app.checkType('corporate');
  app.input('data', '2026-11-14');
  app.input('invitati', '80');
  app.click('data-step-next');
  assert.equal(app.visibleStep(), 1);
  assert.equal(app.steps[1].focused, 1, 'Focus moves to the new step.');
  app.click('data-goto=3');
  assert.equal(app.visibleStep(), 1, 'Skipping ahead stops at the first incomplete step.');
  assert.equal(app.form.focused.at(-1), 'oras');
  app.input('oras', 'Brașov');
  assert.equal(app.form.dispatch('keydown', {key: 'Enter', target: {tagName: 'INPUT'}}).defaultPrevented, true, 'Enter advances instead of submitting.');
  assert.equal(app.visibleStep(), 2);
  assert.equal(app.form.dispatch('keydown', {key: 'Enter', target: {tagName: 'TEXTAREA'}}).defaultPrevented, false);
  app.click('data-step-back');
  assert.equal(app.visibleStep(), 1, 'Going back is always allowed.');
  app.click('data-goto=0');
  assert.equal(app.visibleStep(), 0);
  assert.equal(app.checkedType(), 'corporate');
  assert.equal(app.fields.get('oras').value, 'Brașov');
});

test('submitting early advances; a final submit reveals the step holding an error', () => {
  const app = setup({stepped: true});
  app.complete();
  assert.equal(app.form.dispatch('submit').defaultPrevented, true, 'Implicit submission on step 1 only advances.');
  assert.equal(app.visibleStep(), 1);
  assert.equal(app.form.validityReports, 0);
  app.click('data-goto=3');
  assert.equal(app.visibleStep(), 3);
  app.input('nume', '');
  assert.equal(app.form.dispatch('submit').defaultPrevented, true);
  assert.equal(app.visibleStep(), 2, 'The step with the missing name is shown and the field focused.');
  assert.equal(app.form.focused.at(-1), 'nume');
  assert.equal(app.form.validityReports, 0, 'Romanian inline messages replace the browser bubble.');
});

test('realistic limits reject impossible values with Romanian messages', () => {
  const app = setup();
  const cases = [
    ['durata', ['57', '12.5', '4.25', '0.2'], ['0.5', '4', '4.5', '12']],
    ['invitati', ['3001', '1.5', '0'], ['1', '120', '3000']],
    ['data', ['2028-10-13', '2026-10-11'], ['2026-10-12', '2028-10-12']],
    ['oras', ['12', 'x'], ['Cluj-Napoca', 'Sector 3, București']],
    ['nume', ['Ion3', 'A', 'test@x'], ['Ana-Maria O’Neil', 'Ștefan Pop']],
    ['email', ['a@b', 'nume@exemplu', 'nume @exemplu.ro'], ['nume@exemplu.ro', 'a.b@firma.com']],
  ];
  for (const [id, bad, good] of cases) {
    for (const value of bad) {
      app.input(id, value);
      assert.equal(app.fields.get(id).checkValidity(), false, `${id}=${value}`);
    }
    for (const value of good) {
      app.input(id, value);
      assert.equal(app.fields.get(id).validationMessage, '', `${id}=${value}`);
      assert.equal(app.fields.get(id).checkValidity(), true, `${id}=${value}`);
    }
  }
  app.input('durata', '57');
  assert.match(app.fields.get('durata').validationMessage, /Cel mult 12 ore/);
  app.input('invitati', '5000');
  assert.match(app.fields.get('invitati').validationMessage, /spune-ne la detalii/);
});

test('a draft survives leaving the page and returns to the same step, without consent', () => {
  const storage = new MemoryStorage();
  const first = setup({stepped: true, storage});
  first.complete();
  first.input('durata', '5');
  first.click('data-goto=2');
  assert.equal(first.visibleStep(), 2);
  first.window.dispatch('pagehide');
  const saved = JSON.parse(storage.getItem(DRAFT_KEY));
  assert.equal(saved.step, 2);
  assert.equal(saved.values['Tip eveniment'], 'nunta');
  assert.equal(saved.values.oras, 'Cluj-Napoca');
  assert.equal(Object.hasOwn(saved.values, 'acord'), false, 'Consent is never stored.');
  assert.equal(Object.hasOwn(saved.values, 'Amplasarea barului'), false, 'Untouched defaults are not stored.');
  assert.equal(first.draftNote.hidden, false);

  const back = setup({stepped: true, storage});
  assert.equal(back.checkedType(), 'nunta');
  for (const [id, value] of [['data', '2026-11-14'], ['invitati', '120'], ['durata', '5'], ['oras', 'Cluj-Napoca'], ['nume', 'Test local'], ['email', 'test@example.invalid']]) assert.equal(back.fields.get(id).value, value, id);
  assert.equal(back.fields.get('acord').checked, false);
  assert.equal(back.visibleStep(), 2, 'The visitor returns to the step they left.');
  assert.equal(back.summaryValues.get('oras').textContent, 'Cluj-Napoca');
  assert.equal(back.draftNote.hidden, false);
});

test('restoring never overwrites autofill and never skips an incomplete step', () => {
  const storage = new MemoryStorage({[DRAFT_KEY]: JSON.stringify({savedAt: new Date(2026, 9, 12).getTime(), step: 3, values: {nume: 'Din ciornă', oras: '', 'Tip eveniment': 'corporate'}})});
  const app = setup({stepped: true, storage, initial: {nume: 'Completat automat'}});
  assert.equal(app.fields.get('nume').value, 'Completat automat');
  assert.equal(app.checkedType(), 'corporate');
  assert.equal(app.visibleStep(), 0, 'Date and guests are missing, so the first step opens.');
});

test('old, corrupt or blocked storage is ignored and the form still works', () => {
  const old = new MemoryStorage({[DRAFT_KEY]: JSON.stringify({savedAt: new Date(2026, 9, 1).getTime(), step: 1, values: {oras: 'Iași'}})});
  assert.equal(setup({storage: old}).fields.get('oras').value, '');
  assert.equal(old.getItem(DRAFT_KEY), null, 'Drafts older than a week are removed.');
  const corrupt = new MemoryStorage({[DRAFT_KEY]: '{not json'});
  assert.equal(setup({storage: corrupt}).fields.get('oras').value, '');
  const blocked = setup({storage: 'blocked'});
  blocked.complete();
  assert.equal(blocked.form.dispatch('submit').defaultPrevented, false);
});

test('sending or "Șterge datele" removes the draft', () => {
  const storage = new MemoryStorage();
  const app = setup({stepped: true, storage});
  app.complete();
  assert.notEqual(storage.getItem(DRAFT_KEY), null);
  app.click('data-goto=3');
  assert.equal(app.form.dispatch('submit').defaultPrevented, false);
  assert.equal(storage.getItem(DRAFT_KEY), null);
  app.window.dispatch('pagehide');
  assert.equal(storage.getItem(DRAFT_KEY), null, 'Leaving for FormSubmit does not save it again.');

  const other = setup({stepped: true, storage});
  other.complete();
  other.click('data-goto=2');
  other.draftClear.dispatch('click');
  assert.equal(storage.getItem(DRAFT_KEY), null);
  assert.equal(other.fields.get('oras').value, '');
  assert.equal(other.checkedType(), '');
  assert.equal(other.visibleStep(), 0);
  assert.equal(other.summaryValues.get('oras').textContent, '—');
  assert.equal(other.draftNote.hidden, true);
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
  app.fields.get('tip-nunta').checked = false;
  app.fields.get('tip-corporate').checked = true;
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

test('database submission keeps the draft until server confirmation', () => {
 const storage=new MemoryStorage(),app=setup({stepped:true,storage});
 app.form.setAttribute('action','/api/enquiries');app.complete();app.click('data-goto=3');
 assert.equal(app.form.dispatch('submit').defaultPrevented,false);
 assert.notEqual(storage.getItem(DRAFT_KEY),null);
 app.window.dispatch('pagehide');assert.notEqual(storage.getItem(DRAFT_KEY),null);
 app.form.dispatch('booking:saved');assert.equal(storage.getItem(DRAFT_KEY),null);
 app.window.dispatch('pagehide');assert.equal(storage.getItem(DRAFT_KEY),null);
});
