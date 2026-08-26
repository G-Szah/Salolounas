// Salon ravintolat – tunnetut viralliset sivut "Avaa sivu"-linkkeja varten.
const WEBSITES = {
  "Kastu": "https://ravintolakastu.fi/",
  "Kotipizza": "https://www.kotipizza.fi/",
  "Wiurilan kartanoravintola": "https://www.wiurila.fi/",
};

function getWebsite(name) {
  return WEBSITES[name] || `https://lounasopas.com/lounas/salo`;
}
