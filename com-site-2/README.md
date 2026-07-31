# com-site-2 — site-ul standului de cafea „com.”

Prototip static (HTML/CSS/JS, fără build) construit pe baza brief-ului din `CLAUDE.md`.
Temă deschisă, alb neutru, cu un singur accent verde-gri — **nu** combinația
interzisă crem `#F4F1EA` + teracotă `#D97757` (§0).

## Rulare

Deschide `index.html` direct în browser, sau:

```
npx serve com-site-2
```

## Structură

```
index.html            Acasă — hero foto cu standul + evenimente + teaser poveste
cafea.html            meniul de băuturi = switcher-ul animat (mutat de pe Acasă)
evenimente.html       tipuri de evenimente + galerie + formular de ofertă (conversia)
despre.html           schelet de poveste (conținut de la proprietar)
contact.html          date de contact (DE COMPLETAT) + același formular
assets/css/style.css  tot stilul
assets/js/data.js     TOATE datele de conținut (băuturi, evenimente)
assets/js/switcher.js motorul exit/enter al switcher-ului de pe /cafea
assets/js/main.js     formularul de ofertă
```

Pagina „Unde ne găsești” (programul de opriri publice) a fost eliminată —
standul lucrează în principal evenimente private, deci site-ul nu afișează
un program public.

## Paletă (provizorie — §5, în așteptarea culorilor de brand)

| Nume       | Hex       | Rol                                        |
|------------|-----------|--------------------------------------------|
| `--hartie` | `#FAFAF8` | fundal — alb neutru, ușor rece              |
| `--cerneala` | `#1E201C` | text                                      |
| `--salvie` | `#59634C` | accentul unic (verde-gri, din suprafața foto) |
| `--ceata`  | `#EDEFE9` | panouri, fundaluri secundare                |
| `--cafea`  | `#6B4B33` | ton cald de susținere, doar detalii mici    |
| `--linie`  | `#DFE1DA` | contururi                                   |

## Tipografie (§4)

- Titluri: **Archivo 800/900** — stand-in cu suport românesc confirmat.
  Candidatul din brief e **Franklyn**, dar trebuie verificat întâi:
  tastați **„Degustare în București — știi, ață, față”** în greutatea display
  și inspectați ș/ț la dimensiune mare. Virgulă dedesubt = ok; sedilă = respins.
- Corp: Inter. Utilitar (contor, date, etichete): IBM Plex Mono.
- Diacriticele din tot codul sunt formele corecte cu virgulă
  (`U+0219`/`U+021B`), normalizate NFC.

## Switcher-ul (§7) — cum se montează cadrele reale

Motorul din `switcher.js` implementează exact modelul din brief:
`exit(A)` → suprapunere ~180ms → `enter(B)`, cu schimbul de text în bătaia
goală. Deocamdată scena e desenată **procedural** (cană, lingură, boabe peste
placa de suprafață comună), pentru că fotografiile nu există încă.

Când sosesc secvențele reale (`[varietate]_exit_000.webp …` etc.):

1. Placa de suprafață devine o singură imagine desenată în `paintSurface()`.
2. `drawScene(index, t)` se înlocuiește cu desenarea cadrului
   `Math.round(t * (N-1))` din secvența `enter` a varietății — exit-ul e
   aceeași secvență cu indicii rulați invers, deci nu are nevoie de cod nou.
3. Preîncărcare: doar exit-ul varietății curente + enter-ul probabil următor.
4. Still-ul „enter end-state” al fiecărei varietăți = fallback-ul
   `prefers-reduced-motion` (deja tratat în motor: se sare direct la `t = 1`).

Nimic altceva (drivere, text, swatch-uri, coadă de tranziții) nu se atinge.

## Ce e demonstrativ vs. real

Tot conținutul marcat vizibil cu **⚠️ DE COMPLETAT** vine de la proprietar
(lista din §12 din brief): povestea și numele, logo, contact + social,
personalitatea de brand, culorile de brand, verificarea Franklyn, meniul real
de cafele, tipurile reale de evenimente + foto, galeria.

În plus, față de brief: **formularul nu are backend** — la trimitere arată
doar starea de succes. E nevoie de un endpoint (email/API) înainte de lansare.

Cele 7 băuturi și textele lor din `assets/js/data.js` sunt **exemple** ca
designul să poată fi judecat — se înlocuiesc, nu se păstrează.
Prețurile și descrierile băuturilor sunt demonstrative; numele (Espresso,
Cappuccino, Iced Latte/Latte, Flat White, Cortado, Macchiato, Long Black)
sunt cele reale.
