import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import {
  calculateOFWEntitlements,
  createDefaultOFWCaseRecord,
  toggleChecklistItem,
  updateCaseMilestone,
} from '../src/lib/ofwTracker.ts';

const record = overrides => ({ ...createDefaultOFWCaseRecord(), ...overrides });

test('DMW AKSYON and OWWA BPBH estimates follow the selected membership status', () => {
  const active = calculateOFWEntitlements(record({ owwaStatus: 'active' }));
  const inactiveSingle = calculateOFWEntitlements(record({ owwaStatus: 'inactive', owwaContributions: 'single' }));
  const inactiveMultiple = calculateOFWEntitlements(record({ owwaStatus: 'inactive', owwaContributions: 'multiple' }));
  const inactiveLegacy = calculateOFWEntitlements(record({ owwaStatus: 'inactive', owwaContributions: undefined }));
  const undocumented = calculateOFWEntitlements(record({ owwaStatus: 'undocumented_non_member' }));

  assert.equal(active.dmwAksyonFundEligible, true);
  assert.equal(active.owwaBpbhEstimatedAmount, 20_000);
  assert.equal(inactiveSingle.owwaBpbhEstimatedAmount, 5_000);
  assert.equal(inactiveMultiple.owwaBpbhEstimatedAmount, 10_000);
  assert.equal(inactiveLegacy.owwaBpbhEstimatedAmount, 10_000);
  assert.equal(createDefaultOFWCaseRecord().owwaContributions, 'multiple');
  assert.equal(undocumented.dmwAksyonFundEligible, true);
  assert.equal(undocumented.owwaBpbhEstimatedAmount, 0);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
    assert.ok(active.advice[language].legal.length > 0);
    assert.ok(active.advice[language].financial.length > 0);
    assert.ok(active.advice[language].hotline.length > 0);
    assert.match(active.advice[language].financial, /livelihood support/);
    assert.ok(!/cash/i.test(active.advice[language].financial));
    assert.ok(!active.advice[language].financial.includes('\u2014'));
    assert.match(inactiveSingle.advice[language].financial, /5,000/);
    assert.match(inactiveMultiple.advice[language].financial, /10,000/);
    assert.match(undocumented.advice[language].financial, /AKSYON Fund/);
    assert.ok(!inactiveSingle.advice[language].financial.includes('\u2014'));
    assert.ok(!inactiveMultiple.advice[language].financial.includes('\u2014'));
  }
  assert.match(inactiveMultiple.advice.en.financial, /more than one contribution/);
});

test('solidary liability and seafarer contract guidance depend on case details', () => {
  const landCase = calculateOFWEntitlements(record({ localAgency: 'Local agency' }));
  const seaCase = calculateOFWEntitlements(record({ category: 'sea_based', localAgency: '' }));

  assert.equal(landCase.solidaryLiabilityApplicable, true);
  assert.equal(landCase.seafarerPoeaSecApplicable, false);
  assert.equal(seaCase.solidaryLiabilityApplicable, false);
  assert.equal(seaCase.seafarerPoeaSecApplicable, true);
  assert.match(seaCase.advice.en.legal, /RA 12021/);
});

test('milestone updates and checklist toggles return immutable records', () => {
  const original = createDefaultOFWCaseRecord();
  const progressed = updateCaseMilestone(original, 'mwo_case_opened', {
    id: 'event-1', date: '2026-10-21', notes: 'Reference received', agencyOrDesk: 'MWO desk',
  });
  const checked = toggleChecklistItem(progressed, 'passport');

  assert.notEqual(progressed, original);
  assert.equal(original.timeline.length, 0);
  assert.equal(progressed.currentMilestone, 'mwo_case_opened');
  assert.deepEqual(progressed.timeline[0], {
    id: 'event-1', date: '2026-10-21', milestone: 'mwo_case_opened', title: 'MWO case opened',
    notes: 'Reference received', agencyOrDesk: 'MWO desk',
  });
  assert.equal(original.checklist.passport, false);
  assert.equal(checked.checklist.passport, true);
  assert.equal(progressed.checklist.passport, false);
});

