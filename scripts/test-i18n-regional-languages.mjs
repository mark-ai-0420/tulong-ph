import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const sourcePath = fileURLToPath(new URL('../src/lib/i18n.ts', import.meta.url));
const source = await readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const moduleExports = {};
runInNewContext(compiled.outputText, { exports: moduleExports });

const { translations, supportedLanguages, getNextLanguage, isLanguage } = moduleExports;
const expectedLanguages = ['taglish', 'cebuano', 'ilocano', 'en'];

test('all supported translations have the same keys', () => {
  assert.equal(supportedLanguages.map(({ id }) => id).join(','), expectedLanguages.join(','));
  const englishKeys = Object.keys(translations.en).sort();

  for (const language of expectedLanguages) {
    assert.deepEqual(Object.keys(translations[language]).sort(), englishKeys, `${language} key parity`);
  }
});

test('supported language metadata has the requested labels and regions', () => {
  assert.equal(JSON.stringify(supportedLanguages), JSON.stringify([
    { id: 'taglish', label: 'Tagalog / Taglish', shortLabel: 'FIL', region: 'Pambansa / Luzon' },
    { id: 'cebuano', label: 'Cebuano / Bisaya', shortLabel: 'CEB', region: 'Visayas at Mindanao' },
    { id: 'ilocano', label: 'Ilokano / Ilocano', shortLabel: 'ILO', region: 'Hilagang Luzon' },
    { id: 'en', label: 'English', shortLabel: 'EN', region: 'Official / Global' },
  ]));
});

test('all translation values are non-empty strings', () => {
  for (const language of expectedLanguages) {
    for (const [key, value] of Object.entries(translations[language])) {
      assert.equal(typeof value, 'string', `${language}.${key} must be a string`);
      assert.ok(value.trim().length > 0, `${language}.${key} must not be empty`);
    }
  }
});

test('language validation accepts only supported language IDs', () => {
  for (const language of expectedLanguages) assert.equal(isLanguage(language), true);
  for (const value of ['', 'fil', 'es', null, undefined]) assert.equal(isLanguage(value), false);
});

test('getNextLanguage cycles through all four languages and back to Taglish', () => {
  let current = 'taglish';
  for (const expected of ['cebuano', 'ilocano', 'en', 'taglish', 'cebuano', 'ilocano', 'en', 'taglish']) {
    current = getNextLanguage(current);
    assert.equal(current, expected);
  }
});

test('translation data contains no em dashes', () => {
  const values = Object.values(translations).flatMap((dictionary) => Object.values(dictionary));
  assert.equal(values.some((value) => value.includes('\u2014')), false);
});
