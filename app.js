// Salolounas app.js
// Päädata luetaan data/menu.json-tiedostosta. Ravintolakohtainen, testattu
// automaatio voi korvata yksittäisen kortin data/menus/<slug>.json-tiedostolla.

const WEEKDAY_FULL = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'];
const MONTHS_FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
                   'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];

const TODAY = new Date();
const TODAY_FULL = WEEKDAY_FULL[TODAY.getDay()];
const TODAY_ISO = TODAY.toISOString().slice(0, 10);
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

function showNotice(msg) {
  const el = document.getElementById('notice');
  el.classList.remove('hidden');
  el.textContent = msg;
}

function renderCard(r) {
  const status = r.items && r.items.length > 0 ? 'ok' : 'empty';
  const body = status === 'ok'
    ? `<ul class="menu-items">${r.items.map(item => `
        <li>
          <span>${item.text}</span>
          ${item.price ? `<span class="item-price">${item.price}</span>` : ''}
        </li>`).join('')}</ul>`
    : `<p class="muted-note">Tälle päivälle ei löytynyt listaa.</p>`;

  return `
  <div class="card status-${status}">
    <div class="card-header">
      <div class="card-title-row">
        <h2>${r.name}</h2>
        <span class="status-dot" title="${status === 'ok' ? 'Tiedot saatavilla' : 'Ei listaa'}"></span>
      </div>
      <div class="address">📍 ${r.address}</div>
    </div>
    <div class="card-body">${body}</div>
    <div class="card-footer">
      <a class="more-link" href="${r.website}" target="_blank" rel="noopener">Avaa sivu ↗</a>
    </div>
  </div>`;
}

async function loadFreshMenu(slug) {
  try {
    const res = await fetch(`data/menus/${slug}.json?t=${Date.now()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.targetDate !== TODAY_ISO || !Array.isArray(data.items) || data.items.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

function replaceRestaurant(restaurants, freshData, name) {
  if (!freshData) return false;
  const index = restaurants.findIndex(r => r.name === name);
  if (index === -1) return false;
  restaurants[index] = freshData;
  return true;
}

async function load() {
  const loadEl = document.getElementById('loading');
  const gridEl = document.getElementById('restaurants');
  const errorEl = document.getElementById('error');

  try {
    const res = await fetch(`data/menu.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Vain testatut, ravintolan omalta sivulta haettavat päivitykset korvaavat fallbackin.
    const [freshKespa, freshRosmariini] = await Promise.all([
      loadFreshMenu('kespa'),
      loadFreshMenu('rosmariini'),
    ]);
    const hasFreshKespa = replaceRestaurant(data.restaurants, freshKespa, 'Kespa');
    const hasFreshRosmariini = replaceRestaurant(data.restaurants, freshRosmariini, 'Lounasravintola Rosmariini');

    loadEl.classList.add('hidden');
    if (data.generated && data.generated !== TODAY_ISO && !hasFreshKespa && !hasFreshRosmariini) {
      showNotice(`Huom: näkyvä lista on viimeksi päivitetty ${data.generated} – ei välttämättä tämän päivän mukainen.`);
    }
    gridEl.innerHTML = data.restaurants.map(renderCard).join('');
  } catch (e) {
    loadEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.textContent = 'Lounaslistojen lataaminen epäonnistui. Yritä päivittää sivu.';
    console.error(e);
  }
}

load();
