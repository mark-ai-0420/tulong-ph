import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAllUserData,
  clearSharedFamilyContext,
  applySharedFamilyContextToPatient,
  defaultPatientProfile,
  getWorkerBridgeScenario,
  loadSharedFamilyContext,
  mergeEducationSharedContext,
  mergeWorkerSharedContext,
  saveSharedFamilyContext,
} from '../src/lib/storage.ts';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
    has: key => values.has(key),
  };
}

function installBrowserStorage() {
  const local = memoryStorage();
  const session = memoryStorage();
  globalThis.window = { dispatchEvent: () => true };
  globalThis.localStorage = local;
  globalThis.sessionStorage = session;
  return { local, session };
}

test('shared family context saves, loads, and pre-fills medical, education, and worker profiles', async () => {
  const { local } = installBrowserStorage();
  await saveSharedFamilyContext({ province: 'Cavite', region: 'Region IV-A', is4Ps: true, isPWD: true, isOFW: true, isSoloParent: true });
  await saveSharedFamilyContext({ cityMunicipality: 'Indang', barangay: 'Daine I', isSeniorCitizen: true, monthlyIncome: 42000, sourcePillar: 'medical' });

  const context = await loadSharedFamilyContext();
  assert.equal(context.province, 'Cavite');
  assert.equal(context.cityMunicipality, 'Indang');
  assert.equal(context.barangay, 'Daine I');
  assert.equal(context.is4Ps, true);
  assert.equal(context.isPWD, true);
  assert.equal(context.isOFW, true);
  assert.equal(context.isSoloParent, true);
  assert.equal(context.monthlyIncome, 42000);
  assert.equal(context.sourcePillar, 'medical');
  assert.equal(typeof context.updatedAt, 'string');
  assert.ok(local.has('tulongph_shared_family_context'));

  const patient = applySharedFamilyContextToPatient(defaultPatientProfile, context);
  assert.equal(patient.address.province, 'Cavite');
  assert.equal(patient.address.cityMunicipality, 'Indang');
  assert.equal(patient.address.barangay, 'Daine I');
  assert.equal(patient.address.region, 'Region IV-A');
  assert.equal(patient.is4PsBeneficiary, true);
  assert.equal(patient.isPWD, true);
  assert.equal(patient.isOFWOrDependent, true);
  assert.equal(patient.isSoloParent, true);
  assert.equal(patient.isSeniorCitizen, true);
  assert.equal(patient.monthlyHouseholdIncome, 42000);
  assert.equal(applySharedFamilyContextToPatient({ ...patient, monthlyHouseholdIncome: 33000 }, context).monthlyHouseholdIncome, 33000);

  const education = mergeEducationSharedContext({
    province: '', cityMunicipality: '', barangay: '', location: 'NCR', regionalDailyWage: 0, regionalDailyWageManual: false,
    is4PsOrListahanan: false, isPWD: false, isOWWADependent: false, isSoloParentDependent: false,
  }, context);
  assert.equal(education.province, 'Cavite');
  assert.equal(education.cityMunicipality, 'Indang');
  assert.equal(education.barangay, 'Daine I');
  assert.equal(education.location, 'other');
  assert.equal(education.regionalDailyWage, 525);
  assert.equal(education.is4PsOrListahanan, true);
  assert.equal(education.isPWD, true);
  assert.equal(education.isOWWADependent, true);
  assert.equal(education.isSoloParentDependent, true);
  assert.equal(mergeEducationSharedContext({ province: 'Laguna', isPWD: true }, context).province, 'Laguna');

  const worker = mergeWorkerSharedContext({ province: '', cityMunicipality: '', barangay: '', regionalDailyWage: 0, regionalDailyWageManual: false, hasDisabilityOrDependent: false }, context);
  assert.equal(worker.province, 'Cavite');
  assert.equal(worker.cityMunicipality, 'Indang');
  assert.equal(worker.barangay, 'Daine I');
  assert.equal(worker.regionalDailyWage, 525);
  assert.equal(worker.hasDisabilityOrDependent, true);
  assert.equal(mergeWorkerSharedContext({ cityMunicipality: 'Manila' }, context).cityMunicipality, 'Manila');
});

