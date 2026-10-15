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
- `site/assets/css/menu.css`: contur semicircular exterior în dreapta paharului,
  linie scurtă orientată spre pahar și accente de salvie, caramel și albastru
  stins în fundal. Conturul are acum 6px, o nuanță unitară derivată din băutură
  și un accent tonal care urmărește rotirea. Traseul punctat și segmentele
  multicolore au fost eliminate. Linia scurtă are 4px și capete rotunjite, iar
  reperul selecției are 12px. Adaptare pe o coloană sub 700px.
- `site/assets/js/menu-wheel.js`: cinci poziții orbitale, dintre care trei vizibile.
  Fotografiile rămân drepte. Băutura centrală este mare (84%, maximum 500px pe
  desktop), vecinele sunt la 40% din această dimensiune și la 26% opacitate.
  Pe traseul de 62°, paharul care pleacă se micșorează devreme, iar cel care vine
  crește târziu: 21 de cadre cheie previn suprapunerea la mijlocul tranziției.
  Pașii vecini folosesc o mișcare comună de 820ms și reciclează numai elementul
  invizibil; fotografia care ajunge în centru își păstrează nodul și sursa, evitând
  un schimb vizibil la final. Salturile directe și schimbările de categorie folosesc
  ieșire/intrare de 430ms pe fază. Sosirea adaugă o așezare verticală discretă de 6px.
  Segmentele colorate ale conturului se rotesc în aceeași direcție.
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
sincronizarea fotografiei centrale, culorii și detaliilor, scara diferită a
fotografiilor centrale/secundare și păstrarea nodului imaginii la sosire, rotirea peste capetele
categoriei, click pe vecini, selecții rapide, reîncercare după eroare, tastatură și
mișcare redusă. Testul calculează și separarea casetelor fotografiilor centrală și
nouă în 101 poziții din cadrele reale ale animației, la șase dimensiuni de scenă,
inclusiv între cadrele cheie. Aspectul și animația pe desktop/mobil necesită verificare vizuală:
instrumentul de browser nu a pornit în această sesiune (eroare la inițializarea
fișierelor sale). Testele automate nu înlocuiesc această verificare.

Previzualizare: `node scripts/serve.mjs 4190`, apoi
<http://127.0.0.1:4190/cafea.html>.