async function loadStorage({ failDefaultClear = false } = {}) {
  const source = await readFile(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const records = new Map();
  const workerRecords = new Map();
  const workerStore = {};
  const local = new Map();
  const module = { exports: {} };
  class BroadcastChannel {
    constructor() {}
    postMessage() {}
  }
  const storeFor = store => store === workerStore ? workerRecords : records;
  const idb = {
    createStore: () => workerStore,
    get: async (key, store) => storeFor(store).get(key),
    set: async (key, value, store) => { storeFor(store).set(key, value); },
    del: async (key, store) => { storeFor(store).delete(key); },
    clear: async store => {
      if (!store && failDefaultClear) throw new Error('Simulated IndexedDB clear failure');
      storeFor(store).clear();
    },
  };
  const window = {
    BroadcastChannel,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: id => {
      if (id === 'idb-keyval') return idb;
      if (id === './data/phLocations.ts') return {};
      if (id === './gwaTracker') return { isGWATrackerRecord: () => false };
      throw new Error(`Unexpected import in test: ${id}`);
    },
    window,
    localStorage: {
      clear: () => local.clear(),
      getItem: key => local.get(key) ?? null,
      removeItem: key => local.delete(key),
      setItem: (key, value) => local.set(key, value),
    },
    sessionStorage: { clear() {} },
    BroadcastChannel,
    Event,
    crypto: webcrypto,
    Date,
    setTimeout,
    clearTimeout,
  }, { filename: 'storage.ts' });
  return { storage: module.exports, records };
}

test('OFW tracker persists, reloads, clears, and is included in the privacy wipe', async () => {
  const { storage, records } = await loadStorage();
  const saved = createDefaultOFWCaseRecord('sea_based');

  await storage.saveOFWCaseTracker(saved);
  assert.deepEqual(await storage.loadOFWCaseTracker(), saved);
  assert.deepEqual(records.get('tulong_ofw_case_tracker'), saved);

  await storage.clearOFWCaseTracker();
  assert.equal(await storage.loadOFWCaseTracker(), null);
  await storage.saveOFWCaseTracker(saved);
  await storage.clearAllUserData();
  assert.equal(records.has('tulong_ofw_case_tracker'), false);
});

test('privacy wipe fallback explicitly removes the OFW tracker key', async () => {
  const { storage, records } = await loadStorage({ failDefaultClear: true });
  const saved = createDefaultOFWCaseRecord();
  await storage.saveOFWCaseTracker(saved);
  await storage.clearAllUserData();
  assert.equal(records.has('tulong_ofw_case_tracker'), false);
});

test('OFW card includes localized copy, accessible touch targets, and a read-only print mode', async () => {
  const source = await readFile(new URL('../src/components/worker/OFWCaseTrackerCard.tsx', import.meta.url), 'utf8');
  assert.match(source, /autoComplete="off"/);
  assert.match(source, /min-h-\[44px\]/);
  assert.match(source, /record\.owwaStatus === 'inactive' && <label/);
  assert.match(source, /update\('owwaContributions'/);
  assert.match(source, /One contribution, up to PHP 5,000/);
  assert.match(source, /More than one contribution, up to PHP 10,000/);
  assert.match(source, /readOnly \? <dl/);
  assert.match(source, /href="tel:1348"/);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
    assert.match(source, new RegExp(`^  ${language}: \\{`, 'm'));
  }
});

test('all changed OFW and integration sources contain no em dash characters', async () => {
  const paths = [
    '../src/lib/ofwTracker.ts', '../src/components/worker/OFWCaseTrackerCard.tsx',
    '../src/lib/storage.ts', '../src/lib/encryptedBackup.ts',
    '../src/components/worker/WorkerWizard.tsx', '../src/components/worker/WorkerPrintView.tsx',
    '../scripts/test-ofw-case-tracker.mjs', '../scripts/test-encrypted-backup.mjs',
    '../package.json', '../.agent-handoff.md',
  ];
  for (const path of paths) {
    const text = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.ok(!text.includes('\u2014'), `${path} must not contain em dash characters`);
  }
});
