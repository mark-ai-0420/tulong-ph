import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import {
  addSessionEntry,
  calculateTreatmentQuota,
  createDefaultTreatmentTracker,
  removeSessionEntry,
  resetCalendarYear,
} from '../src/lib/treatmentTracker.ts';

const session = (id, date = '2026-01-01') => ({ id, date, facility: 'City Hospital', notes: '' });

test('hemodialysis starts at 156 sessions and reports remaining quota and projection', () => {
  const tracker = createDefaultTreatmentTracker('hemodialysis', 2026);
  const calculation = calculateTreatmentQuota({ ...tracker, sessionsCompleted: 42 }, '2026-01-01');

  assert.equal(tracker.annualQuota, 156);
  assert.equal(calculation.sessionsCompleted, 42);
  assert.equal(calculation.annualRemaining, 114);
  assert.equal(calculation.percentUsed, 26.9);
  assert.match(calculation.projectedExhaustionDate ?? '', /^2026-\d{2}-\d{2}$/);
});

test('chemotherapy cycles default to 12 and calculate remaining cycles', () => {
  const tracker = createDefaultTreatmentTracker('chemotherapy', 2026);
  const calculation = calculateTreatmentQuota({ ...tracker, sessionsCompleted: 4 }, '2026-01-01');

  assert.equal(tracker.annualQuota, 12);
  assert.equal(calculation.annualRemaining, 8);
  assert.equal(calculation.percentUsed, 33.3);
});

test('peritoneal dialysis tracks sessions without inventing an annual session quota', () => {
  const tracker = createDefaultTreatmentTracker('peritoneal_dialysis', 2026);
  const calculation = calculateTreatmentQuota({ ...tracker, sessionsCompleted: 4 }, '2026-01-01');

  assert.equal(calculation.annualQuota, null);
  assert.equal(calculation.annualRemaining, null);
  assert.equal(calculation.percentUsed, null);
  assert.equal(calculation.isExhausted, false);
});

test('low quota warning begins at 12 sessions and exhaustion has its own state', () => {
  const tracker = createDefaultTreatmentTracker('hemodialysis', 2026);

  assert.equal(calculateTreatmentQuota({ ...tracker, sessionsCompleted: 144 }, '2026-01-01').isLowQuotaWarning, true);
  assert.equal(calculateTreatmentQuota({ ...tracker, sessionsCompleted: 143 }, '2026-01-01').isLowQuotaWarning, false);
  const exhausted = calculateTreatmentQuota({ ...tracker, sessionsCompleted: 156 }, '2026-01-01');
  assert.equal(exhausted.annualRemaining, 0);
  assert.equal(exhausted.isLowQuotaWarning, false);
  assert.equal(exhausted.isExhausted, true);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
    assert.ok(exhausted.alertAdvice.exhausted[language].length > 0);
  }
});

test('Guarantee Letter warning includes day 14 and expired dates are separate', () => {
  const tracker = { ...createDefaultTreatmentTracker('hemodialysis', 2026), glValidUntil: '2026-01-15' };
  const warning = calculateTreatmentQuota(tracker, '2026-01-01');
  assert.equal(warning.glDaysRemaining, 14);
  assert.equal(warning.isGlExpiringSoon, true);
  assert.equal(warning.isGlExpired, false);

  const expired = calculateTreatmentQuota({ ...tracker, glValidUntil: '2025-12-31' }, '2026-01-01');
  assert.equal(expired.glDaysRemaining, -1);
  assert.equal(expired.isGlExpiringSoon, false);
  assert.equal(expired.isGlExpired, true);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
    assert.ok(expired.alertAdvice.glExpired[language].length > 0);
  }
});

