import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import {
  calculateStipendSummary,
  evaluateRetentionStatus,
  formatGradeDisplay,
  isGWATrackerRecord,
  normalizeGWAToPercentage,
} from '../src/lib/gwaTracker.ts';

function term(overrides = {}) {
  const rawGWA = overrides.rawGWA ?? 85;
  const gradingScale = overrides.gradingScale ?? 'percentage';
  const expectedStipend = overrides.expectedStipend ?? 20_000;
  const receivedStipend = overrides.receivedStipend ?? 0;
  const disbursementStatus = receivedStipend <= 0 ? 'pending' : receivedStipend >= expectedStipend ? 'disbursed' : 'partial';
  return {
    id: 'term-1', academicYear: 'AY 2025-2026', semester: '1st', rawGWA, gradingScale,
    normalizedPercentage: normalizeGWAToPercentage(rawGWA, gradingScale), unitsEnrolled: 20, unitsPassed: 20,
    hasFailingGrade: false, programId: 'ched-cmsp-full', expectedStipend, receivedStipend,
    disbursementStatus, ...overrides,
  };
}

async function loadTrackerComponent({ loadGWATracker, saveGWATracker, clearGWATracker, confirm = () => true }) {
  const source = await readFile(new URL('../src/components/education/GWATrackerCard.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const hooks = [];
  let hookIndex = 0;
  let pendingEffects = [];
  let dirty = false;
  let tree;
  const listeners = new Map();
  const window = {
    addEventListener(type, listener) {
      const handlers = listeners.get(type) ?? new Set();
      handlers.add(listener);
      listeners.set(type, handlers);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    confirm() { return confirm(); },
  };
  const depsChanged = (left, right) => !left || !right || left.length !== right.length || left.some((value, index) => !Object.is(value, right[index]));
  const react = {
    useState(initial) {
      const index = hookIndex++;
      if (!hooks[index]) hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, value => {
        const next = typeof value === 'function' ? value(hooks[index].value) : value;
        if (!Object.is(next, hooks[index].value)) {
          hooks[index].value = next;
          dirty = true;
        }
      }];
    },
    useRef(initial) {
      const index = hookIndex++;
      if (!hooks[index]) hooks[index] = { current: initial };
      return hooks[index];
    },
    useMemo(factory) {
      hookIndex++;
      return factory();
    },
    useEffect(effect, deps) {
      const index = hookIndex++;
      const previous = hooks[index];
      if (!previous || depsChanged(previous.deps, deps)) {
        pendingEffects.push({ index, effect, deps, previous });
        hooks[index] = { deps, cleanup: previous?.cleanup };
      }
    },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: id => {
      if (id === 'react') return react;
      if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: Symbol('Fragment') };
      if (id === '@/lib/gwaTracker') return { calculateStipendSummary, evaluateRetentionStatus, formatGradeDisplay, normalizeGWAToPercentage };
      if (id === '@/lib/storage') return { loadGWATracker, saveGWATracker, clearGWATracker };
      throw new Error(`Unexpected tracker import: ${id}`);
    },
    window,
  }, { filename: 'GWATrackerCard.tsx' });

  let props = { language: 'en' };
  function render(nextProps = props) {
    props = nextProps;
    do {
      dirty = false;
      hookIndex = 0;
      pendingEffects = [];
      tree = module.exports.GWATrackerCard(props);
      const effects = pendingEffects;
      pendingEffects = [];
      for (const { index, effect, deps, previous } of effects) {
        previous?.cleanup?.();
        hooks[index] = { deps, cleanup: effect() };
      }
    } while (dirty);
    return tree;
  }
  return {
    render,
    get tree() { return tree; },
    dispatch(type) { for (const listener of listeners.get(type) ?? []) listener({ type }); },
  };
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object' || !node.type) return [];
  return [node, ...elements(node.props?.children)];
}

function nodeText(node) {
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node?.props ? nodeText(node.props.children) : '';
}

function button(tree, label) {
  return elements(tree).find(node => node.type === 'button' && nodeText(node.props.children).trim().replace(/^\+\s*/, '') === label);
}

