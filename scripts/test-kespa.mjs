// scripts/test-kespa.mjs
// VAIN TESTI: hakee Kespan oman sivun ja tallentaa debug-tiedostot.
// Ei koske data/menu.json-tiedostoon eikä tuotantosivun dataan.

import { mkdirSync, writeFileSync } from 'node:fs';

const SOURCE_URL = 'https://www.kespa.fi/';
const WEEKDAYS = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];
const DEBUG_DIR = 'data/debug';

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
  if (start === -1) return { items: [], error: `Päiväotsikkoa ei löytynyt: ${dayName} ${day}.${month}.`, start: -1 };

  const otherDays = WEEKDAYS.filter(d => d !== dayName).join('|');
  const nextHeader = new RegExp(`^(${otherDays})\\s+\\d{1,2}\\.\\d{1,2}\\.?$`, 'i');
  const items = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (nextHeader.test(lines[i])) break;
    const line = lines[i].replace(/^[-•*]\s*/, '').trim();
    if (line.length >= 2) items.push(line);
  }
  return { items, error: null, start };
}

async function main() {
  mkdirSync(DEBUG_DIR, { recursive: true });
  const date = new Date();
  const base = {
    source: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    targetDate: date.toISOString().slice(0, 10),
    targetDay: `${WEEKDAYS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`,
  };

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Salolounas Kespa test; +https://github.com/G-Szah/Salolounas)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Kespa fetch epäonnistui: HTTP ${response.status}`);

    const html = await response.text();
    writeFileSync(`${DEBUG_DIR}/kespa-source.html`, html, 'utf8');

    const lines = htmlToLines(html);
    const parsed = parseKespa(lines, date);
    const expected = ['Pyttipannu', 'Porsaan ulkofilee', 'Koskenlaskija-Juustokeitto', 'Persikkarahka'];
    const missing = expected.filter(item => !parsed.items.some(line => line.toLowerCase().includes(item.toLowerCase())));
    const output = {
      ...base,
      httpStatus: response.status,
      foundHeaderAtLine: parsed.start,
      parserError: parsed.error,
      items: parsed.items,
      validation: { expected, missing, passed: !parsed.error && missing.length === 0 },
      sampleLines: lines.slice(0, 250),
    };
    writeFileSync(`${DEBUG_DIR}/kespa-parsed.json`, JSON.stringify(output, null, 2), 'utf8');
    console.log(JSON.stringify(output, null, 2));
    if (!output.validation.passed) process.exitCode = 1;
  } catch (error) {
    const output = { ...base, error: error.message, validation: { passed: false } };
    writeFileSync(`${DEBUG_DIR}/kespa-parsed.json`, JSON.stringify(output, null, 2), 'utf8');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
