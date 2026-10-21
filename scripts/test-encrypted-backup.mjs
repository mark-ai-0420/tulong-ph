import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

const header = Buffer.from('TULONGPH_BACKUP_V1', 'ascii');
const patient = {
  firstName: 'Maria', middleName: '', lastName: 'Santos', dateOfBirth: '1980-01-01', gender: 'female',
  civilStatus: 'married', contactNumber: '', email: '',
  address: { street: '', barangay: '', cityMunicipality: 'Manila', province: 'Metro Manila', region: 'NCR' },
  isSeniorCitizen: false, isPWD: false, is4PsBeneficiary: false, isOFWOrDependent: false,
  socioeconomicClass: 'indigent', monthlyHouseholdIncome: 12000,
};
const representative = {
  isPatientHimself: true, fullName: '', relationshipToPatient: 'Self', contactNumber: '', email: '',
  validIdType: 'National ID', validIdNumber: '',
};
const medicalCase = {
  category: 'hospitalization', diagnosis: 'Test diagnosis', hospitalName: 'Test Hospital', hospitalType: 'public_doh',
  hospitalCity: 'Manila', hasMalasakitCenter: true, attendingPhysician: '', totalHospitalBill: 0,
  philhealthDeduction: 0, seniorPwdDiscount: 0, netRemainingBalance: 0, neededAssistanceType: 'guarantee_letter',
};
const documents = [{
  id: 'statement_of_account_1', docType: 'statement_of_account', fileName: 'Statement.pdf',
  originalSize: 100, compressedSize: 80, mimeType: 'application/pdf',
  dataUrl: 'data:application/pdf;base64,AA==', attachmentDataUrl: 'data:image/jpeg;base64,AA==',
  uploadedAt: '2026-01-01T00:00:00.000Z', isCompliantUnder2MB: true,
}];
const educationSession = {
  fullName: 'Ana Santos', schoolName: 'Manila State University', degreeProgram: 'Nursing', cityMunicipality: 'Manila',
  educationLevel: 'college', schoolType: 'suc_luc', location: 'NCR', annualTuitionAndFees: 42000, gwa: 92,
  yearLevel: 2, age: 20, annualHouseholdIncome: 144000, isFilipino: true, schoolParticipates: true,
  firstDegree: true, withinResidencyLimit: true, isIncomingFreshman: false, isExistingEsc: false, hasSHSVoucher: false,
  previousAnnualGrant: 0, voucherCategory: 'none', noLocalSUC: false, priorityCourse: true, dostQualifiedSchool: false,
  isSTEMGraduateOrTop5: false, is4PsOrListahanan: true, isPWD: false, isSoloParentDependent: false,
  isOWWADependent: false, owwaActive: false, ofwMonthlySalaryUSD: 0, isDeceasedOFWDependent: false,
  isCoconutFarmerDependent: false, coconutPriorityCourse: false, isGSISDependent: false, gsisSalaryGrade: 15,
  isTop10PublicHS: false, hasFamilyCrisis: false, hasOtherNationalScholarship: false, hasNC3OrHigher: false,
  trainingDays: 20, regionalDailyWage: 645, regionalDailyWageManual: false, willingReturnService: false,
  selectedPrimaryProgram: 'tes', needsLicensureReimbursement: false,
};
const workerNumbers = [
  'monthlySalary', 'averageMonthlySalaryCredit', 'highestSixMonthlySalaryCredit', 'funeralAverageMonthlySalaryCredit',
  'unemploymentAverageMonthlySalaryCredit', 'contributionMonths', 'recentContributionMonths',
  'qualifyingBenefitContributions', 'unemploymentRecentContributions', 'age', 'pagibigContributionMonths', 'pagibigTAV',
  'pagibigOutstandingLoan', 'sssOutstandingLoan', 'sssCalamityOutstandingLoan', 'loanProratedDays', 'sicknessDays',
  'approvedECMedicalReimbursement', 'gsisNetTakeHomePay', 'gsisOutstandingLoan', 'gsisLoanTermYears',
  'gsisEmergencyOutstanding', 'regionalDailyWage', 'tupadDays', 'unpaidDays', 'monthsWorkedInCurrentYear',
  'unusedServiceIncentiveLeaveDays', 'yearsOfService', 'unpaidOvertimeHours', 'unpaidHolidayDays',
  'disabilityDurationMonths', 'gsisAdvanceInsuranceMonths', 'mp2MonthlyContribution', 'mp2OneTimeDeposit',
  'mp2DividendRatePercent',
];
const workerBooleans = [
  'pagibigRecentContribution', 'ofwSeaBased', 'hadRecentCondonation', 'hasPastDueLoan', 'employerRemittancesCurrent',
  'calamityDeclared', 'employerDifferentialExempt', 'sickLeaveExhausted', 'isWorkRelated', 'hasPermanentDisability',
  'involuntarilySeparated', 'unemploymentClaimWithinThreeYears', 'gsisPermanent', 'gsisEmergencyRenewal',
  'regionalDailyWageManual', 'returnedWithinThreeYears', 'hasDisabilityOrDependent',
];
const workerStrings = [
  'sector', 'scenario', 'payrollSchedule', 'maternityType', 'contingencyDate', 'owwaMembership', 'province',
  'cityMunicipality', 'barangay', 'separationCause', 'pensionType', 'mp2ContributionMode', 'mp2PayoutType',
  'worksheetName', 'worksheetEmployer', 'worksheetEmployerAddress', 'worksheetStartDate', 'worksheetEndDate',
  'worksheetUnpaidDetails', 'worksheetEventDetails', 'worksheetProjectTitle', 'worksheetProposedBudget',
];
const workerSession = {
  ...Object.fromEntries(workerNumbers.map(key => [key, 0])),
  ...Object.fromEntries(workerBooleans.map(key => [key, false])),
  ...Object.fromEntries(workerStrings.map(key => [key, ''])),
  sector: 'private', scenario: 'loans', payrollSchedule: 'six_day_week', maternityType: 'live_birth',
  contingencyDate: '2026-01-10', owwaMembership: 'none', separationCause: 'none', pensionType: 'retirement',
  mp2ContributionMode: 'monthly', mp2PayoutType: 'compounded', monthlySalary: 25000,
  province: 'Metro Manila', cityMunicipality: 'Manila', hasDisabilityOrDependent: true,
  worksheetName: 'Ana Santos', worksheetEmployer: 'Local employer',
};
const sharedFamilyContext = {
  province: 'Metro Manila', cityMunicipality: 'Manila', barangay: 'Ermita', region: 'NCR', locationTier: 'NCR',
  regionalDailyWage: 645, is4Ps: true, isPWD: false, isOFW: false, isSoloParent: false, isSeniorCitizen: false,
  monthlyIncome: 12000, sourcePillar: 'education', updatedAt: '2026-01-10T00:00:00.000Z',
};
const treatmentTracker = {
  category: 'hemodialysis', year: 2026, annualQuota: 156, sessionsCompleted: 42, weeklyCadence: 3,
  glValidUntil: '2026-02-15', entries: [{ id: 'session-1', date: '2026-01-15', facility: 'City Hospital', notes: 'Session note' }],
};
const ofwCaseTracker = {
  id: 'ofw-case-1', ofwName: 'Ana Santos', category: 'sea_based', countryOrVessel: 'MV Example',
  foreignEmployer: 'Example Shipowner', localAgency: 'Example Manning', caseType: 'repatriation',
  contractStatus: 'verified_dmw', owwaStatus: 'active', currentMilestone: 'mwo_case_opened',
  caseNumberDMW: 'DMW-123', caseNumberMWO: 'MWO-456', timeline: [{ id: 'event-1', date: '2026-01-15', milestone: 'reported', title: 'Case reported' }],
  checklist: { passport: true, contract: true, oecOrEreg: false, incidentReportOrEvidence: false, localAgencyLetter: false },
  notes: 'Keep copies of messages.', createdAt: '2026-01-15T00:00:00.000Z', updatedAt: '2026-01-15T00:00:00.000Z',
};

