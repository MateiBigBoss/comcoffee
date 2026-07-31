# com. — site (versiunea 3)

Site static pentru **com.**, stand mobil de cafea de specialitate. Construit după
brieful din `CLAUDE.md` (rădăcina proiectului), cu temă deschisă (alb hârtie), la
cererea proprietarului.

## Cum îl vezi

Deschide `index.html` direct în browser — nu are build, nu are dependențe.
Fonturile vin de la Google Fonts (Archivo, Inter, IBM Plex Mono).

## Deciziile de design (și de ce)

- **Paletă** (6 valori numite, în `assets/css/style.css`):
  `--hartie #F7F7F5` (fundal, alb rece — NU cremul cald interzis de brief §0),
  `--ink #141412` (cerneala logo-ului), `--salvie #55604F` (accentul unic,
  derivat din suprafața gri-verde a fotografiei de referință), `--platou #A8ADA0`
  (suprafața scenei), `--linie #E2E1DB`, `--eroare #A03B2E`.
  Contrastele au fost calculate: ink/hârtie ≈ 15:1, salvie/hârtie ≈ 6,3:1,
  alb/salvie ≈ 6,7:1 — toate peste AA.
- **Tipografie**: titluri **Archivo 800–900** (grotesc greu, diacritice românești
  cu virgulă corecte pe Google Fonts), text **Inter**, contor/date/etichete
  **IBM Plex Mono**. Franklyn (candidatul din brief §4) rămâne ⚠️ DE COMPLETAT —
  de verificat ș/ț înainte de a-l cumpăra/instala; Archivo e fallback-ul verificat.
- **Un singur element îndrăzneț** (brief §7): comutatorul de soiuri din erou.
  Restul site-ului e liniștit intenționat — fără parallax, fără reveal-uri la scroll.

## Comutatorul de soiuri — modelul exit/enter (blocat prin brief)

- Fundalul scenei (`.scena`) este un **strat persistent**; doar recuzita
  (`.prop`: ceașcă, linguriță, boabe, frunză) iese și intră.
- A → B = `exit(A)` (360ms, ease-in) apoi `enter(B)` (420ms, ease-out), cu o
  **suprapunere de 180ms**. Textul (contor, nume, descriere) se schimbă în
  pauza „scenă goală”. Orice soi → orice soi, acces aleatoriu complet.
- Comenzi: rotiță (doar cât eroul umple ecranul; la capete pagina derulează
  normal), săgeți sus/jos, click pe orice swatch. Toate sunt butoane reale,
  focusabile, cu `aria-label` în română.
- **`prefers-reduced-motion` / fără JS**: starea finală statică a soiului —
  obligatoriu prin brief §9, implementat (starea inițială e chiar în HTML).

### ⚠️ DE COMPLETAT — trecerea la producție (§7, §11)
Versiunea actuală animează recuzită DOM ca demonstrație a mecanicii. Versiunea
finală înlocuiește scena cu **secvențe de cadre webp desenate pe `<canvas>`**
(`[soi]_exit_000…NNN.webp` / `[soi]_enter_000…NNN.webp`), păstrând exact
aceleași momente de timp și același contract (`comutaLa`, swatch-uri, săgeți).
Fiecare exit trebuie să se termine pe același cadru de suprafață goală din care
pornește fiecare enter (fundal identic pixel cu pixel).

## Structură

```
com-site-3/
├── index.html            # erou (comutator) + opriri + evenimente + poveste
├── cafea.html            # meniul — sursa de adevăr pentru soiuri
├── evenimente.html       # tipuri de evenimente + formularul de ofertă (#cerere)
├── unde-ne-gasesti.html  # opriri + hartă (substituent)
├── despre.html           # povestea (schelet, DE COMPLETAT)
├── contact.html          # date de contact (DE COMPLETAT)
└── assets/
    ├── css/style.css     # tokeni + tot stilul
    ├── js/data.js        # sursa unică de date (soiuri, opriri, evenimente)
    ├── js/switcher.js    # mecanica exit/enter
    ├── js/main.js        # meniu, liste din date, formular
    └── img/logo.png      # logo transparent (generat din JPEG-ul original)
```

Logo-ul transparent a fost generat din
`Downloads/WhatsApp Image 2026-06-04 at 18.54.03.jpeg` (luminanță → alfa,
păstrând anti-aliasing-ul, decupat la conținut).

## ⚠️ DE COMPLETAT — lista completă (din brief §12)

1. Povestea brandului + sensul numelui „com.” + cine e în spate → `despre.html`
2. Logo SVG (acum folosim PNG-ul transparent generat din JPEG)
3. Contact: telefon, e-mail, Instagram/TikTok, zona de lucru → `contact.html`, subsoluri
4. Registrul de personalitate pentru copy (§2)
5. Culorile de brand confirmate (paleta actuală e derivată, nu confirmată)
6. Verificarea Franklyn (ș/ț cu virgulă) — până atunci: Archivo
7. **Lista reală de soiuri** → `assets/js/data.js` + `cafea.html` (acum: 5 exemple)
8. Tipurile reale de evenimente + fotografii → `evenimente.html`, `index.html`
9. Programul real de opriri (date + locații) → `assets/js/data.js` (acum: exemple)
10. Galerie foto de la evenimente trecute (secțiune de adăugat când există poze)
11. Endpoint real pentru formularul de ofertă (`main.js` — acum doar confirmă vizual)
12. Cadrele exit/enter pentru fiecare soi (vezi secțiunea de producție de mai sus)

Datele de exemplu sunt marcate vizibil în site cu insigna „⚠️ DE COMPLETAT”
și în cod cu comentarii — nimic inventat nu e prezentat drept fapt.
