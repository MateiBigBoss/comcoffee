/* ============================================================
   com. — sursa unică de date pentru site
   ⚠️ DE COMPLETAT: TOATE datele de mai jos sunt EXEMPLE de design.
   Proprietarul trebuie să le înlocuiască cu meniul real, programul
   real și tipurile reale de evenimente (vezi CLAUDE.md §11–§12).
   ============================================================ */

window.COM_DATA = {
  /* ⚠️ DE COMPLETAT — lista reală de soiuri (nume, origine, prăjire,
     note de degustare, preț în lei, culoare swatch). Fiecare soi va
     avea în producție propriile secvențe de cadre exit/enter (§7). */
  soiuri: [
    {
      slug: "etiopia-yirgacheffe",
      nume: "Etiopia Yirgacheffe",
      origine: "Etiopia · Yirgacheffe",
      prajire: "prăjire deschisă",
      note: "Florală și limpede — iasomie, citrice, un finiș de ceai negru.",
      pret: "18 lei",
      swatch: "#c9a06a",
      cafea: "#2a1a10",
      crema: "#a5763f"
    },
    {
      slug: "columbia-huila",
      nume: "Columbia Huila",
      origine: "Columbia · Huila",
      prajire: "prăjire medie",
      note: "Dulce și echilibrată — caramel, măr copt, ciocolată cu lapte.",
      pret: "17 lei",
      swatch: "#a97a4b",
      cafea: "#241409",
      crema: "#8f6132"
    },
    {
      slug: "brazilia-cerrado",
      nume: "Brazilia Cerrado",
      origine: "Brazilia · Cerrado Mineiro",
      prajire: "prăjire medie-închisă",
      note: "Corp plin și rotund — ciocolată neagră, alune, zahăr brun.",
      pret: "16 lei",
      swatch: "#7c5233",
      cafea: "#1c0f07",
      crema: "#77502a"
    },
    {
      slug: "kenya-aa",
      nume: "Kenya AA",
      origine: "Kenya · Nyeri",
      prajire: "prăjire deschisă",
      note: "Suculentă și vie — coacăze negre, grepfrut, finiș lung.",
      pret: "19 lei",
      swatch: "#8a4a3a",
      cafea: "#2c150c",
      crema: "#9c5a38"
    },
    {
      slug: "guatemala-antigua",
      nume: "Guatemala Antigua",
      origine: "Guatemala · Antigua",
      prajire: "prăjire medie",
      note: "Caldă și așezată — cacao, condimente dulci, coajă de portocală.",
      pret: "17 lei",
      swatch: "#5c3a28",
      cafea: "#201207",
      crema: "#835c33"
    }
  ],

  /* ⚠️ DE COMPLETAT — programul real de opriri (date + locații + orar).
     Aceeași listă alimentează banda de pe Acasă și pagina Unde ne găsești. */
  opriri: [
    {
      data: "24.07.2026",
      zi: "vineri",
      loc: "Târgul verii",
      oras: "Satu Mare",
      program: "10:00–18:00"
    },
    {
      data: "02.08.2026",
      zi: "duminică",
      loc: "Piața de duminică",
      oras: "Baia Mare",
      program: "09:00–14:00"
    },
    {
      data: "14.08.2026",
      zi: "vineri",
      loc: "Festival în parc",
      oras: "Oradea",
      program: "12:00–22:00"
    },
    {
      data: "29.08.2026",
      zi: "sâmbătă",
      loc: "Nuntă privată",
      oras: "Cluj-Napoca",
      program: "16:00–24:00"
    }
  ],

  /* ⚠️ DE COMPLETAT — tipurile reale de evenimente servite + fotografii. */
  evenimente: [
    {
      overline: "01 — evenimente private",
      nume: "Nunți",
      text: "Bar de cafea lângă ringul de dans. Espresso și după tort."
    },
    {
      overline: "02 — companii",
      nume: "Corporate",
      text: "Standul vine la birou sau la conferință. Cafeaua ține pauza scurtă și bună."
    },
    {
      overline: "03 — public",
      nume: "Târguri & festivaluri",
      text: "Rând care se mișcă repede, cafea care nu se bea din obligație."
    },
    {
      overline: "04 — celebrări",
      nume: "Petreceri private",
      text: "Aniversări, botezuri, grădini. Aducem tot ce trebuie, tu aduci oamenii."
    }
  ]
};
