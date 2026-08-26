// Salolounas app.js
// Ensisijainen lähde: LounasOpas.com:in Salo-koontisivu (ei maittavamenusta).
// LounasOpas on JS-renderoitu sivu, joten raaka HTML-fetch ei toimi –
// käytetään r.jina.ai-tekstirenderoijaa ensisijaisena lähteenä, ja
// allorigins-proxya varana. Jos molemmat epäonnistuvat, näytetään
// snapshot.js:stä löytyvä viimeksi tunnettu data.

const SOURCE_URL = 'https://lounasopas.com/lounas/salo';
const PROXIES = [
  { name: 'jina',  build: () => `https://r.jina.ai/${SOURCE_URL}`, mode: 'text' },
  { name: 'allorigins', build: () => `https://api.allorigins.win/raw?url=${encodeURIComponent(SOURCE_URL)}&t=${Date.now()}`, mode: 'html' },
];

const DAYS_FI   = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'];
const MONTHS_FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
                   'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];
const TODAY = new Date();
const TODAY_LABEL = `${DAYS_FI[TODAY.getDay()]} ${TODAY.getDate()}. ${MONTHS_FI[TODAY.getMonth()]} ${TODAY.getFullYear()}`;
document.getElementById('date-label').textContent = TODAY_LABEL;

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

const LINE_RE = /^- (.+?) – (.+?)\. Tänään: (.+)$/gm;

function splitItems(raw) {
  const parts = raw.split(/\),\s*/).map((s, i, arr) => (i < arr.length - 1 ? s + ')' : s));
  return parts.map(p => {
    const m = p.match(/^(.*?)\s*\(([\d,]+\s*€)\)\s*$/);
    if (m) return { text: m[1].trim(), price: m[2].trim() };
    return { text: p.trim(), price: '' };
  }).filter(x => x.text.length > 1);
}

function parseLounasOpasText(text) {
  const restaurants = [];
  let match;
  LINE_RE.lastIndex = 0;
  while ((match = LINE_RE.exec(text)) !== null) {
    const [, name, address, itemsRaw] = match;
    const items = splitItems(itemsRaw.trim());
    if (items.length > 0) restaurants.push({ name: name.trim(), address: address.trim(), items });
  }
  return restaurants;
}

function extractText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main, article, .content, body') || doc.body;
  return (main.innerText || main.textContent || '').replace(/\s+\n/g, '\n');
}

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
        <span class="status-dot" title="Tiedot haettu"></span>
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

function renderAll(restaurants) {
  const gridEl = document.getElementById('restaurants');
  gridEl.innerHTML = restaurants.map(renderCard).join('');
}

function showNotice(msg) {
  const el = document.getElementById('notice');
  el.classList.remove('hidden');
  el.textContent = msg;
}

async function tryProxy(proxy) {
  const res = await fetch(proxy.build(), { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  const text = proxy.mode === 'html' ? extractText(body) : body;
  const restaurants = parseLounasOpasText(text);
  if (restaurants.length === 0) throw new Error('0 ravintolaa parsittu');
  return restaurants;
}

async function load() {
  const loadEl  = document.getElementById('loading');
  const errorEl = document.getElementById('error');

  for (const proxy of PROXIES) {
    try {
      const restaurants = await tryProxy(proxy);
      loadEl.classList.add('hidden');
      renderAll(restaurants);
      return;
    } catch (e) {
      console.warn(`Proxy ${proxy.name} epäonnistui:`, e.message);
    }
  }

  loadEl.classList.add('hidden');
  if (typeof FALLBACK_RESTAURANTS !== 'undefined' && FALLBACK_RESTAURANTS.length > 0) {
    showNotice(`Live-päivitys epäonnistui – näytetään viimeksi tallennettu lista (${SNAPSHOT_DATE}).`);
    renderAll(FALLBACK_RESTAURANTS);
  } else {
    errorEl.classList.remove('hidden');
    errorEl.innerHTML = `Tietojen hakeminen epäonnistui kokonaan. <a href="${SOURCE_URL}" target="_blank">Avaa LounasOpas.com</a>`;
  }
}

load();
