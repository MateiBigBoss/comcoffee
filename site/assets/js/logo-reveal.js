/* A temporary spotlight, never a scratch card: the black logo remains underneath. */
(() => {
  const logo = document.querySelector('[data-brand] .brand-logo');
  if (!logo) return;
  const light = logo.querySelector('[data-brand-light]');
  const texture = logo.querySelector('[data-brand-texture]');
  if (!light || !texture) return;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let point = null;
  let failed = false;
  const hide = () => {
    point = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    logo.removeAttribute('data-reveal-active');
  };
  const paint = () => {
    frame = 0;
    if (!point || failed || !hover.matches || reduce.matches) return;
    const box = logo.getBoundingClientRect();
    if (!box.width || !box.height) return hide();
    const { x, y } = point;
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) return hide();
    // SVG viewBox coordinates; recompute after scroll, zoom and responsive changes.
    light.setAttribute('cx', 140 + (x - box.left) * 790 / box.width);
    light.setAttribute('cy', 190 + (y - box.top) * 205 / box.height);
    const radius = Math.max(42, Math.min(78, box.width * .145));
    light.setAttribute('r', radius * 790 / box.width);
    logo.setAttribute('data-reveal-active', '');
  };
  const move = event => {
    if (event.pointerType === 'touch' || failed || !hover.matches || reduce.matches) return hide();
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(paint);
  };
  logo.addEventListener('pointerenter', move);
  logo.addEventListener('pointermove', move);
  logo.addEventListener('pointerleave', hide);
  logo.addEventListener('pointercancel', hide);
  texture.addEventListener('error', () => { failed = true; hide(); });
  hover.addEventListener('change', hide);
  reduce.addEventListener('change', hide);
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
})();
