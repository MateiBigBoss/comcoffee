# com. — specialty coffee for events

Un singur site static, cu homepage animat, meniu fotografic de 12 băuturi și pagini Evenimente, Despre și Contact. Nu necesită instalarea de pachete sau build.

## Vezi site-ul

Din rădăcina proiectului, cu Node.js instalat, pornește previzualizarea:

    node scripts/serve.mjs

Deschide [http://127.0.0.1:4187](http://127.0.0.1:4187) în browser. Oprești serverul cu `Ctrl+C`. Serverul este accesibil doar de pe acest calculator și servește numai fișierele din `site/`; nu publică site-ul pe internet.

Pentru o privire rapidă poți deschide și [site/index.html](site/index.html) direct. Trimiterea formularului este blocată în previzualizarea `file://` cu JavaScript activ; folosește HTTP(S) pentru verificarea integrării. Pagina de meniu rămâne [site/cafea.html](site/cafea.html), pentru compatibilitatea legăturilor.

## Structură

| Folder / fișier | Rol |
| --- | --- |
| site/ | Cele cinci pagini: Acasă, Meniu, Evenimente, Despre, Contact |
| site/assets/css/ | Stiluri comune, homepage, meniu și cele trei pagini interioare |
| site/assets/js/ | Meniu, interacțiuni la scroll, secțiuni de evenimente și formular |
| site/assets/img/ | Logo-uri, cele 12 fotografii de băuturi, galerie și faviconuri |
| docs/ | Design, cantități, lucru cu agenții și istoricul reorganizării |
| scripts/ | Previzualizare locală și verificări fără dependențe |
| .github/ | Verificări automate și șabloane pentru issues/PR-uri |
| AGENTS.md, CLAUDE.md, GEMINI.md | Instrucțiuni pentru asistenții care lucrează pe proiect |

## Editează meniul

În site/cafea.html, butonul fiecărei băuturi conține numele, culoarea, fotografia și valorile în ml. Instrucțiuni și tabel: [docs/design-menu.md](docs/design-menu.md). Cantitățile sunt orientative, de confirmat de proprietar. Numărul boabelor este cel solicitat de proprietar.

## Evenimente, Despre și Contact

Paginile folosesc fotografiile proprietarului, fundaluri crem și salvie, animații discrete la scroll și interacțiuni compatibile cu tastatura și preferința pentru mișcare redusă. Structura, fișierele și limitele sunt descrise în [nota de implementare](docs/inner-pages.md). Homepage-ul și meniul sunt păstrate neschimbate în această etapă.

## Verifică modificările

Din rădăcina proiectului, cu Node.js instalat:

    node scripts/check-site.mjs
    node scripts/test-menu-switcher.mjs
    node scripts/test-interior.mjs
    node scripts/test-contact.mjs
    git diff --check

`check-site.mjs` semnalează și etichete HTML stricate, texte goale, `@import` plasat greșit și text sub 12 px. GitHub Actions rulează cele patru verificări la push și Pull Request. Acestea verifică fișierele site-ului, meniul, animațiile și comportamentul formularului; nu trimit emailuri. Pentru modificări de aspect verifică și site-ul în browser pe desktop și mobil, inclusiv tastatura și mișcarea redusă.

## Publicare și limite

Directorul de publicat este `site/`, fără `docs/`, `scripts/` sau fișierele pentru agenți. Repository-ul nu configurează publicarea automată.

Formularul trimite cereri prin FormSubmit către **comcoffee.events@gmail.com**, cu CAPTCHA și fără chei în proiect. Înainte de utilizarea publică, proprietarul trebuie să activeze adresa din emailul primit de la FormSubmit și să confirme livrarea unei cereri de probă. **Livrarea completă până în inbox nu a fost verificată.** O cerere nu confirmă automat rezervarea. Pașii de activare, datele transmise și limitele sunt în [docs/contact-setup.md](docs/contact-setup.md). Emailul direct, telefonul și Instagramul sunt disponibile ca alternative.

Versiunile vechi nu mai ocupă foldere separate în proiectul activ. Sunt recuperabile din istoricul Git, fără pierderea designului actual: [detalii](docs/project-organization.md).
