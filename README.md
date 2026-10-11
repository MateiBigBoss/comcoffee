# com. — specialty coffee for events

Un singur site static, cu homepage animat și meniu fotografic de 12 băuturi. Nu necesită instalarea de pachete sau build.

## Vezi site-ul

Deschide [site/index.html](site/index.html) în browser. Pagina de meniu este [site/cafea.html](site/cafea.html); numele fișierului este păstrat pentru compatibilitatea legăturilor.

## Structură

| Folder / fișier | Rol |
| --- | --- |
| site/ | Cele cinci pagini: Acasă, Meniu, Evenimente, Despre, Contact |
| site/assets/css/ | Stiluri comune, homepage și meniu |
| site/assets/js/ | Animația logo-ului, meniul și interacțiunile comune |
| site/assets/img/ | Logo-uri, cele 12 fotografii de băuturi, galerie și faviconuri |
| docs/ | Design, cantități, lucru cu agenții și istoricul reorganizării |
| scripts/ | Verificări fără dependențe |
| .github/ | Verificări automate și șabloane pentru issues/PR-uri |
| AGENTS.md, CLAUDE.md, GEMINI.md | Instrucțiuni pentru asistenții care lucrează pe proiect |

## Editează meniul

În site/cafea.html, butonul fiecărei băuturi conține numele, culoarea, fotografia și valorile în ml. Instrucțiuni și tabel: [docs/design-menu.md](docs/design-menu.md). Cantitățile sunt orientative, de confirmat de proprietar. Numărul boabelor este cel solicitat de proprietar.

## Verifică modificările

Din rădăcina proiectului, cu Node.js instalat:

    node scripts/check-site.mjs
    node scripts/test-menu-switcher.mjs
    git diff --check

GitHub Actions rulează cele două verificări la push și Pull Request. Pentru modificări de aspect verifică și site-ul în browser pe desktop și mobil.

## Publicare și limite

Directorul de publicat este site/, fără docs/, scripts/ sau fișierele pentru agenți. Repository-ul nu configurează publicarea automată. Formularele sunt încă demonstrative, iar unele texte/fotografii de evenimente sunt provizorii; acestea nu au fost eliminate prin reorganizare.

Versiunile vechi nu mai ocupă foldere separate în proiectul activ. Sunt recuperabile din istoricul Git, fără pierderea designului actual: [detalii](docs/project-organization.md).
