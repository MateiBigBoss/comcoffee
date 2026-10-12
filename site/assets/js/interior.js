/* Progressive motion only: content and navigation work without this script. */
(() => {
  'use strict';
  if (!document.body.classList.contains('interior')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const elements = [...document.querySelectorAll('[data-reveal]')];
  let observer;
  let frame = 0;
  let progress;

  const revealAll = () => {
    if (observer) observer.disconnect();
    elements.forEach(element => element.classList.remove('is-awaiting'));
  };
  const updateProgress = () => {
    frame = 0;
    if (!progress || reduced.matches) return;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const value = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
    progress.style.setProperty('--read-progress', String(value));
  };
  const scheduleProgress = () => {
    if (!frame && !reduced.matches) frame = window.requestAnimationFrame(updateProgress);
  };
  try {
    if (!reduced.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-awaiting');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
      elements.forEach(element => {
        // No hidden hero or nested-hidden content, and no layout waiting for JS.
        if (element.getBoundingClientRect().top >= window.innerHeight && !element.parentElement.closest('[data-reveal]')) {
          observer.observe(element);
          element.classList.add('is-awaiting');
        }
      });
    }
    progress = document.createElement('div');
    progress.className = 'page-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress);
    window.addEventListener('pageshow', scheduleProgress);
    document.addEventListener('load', scheduleProgress, true);
    reduced.addEventListener('change', () => {
      if (reduced.matches) revealAll();
      scheduleProgress();
    });
    document.addEventListener('focusin', event => {
      const section = event.target.closest('[data-reveal]');
      if (section) {
        section.classList.remove('is-awaiting');
        if (observer) observer.unobserve(section);
      }
    });
    updateProgress();
  } catch {
    revealAll();
  }
})();
