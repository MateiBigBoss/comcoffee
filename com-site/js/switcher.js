/*
 * Switcher-ul de varietăți (hero, §7 din brief) — model modular exit/enter.
 *
 * În build-ul final, tranziția vizuală e un player de secvențe de cadre desenate
 * pe <canvas> peste aceeași placă de fundal: exit(A) → enter(B), suprapuse ~200ms.
 * Cadrele ([varietate]_exit_NNN.webp / [varietate]_enter_NNN.webp) sunt
 * ⚠ DE COMPLETAT (§11), așa că deocamdată aceleași stări exit/enter sunt jucate
 * cu CSS pe placeholder. Un renderer pe canvas cu aceeași secvențiere se
 * montează în locul claselor .is-exiting / .is-pre-enter, fără a schimba
 * mașina de stări de mai jos.
 */
(function () {
  'use strict';

  // ⚠ DE COMPLETAT — lista reală de cafele (sursa de adevăr: pagina Cafea, §6).
  var VARIETIES = [
    {
      name: 'Etiopia<br><em>Yirgacheffe</em>',
      label: 'Etiopia Yirgacheffe',
      desc: 'Prăjire deschisă. Iasomie, lămâie, ceai negru. Măcinată la comandă, la stand.',
      price: '18 lei',
      swatch: '#A87C4F'
    },
    {
      name: 'Columbia<br><em>Huila</em>',
      label: 'Columbia Huila',
      desc: 'Prăjire medie. Caramel, măr roșu, cacao. Măcinată la comandă, la stand.',
      price: '17 lei',
      swatch: '#59392B'
    }
  ];

  var EXIT_MS = 420;
  var ENTER_MS = 420;
  var OVERLAP_MS = 200;

  var hero = document.querySelector('[data-switcher]');
  if (!hero) return;

  var figures = hero.querySelectorAll('.hero-figure');
  var copy = hero.querySelector('.hero-copy');
  var counter = hero.querySelector('[data-counter]');
  var title = hero.querySelector('[data-title]');
  var desc = hero.querySelector('[data-desc]');
  var price = hero.querySelector('[data-price]');
  var swatches = hero.querySelectorAll('.swatch');
  var prevBtn = hero.querySelector('[data-prev]');
  var nextBtn = hero.querySelector('[data-next]');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var current = 0;
  var visibleFigure = 0;
  var busy = false;

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function renderCopy(i) {
    var v = VARIETIES[i];
    counter.textContent = pad(i + 1) + ' / ' + pad(VARIETIES.length);
    title.innerHTML = v.name;
    desc.textContent = v.desc;
    price.textContent = v.price;
  }

  function renderSwatches(i) {
    swatches.forEach(function (btn, idx) {
      btn.classList.toggle('is-active', idx === i);
      if (idx === i) {
        btn.setAttribute('aria-current', 'true');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  function fillFigure(fig, i) {
    fig.querySelector('.cup').style.background = VARIETIES[i].swatch;
  }

  function goTo(i) {
    i = (i + VARIETIES.length) % VARIETIES.length;
    if (i === current || busy) return;
    current = i;

    if (reducedMotion.matches) {
      // fallback obligatoriu (§7): starea finală statică, fără animație
      renderCopy(i);
      renderSwatches(i);
      fillFigure(figures[visibleFigure], i);
      return;
    }

    busy = true;
    renderSwatches(i);

    var outgoing = figures[visibleFigure];
    var incoming = figures[1 - visibleFigure];
    visibleFigure = 1 - visibleFigure;

    outgoing.classList.add('is-exiting');

    // textul se schimbă în pauza dintre exit și enter
    window.setTimeout(function () {
      copy.classList.add('is-swapping');
    }, EXIT_MS - OVERLAP_MS - 180);

    window.setTimeout(function () {
      fillFigure(incoming, i);
      incoming.hidden = false;
      incoming.classList.add('is-pre-enter');
      void incoming.offsetWidth;
      incoming.classList.remove('is-pre-enter');

      renderCopy(i);
      copy.classList.remove('is-swapping');
    }, EXIT_MS - OVERLAP_MS);

    window.setTimeout(function () {
      outgoing.classList.remove('is-exiting');
      outgoing.hidden = true;
      busy = false;
    }, EXIT_MS - OVERLAP_MS + ENTER_MS);
  }

  swatches.forEach(function (btn, idx) {
    btn.addEventListener('click', function () { goTo(idx); });
  });
  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

  hero.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); goTo(current + 1); }
  });

  renderCopy(current);
  renderSwatches(current);
  fillFigure(figures[visibleFigure], current);
})();
