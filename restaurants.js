// Salon ravintolat – tunnetut viralliset sivut linkkeja varten.
// Data haetaan live-tilassa LounasOpas.com:sta (ei maittavamenusta).
const WEBSITES = {
  "BKK by Thai Food Company": "https://www.thaifoodcompany.fi/",
  "Ravintola Kastu": "https://ravintolakastu.fi/",
  "Dreamravintola": "https://lounasopas.com/restaurant/dreamravintola-salo",
  "ABC Piihovi Salo Restaurant": "https://www.abcasemat.fi/",
};

function getWebsite(name) {
  return WEBSITES[name] || `https://lounasopas.com/lounas/salo`;
}
