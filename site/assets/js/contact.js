/* Progressive enhancement: native validation and native POST own submission.
   Without this script every step is visible and the form still posts. */
(() => {
  const form = document.querySelector('[data-booking-form]');
  if (!form) return;
  const byId = id => form.querySelector(`#${id}`);
  const types = [...form.querySelectorAll('input[name="Tip eveniment"]')];
  const date = byId('data');
  const guests = byId('invitati');
  const hours = byId('durata');
  const time = byId('ora');
  const city = byId('oras');
  const name = byId('nume');
  const email = byId('email');
  const phone = byId('telefon');
  const prefs = byId('preferinte');
  const details = byId('detalii');
  const status = document.querySelector('[data-booking-status]');
  const summary = document.querySelector('[data-booking-summary]');
  const localNotice = document.querySelector('[data-local-preview]');
  const counter = document.querySelector('[data-count]');
  const isLocalFile = window.location.protocol === 'file:';
  const EMPTY = '—';
  const MAX_YEARS_AHEAD = 2;
  const isoDay = day => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const formatNumber = value => value.toLocaleString('ro-RO');
  const hoursLabel = value => `${formatNumber(value)} ${value === 1 ? 'oră' : value >= 20 ? 'de ore' : 'ore'}`;

  // Realistic limits. Each rule returns a Romanian message, or '' when the value is acceptable.
  // Empty required fields are left to `required`; the inline message for them is written below.
  const rules = new Map([
    [date, value => {
      const today = new Date();
      const latest = new Date(today.getFullYear() + MAX_YEARS_AHEAD, today.getMonth(), today.getDate());
      if (value < isoDay(today)) return 'Alege o dată de astăzi înainte.';
      if (value > isoDay(latest)) return `Primim cereri pentru următorii ${MAX_YEARS_AHEAD} ani. Pentru o dată mai îndepărtată, scrie-ne direct.`;
      return '';
    }],
    [guests, value => {
      const count = Number(value);
      if (!Number.isInteger(count) || count < 1) return 'Scrie un număr întreg de invitați, de la 1 în sus.';
      if (count > Number(guests.max)) return `Cel mult ${formatNumber(Number(guests.max))} de invitați în formular. Pentru un eveniment mai mare, spune-ne la detalii.`;
      return '';
    }],
    [hours, value => {
      const count = Number(value);
      if (!Number.isFinite(count) || count < Number(hours.min)) return 'Cel puțin o jumătate de oră (0,5).';
      if (count > Number(hours.max)) return `Cel mult ${hours.max} ore pe zi. Pentru evenimente mai lungi sau de mai multe zile, spune-ne la detalii.`;
      if (!Number.isInteger(count * 2)) return 'Folosește ore întregi sau jumătăți de oră, de exemplu 4 sau 4,5.';
      return '';
    }],
    [city, value => ((value.match(/\p{L}/gu) || []).length < 2 ? 'Scrie localitatea, de exemplu Cluj-Napoca.' : '')],
    [name, value => {
      if (/\d/.test(value) || !/^[\p{L}\s.'’-]+$/u.test(value)) return 'Numele poate conține doar litere, spații și cratime.';
      if ((value.match(/\p{L}/gu) || []).length < 2) return 'Scrie numele întreg.';
      return '';
    }],
    [email, value => (/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(value) ? '' : 'Verifică adresa de email, de exemplu nume@exemplu.ro.')],
    [phone, value => {
      const digits = value.replace(/\D/g, '');
      const valid = /^[+\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
      return valid ? '' : 'Introdu un număr de telefon valid, cu 7–15 cifre. Poți folosi +, spații, puncte, paranteze sau cratime.';
    }],
  ].filter(([control]) => control));
  const validate = control => {
    const rule = rules.get(control);
    if (!rule) return;
    const value = control.value.trim();
    control.setCustomValidity(value ? rule(value) : '');
  };
  const validateAll = () => {
    date.min = isoDay(new Date());
    rules.forEach((_, control) => validate(control));
  };

  // Inline messages appear once a field has been left or a step check failed. They replace
  // the browser's bubble, which follows the browser language rather than the page.
  const errorFor = control => form.querySelector(`[data-error-for="${control.type === 'radio' ? 'tip' : control.id}"]`);
  const showError = control => {
    const target = errorFor(control);
    if (!target) return;
    const invalid = !control.checkValidity();
    let message = '';
    if (invalid) message = control.type === 'radio' ? 'Alege ocazia.' : rules.get(control) && control.value.trim() ? control.validationMessage : 'Completează acest câmp.';
    target.textContent = message;
    if (control.type !== 'radio') control.setAttribute('aria-invalid', String(invalid));
    const field = control.closest && control.closest('.booking-field');
    if (field) field.classList.toggle('has-error', invalid);
  };
  const touched = new Set();

  const checkedType = () => types.find(input => input.checked);
  const updateSummary = () => {
    if (!summary) return;
    const set = (key, value) => {
      const target = summary.querySelector(`[data-summary="${key}"]`);
      if (!target) return;
      target.textContent = value || EMPTY;
      target.classList.toggle('is-set', Boolean(value));
    };
    const type = checkedType();
    set('tip', type ? type.dataset.label : '');
    const parsed = date.value ? new Date(`${date.value}T12:00:00`) : null;
    set('data', parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('ro-RO', {day:'numeric', month:'long', year:'numeric'}) : '');
    set('invitati', guests.value && !rules.get(guests)(guests.value) ? formatNumber(Number(guests.value)) : '');
    set('durata', hours && hours.value && !rules.get(hours)(hours.value) ? hoursLabel(Number(hours.value)) : '');
    set('ora', time ? time.value : '');
    set('oras', city && city.value.trim() && !rules.get(city)(city.value.trim()) ? city.value.trim() : '');
  };
  const updateCount = () => {
    if (counter && details) counter.textContent = `${details.value.length} / ${details.maxLength}`;
  };

  // Draft: what the visitor typed survives a visit to another page. It stays only in this
  // browser, expires after a week and is removed when the request is sent or on request.
  // Consent is never stored; it is given again for every request.
  const DRAFT_KEY = 'com-contact-draft';
  const DRAFT_DAYS = 7;
  const draftNote = document.querySelector('[data-draft-note]');
  const draftClear = document.querySelector('[data-draft-clear]');
  const storage = (() => { try { return window.localStorage || null; } catch { return null; } })();
  const draftControls = [...form.querySelectorAll('input[id], textarea[id]')].filter(control => control.type !== 'checkbox');
  let draftStep = 0;
  let sent = false;
  const readDraft = () => {
    if (!storage) return null;
    try {
      const draft = JSON.parse(storage.getItem(DRAFT_KEY));
      if (draft && draft.values && typeof draft.values === 'object' && draft.savedAt > Date.now() - DRAFT_DAYS * 864e5) return draft;
      storage.removeItem(DRAFT_KEY);
    } catch { /* blocked or corrupt storage: start empty */ }
    return null;
  };
  const saveDraft = () => {
    if (!storage || sent) return;
    const values = {};
    draftControls.forEach(control => {
      if (control.type === 'radio') {
        if (control.checked && !control.defaultChecked) values[control.name] = control.value;
      } else if (control.value) values[control.id] = control.value;
    });
    const filled = Object.keys(values).length > 0;
    try {
      if (filled) storage.setItem(DRAFT_KEY, JSON.stringify({savedAt: Date.now(), step: draftStep, values}));
      else storage.removeItem(DRAFT_KEY);
    } catch { /* full or blocked storage: the form still works */ }
    if (draftNote) draftNote.hidden = !filled;
  };
  const clearDraft = () => {
    try { if (storage) storage.removeItem(DRAFT_KEY); } catch { /* nothing stored */ }
    if (draftNote) draftNote.hidden = true;
  };
  const draft = readDraft();
  if (draft) {
    draftControls.forEach(control => {
      const value = draft.values[control.type === 'radio' ? control.name : control.id];
      if (typeof value !== 'string') return;
      if (control.type === 'radio') control.checked = control.value === value;
      else if (!control.value) control.value = value;
    });
    draftStep = Number.isInteger(draft.step) ? draft.step : 0;
  }
  if (draftNote) draftNote.hidden = !draft;

  // Accept only known event types; never inject URL text into HTML.
  const requestedType = new URLSearchParams(window.location.search).get('tip');
  const requested = types.find(input => input.value === requestedType);
  if (!checkedType() && requested) requested.checked = true;
  if (localNotice) localNotice.hidden = !isLocalFile;
  if (summary) summary.hidden = false;
  document.querySelectorAll('[data-js-only]').forEach(element => { element.hidden = false; });
  validateAll();
  updateSummary();
  updateCount();
  date.addEventListener('focus', validateAll);
  form.addEventListener('input', event => {
    validate(event.target);
    if (touched.has(event.target)) showError(event.target);
    updateSummary();
    saveDraft();
  });
  form.addEventListener('change', event => {
    if (event.target && event.target.type === 'radio') showError(event.target);
    updateSummary();
    saveDraft();
  });
  form.addEventListener('focusout', event => {
    if (!event.target || !rules.has(event.target) && !event.target.required) return;
    touched.add(event.target);
    validate(event.target);
    showError(event.target);
  });
  if (details) details.addEventListener('input', updateCount);

  // Steppers: guests in tens, hours in halves, always inside the field limits.
  document.querySelectorAll('[data-adjust]').forEach(button => button.addEventListener('click', () => {
    const input = byId(button.dataset.adjust);
    const delta = Number(button.dataset.by);
    const min = Number(input.min);
    const max = Number(input.max);
    const current = Number(input.value);
    const base = input.value && Number.isFinite(current) ? current : 0;
    if (!base && delta < 0) return;
    const next = Math.min(max, Math.max(min, Math.round((base + delta) / Math.abs(delta)) * Math.abs(delta) || min));
    input.value = String(next);
    validate(input);
    if (touched.has(input)) showError(input);
    updateSummary();
    saveDraft();
  }));

  // Menu suggestions toggle words in the same free-text field that is posted.
  const chips = [...document.querySelectorAll('[data-chip]')];
  const prefItems = () => prefs.value.split(',').map(item => item.trim()).filter(Boolean);
  const same = (a, b) => a.toLocaleLowerCase('ro') === b.toLocaleLowerCase('ro');
  const syncChips = () => {
    const items = prefItems();
    chips.forEach(chip => chip.setAttribute('aria-pressed', String(items.some(item => same(item, chip.dataset.chip)))));
  };
  chips.forEach(chip => chip.addEventListener('click', () => {
    const items = prefItems();
    const index = items.findIndex(item => same(item, chip.dataset.chip));
    if (index >= 0) items.splice(index, 1);
    else items.push(chip.dataset.chip);
    const next = items.join(', ');
    if (next.length > prefs.maxLength) return;
    prefs.value = next;
    syncChips();
    saveDraft();
  }));
  if (prefs) prefs.addEventListener('input', syncChips);
  syncChips();

  // Copy the email address. In-app browsers (e.g. Instagram) may block the
  // Clipboard API, so fall back to a temporary selection.
  const copyStatus = document.querySelector('[data-copy-status]');
  const legacyCopy = text => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('copy blocked');
  };
  document.querySelectorAll('[data-copy]').forEach(button => {
    let timer = 0;
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        try { await navigator.clipboard.writeText(button.dataset.copy); }
        catch { legacyCopy(button.dataset.copy); }
        button.classList.add('is-copied');
        if (copyStatus) copyStatus.textContent = 'Adresa de email a fost copiată.';
      } catch {
        if (copyStatus) copyStatus.textContent = 'Nu am putut copia adresa. Folosește linkul de email.';
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.classList.remove('is-copied');
        if (copyStatus) copyStatus.textContent = '';
      }, 2200);
    });
  });

  // Steps: one fieldset at a time. Moving forward checks the steps being left;
  // going back is always allowed. Hidden steps are never disabled, so all values post.
  const steps = [...form.querySelectorAll('[data-step]')];
  const stepped = steps.length > 1;
  const progress = document.querySelector('[data-booking-progress]');
  const progressItems = progress ? [...progress.querySelectorAll('[data-goto]')] : [];
  const stepOf = new Map();
  let current = 0;
  const controlsIn = step => [...step.querySelectorAll('input, select, textarea')];
  const show = (index, moveFocus) => {
    current = index;
    draftStep = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    progressItems.forEach((item, i) => {
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-done', i < index);
    });
    if (!moveFocus) return;
    saveDraft();
    steps[index].focus({preventScroll: true});
    const anchor = progress || form;
    const top = anchor.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * .6) anchor.scrollIntoView({block: 'start'});
  };
  const firstInvalid = index => {
    validateAll();
    const invalid = controlsIn(steps[index]).filter(control => !control.checkValidity());
    invalid.forEach(control => { touched.add(control); showError(control); });
    return invalid[0];
  };
  const goTo = target => {
    for (let index = current; index < target; index++) {
      const invalid = firstInvalid(index);
      if (invalid) {
        if (index !== current) show(index, false);
        invalid.focus();
        return;
      }
    }
    show(target, true);
  };
  if (stepped) {
    steps.forEach((step, index) => controlsIn(step).forEach(control => stepOf.set(control, index)));
    form.classList.add('is-stepped');
    form.querySelectorAll('[data-step-ui]').forEach(element => { element.hidden = false; });
    form.addEventListener('click', event => {
      const target = event.target.closest && event.target.closest('[data-step-next], [data-step-back], [data-goto]');
      if (!target) return;
      if (target.hasAttribute('data-step-next')) goTo(current + 1);
      else if (target.hasAttribute('data-step-back')) show(Math.max(0, current - 1), true);
      else goTo(Number(target.dataset.goto));
    });
    // Enter in a single-line field moves to the next step instead of submitting early.
    form.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing || current === steps.length - 1) return;
      if (event.target.tagName !== 'INPUT') return;
      event.preventDefault();
      goTo(current + 1);
    });
    // Return to the saved step, but never past a step that still needs attention.
    const reachable = Math.min(Math.max(0, draftStep), steps.length - 1);
    const open = steps.slice(0, reachable).findIndex(step => controlsIn(step).some(control => !control.checkValidity()));
    show(open === -1 ? reachable : open, false);
  }

  // "Șterge": empty the form and forget the saved draft.
  if (draftClear) draftClear.addEventListener('click', () => {
    form.reset();
    clearDraft();
    touched.clear();
    form.querySelectorAll('[data-error-for]').forEach(target => { target.textContent = ''; });
    form.querySelectorAll('.has-error').forEach(field => field.classList.remove('has-error'));
    form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
    validateAll();
    updateSummary();
    updateCount();
    syncChips();
    if (stepped) show(0, true);
  });
  window.addEventListener('pagehide', saveDraft);

  // Autofill and browser back navigation can restore values after initialization.
  window.addEventListener('pageshow', () => {
    validateAll();
    updateSummary();
    updateCount();
    syncChips();
    sent = false;
    if (status) status.textContent = '';
  });
  form.addEventListener('submit', event => {
    if (isLocalFile) {
      event.preventDefault();
      if (status) status.textContent = 'Copia locală nu trimite cereri. Folosește site-ul online sau scrie-ne la comcoffee.events@gmail.com.';
      return;
    }
    if (stepped && current < steps.length - 1) {
      event.preventDefault();
      goTo(current + 1);
      return;
    }
    validateAll();
    if (!form.checkValidity()) {
      event.preventDefault();
      // Reveal the step holding the first problem so the browser can point at it.
      const invalid = [...stepOf.keys()].find(control => !control.checkValidity());
      if (invalid) {
        show(stepOf.get(invalid), false);
        touched.add(invalid);
        showError(invalid);
        invalid.focus();
      } else form.reportValidity();
      return;
    }
    // The request leaves for FormSubmit now; the local draft is no longer needed.
    sent = true;
    clearDraft();
    // No AJAX success message: FormSubmit handles CAPTCHA and its response page.
    // Do not disable fields or erase values; preserve the complete POST payload.
    if (status) status.textContent = 'Continui pe pagina securizată de trimitere. Cererea nu reprezintă încă o rezervare confirmată.';
  });
})();
