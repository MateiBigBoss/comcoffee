# Homepage și meniu fotografic

## Scop și responsabilitate

Implementare Codex în site, pe ramura codex/menu-photo-design, pornită din 9915ce9. Solicitare: păstrarea identității vizuale, logo animat pe Acasă și meniu cu fotografiile proprietarului. Versiunile vechi sunt recuperabile din istoricul Git; structura actuală are un singur site.

## Comportament

- Acasă: mesajul negru „made for moments.” în stânga și logo original animat în dreapta; pe mobil mesajul precedă logo-ul. Butonul „Descoperă povestea noastră” trimite la secțiunea #povestea-noastra, imediat după banda cu evenimente. Titlul comunitate combină logo-ul original cu „unitate” în Inter. Povestea descrie legătura dintre cafea, oameni și evenimente, fără date sau întâmplări biografice inventate. Fundalurile alternează gri cald, crem și salvie; secțiunea de meniu reutilizează trei fotografii de băuturi. Fără fotografia principală, butonul de reluare sau legătura „Ne vedem la evenimentul tău”. Logo-urile originale sunt păstrate în brand-wordmark.png și brand-signature.jpg; pe site, header-ul, footer-ul și titlul comunitate folosesc varianta vectorială assets/img/logo.svg.
- Meniu: 12 băuturi, două categorii și o scenă colorată inspirată de referința proprietarului. Titlul este în stânga, paharul mare în centru și cantitățile în dreapta. Următoarea băutură este mică și estompată, în dreapta-jos; precedenta iese din scenă; mișcarea păstrează ideea de roată, fără semicerc desenat în fundal. Pe mobil, compoziția trece pe o coloană. Săgețile parcurg circular categoria; lista cu buline rămâne într-o singură coloană, deschisă la cerere. La pași vecini, fotografiile se rotesc împreună; la salturi directe, vechea selecție iese înaintea intrării celei noi. Detalii: [menu-wheel.md](menu-wheel.md).
- Fotografiile provin din folderul pozecafea furnizat de proprietar. PNG-urile au fost decupate cu Imagegen; originalele nu sunt modificate. Site-ul folosește din octombrie 2026 aceleași 12 imagini convertite în WebP cu transparență (aproximativ 1,5 MB în loc de 13,5 MB); PNG-urile rămân în istoricul Git. Decuparea AI poate introduce mici diferențe vizuale.
- Cantitate totală, volum de cafea în ml și simboluri pentru shoturi. Numărul boabelor este furnizat de proprietar; volumele sunt propuneri de editat.
- Încărcare înainte de tranziție, reîncercare după eroare, navigare din tastatură și mișcare redusă. Lista completă și prima băutură rămân vizibile fără JavaScript.
- Eticheta de navigație este Meniu; URL-ul cafea.html rămâne compatibil.

## Fișiere active

### Fotografii de evenimente pe Acasă

Secțiunea #evenimente este un album interactiv, cu titlul „Locuri diferite. Aceeași bucurie.”, fundal verde închis și fotografiile originale ale proprietarului. La mișcarea cursorului apar fotografii succesive numai în această zonă; pe mobil, derularea schimbă imaginea centrală. Butonul „Altă fotografie” oferă acces din tastatură. Sunt păstrate legăturile către pagina Evenimente și celelalte secțiuni ale homepage-ului. Implementare și verificări: [home-moments.md](home-moments.md).

cafea.html conține datele meniului; assets/js/menu.js gestionează interacțiunea, assets/css/menu.css prezentarea. Pentru Acasă: index.html și assets/css/home.css; animația logo-ului este realizată în CSS, iar scriptul exclusiv pentru butonul de reluare a fost eliminat odată cu acesta. Vechile data.js/switcher.js au fost eliminate; meniul folosește doar datele din HTML și menu.js.

## Verificare și limite

Actualizarea comunitate: implementare în index.html și assets/css/home.css, pe ramura codex/home-community, pornită din a4a36a7. Criterii: titlu negru în stânga, logo animat în dreapta, buton către poveste, logo integrat în titlul comunitate, alternarea culorilor și păstrarea meniului existent. Verificarea vizuală a noii poziționări pe desktop și mobil rămâne de făcut: instrumentul de browser nu a putut porni. Verificarea vizuală descrisă mai jos se referă la versiunea anterioară acestei actualizări.

Rulare: node scripts/check-site.mjs și node scripts/test-menu-switcher.mjs. Verificatorul existent acoperă legături locale, ancore, imagini CSS și sintaxă. Testul de comportament acoperă selecții rapide, categorii, limite, eroare/reîncercare, tastatură și mișcare redusă.

Verificare vizuală efectuată în browser la desktop și 390/320 px; fără depășire orizontală. Preferința pentru mișcare redusă este verificată în cod/test, nu emulată în browser. Nu s-au executat review-uri Claude/Gemini. Formularul demo și conținutul provizoriu al paginilor de evenimente/contact rămân în afara acestei etape. Merge-ul și publicarea rămân decizii ale proprietarului.

## Cantități orientative — de confirmat de proprietar

Convenție de lucru: 1 shot = 30 ml, 2 shoturi = 60 ml. Cantitatea este volumul total propus al porției; la băuturile reci este o referință de servire, de ajustat după gheață și rețeta reală. Boabele reprezintă shoturi, nu cantitatea de cofeină. Cold Brew și Cold Brew Tonic nu au simbol de boabă; Babyccino are boabă tăiată.

Valorile se editează în cafea.html, pe butonul fiecărei băuturi: data-volume (total ml), data-coffee-label, data-coffee-ml și data-beans (1, 2, none sau 0). Pentru Espresso se actualizează și valorile inițiale din drink-specs, folosite fără JavaScript.

| Băutură | Total ml | Bază cafea | ml cafea | Boabe |
|---|---:|---|---:|---|
| espresso | 60 | Espresso | 60 | 2 |
| cortado | 120 | Espresso | 60 | 2 |
| macchiato | 60 | Espresso | 30 | 1 |
| flat-white | 180 | Espresso | 60 | 2 |
| cappuccino | 180 | Espresso | 30 | 1 |
| long-black | 200 | Espresso | 60 | 2 |
| latte | 250 | Espresso | 30 | 1 |
| iced-latte | 350 | Espresso | 30 | 1 |
| espresso-tonic | 300 | Espresso | 60 | 2 |
| cold-brew | 250 | Cold brew | 250 | none |
| cold-brew-tonic | 300 | Cold brew | 120 | none |
| babyccino | 150 | Cafea | 0 | 0 |
