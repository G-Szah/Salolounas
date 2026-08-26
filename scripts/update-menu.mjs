// scripts/update-menu.mjs
// Hakee kaikkien Salolounas-ravintoloiden tämän päivän listat
// suoraan LounasOpas.com:in ravintolakohtaisilta sivuilta (palvelinpuolella,
// GitHub Actions -ympäristössä ei CORS-rajoituksia) ja kirjoittaa
// tuloksen data/menu.json-tiedostoon.
//
// HUOM: Tämä lähde on todettu ajoittain epätarkaksi (esim. Factory Salo,
// Rosmariini). Skripti korvataan pian ravintolakohtaisilla parsijoilla,
// jotka hakevat suoraan ravintoloiden omilta sivuilta.

import { writeFileSync, mkdirSync } from 'node:fs';

const RESTAURANTS = [
  { name: 'ABC Piihovi Salo Restaurant', address: 'Ruoksmäentie 1, 24260 Salo',
    url: 'https://lounasopas.com/restaurant/abc-piihovi-salo-restaurant-salo-ruoksmaentie-1-24260-salo',
    website: 'https://www.abcasemat.fi/asemat/abc-piihovi-salo-542871546/noutopoyta-lounas' },
  { name: 'Factory Salo IoT Campus', address: 'Joensuunkatu 7, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/factory-salo-iot-campus-salo',
    website: 'https://ravintolafactory.com/lounasravintolat/ravintolat/factory-salo/' },
  { name: 'Kastu', address: 'Helsingintie 3, 24100 Salo',
    url: 'https://lounasopas.com/en/restaurant/kastu-salo-24100-salo',
    website: 'https://ravintolakastu.fi/' },
  { name: 'Kespa', address: 'Koskikatu 1, 24240 Salo',
    url: 'https://lounasopas.com/restaurant/kespa-salo-koskikatu-1-24240-salo',
    website: 'https://www.kespa.fi/' },
  { name: 'KhaoSuk', address: 'Helsingintie 8, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/khaosuk-salo',
    website: 'https://www.khaosuk.com/' },
  { name: 'Liikenneasema Kivihovi', address: 'Bulevardi 10, 25410 Suomusjärvi',
    url: 'https://lounasopas.com/restaurant/liikenneasema-kivihovi-salo-salo',
    website: 'https://kivihovi.fi/lounas' },
  { name: 'Lounasravintola Rosmariini', address: 'Joensuunkatu 13, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/lounasravintola-rosmariini-salo',
    website: 'https://pitopalvelurosmariini.fi/lounas/' },
  { name: "Ravintola Mama's", address: 'Salorankatu 5-7, 24240 Salo',
    url: 'https://lounasopas.com/restaurant/ravintola-mama-s-salo-salorankatu-5-7-salo',
    website: 'https://www.ravintolamamas.fi/' },
  { name: 'Rikalan krouvi', address: 'Rikalantie 74, 24800 Halikko, Salo',
    url: 'https://lounasopas.com/restaurant/rikalan-krouvi-salo-rikalantie-74-salo',
    website: 'https://rikalankrouvi.fi/lounas/' },
  { name: 'Shell HelmiSimpukka Salo Halikko', address: 'Vaskiontie 420, 24800 Salo',
    url: 'https://lounasopas.com/restaurant/shell-helmisimpukka-salo-halikko-salo',
    website: 'https://helmisimpukka.fi/asemat/salo-halikko' },
  { name: 'Teijun Keittiö', address: 'Turuntie 35, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/teijun-keittio-salo',
    website: 'https://www.teijunkeittio.fi/' },
  { name: 'Wiurilan kartanoravintola', address: 'Viurilantie 126, 24910 Salo',
    url: 'https://lounasopas.com/restaurant/wiurilan-kartanoravintola-salo-salo',
    website: 'https://wiurilansigrid.fi/lounas/' },
  { name: 'Antonio Salo', address: 'Vilhonkatu 8, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/antonio-salo-salo',
    website: 'https://www.raflaamo.fi/fi/ravintola/salo/antonio-salo/menu/lounas' },
];

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(h1|h2|h3|li|p|br|div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ouml;/g, 'ö').replace(/&auml;/g, 'ä').replace(/&aring;/g, 'å')
    .replace(/[ \t]+/g, ' ')
    .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function splitPrice(line) {
  const m = line.match(/^(.*?)[\s–-]*([\d]+[.,][\d]{2})\s*€?\s*$/);
  if (m && m[1].trim().length > 1) return { text: m[1].trim(), price: `${m[2].replace('.', ',')} €` };
  return { text: line.trim(), price: '' };
}

function parseTodaySection(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const idx = lines.findIndex(l => /\((Tänään|Today)\)/i.test(l));
  if (idx === -1) return [];
  const items = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i]) || /^(##|###)\s/.test(lines[i])) break;
    let l = lines[i].replace(/^[-*•]+\s*/, '').trim();
    if (l.length < 2) continue;
    if (/^(Maanantai|Tiistai|Keskiviikko|Torstai|Perjantai|Monday|Tuesday|Wednesday|Thursday|Friday)\b/i.test(l)) break;
    items.push(splitPrice(l));
    if (items.length >= 8) break;
  }
  return items;
}

async function fetchRestaurant(r) {
  try {
    const res = await fetch(r.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (SalolounasBot; +https://github.com/G-Szah/Salolounas)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const text = htmlToText(html);
    const items = parseTodaySection(text);
    return { name: r.name, address: r.address, website: r.website, items };
  } catch (e) {
    console.warn(`${r.name}: ${e.message}`);
    return { name: r.name, address: r.address, website: r.website, items: [] };
  }
}

async function main() {
  const results = [];
  for (const r of RESTAURANTS) {
    results.push(await fetchRestaurant(r));
    await new Promise(res => setTimeout(res, 400));
  }

  const today = new Date();
  const output = {
    generated: today.toISOString().slice(0, 10),
    dayLabel: ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'][today.getDay()],
    restaurants: results,
  };

  mkdirSync('data', { recursive: true });
  writeFileSync('data/menu.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`menu.json kirjoitettu: ${results.filter(r => r.items.length > 0).length}/${results.length} ravintolaa löytyi.`);
}

main();
