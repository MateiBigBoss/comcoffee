# Audit vizual și navigație — 20 octombrie 2026

## Bază și scop

Ramura `codex/site-consistency-audit` pornește din `786abf0`, versiunea
`master` preluată de pe GitHub. Include animația nouă a literelor logoului,
fără să o înlocuiască. Auditul acoperă Acasă, Meniu, Evenimente, Despre și
Contact: consistența navigației, suprapuneri, animații, texte, acces la ofertă
și afișarea adaptată ecranelor mici.

## Probleme corectate

- Navigația avea patru praguri de afișare mobilă și trei seturi de dimensiuni.
  La 1143 px, logoul din Meniu avea 22 px înălțime și începea la x=40,
  iar pe Acasă avea 26 px și începea la x≈69. Acum toate paginile folosesc
  geometria, fontul, culoarea și pragurile din `assets/css/style.css`.
  Spațiul barei de derulare este rezervat pentru a evita deplasarea orizontală.
- Meniul nu avea îndemnul comun de contact, dimensiunile declarate ale
  logoului sau ținta focalizabilă pentru legătura „Sari la conținut”.
- Două importuri de font din mijlocul `home.css` erau ignorate. DM Sans
  și Fredoka sunt cerute acum în `<head>`, alături de celelalte fonturi.
- Banda de pe Acasă rămăsese fără conținut, cu trei puncte decorative.
  În Evenimente exista o navigație goală cu un tag incomplet (`<span</span>`).
  Am eliminat resturile fără a reintroduce secțiunile eliminate de proprietar.
- Efectele hover de deplasare rămâneau active cu mișcare redusă. Acum
  imaginile și butoanele respective rămân fixe în acest mod.
- Pagina Contact avea un panou introductiv gol. Acum explică ce informații
  sunt necesare și oferă „Cere o ofertă”. Ancora existentă `#formular`
  duce direct la titlul formularului, inclusiv pe mobil, păstrând legăturile
  existente și preselectarea tipului de eveniment.

## Verificări

- În browser, toate cele cinci pagini la 320, 390, 700, 760, 820, 1024,
  1143 și 1440 px: aceleași coordonate și dimensiuni pentru logo și meniu
  între pagini; fără depășire orizontală a documentului.
- Inspecție vizuală desktop și mobil, cu scroll și secțiuni dezvăluite;
  păstrate fotografiile, povestea, paleta și ordinea secțiunilor.
- Meniu: schimbare categorie, apăsări rapide, taste Home/End, fotografie,
  volume și simbolul fără cafea sincronizate. Fotografia și panoul cu
  detalii nu se suprapun în aranjamentele inspectate.
- Evenimente: deschiderea secțiunii Corporate și legătura către Contact
  preselectează `corporate`. Butonul de ofertă focalizează ținta formularului.
- Formular: data trecută și telefonul invalid sunt respinse; valorile
  corectate devin valide. Nu s-a trimis o cerere.
- Verificările fără dependențe: `check-site.mjs`, `test-menu-switcher.mjs`,
  `test-interior.mjs`, `test-contact.mjs`, `test-logo-reveal.mjs` și
  `git diff --check`.

## Limite

Verificarea vizuală este în browserul Chromium integrat, la dimensiuni
desktop și telefon; nu reprezintă testare pe un iPhone fizic sau în Safari.
Mișcarea redusă este verificată prin testele de comportament și regulile CSS,
fără emulare vizuală a preferinței de sistem. Livrarea emailului prin
FormSubmit necesită în continuare activare și confirmare în inbox de către
proprietar, conform `contact-setup.md`. Merge-ul și publicarea nu fac parte
din audit.
