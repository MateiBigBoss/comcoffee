# Reorganizarea proiectului

Bază: f056d19fc198aa97d0e19ae1ff241231d1ee1547 (master, după integrarea designului aprobat). Cererea proprietarului: un singur proiect ordonat, fără variante și fișiere nefolosite, păstrând munca realizată.

## Ce se păstrează

com-site-2/ a devenit site/. Sunt păstrate toate cele cinci pagini, logo-urile și animația lor, cele 12 fotografii decupate, meniul pe o coloană, cantitățile și simbolurile, imaginile active de evenimente/galerie, navigarea și comportamentul formularelor. Documentația, verificările și intrările pentru Claude/Codex/Gemini au fost actualizate.

## Ce s-a eliminat și de ce

- com-site/ și com-site-3/: variante istorice de referință, fără dependențe din site-ul actual.
- assets/js/switcher.js: vechiul desen pe canvas, neîncărcat de nicio pagină activă.
- assets/js/data.js și cele trei includeri HTML: date demonstrative fără consumatori în JavaScript-ul activ. Meniul actual își citește datele din cafea.html.
- Regulile CSS exclusiv pentru vechiul hero foto/canvas și fotografia foto/hero.jpg: fotografia principală fusese eliminată la cererea proprietarului și nu mai era afișată.
- README-ul istoric al prototipului: înlocuit cu README.md actual în rădăcină.

## Recuperare

Nu s-a rescris istoricul. Toate fișierele eliminate se găsesc în commit-ul de bază. Pentru a le inspecta fără a modifica proiectul actual, creează o copie separată:

    git worktree add --detach ../comcoffee-before-cleanup f056d19

Reorganizarea nu implementează trimiterea formularelor și nu publică automat site-ul. Nu s-au executat review-uri Claude/Gemini.

## Validarea reorganizării

Au trecut verificarea legăturilor/sintaxei, testele meniului și verificarea whitespace. Cele 29 de imagini păstrate au fost comparate prin SHA-256; homepage-ul, HTML-ul meniului, CSS-ul meniului și cele trei scripturi active au fost comparate cu baza (ignorând doar terminatorii de linie Windows). Singurele schimbări din celelalte trei pagini sunt eliminarea includerii data.js nefolosite. Clasele CSS eliminate nu apar în HTML-ul activ.

Reverificarea vizuală în browser în această etapă nu a putut fi executată: instrumentul de browser al mediului nu a pornit. Designul fusese verificat anterior pe desktop și la 390/320 px; comparațiile de mai sus păstrează conținutul și comportamentul aprobat.
