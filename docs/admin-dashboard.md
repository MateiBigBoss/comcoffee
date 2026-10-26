# com. studio — dashboard privat

## Pornire pe calculatorul tău

Necesită Node.js 22.13 sau mai nou, cu `node:sqlite` disponibil. Instalează dependența pentru importul Excel cu `npm ci --prefix admin --ignore-scripts`. Din rădăcina acestui proiect:

```powershell
node admin/manage.mjs create-owner comcoffee.events@gmail.com
node admin/server.mjs
```

Prima comandă cere parola de două ori, ascunsă, în terminal. Alege minimum 12 caractere; nu trimite parola în chat și nu o salva în Git. Nu există cont/parolă implicită. Dacă proprietarul există deja, treci la a doua comandă.

- Site: http://127.0.0.1:4194/
- Dashboard: http://127.0.0.1:4194/admin/
- Oprire: Ctrl+C în terminalul serverului.
- Recuperare parolă locală: `node admin/manage.mjs reset-password EMAIL`.

Serverul ascultă implicit numai pe calculatorul tău. `scripts/serve.mjs` este în continuare doar previzualizarea statică; nu pornește dashboardul.

## Ce poți administra

- **Privire de ansamblu:** cereri de discutat, evenimente viitoare, încasări și cheltuieli pe lună, sarcini.
- **Cereri:** toate detaliile formularului, căutare, filtrare, respingere/redeschidere. Acceptarea cere detaliile convenite și creează un singur eveniment; repetarea comenzii nu dublează evenimentul.
- **Calendar:** lună, evenimente manuale sau acceptate, editare/anulare, avertizare la suprapuneri. Orele se interpretează în fusul orar al browserului; folosește Europe/Bucharest pentru echipa din România.
- **Costuri & încasări:** sume în RON, categorii, referință factură/chitanță, asociere cu evenimentul, corectare cu istoric. Baza păstrează bani întregi, nu valori aproximative în lei. Prețul convenit nu este încasare; înregistrează separat avansul și fiecare plată. Detaliile evenimentului arată încasat, rămas și costuri.
- **Planner:** sarcini cu termen și eveniment asociat, bifare/debifare.
- **Echipă & date:** numai proprietarul adaugă/dezactivează administratori și exportă datele JSON. Administratorii pot gestiona operațiunile firmei; nu primesc administrarea conturilor.
- Fiecare utilizator își poate schimba parola. Schimbarea parolei sau dezactivarea revocă sesiunile existente.

Aceasta este evidență operațională de numerar, nu program de contabilitate, facturare fiscală sau calcul de TVA.

## Formular și email

Când servești site-ul cu `admin/server.mjs`, pagina Contact trimite către `/api/enquiries`, iar cererea este salvată în SQLite. Mesajul de reușită apare numai după confirmarea serverului. Înregistrarea unei cereri nu confirmă rezervarea. Acceptarea modifică doar calendarul intern, fără email automat către client.

Nu este configurat un serviciu de notificări email. Contactează clientul separat folosind datele cererii. Cererile vechi primite prin FormSubmit/email nu se importă automat. Varianta publicată doar ca fișiere statice păstrează integrarea FormSubmit existentă, fără salvare în dashboard. Pentru a capta cererile publice în baza de date, trebuie publicat noul server, cu site-ul și API-ul pe aceeași origine.

## Date și copii de siguranță

Baza reală este `admin/data/comcoffee.sqlite` (sau calea din `DB_PATH`). Este creată la pornire și rămâne pe disc. Directorul, parolele și bazele SQLite sunt excluse din Git; push-ul salvează codul, nu datele firmei.

```powershell
node admin/manage.mjs backup
```

Comanda creează un snapshot SQLite consistent în `admin/data/backup-*.sqlite`. Copiază periodic backupul într-un loc privat, în afara calculatorului. Pentru restaurare: oprește serverul, păstrează vechea bază și fișierele ei WAL/SHM într-un folder de recuperare, apoi pune backupul ca `comcoffee.sqlite`; nu amesteca un backup cu fișierele WAL ale altei baze. Exportul JSON din dashboard este pentru consultare/portabilitate, nu pentru restaurarea conturilor.

Parolele sunt derivate cu scrypt și salt individual; sesiunile opace sunt stocate ca hash. Baza nu este criptată pe disc: protejează contul Windows, discul și backupurile. Datele nu sunt trimise unui serviciu cloud prin simpla pornire locală.

## Publicare ulterioară

Dashboardul nu funcționează pe hosting exclusiv static/GitHub Pages. Necesită un proces Node persistent, disc persistent pentru SQLite și HTTPS. Nu publica `admin/data/` ca fișiere web. Configurează `NODE_ENV=production`, `APP_ORIGIN=https://domeniul-tau`, `PORT`, opțional `HOST` și `DB_PATH`. În producție serverul refuză pornirea fără o origine HTTPS. Configurează proxy-ul și certificatul TLS la hosting; aplicația nu generează certificate.

