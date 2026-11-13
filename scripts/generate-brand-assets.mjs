import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement as h } from 'react';
import { ImageResponse } from 'next/og.js';

// Fail closed if the renderer ever attempts to load remote fonts or images.
globalThis.fetch = () => Promise.reject(new Error('Brand assets must render offline: fetch is blocked'));
const root = fileURLToPath(new URL('../', import.meta.url));
const emblem = JSON.parse(readFileSync(new URL('../src/components/shared/tulongLogo.json', import.meta.url), 'utf8'));
const [, , vbWidth, vbHeight] = emblem.viewBox.split(/\s+/).map(Number);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${emblem.viewBox}">${emblem.artwork}</svg>\n`;
const iconScale = +(58 / vbWidth).toFixed(4);
const iconTx = +((64 - vbWidth * iconScale) / 2).toFixed(2);
const iconTy = +((64 - vbHeight * iconScale) / 2).toFixed(2);
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#FAF9F5" stroke="#E2DFD6" stroke-width="1.2"/><g transform="translate(${iconTx},${iconTy}) scale(${iconScale})">${emblem.artwork}</g></svg>\n`;
const font = readFileSync(new URL('../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf', import.meta.url));
const colors = { slate: '#1E2D40', paper: '#FAF9F5', rule: '#E2DFD6', sage: '#2D5245', gold: '#D4A44A', ink: '#0F172A' };
const mark = (width) => h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width, height: Math.round((width * vbHeight) / vbWidth) });
const box = (style, ...children) => h('div', { style: { display: 'flex', ...style } }, ...children);
const text = (style, value) => box(style, value);

async function png(element, width, height) {
  const response = new ImageResponse(element, { width, height, fonts: [{ name: 'Geist', data: font, weight: 400, style: 'normal' }] });
  return Buffer.from(await response.arrayBuffer());
}

function ico(frames) {
  const directory = Buffer.alloc(6 + frames.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;
  frames.forEach(({ size, bytes }, index) => {
    const entry = 6 + index * 16;
    directory[entry] = size;
    directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(bytes.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += bytes.length;
  });
  return Buffer.concat([directory, ...frames.map(frame => frame.bytes)]);
}

const cards = [
  ['home', 'Kalusugan', 'Gabay sa tulong sa ospital', 'Alamin ang tamang pagkakasunod-sunod ng tulong sa ospital.'],
  ['edukasyon', 'Edukasyon', 'Abot-kayang pag-aaral', 'Mga scholarship, CHED, TES at LGU aid para sa pamilyang Pilipino.'],
  ['manggagawa', 'Manggagawa', 'Gabay sa benepisyo at trabaho', 'SSS, Pag-IBIG, DOLE at OFW assistance calculator at gabay.'],
  ['install', 'Offline App', 'May gabay, kahit offline', 'I-save sa telepono. Gumagana kahit mahina ang signal sa ospital.'],
  ['privacy', 'Privacy', 'Pribado ang inyong datos', '100% pribado sa device mo. Walang account, walang server storage.'],
];

function card(section, heading, description) {
  return box({ width: '100%', height: '100%', background: colors.paper, color: colors.ink, fontFamily: 'Geist', padding: 32 },
    box({ width: '100%', height: '100%', flexDirection: 'column', border: `2px solid ${colors.rule}`, borderTop: `12px solid ${colors.slate}`, padding: '32px 40px' },
      box({ alignItems: 'center', justifyContent: 'space-between' },
        box({ alignItems: 'center' }, mark(180)),
        text({ color: colors.sage, border: `1px solid ${colors.sage}`, borderRadius: 28, padding: '10px 20px', fontSize: 20 }, 'Libre · Pribado · Offline')),
      text({ marginTop: 28, fontSize: 22, color: colors.sage, letterSpacing: 3, textTransform: 'uppercase' }, section),
      text({ marginTop: 12, fontSize: 62, lineHeight: 1.05, letterSpacing: -2, textShadow: '1px 0 currentColor', maxWidth: 980 }, heading),
      text({ marginTop: 20, fontSize: 29, lineHeight: 1.3, maxWidth: 920 }, description),
      text({ marginTop: 'auto', paddingTop: 22, borderTop: `1px solid ${colors.rule}`, fontSize: 21, color: colors.slate }, 'tulongph.vercel.app · Independent Civic Guide (Non-Government)')));
}

function squareTile(size, artworkWidth) {
  return png(box({ width: size, height: size, background: colors.paper, alignItems: 'center', justifyContent: 'center' }, mark(artworkWidth)), size, size);
}

/** Returns every output in memory. Importing this module never writes files. */
export async function buildBrandAssets() {
  const assets = new Map([['src/app/icon.svg', Buffer.from(iconSvg)]]);
  const frames = [];
  for (const size of [16, 32, 48]) frames.push({ size, bytes: await squareTile(size, Math.round(size * 0.92)) });
  assets.set('src/app/favicon.ico', ico(frames));
  for (const [path, size, artworkWidth] of [
    ['src/app/apple-icon.png', 180, 156],
    ['public/icons/icon-192.png', 192, 166],
    ['public/icons/icon-512.png', 512, 448],
    ['public/icons/icon-maskable-512.png', 512, 340],
  ]) {
    assets.set(path, await squareTile(size, artworkWidth));
  }
  for (const [path, section, heading, description] of cards) assets.set(`public/og/${path}.png`, await png(card(section, heading, description), 1200, 630));
  return assets;
}

export async function runCli(args = process.argv.slice(2), outputRoot = root) {
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: generate-brand-assets.mjs [--check]');
  const assets = await buildBrandAssets();
  for (const [path, bytes] of assets) {
    const target = resolve(outputRoot, path);
    if (args.includes('--check')) {
      if (!readFileSync(target).equals(bytes)) throw new Error(`Brand asset differs: ${path}`);
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    }
  }
  return assets.size;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  runCli().then(count => console.log(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${count} brand assets.`)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
