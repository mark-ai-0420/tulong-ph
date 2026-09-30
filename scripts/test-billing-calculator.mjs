import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHospitalBill } from '../src/lib/billingCalculator.ts';
import { matchPhilHealthCaseRate } from '../src/lib/data/philhealthRates.ts';

test('Test 1: Senior Citizen in Private Hospital (₱100,000, Pneumonia)', () => {
  const result = calculateHospitalBill({
    totalBill: 100000,
    hospitalType: 'private',
    isSeniorCitizen: true,
    isPWD: false,
    diagnosis: 'Pneumonia',
    category: 'hospitalization',
  });

  assert.strictEqual(result.totalSeniorPwdRelief, 28571.43);
  assert.strictEqual(result.philhealthDeductionAmount, 32000);
  assert.strictEqual(result.netRemainingBalance, 39428.57);
  assert.strictEqual(result.isSeniorOrPwdApplied, true);
  assert.strictEqual(result.isNoBalanceBillingEligible, false);
  assert.strictEqual(result.vatExemptSales, 89285.71);
  assert.strictEqual(result.vatAmountRemoved, 10714.29);
  assert.strictEqual(result.seniorPwdDiscountAmount, 17857.14);
  assert.strictEqual(result.balanceAfterSeniorPwd, 71428.57);
});

test('Test 2: Regular patient in Public DOH Hospital (₱50,000, Dengue)', () => {
  const result = calculateHospitalBill({
    totalBill: 50000,
    hospitalType: 'public_doh',
    isSeniorCitizen: false,
    isPWD: false,
    diagnosis: 'Dengue',
    category: 'hospitalization',
  });

  assert.strictEqual(result.totalSeniorPwdRelief, 0);
  assert.strictEqual(result.philhealthDeductionAmount, 16000);
  assert.strictEqual(result.netRemainingBalance, 34000);
  assert.strictEqual(result.isSeniorOrPwdApplied, false);
  assert.strictEqual(result.isNoBalanceBillingEligible, false);
  assert.strictEqual(result.balanceAfterSeniorPwd, 50000);
});

test('Test 3: PWD in Public LGU Hospital (₱60,000, Stroke)', () => {
  const result = calculateHospitalBill({
    totalBill: 60000,
    hospitalType: 'public_lgu',
    isSeniorCitizen: false,
    isPWD: true,
    diagnosis: 'Stroke',
    category: 'hospitalization',
  });

  assert.strictEqual(result.totalSeniorPwdRelief, 12000);
  assert.strictEqual(result.philhealthDeductionAmount, 38000);
  assert.strictEqual(result.netRemainingBalance, 10000);
  assert.strictEqual(result.isSeniorOrPwdApplied, true);
  assert.strictEqual(result.isNoBalanceBillingEligible, false);
  assert.strictEqual(result.vatAmountRemoved, 0);
  assert.strictEqual(result.seniorPwdDiscountAmount, 12000);
  assert.strictEqual(result.balanceAfterSeniorPwd, 48000);
});

test('Test 4: Tagalog & acronym keyword matching', () => {
  // "pulmonya" -> Pneumonia Moderate Risk (₱32,000)
  const pulmonya = matchPhilHealthCaseRate('pulmonya');
  assert.strictEqual(pulmonya.rate, 32000);
  assert.match(pulmonya.matchedName, /Pneumonia/i);
  assert.strictEqual(pulmonya.isEstimated, false);

  // "atake sa puso" -> Acute Myocardial Infarction (₱40,000)
  const atake = matchPhilHealthCaseRate('atake sa puso');
  assert.strictEqual(atake.rate, 40000);
  assert.match(atake.matchedName, /Myocardial Infarction/i);
  assert.strictEqual(atake.isEstimated, false);

  // "cs delivery" -> Cesarean Section (₱30,000)
  const cs = matchPhilHealthCaseRate('cs delivery');
  assert.strictEqual(cs.rate, 30000);
  assert.match(cs.matchedName, /Cesarean/i);
  assert.strictEqual(cs.isEstimated, false);

  // "hemodialysis" -> Hemodialysis (₱4,000)
  const hemo = matchPhilHealthCaseRate('hemodialysis');
  assert.strictEqual(hemo.rate, 4000);
  assert.match(hemo.matchedName, /Hemodialysis/i);
  assert.strictEqual(hemo.isEstimated, false);

  // Additional Tagalog / acronym checks
  const pcapSevere = matchPhilHealthCaseRate('Severe Pneumonia (PCAP-D)');
  assert.strictEqual(pcapSevere.rate, 90100);

  const apdo = matchPhilHealthCaseRate('operasyon sa apdo');
  assert.strictEqual(apdo.rate, 31000);

  const apendisitis = matchPhilHealthCaseRate('apendisitis');
  assert.strictEqual(apendisitis.rate, 24000);

  const panganak = matchPhilHealthCaseRate('panganganak');
  assert.strictEqual(panganak.rate, 9750);
});

