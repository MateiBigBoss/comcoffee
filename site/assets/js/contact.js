/* Progressive enhancement: native validation and native POST own submission. */
(() => {
  const form = document.querySelector('[data-booking-form]');
  if (!form) return;
  const byId = id => form.querySelector(`#${id}`);
  const type = byId('tip');
  const date = byId('data');
  const guests = byId('invitati');
  const phone = byId('telefon');
  const status = document.querySelector('[data-booking-status]');
  const summary = document.querySelector('[data-booking-summary]');
  const localNotice = document.querySelector('[data-local-preview]');
  const isLocalFile = window.location.protocol === 'file:';
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const updateDate = () => {
    date.min = today();
    date.setCustomValidity(date.value && date.value < date.min ? 'Alege o dată de astăzi înainte.' : '');
  };
  const updatePhone = () => {
    const value = phone.value.trim();
    const digits = value.replace(/\D/g, '');
    const valid = /^[+\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
    phone.setCustomValidity(value && !valid ? 'Introdu un număr de telefon valid, cu 7–15 cifre. Poți folosi +, spații, puncte, paranteze sau cratime.' : '');
  };
  const updateSummary = () => {
    if (!summary) return;
    const set = (key, value) => {
      const target = summary.querySelector(`[data-summary="${key}"]`);
      if (target) target.textContent = value;
    };
    set('tip', type.value ? type.options[type.selectedIndex].textContent : 'De ales');
    const parsed = date.value ? new Date(`${date.value}T12:00:00`) : null;
    set('data', parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('ro-RO', {day:'numeric', month:'long', year:'numeric'}) : 'De ales');
    const count = Number(guests.value);
    set('invitati', Number.isInteger(count) && count > 0 ? String(count) : 'De estimat');
  };
  // Accept only known event types; never inject URL text into HTML.
  const requestedType = new URLSearchParams(window.location.search).get('tip');
  if (!type.value && requestedType && Array.from(type.options).some(option => option.value === requestedType && option.value)) type.value = requestedType;
  if (localNotice) localNotice.hidden = !isLocalFile;
  if (summary) summary.hidden = false;
  updateDate();
  updatePhone();
  updateSummary();
  date.addEventListener('input', updateDate);
  date.addEventListener('focus', updateDate);
  phone.addEventListener('input', updatePhone);
  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);
  // Autofill and browser back navigation can restore values after initialization.
  window.addEventListener('pageshow', () => {
    updateDate();
    updatePhone();
    updateSummary();
    if (status) status.textContent = '';
  });
  form.addEventListener('submit', event => {
    if (isLocalFile) {
      event.preventDefault();
      if (status) status.textContent = 'Copia locală nu trimite cereri. Folosește site-ul online sau scrie-ne la comcoffee.events@gmail.com.';
      return;
    }
    updateDate();
    updatePhone();
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }
    // No AJAX success message: FormSubmit handles CAPTCHA and its response page.
    // Do not disable fields or erase values; preserve the complete POST payload.
    if (status) status.textContent = 'Continui pe pagina securizată de trimitere. Cererea nu reprezintă încă o rezervare confirmată.';
  });
})();
