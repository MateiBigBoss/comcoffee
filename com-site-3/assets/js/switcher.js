/* ============================================================
   com. — comutatorul de soiuri (mecanica exit/enter, blocată prin brief §7)

   Modelul: fundalul scenei este un strat PERSISTENT; doar recuzita
   (ceașcă + linguriță + boabe + frunză) iese și intră.
   A → B înseamnă mereu: exit(A), apoi enter(B), cu o suprapunere
   de ~180ms. Orice soi → orice soi, acces aleatoriu complet.

   ⚠️ DE COMPLETAT (producție): această versiune animează recuzită
   DOM ca demonstrație de design. Versiunea finală înlocuiește scena
   cu secvențe de cadre webp desenate pe <canvas> (exit_000…NNN /
   enter_000…NNN per soi), păstrând EXACT aceleași momente de timp
   și același contract public (switchTo, prev, next). Vezi §7 și §11.
   ============================================================ */

(function () {
  "use strict";

  var date = window.COM_DATA;
  var scena = document.querySelector("[data-scena]");
  if (!scena || !date) return;

  var continut = document.querySelector("[data-erou-continut]");
  var contorAcum = document.querySelector("[data-contor-acum]");
  var titlu = document.querySelector("[data-erou-titlu]");
  var meta = document.querySelector("[data-erou-meta]");
  var descriere = document.querySelector("[data-erou-descriere]");
  var pret = document.querySelector("[data-erou-pret]");
  var cta = document.querySelector("[data-erou-cta]");
  var btnSus = document.querySelector("[data-sageata-sus]");
  var btnJos = document.querySelector("[data-sageata-jos]");
  var swatchuri = Array.prototype.slice.call(
    document.querySelectorAll("[data-swatch]")
  );

  var miscareRedusa = window.matchMedia("(prefers-reduced-motion: reduce)");

  var EXIT = 360; // ms — ieșirea e mai scurtă decât intrarea
  var SUPRAPUNERE = 180; // ms — enter pornește înainte să se stingă exit
  var ENTER = 420;

  var curent = 0;
  var animez = false;
  var inAsteptare = -1;

  function aplicaSoi(i) {
    var s = date.soiuri[i];
    scena.style.setProperty("--cafea", s.cafea);
    scena.style.setProperty("--crema", s.crema);
    contorAcum.textContent = String(i + 1).padStart(2, "0");
    titlu.textContent = s.nume;
    meta.textContent = s.origine + " · " + s.prajire;
    descriere.textContent = s.note;
    pret.textContent = "espresso — " + s.pret;
    cta.href = "cafea.html#" + s.slug;
    swatchuri.forEach(function (b, j) {
      if (j === i) {
        b.setAttribute("aria-current", "true");
      } else {
        b.removeAttribute("aria-current");
      }
    });
    if (btnSus) btnSus.disabled = i === 0;
    if (btnJos) btnJos.disabled = i === date.soiuri.length - 1;
  }

  function comutaLa(tinta) {
    if (tinta < 0 || tinta >= date.soiuri.length || tinta === curent) return;

    if (animez) {
      inAsteptare = tinta; // reținem doar ultima intenție
      return;
    }

    if (miscareRedusa.matches) {
      // fallback obligatoriu: fără animație, direct starea finală
      curent = tinta;
      aplicaSoi(curent);
      return;
    }

    animez = true;

    // 1) exit(curent): recuzita pleacă, textul se stinge
    scena.classList.add("iese", "gol");
    continut.classList.remove("intra");
    continut.classList.add("schimb");

    // 2) pauza „scenă goală” — aici se schimbă textul și tonurile
    window.setTimeout(function () {
      curent = tinta;
      aplicaSoi(curent);

      // 3) enter(țintă): recuzita noii cafele se așază la loc
      scena.classList.remove("iese");
      void scena.offsetWidth; // reflow: separă tranziția de ieșire de cea de intrare
      scena.classList.remove("gol");
      continut.classList.add("intra");
      continut.classList.remove("schimb");

      window.setTimeout(function () {
        continut.classList.remove("intra");
        animez = false;
        if (inAsteptare >= 0) {
          var urmatoarea = inAsteptare;
          inAsteptare = -1;
          comutaLa(urmatoarea);
        }
      }, ENTER);
    }, EXIT - SUPRAPUNERE);
  }

  // --- comenzi: săgeți, swatch-uri, rotiță ---
  if (btnJos) {
    btnJos.addEventListener("click", function () {
      comutaLa(curent + 1);
    });
  }
  if (btnSus) {
    btnSus.addEventListener("click", function () {
      comutaLa(curent - 1);
    });
  }

  swatchuri.forEach(function (b, i) {
    b.addEventListener("click", function () {
      comutaLa(i);
    });
  });

  // rotița schimbă soiul doar cât timp eroul umple ecranul;
  // la capetele listei, derularea paginii rămâne normală
  var ultimaRotire = 0;
  document.querySelector("[data-erou]").addEventListener(
    "wheel",
    function (e) {
      if (window.scrollY > 8) return;
      var jos = e.deltaY > 0;
      if ((jos && curent === date.soiuri.length - 1) || (!jos && curent === 0)) {
        return; // lasă pagina să se deruleze
      }
      e.preventDefault();
      var acum = Date.now();
      if (acum - ultimaRotire < 700) return;
      ultimaRotire = acum;
      comutaLa(jos ? curent + 1 : curent - 1);
    },
    { passive: false }
  );

  aplicaSoi(0);
})();