const stored = {
  patient: structuredClone(patient),
  representative: structuredClone(representative),
  medicalCase: structuredClone(medicalCase),
  documents: structuredClone(documents),
  applications: [],
  educationSession: structuredClone(educationSession),
  workerSession: structuredClone(workerSession),
  sharedFamilyContext: structuredClone(sharedFamilyContext),
  treatmentTracker: structuredClone(treatmentTracker),
  ofwCaseTracker: structuredClone(ofwCaseTracker),
  gwaTracker: null,
};
const refreshEvents = [];
const restorationEvents = [];
let patientSaveFailures = 0;
let applicationSaveFailures = 0;
let activeToken = null;
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
  savePatientProfile: async (value, token) => {
    assert.equal(token, activeToken);
    if (patientSaveFailures > 0) {
      patientSaveFailures--;
      throw new Error('Simulated storage failure');
    }
    stored.patient = clone(value);
  },
  saveRepresentativeProfile: async (value, token) => {
    assert.equal(token, activeToken);
    stored.representative = clone(value);
  },
  saveMedicalCase: async (value, token) => {
    assert.equal(token, activeToken);
    stored.medicalCase = clone(value);
  },
  saveDocuments: async (value, _generation, token) => {
    assert.equal(token, activeToken);
    stored.documents = clone(value);
  },
  saveApplications: async (value, token) => {
    assert.equal(token, activeToken);
    if (applicationSaveFailures > 0) {
      applicationSaveFailures--;
      assert.equal(stored.patient.firstName, patient.firstName);
      assert.equal(stored.medicalCase.diagnosis, medicalCase.diagnosis);
      throw new Error('Simulated later-store failure');
    }
    stored.applications = clone(value);
  },
  saveEducationSession: async (value, token) => {
    assert.equal(token, activeToken);
    stored.educationSession = clone(value);
  },
  saveWorkerSession: async (value, token) => {
    assert.equal(token, activeToken);
    stored.workerSession = clone(value);
  },
  saveSharedFamilyContext: async (value, token) => {
    assert.equal(token, activeToken);
    stored.sharedFamilyContext = clone(value);
  },
  saveTreatmentTracker: async (value, token) => {
    assert.equal(token, activeToken);
    stored.treatmentTracker = clone(value);
  },
  saveOFWCaseTracker: async (value, token) => {
    assert.equal(token, activeToken);
    stored.ofwCaseTracker = clone(value);
  },
  saveGWATracker: async (value, token) => {
    assert.equal(token, activeToken);
    stored.gwaTracker = clone(value);
  },
  clearEducationSession: async () => { stored.educationSession = null; },
  clearWorkerSession: async () => { stored.workerSession = null; },
  clearSharedFamilyContext: async () => { stored.sharedFamilyContext = null; },
  clearTreatmentTracker: async token => {
    assert.equal(token, activeToken);
    stored.treatmentTracker = null;
  },
  clearOFWCaseTracker: async token => {
    assert.equal(token, activeToken);
    stored.ofwCaseTracker = null;
  },
  clearGWATracker: async token => {
    assert.equal(token, activeToken);
    stored.gwaTracker = null;
  },
  saveRestoreJournal: async token => { assert.equal(token, activeToken); },
  clearRestoreJournal: async token => { assert.equal(token, activeToken); },
  recoverAbandonedRestore: async () => false,
  getWipeGeneration: () => 0,
  isWipingInProgress: () => false,
  beginBackupRestore: () => {
    if (activeToken !== null) return null;
    restorationEvents.push('restore-started');
    activeToken = Symbol('test-restore-token');
    return activeToken;
  },
  finishBackupRestore: (token, success) => {
    assert.equal(token, activeToken);
    activeToken = null;
    restorationEvents.push(success ? 'restore-complete' : 'restore-failed');
    if (success) refreshEvents.push('tulongph-data-restored');
  },
};

async function encryptPayload(payload, password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const passwordKey = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, passwordKey,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt'],
  );
  const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload)),
  ));
  const output = new Uint8Array(header.length + salt.length + iv.length + ciphertext.length);
  output.set(header, 0);
  output.set(salt, header.length);
  output.set(iv, header.length + salt.length);
  output.set(ciphertext, header.length + salt.length + iv.length);
  return new Blob([output], { type: 'application/octet-stream' });
}

const source = await readFile(new URL('../src/lib/encryptedBackup.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText + '\nmodule.exports.__testValidateBundle = validateBundle;';
function loadBackup(storage, cryptoApi = webcrypto) {
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: id => {
      if (id === '@/lib/storage') return storage;
      if (id === '@/lib/gwaTracker') return { isGWATrackerRecord: () => false };
      throw new Error(`Unexpected import in test: ${id}`);
    },
    crypto: cryptoApi,
    Blob,
    ArrayBuffer,
    Uint8Array,
    TextEncoder,
    TextDecoder,
    Event,
    window: { dispatchEvent: event => { refreshEvents.push(event.type); } },
  });
  vm.runInContext(compiled, context, { filename: 'encryptedBackup.ts' });
  return module.exports;
}
const { createEncryptedBackup, restoreEncryptedBackup, __testValidateBundle } = loadBackup(storage);

function validBackupPayload() {
  return {
    schemaVersion: 1,
    patient: clone(patient),
    representative: clone(representative),
    medicalCase: clone(medicalCase),
    documents: clone(documents),
    applications: [],
    educationSession: clone(educationSession),
    workerSession: clone(workerSession),
    sharedFamilyContext: clone(sharedFamilyContext),
    treatmentTracker: clone(treatmentTracker),
    ofwCaseTracker: clone(ofwCaseTracker),
  };
}

test('encrypted backup roundtrip uses the TulongPH binary header and restores records', async () => {
  const originalPatient = clone(stored.patient);
  const originalEducation = clone(stored.educationSession);
  const originalWorker = clone(stored.workerSession);
  const originalSharedContext = clone(stored.sharedFamilyContext);
  const originalTreatmentTracker = clone(stored.treatmentTracker);
  const originalOFWCaseTracker = clone(stored.ofwCaseTracker);
  const blob = await createEncryptedBackup('case-backup-2026');
  const bytes = Buffer.from(await blob.arrayBuffer());
  assert.deepEqual(bytes.subarray(0, header.length), header);
  assert.ok(bytes.length > header.length + 16 + 12 + 16);

  stored.patient.firstName = 'Changed';
  stored.educationSession.fullName = 'Changed';
  stored.workerSession.monthlySalary = 1;
  stored.sharedFamilyContext.province = 'Changed';
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, true);
  assert.equal(result.itemCount, 9);
  assert.deepEqual(stored.patient, originalPatient);
  assert.deepEqual(stored.documents, documents);
  assert.deepEqual(stored.educationSession, originalEducation);
  assert.deepEqual(stored.workerSession, originalWorker);
  assert.deepEqual(stored.sharedFamilyContext, originalSharedContext);
  assert.deepEqual(stored.treatmentTracker, originalTreatmentTracker);
  assert.deepEqual(stored.ofwCaseTracker, originalOFWCaseTracker);
  assert.deepEqual(refreshEvents, ['tulongph-data-restored']);
  assert.deepEqual(restorationEvents, ['restore-started', 'restore-complete']);
});

test('wrong password rejects without changing stored records', async () => {
  const blob = await createEncryptedBackup('correct-password');
  const originalPatient = clone(stored.patient);
  const result = await restoreEncryptedBackup(blob, 'wrong-password');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'INVALID_PASSWORD_OR_CORRUPTED');
  assert.deepEqual(stored.patient, originalPatient);
});

test('corrupt header and ciphertext return distinct restore error codes', async () => {
  const blob = await createEncryptedBackup('case-backup-2026');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const badHeader = bytes.slice();
  badHeader[0] ^= 0xff;
  const headerResult = await restoreEncryptedBackup(badHeader.buffer, 'case-backup-2026');
  assert.equal(headerResult.success, false);
  if (!headerResult.success) assert.equal(headerResult.code, 'INVALID_FORMAT');

  const badCiphertext = bytes.slice();
  badCiphertext[badCiphertext.length - 1] ^= 0xff;
  const ciphertextResult = await restoreEncryptedBackup(badCiphertext.buffer, 'case-backup-2026');
  assert.equal(ciphertextResult.success, false);
  if (!ciphertextResult.success) assert.equal(ciphertextResult.code, 'INVALID_PASSWORD_OR_CORRUPTED');
});

