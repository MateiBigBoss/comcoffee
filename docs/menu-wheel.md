# Meniu — prezentare inspirată de referința proprietarului

Actualizare: 16 octombrie 2026. Ramură: `codex/menu-coffee-wheel`.

## Compoziție

O singură scenă colorată: titlul băuturii și descrierea în stânga, fotografia
principală în centru, cantitățile și shoturile în dreapta. Categoriile sunt sus,
într-un selector compact. Semicercul decorativ a fost eliminat la cererea
proprietarului; ideea de roată rămâne în traseul animat al paharelor.

Cele 12 fundaluri sunt definite prin `data-scene` în `site/cafea.html`, în tonuri
de caramel, crem și salvie. `data-color` controlează accentul; nu reprezintă o
măsurătoare a cofeinei. Textul rămâne închis la culoare pe toate fundalurile.

Fotografia principală își păstrează proporțiile și limita de 500px pe desktop.
Următoarea băutură are 32% din dimensiunea principală și 26% opacitate.
Băutura precedentă rămâne în afara scenei, invizibilă și fără interacțiune. Umbra ovală sugerează
suspendarea produsului. Lista cu buline rămâne într-o coloană, sub prezentare,
și se deschide la cerere; nu modifică înălțimea scenei.

Sub 900px: titlu, scenă, săgeți, cantități și contact pe o coloană. Fotografia
principală are maximum 336px. Traseul este mai vertical pentru a încăpea pe mobil.
Homepage-ul, celelalte pagini, fotografiile, rețetele și cantitățile sunt păstrate.

## Mișcare

`site/assets/js/menu-wheel.js` proiectează o orbită diagonală: următoarea cafea
vine din dreapta-jos, și crește spre centru; precedenta iese complet
prin stânga-sus, estompându-se. La repaus rămâne o singură miniatură: următoarea.
Săgeata inversă parcurge traseul înapoi. Traseul rămâne în interiorul scenei, separat de text și de cantități;
pe mobil este adaptat la spațiul disponibil. Cupa nu se deformează și rămâne verticală.

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
  Verifică separarea contururilor dreptunghiulare conservatoare ale fotografiilor
  vizibile în 101 momente din fiecare fază, la nouă dimensiuni. Contururile includ
  întregul pahar: au fost măsurate limitele alfa ale celor 12 PNG-uri, fără a
  considera marginile complet transparente drept suprapuneri. Verifică și
  încadrarea în scenă a fotografiilor la repaus.
- `git diff --check`: formatarea modificărilor.

Verificarea vizuală a fost reluată după disponibilizarea browserului integrat:
320px, 390px, 1143px și 1440px. Au fost inspectate scena, descrierile, cantitățile,
categoriile și selecția directă; fără depășire orizontală la dimensiunile verificate.
Testele geometrice rămân separate de această verificare. Capturile proprietarului
ghidează compoziția, fără a pretinde reproducerea exactă a temporizării videoclipului.

Previzualizare pe calculator, din acest folder:

    node scripts/serve.mjs 4191

Deschide http://127.0.0.1:4191/cafea.html. Nu este publicat pe internet.

## Audit și corecții — 16 octombrie

- Scena este decupată separat de text: fotografiile nu mai pot trece peste titlu,
  descriere sau cantități. Raza desktop este limitată la 350px. Înălțimile au fost
  corectate inclusiv pentru ecranele înguste, pentru ca vecinele să încapă la repaus.
- Descriere, compoziție și servire pentru fiecare băutură: `data-description`,
  `data-composition`, `data-serving`. Sunt texte generale, de ajustat de proprietar
  după rețetele exacte; nu includ origini, note de degustare specifice, opțiuni de
  lapte sau afirmații despre alergeni neconfirmate. Datele inițiale în ml și
  numărul boabelor sunt păstrate. Legenda explică simbolurile și cantitățile orientative.
