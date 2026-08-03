#!/usr/bin/env node
// Smoke für D-058 (Felder) und D-060 (Kreuzungsfahren) am LAUFENDEN Spiel.
//
// Geprüft wird, was ein Test nicht kann:
//   1. Die Welt lädt ohne Fehler (neue Feld-Materialien, neuer Fahrzustand).
//   2. Das Fahrzeug fährt OHNE gedrückte Taste los — das ist der Kern von D-060.
//   3. Ein Druck auf D wirkt, auch wenn er lange vor der Kreuzung kommt.
const pw = await import(process.env.PW_CORE ?? 'playwright-core');
const chromium = pw.chromium ?? pw.default?.chromium;
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.env.SMOKE_URL ?? 'http://127.0.0.1:4188/';
const OUT = process.env.SMOKE_OUT ?? '.';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const textAt = (page, sel) =>
  page.evaluate(
    (s) => document.querySelector(s)?.innerText?.replace(/\s+/g, ' ').trim() ?? '(nicht da)',
    sel,
  );

/** Mittlerer Bildausschnitt als Zahlenreihe — Bewegung ohne Screenshot-Vergleich. */
const centreSignature = (page) =>
  page.evaluate(() => {
    const canvas = [...document.querySelectorAll('canvas')].at(-1);
    if (!canvas) return 'kein canvas';
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'kein 2d-kontext';
    const w = canvas.width;
    const h = canvas.height;
    const data = ctx.getImageData(w / 2 - 40, h / 2 - 40, 80, 80).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += data[i] * 3 + data[i + 1] * 5 + data[i + 2];
    return String(sum);
  });

const save = readFileSync(`${OUT}/p3-manual.json`, 'utf8');
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(6000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.addInitScript((s) => { localStorage.setItem('cmb.save.city1', s); }, save);
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 120_000 });
await page.waitForSelector('canvas', { timeout: 90_000 });
await page.waitForTimeout(12_000);
await page.screenshot({ path: `${OUT}/d060-1-welt.png`, timeout: 90_000 });

const hasDriveBtn = await page.evaluate(() =>
  [...document.querySelectorAll('.citywork-execution-actions button')].some((b) => /fahren/i.test(b.innerText)),
);
console.log('FAHRKNOPF:', hasDriveBtn);

let autoThrottle = '(nicht getestet)';
let junction = '(nicht getestet)';
if (hasDriveBtn) {
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('.citywork-execution-actions button')].find((b) => /fahren/i.test(b.innerText));
    button?.click();
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/d060-2-karte.png`, timeout: 90_000 });

  // (2) OHNE jede Taste warten. Bewegt sich das Bild, fährt das Fahrzeug selbst.
  const before = await centreSignature(page);
  await page.waitForTimeout(2600);
  const after = await centreSignature(page);
  autoThrottle = before === after ? `STEHT (${before})` : `FÄHRT VON SELBST (${before} → ${after})`;

  // (3) Richtungswunsch weit vor der Kreuzung.
  await page.keyboard.press('d');
  await page.waitForTimeout(2200);
  junction = await textAt(page, '.citywork-junction');
  await page.screenshot({ path: `${OUT}/d060-3-kreuzung.png`, timeout: 90_000 });
}

console.log('HUD      :', await textAt(page, '.citywork-drive-hud'));
console.log('AUTO-GAS :', autoThrottle);
console.log('KREUZUNG :', junction);
console.log('FEHLER   :', errors.length);
for (const e of errors.slice(0, 10)) console.log('   -', e);

await browser.close();