test('malformed decrypted payload is rejected without changing stored records', async () => {
  const originalPatient = clone(stored.patient);
  const blob = await encryptPayload({
    schemaVersion: 1, patient: null, representative, medicalCase, documents, applications: [],
    educationSession, workerSession, sharedFamilyContext,
  }, 'case-backup-2026');
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'CORRUPTED_PAYLOAD');
  assert.deepEqual(stored.patient, originalPatient);
});

test('malformed treatment tracker data in an otherwise valid backup is rejected', async () => {
  const blob = await encryptPayload({
    schemaVersion: 1, patient, representative, medicalCase, documents, applications: [],
    educationSession, workerSession, sharedFamilyContext, treatmentTracker: { category: 'unknown' },
  }, 'case-backup-2026');
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'CORRUPTED_PAYLOAD');
});

test('malformed OFW case data in an otherwise valid backup is rejected', async () => {
  const blob = await encryptPayload({
    schemaVersion: 1, patient, representative, medicalCase, documents, applications: [],
    educationSession, workerSession, sharedFamilyContext, ofwCaseTracker: { ...ofwCaseTracker, checklist: null },
  }, 'case-backup-2026');
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'CORRUPTED_PAYLOAD');
});

test('invalid OFW contribution values throw a data format error and reject encrypted backups', async () => {
  assert.doesNotThrow(() => __testValidateBundle(validBackupPayload()));
  for (const contributions of [undefined, 'single', 'multiple']) {
    const payload = validBackupPayload();
    payload.ofwCaseTracker.owwaContributions = contributions;
    assert.doesNotThrow(() => __testValidateBundle(payload));
  }

  for (const contributions of ['unknown', null, {}, { toString: 'invalid' }, []]) {
    const payload = validBackupPayload();
    payload.ofwCaseTracker.owwaContributions = contributions;
    assert.throws(() => __testValidateBundle(payload), /invalid or unsupported data format/);
  }

  const malformedPayload = validBackupPayload();
  malformedPayload.ofwCaseTracker.owwaContributions = { toString: 'invalid' };
  const blob = await encryptPayload(malformedPayload, 'case-backup-2026');
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'CORRUPTED_PAYLOAD');
});

test('persistence failure reports successful rollback and preserves previous records', async () => {
  const blob = await createEncryptedBackup('case-backup-2026');
  stored.patient.firstName = 'Existing local record';
  const previousPatient = clone(stored.patient);
  patientSaveFailures = 1;
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'RESTORE_FAILED_ROLLBACK_SUCCEEDED');
  assert.deepEqual(stored.patient, previousPatient);
});

test('later-store failure rolls earlier writes back to the complete original snapshot', async () => {
  const beforeTest = clone(stored);
  const blob = await encryptPayload({
    schemaVersion: 1, patient, representative, medicalCase, documents, applications: [],
    educationSession, workerSession, sharedFamilyContext,
  }, 'case-backup-2026');
  stored.patient.firstName = 'Original local patient';
  stored.representative.fullName = 'Original local representative';
  stored.medicalCase.diagnosis = 'Original local diagnosis';
  stored.documents = [];
  stored.applications = [{ id: 'original-local-application' }];
  const snapshot = clone(stored);
  applicationSaveFailures = 1;
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  assert.equal(result.code, 'RESTORE_FAILED_ROLLBACK_SUCCEEDED');
  assert.deepEqual(stored, snapshot);
  Object.assign(stored, beforeTest);
});

test('rollback failure reports that previous records could not be recovered', async () => {
  const blob = await createEncryptedBackup('case-backup-2026');
  const previousPatient = clone(stored.patient);
  patientSaveFailures = 2;
  const result = await restoreEncryptedBackup(blob, 'case-backup-2026');
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.code, 'RESTORE_FAILED_ROLLBACK_FAILED');
  assert.deepEqual(stored.patient, previousPatient);
});

test('backup and vault source contain no em dashes and keep accessible controls', async () => {
  const paths = [
    '../src/lib/encryptedBackup.ts', '../src/components/DocumentVault.tsx',
    '../src/components/Navbar.tsx', '../src/lib/storage.ts',
  ];
  for (const path of paths) {
    const sourceText = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.ok(!sourceText.includes('\u2014'), `${path} must not contain em dashes`);
  }
  const component = await readFile(new URL('../src/components/DocumentVault.tsx', import.meta.url), 'utf8');
  const storage = await readFile(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
  assert.match(component, /autoComplete="off"/);
  assert.match(component, /min-h-\[44px\]/);
  assert.match(component, /Babala: Gamitin lamang ito sa inyong personal na cellphone o computer\./);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) assert.match(component, new RegExp(`${language}: \\{`));
  assert.match(storage, /new BroadcastChannel\('tulongph-backup'\)/);
  for (const path of ['../src/app/page.tsx', '../src/app/edukasyon/page.tsx', '../src/app/manggagawa/page.tsx']) {
    const page = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(page, /tulongph-data-restored/);
  }
});

async function loadStorage({ beforeSet = async () => {}, beforeClear = async () => {}, afterSet = async () => {}, afterClear = async () => {}, startedAt = Date.now(), sessionId, local = new Map(), records = new Map(), workerRecords = records } = {}) {
  const source = await readFile(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let now = startedAt;
  const channels = new Map();
  const listeners = new Map();
  const eventTarget = new EventTarget();
  const timers = new Map();
  const messages = [];
  const events = [];
  const writes = [];
  const module = { exports: {} };
  const workerStore = {};
  const recordsFor = store => store === workerStore ? workerRecords : records;
  const idb = {
    createStore: () => workerStore, get: async (key, store) => recordsFor(store).get(key),
    set: async (key, value, store) => { await beforeSet(key); recordsFor(store).set(key, value); writes.push(key); await afterSet(key); },
    del: async (key, store) => { recordsFor(store).delete(key); },
    clear: async store => { await beforeClear(store); recordsFor(store).clear(); await afterClear(); },
  };
  class BroadcastChannel {
    constructor(name) { channels.set(name, this); }
    postMessage(message) { messages.push(message); }
  }
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: id => {
      if (id === 'idb-keyval') return idb;
      if (id === './data/phLocations.ts') return {};
      if (id === './gwaTracker') return { isGWATrackerRecord: () => false };
      throw new Error(`Unexpected import: ${id}`);
    },
    window: {
      BroadcastChannel,
      addEventListener(type, listener) { listeners.set(type, listener); eventTarget.addEventListener(type, listener); },
      removeEventListener: (type, listener) => eventTarget.removeEventListener(type, listener),
      dispatchEvent(event) { events.push(event.type); eventTarget.dispatchEvent(event); },
    },
    setTimeout(callback, delay) { const id = Symbol(); timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    BroadcastChannel, Event, crypto: { randomUUID: () => sessionId ?? webcrypto.randomUUID() },
    Date: class extends Date { static now() { return now; } },
    sessionStorage: { clear() {} },
    localStorage: {
      clear: () => local.clear(),
      removeItem: key => local.delete(key),
      getItem: key => local.get(key) ?? null,
      setItem: (key, value) => local.set(key, value),
    },
  });
  return { storage: module.exports, records, local, channels, messages, events, writes, listeners, timers, setNow: value => {
    now = value;
    for (const [id, timer] of timers) {
      if (timer.at <= now) { timers.delete(id); timer.callback(); }
    }
  } };
}