function input(tree, id) {
  return elements(tree).find(node => node.props.id === id);
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('delayed GWA reads keep controls disabled, block mutations, and ignore stale results', async () => {
  const initial = deferred();
  const delayed = deferred();
  const latest = deferred();
  const pending = [initial, delayed, latest];
  const calls = { load: 0, save: 0, clear: 0, confirm: 0 };
  const component = await loadTrackerComponent({
    loadGWATracker: () => pending[calls.load++].promise,
    saveGWATracker: async () => { calls.save += 1; },
    clearGWATracker: async () => { calls.clear += 1; },
    confirm: () => { calls.confirm += 1; return true; },
  });

  component.render({ language: 'en' });
  assert.equal(calls.load, 1);
  component.render({ language: 'cebuano' });
  assert.equal(calls.load, 1, 'changing language does not start another data read');
  assert.equal(button(component.tree, 'Pagdugang og semestre').props.disabled, true);

  initial.resolve({ records: [term()], updatedAt: '2026-10-21T00:00:00.000Z' });
  await flush();
  component.render({ language: 'en' });
  button(component.tree, 'Add a semester').props.onClick();
  component.render();
  for (const [id, value] of [
    ['gwa-academic-year', 'AY 2030-2031'], ['gwa-grade', '88'],
    ['gwa-units-enrolled', '20'], ['gwa-units-passed', '20'],
  ]) {
    input(component.tree, id).props.onChange({ target: { value } });
  }
  component.render();

  component.dispatch('tulongph-data-restored');
  assert.equal(calls.load, 2);
  component.render();
  assert.equal(button(component.tree, 'Add a semester').props.disabled, true);
  assert.equal(button(component.tree, 'Save term').props.disabled, true);
  assert.equal(button(component.tree, 'Edit').props.disabled, true);
  assert.equal(button(component.tree, 'Delete').props.disabled, true);
  assert.equal(elements(component.tree).find(node => node.type === 'fieldset').props.disabled, true);

  button(component.tree, 'Add a semester').props.onClick();
  button(component.tree, 'Save term').props.onClick();
  button(component.tree, 'Edit').props.onClick();
  button(component.tree, 'Delete').props.onClick();
  input(component.tree, 'gwa-academic-year').props.onChange({ target: { value: 'AY 2040-2041' } });
  component.render();
  assert.equal(input(component.tree, 'gwa-academic-year').props.value, 'AY 2030-2031');
  assert.equal(elements(component.tree).find(node => node.type === 'legend').props.children, 'New academic term');
  assert.deepEqual({ save: calls.save, clear: calls.clear, confirm: calls.confirm }, { save: 0, clear: 0, confirm: 0 });

  component.dispatch('tulongph-data-restored');
  assert.equal(calls.load, 3);
  latest.resolve({ records: [term({ id: 'fresh-term', academicYear: 'AY 2029-2030' })], updatedAt: '2026-10-21T02:00:00.000Z' });
  await flush();
  component.render();
  assert.ok(nodeText(component.tree).includes('AY 2029-2030'), 'newest read updates the tracker');
  delayed.resolve({ records: [term({ id: 'stale-term', academicYear: 'AY 2020-2021' })], updatedAt: '2026-10-21T01:00:00.000Z' });
  await flush();
  component.render();
  assert.ok(nodeText(component.tree).includes('AY 2029-2030'));
  assert.equal(nodeText(component.tree).includes('AY 2020-2021'), false, 'superseded read cannot overwrite fresh data');
});

test('grade normalization covers percentage, 1-to-5, and 4.0 scales', () => {
  assert.equal(normalizeGWAToPercentage(92.5, 'percentage'), 92.5);
  assert.equal(normalizeGWAToPercentage(1, 'one_to_five'), 100);
  assert.equal(normalizeGWAToPercentage(2, 'one_to_five'), 85);
  assert.equal(normalizeGWAToPercentage(2.5, 'one_to_five'), 80);
  assert.equal(normalizeGWAToPercentage(3, 'one_to_five'), 75);
  assert.equal(normalizeGWAToPercentage(5, 'one_to_five'), 0);
  assert.equal(normalizeGWAToPercentage(0, 'four_point'), 0);
  assert.equal(normalizeGWAToPercentage(2, 'four_point'), 78);
  assert.equal(normalizeGWAToPercentage(4, 'four_point'), 100);
  assert.throws(() => normalizeGWAToPercentage(5.1, 'one_to_five'), RangeError);
  assert.throws(() => normalizeGWAToPercentage(-1, 'percentage'), RangeError);
  assert.equal(formatGradeDisplay(2, 'one_to_five'), '2.00 / 5.00');
});

test('retention rules cover every program and the two-point warning bracket', () => {
  const cases = [
    ['ched-cmsp-full', 85, false, 'retained'], ['ched-cmsp-full', 83, false, 'warning'], ['ched-cmsp-full', 82.9, false, 'at_risk'],
    ['ched-cmsp-half', 80, false, 'retained'], ['ched-cmsp-half', 78, false, 'warning'], ['ched-cmsp-half', 77.9, false, 'at_risk'],
    ['dost-sei', 85, false, 'retained'], ['dost-sei', 84, false, 'warning'], ['dost-sei', 85, true, 'at_risk'],
    ['pca-coscho', 80, false, 'retained'], ['pca-coscho', 79, false, 'warning'], ['pca-coscho', 80, true, 'at_risk'],
    ['ched-tes', 80, false, 'retained'], ['lgu-iskolar', 80, false, 'retained'], ['custom', 80, false, 'retained'],
  ];
  for (const [programId, normalizedPercentage, hasFailingGrade, expected] of cases) {
    const result = evaluateRetentionStatus(term({ programId, normalizedPercentage, hasFailingGrade }));
    assert.equal(result.status, expected, `${programId} at ${normalizedPercentage}%`);
  }
  assert.equal(evaluateRetentionStatus(term({ rawGWA: 2, gradingScale: 'one_to_five', normalizedPercentage: 85 })).status, 'retained');
  assert.equal(evaluateRetentionStatus(term({ programId: 'ched-cmsp-half', rawGWA: 2.5, gradingScale: 'one_to_five', normalizedPercentage: 80 })).status, 'retained');

  const explanations = evaluateRetentionStatus(term({ programId: 'dost-sei', normalizedPercentage: 84 })).explanation;
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
    assert.ok(explanations[language].length > 30, `${language} explanation is complete`);
    assert.equal(explanations[language].includes(String.fromCodePoint(0x2014)), false);
  }
});

