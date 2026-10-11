/* Replay the short brand signature. Navigation and content never wait for JS. */
(() => {
  const brand = document.querySelector('[data-brand]');
  const replay = document.querySelector('.replay-brand');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!brand || !replay) return;
  replay.hidden = reduced.matches;
  reduced.addEventListener('change', () => { replay.hidden = reduced.matches; });
  replay.addEventListener('click', () => {
    if (reduced.matches) return;
    brand.classList.add('replay-reset');
    requestAnimationFrame(() => requestAnimationFrame(() => brand.classList.remove('replay-reset')));
  });
})();