test('session helpers add, remove, and reset immutably', () => {
  const tracker = createDefaultTreatmentTracker('chemotherapy', 2025);
  const withEntry = addSessionEntry(tracker, session('one'));
  assert.notEqual(withEntry, tracker);
  assert.equal(withEntry.sessionsCompleted, 1);
  assert.equal(tracker.sessionsCompleted, 0);

  const withoutEntry = removeSessionEntry(withEntry, 'one');
  assert.equal(withoutEntry.sessionsCompleted, 0);
  assert.deepEqual(withoutEntry.entries, []);
  assert.equal(removeSessionEntry(withoutEntry, 'missing'), withoutEntry);

  const reset = resetCalendarYear(withEntry, 2026);
  assert.equal(reset.year, 2026);
  assert.equal(reset.sessionsCompleted, 0);
  assert.deepEqual(reset.entries, []);
  assert.equal(withEntry.entries.length, 1);
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
  const channels = [];
  const module = { exports: {} };
  class BroadcastChannel {
    constructor(name) { this.name = name; channels.push(this); }
    postMessage(message) { this.lastMessage = message; }
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
      if (id === './gwaTracker' || id === './gwaTracker.ts') return { isGWATrackerRecord: () => false };
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
  return { storage: module.exports, records, workerRecords, channels, local };
}

function getTextContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  return getTextContent(node.props?.children);
}

function getElements(node) {
  if (Array.isArray(node)) return node.flatMap(getElements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...getElements(node.props?.children)];
}

async function renderTrackerCard({ savedTracker, medicalCase, language = 'en', readOnly = false }) {
  const source = await readFile(new URL('../src/components/triage/TreatmentQuotaTrackerCard.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const states = [];
  const writes = [];
  let stateIndex = 0;
  let effects = [];
  const React = {
    useId: () => 'test-id',
    useState: initial => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], next => {
        states[index] = typeof next === 'function' ? next(states[index]) : next;
      }];
    },
    useEffect: effect => effects.push(effect),
  };
  const jsx = (type, props, key) => ({ type, props: { ...props, key } });
  const jsxRuntime = { jsx, jsxs: jsx, Fragment: Symbol.for('react.fragment') };
  const icons = new Proxy({}, { get: (_target, name) => String(name) });
  const dependencies = {
    react: React,
    'react/jsx-runtime': jsxRuntime,
    'lucide-react': icons,
    '@/lib/treatmentTracker': {
      addSessionEntry,
      calculateTreatmentQuota,
      createDefaultTreatmentTracker,
      removeSessionEntry,
      resetCalendarYear,
    },
    '@/lib/glTracking': { formatDateInput: () => '2026-01-01' },
    '@/lib/storage': {
      clearTreatmentTracker: async () => { writes.push(null); },
      loadTreatmentTracker: async () => savedTracker,
      saveTreatmentTracker: async tracker => { writes.push(tracker); },
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: id => {
      if (id in dependencies) return dependencies[id];
      throw new Error(`Unexpected component import in test: ${id}`);
    },
    crypto: webcrypto,
    Date,
    Intl,
    window: { confirm: () => true },
  }, { filename: 'TreatmentQuotaTrackerCard.tsx' });

  const render = () => {
    stateIndex = 0;
    effects = [];
    const tree = module.exports.TreatmentQuotaTrackerCard({ medicalCase, language, readOnly });
    return { tree, effects: [...effects] };
  };
  const initial = render();
  initial.effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  return { ...render(), writes, render: () => render().tree };
}

test('saved tracker adapts to the treatment category requested by the active case', async () => {
  const saved = {
    ...createDefaultTreatmentTracker('hemodialysis', 2026),
    sessionsCompleted: 40,
    entries: [session('saved-session')],
  };
  const card = await renderTrackerCard({
    savedTracker: saved,
    medicalCase: { category: 'chemotherapy', diagnosis: 'Chemotherapy' },
  });
  const text = getTextContent(card.tree);
  const cadence = getElements(card.tree).find(element => element.type === 'select' && element.props.name === 'weeklyCadence');

  assert.match(text, /Chemotherapy/);
  assert.match(text, /0 \/ 12 sessions/);
  assert.equal(cadence?.props.value, 2);
});

test('explicit case category takes precedence over conflicting diagnosis keywords', async () => {
  const dialysis = await renderTrackerCard({
    savedTracker: null,
    medicalCase: { category: 'dialysis', diagnosis: 'Chemotherapy follow-up' },
  });
  const dialysisText = getTextContent(dialysis.tree);
  assert.match(dialysisText, /Hemodialysis/);
  assert.match(dialysisText, /0 \/ 156 sessions/);

  const chemotherapy = await renderTrackerCard({
    savedTracker: null,
    medicalCase: { category: 'chemotherapy', diagnosis: 'dialysis' },
  });
  const chemotherapyText = getTextContent(chemotherapy.tree);
  assert.match(chemotherapyText, /Chemotherapy/);
  assert.match(chemotherapyText, /0 \/ 12 sessions/);
});

