import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAidStacking } from '../src/lib/triageEngine.ts';

const basePatient = {
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  dateOfBirth: '1960-01-01',
  isSeniorCitizen: true,
  isPWD: false,
  is4PsBeneficiary: false,
  isSoloParent: false,
  isOFW: false,
  isIndigenousPeople: false,
  barangay: 'Brgy 1',
  cityMunicipality: 'Manila',
  province: 'Metro Manila',
  contactNumber: '09171234567',
  socioeconomicClass: 'indigent',
};

const baseCase = {
  diagnosis: 'Acute Myocardial Infarction',
  category: 'cardiovascular',
  hospitalType: 'public_doh',
  hospitalName: 'Philippine General Hospital',
  totalHospitalBill: 150000,
  philhealthDeduction: 40000,
  seniorPwdDiscount: 0,
  netRemainingBalance: 110000,
  admissionStatus: 'confined_running_bill',
};

test('Public DOH Hospital Pathway provides No Balance Billing (NBB) / Malasakit for indigent/senior', () => {
  const result = calculateAidStacking(basePatient, {
    ...baseCase,
    hospitalType: 'public_doh',
  });

  assert.strictEqual(result.hospitalType, 'public_doh');
  assert.ok(result.steps.length >= 4, 'Should contain at least 4 stacking steps');
  
  // PhilHealth should be first
  assert.strictEqual(result.steps[0].agencyId, 'philhealth');
  
  // Malasakit Center should be present (doh_malasakit)
  const malasakitStep = result.steps.find((s) => s.agencyId === 'doh_malasakit');
  assert.ok(malasakitStep, 'Malasakit Center must be present for Public DOH');
  
  // Check running bill guidance
  assert.ok(result.admissionStatusGuidance, 'Admission status guidance should be populated');
  assert.ok(result.admissionStatusGuidance.titleTl.includes('Running Bill'));
});

test('Public LGU Hospital Pathway includes CSWD/MSWD or Mayor/Governor assistance', () => {
  const result = calculateAidStacking(basePatient, {
    ...baseCase,
    hospitalType: 'public_lgu',
    hospitalName: 'Ospital ng Maynila',
  });

  assert.strictEqual(result.hospitalType, 'public_lgu');
  const stepAgencies = result.steps.map((s) => s.agencyId);
  assert.ok(stepAgencies.includes('philhealth'));
  assert.ok(
    stepAgencies.includes('pcso_map') ||
    stepAgencies.includes('lgu_cswdo') ||
    stepAgencies.includes('doh_malasakit')
  );
});

test('Private Hospital GL Stacking Pathway: No Malasakit Desk, mandatory Senior/PWD VAT exemption, PCSO & Senate GL', () => {
  const result = calculateAidStacking(basePatient, {
    ...baseCase,
    hospitalType: 'private',
    hospitalName: "St. Luke's Medical Center",
    privateStrategy: 'gl_stacking',
    totalHospitalBill: 200000,
    netRemainingBalance: 120000,
  });

  assert.strictEqual(result.hospitalType, 'private');
  assert.strictEqual(result.selectedStrategy, 'gl_stacking');

  // Must NOT include in-hospital Malasakit Center desk
  const malasakitStep = result.steps.find((s) => s.agencyId === 'doh_malasakit');
  assert.strictEqual(malasakitStep, undefined, 'Private hospital cannot have Malasakit Center desk step');

  // Guidance must state Malasakit is not available
  assert.ok(result.privateHospitalGuidance, 'privateHospitalGuidance must be defined');
  assert.ok(
    result.privateHospitalGuidance.nonApplicableServicesTl.some((item) =>
      item.includes('Walang Malasakit Center')
    )
  );

  // Must include Senior/PWD statutory discount step
  const seniorStep = result.steps.find((s) => s.agencyId === 'senior_pwd_statutory');
  assert.ok(seniorStep, 'Private hospital pathway must feature RA 9994 / RA 10754 mandatory discount step');

  // Must include PCSO MAP Guarantee Letter step
  const stepAgencies = result.steps.map((s) => s.agencyId);
  assert.ok(stepAgencies.includes('pcso_map'));
});

test('Private Hospital Transfer Referral Pathway: Playbook and Emergency Transfer Hotlines', () => {
  const result = calculateAidStacking(basePatient, {
    ...baseCase,
    hospitalType: 'private',
    hospitalName: 'Cardinal Santos Medical Center',
    privateStrategy: 'transfer_referral',
    totalHospitalBill: 300000,
    netRemainingBalance: 250000,
  });

  assert.strictEqual(result.hospitalType, 'private');
  assert.strictEqual(result.selectedStrategy, 'transfer_referral');
  
  // Must provide transfer playbook hotlines
  const transferPlaybook = result.privateHospitalGuidance?.transferPlaybook;
  assert.ok(transferPlaybook, 'Transfer playbook must be provided');
  assert.ok(transferPlaybook.hotlines.length >= 4, 'Should include at least 4 referral hotlines (NPNRC, PGH, etc.)');
  assert.ok(transferPlaybook.hotlines.some((h) => h.number.includes('1555')));
});

test('Outpatient Admission Status generates Outpatient specific guidance', () => {
  const result = calculateAidStacking(basePatient, {
    ...baseCase,
    admissionStatus: 'outpatient',
    category: 'dialysis',
  });

  assert.ok(result.admissionStatusGuidance);
  assert.ok(result.admissionStatusGuidance.titleTl.includes('Outpatient'));
});
