// Keep direct occasion links useful while disclosures remain native without JavaScript.
(() => {
  const occasions = new Set(['nunti', 'corporate', 'targuri-festivaluri', 'petreceri-private']);
  const openOccasion = hash => {
    const id = hash.replace(/^#/, '');
    if (!occasions.has(id)) return;
    const panel = document.getElementById(id);
    if (panel) panel.open = true;
  };

  openOccasion(window.location.hash);
  window.addEventListener('hashchange', () => openOccasion(window.location.hash));
  document.querySelectorAll('.events-occasion-nav a').forEach(link => {
    link.addEventListener('click', () => openOccasion(link.hash));
  });
})();
