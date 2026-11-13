import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, statSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
function loadTs(path) {
  const filename = resolve(root, path);
  const module = { exports: {} };
  const require = createRequire(filename);
  const code = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, require: name => name.startsWith('@/') || name.endsWith('.css') ? {} : require(name) }, { filename });
  return module.exports;
}
function pngDimensions(bytes, width, height) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
}
function snapshot(paths) {
  return paths.map(path => { const stat = statSync(resolve(root, path)); return [path, stat.mtimeMs, stat.ctimeMs, stat.size]; });
}

test('offline brand outputs are repeatable, valid and checked without writes', async () => {
  const existingPaths = ['src/app/icon.svg', 'src/app/favicon.ico', 'src/app/apple-icon.png', 'public/icons/icon-192.png', 'public/icons/icon-512.png', 'public/icons/icon-maskable-512.png', ...['home', 'edukasyon', 'manggagawa', 'install', 'privacy'].map(route => `public/og/${route}.png`)];
  const beforeImport = snapshot(existingPaths);
  globalThis.fetch = () => Promise.reject(new Error('Test forbids network'));
  const { buildBrandAssets, runCli } = await import('./generate-brand-assets.mjs');
  assert.deepEqual(snapshot(existingPaths), beforeImport, 'import must not write assets');
  await assert.rejects(globalThis.fetch('https://example.invalid'), /offline/);
  const first = await buildBrandAssets();
  const second = await buildBrandAssets();
  assert.deepEqual([...first.keys()], existingPaths);
  for (const [path, bytes] of first) {
    assert.ok(bytes.equals(second.get(path)), `${path} must repeat byte for byte`);
    assert.ok(bytes.equals(readFileSync(resolve(root, path))), `${path} must match disk`);
    if (path.endsWith('.png')) {
      const size = path.includes('/og/') ? [1200, 630] : path.includes('180') || path.includes('apple-icon') ? [180, 180] : path.includes('192') ? [192, 192] : [512, 512];
      pngDimensions(bytes, ...size);
    }
  }
  const ico = first.get('src/app/favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  let expectedOffset = 54;
  [16, 32, 48].forEach((size, i) => {
    const entry = 6 + i * 16;
    assert.equal(ico[entry], size);
    assert.equal(ico[entry + 1], size);
    assert.equal(ico.readUInt16LE(entry + 4), 1);
    assert.equal(ico.readUInt16LE(entry + 6), 32);
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.equal(offset, expectedOffset);
    assert.ok(length > 24 && offset + length <= ico.length);
    pngDimensions(ico.subarray(offset, offset + length), size, size);
    expectedOffset += length;
  });
  assert.equal(expectedOffset, ico.length);
  assert.equal(await runCli(['--check']), 11);
  const checked = spawnSync(process.execPath, ['scripts/generate-brand-assets.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
  assert.deepEqual(snapshot(existingPaths), beforeImport, '--check must preserve all asset timestamps');

  // Exercise the actual CLI against an isolated fixture, never remove repository assets.
  const fixture = mkdtempSync(join(tmpdir(), 'tulong-brand-check-'));
  try {
    for (const path of ['scripts/generate-brand-assets.mjs', 'src/components/shared/tulongLogo.json']) {
      mkdirSync(dirname(join(fixture, path)), { recursive: true });
      writeFileSync(join(fixture, path), read(path));
    }
    symlinkSync(resolve(root, 'node_modules'), join(fixture, 'node_modules'), 'dir');
    const checkFailure = () => spawnSync(process.execPath, ['scripts/generate-brand-assets.mjs', '--check'], { cwd: fixture, encoding: 'utf8' });
    const missing = checkFailure();
    assert.equal(missing.status, 1, missing.stderr);
    assert.match(missing.stderr, /ENOENT/);
    assert.equal(existsSync(join(fixture, 'src/app')), false, 'missing-file check must not create output directories');
    for (const [path, bytes] of first) {
      mkdirSync(dirname(join(fixture, path)), { recursive: true });
      writeFileSync(join(fixture, path), bytes);
    }
    const target = join(fixture, 'src/app/icon.svg');
    const changed = Buffer.from(first.get('src/app/icon.svg'));
    changed[changed.length - 1] ^= 1;
    writeFileSync(target, changed);
    const before = statSync(target).mtimeMs;
    const drift = checkFailure();
    assert.equal(drift.status, 1, drift.stderr);
    assert.match(drift.stderr, /differs: src\/app\/icon.svg/);
    assert.ok(readFileSync(target).equals(changed));
    assert.equal(statSync(target).mtimeMs, before);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('inline and standalone emblems use the same static artwork and accessible defaults', () => {
  const emblem = JSON.parse(read('src/components/shared/tulongLogo.json'));
  const { TulongLogo } = loadTs('src/components/shared/TulongLogo.tsx');
  const html = renderToStaticMarkup(createElement(TulongLogo));
  assert.match(html, /viewBox="0 0 168 72"/);
  assert.match(html, /aria-hidden="true"/);
  assert.ok(html.includes(emblem.artwork));
  const iconSvg = read('src/app/icon.svg');
  assert.match(iconSvg, /viewBox="0 0 64 64"/);
  assert.ok(iconSvg.includes('#FAF9F5'));
  assert.ok(iconSvg.includes(emblem.artwork));
  assert.match(renderToStaticMarkup(createElement(TulongLogo, { 'aria-hidden': false, 'aria-label': 'TulongPH' })), /aria-hidden="false"/);
  for (const color of ['#1E2D40', '#D4A44A']) assert.ok(emblem.artwork.includes(color));
  assert.ok(!emblem.artwork.includes('TulongPH') && !iconSvg.includes('TulongPH'));
  assert.ok(read('scripts/generate-brand-assets.mjs').includes("'TulongPH'"));
  for (const path of ['src/components/Navbar.tsx', 'src/components/shared/CivicFooter.tsx', 'src/app/not-found.tsx']) {
    const src = read(path);
    assert.ok(src.includes('TulongLogo') && src.includes('Tulong') && src.includes('PH') && !src.includes('sr-only'));
    assert.ok(!src.includes('HeartHandshake'));
  }
});

test('manifest and every route export complete independent civic metadata', () => {
  const manifest = loadTs('src/app/manifest.ts').default();
  assert.equal(manifest.theme_color, '#1E2D40');
  assert.equal(manifest.background_color, '#FAF9F5');
  assert.deepEqual(JSON.parse(JSON.stringify(manifest.icons)), [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]);
  for (const route of ['', 'edukasyon', 'manggagawa', 'install', 'privacy']) {
    const { metadata, viewport } = loadTs(`src/app/${route ? `${route}/` : ''}layout.tsx`);
    const image = `/og/${route || 'home'}.png`;
    assert.ok(metadata.title && metadata.description);
    assert.equal(new URL(metadata.alternates.canonical, 'https://tulongph.vercel.app').href, `https://tulongph.vercel.app/${route}`);
    assert.equal(new URL(metadata.openGraph.url).href.replace(/\/$/, ''), `https://tulongph.vercel.app${route ? `/${route}` : ''}`);
    for (const key of ['title', 'description', 'url', 'siteName', 'locale', 'type', 'images']) assert.ok(metadata.openGraph[key], `${route}: ${key}`);
    assert.equal(metadata.openGraph.siteName, 'TulongPH');
    assert.equal(metadata.openGraph.locale, 'fil_PH');
    assert.equal(metadata.openGraph.type, 'website');
    assert.equal(metadata.openGraph.images[0].url, image);
    assert.equal(metadata.openGraph.images[0].width, 1200);
    assert.equal(metadata.openGraph.images[0].height, 630);
    assert.ok(metadata.openGraph.images[0].alt);
    assert.equal(metadata.twitter.card, 'summary_large_image');
    assert.ok(metadata.twitter.title && metadata.twitter.description);
    assert.equal(metadata.twitter.images[0], image);
    if (!route) {
      assert.equal(viewport.themeColor, '#1E2D40');
      assert.equal(metadata.metadataBase.href, 'https://tulongph.vercel.app/');
      assert.equal(metadata.icons, undefined);
      assert.match(read('src/app/layout.tsx'), /application\/ld\+json/);
      assert.match(read('src/app/layout.tsx'), /WebApplication/);
      assert.match(read('src/app/layout.tsx'), /non-government/i);
    }
  }
});

test('owned UTF-8 sources contain no em dash', () => {
  const handoff = read('.agent-handoff.md');
  const owned = handoff.split('  - `').slice(1).map(part => part.split('`')[0]).filter(path => !/\.(png|ico)$/.test(path));
  assert.ok(owned.length >= 15);
  for (const path of new Set([...owned, 'src/components/shared/tulongLogo.json'])) assert.ok(!read(path).includes('\u2014'), path);
});
