/* ============================================================
   com. — logică de pagină comună (galeria de evenimente)
   ============================================================ */

(function () {
  'use strict';

  /* ---- galerie: bandă care se mișcă orizontal pe scroll (§8) ----
     Scroll-ul vertical rămâne normal (pagina NU se blochează); cât timp
     banda e pe ecran, se translatează stânga→dreapta, legat de progresul
     scroll-ului. Dezactivat la prefers-reduced-motion (scroll manual). */
  (function () {
    var scroller = document.querySelector('[data-gallery-scroll]');
    if (!scroller) return;
    var track = scroller.querySelector('.gallery-track');
    if (!track) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var maxShift = 0;
    var ticking = false;

    function measure() {
      maxShift = Math.max(0, track.scrollWidth - scroller.clientWidth);
    }

    function update() {
      ticking = false;
      if (reduce.matches || maxShift === 0) {
        scroller.classList.remove('is-linked');
        track.style.transform = '';
        return;
      }
      scroller.classList.add('is-linked');
      var rect = scroller.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      /* p: 0 când marginea de sus a benzii intră de jos, 1 când ajunge
         în vârful ecranului — mișcarea se termină cât banda e încă vizibilă */
      var p = (vh - rect.top) / vh;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      /* stânga→dreapta: pornește din capătul drept (-maxShift), ajunge la 0 */
      var x = -maxShift * (1 - p);
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px, 0, 0)';
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
    Array.prototype.forEach.call(track.querySelectorAll('img'), function (img) {
      if (!img.complete) {
        img.addEventListener('load', function () { measure(); update(); });
      }
    });
    reduce.addEventListener('change', function () { measure(); update(); });
  })();
})();