test('stipend summary totals expected, received, deficit, statuses, and weighted GWA', () => {
  const records = [
    term({ id: 'one', normalizedPercentage: 85, unitsEnrolled: 20, expectedStipend: 20_000, receivedStipend: 10_000, disbursementStatus: 'partial' }),
    term({ id: 'two', normalizedPercentage: 75, unitsEnrolled: 10, expectedStipend: 15_000, receivedStipend: 20_000, disbursementStatus: 'disbursed' }),
    term({ id: 'three', normalizedPercentage: 90, unitsEnrolled: 0, expectedStipend: 5_000, receivedStipend: 0, disbursementStatus: 'pending' }),
  ];
  assert.deepEqual(calculateStipendSummary(records), {
    totalExpected: 40_000, totalReceived: 30_000, totalDeficit: 10_000,
    pendingCount: 1, disbursedCount: 1, partialCount: 1, cumulativeGWA: 81.67,
  });
  assert.equal(calculateStipendSummary([]).cumulativeGWA, 0);
});

test('GWA schema guard rejects inconsistent and unknown backup fields', () => {
  const valid = { records: [term()], updatedAt: '2026-10-21T00:00:00.000Z' };
  assert.equal(isGWATrackerRecord(valid), true);
  assert.equal(isGWATrackerRecord({ ...valid, extra: true }), false);
  assert.equal(isGWATrackerRecord({ ...valid, records: [{ ...valid.records[0], normalizedPercentage: 10 }] }), false);
  assert.equal(isGWATrackerRecord({ ...valid, records: [{ ...valid.records[0], disbursementStatus: 'disbursed' }] }), false);
  assert.equal(isGWATrackerRecord({ ...valid, records: [{ ...valid.records[0], unknown: 'field' }] }), false);
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
  const windowListeners = new Map();
  const module = { exports: {} };
  class BroadcastChannel { postMessage() {} }
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
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) ?? new Set();
      listeners.add(listener);
      windowListeners.set(type, listeners);
    },
    removeEventListener(type, listener) { windowListeners.get(type)?.delete(listener); },
    dispatchEvent(event) {
      for (const listener of windowListeners.get(event.type) ?? []) listener(event);
      return true;
    },
  };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: id => {
      if (id === 'idb-keyval') return idb;
      if (id === './data/phLocations.ts') return {};
      if (id === './gwaTracker') return { isGWATrackerRecord };
      throw new Error(`Unexpected storage import: ${id}`);
    },
    window, localStorage: {
      clear: () => local.clear(), getItem: key => local.get(key) ?? null,
      removeItem: key => local.delete(key), setItem: (key, value) => local.set(key, value),
    },
    sessionStorage: { clear() {} }, BroadcastChannel, Event, crypto: webcrypto, Date, setTimeout, clearTimeout,
  }, { filename: 'storage.ts' });
  return { storage: module.exports, records, local, window };
}

