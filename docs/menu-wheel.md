# Roata de cafea — 15 octombrie 2026

## Scop

Pagina Meniu urmează schița proprietarului: semicerc în stânga, fotografie mare
pentru băutura selectată, vecine transparente deasupra și dedesubt, detalii în
dreapta. Homepage-ul și efectul logo-ului sunt păstrate.

Ramură: `codex/menu-coffee-wheel`, bază locală `8433b68`. Preluarea de pe origin
a eșuat din cauza conexiunii Git; această versiune nu pretinde sincronizarea cu
eventuale modificări mai recente de pe GitHub.

## Comportament și fișiere

- `site/cafea.html`: păstrează toate cele 12 rețete, ml și shoturi; adaugă conturul,
  lista pliabilă și comenzile lângă roată. `data-color` controlează conturul;
  culoarea reprezintă vizual băutura, nu o măsurătoare de cofeină. Pentru schimbarea
  nuanței, actualizează și `--drink-color` al bulinei corespunzătoare.
- `site/assets/css/menu.css`: semicerc, fotografii în poziții orbitale, stări
  estompate, detalii și adaptare pe o coloană sub 700px.
- `site/assets/js/menu-wheel.js`: cinci poziții orbitale, dintre care trei vizibile.
  Fotografiile rămân drepte în timpul rotirii. Pașii vecini folosesc o mișcare comună
  de 680ms; salturile directe și schimbările de categorie folosesc ieșire/intrare.
- `site/assets/js/menu.js`: încărcare înaintea schimbării, selecții rapide,
  sincronizarea detaliilor, navigare circulară în categorie și tastatură.
- `scripts/test-menu-switcher.mjs`: teste integrate ale roții și selectorului.

Săgețile și lista se folosesc cu tastatura. Home/End aleg prima/ultima băutură;
săgețile tastaturii funcționează în listă și în zona roții. Nu interceptăm scrollul.
Preferința pentru mișcare redusă elimină animația; fără JavaScript rămân fotografia
inițială și meniul complet. La eroare de încărcare rămâne băutura precedentă și
apare posibilitatea de reîncercare. Nu sunt adăugate biblioteci sau fotografii noi.

## Verificare

Verificările automate pentru site și meniul interactiv au trecut, inclusiv
sincronizarea fotografiei centrale, culorii și detaliilor, rotirea peste capetele
categoriei, click pe vecini, selecții rapide, reîncercare după eroare, tastatură și
mișcare redusă. Aspectul și animația pe desktop/mobil necesită verificare vizuală:
instrumentul de browser nu a pornit în această sesiune (eroare la inițializarea
fișierelor sale). Testele automate nu înlocuiesc această verificare.

Previzualizare: `node scripts/serve.mjs 4190`, apoi
<http://127.0.0.1:4190/cafea.html>.