- Spațiul pentru boabe rămâne rezervat și la cold brew, pentru a evita deplasarea
  cantităților; simbolurile rămân ascunse la ambele variante cold brew.
- Categoria este recalculată la fiecare selecție, inclusiv când utilizatorul
  apasă o fotografie încă vizibilă în timpul încărcării altei categorii.
- Fotografiile eșuate pot fi reîncărcate explicit, inclusiv imaginea inițială.
- Navigarea cu săgețile tastaturii este circulară, ca butoanele; Home/End rămân.
- Mișcarea suplimentară de 6px după sosire a fost eliminată. Preferința pentru
  mișcare redusă și păstrarea ultimei selecții sunt în continuare respectate.
- Contrastul textelor mici din scenă a fost verificat numeric pentru cele 12
  palete, inclusiv stratul închis de fundal și categoria inactivă. Contrastul minim de
  4,5:1 este acum verificat automat. Textul secundar exterior a fost închis.

Limită: verificarea vizuală folosește browserul integrat și dimensiuni de viewport
mobile; nu reprezintă o verificare pe un telefon fizic sau în Safari. Mișcarea
redusă și cazurile de încărcare eșuată sunt verificate prin testul de comportament.

Verificările automate pentru paginile interioare, formular și efectul logo-ului
au trecut și ele; testele formularului nu trimit emailuri și nu confirmă livrarea.

## Continuarea auditului — încărcare și încadrare

- O încărcare lentă nu mai ține pe loc o selecție ulterioară. Cererea veche poate
  termina în cache, fără să înlocuiască băutura aleasă între timp.
- Realegerea primei băuturi înainte să eșueze fotografia nu mai ascunde butonul
  de reîncercare. Testul reproduce acest caz și întârzierea unei fotografii.
- La 901–1200px, raza este limitată la 330px, iar scena are 740px înălțime.
  În browser, paharul mic superior era tăiat în varianta anterioară; după corecție,
  toate cele trei pahare încap la repaus. Au fost adăugate dimensiunile intermediare
  și în verificarea geometrică a tranzițiilor.
- Browser: navigare între categorii, selecție directă Cold Brew Tonic, titlu lung
  la 320px, fotografii încărcate și fără mesaje de eroare/avertizare în jurnalul
  capturat. Homepage-ul și celelalte pagini nu au fost modificate în acest pas.

## Fișa băuturii simplificată

Porția și volumul bazei de cafea sunt aliniate în două coloane. Boabele sunt
poziționate sub volumul cafelei, iar ingredientele și servirea sunt grupate dedesubt,
cu separatoare fine. Valorile, descrierile și convențiile pentru cold brew/Babyccino
sunt neschimbate. Pe mobil fișa se așază sub scenă, cu aceleași alinieri.

Semicercul, punctul și linia indicatoare au fost scoase din HTML/CSS, împreună cu
starea JavaScript folosită exclusiv pentru rotirea arcului. Tranzițiile fotografiilor
sunt păstrate. Navigarea circulară din tastatură respectă acum sensul apăsat inclusiv
la trecerea dintre ultima și prima băutură; testul verifică păstrarea imaginii vecine.

Verificări suplimentare în browser: 320px, 901px și 1440px; Babyccino și Cold Brew
Tonic, absența semicercului și încadrarea valorilor de trei cifre. La 901px s-a corectat
spațiul dintre coloanele de cantități. Nu au apărut erori în jurnalul capturat.

## Ieșirea băuturii precedente — 17 octombrie

La următorul pas, cafeaua vizualizată iese din scenă și ajunge la opacitate zero.
Următoarea așteaptă jos-dreapta, deplasată cu aproximativ 49% din raza traseului
față de centrul fotografiei principale. Nu este mutată la marginea extremă.
Butonul „anterioară” și tastatura permit în continuare revenirea; miniatura ascunsă
nu mai este clicabilă. Testele verifică o singură miniatură vizibilă, ieșirea completă,
separarea fotografiilor pe traseu și păstrarea nodului imaginii la sosire.
