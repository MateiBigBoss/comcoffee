/* ============================================================
   com. — switcher-ul de varietăți (§7 din brief)
   ------------------------------------------------------------
   Modelul de interacțiune (design blocat): exit/enter modular.
   A → B = play exit(A), apoi enter(B), cu o suprapunere de
   ~180ms. Fiecare exit se termină pe EXACT aceeași suprafață
   goală de pe care pornește fiecare enter — aici garantat prin
   faptul că suprafața e un strat static persistent, iar cana și
   recuzita se desenează deasupra ei.

   Producție vs. acum:
   - În producție, exit/enter sunt secvențe de cadre webp
     („[varietate]_exit_000.webp …”) desenate pe <canvas>
     (nu <video> — canvas permite salt la orice cadru și redare
     inversă fiabilă). Vezi README §Cum se conectează cadrele reale.
   - Până există fotografiile (⚠️ DE COMPLETAT §11), un renderer
     PROVIZORIU desenează procedural aceeași coregrafie: cană,
     lingură, boabe peste placa de suprafață comună. Interfața
     (drawEnter/drawExit cu progres t∈[0,1]) e identică, deci
     secvențele reale se montează fără a atinge motorul.
   ============================================================ */

(function () {
  'use strict';

  var hero = document.querySelector('[data-switcher]');
  if (!hero || !window.COM_DATA) return;

  var varieties = window.COM_DATA.varieties;
  var canvas = hero.querySelector('[data-scene]');
  var ctx = canvas.getContext('2d');
  var stage = canvas.parentElement;

  var elCounter = hero.querySelector('[data-counter]');
  var elName = hero.querySelector('[data-name]');
  var elNotes = hero.querySelector('[data-notes]');
  var elMeta = hero.querySelector('[data-meta]');
  var textPanel = hero.querySelector('[data-panel]');
  var swatches = Array.prototype.slice.call(hero.querySelectorAll('[data-swatch]'));
  var btnPrev = hero.querySelector('[data-prev]');
  var btnNext = hero.querySelector('[data-next]');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- ritm (§9: calm, fără bounce, o bătaie de liniște) ------- */
  var EXIT_MS = 560;
  var ENTER_MS = 700;
  var OVERLAP_MS = 180;   /* enter pornește când exit e pe sfârșite */
  var WHEEL_COOLDOWN = 950;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ============================================================
     Placa de suprafață — strat static, identic pentru toate
     varietățile (asta ține „cusătura” exit→enter perfect curată).
     Gri-verde mat, granulație fină, vinietă discretă.
     ============================================================ */
  var surface = document.createElement('canvas');

  function paintSurface(w, h) {
    surface.width = w;
    surface.height = h;
    var s = surface.getContext('2d');

    var g = s.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#B7BCAE');
    g.addColorStop(1, '#A6AC9D');
    s.fillStyle = g;
    s.fillRect(0, 0, w, h);

    /* granulație fină — evită aspectul plat, „de vector” */
    var img = s.getImageData(0, 0, w, h);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * 10;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    s.putImageData(img, 0, 0);

    /* vinietă */
    var v = s.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * 0.35,
                                   w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(30,32,28,0.16)');
    s.fillStyle = v;
    s.fillRect(0, 0, w, h);
  }

  /* ============================================================
     Renderer PROVIZORIU — recuzita fiecărei varietăți.
     Poziții deterministe (seed = indexul varietății), ca aceeași
     cafea să arate mereu la fel.
     ============================================================ */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* recuzita: fiecare piesă are poziție de repaus, direcție de
     intrare și o fereastră proprie în timeline (stagger). */
  function buildProps(index) {
    var rnd = mulberry32(index * 9973 + 7);
    var props = [];

    props.push({ kind: 'cup', x: 0.50, y: 0.47, t0: 0.10, t1: 0.75, dx: 0, dy: 0.05, s0: 1.07 });
    props.push({
      kind: 'spoon', x: 0.20, y: 0.60, rot: -0.35 + rnd() * 0.25,
      t0: 0.00, t1: 0.55, dx: -0.10, dy: 0.02, s0: 1
    });

    var beans = 6 + Math.floor(rnd() * 3);
    for (var i = 0; i < beans; i++) {
      var ang = rnd() * Math.PI * 2;
      var dist = 0.24 + rnd() * 0.20;
      props.push({
        kind: 'bean',
        x: 0.5 + Math.cos(ang) * dist,
        y: 0.47 + Math.sin(ang) * dist * 0.9,
        rot: rnd() * Math.PI,
        shade: rnd(),
        t0: 0.30 + rnd() * 0.35, t1: 1.0,
        dx: Math.cos(ang) * 0.05, dy: Math.sin(ang) * 0.05, s0: 1
      });
    }

    if (index % 2 === 1) {
      props.push({
        kind: 'leaf', x: 0.76, y: 0.25, rot: 0.6 + rnd() * 0.4,
        t0: 0.20, t1: 0.80, dx: 0.07, dy: -0.04, s0: 1
      });
    }
    return props;
  }

  var propCache = varieties.map(function (_, i) { return buildProps(i); });

  function drawCup(c, px, py, R, color, alpha) {
    c.save();
    c.globalAlpha = alpha;

    c.save();
    c.shadowColor = 'rgba(25,27,23,0.30)';
    c.shadowBlur = R * 0.35;
    c.shadowOffsetX = R * 0.10;
    c.shadowOffsetY = R * 0.16;
    c.fillStyle = '#F1EFE9';
    c.beginPath();
    c.arc(px, py, R, 0, Math.PI * 2);
    c.fill();
    c.restore();

    /* toarta (vedere de sus, spre dreapta) */
    c.fillStyle = '#F1EFE9';
    c.beginPath();
    c.ellipse(px + R * 1.18, py + R * 0.10, R * 0.34, R * 0.20, 0.25, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(120,118,110,0.35)';
    c.beginPath();
    c.ellipse(px + R * 1.18, py + R * 0.10, R * 0.16, R * 0.08, 0.25, 0, Math.PI * 2);
    c.fill();

    /* interiorul cănii + cafeaua */
    c.fillStyle = '#DDDAD2';
    c.beginPath();
    c.arc(px, py, R * 0.86, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.arc(px, py, R * 0.76, 0, Math.PI * 2);
    c.fill();

    /* crema — inel discret, mai vizibil la băuturile scurte */
    c.strokeStyle = 'rgba(214,182,142,0.5)';
    c.lineWidth = R * 0.05;
    c.beginPath();
    c.arc(px, py, R * 0.68, 0.4, 2.1);
    c.stroke();

    /* lumină pe buză */
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = R * 0.04;
    c.beginPath();
    c.arc(px, py, R * 0.93, Math.PI * 1.05, Math.PI * 1.6);
    c.stroke();

    c.restore();
  }

  function drawSpoon(c, px, py, L, rot, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(px, py);
    c.rotate(rot);
    c.shadowColor = 'rgba(25,27,23,0.22)';
    c.shadowBlur = L * 0.06;
    c.shadowOffsetY = L * 0.04;

    c.fillStyle = '#C6C4BC';
    c.beginPath();
    c.ellipse(0, -L * 0.32, L * 0.10, L * 0.16, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(90,90,84,0.4)';
    c.beginPath();
    c.ellipse(0, -L * 0.33, L * 0.055, L * 0.10, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#C6C4BC';
    c.beginPath();
    c.moveTo(-L * 0.035, -L * 0.16);
    c.quadraticCurveTo(-L * 0.05, L * 0.25, -L * 0.02, L * 0.52);
    c.lineTo(L * 0.02, L * 0.52);
    c.quadraticCurveTo(L * 0.05, L * 0.25, L * 0.035, -L * 0.16);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawBean(c, px, py, r, rot, shade, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(px, py);
    c.rotate(rot);
    c.shadowColor = 'rgba(25,27,23,0.25)';
    c.shadowBlur = r * 0.5;
    c.shadowOffsetY = r * 0.35;

    var tones = ['#5A4632', '#4C3826', '#3E2E20'];
    c.fillStyle = tones[Math.floor(shade * tones.length)];
    c.beginPath();
    c.ellipse(0, 0, r, r * 0.64, 0, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = 'rgba(20,14,8,0.55)';
    c.lineWidth = r * 0.14;
    c.beginPath();
    c.moveTo(-r * 0.7, 0);
    c.quadraticCurveTo(0, r * 0.25, r * 0.7, 0);
    c.stroke();
    c.restore();
  }

  function drawLeaf(c, px, py, L, rot, alpha) {
    c.save();
    c.globalAlpha = alpha * 0.9;
    c.translate(px, py);
    c.rotate(rot);
    c.shadowColor = 'rgba(25,27,23,0.18)';
    c.shadowBlur = L * 0.08;
    c.shadowOffsetY = L * 0.05;

    c.fillStyle = '#77806A';
    c.beginPath();
    c.moveTo(0, -L * 0.5);
    c.quadraticCurveTo(L * 0.30, -L * 0.1, 0, L * 0.5);
    c.quadraticCurveTo(-L * 0.30, -L * 0.1, 0, -L * 0.5);
    c.fill();

    c.strokeStyle = 'rgba(40,46,34,0.5)';
    c.lineWidth = L * 0.02;
    c.beginPath();
    c.moveTo(0, -L * 0.45);
    c.lineTo(0, L * 0.45);
    c.stroke();
    c.restore();
  }

  /* Desenează recuzita unei varietăți la progresul t∈[0,1].
     t=0: suprafață goală. t=1: scenă completă (starea finală,
     care în producție = still-ul „enter end-state”, §11).
     Exit = același desen cu t rulat 1→0 (indici de cadru inversați). */
  function drawScene(index, t) {
    var w = canvas.width, h = canvas.height;
    var m = Math.min(w, h);
    var props = propCache[index];
    var color = varieties[index].cup;

    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      var lt = (t - p.t0) / (p.t1 - p.t0);
      if (lt <= 0) continue;
      if (lt > 1) lt = 1;
      var e = easeInOutCubic(lt);

      var ox = p.dx * (1 - e) * m;
      var oy = p.dy * (1 - e) * m;
      var px = p.x * w + ox;
      var py = p.y * h + oy;
      var alpha = Math.min(1, e * 1.4);
      var scale = (p.s0 || 1) + (1 - (p.s0 || 1)) * e;

      if (p.kind === 'cup') drawCup(ctx, px, py, m * 0.165 * scale, color, alpha);
      else if (p.kind === 'spoon') drawSpoon(ctx, px, py, m * 0.42, p.rot, alpha);
      else if (p.kind === 'bean') drawBean(ctx, px, py, m * 0.022, p.rot, p.shade, alpha);
      else if (p.kind === 'leaf') drawLeaf(ctx, px, py, m * 0.16, p.rot, alpha);
    }
  }

  function drawFrame(exitIndex, exitT, enterIndex, enterT) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(surface, 0, 0);
    if (exitIndex !== -1 && exitT > 0) drawScene(exitIndex, exitT);
    if (enterIndex !== -1 && enterT > 0) drawScene(enterIndex, enterT);
  }

  /* ============================================================
     Textul din panoul drept — se schimbă în „bătaia goală”
     dintre exit și enter (§7), ca totul să se așeze împreună.
     ============================================================ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function applyText(index) {
    var v = varieties[index];
    elCounter.textContent = pad(index + 1) + ' / ' + pad(varieties.length);
    elName.innerHTML = '';
    v.name.split('\n').forEach(function (line, i) {
      if (i > 0) elName.appendChild(document.createElement('br'));
      elName.appendChild(document.createTextNode(line));
    });
    elNotes.textContent = v.notes;
    elMeta.textContent = v.desc;

    swatches.forEach(function (b, i) {
      b.classList.toggle('is-active', i === index);
      b.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
  }

  function swapText(index) {
    if (reduceMotion.matches) { applyText(index); return; }
    textPanel.classList.add('is-swapping');
    window.setTimeout(function () {
      applyText(index);
      textPanel.classList.remove('is-swapping');
    }, 170);
  }

  /* ============================================================
     Motorul de tranziție — acces aleator (săgeți, scroll, swatch)
     ============================================================ */
  var current = 0;
  var queued = -1;
  var running = false;

  function goTo(target) {
    if (target < 0 || target >= varieties.length) return;
    if (target === current && !running) return;

    if (reduceMotion.matches) {
      /* fallback obligatoriu (§7): direct starea statică finală */
      current = target;
      applyText(target);
      drawFrame(-1, 0, target, 1);
      return;
    }

    if (running) { queued = target; return; }
    running = true;

    var from = current;
    var start = performance.now();
    var textSwapped = false;
    var total = EXIT_MS - OVERLAP_MS + ENTER_MS;

    function tick(now) {
      var tau = now - start;

      var exitT = tau < EXIT_MS ? 1 - easeInOutCubic(Math.min(1, tau / EXIT_MS)) : 0;
      var enterStart = EXIT_MS - OVERLAP_MS;
      var enterT = tau > enterStart
        ? easeInOutCubic(Math.min(1, (tau - enterStart) / ENTER_MS))
        : 0;

      if (!textSwapped && tau >= EXIT_MS - OVERLAP_MS / 2) {
        textSwapped = true;
        swapText(target);
      }

      drawFrame(from, exitT, target, enterT);

      if (tau < total) {
        requestAnimationFrame(tick);
      } else {
        current = target;
        running = false;
        drawFrame(-1, 0, target, 1);
        if (queued !== -1) {
          var q = queued; queued = -1;
          if (q !== current) goTo(q);
        }
      }
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     Drivere: săgeți, swatch-uri, scroll, tastatură, swipe (§7)
     ============================================================ */
  /* la spam de click, motorul reține doar ultima țintă (queued) */
  btnNext.addEventListener('click', function () { goTo(current + 1); });
  btnPrev.addEventListener('click', function () { goTo(current - 1); });

  swatches.forEach(function (b, i) {
    b.addEventListener('click', function () { goTo(i); });
  });

  var lastWheel = 0;
  hero.addEventListener('wheel', function (e) {
    if (reduceMotion.matches) return;
    if (hero.getBoundingClientRect().top < -60) return;
    var dir = e.deltaY > 0 ? 1 : -1;
    var target = current + dir;
    /* la capete lăsăm pagina să curgă mai departe — fără scroll captiv */
    if (target < 0 || target >= varieties.length) return;
    e.preventDefault();
    var now = performance.now();
    if (now - lastWheel < WHEEL_COOLDOWN) return;
    lastWheel = now;
    goTo(target);
  }, { passive: false });

  hero.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
  });

  var touchY = null;
  canvas.addEventListener('touchstart', function (e) {
    touchY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', function (e) {
    if (touchY === null) return;
    var dy = e.changedTouches[0].clientY - touchY;
    touchY = null;
    if (Math.abs(dy) < 40) return;
    goTo(current + (dy < 0 ? 1 : -1));
  }, { passive: true });

  /* ============================================================
     Dimensionare + prima randare
     ============================================================ */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    paintSurface(canvas.width, canvas.height);
    drawFrame(-1, 0, current, 1);
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  applyText(0);
  resize();
})();