Cookie-urile au HttpOnly, SameSite=Strict și Secure în producție. API-ul verifică sesiunea, rolul, originea și tokenul CSRF. Sunt limitate încercările de login și cererile publice. Limitele sunt în memorie și se resetează la repornire; în spatele unui proxy clienții pot împărți aceeași limită IP. Configurează limitarea la proxy înainte de lansare; nu activa încrederea oarbă în X-Forwarded-For. Această versiune este pentru o singură instanță și o echipă mică, fără MFA, notificări email, sincronizare Google Calendar sau import automat din email.

## Verificări

`node scripts/test-admin.mjs` verifică serverul prin HTTP, pe o bază temporară: acces, roluri, CSRF/origine, cereri, acceptare idempotentă, bani, planner, revocarea sesiunilor și persistența SQLite. Nu trimite email și nu scrie în baza firmei.

În mediul Codex conexiunile locale au fost blocate cu EACCES. Aceleași rute au trecut testul cu `$env:ADMIN_TEST_IN_PROCESS='1'` (request/response injectate în server, fără transport TCP). CI rulează varianta HTTP normală. Verificările existente ale site-ului au trecut. Verificarea vizuală a dashboardului pe desktop/mobil rămâne de făcut, deoarece instrumentul de browser nu a pornit.

## Rezolvarea conflictelor PR #11

Commit-ul local `9352c49` combină master cu albumul interactiv și fotografiile proprietarului, păstrând reorganizarea din master. Ramura dashboardului pornește de la acest merge. Remote-ul nu este actualizat până când push-ul reușește; merge-ul și publicarea sunt deciziile proprietarului.

### Push din PowerShell

Din rădăcina acestui proiect (`work/comcoffee-admin`), după verificarea modificărilor:

```powershell
git -C ..\comcoffee-moment-trail push origin codex/home-moment-trail
git push -u origin codex/business-dashboard
```

Prima comandă actualizează PR #11 cu rezolvarea conflictelor; a doua salvează dashboardul pe ramura lui separată. Dacă GitHub anunță modificări noi sau respinge push-ul, nu folosi force-push; trebuie întâi integrate schimbările noi. PR pentru dashboard: https://github.com/MateiBigBoss/comcoffee/compare/master...codex/business-dashboard (disponibil după push). Niciuna dintre comenzi nu publică site-ul sau baza de date.

## Actualizare mobilă

Navigare fixă jos cu cinci destinații, contul și echipa într-un meniu separat, agenda lunii pe mobil, înregistrări financiare prezentate ca fișe, filtre de planner și butoane de apel/email în cereri. Formularele se deschid ca panouri pe înălțimea telefonului, cu acțiuni vizibile și câmpuri de minimum 16 px pentru evitarea zoomului automat pe iPhone.

Verificat în browser la 320 și 390 px, plus desktop 1440 px: navigare, filtrare planner, deschidere/închidere formulare evenimente și costuri, fără depășire orizontală sau erori JavaScript. Nu au fost introduse înregistrări de probă în baza firmei. Testele serverului pe baza temporară și verificările site/meniu au trecut.

## Bonuri, facturi și necesarul evenimentelor

În **Costuri & încasări**, fiecare operațiune are butonul **Documente**. După salvarea unei încasări/cheltuieli se deschide și panoul de atașamente. Sunt acceptate PDF, JPG/JPEG, PNG și WebP, maximum 10 MB per fișier și 10 fișiere per operațiune. Fișierele sunt descărcate doar printr-un endpoint autentificat, cu verificări de sesiune și acces; încărcarea cere și token CSRF. Tipul este verificat prin semnătura fișierului și extensie, nu doar prin numele declarat. Nu se face OCR sau scanare antivirus.

Documentele sunt stocate ca BLOB în SQLite, nu în site/ și nu în Git. Backupul SQLite include și fișierele. Exportul JSON include doar metadatele documentelor, nu conținutul lor; pentru recuperarea completă folosește backupul SQLite. Migrarea la schema 2 adaugă tabelele fără ștergerea datelor existente.

În calendar sau lista evenimentelor, **Necesar** deschide tabelul de produse/servicii: denumire, cantitate, unitate, preț unitar și total. Cantitățile acceptă maximum trei zecimale; prețurile sunt în RON, păstrate în bani întregi. Totalurile pe rând sunt rotunjite la ban, apoi însumate. Poți edita produsele înainte de înregistrarea plății.

**Trece în cheltuieli** cere data plății, categoria și referința documentului. Confirmarea creează o singură cheltuială asociată evenimentului, apoi deschide atașamentele. Apăsările repetate nu dublează cheltuiala. După înregistrare, cantitatea/prețul produsului și suma/tipul/evenimentul cheltuielii sunt blocate pentru a păstra legătura; data, categoria, descrierea și referința rămân corectabile. Nu se efectuează nicio plată bancară prin acest buton.

