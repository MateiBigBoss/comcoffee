# Albumul paginii Evenimente

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

Clipurile MOV furnizate nu sunt incluse în această variantă fotografică și nu au fost modificate.

## Verificare

Verificările de site, meniu, animații comune și contact trec; diferențele nu ating homepage-ul sau celelalte pagini. Previzualizarea acestei copii: `node scripts/serve.mjs 4188`, apoi `http://127.0.0.1:4188/evenimente.html`.

Verificarea vizuală a acestei revizii în browser este încă necesară: instrumentul de browser nu a putut inițializa sesiunea locală. Verificările vizuale consemnate în `inner-pages.md` se referă la varianta anterioară. Nu este afirmată publicarea sau trimiterea acestei ramuri pe GitHub.