test('storage restore capability blocks ordinary, foreign and stale writes and synchronizes receiving tabs', async () => {
  const { storage, records, local, channels, messages, setNow } = await loadStorage({ startedAt: 1000 });
  const writers = [
    [value => storage.savePatientProfile(value), (value, token) => storage.savePatientProfile(value, token), () => records.get('tulong_patient_profile'), patient],
    [value => storage.saveRepresentativeProfile(value), (value, token) => storage.saveRepresentativeProfile(value, token), () => records.get('tulong_representative_profile'), representative],
    [value => storage.saveMedicalCase(value), (value, token) => storage.saveMedicalCase(value, token), () => records.get('tulong_medical_case'), medicalCase],
    [value => storage.saveDocuments(value), (value, token) => storage.saveDocuments(value, undefined, token), () => records.get('tulong_documents'), documents],
    [value => storage.saveApplications(value), (value, token) => storage.saveApplications(value, token), () => records.get('tulong_applications'), []],
    [value => storage.saveEducationSession(value), (value, token) => storage.saveEducationSession(value, token), () => JSON.parse(local.get('tulongph_education_session')), educationSession],
    [value => storage.saveWorkerSession(value), (value, token) => storage.saveWorkerSession(value, token), () => records.get('tulongph_worker_session'), workerSession],
    [value => storage.saveSharedFamilyContext(value), (value, token) => storage.saveSharedFamilyContext(value, token), () => JSON.parse(local.get('tulongph_shared_family_context')), sharedFamilyContext],
  ];
  const token = storage.beginBackupRestore();
  assert.equal(typeof token, 'symbol');
  assert.equal(storage.beginBackupRestore(), null);
  const startMessage = messages.at(-1);
  assert.equal(startMessage.type, 'restore-start');
  assert.equal(typeof startMessage.startedAt, 'number');
  assert.match(startMessage.sessionId, /^[0-9a-f-]{36}$/);
  channels.get('tulongph-backup').onmessage({ data: startMessage });
  for (const [ordinary, authorized, , value] of writers) {
    await ordinary(value);
    await authorized(value, Symbol('foreign'));
    assert.equal(records.size + [...local.keys()].filter(key => !key.startsWith('tulongph_restore_')).length, 0);
  }
  storage.finishBackupRestore(Symbol('foreign'), true);
  await storage.saveApplications([{ id: 'blocked' }]);
  assert.equal(records.size, 0);
  for (const [, authorized, read, value] of writers) {
    await authorized(value, token);
    assert.ok(read());
  }
  storage.finishBackupRestore(token, true);
  await storage.saveApplications([{ id: 'after-restore' }]);
  assert.equal(records.get('tulong_applications')[0].id, 'after-restore');
  const nextToken = storage.beginBackupRestore();
  await storage.saveApplications([{ id: 'stale-token' }], token);
  assert.equal(records.get('tulong_applications')[0].id, 'after-restore');
  storage.finishBackupRestore(token, true);
  await storage.saveApplications([{ id: 'still-locked' }]);
  assert.equal(records.get('tulong_applications')[0].id, 'after-restore');
  storage.finishBackupRestore(nextToken, false);
  const channel = channels.get('tulongph-backup');
  let nextStartedAt = 2000;
  for (const [completion, sessionScoped] of [
    ['restore-complete', false], ['restore-failed', false],
    ['restore-complete', true], ['restore-failed', true],
  ]) {
    setNow(nextStartedAt);
    nextStartedAt += 100;
    const canceledToken = storage.beginBackupRestore();
    const sessionId = webcrypto.randomUUID();
    channel.onmessage({ data: { type: 'restore-start', sessionId, startedAt: nextStartedAt - 101 } });
    assert.equal(storage.beginBackupRestore(), null);
    await storage.saveApplications([{ id: 'remote-blocked' }], canceledToken);
    assert.equal(records.get('tulong_applications')[0].id, 'after-restore');
    const generation = storage.getWipeGeneration();
    local.delete('tulongph_restore_lock_session'); // The simulated remote owner releases its persistent lock.
    channel.onmessage({ data: sessionScoped ? { type: completion, sessionId } : completion });
    assert.ok(storage.getWipeGeneration() > generation);
    storage.finishBackupRestore(canceledToken, false);
    await storage.saveApplications([{ id: 'after-restore' }]);
    assert.equal(records.get('tulong_applications')[0].id, 'after-restore');
  }
});