test('Test 5: Boundary conditions', () => {
  // Boundary A: Total bill ₱0 -> all 0
  const zeroBill = calculateHospitalBill({
    totalBill: 0,
    hospitalType: 'public_doh',
    isSeniorCitizen: true,
    isPWD: false,
    diagnosis: 'Pneumonia',
  });
  assert.strictEqual(zeroBill.totalBill, 0);
  assert.strictEqual(zeroBill.vatExemptSales, 0);
  assert.strictEqual(zeroBill.vatAmountRemoved, 0);
  assert.strictEqual(zeroBill.seniorPwdDiscountAmount, 0);
  assert.strictEqual(zeroBill.totalSeniorPwdRelief, 0);
  assert.strictEqual(zeroBill.balanceAfterSeniorPwd, 0);
  assert.strictEqual(zeroBill.philhealthDeductionAmount, 0);
  assert.strictEqual(zeroBill.netRemainingBalance, 0);

  // Boundary B: Negative bill -> clamped to 0
  const negBill = calculateHospitalBill({
    totalBill: -5000,
    hospitalType: 'private',
    isSeniorCitizen: false,
    isPWD: false,
  });
  assert.strictEqual(negBill.totalBill, 0);
  assert.strictEqual(negBill.netRemainingBalance, 0);

  // Boundary C: Total bill smaller than Case Rate -> deduction capped, net is 0 (never negative)
  const smallBillRegular = calculateHospitalBill({
    totalBill: 20000,
    hospitalType: 'private',
    isSeniorCitizen: false,
    isPWD: false,
    diagnosis: 'Pneumonia',
  });
  assert.strictEqual(smallBillRegular.philhealthDeductionAmount, 20000);
  assert.strictEqual(smallBillRegular.netRemainingBalance, 0);

  // Boundary D: Senior with bill smaller than Case Rate after relief
  const smallBillSenior = calculateHospitalBill({
    totalBill: 15000,
    hospitalType: 'private',
    isSeniorCitizen: true,
    isPWD: false,
    diagnosis: 'Pneumonia',
  });
  assert.strictEqual(smallBillSenior.totalSeniorPwdRelief, 4285.71);
  assert.strictEqual(smallBillSenior.balanceAfterSeniorPwd, 10714.29);
  assert.strictEqual(smallBillSenior.philhealthDeductionAmount, 10714.29);
  assert.strictEqual(smallBillSenior.netRemainingBalance, 0);

  // Boundary E: Bill of ₱1,500,000 -> correct arithmetic
  const largeBill = calculateHospitalBill({
    totalBill: 1500000,
    hospitalType: 'private',
    isSeniorCitizen: true,
    isPWD: false,
    diagnosis: 'High-risk Pneumonia',
    category: 'hospitalization',
  });
  assert.strictEqual(largeBill.vatExemptSales, 1339285.71);
  assert.strictEqual(largeBill.vatAmountRemoved, 160714.29);
  assert.strictEqual(largeBill.seniorPwdDiscountAmount, 267857.14);
  assert.strictEqual(largeBill.totalSeniorPwdRelief, 428571.43);
  assert.strictEqual(largeBill.balanceAfterSeniorPwd, 1071428.57);
  assert.strictEqual(largeBill.philhealthDeductionAmount, 90100);
  assert.strictEqual(largeBill.netRemainingBalance, 981328.57);

  // Boundary F: Public DOH NBB eligibility
  const nbbEligible = calculateHospitalBill({
    totalBill: 80000,
    hospitalType: 'public_doh',
    isSeniorCitizen: true,
    isPWD: false,
    diagnosis: 'Dengue',
  });
  assert.strictEqual(nbbEligible.isNoBalanceBillingEligible, true);
});
