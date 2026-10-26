# Corecturi după auditul Gemini

> Notă istorică (26 octombrie 2026): unele puncte de mai jos sunt depășite. Navigația comună trece pe o coloană la 760 px și mai jos (nu 650 px), iar formularul de contact trimite acum prin FormSubmit; vezi [contact-setup.md](contact-setup.md). Starea curentă este în README.md.

- Navigația comună se rearanjează pe o coloană la 650 px și mai jos (acum 760 px), cu ținte de minimum 44 px.
- Evenimente, Despre și Contact au linkul „Sari la conținut” și destinație focusabilă. Stilul este comun.
- Bara de derulare a documentului este vizibilă; mișcarea redusă rămâne respectată.
- Textul legal și contoarele categoriilor folosesc #62665d pentru contrast mai bun.
- Formularul fără backend nu mai afișează succes fictiv. Datele și aspectul câmpurilor sunt păstrate într-un fieldset dezactivat, fără form sau submit, inclusiv fără JavaScript. Telefonul și Instagramul sunt alternative active. Handlerul fals de succes a fost eliminat.

Pentru reactivare este necesară o destinație reală de trimitere, validare pe server și confirmarea succesului numai după răspunsul serverului. Această etapă nu configurează un serviciu extern și nu trimite date.

Verificările `node scripts/check-site.mjs`, `node scripts/test-menu-switcher.mjs` și `git diff --check` trec. Instrumentul de browser nu a putut porni din cauza unei erori locale; verificarea vizuală a acestor corecturi la desktop și mobil rămâne de făcut. Auditul Gemini furnizat de proprietar precedă aceste corecturi; nu reprezintă o reverificare a lor.
