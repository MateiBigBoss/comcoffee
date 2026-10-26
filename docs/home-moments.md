# Homepage: album interactiv

Bază inițială: 6cb05b8, ramura codex/home-moment-trail (PR #11). Preluat pe claude/home-album, pornită din master 17d0d0e (după PR #10 și #12); vezi „Preluare pe master” mai jos.
Scop: înlocuirea exclusivă a vechii secțiuni „Cafeaua e doar începutul.” cu un album fotografic delimitat. Titlu: „Locuri diferite. Aceeași bucurie.”
Fișiere: site/index.html, site/assets/css/home.css, site/assets/css/moments.css, site/assets/js/home-moments.js.

Fotografiile existente ale proprietarului sunt reutilizate, fără retușare. Maximum șase imagini temporare, afișate numai după decodare, la distanță minimă între pozițiile cursorului. Imaginile se retrag după 1,6 secunde; efectul rămâne în secțiune. Derularea pe telefon schimbă fotografia centrală; butonul „Altă fotografie” funcționează și din tastatură. Preferința pentru mișcare redusă oprește animațiile și schimbările la derulare. Trei fotografii rămân vizibile fără JavaScript. Fără capturarea scrollului, fără cursor ascuns, fără biblioteci noi.

Verificare: check-site, test-menu-switcher, test-home-moments și git diff --check trec. Verificare vizuală în browser la 320, 390, 700, 1265 și 1440 px, cu fotografii încărcate și fără depășire orizontală. Butonul funcționează cu Enter; fără erori în consola browserului. Mișcarea redusă și limita de șase imagini sunt verificate prin testul de comportament; nu s-a testat pe un telefon fizic. Previzualizare: http://127.0.0.1:4193/index.html#evenimente. Nu s-a publicat pe internet.

## Selecția extinsă

12 fotografii din cele trei foldere ale proprietarului, orientate conform EXIF și comprimate WebP (aproximativ 421 KiB în total). Originalele rămân intacte; fără retușuri. Cele 12 fotografii apar în urma cursorului; cele zece care nu ocupă pozițiile laterale fixe se parcurg și din buton / la derulare pe mobil. Clipurile video nu sunt încărcate în efectul fotografic.

| Fișier WebP | Sursă |
|---|---|
| belis-printre-brazi.webp | belis/IMG_6075.jpg |
| echipa-la-eveniment.webp | pozebinecuvnatre/Binecuvantare-Liam-115.jpg |
| tabara-cafea-la-soare.webp | tabara/videotelefoneu/IMG_0305.jpeg |
| belis-echipa.webp | belis/IMG_6605.jpg |
| belis-barul.webp | belis/IMG_6081.jpg |
| belis-o-cafea.webp | belis/IMG_6080.jpg |
| belis-iced-latte.webp | belis/IMG_6246.jpg |
| familie-espresso.webp | pozebinecuvnatre/Binecuvantare-Liam-152.jpg |
| familie-latte-art.webp | pozebinecuvnatre/Binecuvantare-Liam-153.jpg |
| tabara-stand.webp | tabara/videotelefoneu/IMG_0289.jpeg |
| tabara-cafea-in-mana.webp | tabara/videotelefoneu/IMG_0308.jpeg |
| belis-impreuna.webp | belis/IMG_6199.jpg |

## Preluare pe master

Navigația din commitul 6cb05b8 nu a fost preluată: master avea deja header-ul comun din PR #10, iar pagina Contact a fost refăcută în PR #12. Au fost preluate doar cele două commituri ale albumului, cu următoarele adaptări:

- `moments.css` folosește `--page-pad` (variabila `--home-pad` nu mai există), iar textele de 9–11 px sunt acum de 12 px, conform limitei din `check-site.mjs`.
- Legătura „Vezi unde ne-am întâlnit” folosește `.page-link`, ca restul site-ului.
- Regulile vechii secțiuni foto au fost scoase din `home.css`; cele trei imagini `-720.webp` din `assets/img/events/` care nu mai erau folosite au fost șterse. Celelalte imagini din acel folder rămân folosite în `despre.html`.
- `test-home-moments.mjs` se rulează local; adăugarea lui în `.github/workflows/site-checks.yml` rămâne de făcut de proprietar (tokenul agentului nu are dreptul `workflow`).
