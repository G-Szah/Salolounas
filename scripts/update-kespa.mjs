// scripts/update-kespa.mjs
// TUOTANTOVALMIS Kespa-päivitys: hakee Kespan oman sivun, varmistaa
// tämän päivän otsikon, ja kirjoittaa vain data/menus/kespa.json-tiedoston.
// Ei muuta data/menu.json-koostetta ennen kuin tulos on tarkistettu.

import { mkdirSync, writeFileSync } from 'node:fs';

const SOURCE_URL = 'https://www.kespa.fi/';
const WEEKDAYS = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ouml;/g, 'ö').replace(/&auml;/g, 'ä').replace(/&aring;/g, 'å')
    .replace(/&Ouml;/g, 'Ö').replace(/&Auml;/g, 'Ä').replace(/&Aring;/g, 'Å');
}

function htmlToLines(html) {
  const text = decodeEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(h1|h2|h3|h4|h5|h6|li|p|br|div|tr|td)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' '));
  return text.split('\n').map(line => line.trim()).filter(Boolean);
}

function parseKespa(lines, date) {
  const dayName = WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const header = new RegExp(`^${dayName}\\s+${day}\\.${month}\\.?$`, 'i');
  const start = lines.findIndex(line => header.test(line));
  if (start === -1) throw new Error(`Päiväotsikkoa ei löytynyt: ${dayName} ${day}.${month}.`);

  const otherDays = WEEKDAYS.filter(d => d !== dayName).join('|');
  const nextHeader = new RegExp(`^(${otherDays})\\s+\\d{1,2}\\.\\d{1,2}\\.?$`, 'i');
  const items = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (nextHeader.test(lines[i])) break;
    const text = lines[i].replace(/^[-•*]\s*/, '').trim();
    if (text.length >= 2) items.push({ text, price: '' });
  }
  if (!items.length) throw new Error('Päiväotsikko löytyi, mutta sen alla ei ollut ruokalajeja.');
  return items;
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Salolounas; +https://github.com/G-Szah/Salolounas)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Kespa fetch epäonnistui: HTTP ${response.status}`);

  const date = new Date();
  const items = parseKespa(htmlToLines(await response.text()), date);
  const output = {
    name: 'Kespa',
    address: 'Koskikatu 1, 24240 Salo',
    website: SOURCE_URL,
    source: SOURCE_URL,
    updatedAt: new Date().toISOString(),
    targetDate: date.toISOString().slice(0, 10),
    items,
  };

  mkdirSync('data/menus', { recursive: true });
  writeFileSync('data/menus/kespa.json', JSON.stringify(output, null, 2), 'utf8');
  console.log(`Kespa päivitetty: ${items.length} ruokalajia (${output.targetDate}).`);
}

main();