test('readOnly renders cadence and quota as text without interactive controls or persistence', async () => {
  const saved = { ...createDefaultTreatmentTracker('chemotherapy', 2026), annualQuota: 8, weeklyCadence: 2 };
  const card = await renderTrackerCard({
    savedTracker: saved,
    medicalCase: { category: 'chemotherapy', diagnosis: 'Chemotherapy' },
    readOnly: true,
  });
  const elements = getElements(card.tree);
  const text = getTextContent(card.tree);

  assert.match(text, /Sessions per week:\s*2/);
  assert.match(text, /Planned chemo cycles:\s*8/);
  assert.ok(!elements.some(element => ['input', 'select', 'textarea', 'form'].includes(element.type)));
  assert.deepEqual(card.writes, []);
});

test('session date from a different calendar year is rejected with localized guidance', async () => {
  const card = await renderTrackerCard({
    savedTracker: createDefaultTreatmentTracker('hemodialysis', 2025),
    medicalCase: { category: 'dialysis', diagnosis: 'Hemodialysis', hospitalName: 'City Hospital' },
    language: 'taglish',
  });
  let tree = card.tree;
  const recordButton = getElements(tree).find(element => element.type === 'button' && getTextContent(element).includes('Itala ang Session'));
  recordButton.props.onClick();
  tree = card.render();
  getElements(tree).find(element => element.type === 'input' && element.props.name === 'sessionDate')
    .props.onChange({ target: { value: '2026-01-01' } });
  getElements(tree).find(element => element.type === 'input' && element.props.name === 'facility')
    .props.onChange({ target: { value: 'City Hospital' } });
  tree = card.render();

  const form = getElements(tree).find(element => element.type === 'form');
  let defaultPrevented = false;
  form.props.onSubmit({ preventDefault: () => { defaultPrevented = true; } });
  tree = card.render();
  const error = getElements(tree).find(element => element.props?.role === 'alert' && getTextContent(element).includes('Bagong Taon'));

  assert.equal(defaultPrevented, true);
  assert.ok(error);
  assert.match(getTextContent(error), /2025/);
  assert.match(getTextContent(error), /Bagong Taon/);
  assert.deepEqual(card.writes, []);
});

test('treatment tracker persists locally and clearAllUserData removes it', async () => {
  const { storage, records } = await loadStorage();
  const tracker = createDefaultTreatmentTracker('hemodialysis', 2026);

  await storage.saveTreatmentTracker(tracker);
  assert.deepEqual(await storage.loadTreatmentTracker(), tracker);
  assert.equal(records.get('tulong_treatment_tracker').annualQuota, 156);

  await storage.clearAllUserData();
  assert.equal(records.has('tulong_treatment_tracker'), false);
  assert.equal(await storage.loadTreatmentTracker(), null);
});

test('privacy wipe fallback explicitly deletes the treatment tracker key', async () => {
  const { storage, records } = await loadStorage({ failDefaultClear: true });
  await storage.saveTreatmentTracker(createDefaultTreatmentTracker('chemotherapy', 2026));
  assert.equal(records.has('tulong_treatment_tracker'), true);

  await storage.clearAllUserData();
  assert.equal(records.has('tulong_treatment_tracker'), false);
});

test('treatment source, integrations, and test copy contain no em dashes', async () => {
  const paths = [
    '../src/lib/treatmentTracker.ts',
    '../src/components/triage/TreatmentQuotaTrackerCard.tsx',
    '../src/components/TriageWizard.tsx',
    '../src/components/PrintFormsView.tsx',
    '../src/lib/storage.ts',
    '../src/lib/encryptedBackup.ts',
    '../scripts/test-treatment-quota-tracker.mjs',
  ];
  for (const path of paths) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.ok(!source.includes('\u2014'), `${path} must not contain em dashes`);
  }

  const component = await readFile(new URL('../src/components/triage/TreatmentQuotaTrackerCard.tsx', import.meta.url), 'utf8');
  assert.match(component, /autoComplete="off"/);
  assert.match(component, /min-h-\[44px\]/);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) assert.match(component, new RegExp(`${language}: \{`));
});
