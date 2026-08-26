// Salolounas – fetches menus from maittavamenu.fi via allorigins CORS proxy

const SOURCE_URL = 'https://www.maittavamenu.fi/lounaslistat/lounaslista-salo/';
const PROXY = `https://api.allorigins.win/get?url=${encodeURIComponent(SOURCE_URL)}`;

const DAYS_FI = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'];
const MONTHS_FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
                   'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];

function todayLabel() {
  const d = new Date();
  return `${DAYS_FI[d.getDay()]} ${d.getDate()}. ${MONTHS_FI[d.getMonth()]} ${d.getFullYear()}`;
}

document.getElementById('date-label').textContent = todayLabel();

// ---- badge helpers ----
function parseBadges(text) {
  const raw = text.replace(/<[^>]+>/g, '');
  const badges = [];
  if (/\bVEG\b/i.test(raw)) badges.push('<span class="badge badge-veg">VEG</span>');
  if (/\bG\b/.test(raw))    badges.push('<span class="badge badge-g">G</span>');
  if (/\bM\b/.test(raw))    badges.push('<span class="badge badge-m">M</span>');
  const clean = raw.replace(/\b(VEG|G|M)\b[,]?\s*/g, '').trim().replace(/,\s*$/, '');
  return { clean, badges };
}

// ---- parse HTML string from proxy ----
function parseRestaurants(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Each restaurant is wrapped in an article or entry-content section
  // maittavamenu uses .entry-content divs inside article.post elements
  const articles = doc.querySelectorAll('article.post, .restaurantpost, .entry-wrap');

  // Fallback: grab all h2 headings that could be restaurant names
  if (articles.length === 0) {
    return parseByHeadings(doc);
  }

  return Array.from(articles).map(art => parseArticle(art)).filter(Boolean);
}

function parseByHeadings(doc) {
  const results = [];
  // Try to find the main content container
  const container = doc.querySelector('.entry-content, .page-content, main, #content') || doc.body;
  const children = Array.from(container.children);

  let current = null;
  for (const el of container.querySelectorAll('h2, h3, p, ul, li, hr')) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h2' || tag === 'h3') {
      if (current) results.push(current);
      current = { name: el.textContent.trim(), items: [], price: '', address: '' };
    } else if (current && (tag === 'p' || tag === 'li')) {
      const txt = el.textContent.trim();
      if (!txt || txt === '—' || txt.startsWith('—')) continue;
      // Detect price line
      if (/\d+[,.]\d+\s*EUR/i.test(txt) && current.price === '') {
        current.price = txt;
      } else if (/\d+[,.]\d+\s*EUR/i.test(txt)) {
        // secondary price / children price, skip
      } else if (txt.length < 5) {
        // skip separator junk
      } else {
        current.items.push(txt);
      }
    }
  }
  if (current) results.push(current);
  return results.filter(r => r.items.length > 0);
}

function parseArticle(art) {
  const name = art.querySelector('h2, h1, .restaurant-name')?.textContent.trim();
  if (!name) return null;
  const items = [];
  let price = '';
  let address = '';
  art.querySelectorAll('p, li').forEach(el => {
    const txt = el.textContent.trim();
    if (!txt) return;
    if (/\d+[,.]\d+\s*EUR/i.test(txt) && price === '') { price = txt; return; }
    if (/(katu|tie|kuja|aukio|\d{5})/i.test(txt)) { address = txt; return; }
    items.push(txt);
  });
  return { name, items, price, address };
}

// ---- render ----
function renderCard(r) {
  const itemsHtml = r.items.slice(0, 12).map(item => {
    const { clean, badges } = parseBadges(item);
    return `<li>${clean}${badges.join('')}</li>`;
  }).join('');

  const priceHtml = r.price
    ? `<div class="price-tag">${r.price.replace(/(Lounas.*?EUR)/i, '<strong>$1</strong>')}</div>`
    : '';

  const addressHtml = r.address
    ? `<div class="address">${r.address}</div>` : '';

  return `
  <div class="card">
    <div class="card-header">
      <h2>${r.name}</h2>
      ${addressHtml}
    </div>
    <div class="card-body">
      <ul class="menu-items">${itemsHtml}</ul>
    </div>
    <div class="card-footer">
      ${priceHtml}
      <a class="more-link" href="${SOURCE_URL}" target="_blank" rel="noopener">maittavamenu.fi ↗</a>
    </div>
  </div>`;
}

// ---- fetch & boot ----
async function load() {
  const loadEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const gridEl  = document.getElementById('restaurants');

  try {
    const res = await fetch(PROXY);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const html = json.contents;

    const restaurants = parseRestaurants(html);

    loadEl.classList.add('hidden');

    if (restaurants.length === 0) {
      errorEl.classList.remove('hidden');
      errorEl.textContent = 'Lounaslistoja ei löydy tänään. Tarkista maittavamenu.fi.';
      return;
    }

    gridEl.innerHTML = restaurants.map(renderCard).join('');
  } catch (err) {
    loadEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.innerHTML = `Tietojen hakeminen epäonnistui.<br><small>${err.message}</small><br><br>
      <a href="${SOURCE_URL}" target="_blank">Avaa alkuperäinen sivu</a>`;
  }
}

load();