test('sequential handoffs recompute location metadata for education and worker profiles', async () => {
  installBrowserStorage();
  await saveSharedFamilyContext({
    province: 'Metro Manila', cityMunicipality: 'Quezon City', region: 'NCR',
    locationTier: 'NCR', regionalDailyWage: 695, sourcePillar: 'education',
  });
  assert.equal((await loadSharedFamilyContext()).regionalDailyWage, 695);

  await saveSharedFamilyContext({
    province: 'Cavite', cityMunicipality: 'Indang', barangay: 'Daine I', sourcePillar: 'medical',
  });
  const context = await loadSharedFamilyContext();
  assert.equal(context.locationTier, 'other');
  assert.equal(context.regionalDailyWage, 525);

  // Legacy or stale metadata can still be present in a saved handoff; the address is authoritative.
  const staleContext = { ...context, locationTier: 'NCR', regionalDailyWage: 695 };
  const education = mergeEducationSharedContext({
    province: '', cityMunicipality: '', barangay: '', location: 'NCR',
    regionalDailyWage: 695, regionalDailyWageManual: false,
  }, staleContext);
  assert.equal(education.province, 'Cavite');
  assert.equal(education.cityMunicipality, 'Indang');
  assert.equal(education.barangay, 'Daine I');
  assert.equal(education.location, 'other');
  assert.equal(education.regionalDailyWage, 525);

  const worker = mergeWorkerSharedContext({
    province: '', cityMunicipality: '', barangay: '', regionalDailyWage: 695,
    regionalDailyWageManual: false,
  }, staleContext);
  assert.equal(worker.province, 'Cavite');
  assert.equal(worker.cityMunicipality, 'Indang');
  assert.equal(worker.barangay, 'Daine I');
  assert.equal(worker.regionalDailyWage, 525);
});

test('shared addresses never combine an incoming barangay with a different city or province', () => {
  const context = { province: 'Cavite', cityMunicipality: 'Indang', barangay: 'Daine I', locationTier: 'other', regionalDailyWage: 525 };
  const patient = applySharedFamilyContextToPatient({
    ...defaultPatientProfile,
    address: { ...defaultPatientProfile.address, province: 'Metro Manila', cityMunicipality: 'Quezon City', region: 'NCR' },
  }, context);
  assert.equal(patient.address.province, 'Metro Manila');
  assert.equal(patient.address.cityMunicipality, 'Quezon City');
  assert.equal(patient.address.barangay, '');

  const education = mergeEducationSharedContext({ province: 'Metro Manila', cityMunicipality: 'Quezon City', barangay: '', location: 'NCR', regionalDailyWage: 0, regionalDailyWageManual: false }, context);
  assert.equal(education.province, 'Metro Manila');
  assert.equal(education.cityMunicipality, 'Quezon City');
  assert.equal(education.barangay, '');
  assert.equal(education.location, 'NCR');
  assert.equal(education.regionalDailyWage, 0);

  const partial = mergeWorkerSharedContext({ province: '', cityMunicipality: 'Indang', barangay: '', regionalDailyWage: 0 }, context);
  assert.equal(partial.province, 'Cavite');
  assert.equal(partial.cityMunicipality, 'Indang');
  assert.equal(partial.barangay, 'Daine I');

  const orphan = mergeEducationSharedContext({ province: '', cityMunicipality: '', barangay: 'Old barangay', location: 'NCR' }, context);
  assert.equal(orphan.province, 'Cavite');
  assert.equal(orphan.cityMunicipality, 'Indang');
  assert.equal(orphan.barangay, 'Daine I');
});

test('worker bridge query maps only supported funeral and sickness scenarios', () => {
  assert.equal(getWorkerBridgeScenario('?scenario=funeral&bridge=1'), 'funeral');
  assert.equal(getWorkerBridgeScenario('?bridge=1&scenario=sickness'), 'sickness');
  assert.equal(getWorkerBridgeScenario('?scenario=loans&bridge=1'), null);
  assert.equal(getWorkerBridgeScenario(''), null);
});

test('privacy wipe removes shared family context from local storage', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const { default: ts } = await import('typescript');
  const records = new Map();
  const workerRecords = new Map();
  const workerStore = {};
  const recordsFor = store => store === workerStore ? workerRecords : records;
  const idb = {
    createStore: () => workerStore,
    get: async (key, store) => recordsFor(store).get(key),
    set: async (key, value, store) => recordsFor(store).set(key, value),
    del: async (key, store) => recordsFor(store).delete(key),
    clear: async store => recordsFor(store).clear(),
  };
  const source = await readFile(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const storageModule = { exports: {} };
  const local = memoryStorage();
  const session = memoryStorage();
  runInNewContext(code, {
    exports: storageModule.exports,
    require: () => idb,
    window: { addEventListener() {}, dispatchEvent() {} },
    Event,
    localStorage: local,
    sessionStorage: session,
  });
  const storage = storageModule.exports;
  await storage.saveSharedFamilyContext({ province: 'Cavite', is4Ps: true });
  local.setItem('tulong_patient_profile', 'private profile');
  session.setItem('tulong_worker_session', 'private worksheet');
  records.set('tulongph_shared_family_context', { province: 'Cavite' });

  await storage.clearAllUserData();

  assert.equal(await storage.loadSharedFamilyContext(), null);
  assert.equal(local.has('tulongph_shared_family_context'), false);
  assert.equal(local.has('tulong_patient_profile'), false);
  assert.equal(local.getItem('tulong_lang'), 'taglish');
  assert.equal(session.has('tulong_worker_session'), false);
  assert.equal(records.has('tulongph_shared_family_context'), false);
  assert.equal(records.size, 0);
  assert.equal(workerRecords.size, 0);
  await storage.clearSharedFamilyContext();
});
