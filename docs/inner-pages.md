# Evenimente, Despre și Contact

## Scop

Actualizare pe ramura `codex/inner-pages`, pornită din `8d289a91c180a8dbab24f7a0c026c998a1aebd0e`. Schimbările continuă identitatea vizuală a homepage-ului: fotografii originale, tipografie simplă, crem, gri cald și salvie. Homepage-ul, animația logo-ului, meniul cu 12 băuturi și fișierele comune existente sunt păstrate neschimbate.

Nu sunt inventate nume sau date de evenimente, clienți, capacități, prețuri ori detalii biografice. Fotografiile reutilizate sunt cele furnizate de proprietar și deja prezente în proiect; sursele lor sunt documentate în [design-menu.md](design-menu.md).

## Pagini și comportament

- **Evenimente:** fotografie mare la intrare, legături către patru tipuri de ocazii, descrieri care se deschid nativ, album fotografic și pașii unei colaborări. Legăturile din descrieri preselectează tipul evenimentului în Contact. Secțiunile pot fi deschise din tastatură și rămân disponibile fără JavaScript.
- **Despre:** echipa și povestea legăturii dintre com. și comunitate, titlu alcătuit din logo plus „unitate”, fotografii și detalii despre pregătirea băuturilor. Nu este prezentată o istorie a companiei neverificată.
- **Contact:** formular de cerere de ofertă, date de contact directe și explicația pașilor următori. Câmpurile acoperă tipul evenimentului, data, invitații, ora și durata servirii, localitatea, locația, amplasarea barului, numele, emailul, telefonul, organizatorul, preferințele și alte detalii. Câmpurile opționale sunt marcate explicit.

Animațiile apar la scroll, fără ascunderea inițială a conținutului principal. Fotografiile au efecte discrete la trecerea mouse-ului. Tastatura poate dezvălui secțiunile focalizate, iar preferința pentru mișcare redusă elimină animațiile. Dacă scriptul de animație nu poate porni, conținutul rămâne vizibil.

## Fișiere

| Fișier | Rol |
| --- | --- |
| `site/evenimente.html`, `site/despre.html`, `site/contact.html` | Conținutul celor trei pagini |
| `site/assets/css/interior.css` | Navigație, tipografie, butoane, footer și animații comune celor trei pagini |
| `site/assets/css/events.css`, `about.css`, `contact.css` | Compoziții și adaptări pentru ecrane mici, specifice fiecărei pagini |
| `site/assets/js/interior.js` | Dezvăluire la scroll și indicator de progres |
| `site/assets/js/events.js` | Deschiderea ocaziilor prin legăturile cu ancoră |
| `site/assets/js/contact.js` | Validare suplimentară, rezumat și preselectarea sigură a ocaziei |
| `scripts/serve.mjs` | Previzualizare HTTP locală, fără expunerea fișierelor proiectului |
| `scripts/test-interior.mjs`, `scripts/test-contact.mjs` | Verificări de comportament fără acces la rețea |
| `.github/workflows/site-checks.yml` | Rulează și cele două verificări noi în CI |
| `docs/contact-setup.md` | Activarea formularului și limitele integrării |

Fișierele noi de stil și script sunt încărcate numai de paginile interioare. `site/index.html`, stilul homepage-ului, `site/cafea.html`, stilul și scriptul meniului, `style.css` și `main.js` nu sunt schimbate în această etapă.

## Formularul și activarea

Trimiterea este un POST nativ către FormSubmit, cu destinația `comcoffee.events@gmail.com`. CAPTCHA este păstrat. Nu există mesaj local care să afirme că emailul a fost livrat sau că rezervarea este confirmată. Formularul poate face POST fără JavaScript pe un site HTTP(S); verificarea datei și telefonului este suplimentară, în browser, iar detaliile primite se confirmă manual.

Integrarea necesită activarea adresei de către proprietarul inboxului și o probă de livrare, după pașii din [contact-setup.md](contact-setup.md). Livrarea până în Gmail nu este verificată. Nu sunt stocate chei, parole sau datele formularului în proiect. Nu s-a trimis un email de probă în cadrul verificărilor automate.

## Verificare și predare

Pornește previzualizarea din rădăcina proiectului:

    node scripts/serve.mjs

Deschide [http://127.0.0.1:4187](http://127.0.0.1:4187). Serverul ascultă numai pe acest calculator; nu reprezintă publicarea site-ului.

Verificările proiectului:

    node scripts/check-site.mjs
    node scripts/test-menu-switcher.mjs
    node scripts/test-interior.mjs
    node scripts/test-contact.mjs
    git diff --check

Verificare la 12 octombrie 2026: toate cele patru verificări automate și `git diff --check` trec. În browserul Chromium integrat au fost verificate cele trei pagini la lățimi de 320, 768 și 1440 px, plus Contact la 390 px: fără depășiri orizontale, fotografii încărcate și dezvăluiri la scroll funcționale. Deschiderea secțiunilor de evenimente prin ancoră și din tastatură, preselectarea „Corporate”, rezumatul formularului, respingerea unei date din trecut, corectarea telefonului și blocarea unei cereri incomplete au fost verificate interactiv. Au fost corectate proporția fotografiei din Contact și spațiul dintre cuvintele unui titlu pe mobil.

Testele pentru preferința de mișcare redusă, indisponibilitatea observatorului și contractul POST sunt automate; nu reprezintă o verificare pe toate dispozitivele sau în toate browserele. Nu a fost trimis un formular valid către serviciul extern. Confirmarea livrării emailului necesită activarea și verificarea inboxului de către proprietar.

Această notă descrie implementarea locală și nu afirmă că modificările au fost trimise pe GitHub sau publicate. Commit-ul final, rezultatele verificărilor și eventualele limite se consemnează la predare. Proprietarul decide merge-ul și publicarea.
