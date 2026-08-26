// Salolounas app.js
// Hakee lounaslistat SUORAAN ravintoloiden omilta kotisivuilta.
// Käyttää r.jina.ai-tekstirenderoijaa (renderoi JS:n palvelimella),
// allorigins-proxya varajärjestelmänä.

const PROXIES = [
  { name: 'jina',       build: (u) => `https://r.jina.ai/${u}`, mode: 'text' },
  { name: 'allorigins', build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}&t=${Date.now()}`, mode: 'html' },
];

const WEEKDAY_FULL = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'];
const WEEKDAY_ABBR = ['su','ma','ti','ke','to','pe','la'];
const MONTHS_FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
                   'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];

const TODAY = new Date();
const TODAY_IDX  = TODAY.getDay();
const TODAY_FULL = WEEKDAY_FULL[TODAY_IDX];
const TODAY_ABBR = WEEKDAY_ABBR[TODAY_IDX];
const TODAY_LABEL = `${TODAY_FULL} ${TODAY.getDate()}. ${MONTHS_FI[TODAY.getMonth()]} ${TODAY.getFullYear()}`;
document.getElementById('date-label').textContent = TODAY_LABEL.charAt(0).toUpperCase() + TODAY_LABEL.slice(1);

const root = document.documentElement;
const btn  = document.getElementById('theme-toggle');
(function initTheme() {
  root.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
})();
btn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

function extractText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.querySelector('main, article, .content, body') || doc.body;
  return (main.innerText || main.textContent || '').replace(/\r/g, '');
}

function splitPrice(line) {
  const m = line.match(/^(.*?)[\s]*([\d]+[.,][\d]{2})\s*€?\s*$/);
  if (m && m[1].trim().length > 1) return { text: m[1].trim(), price: `${m[2].replace('.', ',')} €` };
  return { text: line.trim(), price: '' };
}

function parseKastu(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const re = new RegExp(`^${TODAY_ABBR}\\s*-\\s*(.+)$`, 'i');
  const items = [];
  for (const l of lines) {
    const m = l.match(re);
    if (m) items.push(splitPrice(m[1]));
  }
  return items;
}

function extractHeadingSection(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const dayRe = new RegExp(`^\\*{0,2}#{0,3}\\s*${TODAY_FULL}\\b`, 'i');
  const start = lines.findIndex(l => dayRe.test(l));
  if (start === -1) return [];

  const otherDays = WEEKDAY_FULL.filter(d => d !== TODAY_FULL);
  const otherRe = new RegExp(`^\\*{0,2}#{0,3}\\s*(${otherDays.join('|')})\\b`, 'i');
  const englishRe = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i;

  const items = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (otherRe.test(lines[i]) || englishRe.test(lines[i])) break;
    let l = lines[i].replace(/^[-*]+\s*/, '').replace(/\*\*/g, '').trim();
    if (l.length < 2) continue;
    if (/^(l|vl|g|ve|m|vs)(\+|,)?(l|vl|g|ve|m|vs)*$/i.test(l)) continue;
    items.push(splitPrice(l));
    if (items.length >= 8) break;
  }
  return items;
}

function parseTeijun(text)  { return extractHeadingSection(text); }
function parseFactory(text) { return extractHeadingSection(text); }

const PARSERS = { kastu: parseKastu, teijun: parseTeijun, factory: parseFactory };

async function fetchViaProxy(url, proxy) {
  const res = await fetch(proxy.build(url), { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  return proxy.mode === 'html' ? extractText(body) : body;
}

async function fetchRestaurant(r) {
  const parser = PARSERS[r.type];
  for (const proxy of PROXIES) {
    try {
      const text = await fetchViaProxy(r.url, proxy);
      const items = parser(text);
      if (items.length > 0) return { ...r, items, ok: true };
    } catch (e) {
      console.warn(`${r.name} / ${proxy.name} epäonnistui:`, e.message);
    }
  }
  return { ...r, items: [], ok: false };
}

function renderCard(r) {
  const status = r.ok && r.items.length > 0 ? 'ok' : (r.ok ? 'empty' : 'error');

  let body;
  if (status === 'ok') {
    body = `<ul class="menu-items">${r.items.map(item => `
      <li>
        <span>${item.text}</span>
        ${item.price ? `<span class="item-price">${item.price}</span>` : ''}
      </li>`).join('')}</ul>`;
  } else if (status === 'empty') {
    body = `<p class="muted-note">Tälle päivälle ei löytynyt listaa (esim. viikonloppu).</p>`;
  } else {
    body = `<p class="muted-note">Tietojen hakeminen epäonnistui.</p>`;
  }

  return `
  <div class="card status-${status}">
    <div class="card-header">
      <div class="card-title-row">
        <h2>${r.name}</h2>
        <span class="status-dot" title="${status === 'ok' ? 'Tiedot haettu' : status === 'empty' ? 'Ei listaa' : 'Virhe'}"></span>
      </div>
      <div class="address">📍 ${r.address}</div>
    </div>
    <div class="card-body">${body}</div>
    <div class="card-footer">
      <a class="more-link" href="${r.website}" target="_blank" rel="noopener">Avaa sivu ↗</a>
    </div>
  </div>`;
}

async function load() {
  const loadEl = document.getElementById('loading');
  const gridEl = document.getElementById('restaurants');
  const errorEl = document.getElementById('error');

  const results = await Promise.all(RESTAURANTS.map(fetchRestaurant));
  loadEl.classList.add('hidden');

  const anyData = results.some(r => r.items.length > 0);
  if (!anyData) {
    errorEl.classList.remove('hidden');
    errorEl.textContent = 'Yhdenkään ravintolan tietoja ei saatu haettua tänään.';
  }

  gridEl.innerHTML = results.map(renderCard).join('');
}

load();