test('GWA tracker storage persists, validates, clears, and survives the privacy-wipe fallback', async () => {
  const { storage, records } = await loadStorage();
  const data = { records: [term()], updatedAt: '2026-10-21T00:00:00.000Z' };
  await storage.saveGWATracker(data);
  assert.deepEqual(await storage.loadGWATracker(), data);
  assert.equal(records.has('tulong_gwa_tracker'), true);
  await storage.clearGWATracker();
  assert.equal(await storage.loadGWATracker(), null);

  await storage.saveGWATracker(data);
  await storage.clearAllUserData();
  assert.equal(records.has('tulong_gwa_tracker'), false);
});

test('ordinary GWA clear does not delete a tracker restored while waiting behind a foreign restore lock', async () => {
  const { storage, records, local, window } = await loadStorage();
  const restored = { records: [term({ id: 'restored-term' })], updatedAt: '2026-10-21T01:00:00.000Z' };
  await storage.saveGWATracker({ records: [term()], updatedAt: '2026-10-21T00:00:00.000Z' });
  local.set('tulongph_restore_lock_session', JSON.stringify({
    sessionId: 'foreign-restore', startedAt: Date.now(), expiresAt: Date.now() + 10_000,
  }));

  const clear = storage.clearGWATracker();
  records.set('tulong_gwa_tracker', restored);
  local.delete('tulongph_restore_lock_session');
  local.set('tulongph_restore_completed_at', String(Date.now() + 100));
  window.dispatchEvent(new Event('tulongph-data-restored'));
  await clear;

  assert.deepEqual(records.get('tulong_gwa_tracker'), restored);
});

test('GWA tracker is explicitly deleted when IndexedDB clear fails during privacy wipe', async () => {
  const { storage, records } = await loadStorage({ failDefaultClear: true });
  await storage.saveGWATracker({ records: [term()], updatedAt: '2026-10-21T00:00:00.000Z' });
  assert.equal(records.has('tulong_gwa_tracker'), true);
  await storage.clearAllUserData();
  assert.equal(records.has('tulong_gwa_tracker'), false);
});

