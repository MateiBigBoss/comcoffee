/* Evenimente: occasion tabs. Without this script every occasion is visible
   and the page's single button opens the form without a preselected type. */
(() => {
  'use strict';
  const explorer = document.querySelector('[data-explorer]');
  if (!explorer) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabList = explorer.querySelector('[data-tabs]');
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const cta = document.querySelector('[data-occasion-cta]');
  // WAI-ARIA tabs: arrows, Home, End. The URL hash opens an occasion directly.
  const select = (i, {focus = false, animate = true} = {}) => {
    tabs.forEach((tab, n) => {
      const on = n === i;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
      panels[n].classList.remove('is-entering');
    });
    if (animate && !reduced.matches) { void panels[i].offsetWidth; panels[i].classList.add('is-entering'); }
    if (focus) tabs[i].focus();
    // The single button opens the form with the occasion being looked at.
    if (cta) cta.href = `contact.html?tip=${panels[i].dataset.tip}#formular`;
  };
  tabList.hidden = false;
  explorer.classList.add('is-enhanced');
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => {
      const keys = {ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1};
      if (!(event.key in keys)) return;
      event.preventDefault();
      select((keys[event.key] + tabs.length) % tabs.length, {focus: true});
    });
  });
  const fromHash = () => {
    const i = panels.findIndex(panel => '#' + panel.id === window.location.hash);
    if (i >= 0) { select(i, {animate: false}); explorer.scrollIntoView(); }
  };
  select(0, {animate: false});
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
