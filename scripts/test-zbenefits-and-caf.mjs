import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchPhilHealthCaseRate,
  matchPhilHealthZBenefit,
  PHILHEALTH_Z_BENEFITS,
} from '../src/lib/data/philhealthRates.ts';
import {
  CAF_REQUIRED_DOCUMENTS,
  CANCER_ASSISTANCE_FUND,
  DOH_CAF_ACCESS_SITES,
  getCancerAssistanceFundSitesByRegion,
  getCancerAssistanceFundSitesForLocation,
} from '../src/lib/data/cancerAssistanceFund.ts';
import {
  KONSULTA_YAKAP_BENEFIT_SUMMARY,
  KONSULTA_DIAGNOSTIC_EXAMS,
  YAKAP_ESSENTIAL_MEDICINES,
} from '../src/lib/data/konsultaBenefits.ts';
import { calculateAidStacking } from '../src/lib/triageEngine.ts';

const patient = {
  firstName: 'Juan',
  middleName: '',
  lastName: 'Dela Cruz',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  civilStatus: 'married',
  contactNumber: '09171234567',
  email: '',
  address: {
    street: '',
    barangay: 'Poblacion',
    cityMunicipality: 'Manila',
    province: 'Metro Manila',
    region: 'NCR',
  },
  isSeniorCitizen: false,
  isPWD: false,
  is4PsBeneficiary: false,
  isOFWOrDependent: false,
  socioeconomicClass: 'indigent',
};

const medicalCase = {
  category: 'hospitalization',
  diagnosis: 'Pneumonia',
  hospitalName: 'Philippine General Hospital',
  hospitalType: 'public_doh',
  hospitalCity: 'Manila',
  hasMalasakitCenter: true,
  attendingPhysician: '',
  totalHospitalBill: 150000,
  philhealthDeduction: 30000,
  seniorPwdDiscount: 0,
  netRemainingBalance: 120000,
  neededAssistanceType: 'guarantee_letter',
  admissionStatus: 'confined_running_bill',
};

test('Hemodialysis uses the ₱6,350 session rate', () => {
  const matched = matchPhilHealthCaseRate('hemodialysis', 'dialysis');
  const fallback = matchPhilHealthCaseRate('', 'dialysis');

  assert.equal(matched.rate, 6350);
  assert.equal(matched.isEstimated, false);
  assert.equal(fallback.rate, 6350);
  assert.equal(6350 * 156, 990600);
});

test('Z Benefit matcher finds cancer, transplant, heart, and dialysis packages', () => {
  assert.equal(matchPhilHealthZBenefit('Stage II breast cancer')?.id, 'breast_cancer');
  assert.equal(matchPhilHealthZBenefit('cervical cancer')?.id, 'cervical_cancer');
  assert.equal(matchPhilHealthZBenefit('colon cancer')?.id, 'colorectal_cancer');
  assert.equal(matchPhilHealthZBenefit('prostate cancer')?.id, 'prostate_cancer');
  assert.equal(matchPhilHealthZBenefit('acute lymphoblastic leukemia')?.id, 'pediatric_all');
  assert.equal(matchPhilHealthZBenefit('kidney transplant')?.id, 'kidney_transplant');
  assert.equal(matchPhilHealthZBenefit('CABG')?.id, 'cabg');
  assert.equal(matchPhilHealthZBenefit('tetralogy of Fallot')?.id, 'tetralogy_of_fallot');
  assert.equal(matchPhilHealthZBenefit('VSD')?.id, 'ventricular_septal_defect');
  assert.equal(matchPhilHealthZBenefit('peritoneal dialysis')?.id, 'peritoneal_dialysis');
  assert.equal(PHILHEALTH_Z_BENEFITS.find((benefit) => benefit.id === 'breast_cancer')?.amountMaximum, 1400000);
});