Verificări: calcule cu zecimale, valori invalide, conversie repetată, acces neautorizat, CSRF, extensii/tipuri nepermise, limită de fișier, descărcare identică, atașamente la încasări și cheltuieli și persistență după repornire. Testele au trecut inclusiv prin HTTP. Fluxul adăugare produs → calcul live → cheltuială → încărcare imagine a fost verificat în browser la 390 px, într-o bază demonstrativă separată, fără modificarea evidenței firmei.

## Finanțe pe eveniment, coș și import de tabele

Schema 3 adaugă ștergere recuperabilă, prețuri unitare cu patru zecimale și evidența importurilor. Datele vechi și bonurile sunt păstrate. În Calendar → Finanțe sau Costuri → Finanțe pe eveniment sunt afișate toate plățile evenimentului, indiferent de lună, cu total încasat, cheltuit, diferență de numerar și rest de încasat. Butoanele de adăugare preselectează evenimentul.

Șterge mută în coș, fără eliminare definitivă. Pentru un produs trecut în cheltuieli, produsul și operațiunea financiară se șterg/restaurează împreună. Bonurile rămân disponibile în baza privată, iar înregistrările șterse sunt excluse din totalurile active. Coșul este accesibil din Costuri și din fiecare eveniment. Exportul JSON include și înregistrările marcate `deleted`.

Calendar → Importă tabel acceptă linkuri Google Sheets accesibile fără autentificare sau fișiere `.xlsx` / `.csv` (maximum 5 MB). Pentru un tabel privat, exportă Excel și încarcă fișierul; aplicația nu solicită parola Google și nu schimbă permisiunile tabelului. Linkul este citit la cerere, fără sincronizare continuă. Foaia este aleasă prin `gid` în Google Sheets sau prin selectorul din previzualizarea Excel.

Structura acceptată este cea furnizată de proprietar: `Nume eveniment:` și `Data eveniment:` în prima coloană, valorile în a doua, apoi antetul `Articol,Cantitate,U.M.,Pret unitar fara TVA (lei),TVA (%),Pret unitar cu TVA (lei),Total (lei),Furnizor,Observatii`. Sunt acceptate CSV cu virgulă sau punct și virgulă și date `ZZ.LL.AAAA` / `AAAA-LL-ZZ`. Un import creează un eveniment cu până la 300 materiale; nu interpretează arbitrar orice structură de workbook.

TVA-ul nu se importă sau calculează. Prețul fără TVA și cantitatea determină totalul la ban; prețurile unitare păstrează maximum patru zecimale. Rândurile goale, cele fără nume, rezumatele și rândurile fără cantitate/unitate/preț sunt omise. Erorile de formulă sunt semnalate și omise. Furnizorul/observațiile, când există, sunt păstrate la produs; celulele opționale goale nu elimină un produs valid. Excel folosește rezultatele salvate ale formulelor, fără a executa formule sau macrocomenzi. Recalculează/salvează fișierul în Excel înainte de export dacă are formule fără rezultate.

Previzualizarea nu scrie în baza de date. La confirmare completezi locația, invitații și celelalte detalii și alegi explicit necesar planificat (implicit, fără cheltuieli) sau materiale deja plătite, cu data plății. Nu sunt inventate încasări dintr-un tabel de cheltuieli; acestea se înregistrează separat. Confirmarea este tranzacțională; repetarea aceluiași conținut normalizat deschide evenimentul existent, fără dublare. Modificările tabelului nu actualizează automat un eveniment existent: verifică înainte de a importa o versiune diferită.

Pentru citirea Excel: `npm ci --prefix admin --ignore-scripts`. Dependența este fixată în lockfile, cu override UUID 11.1.1; verificarea npm audit nu a raportat vulnerabilități la implementare. Citirea are limite de fișier, ZIP, foi/rânduri/coloane, timp și memorie și rulează într-un worker separat. Google exportă numai din hosturi acceptate, cu limită de răspuns și timeout. Datele de probă pentru teste sunt separate de baza firmei.

Verificări suplimentare: `node scripts/test-admin-import.mjs` (CSV/XLSX, TVA exclus, prețuri precise, rânduri omise, previzualizare, autentificare/CSRF, confirmare repetată, plan/plăți, ștergere/restaurare și persistență).

Verificare vizuală pentru această actualizare: importul Google Sheets furnizat a recunoscut 10 materiale și 440,52 RON fără TVA. Fluxul a fost testat într-o bază QA separată la 390 px și desktop 1440 px: confirmare, situație financiară, ștergere/restaurare și preselectarea evenimentului la încasare. Fără depășire orizontală la 390 px sau erori în consola browserului. Tabelul nu a fost importat automat în evidența reală a firmei. Backup SQLite creat înainte de repornirea serviciului actualizat.
