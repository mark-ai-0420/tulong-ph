import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultEducationProfile, evaluateEducationAssistance, normalizeEducationProfile } from '../src/lib/educationEngine.ts';
import { EDUCATION_AMOUNTS, educationDirectory, educationPrograms } from '../src/lib/data/educationPrograms.ts';

const evaluate = (values = {}) => evaluateEducationAssistance({ ...defaultEducationProfile, ...values });
const primary = (result, id) => result.primaryPrograms.find((match) => match.program.id === id);

test('JHS ESC uses school-location tiers and never exceeds covered fees', () => {
  for (const [location, amount] of Object.entries({ NCR: 13000, HUC: 11000, other: 9000 })) {
    const input = { educationLevel: 'jhs', schoolType: 'private', schoolParticipates: true, yearLevel: 7, location, annualTuitionAndFees: 20000 };
    assert.equal(evaluate(input).directTuitionRelief, amount);
    assert.equal(evaluate({ ...input, annualTuitionAndFees: 4000.25 }).directTuitionRelief, 4000.25);
    assert.equal(evaluate({ ...input, annualTuitionAndFees: 0 }).netRemainingTuitionBalance, 0);
    assert.equal(evaluate({ ...input, yearLevel: 8 }).directTuitionRelief, 0);
    assert.equal(evaluate({ ...input, yearLevel: 8, isExistingEsc: true, previousAnnualGrant: amount }).directTuitionRelief, amount);
    assert.equal(evaluate({ ...input, schoolParticipates: false }).directTuitionRelief, 0);
  }
});

test('Private SHS public and ESC/approved voucher tiers require a qualified category and continuing award', () => {
  const tiers = { NCR: [22500, 18000], HUC: [20000, 16000], other: [17500, 14000] };
  for (const [location, [full, privateTier]] of Object.entries(tiers)) {
    const input = { educationLevel: 'shs', schoolType: 'private', schoolParticipates: true, yearLevel: 11, location, annualTuitionAndFees: 30000, voucherCategory: 'public_jhs' };
    assert.equal(evaluate(input).directTuitionRelief, full);
    assert.equal(evaluate({ ...input, voucherCategory: 'esc' }).directTuitionRelief, privateTier);
    assert.equal(evaluate({ ...input, voucherCategory: 'approved_private' }).directTuitionRelief, privateTier);
    assert.equal(evaluate({ ...input, voucherCategory: 'none' }).directTuitionRelief, 0);
    assert.equal(evaluate({ ...input, yearLevel: 12 }).directTuitionRelief, 0);
    assert.equal(evaluate({ ...input, yearLevel: 12, hasSHSVoucher: true, previousAnnualGrant: full }).directTuitionRelief, full);
    assert.equal(evaluate({ ...input, schoolType: 'suc_luc' }).directTuitionRelief, 0, 'Historical 50% SUC vouchers must not become current new awards');
  }
  assert.deepEqual(EDUCATION_AMOUNTS.shsHistoricalSUC, { NCR: 11250, HUC: 10000, other: 8750 });
});

test('FHE covers eligible first degrees and excludes private, postgraduate and retention-ineligible profiles', () => {
  const input = { schoolParticipates: true, annualTuitionAndFees: 23456.78 };
  assert.equal(evaluate(input).directTuitionRelief, 23456.78);
  assert.equal(evaluate(input).netRemainingTuitionBalance, 0);
  for (const change of [{ schoolType: 'private' }, { firstDegree: false }, { withinResidencyLimit: false }, { isFilipino: false }, { educationLevel: 'medicine' }]) {
    assert.equal(evaluate({ ...input, ...change }).directTuitionRelief, 0);
  }
});

test('TES, TDP and DOST are ranked alternatives; FHE coexists and TES add-ons require TES', () => {
  const result = evaluate({ schoolParticipates: true, annualTuitionAndFees: 20000, is4PsOrListahanan: true, isPWD: true, needsLicensureReimbursement: true, priorityCourse: true, dostQualifiedSchool: true, isSTEMGraduateOrTop5: true, willingReturnService: true, selectedPrimaryProgram: 'dost' });
  assert.equal(result.directTuitionRelief, 20000);
  assert.equal(primary(result, 'dost').annualCashAmount, 90000);
  assert.equal(primary(result, 'tes').annualCashAmount, 20000);
  assert.equal(primary(result, 'tdp').annualCashAmount, 15000);
  assert.equal(result.bestPrimaryAnnualStipend, 90000, 'Do not sum national living awards');
  assert.equal(result.selectedPrimary.program.id, 'dost');
  assert.equal(result.supplementalPrograms.find((match) => match.reason.includes('TES-3A')).annualCashAmount, 10000);
  assert.equal(result.supplementalPrograms.find((match) => match.reason.includes('TES-3B')).oneTimeAmount, 8000);
  assert.ok(result.supplementalPrograms.filter((match) => match.program.id === 'tes').every((match) => match.requiresPrimaryProgram === 'tes'));
  assert.equal(evaluate({ schoolParticipates: true, hasOtherNationalScholarship: true, is4PsOrListahanan: true }).primaryPrograms.length, 0);
});

test('TES prioritization includes private no-SUC poor students and guards high-income, nonpriority profiles', () => {
  assert.equal(primary(evaluate({ schoolParticipates: true, schoolType: 'private', noLocalSUC: true }), 'tes').annualCashAmount, 27000);
  assert.equal(primary(evaluate({ schoolParticipates: true, schoolType: 'private', noLocalSUC: true, annualHouseholdIncome: 500000 }), 'tes'), undefined);
  assert.equal(primary(evaluate({ schoolParticipates: true }), 'tes'), undefined);
});

