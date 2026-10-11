# Lucru cu GitHub, Claude, Codex și Gemini

## Un singur proiect

Site-ul activ este în site/. README.md explică structura și pornirea; docs/design-menu.md descrie designul și cantitățile. Fișierele CLAUDE.md și GEMINI.md sunt puncte de intrare pentru acei asistenți, nu copii ale site-ului.

## Procedură

1. Citește AGENTS.md și verifică git status, git diff, git diff --cached, ramura și origin. Repository: https://github.com/MateiBigBoss/comcoffee.git.
2. Preia ultima versiune de pe GitHub și alege baza explicit. Lucrează pe o ramură și într-un worktree separat. Nu ascunde și nu suprascrie modificările altcuiva.
3. Notează scopul, fișierele deținute și criteriile de acceptare într-un issue sau într-o notă locală. Un singur autor modifică același fișier la un moment dat.
4. Roluri sugerate: Claude planifică/revizuiește designul, Codex implementează, Gemini verifică independent. Folosește doar agenții instalați și autentificați; nu pretinde că un review a avut loc dacă nu a fost executat.
5. Rulează node scripts/check-site.mjs, node scripts/test-menu-switcher.mjs și git diff --check. Pentru modificări vizuale verifică desktop, mobil, tastatură și mișcare redusă. Deschide site/index.html pentru previzualizare.
6. Creează commit cu fișierele sarcinii, fă push pe ramură și deschide un Pull Request către master. Include commit-ul verificat, rezultatele și limitele. Proprietarul decide merge-ul și publicarea.

## Autentificare

Fiecare CLI necesită autentificare proprie. Autentificarea Codex nu autentifică automat GitHub, Claude sau Gemini. Nu salva chei/tokenuri în fișierele proiectului. GitHub Actions verifică site-ul fără chei ale furnizorilor AI; această configurație nu lansează automat agenți sau apeluri plătite.

## Recuperarea variantelor vechi

Structura de dinaintea reorganizării este păstrată în commit-ul f056d19. Vezi docs/project-organization.md. Nu șterge istoricul Git și nu folosi force-push pentru curățarea proiectului.
