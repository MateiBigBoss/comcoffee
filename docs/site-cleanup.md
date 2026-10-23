# Curățenie de design și bug-uri

Ramura `claude/site-cleanup`, pornită din `786abf0`. Scop: un site mai curat și consecvent, fără schimbarea animației logo-ului, a celor 12 fotografii, a roții din meniu, a listei directe, a volumelor sau a boabelor.

## Bug-uri reparate

- Evenimente: navigația către Nunți, Corporate, Târguri & festivaluri și Petreceri private era HTML stricat (`<span</span>`) și apărea ca o bandă verde goală. A fost refăcută cu cele patru legături, deschise de `events.js`.
- Acasă: banda verde cu trei puncte de sub hero a fost eliminată, împreună cu etichetele și numerotările goale.
- Contact: etichetele, asteriscul și paragraful goale din partea de sus au fost eliminate; titlul ocupă acum toată lățimea.
- `home.css` importa DM Sans și Fredoka în mijlocul fișierului, unde browserele ignoră `@import`. Fonturile nu se încărcau pe Acasă.
- Despre: ghilimeaua în plus din `data-reveal">` a fost eliminată.
- `site/.idea/` (setări JetBrains) nu mai este urmărit în Git și ar fi fost publicat odată cu site-ul.

## Consecvență

- Header și footer identice pe toate cele cinci pagini, definite în `style.css`: logo de 26 px, legături de 14 px, „Hai să vorbim” în dreapta pe ecrane late. Butonul dispare sub 1080 px, iar meniul trece pe o coloană sub 760 px, la fel pe fiecare pagină.
- Un singur font încărcat (Inter 400/500/600) și Georgia italic pentru accente. Archivo, DM Sans, IBM Plex Mono și Fredoka nu mai sunt folosite.
- Paletă de zece culori, definită o singură dată în `:root` din `style.css`, în loc de 84 de coduri. Textul secundar `--muted` are cel puțin 5,3:1 pe orice fundal deschis.
- Niciun text sub 12 px; textul de conținut are 14–15 px.
- Texte decorative fără informație eliminate: „O rotire. O nouă preferată.”, „Cafea bună. În felul tău.”, „Alege după gust…”, „Toate preferatele, într-un singur loc.”, „În aer liber”, nota de sub rezumatul formularului și sloganul din subsol.

## Curățenie

- Fotografiile meniului sunt WebP (aproximativ 1,5 MB în loc de 13,5 MB).
- Eliminate: `main.js`, nefolosit de nicio pagină; circa 40 de reguli CSS fără elemente; 9 fotografii vechi din `foto/` și 4 seturi din `events-journal/`, nefolosite. Toate rămân în istoricul Git.
- `scripts/check-site.mjs` verifică acum și etichetele HTML malformate, textele goale, `@import` plasat greșit și textul sub 12 px. Rulat pe versiunea anterioară, semnalează toate bug-urile de mai sus.

## Verificare și limite

`node scripts/check-site.mjs`, `test-menu-switcher`, `test-interior`, `test-contact`, `test-logo-reveal` și `git diff --check` trec. Măsurat în browser la 375, 720, 1040 și 1440 px: header identic pe toate paginile, fără depășire orizontală, fără text sub 12 px. Verificate vizual pe desktop: Acasă și Meniu; pe mobil: Acasă (versiunea anterioară a tuturor paginilor a fost verificată înainte de modificări). Evenimente, Despre și Contact după modificări rămân de confirmat vizual pe desktop și mobil. Nu s-au rulat review-uri Gemini sau Codex. Merge-ul și publicarea rămân decizia proprietarului.
