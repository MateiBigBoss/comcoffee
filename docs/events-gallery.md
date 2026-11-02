# Pagina Evenimente

## Ocaziile, cu click (noiembrie 2026)

Cerută de proprietar: pagină simplă, doar cu text, fără fotografii, fără bandă sau rând care se derulează și fără câte un buton la fiecare ocazie. Lista din stânga (pe telefon, butoane care încap toate pe ecran, pe mai multe rânduri) schimbă textul și ce stabilim împreună pentru Nunți, Botezuri & familie, Zile de naștere, Petreceri private, Corporate și Târguri & festivaluri. Taburi accesibile: săgeți, Home, End. Ancorele `#nunti`, `#botezuri`, `#aniversari`, `#petreceri-private`, `#corporate`, `#targuri-festivaluri` deschid direct ocazia.

Există un singur buton, rotunjit, sub ocazii. Deschide formularul cu tipul ocaziei selectate (`?tip=nunta`, `petrecere-privata`, `corporate`, `targ-festival`). Fără JavaScript, toate ocaziile sunt afișate una sub alta, iar butonul deschide formularul fără un tip ales. Fișiere: `site/evenimente.html`, `site/assets/css/events.css`, `site/assets/js/events.js`.

## Istoric: albumul anterior

Actualizare de text aprobată ulterior: povestea de pe Acasă și Despre folosește textul „O cafea bună. Un motiv să fim împreună.” și încheierea „com. — din grijă pentru cafea și drag de oameni.”. Au fost eliminate referințele la dans și numerotările decorative de pe pagini și din meniu (cantitățile și shoturile rămân). „unitate” are o corecție optică de -0,08 em față de poziția anterioară, în ambele titluri. Modificarea homepage-ului în această etapă este cerută explicit de proprietar. Testele de site, meniu și contact trec; instrumentul de browser rămâne indisponibil, deci alinierea trebuie confirmată vizual în previzualizare.

Revizie cerută de proprietar: pagina începe acum direct cu „Sărbătoarea voastră. Locul nostru la bar.”. Deschiderea anterioară, indexul albumului și capitolul Beliș au fost scoase din pagină; navigația principală și conținutul următor sunt păstrate. Titlul păstrat este acum H1, prima fotografie se încarcă prioritar, iar capitolele rămase sunt renumerotate. Fișierele foto originale și variantele optimizate sunt păstrate.

Actualizare din 12 octombrie 2026, ramura `codex/events-new-gallery`, pornită din `bdd99b0`. Responsabilitate: `site/evenimente.html`, `site/assets/css/events.css`, fotografiile din `site/assets/img/events-journal/` și această notă. Pagina principală, meniul, Despre și Contact rămân neschimbate.

## Direcție

Deschiderea cu titlu mare deasupra unei fotografii late înlocuiește compoziția cu text și fotografie în două coloane. Albumul are trei capitole cu ancore: Beliș, întâlniri în familie și pauza de cafea. Fotografiile alternează între cadre late, portrete și detalii, pe hârtie deschisă, crem și verde închis. Sunt păstrate secțiunile de servicii, ancorele lor, linkurile care preselectează tipul cererii și pașii colaborării.

Se reutilizează animațiile de scroll accesibile din `interior.js`; efectele de hover sunt discrete și respectă mișcarea redusă. Conținutul rămâne disponibil fără JavaScript. Nu sunt adăugate biblioteci sau dependențe ale site-ului.

## Fotografii

Fotografiile originale furnizate de proprietar au fost orientate după EXIF, redimensionate fără decupare și comprimate WebP. Nu sunt retușate sau generate. Decuparea vizibilă este realizată numai prin CSS `object-fit`. Variantele de 640 și 1600 px însumează aproximativ 1,45 MiB; originalele rămân intacte pe D:.

| Prefix în `events-journal/` | Original |
| --- | --- |
| echipa-la-lucru | belis/IMG_6605.jpg |
| barul-com | belis/IMG_6081.jpg |
| standul-pregatit | belis/IMG_6040.jpg |
| o-cafea-impreuna | belis/IMG_6080.jpg |
| printre-brazi | belis/IMG_6075.jpg |
| cafea-in-familie | pozebinecuvnatre/Binecuvantare-Liam-152.jpg |
| echipa-in-familie | pozebinecuvnatre/Binecuvantare-Liam-115.jpg |
| pauza-de-cafea | tabara/videotelefoneu/IMG_0305.jpeg |

Prefixele echipa-la-lucru, barul-com, o-cafea-impreuna și printre-brazi nu erau folosite de nicio pagină și au fost scoase din folderul publicat; rămân recuperabile din istoricul Git.

Clipurile MOV furnizate nu sunt incluse în această variantă fotografică și nu au fost modificate.

## Verificare

Verificările de site, meniu, animații comune și contact trec; diferențele nu ating homepage-ul sau celelalte pagini. Previzualizarea acestei copii: `node scripts/serve.mjs 4188`, apoi `http://127.0.0.1:4188/evenimente.html`.

Verificarea vizuală a acestei revizii în browser este încă necesară: instrumentul de browser nu a putut inițializa sesiunea locală. Verificările vizuale consemnate în `inner-pages.md` se referă la varianta anterioară. Nu este afirmată publicarea sau trimiterea acestei ramuri pe GitHub.
