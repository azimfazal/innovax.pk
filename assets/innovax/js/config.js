/* ============================================================
   Innovax Technology — Site configuration
   Edit ONLY this file to personalise contact details, social
   links and the demo/contact form destination.
   Leave a value as "" to hide that item from the UI.
   ============================================================ */
window.INNOVAX_CONFIG = {
  /* Business contact (replace with verified details) */
  email: "info@innovax.pk",
  phone: "+92 313 9849131",      // displayed on Contact page & footer
  phoneHref: "tel:+923139849131",
  address: "Peshawar, Pakistan",
  whatsapp: "https://wa.me/923139849131",

  /* Social profiles (leave "" to hide) */
  facebook: "https://www.facebook.com/profile.php?id=61595661920188",
  linkedin: "",

  /* Form delivery.
     Option A (recommended for production): point formEndpoint at a form
     service such as Formspree / Web3Forms / your own API, e.g.
       formEndpoint: "https://formspree.io/f/xxxxxxx"
     The site will POST JSON to it and show the real success/error state.
     Option B (no backend): leave formEndpoint as "" and the form will
     open the visitor's email client pre-filled (mailto) — an honest,
     working fallback that never fakes a success message.            */
  formEndpoint: "",

  /* Site origin used in sitemap/canonical hints */
  siteUrl: "https://innovax.pk"
};

