/* ============================================================
   com. — date de conținut (o singură sursă de adevăr)
   ------------------------------------------------------------
   ⚠️ DE COMPLETAT — prețurile și descrierile de mai jos sunt
   DEMONSTRATIVE. Meniul de băuturi (§11) și tipurile de
   evenimente (§12.8) vin de la proprietar. Structura însă e cea
   finală: completezi aici, site-ul se actualizează peste tot
   (switcher-ul din /cafea, grila de evenimente).
   ============================================================ */

window.COM_DATA = {

  /* Băuturile de la stand — alimentează switcher-ul din hero și /cafea.
     Per băutură (vezi §11 din brief): nume, descriere (rețetă + volum),
     note, culoare swatch + culoarea băuturii în cană
     (folosită de randarea provizorie pe canvas). */
  varieties: [
    {
      slug: 'espresso',
      name: 'Espresso',
      desc: 'espresso simplu · 30 ml',
      notes: 'Scurt, intens, cu crema densă. Toată cafeaua, fără nimic în plus.',
      swatch: '#4A2E1E',
      cup: '#30190E'
    },
    {
      slug: 'cappuccino',
      name: 'Cappuccino',
      desc: 'espresso + lapte texturat · 180 ml',
      notes: 'Espresso, lapte texturat, spumă fină. Clasicul care dispare primul la evenimente.',
      swatch: '#B98A5C',
      cup: '#C79E6F'
    },
    {
      slug: 'iced-latte',
      name: 'Iced Latte\n/ Latte',
      desc: 'espresso + lapte · cald sau cu gheață',
      notes: 'Lăptos și mătăsos. Vara cu gheață, iarna aburind — același espresso la bază.',
      swatch: '#DCC09A',
      cup: '#C8A176'
    },
    {
      slug: 'flat-white',
      name: 'Flat White',
      desc: 'dublu espresso + lapte catifelat · 160 ml',
      notes: 'Mai multă cafea, mai puțină spumă. Pentru cine vrea lapte, dar simte cafeaua.',
      swatch: '#C29B70',
      cup: '#B3855C'
    },
    {
      slug: 'cortado',
      name: 'Cortado',
      desc: 'espresso + lapte, părți egale · 120 ml',
      notes: 'Jumătate espresso, jumătate lapte cald. Echilibru pur, fără spectacol.',
      swatch: '#9C6B44',
      cup: '#8A5B39'
    },
    {
      slug: 'macchiato',
      name: 'Macchiato',
      desc: 'espresso „pătat” cu spumă de lapte · 40 ml',
      notes: 'Un espresso pătat cu o linguriță de spumă. Mic, dar cu personalitate.',
      swatch: '#6B4529',
      cup: '#502F19'
    },
    {
      slug: 'long-black',
      name: 'Long Black',
      desc: 'apă fierbinte + dublu espresso · 180 ml',
      notes: 'Dublu espresso turnat peste apă fierbinte. Aromele espresso-ului, pe îndelete.',
      swatch: '#3E2417',
      cup: '#241207'
    }
  ],

  /* Tipuri de evenimente servite — grila 2×2 de pe Acasă + /evenimente.
     ⚠️ DE COMPLETAT: proprietarul confirmă lista reală + fotografii. */
  eventTypes: [
    {
      slug: 'nunti',
      overline: 'Ziua cea mare',
      name: 'Nunți',
      blurb: 'Bar de cafea de specialitate pentru invitații tăi, de la ceremonie până târziu.'
    },
    {
      slug: 'corporate',
      overline: 'La birou sau la conferință',
      name: 'Corporate',
      blurb: 'Standul vine la sediu sau la eveniment. Cafea bună, echipă trează.'
    },
    {
      slug: 'targuri-festivaluri',
      overline: 'În mijlocul orașului',
      name: 'Târguri & festivaluri',
      blurb: 'Prezență de durată, volum mare, aceeași grijă pentru fiecare ceașcă.'
    },
    {
      slug: 'petreceri-private',
      overline: 'Acasă la tine',
      name: 'Petreceri private',
      blurb: 'Aniversări, botezuri, grădini. Standul se potrivește oriunde încape.'
    }
  ]
};