test('CMSP academic and 2025 income boundaries separate cash from private tuition', () => {
  const input = { schoolType: 'private', schoolParticipates: true, priorityCourse: true, gwa: 96, annualHouseholdIncome: 500000, annualTuitionAndFees: 60000 };
  assert.equal(primary(evaluate(input), 'cmsp').annualCashAmount, 80000);
  assert.equal(primary(evaluate(input), 'cmsp').tuitionAmount, 40000);
  assert.equal(primary(evaluate({ ...input, gwa: 95.99 }), 'cmsp').annualCashAmount, 40000);
  assert.equal(primary(evaluate({ ...input, gwa: 95.99 }), 'cmsp').tuitionAmount, 20000);
  for (const change of [{ gwa: 92.99 }, { annualHouseholdIncome: 500000.01 }, { isIncomingFreshman: false }, { priorityCourse: false }]) assert.equal(primary(evaluate({ ...input, ...change }), 'cmsp'), undefined);
});

test('CoScho requires PCA course, registry, income, grades and service; laptop is one time', () => {
  const input = { isCoconutFarmerDependent: true, coconutPriorityCourse: true, willingReturnService: true, annualHouseholdIncome: 300000, gwa: 80 };
  assert.equal(primary(evaluate(input), 'coscho').annualCashAmount, 80000);
  assert.equal(primary(evaluate(input), 'coscho').oneTimeAmount, 30000);
  assert.equal(primary(evaluate({ ...input, isIncomingFreshman: false }), 'coscho').oneTimeAmount, 0);
  for (const change of [{ coconutPriorityCourse: false }, { annualHouseholdIncome: 300000.01 }, { gwa: 79.99 }, { willingReturnService: false }]) assert.equal(primary(evaluate({ ...input, ...change }), 'coscho'), undefined);
});

test('OWWA and TESDA paths enforce membership/salary and course-specific allowance conditions', () => {
  const owwa = evaluate({ isOWWADependent: true, owwaActive: true, ofwMonthlySalaryUSD: 1000 });
  assert.deepEqual(owwa.primaryPrograms.filter((match) => match.program.id === 'owwa').map((match) => match.annualCashAmount), [60000, 20000]);
  assert.equal(evaluate({ isOWWADependent: true }).primaryPrograms.filter((match) => match.program.id === 'owwa').length, 0);
  assert.equal(evaluate({ isOWWADependent: true, owwaActive: true, ofwMonthlySalaryUSD: 1000.01 }).primaryPrograms.filter((match) => match.program.id === 'owwa').length, 1);
  const tvet = evaluate({ educationLevel: 'tvet', schoolType: 'public', schoolParticipates: true, annualTuitionAndFees: 10000, trainingDays: 23 });
  assert.equal(tvet.directTuitionRelief, 10000);
  assert.equal(tvet.supplementalPrograms[0].annualCashAmount, 3680);
  assert.equal(tvet.supplementalPrograms[0].requiresPrimaryProgram, 'tesda');
  assert.equal(evaluate({ educationLevel: 'tvet', age: 14 }).primaryPrograms.length, 0);
});

test('Medicine is a conditional return-service award and crisis aid has no invented fixed payout', () => {
  const input = { educationLevel: 'medicine', schoolType: 'private', schoolParticipates: true, willingReturnService: true, annualTuitionAndFees: 250000 };
  assert.equal(primary(evaluate(input), 'msrs').annualCashAmount, 177000);
  assert.equal(primary(evaluate(input), 'msrs').tuitionAmount, 200000);
  assert.equal(evaluate(input).directTuitionRelief, 0, 'A potential award must not be deducted from fees before approval');
  assert.equal(primary(evaluate({ ...input, willingReturnService: false }), 'msrs'), undefined);
  assert.equal(evaluate({ hasFamilyCrisis: true }).supplementalPrograms.at(-1).annualCashAmount, null);
});

test('Persisted session recovery rejects unknown fields and wrong primitive or enum types; math remains finite', () => {
  const recovered = normalizeEducationProfile({ educationLevel: 'evil', schoolType: null, location: 'wrong', annualTuitionAndFees: -500, annualHouseholdIncome: Infinity, gwa: 200, fullName: ['bad'], isPWD: 'true', unknown: 'discard' });
  assert.equal(recovered.educationLevel, 'college'); assert.equal(recovered.schoolType, 'suc_luc');
  assert.equal(recovered.location, 'NCR'); assert.equal(recovered.annualTuitionAndFees, 0);
  assert.equal(recovered.annualHouseholdIncome, 0); assert.equal(recovered.gwa, 100);
  assert.equal(recovered.fullName, ''); assert.equal(recovered.isPWD, false);
  assert.equal(Object.hasOwn(recovered, 'unknown'), false);
  const result = evaluate({ annualTuitionAndFees: Number.MAX_VALUE });
  assert.ok(Number.isFinite(result.netRemainingTuitionBalance));
  assert.deepEqual(normalizeEducationProfile(null), defaultEducationProfile);
});

test('Checklist is deduplicated, all 13 programs have official references, and strings contain no em dash', () => {
  assert.equal(educationPrograms.length, 13);
  const result = evaluate({ schoolParticipates: true, is4PsOrListahanan: true, isPWD: true, priorityCourse: true, gwa: 97, hasFamilyCrisis: true });
  assert.equal(result.documentaryChecklist.length, new Set(result.documentaryChecklist).size);
  assert.ok(educationPrograms.every((program) => program.sourceUrl.startsWith('https://') && program.documents.length > 0 && program.steps.length > 0));
  assert.equal(JSON.stringify([educationPrograms, educationDirectory, result]).includes('\u2014'), false);
  assert.equal(educationDirectory.filter((entry) => entry.email?.includes('unifast')).length, 18);
});
