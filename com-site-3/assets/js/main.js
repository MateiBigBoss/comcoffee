/* com. — comportamente comune: meniu mobil, liste din date, formular */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  // --- meniu mobil ---
  var btn = document.querySelector("[data-meniu-btn]");
  var meniu = document.querySelector("[data-meniu]");
  if (btn && meniu) {
    btn.addEventListener("click", function () {
      var deschis = meniu.classList.toggle("deschis");
      btn.setAttribute("aria-expanded", deschis ? "true" : "false");
    });
  }

  var date = window.COM_DATA;

  // --- banda / lista „următoarele opriri” (aceeași sursă peste tot) ---
  document.querySelectorAll("[data-opriri]").forEach(function (nod) {
    date.opriri.forEach(function (o) {
      var li = document.createElement("li");
      li.className = "oprire";
      li.innerHTML =
        '<p class="oprire-data">' + o.data + "</p>" +
        '<p class="oprire-zi">' + o.zi + "</p>" +
        '<p class="oprire-loc">' + o.loc + "</p>" +
        '<p class="oprire-oras">' + o.oras + "</p>" +
        '<p class="oprire-program">' + o.program + "</p>";
      nod.appendChild(li);
    });
  });

  // --- „următoarea oprire” din subsol ---
  document.querySelectorAll("[data-urmatoarea-oprire]").forEach(function (nod) {
    var o = date.opriri[0];
    if (o) {
      nod.textContent = o.data + " — " + o.loc + ", " + o.oras;
    }
  });

  // --- formularul de cerere de ofertă ---
  var formular = document.querySelector("[data-formular]");
  if (formular) {
    var campuri = Array.prototype.slice.call(
      formular.querySelectorAll("[required]")
    );

    function valideaza(camp) {
      var invelis = camp.closest(".camp");
      var ok = camp.checkValidity();
      invelis.classList.toggle("cu-eroare", !ok);
      return ok;
    }

    // validare la părăsirea câmpului, nu la fiecare tastă
    campuri.forEach(function (camp) {
      camp.addEventListener("blur", function () {
        valideaza(camp);
      });
      camp.addEventListener("input", function () {
        if (camp.closest(".camp").classList.contains("cu-eroare")) {
          valideaza(camp);
        }
      });
    });

    formular.addEventListener("submit", function (e) {
      e.preventDefault();

      var primulInvalid = null;
      campuri.forEach(function (camp) {
        if (!valideaza(camp) && !primulInvalid) {
          primulInvalid = camp;
        }
      });

      if (primulInvalid) {
        primulInvalid.focus();
        return;
      }

      /* ⚠️ DE COMPLETAT: aici se conectează trimiterea reală
         (endpoint de e-mail / backend). Momentan doar confirmăm vizual. */
      var succes = document.createElement("div");
      succes.className = "formular-succes";
      succes.setAttribute("tabindex", "-1");
      succes.innerHTML =
        "<h2>Cererea a fost trimisă</h2>" +
        "<p>Îți răspundem în cel mult o zi lucrătoare, cu o ofertă pe bune, " +
        "nu cu un mesaj automat.</p>";
      formular.replaceWith(succes);
      succes.focus();
    });
  }
})();