test('CAF access sites can be looked up by region or province', () => {
  assert.ok(DOH_CAF_ACCESS_SITES.length >= 25);
  assert.equal(getCancerAssistanceFundSitesByRegion('NCR').length, 10);
  assert.equal(getCancerAssistanceFundSitesByRegion('Region IV-A (CALABARZON)')[0]?.regionCode, 'IV-A');
  assert.equal(getCancerAssistanceFundSitesForLocation({ province: 'Oriental Mindoro' })[0]?.id, 'omph');
  assert.ok(getCancerAssistanceFundSitesByRegion('Central Visayas').length > 0);
  assert.ok(getCancerAssistanceFundSitesByRegion('Davao Region').length > 0);
  assert.equal(CANCER_ASSISTANCE_FUND.annualAssistanceLimitPerPatient, 150000);
  assert.equal(CAF_REQUIRED_DOCUMENTS.length, 6);
});

test('Konsulta/YAKAP core lists have 13 exams and 21 essential medicines', () => {
  assert.equal(KONSULTA_DIAGNOSTIC_EXAMS.length, 13);
  assert.equal(YAKAP_ESSENTIAL_MEDICINES.length, 21);
  assert.equal(KONSULTA_YAKAP_BENEFIT_SUMMARY.memberCopay, 0);
  assert.ok(KONSULTA_DIAGNOSTIC_EXAMS.some((exam) => exam.id === 'cbc'));
  assert.ok(YAKAP_ESSENTIAL_MEDICINES.some((medicine) => medicine.id === 'metformin'));
});

test('Cancer, dialysis, and high-cost outpatient guidance are injected into triage steps', () => {
  const cancerResult = calculateAidStacking(patient, {
    ...medicalCase,
    category: 'chemotherapy',
    diagnosis: 'Stage II breast cancer',
    admissionStatus: 'outpatient',
  });
  assert.ok(cancerResult.steps.some((step) => step.agencyId === 'philhealth_z_benefit'));
  const cafStep = cancerResult.steps.find((step) => step.agencyId === 'doh_cancer_assistance_fund');
  assert.ok(cafStep);
  assert.match(cafStep.explanationEn, /Sites listed for this region include:/);

  const dialysisResult = calculateAidStacking(patient, {
    ...medicalCase,
    category: 'dialysis',
    diagnosis: 'Hemodialysis CKD stage 5',
    admissionStatus: 'outpatient',
  });
  const dialysisStep = dialysisResult.steps.find((step) => step.agencyId === 'philhealth_dialysis_support');
  assert.ok(dialysisStep);
  assert.match(dialysisStep.explanationEn, /₱6,350/);
  assert.match(dialysisStep.explanationEn, /156 sessions/);
  assert.match(dialysisStep.explanationEn, /EPO, dialyzer, and iron sucrose/);

  const imagingResult = calculateAidStacking(patient, {
    ...medicalCase,
    category: 'laboratory_diagnostics',
    diagnosis: 'Outpatient MRI scan',
    admissionStatus: 'outpatient',
  });
  assert.ok(imagingResult.steps.some((step) => step.agencyId === 'dswd_aics_quotations'));
});

test('APD and PD First diagnoses inject dialysis guidance under hospitalization', () => {
  for (const diagnosis of ['APD', 'PD first']) {
    const result = calculateAidStacking(patient, { ...medicalCase, diagnosis });
    assert.ok(
      result.steps.some((step) => step.agencyId === 'philhealth_dialysis_support'),
      `${diagnosis} should inject PhilHealth dialysis guidance`
    );
  }
});

test('new benefit data contains no em-dash characters', () => {
  const datasets = [
    PHILHEALTH_Z_BENEFITS,
    CAF_REQUIRED_DOCUMENTS,
    CANCER_ASSISTANCE_FUND,
    DOH_CAF_ACCESS_SITES,
    KONSULTA_DIAGNOSTIC_EXAMS,
    YAKAP_ESSENTIAL_MEDICINES,
  ];
  assert.equal(JSON.stringify(datasets).includes('—'), false);
});