async function loadBackup(storage) {
  const source = await readFile(new URL('../src/lib/encryptedBackup.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText + '\nmodule.exports.__testValidateBundle = validateBundle;';
  const module = { exports: {} };
  const window = { dispatchEvent() {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: id => {
      if (id === '@/lib/storage') return storage;
      if (id === '@/lib/gwaTracker') return { isGWATrackerRecord };
      throw new Error(`Unexpected backup import: ${id}`);
    },
    crypto: webcrypto, Blob, ArrayBuffer, Uint8Array, TextEncoder, TextDecoder, Event, window,
  }, { filename: 'encryptedBackup.ts' });
  return module.exports;
}

const patient = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '', gender: 'other', civilStatus: 'single',
  contactNumber: '', email: '', socioeconomicClass: 'indigent',
  address: { street: '', barangay: '', cityMunicipality: '', province: '', region: '' },
  isSeniorCitizen: false, isPWD: false, is4PsBeneficiary: false, isOFWOrDependent: false,
};
const representative = { isPatientHimself: true, fullName: '', relationshipToPatient: 'Self', contactNumber: '', email: '', validIdType: '', validIdNumber: '' };
const medicalCase = {
  category: 'hospitalization', diagnosis: '', hospitalName: '', hospitalType: 'public_doh', hospitalCity: '', hasMalasakitCenter: false,
  attendingPhysician: '', totalHospitalBill: 0, philhealthDeduction: 0, seniorPwdDiscount: 0, netRemainingBalance: 0,
  neededAssistanceType: 'guarantee_letter',
};

test('encrypted backup validates, exports, restores, and counts the GWA tracker', async () => {
  const tracker = { records: [term()], updatedAt: '2026-10-21T00:00:00.000Z' };
  const stored = { patient, representative, medicalCase, documents: [], applications: [], educationSession: null, workerSession: null, sharedFamilyContext: null, treatmentTracker: null, ofwCaseTracker: null, gwaTracker: tracker };
  let token = null;
  const clone = value => structuredClone(value);
  const storage = {
    loadPatientProfile: async () => clone(stored.patient),
    loadRepresentativeProfile: async () => clone(stored.representative),
    loadMedicalCase: async () => clone(stored.medicalCase),
    loadDocuments: async () => clone(stored.documents),
    loadApplications: async () => clone(stored.applications),
    loadEducationSession: async () => clone(stored.educationSession),
    loadWorkerSession: async () => clone(stored.workerSession),
    loadSharedFamilyContext: async () => clone(stored.sharedFamilyContext),
    loadTreatmentTracker: async () => clone(stored.treatmentTracker),
    loadOFWCaseTracker: async () => clone(stored.ofwCaseTracker),
    loadGWATracker: async () => clone(stored.gwaTracker),
    savePatientProfile: async value => { stored.patient = clone(value); },
    saveRepresentativeProfile: async value => { stored.representative = clone(value); },
    saveMedicalCase: async value => { stored.medicalCase = clone(value); },
    saveDocuments: async value => { stored.documents = clone(value); },
    saveApplications: async value => { stored.applications = clone(value); },
    saveEducationSession: async value => { stored.educationSession = clone(value); },
    saveWorkerSession: async value => { stored.workerSession = clone(value); },
    saveSharedFamilyContext: async value => { stored.sharedFamilyContext = clone(value); },
    saveTreatmentTracker: async value => { stored.treatmentTracker = clone(value); },
    saveOFWCaseTracker: async value => { stored.ofwCaseTracker = clone(value); },
    saveGWATracker: async value => { stored.gwaTracker = clone(value); },
    clearEducationSession: async () => { stored.educationSession = null; },
    clearWorkerSession: async () => { stored.workerSession = null; },
    clearSharedFamilyContext: async () => { stored.sharedFamilyContext = null; },
    clearTreatmentTracker: async () => { stored.treatmentTracker = null; },
    clearOFWCaseTracker: async () => { stored.ofwCaseTracker = null; },
    clearGWATracker: async () => { stored.gwaTracker = null; },
    saveRestoreJournal: async () => {}, clearRestoreJournal: async () => {}, recoverAbandonedRestore: async () => false,
    getWipeGeneration: () => 0, isWipingInProgress: () => false,
    beginBackupRestore: () => { if (token) return null; token = Symbol('restore'); return token; },
    finishBackupRestore: () => { token = null; },
  };
  const backup = await loadBackup(storage);
  const baseBundle = {
    schemaVersion: 1, patient, representative, medicalCase, documents: [], applications: [],
    educationSession: null, workerSession: null, sharedFamilyContext: null, treatmentTracker: null, ofwCaseTracker: null,
  };
  assert.equal(backup.__testValidateBundle({ ...baseBundle, gwaTracker: tracker }).gwaTracker.records.length, 1);
  assert.throws(() => backup.__testValidateBundle({ ...baseBundle, gwaTracker: { ...tracker, records: [{ ...term(), normalizedPercentage: 12 }] } }));

  const blob = await backup.createEncryptedBackup('gwa-password');
  stored.gwaTracker = null;
  const result = await backup.restoreEncryptedBackup(blob, 'gwa-password');
  assert.equal(result.success, true);
  assert.equal(result.itemCount, 4);
  assert.deepEqual(stored.gwaTracker, tracker);
});

test('all touched tracker files contain no em dashes and controls meet mobile sizing rules', async () => {
  const paths = [
    '../src/lib/gwaTracker.ts', '../src/lib/storage.ts', '../src/lib/encryptedBackup.ts',
    '../src/components/education/GWATrackerCard.tsx', '../src/components/education/EducationWizard.tsx',
    '../src/components/education/EducationPrintView.tsx', '../scripts/test-gwa-tracker.mjs', '../package.json',
    '../scripts/test-encrypted-backup.mjs', '../scripts/test-treatment-quota-tracker.mjs',
    '../scripts/test-ofw-case-tracker.mjs', '../.agent-handoff.md',
  ];
  for (const path of paths) {
    const content = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.equal(content.includes(String.fromCodePoint(0x2014)), false, `${path} has no em dash`);
  }
  const card = await readFile(new URL('../src/components/education/GWATrackerCard.tsx', import.meta.url), 'utf8');
  assert.match(card, /autoComplete="off"/);
  assert.match(card, /min-h-\[44px\]/);
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(packageJson.scripts['test:unit'], /scripts\/test-gwa-tracker\.mjs/);
});
