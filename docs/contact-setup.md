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
- Telefonul acceptă 7–15 cifre și caractere de formatare uzuale. Numărul invitaților trebuie să fie întreg și pozitiv; nu este impusă o capacitate comercială inventată.
- Rezervarea nu este confirmată automat. Disponibilitatea, oferta, condițiile și montajul se stabilesc cu clientul.
- Nu se scriu datele formularului în localStorage, URL sau analytics. Trimiterea are loc doar când vizitatorul apasă butonul și validarea permite continuarea.
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
