# com. — site (direcția 1a)

Implementare statică a designului **„com - Acasă + Cafea"** (Claude Design), direcția **1a**:
serif ca logo-ul (DM Serif Display) + verde-gri mut (`#5F7161`) pe bază albă (`#F6F7F4`).

## Pagini

- `index.html` — **Acasă**: hero cu switcher-ul de varietăți, strip „Următoarele opriri",
  grila de evenimente, teaser „Despre", footer.
- `cafea.html` — **Cafea**: lista standului (demo, 2 rânduri).

Rutele **Evenimente / Unde ne găsești / Despre / Contact** nu sunt încă desenate — link-urile
din nav sunt placeholder (`#`).

## Switcher-ul (js/switcher.js)

Mașina de stări `exit(A) → enter(B)` cu suprapunere ~200ms e implementată; textul se schimbă
în pauza dintre clipuri. Deocamdată stările exit/enter sunt jucate cu CSS pe un placeholder
(cerc în tonul cafelei), pentru că secvențele de cadre reale (`[varietate]_exit_NNN.webp` /
`_enter_NNN.webp`, desenate pe `<canvas>`) sunt **⚠ DE COMPLETAT** — vezi §7 și §11 din brief.
`prefers-reduced-motion` → schimbare instantanee, fără animație. Fără JS → starea statică „01".

Driverul pe scroll (§7) e lăsat pe mai târziu, odată cu player-ul pe canvas — fără cadrele
reale ar însemna doar scroll-hijacking pe un placeholder.

## ⚠ DE COMPLETAT (conținut real, de la proprietar)

Toate golurile de conținut sunt marcate vizibil în pagini cu badge-ul „⚠ DE COMPLETAT":
lista reală de cafele (definește și setul de clipuri), programul pop-up (date + locații),
poze evenimente + tipurile reale, povestea „com.", program / social / contact în footer.
Nimic din acestea nu a fost inventat — vezi §12 din brief pentru lista completă.

## Verificat

- Diacritice românești corecte comma-below (U+0219/U+021B), normalizate NFC, în toate fișierele.
- Responsive: split-ul din hero se restivuiește sub 900px, swatch-urile devin rând orizontal.
- Format date `DD.MM.YYYY`, oră `24h`, prețuri `N lei`.
