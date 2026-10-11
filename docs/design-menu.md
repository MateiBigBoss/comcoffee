# Homepage și meniu fotografic

## Scop și responsabilitate

Implementare Codex în site, pe ramura codex/menu-photo-design, pornită din 9915ce9. Solicitare: păstrarea identității vizuale, logo animat pe Acasă și meniu cu fotografiile proprietarului. Versiunile vechi sunt recuperabile din istoricul Git; structura actuală are un singur site.

## Comportament

- Acasă: logo original animat în stânga și mesaj în dreapta; fără fotografia principală. Logo-urile originale sunt păstrate în brand-wordmark.png și brand-signature.jpg.
- Meniu: 12 băuturi, două categorii, selecție prin buline într-o singură coloană, fotografii decupate pe fundal salvie fix. Băutura anterioară iese înainte de intrarea celei noi.
- Fotografiile provin din folderul pozecafea furnizat de proprietar. PNG-urile au fost decupate cu Imagegen; originalele nu sunt modificate. Decuparea AI poate introduce mici diferențe vizuale.
- Cantitate totală, volum de cafea în ml și simboluri pentru shoturi. Numărul boabelor este furnizat de proprietar; volumele sunt propuneri de editat.
- Încărcare înainte de tranziție, reîncercare după eroare, navigare din tastatură și mișcare redusă. Lista completă și prima băutură rămân vizibile fără JavaScript.
- Eticheta de navigație este Meniu; URL-ul cafea.html rămâne compatibil.

## Fișiere active

cafea.html conține datele meniului; assets/js/menu.js gestionează interacțiunea, assets/css/menu.css prezentarea. Pentru Acasă: index.html, assets/css/home.css și assets/js/home.js. Vechile data.js/switcher.js au fost eliminate; meniul folosește doar datele din HTML și menu.js.

## Verificare și limite

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
