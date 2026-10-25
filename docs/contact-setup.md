# Formularul de contact

Pagina `site/contact.html` trimite o cerere prin POST la `https://formsubmit.co/comcoffee.events@gmail.com`. FormSubmit livrează emailul; fișierele statice singure nu pot trimite email. Nu există chei sau parole în proiect. CAPTCHA este păstrat, iar confirmarea este afișată de serviciu, după trimitere. Pagina nu pretinde local că emailul a ajuns în inbox sau că rezervarea este confirmată.

## Activarea de către proprietar

1. Publică `site/` prin HTTP(S) pe găzduirea aleasă. Pentru o probă locală folosește un server HTTP; deschiderea prin `file://` nu este o configurație de livrare suportată. Cu JavaScript activ, copia locală blochează trimiterea și oferă emailul direct; fără JavaScript afișează un avertisment.
2. Trimite o cerere de probă, cu date de contact pe care le controlezi și cu „TEST — nu este o rezervare” în detalii. Această verificare trimite date către FormSubmit și un email către adresa configurată.
3. La prima utilizare, caută emailul de activare FormSubmit în **comcoffee.events@gmail.com**, inclusiv Spam, și confirmă adresa. Activarea trebuie făcută de persoana care controlează inboxul. Nu este nevoie să împărtășești parola cu agenții sau să o pui în proiect.
4. Trimite o a doua probă și verifică în inbox toate detaliile: eveniment, dată, invitați, program, adresă, nume, email, telefon și preferințe. Verifică și că „Reply” răspunde adresei introduse de client.
5. Confirmă livrarea înainte de a anunța formularul ca fiind disponibil pentru rezervări. Dacă emailul de activare sau proba nu sosesc, verifică Spam și serviciul FormSubmit; telefonul și linkul de email direct rămân disponibile.

## Comportament și date

- Câmpurile obligatorii folosesc validarea nativă a browserului. Formularul poate face POST și fără JavaScript pe site-ul găzduit. JavaScript adaugă verificarea unei date care nu este în trecut, a formatului telefonului și un rezumat al evenimentului. Validarea clientului nu este o validare pe server a regulilor de afaceri; datele primite se confirmă manual.
- Cu JavaScript, formularul apare în patru pași (Ocazia, Locul, Contact, Detalii). „Continuă”, Enter sau un clic pe bara de progres verifică doar pasul părăsit; „Înapoi” e mereu permis. Pașii ascunși nu sunt dezactivați, deci toate valorile pleacă la trimitere; dacă un câmp dintr-un pas anterior a devenit invalid, formularul revine la acel pas. Fără JavaScript, toți pașii sunt afișați deodată.
- Aspectul urmează pagina de meniu: o scenă colorată cu colțuri rotunjite (culoarea se schimbă după ocazie, prin CSS `:has`, și fără JavaScript), file-pastilă pentru pași, butoane rotunde și o „fișă a evenimentului” în dreapta. Câmpurile sunt linii subțiri pe scenă, nu chenare. Ocazia și amplasarea barului sunt butoane radio afișate ca pastile; valorile trimise sunt aceleași ca înainte. Butoanele +/− modifică invitații cu câte 10 și durata cu câte o jumătate de oră, sugestiile din meniu adaugă sau scot cuvinte din câmpul „Preferințe pentru meniu”, iar butonul de lângă email copiază adresa. Mesajele de eroare apar în română sub câmp, în locul balonului browserului.
- Limite realiste (editabile în `contact.html` și în `MAX_YEARS_AHEAD` din `contact.js`): data între azi și peste 2 ani; invitați între 1 și 3000, număr întreg; durata între 0,5 și 12 ore pe zi, în pași de jumătate de oră; localitatea și numele trebuie să conțină litere (numele fără cifre); emailul trebuie să aibă domeniu complet (ex. `.ro`); telefonul acceptă 7–15 cifre și caractere de formatare uzuale. Pentru evenimente mai mari sau de mai multe zile, mesajele trimit vizitatorul la câmpul de detalii. Limitele 3000 și 12 sunt propuneri de confirmat de proprietar.
- Rezervarea nu este confirmată automat. Disponibilitatea, oferta, condițiile și montajul se stabilesc cu clientul.
- Ce completează vizitatorul se salvează ca ciornă doar în browserul lui (`localStorage`, cheia `com-contact-draft`), ca să nu se piardă când trece pe altă pagină a site-ului; la întoarcere se reia și pasul la care rămăsese. Ciorna expiră după 7 zile, se șterge la trimitere și prin butonul „Șterge datele” din fișa evenimentului, iar bifa de acord nu se salvează niciodată. Datele nu ajung în URL sau analytics și nu pleacă nicăieri până când vizitatorul apasă „Trimite cererea” și validarea permite continuarea. Dacă browserul blochează stocarea, formularul funcționează normal, fără ciornă.
- Textul de acord explică transmiterea datelor prin FormSubmit către emailul com. și leagă politica furnizorului. Proprietarul trebuie să stabilească și să publice informațiile proprii privind prelucrarea datelor (identitatea operatorului, contact, scopuri și durata păstrării), potrivite activității reale. Textul afișat nu pretinde că este o politică juridică completă.
- Parametrul `?tip=nunta` (sau `corporate`, `targ-festival`, `petrecere-privata`, `altceva`) preselectează tipul evenimentului. Nu este folosit pentru date personale.
- Nu există răspuns automat, copie trimisă unei alte persoane sau redirecționare către o pagină locală cu succes neconfirmat. FormSubmit poate avea propriile limitări și politici, independente de site.

## Verificare

    node scripts/test-contact.mjs
    node scripts/check-site.mjs
    node scripts/test-menu-switcher.mjs
    git diff --check

Testul de contact rulează offline. Verifică destinația și metoda native, câmpurile trimise, păstrarea CAPTCHA, preselectarea sigură, rezumatul, validarea datei/telefonului, corectarea erorilor și faptul că un formular valid este lăsat să facă POST. Nu trimite email și nu dovedește livrarea în Gmail.

Surse oficiale: [conectare și activare](https://formsubmit.co/), [opțiuni și CAPTCHA](https://formsubmit.co/documentation), [politica furnizorului](https://formsubmit.co/privacy.pdf). Verificate la 11 octombrie 2026.