test('ordinary treatment and OFW saves waiting behind restore do not overwrite restored records', async () => {
  const local = new Map();
  const records = new Map([
    ['tulong_treatment_tracker', clone(treatmentTracker)],
    ['tulong_ofw_case_tracker', clone(ofwCaseTracker)],
  ]);
  const writer = await loadStorage({ local, records });
  const restorer = await loadStorage({ local, records });
  await writer.storage.loadTreatmentTracker();
  await writer.storage.loadOFWCaseTracker();

  const token = restorer.storage.beginBackupRestore();
  writer.channels.get('tulongph-backup').onmessage({ data: restorer.messages.at(-1) });
  const pendingTreatmentSave = writer.storage.saveTreatmentTracker({ ...treatmentTracker, sessionsCompleted: 1 });
  const pendingOFWSave = writer.storage.saveOFWCaseTracker({ ...ofwCaseTracker, ofwName: 'Stale ordinary save' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writer.timers.size, 1, 'ordinary saves wait for the shared restore lock');

  const restoredTreatment = { ...treatmentTracker, sessionsCompleted: 99 };
  const restoredOFW = { ...ofwCaseTracker, ofwName: 'Restored OFW record' };
  await restorer.storage.saveTreatmentTracker(restoredTreatment, token);
  await restorer.storage.saveOFWCaseTracker(restoredOFW, token);
  restorer.storage.finishBackupRestore(token, true);
  writer.channels.get('tulongph-backup').onmessage({ data: restorer.messages.at(-1) });

  await Promise.all([pendingTreatmentSave, pendingOFWSave]);
  assert.deepEqual(records.get('tulong_treatment_tracker'), restoredTreatment);
  assert.deepEqual(records.get('tulong_ofw_case_tracker'), restoredOFW);
});

test('ordinary treatment and OFW saves survive restore completion without BroadcastChannel delivery', async () => {
  const local = new Map();
  const records = new Map([
    ['tulong_treatment_tracker', clone(treatmentTracker)],
    ['tulong_ofw_case_tracker', clone(ofwCaseTracker)],
  ]);
  const writer = await loadStorage({ local, records, startedAt: 1000 });
  const restorer = await loadStorage({ local, records, startedAt: 1000 });
  await writer.storage.loadTreatmentTracker();
  await writer.storage.loadOFWCaseTracker();

  const token = restorer.storage.beginBackupRestore();
  const pendingTreatmentSave = writer.storage.saveTreatmentTracker({ ...treatmentTracker, sessionsCompleted: 1 });
  const pendingOFWSave = writer.storage.saveOFWCaseTracker({ ...ofwCaseTracker, ofwName: 'Stale ordinary save' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writer.timers.size, 1, 'ordinary saves wait behind the persistent restore lease');
  assert.equal(writer.messages.length, 0, 'no restore messages are delivered to the waiting tab');

  const restoredTreatment = { ...treatmentTracker, sessionsCompleted: 99 };
  const restoredOFW = { ...ofwCaseTracker, ofwName: 'Restored OFW record' };
  await restorer.storage.saveTreatmentTracker(restoredTreatment, token);
  await restorer.storage.saveOFWCaseTracker(restoredOFW, token);
  restorer.storage.finishBackupRestore(token, true);

  // Poll past the expired lease; the writer has received no broadcast.
  writer.setNow(16000);
  await Promise.all([pendingTreatmentSave, pendingOFWSave]);
  assert.deepEqual(records.get('tulong_treatment_tracker'), restoredTreatment);
  assert.deepEqual(records.get('tulong_ofw_case_tracker'), restoredOFW);
});

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

for (const [timeA, timeB, winnerIndex] of [[100, 101, 0], [101, 100, 1], [100, 100, 0]]) {
  for (const reverseDelivery of [false, true]) {
    test(`simultaneous restores elect one winner and unlock both tabs (${timeA}/${timeB}, reverse=${reverseDelivery})`, async () => {
      const tabs = await Promise.all([
        loadStorage({ startedAt: timeA, sessionId: '00000000-0000-4000-8000-000000000001' }),
        loadStorage({ startedAt: timeB, sessionId: '00000000-0000-4000-8000-000000000002' }),
      ]);
      const tokens = tabs.map(tab => tab.storage.beginBackupRestore());
      assert.ok(tokens.every(token => typeof token === 'symbol'));
      const starts = tabs.map(tab => tab.messages.at(-1));
      for (const index of reverseDelivery ? [1, 0] : [0, 1]) {
        tabs[index].channels.get('tulongph-backup').onmessage({ data: starts[1 - index] });
      }
      const winner = tabs[winnerIndex];
      const loserIndex = 1 - winnerIndex;
      const loser = tabs[loserIndex];
      for (const [index, tab] of tabs.entries()) {
        await tab.storage.savePatientProfile(patient, tokens[index]);
      }
      assert.equal(tabs.filter(tab => tab.records.has('tulong_patient_profile')).length, 1);
      assert.equal(winner.records.get('tulong_patient_profile').firstName, patient.firstName);
      loser.storage.finishBackupRestore(tokens[loserIndex], false);
      assert.equal(loser.messages.length, 2, 'loser only broadcasts its start and forfeiture');
      assert.deepEqual({ ...loser.messages.at(-1) }, { type: 'restore-forfeited', sessionId: starts[loserIndex].sessionId });
      const blob = await encryptPayload({
        schemaVersion: 1, patient, representative, medicalCase, documents, applications: [],
        educationSession, workerSession, sharedFamilyContext,
      }, 'simultaneous-restore');
      const rejected = await loadBackup(loser.storage).restoreEncryptedBackup(blob, 'simultaneous-restore');
      assert.equal(rejected.code, 'RESTORE_LOCK_BUSY');
      for (const tab of tabs) {
        const generation = tab.storage.getWipeGeneration();
        tab.channels.get('tulongph-backup').onmessage({
          data: { type: 'restore-complete', sessionId: starts[loserIndex].sessionId },
        });
        assert.equal(tab.storage.getWipeGeneration(), generation, 'stale finish cannot unlock the winning session');
        assert.equal(tab.storage.beginBackupRestore(), null);
      }
      winner.storage.finishBackupRestore(tokens[winnerIndex], true);
      const completion = winner.messages.at(-1);
      assert.deepEqual({ ...completion }, { type: 'restore-complete', sessionId: starts[winnerIndex].sessionId, completedAt: [timeA, timeB][winnerIndex] });
      // These broadcast-order fixtures use isolated maps; mirror the winner's shared-storage changes.
      loser.local.delete('tulongph_restore_lock_session');
      loser.local.set('tulongph_restore_completed_at', String(completion.completedAt));
      loser.channels.get('tulongph-backup').onmessage({ data: completion });
      for (const tab of tabs) {
        await tab.storage.saveApplications([{ id: 'unlocked' }]);
        assert.equal(tab.records.get('tulong_applications')[0].id, 'unlocked');
        const next = tab.storage.beginBackupRestore();
        assert.equal(typeof next, 'symbol', 'both tabs can restore again without deadlock');
        tab.storage.finishBackupRestore(next, false);
      }
    });
  }
}

for (const success of [true, false]) {
  test(`completion watermark rejects delayed starts and allows future restores (success=${success})`, async () => {
    const local = new Map();
    const winner = await loadStorage({ local, startedAt: 100, sessionId: 'winner' });
    const receiver = await loadStorage({ local, startedAt: 101, sessionId: 'receiver' });
    const token = winner.storage.beginBackupRestore();
    const channel = receiver.channels.get('tulongph-backup');
    channel.onmessage({ data: winner.messages.at(-1) });
    winner.setNow(500);
    winner.storage.finishBackupRestore(token, success);
    const completion = winner.messages.at(-1);
    assert.deepEqual({ ...completion }, {
      type: success ? 'restore-complete' : 'restore-failed', sessionId: 'winner', completedAt: 500,
    });
    channel.onmessage({ data: completion });
    for (const tab of [winner, receiver]) {
      const backup = tab.channels.get('tulongph-backup');
      const generation = tab.storage.getWipeGeneration();
      for (const startedAt of [101, 500]) {
        backup.onmessage({ data: { type: 'restore-start', sessionId: 'delayed-loser', startedAt } });
      }
      assert.equal(tab.storage.getWipeGeneration(), generation, 'obsolete starts do not invalidate storage');
      await tab.storage.saveApplications([{ id: 'ordinary-save' }]);
      assert.equal(tab.records.get('tulong_applications')[0].id, 'ordinary-save');
    }
    winner.setNow(600);
    const freshToken = winner.storage.beginBackupRestore();
    assert.equal(typeof freshToken, 'symbol');
    channel.onmessage({ data: winner.messages.at(-1) });
    const pendingSave = receiver.storage.saveApplications([{ id: 'blocked' }]);
    assert.equal(receiver.records.get('tulong_applications')[0].id, 'ordinary-save');
    await winner.storage.saveApplications([{ id: 'fresh-restore' }], freshToken);
    assert.equal(winner.records.get('tulong_applications')[0].id, 'fresh-restore');
    winner.setNow(700);
    winner.storage.finishBackupRestore(freshToken, true);
    channel.onmessage({ data: winner.messages.at(-1) });
    await pendingSave;
    await receiver.storage.saveApplications([{ id: 'after-fresh-restore' }]);
    assert.equal(receiver.records.get('tulong_applications')[0].id, 'after-fresh-restore');
  });
}

test('concurrent restore is rejected with RESTORE_LOCK_BUSY without disturbing the active restore', async () => {
  const entered = deferred();
  const resume = deferred();
  const { storage, records } = await loadStorage({
    afterSet: async key => {
      if (key === 'tulong_patient_profile') { entered.resolve(); await resume.promise; }
    },
  });
  const backup = loadBackup(storage);
  const blob = await encryptPayload({
    schemaVersion: 1, patient, representative, medicalCase, documents, applications: [],
    educationSession, workerSession, sharedFamilyContext,
  }, 'concurrent-restore');
  const first = backup.restoreEncryptedBackup(blob, 'concurrent-restore');
  await entered.promise;
  try {
    const second = await backup.restoreEncryptedBackup(blob, 'concurrent-restore');
    assert.equal(second.success, false);
    assert.equal(second.code, 'RESTORE_LOCK_BUSY');
  } finally {
    resume.resolve();
  }
  assert.equal((await first).success, true);
  assert.equal(records.get('tulong_patient_profile').firstName, patient.firstName);
});

for (const completedWipe of [false, true]) {
  test(`privacy wipe ${completedWipe ? 'completed' : 'in progress'} during restore aborts without rollback and leaves storage clean`, async () => {
    const entered = deferred();
    const resume = deferred();
    const resumeWipe = deferred();
    const { storage, records, local, writes } = await loadStorage({
      afterSet: async key => {
        if (key === 'tulong_patient_profile') { entered.resolve(); await resume.promise; }
      },
      afterClear: () => completedWipe ? Promise.resolve() : resumeWipe.promise,
    });
    records.set('tulong_patient_profile', { ...patient, firstName: 'Previous private record' });
    local.set('tulongph_education_session', JSON.stringify(educationSession));
    const backup = loadBackup(storage);
    const blob = await encryptPayload({
      schemaVersion: 1, patient, representative, medicalCase, documents, applications: [],
      educationSession, workerSession, sharedFamilyContext,
    }, 'wipe-precedence');
    const restoring = backup.restoreEncryptedBackup(blob, 'wipe-precedence');
    await entered.promise;
    const wiping = storage.clearAllUserData();
    assert.equal(storage.isWipingInProgress(), true);
    assert.equal(storage.beginBackupRestore(), null);
    if (completedWipe) {
      await wiping;
      assert.equal(storage.isWipingInProgress(), false);
    }
    resume.resolve();
    let result;
    try { result = await restoring; }
    finally { resumeWipe.resolve(); await wiping; }
    assert.equal(result.success, false);
    assert.equal(result.code, 'RESTORE_ABORTED_BY_WIPE');
    assert.match(writes[0], /^tulongph_restore_journal_/);
    assert.deepEqual(writes.slice(1), ['tulong_patient_profile'], 'no later writes or rollback may run');
    assert.equal(records.size, 0);
    assert.deepEqual([...local], [['tulong_lang', 'taglish']]);
    const freshToken = storage.beginBackupRestore();
    assert.equal(typeof freshToken, 'symbol', 'wipe must cancel the old restore lock');
    storage.finishBackupRestore(freshToken, false);
  });
}


for (const completedWipe of [false, true]) {
  test(`wipe during decryption aborts before any writes (completed=${completedWipe})`, async () => {
    const entered = deferred();
    const resume = deferred();
    const resumeWipe = deferred();
    const { storage, records, local, writes, messages } = await loadStorage({
      afterClear: () => completedWipe ? Promise.resolve() : resumeWipe.promise,
    });
    const cryptoApi = {
      subtle: new Proxy(webcrypto.subtle, {
        get(target, key) {
          if (key === 'decrypt') return async (...args) => {
            entered.resolve();
            await resume.promise;
            return target.decrypt(...args);
          };
          const value = Reflect.get(target, key);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      }),
    };
    const backup = loadBackup(storage, cryptoApi);
    const blob = await encryptPayload({ schemaVersion: 1, ...stored }, 'decrypt-wipe');
    const restoring = backup.restoreEncryptedBackup(blob, 'decrypt-wipe');
    await entered.promise;
    const wiping = storage.clearAllUserData();
    if (completedWipe) await wiping;
    else {
      const blocked = await backup.restoreEncryptedBackup(blob, 'decrypt-wipe');
      assert.equal(blocked.code, 'RESTORE_ABORTED_BY_WIPE', 'an existing wipe aborts immediately');
    }
    resume.resolve();
    let result;
    try { result = await restoring; }
    finally { resumeWipe.resolve(); await wiping; }
    assert.equal(result.code, 'RESTORE_ABORTED_BY_WIPE');
    assert.deepEqual(writes, []);
    assert.equal(records.size, 0);
    assert.deepEqual([...local], [['tulong_lang', 'taglish']]);
    assert.ok(!messages.some(message => message.type === 'restore-start'));
  });
}

test('shared persistent lock rejects a second tab without broadcast delivery', async () => {
  const local = new Map();
  const first = await loadStorage({ local });
  const second = await loadStorage({ local });
  const token = first.storage.beginBackupRestore();
  assert.equal(typeof token, 'symbol');
  assert.equal(second.storage.beginBackupRestore(), null);
  const pendingSave = second.storage.saveApplications([{ id: 'after-restore' }]);
  assert.equal(second.writes.length, 0);
  first.storage.finishBackupRestore(token, true);
  second.setNow(Date.now() + 15001);
  await pendingSave;
  assert.equal(local.has('tulongph_restore_lock_session'), false);
  assert.equal(typeof second.storage.beginBackupRestore(), 'symbol');
});

test('delayed loser cannot overwrite shared storage after winner completes without broadcasts', async () => {
  const local = new Map();
  const records = new Map();
  const loser = await loadStorage({ local, records, startedAt: 100, sessionId: 'loser' });
  const winner = await loadStorage({ local, records, startedAt: 101, sessionId: 'winner' });
  const loserToken = loser.storage.beginBackupRestore();
  // Model two tabs that both observed an empty lock before either published its start.
  local.delete('tulongph_restore_lock_session');
  const winnerToken = winner.storage.beginBackupRestore();
  await winner.storage.saveApplications([{ id: 'winner' }], winnerToken);
  winner.setNow(500);
  winner.storage.finishBackupRestore(winnerToken, true);
  const generation = loser.storage.getWipeGeneration();
  await loser.storage.saveApplications([{ id: 'loser' }], loserToken);
  await loser.storage.saveEducationSession(educationSession, loserToken);
  assert.equal(records.get('tulong_applications')[0].id, 'winner');
  assert.equal(local.has('tulongph_education_session'), false);
  assert.equal(loser.writes.length, 0);
  assert.ok(loser.storage.getWipeGeneration() > generation, 'pending bundle must abort without rollback');
  loser.storage.finishBackupRestore(loserToken, false);
  assert.equal(local.get('tulongph_restore_completed_at'), '500');
  await loser.storage.saveApplications([{ id: 'ordinary-after-winner' }]);
  assert.equal(records.get('tulong_applications')[0].id, 'ordinary-after-winner');
  const freshToken = loser.storage.beginBackupRestore();
  assert.equal(typeof freshToken, 'symbol');
  await loser.storage.saveApplications([{ id: 'fresh-restore' }], freshToken);
  assert.equal(records.get('tulong_applications')[0].id, 'fresh-restore');
  loser.storage.finishBackupRestore(freshToken, true);
});

test('local restore start strictly exceeds local and persistent completion watermarks', async () => {
  const local = new Map();
  const tab = await loadStorage({ local, startedAt: 100 });
  const token = tab.storage.beginBackupRestore();
  tab.setNow(500);
  tab.storage.finishBackupRestore(token, true);
  for (const now of [500, 100]) {
    tab.setNow(now);
    const next = tab.storage.beginBackupRestore();
    const start = tab.messages.at(-1).startedAt;
    assert.ok(start > Number(local.get('tulongph_restore_completed_at')));
    tab.storage.finishBackupRestore(next, true);
    assert.ok(Number(local.get('tulongph_restore_completed_at')) >= start);
  }
  const reloaded = await loadStorage({ local, startedAt: 100 });
  const completedAt = Number(local.get('tulongph_restore_completed_at'));
  assert.equal(typeof reloaded.storage.beginBackupRestore(), 'symbol');
  assert.ok(reloaded.messages.at(-1).startedAt > completedAt);
});


for (const lock of [
  JSON.stringify({ sessionId: 'abandoned', startedAt: 100, expiresAt: 15100 }),
  JSON.stringify({ sessionId: 'legacy-abandoned', startedAt: 100 }),
  '{malformed', JSON.stringify({ sessionId: 'bad', startedAt: '100' }),
]) {
  test(`abandoned or malformed lock is reclaimed: ${lock}`, async () => {
    const tab = await loadStorage({ startedAt: 15099 });
    tab.local.set('tulongph_restore_lock_session', lock);
    let pendingSave;
    if (lock.includes('abandoned')) {
      pendingSave = tab.storage.saveApplications([{ id: 'blocked' }]);
      assert.equal(tab.records.size, 0);
      assert.equal(tab.storage.beginBackupRestore(), null);
    }
    tab.setNow(15100);
    await pendingSave;
    await tab.storage.saveApplications([{ id: 'ordinary' }]);
    assert.equal(tab.records.get('tulong_applications')[0].id, 'ordinary');
    assert.equal(tab.local.has('tulongph_restore_lock_session'), false);
    const token = tab.storage.beginBackupRestore();
    assert.equal(typeof token, 'symbol');
    tab.storage.finishBackupRestore(token, true);
  });
}

test('beforeunload releases only the unloading tab own lease', async () => {
  const tab = await loadStorage({ startedAt: 100, sessionId: 'owner' });
  tab.storage.beginBackupRestore();
  tab.listeners.get('beforeunload')();
  assert.equal(tab.local.has('tulongph_restore_lock_session'), false);
  const foreign = JSON.stringify({ sessionId: 'foreign', startedAt: 100, expiresAt: 15100 });
  tab.local.set('tulongph_restore_lock_session', foreign);
  tab.listeners.get('beforeunload')();
  assert.equal(tab.local.get('tulongph_restore_lock_session'), foreign);
});

for (const optionalRecords of [true, false]) {
  test(`durable journal recovers an interrupted restore after reload (optional=${optionalRecords})`, async () => {
    const local = new Map();
    const records = new Map();
    const workerRecords = new Map();
    const original = await loadStorage({ local, records, workerRecords, startedAt: 100, sessionId: 'crashed' });
    const snapshot = {
      schemaVersion: 1, patient, representative, medicalCase, documents, applications: [{ id: 'previous' }],
      educationSession: optionalRecords ? educationSession : null,
      workerSession: optionalRecords ? workerSession : null,
      sharedFamilyContext: optionalRecords ? sharedFamilyContext : null,
      ofwCaseTracker: optionalRecords ? ofwCaseTracker : null,
    };
    const token = original.storage.beginBackupRestore();
    await original.storage.saveRestoreJournal(token, snapshot);
    await original.storage.savePatientProfile({ ...patient, firstName: 'Partial replacement' }, token);
    local.set('tulongph_education_session', '{}');
    local.set('tulongph_shared_family_context', '{}');
    workerRecords.set('tulongph_worker_session', { partial: true });
    records.set('tulong_ofw_case_tracker', { partial: true });
    const reloaded = await loadStorage({ local, records, workerRecords, startedAt: 15099 });
    assert.equal(await reloaded.storage.recoverAbandonedRestore(), false, 'a live lease protects the journal');
    reloaded.setNow(15100);
    assert.equal(await reloaded.storage.recoverAbandonedRestore(), true);
    for (const [key, value] of [
      ['tulong_patient_profile', patient], ['tulong_representative_profile', representative],
      ['tulong_medical_case', medicalCase], ['tulong_documents', documents],
      ['tulong_applications', snapshot.applications],
    ]) assert.deepEqual(records.get(key), value);
    assert.deepEqual(records.get('tulong_ofw_case_tracker') ?? null, snapshot.ofwCaseTracker);
    assert.deepEqual(workerRecords.get('tulongph_worker_session') ?? null, snapshot.workerSession);
    assert.deepEqual(JSON.parse(local.get('tulongph_education_session') ?? 'null'), snapshot.educationSession);
    assert.deepEqual(JSON.parse(local.get('tulongph_shared_family_context') ?? 'null'), snapshot.sharedFamilyContext);
    assert.equal(records.has('tulongph_restore_journal'), false);
    assert.equal(local.has('tulongph_restore_lock_session'), false);
    assert.equal(await reloaded.storage.recoverAbandonedRestore(), false);
    await reloaded.storage.saveApplications([{ id: 'after-recovery' }]);
    assert.equal(records.get('tulong_applications')[0].id, 'after-recovery');
    assert.equal(typeof reloaded.storage.beginBackupRestore(), 'symbol');
  });
}

test('election loser yields its persistent lock to the winner', async () => {
  const tab = await loadStorage({ startedAt: 200, sessionId: 'loser' });
  const token = tab.storage.beginBackupRestore();
  tab.channels.get('tulongph-backup').onmessage({ data: { type: 'restore-start', sessionId: 'winner', startedAt: 100 } });
  assert.deepEqual(JSON.parse(tab.local.get('tulongph_restore_lock_session')), { sessionId: 'winner', startedAt: 100, expiresAt: 15100 });
  await tab.storage.saveApplications([{ id: 'stale' }], token);
  assert.equal(tab.records.size, 0);
  tab.storage.finishBackupRestore(token, false);
  assert.equal(tab.storage.beginBackupRestore(), null);
});


test('reload gates concurrent loads behind recovery before exposing partially restored records', async () => {
  const local = new Map();
  const records = new Map();
  const original = await loadStorage({ local, records, startedAt: 100, sessionId: 'interrupted' });
  const snapshot = { schemaVersion: 1, ...clone(stored), patient, representative, medicalCase, documents };
  const token = original.storage.beginBackupRestore();
  await original.storage.saveRestoreJournal(token, snapshot);
  await original.storage.savePatientProfile({ ...patient, firstName: 'Partial replacement' }, token);
  const entered = deferred();
  const resume = deferred();
  const reloaded = await loadStorage({
    local, records, startedAt: 15100,
    afterSet: async key => {
      if (key === 'tulong_patient_profile') { entered.resolve(); await resume.promise; }
    },
  });
  const readers = [
    ['loadPatientProfile', patient], ['loadRepresentativeProfile', representative],
    ['loadMedicalCase', medicalCase], ['loadDocuments', documents],
    ['loadApplications', snapshot.applications], ['loadEducationSession', snapshot.educationSession],
    ['loadWorkerSession', snapshot.workerSession], ['loadSharedFamilyContext', snapshot.sharedFamilyContext],
  ];
  let finished = false;
  const reading = Promise.all(readers.map(async ([name, expected]) => {
    assert.deepEqual(clone(await reloaded.storage[name]()), expected);
  })).then(() => { finished = true; });
  await entered.promise;
  try {
    assert.equal(finished, false, 'no reader returns until recovery finishes');
  } finally { resume.resolve(); }
  await reading;
  assert.equal(records.has('tulongph_restore_journal_interrupted'), false);
  assert.equal(records.has('tulongph_restore_journal'), false);
  assert.equal(local.has('tulongph_restore_journal_session'), false);
  assert.equal(reloaded.messages.filter(message => message.type === 'restore-start').length, 1);
});

test('initialized reader waits for another tab restore before returning records', async () => {
  const local = new Map();
  const records = new Map([['tulong_patient_profile', patient]]);
  const reader = await loadStorage({ local, records, startedAt: 100, sessionId: 'reader' });
  assert.deepEqual(await reader.storage.loadPatientProfile(), patient);
  const restorer = await loadStorage({ local, records, startedAt: 101, sessionId: 'restorer' });
  const token = restorer.storage.beginBackupRestore();
  reader.channels.get('tulongph-backup').onmessage({ data: restorer.messages.at(-1) });
  await restorer.storage.savePatientProfile({ ...patient, firstName: 'Partial replacement' }, token);
  let finished = false;
  const reading = reader.storage.loadPatientProfile().then(value => { finished = true; return value; });
  const committedPatient = { ...patient, firstName: 'Complete replacement' };
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(finished, false, 'initialized reader must not expose partial replacement');
    assert.equal(reader.timers.size, 1);
    // Internal restorer reads must not wait on its own lease.
    assert.equal((await restorer.storage.loadPatientProfile()).firstName, 'Partial replacement');
    await restorer.storage.savePatientProfile(committedPatient, token);
  } finally {
    restorer.storage.finishBackupRestore(token, true);
    reader.channels.get('tulongph-backup').onmessage({ data: restorer.messages.at(-1) });
    await reading;
  }
  assert.deepEqual(await reading, committedPatient);
  assert.equal(reader.timers.size, 0);
});

test('simultaneous reload recovery loser waits for winner before returning records', async () => {
  const local = new Map();
  const records = new Map();
  const original = await loadStorage({ local, records, startedAt: 100, sessionId: 'interrupted' });
  const token = original.storage.beginBackupRestore();
  await original.storage.saveRestoreJournal(token, { schemaVersion: 1, ...clone(stored), patient });
  await original.storage.savePatientProfile({ ...patient, firstName: 'Partial replacement' }, token);
  const entered = deferred();
  const resume = deferred();
  const winner = await loadStorage({
    local, records, startedAt: 15100, sessionId: 'winner',
    beforeSet: async key => {
      if (key === 'tulong_patient_profile') { entered.resolve(); await resume.promise; }
    },
  });
  const loser = await loadStorage({ local, records, startedAt: 15100, sessionId: 'loser' });
  // Both tabs start reading the abandoned journal before either acquires the recovery lease.
  const winningRead = winner.storage.loadPatientProfile();
  let finished = false;
  const losingRead = loser.storage.loadPatientProfile().then(value => { finished = true; return value; });
  await entered.promise;
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(winner.messages.filter(message => message.type === 'restore-start').length, 1);
    assert.equal(loser.messages.length, 0, 'losing tab must not acquire a recovery lease');
    assert.equal(records.get('tulong_patient_profile').firstName, 'Partial replacement');
    assert.equal(finished, false, 'losing recovery must not expose partial replacement');
    assert.equal(loser.timers.size, 1);
  } finally {
    resume.resolve();
    await winningRead;
    // No start broadcast was delivered, so the lease itself must gate the losing reader.
    loser.setNow(30100);
    await losingRead;
  }
  assert.deepEqual(await winningRead, patient);
  assert.deepEqual(await losingRead, patient);
  assert.equal(loser.timers.size, 0);
  assert.equal(records.has('tulongph_restore_journal_interrupted'), false);
});

test('ordinary save after reload waits for abandoned recovery before persisting the edit', async () => {
  const local = new Map();
  const records = new Map();
  const original = await loadStorage({ local, records, startedAt: 100, sessionId: 'interrupted' });
  const token = original.storage.beginBackupRestore();
  await original.storage.saveRestoreJournal(token, { schemaVersion: 1, ...clone(stored), patient });
  records.set('tulong_patient_profile', { ...patient, firstName: 'Partial replacement' });
  const reloaded = await loadStorage({ local, records, startedAt: 15100 });
  await reloaded.storage.savePatientProfile({ ...patient, firstName: 'New edit' });
  assert.equal(records.get('tulong_patient_profile').firstName, 'New edit');
  assert.equal(records.has('tulongph_restore_journal_interrupted'), false);
});

for (const firstOperation of ['save', 'restore']) {
  test(`receiving tab reconciles expired remote lease before a new ${firstOperation} without completion broadcast`, async () => {
    const tab = await loadStorage({ startedAt: 100 });
    tab.local.set('tulongph_restore_lock_session', JSON.stringify({ sessionId: 'remote', startedAt: 100, expiresAt: 15100 }));
    tab.channels.get('tulongph-backup').onmessage({ data: { type: 'restore-start', sessionId: 'remote', startedAt: 100 } });
    const pendingSave = tab.storage.saveApplications([{ id: 'blocked' }]);
    assert.equal(tab.records.has('tulong_applications'), false);
    tab.setNow(15100);
    await pendingSave;
    if (firstOperation === 'restore') {
      const token = tab.storage.beginBackupRestore();
      assert.equal(typeof token, 'symbol');
      tab.storage.finishBackupRestore(token, true);
    }
    await tab.storage.saveApplications([{ id: 'ordinary' }]);
    assert.equal(tab.records.get('tulong_applications')[0].id, 'ordinary');
    const token = tab.storage.beginBackupRestore();
    assert.equal(typeof token, 'symbol');
    tab.storage.finishBackupRestore(token, true);
    assert.ok(tab.events.includes('tulongph-backup-restore-failed'));
  });
}

test('deferred session journal write after lease expiry cannot clobber the winning session journal', async () => {
  const local = new Map();
  const records = new Map();
  const entered = deferred();
  const resume = deferred();
  const loser = await loadStorage({
    local, records, startedAt: 100, sessionId: 'loser',
    beforeSet: async key => {
      if (key === 'tulongph_restore_journal_loser') { entered.resolve(); await resume.promise; }
    },
  });
  const loserToken = loser.storage.beginBackupRestore();
  const losing = loser.storage.saveRestoreJournal(loserToken, { schemaVersion: 1, ...clone(stored), patient });
  const rejected = assert.rejects(losing, /RESTORE_SESSION_LOST/);
  await entered.promise;
  const winner = await loadStorage({ local, records, startedAt: 15100, sessionId: 'winner' });
  const winnerToken = winner.storage.beginBackupRestore();
  const winningSnapshot = { schemaVersion: 1, ...clone(stored), patient: { ...patient, firstName: 'Winning original' } };
  await winner.storage.saveRestoreJournal(winnerToken, winningSnapshot);
  loser.setNow(15100);
  resume.resolve();
  await rejected;
  assert.equal(local.get('tulongph_restore_journal_session'), 'winner');
  assert.deepEqual(records.get('tulongph_restore_journal_winner').snapshot, winningSnapshot);
  assert.equal(records.has('tulongph_restore_journal'), false);
  records.set('tulong_patient_profile', { ...patient, firstName: 'Winning partial replacement' });
  const reloaded = await loadStorage({ local, records, startedAt: 30100 });
  assert.deepEqual(await reloaded.storage.loadPatientProfile(), winningSnapshot.patient);
  assert.equal(records.has('tulongph_restore_journal_winner'), false);
});


test('privacy wipe fallback deletes both session-scoped and legacy restore journals', async () => {
  const workerRecords = new Map();
  const tab = await loadStorage({
    workerRecords, sessionId: 'private-session',
    beforeClear: async () => { throw new Error('Simulated IndexedDB clear failure'); },
  });
  const token = tab.storage.beginBackupRestore();
  await tab.storage.saveRestoreJournal(token, { schemaVersion: 1, ...clone(stored) });
  assert.ok(tab.records.has('tulongph_restore_journal_private-session'));
  tab.records.set('tulongph_restore_journal', { sessionId: 'legacy', snapshot: { schemaVersion: 1, ...clone(stored) } });
  await tab.storage.clearAllUserData();
  assert.equal(tab.records.size, 0);
  assert.equal(workerRecords.size, 0);
  assert.deepEqual([...tab.local], [['tulong_lang', 'taglish']]);
});

for (const completion of ['expiry', 'restore-complete', 'restore-failed']) {
  test(`reload before lease expiry keeps reads pending until ${completion} and recovery`, async () => {
    const local = new Map();
    const records = new Map();
    const original = await loadStorage({ local, records, startedAt: 100, sessionId: 'interrupted' });
    const token = original.storage.beginBackupRestore();
    await original.storage.saveRestoreJournal(token, { schemaVersion: 1, ...clone(stored), patient });
    await original.storage.savePatientProfile({ ...patient, firstName: 'Partial replacement' }, token);
    const reloaded = await loadStorage({ local, records, startedAt: 15099 });
    let finished = false;
    const reading = reloaded.storage.loadPatientProfile().then(value => { finished = true; return value; });
    await Promise.resolve();
    assert.equal(finished, false);
    assert.equal(reloaded.timers.size, 1);
    if (completion === 'expiry') reloaded.setNow(15100);
    else {
      const channel = reloaded.channels.get('tulongph-backup');
      channel.onmessage({ data: original.messages.at(-1) });
      local.delete('tulongph_restore_lock_session');
      channel.onmessage({ data: { type: completion, sessionId: 'interrupted', completedAt: 15099 } });
    }
    assert.deepEqual(await reading, patient);
    assert.equal(reloaded.timers.size, 0);
    assert.equal(records.has('tulongph_restore_journal_interrupted'), false);
  });
}

test('delayed loser journal write after winner cleanup cannot undo the committed winner on reload', async () => {
  const local = new Map();
  const records = new Map();
  const entered = deferred();
  const resume = deferred();
  const loser = await loadStorage({
    local, records, startedAt: 100, sessionId: 'loser',
    beforeSet: async key => {
      if (key === 'tulongph_restore_journal_loser') { entered.resolve(); await resume.promise; }
    },
  });
  const loserToken = loser.storage.beginBackupRestore();
  const losing = loser.storage.saveRestoreJournal(loserToken, { schemaVersion: 1, ...clone(stored), patient });
  const rejected = assert.rejects(losing, /RESTORE_SESSION_LOST/);
  await entered.promise;
  const winner = await loadStorage({ local, records, startedAt: 15100, sessionId: 'winner' });
  const winnerToken = winner.storage.beginBackupRestore();
  await winner.storage.saveRestoreJournal(winnerToken, { schemaVersion: 1, ...clone(stored), patient });
  const committedPatient = { ...patient, firstName: 'Winner committed' };
  await winner.storage.savePatientProfile(committedPatient, winnerToken);
  await winner.storage.clearRestoreJournal(winnerToken);
  winner.storage.finishBackupRestore(winnerToken, true);
  assert.equal(records.has('tulongph_restore_journal_winner'), false);
  loser.setNow(15100);
  resume.resolve();
  await rejected;
  assert.equal(records.has('tulongph_restore_journal'), false);
  assert.equal(local.has('tulongph_restore_journal_session'), false);
  const reloaded = await loadStorage({ local, records, startedAt: 30100 });
  assert.deepEqual(await reloaded.storage.loadPatientProfile(), committedPatient);
});

for (const explicitGeneration of [false, true]) {
  test(`first document save after abandoned restore honors generation (explicit=${explicitGeneration})`, async () => {
    const local = new Map();
    const records = new Map();
    const original = await loadStorage({ local, records, startedAt: 100, sessionId: 'interrupted' });
    const token = original.storage.beginBackupRestore();
    await original.storage.saveRestoreJournal(token, { schemaVersion: 1, ...clone(stored), documents });
    records.set('tulong_documents', [{ id: 'Partial upload' }]);
    const reloaded = await loadStorage({ local, records, startedAt: 15100 });
    const newDocuments = [{ id: 'New upload' }];
    if (explicitGeneration) await reloaded.storage.saveDocuments(newDocuments, reloaded.storage.getWipeGeneration());
    else await reloaded.storage.saveDocuments(newDocuments);
    assert.deepEqual(records.get('tulong_documents'), explicitGeneration ? documents : newDocuments);
    assert.equal(records.has('tulongph_restore_journal_interrupted'), false);
  });
}


test('legacy shared journal remains readable for abandoned restore recovery', async () => {
  const tab = await loadStorage();
  tab.records.set('tulongph_restore_journal', { sessionId: 'legacy', snapshot: { schemaVersion: 1, ...clone(stored), patient } });
  tab.records.set('tulong_patient_profile', { ...patient, firstName: 'Partial replacement' });
  assert.deepEqual(await tab.storage.loadPatientProfile(), patient);
  assert.equal(tab.records.has('tulongph_restore_journal'), false);
});
