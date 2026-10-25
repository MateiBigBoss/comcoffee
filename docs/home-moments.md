# Homepage: album interactiv

Bază: 6cb05b8, versiunea locală verificată. Ramură: codex/home-moment-trail.
Scop: înlocuirea exclusivă a vechii secțiuni „Cafeaua e doar începutul.” cu un album fotografic delimitat. Titlu: „Ce rămâne între cafele.”
Fișiere: site/index.html, site/assets/css/home.css, site/assets/css/moments.css, site/assets/js/home-moments.js.

Fotografiile existente ale proprietarului sunt reutilizate, fără retușare. Maximum șase imagini temporare, afișate numai după decodare, la distanță minimă între pozițiile cursorului. Imaginile se retrag după 1,6 secunde; efectul rămâne în secțiune. Derularea pe telefon schimbă fotografia centrală; butonul „Altă fotografie” funcționează și din tastatură. Preferința pentru mișcare redusă oprește animațiile și schimbările la derulare. Trei fotografii rămân vizibile fără JavaScript. Fără capturarea scrollului, fără cursor ascuns, fără biblioteci noi.

Verificare: check-site, test-menu-switcher, test-home-moments și git diff --check trec. Verificare vizuală în browser la 320, 390, 700, 1265 și 1440 px, cu fotografii încărcate și fără depășire orizontală. Butonul funcționează cu Enter; fără erori în consola browserului. Mișcarea redusă și limita de șase imagini sunt verificate prin testul de comportament; nu s-a testat pe un telefon fizic. Previzualizare: http://127.0.0.1:4193/index.html#evenimente. Nu s-a publicat pe internet.
