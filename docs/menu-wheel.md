# Meniu — prezentare inspirată de referința proprietarului

Actualizare: 16 octombrie 2026. Ramură: `codex/menu-coffee-wheel`.

## Compoziție

O singură scenă colorată: titlul băuturii și descrierea în stânga, fotografia
principală în centru, cantitățile și shoturile în dreapta. Categoriile sunt sus,
într-un selector compact. Arcul de 3px din spatele paharului păstrează ideea de
roată, cu un accent care se rotește. Fără cadran, gradații sau numerotare.

Cele 12 fundaluri sunt definite prin `data-scene` în `site/cafea.html`, în tonuri
de caramel, crem și salvie. `data-color` controlează accentul; nu reprezintă o
măsurătoare a cofeinei. Textul rămâne închis la culoare pe toate fundalurile.

Fotografia principală își păstrează proporțiile și limita de 500px pe desktop.
Vecinele au 32% din dimensiunea principală și 26% opacitate. Umbra ovală sugerează
suspendarea produsului. Lista cu buline rămâne într-o coloană, sub prezentare,
și se deschide la cerere; nu modifică înălțimea scenei.

Sub 900px: titlu, scenă, săgeți, cantități și contact pe o coloană. Fotografia
principală are maximum 336px. Traseul este mai vertical pentru a încăpea pe mobil.
Homepage-ul, celelalte pagini, fotografiile, rețetele și cantitățile sunt păstrate.

## Mișcare

`site/assets/js/menu-wheel.js` proiectează o orbită diagonală: următoarea cafea
vine din dreapta-jos și crește spre centru; precedenta se micșorează spre stânga-sus.
Săgeata inversă parcurge traseul înapoi. Pe desktop, traseul este mai lat și mai
puțin înalt; pe mobil rămâne compact. Cupa nu se deformează și rămâne verticală.

Pașii vecini durează 920ms. Salturile directe au două faze de 460ms, ieșire și
intrare. Fotografia se încarcă înaintea tranziției. Elementul care ajunge în
centru este păstrat, fără schimbarea sursei vizibile la final. Intrarea cupelor
depărtate este întârziată prin opacitate pentru a nu se suprapune cu vecinele.

`site/assets/js/menu.js` sincronizează textul cu mișcarea: ieșire de 160ms,
intrare de 600ms. Fundalul se schimbă în aceeași perioadă. Cantitățile, boabele,
categoria și fotografia corespund selecției. Selecțiile rapide păstrează ultima
intenție. La eroare, selecția precedentă rămâne disponibilă și se poate reîncerca.

Săgețile, lista și categoriile sunt accesibile din tastatură. Home/End și săgețile
funcționează inclusiv pe butoanele de navigare mutate lângă titlu. Mișcarea redusă
elimină animațiile. Fără JavaScript rămân prima băutură și meniul complet.

## Verificare și previzualizare

- `node scripts/check-site.mjs`: legături, ancore, resurse și sintaxă.
- `node scripts/test-menu-switcher.mjs`: 12 fotografii, selecții rapide, categorii,
  reîncercare, ml/shoturi, culori, nodul imaginii, navigare circulară și tastatură.
  Verifică separarea casetelor fotografiilor vizibile în 101 momente ale tranziției,
  la șase dimensiuni de scenă, pe traseul desktop și mobil.
- `git diff --check`: formatarea modificărilor.

Browserul de automatizare nu oferă suprafețe disponibile în sesiunea curentă;
aspectul la desktop/mobil și tranzițiile necesită confirmare vizuală. Testele
nu reprezintă o verificare vizuală. Capturile proprietarului ghidează compoziția,
fără a pretinde reproducerea exactă a temporizării videoclipului.

Previzualizare pe calculator, din acest folder:

    node scripts/serve.mjs 4191

Deschide http://127.0.0.1:4191/cafea.html. Nu este publicat pe internet.
