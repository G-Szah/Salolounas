// Salolounas app.js
// Hakee Salon lounaslistat LounasOpas.com:in koontisivulta (ei maittavamenusta).
// Sivu jo merkitsee kunkin ravintolan "Tänään"-annokset, joten
// näytetään vain tämän päivän vaihtoehdot hintoineen.

const SOURCE_URL = 'https://lounasopas.com/lounas/salo';
const PROXY = `https://api.allorigins.win/get?url=${encodeURIComponent(SOURCE_URL)}&t=${Date.now()}`;

const DAYS_FI   = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'];
const MONTHS_FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
                   'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];
const TODAY = new Date();
const TODAY_LABEL = `${DAYS_FI[TODAY.getDay()]} ${TODAY.getDate()}. ${MONTHS_FI[TODAY.getMonth()]} ${TODAY.getFullYear()}`;
document.getElementById('date-label').textContent = TODAY_LABEL;

// ---- teema ----
const root = document.documentElement;
const btn  = document.getElementById('theme-toggle');

(function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  root.setAttribute('data-theme', saved);
})();

btn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ---- parsintaa ----
// LounasOpas listaa rivit muodossa:
// "Nimi – Osoite. Tänään: Annos1 (12,00 €), Annos2 (13,50 €), ..."
function parseLounasOpas(text) {
  const restaurants = [];
  const lineRe = /([A-ZÄÖÅ][^–\n]{2,60})\s*–\s*([^.]+?\.\s*\d{5}\s*Salo)\.\s*Tänään:\s*([^\n]+?)(?=(?:[A-ZÄÖÅ][^–\n]{2,60}\s*–)|$)/g;

  let match;
  while ((match = lineRe.exec(text)) !== null) {
    const [, name, address, itemsRaw] = match;
    const items = splitItems(itemsRaw.trim());
    if (items.length > 0) {
      restaurants.push({ name: name.trim(), address: address.trim(), items });
    }
  }
  return restaurants;
}

function splitItems(raw) {
  const parts = raw.split(/\),\s*/).map((s, i, arr) => (i < arr.length - 1 ? s + ')' : s));
  return parts.map(p => {
    const m = p.match(/^(.*?)\s*\(([\d,]+\s*€)\)\s*$/);
    if (m) return { text: m[1].trim(), price: m[2].trim() };
    return { text: p.trim(), price: '' };
  }).filter(x => x.text.length > 1);
}

// ---- render ----
function renderCard(r) {
  const itemsHtml = r.items.map(item => `
    <li>
      <span>${item.text}</span>
      ${item.price ? `<span class="item-price">${item.price}</span>` : ''}
    </li>`).join('');

  const website = getWebsite(r.name);

  return `
  <div class="card status-ok">
    <div class="card-header">
      <div class="card-title-row">
        <h2>${r.name}</h2>
        <span class="status-dot" title="Tiedot haettu tänään"></span>
      </div>
      <div class="address">📍 ${r.address}</div>
    </div>
    <div class="card-body">
      <ul class="menu-items">${itemsHtml}</ul>
    </div>
    <div class="card-footer">
      <a class="more-link" href="${website}" target="_blank" rel="noopener">Avaa sivu ↗</a>
    </div>
  </div>`;
}

// ---- boot ----
async function load() {
  const loadEl  = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const gridEl  = document.getElementById('restaurants');

  try {
    const res = await fetch(PROXY, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const html = json.contents;
    if (!html) throw new Error('Tyhjä vastaus');

    const doc  = new DOMParser().parseFromString(html, 'text/html');
    const main = doc.querySelector('main, article, .content, body');
    const text = (main.innerText || main.textContent).replace(/\s+\n/g, '\n');

    const restaurants = parseLounasOpas(text);

    loadEl.classList.add('hidden');

    if (restaurants.length === 0) {
      errorEl.classList.remove('hidden');
      errorEl.innerHTML = `Tänään julkaistuja lounaslistoja ei löytynyt. <a href="${SOURCE_URL}" target="_blank">Avaa LounasOpas</a>`;
      return;
    }

    gridEl.innerHTML = restaurants.map(renderCard).join('');
  } catch (err) {
    loadEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.innerHTML = `Tietojen hakeminen epäonnistui.<br><small>${err.message}</small><br><br>
      <a href="${SOURCE_URL}" target="_blank">Avaa LounasOpas.com</a>`;
  }
}

load();
