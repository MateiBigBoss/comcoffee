/* Home hero background: coffee poured into milk, seen from above.
   Short strokes follow a slow whirl around the logo; two moving pour points lay the coffee down
   and the pointer stirs it. Decorative only: the canvas is aria-hidden and the page works without it.
   With prefers-reduced-motion it draws one still frame. It pauses while the hero is off screen. */
(() => {
  const hero = document.querySelector('.brand-hero');
  const canvas = hero && hero.querySelector('.hero-swirl');
  const anchor = hero && hero.querySelector('[data-brand]');
  const ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx || !anchor) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Palette: milk for the cup, espresso browns and the site's copper accent for the pour.
  const MILK = ['#F7F1E3', '#F1E8D6', '#EADFC9'];
  const WASH = 'rgba(243,235,219,.011)';
  const COFFEE = ['rgba(96,58,32,.34)', 'rgba(128,80,46,.3)', 'rgba(168,74,34,.34)'];
  const CREMA = ['rgba(176,128,84,.14)', 'rgba(140,100,66,.12)'];
  const RIM = 'rgba(30,32,28,.16)';

  let W = 0, H = 0, cx = 0, cy = 0, R = 0, t = 0, parts = [], pointer = null, raf = 0, visible = true;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[(Math.random() * list.length) | 0];

  function spawn(p) {
    if (Math.random() < .7) {
      const a = t * .0045 + (Math.random() < .5 ? 0 : Math.PI);
      const rr = R * (.62 + .2 * Math.sin(t * .0021));
      p.x = cx + Math.cos(a) * rr + rand(-1, 1) * R * .035;
      p.y = cy + Math.sin(a) * rr + rand(-1, 1) * R * .035;
      p.c = pick(COFFEE); p.w = rand(.6, 1.7);
    } else {
      const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * R;
      p.x = cx + Math.cos(a) * rr; p.y = cy + Math.sin(a) * rr;
      p.c = pick(CREMA); p.w = rand(.5, 1.1);
    }
    p.life = rand(500, 1500);
    return p;
  }

  function cup() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, MILK[0]); g.addColorStop(.75, MILK[1]); g.addColorStop(1, MILK[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = RIM;
    for (const k of [1, 1.09, 1.32]) { ctx.globalAlpha = k === 1 ? 1 : .5; ctx.beginPath(); ctx.arc(cx, cy, R * k + 1, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  function step() {
    t++;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = WASH; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.lineCap = 'round';
    for (const p of parts) {
      const dx = p.x - cx, dy = p.y - cy, r = Math.hypot(dx, dy) || 1;
      if (r > R || --p.life < 0) { spawn(p); continue; }
      const sp = .35 + 1.5 * (r / R);
      const n = Math.sin(p.x * .006 + t * .004) * Math.cos(p.y * .007 - t * .003) * Math.PI;
      let vx = (-dy / r) * sp - (dx / r) * .2 + Math.cos(n) * .3;
      let vy = (dx / r) * sp - (dy / r) * .2 + Math.sin(n) * .3;
      if (pointer) {
        const px = p.x - pointer.x, py = p.y - pointer.y, d = Math.hypot(px, py) || 1;
        if (d < 240) { const f = (1 - d / 240) * 3.2; vx += (-py / d) * f; vy += (px / d) * f; }
      }
      const nx = p.x + vx, ny = p.y + vy;
      ctx.strokeStyle = p.c; ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
      p.x = nx; p.y = ny;
    }
    ctx.restore();
  }

  function setup() {
    const box = canvas.getBoundingClientRect(), mark = anchor.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = box.width; H = box.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = mark.left - box.left + mark.width / 2;
    cy = mark.top - box.top + mark.height / 2;
    R = Math.min(mark.width * .78, H * .46, W * .62);
    t = 0;
    cup();
    parts = Array.from({ length: W < 760 ? 800 : 1500 }, () => spawn({}));
    for (let i = 0, n = still ? 900 : 260; i < n; i++) step();
  }

  function loop() { step(); raf = requestAnimationFrame(loop); }
  function play() { cancelAnimationFrame(raf); if (!still && visible && !document.hidden) raf = requestAnimationFrame(loop); }

  setup();
  play();
  if (!still) {
    hero.addEventListener('pointermove', e => { const b = canvas.getBoundingClientRect(); pointer = { x: e.clientX - b.left, y: e.clientY - b.top }; });
    hero.addEventListener('pointerleave', () => { pointer = null; });
    document.addEventListener('visibilitychange', play);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; play(); }).observe(hero);
  }
  let timer = 0;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { setup(); play(); }, 200); });
})();
