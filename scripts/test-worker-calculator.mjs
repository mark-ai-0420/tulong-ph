import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWorkerBenefitsAndLoans, defaultWorkerProfile, monthlyLoanPayment } from '../src/lib/workerBenefitsCalculator.ts';
import { workerPrograms, workerDirectory } from '../src/lib/data/workerPrograms.ts';

const input = overrides => ({ ...defaultWorkerProfile, monthlySalary: 30000,
  averageMonthlySalaryCredit: 20000, highestSixMonthlySalaryCredit: 20000,
  funeralAverageMonthlySalaryCredit: 20000, unemploymentAverageMonthlySalaryCredit: 20000, contributionMonths: 36,
  recentContributionMonths: 6, qualifyingBenefitContributions: 3,
  unemploymentRecentContributions: 12, employerRemittancesCurrent: true, ...overrides });

test('salary loan contribution boundaries, rate, fees, prior offset and MSC rounding', () => {
  assert.equal(calculateWorkerBenefitsAndLoans(input({ contributionMonths: 35 })).loans.length, 0);
  for (const months of [36, 71, 72]) {
    const l = calculateWorkerBenefitsAndLoans(input({ contributionMonths: months, loanProratedDays: 46, sssOutstandingLoan: 1000 })).loans[0];
    const principal = months >= 72 ? 40000 : 20000;
    assert.equal(l.grossPrincipal, principal);
    assert.equal(l.serviceFee, principal * .01);
    assert.equal(l.advanceInterest, Math.round(principal * .08 * 46 / 365 * 100) / 100);
    assert.equal(l.netProceeds, Math.round((principal - l.serviceFee - l.advanceInterest - 1000) * 100) / 100);
    assert.equal(l.monthlyAmortization, months >= 72 ? 1809.09 : 904.55);
    assert.equal(l.schedule.length, 24);
    assert.equal(l.schedule.at(-1).balance, 0);
  }
  assert.equal(calculateWorkerBenefitsAndLoans(input({ averageMonthlySalaryCredit: 15101 })).loans[0].grossPrincipal, 15500);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ hadRecentCondonation: true })).loans[0].annualRate, .1);
});

test('salary eligibility gates, regular MSC cap and calamity window', () => {
  for (const override of [{ recentContributionMonths: 5 }, { hasPastDueLoan: true }, { employerRemittancesCurrent: false }, { age: 65 }, { age: 17 }]) {
    assert.equal(calculateWorkerBenefitsAndLoans(input(override)).loans.length, 0);
  }
  const r = calculateWorkerBenefitsAndLoans(input({ averageMonthlySalaryCredit: 35000, contributionMonths: 72, calamityDeclared: true }));
  assert.equal(r.loans[0].grossPrincipal, 40000);
  assert.equal(r.loans[1].grossPrincipal, 20000);
  assert.equal(r.loans[1].annualRate, .07);
  assert.equal(r.loans[1].serviceFee, 200);
});

test('Pag-IBIG 80% baseline, shared STL headroom, stated versus diminishing rates', () => {
  const r = calculateWorkerBenefitsAndLoans(input({ pagibigContributionMonths: 24, pagibigRecentContribution: true,
    pagibigTAV: 50000, pagibigOutstandingLoan: 5000, calamityDeclared: true }));
  const mpl = r.loans.find(l => l.id === 'pagibig_mpl');
  const calamity = r.loans.find(l => l.id === 'pagibig_calamity');
  assert.equal(mpl.grossPrincipal, 35000);
  assert.equal(mpl.annualRate, .105);
  assert.equal(mpl.effectiveAnnualRate, .175);
  assert.equal(calamity.annualRate, .0595);
  assert.equal(calamity.graceMonths, 3);
  assert.ok(calamity.monthlyAmortization < mpl.monthlyAmortization);
  const no = calculateWorkerBenefitsAndLoans(input({ pagibigContributionMonths: 23, pagibigRecentContribution: true, pagibigTAV: 50000 }));
  assert.ok(!no.loans.some(l => l.id.startsWith('pagibig')));
});

test('maternity durations, full pay differential, cap, exemption and government payroll', () => {
  for (const [type, days, benefit, differential] of [
    ['live_birth', 105, 70000, 35000], ['solo_parent', 120, 80000, 40000], ['miscarriage', 60, 40000, 20000],
  ]) {
    const r = calculateWorkerBenefitsAndLoans(input({ scenario: 'maternity', maternityType: type, highestSixMonthlySalaryCredit: 35000 }));
    assert.equal(r.maternity.days, days);
    assert.equal(r.maternity.sssBenefit, benefit);
    assert.equal(r.maternity.employerSalaryDifferential, differential);
  }
  assert.equal(calculateWorkerBenefitsAndLoans(input({ qualifyingBenefitContributions: 2 })).maternity.sssBenefit, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sector: 'self_employed' })).maternity.employerSalaryDifferential, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ employerDifferentialExempt: true })).maternity.employerSalaryDifferential, 0);
  const government = calculateWorkerBenefitsAndLoans(input({ sector: 'government' }));
  assert.equal(government.maternity.sssBenefit, 0);
  assert.equal(government.maternity.governmentPaidLeave, 105000);
});

test('sickness minimum days, recent contributions, separate EC and permanent-only carer', () => {
  const r = calculateWorkerBenefitsAndLoans(input({ scenario: 'sickness', sicknessDays: 10, sickLeaveExhausted: true,
    isWorkRelated: true, approvedECMedicalReimbursement: 1200 }));
  assert.equal(r.sickness.sssDaily, 600);
  assert.equal(r.sickness.sssBenefit, 6000);
  assert.equal(r.sickness.ecDaily, 480);
  assert.equal(r.sickness.ecBenefit, 4800);
  assert.equal(r.sickness.combinedBenefit, 12000);
  assert.equal(r.sickness.ecCarerMonthly, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ isWorkRelated: true, hasPermanentDisability: true })).sickness.ecCarerMonthly, 1000);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sicknessDays: 3, sickLeaveExhausted: true })).sickness.sssBenefit, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sicknessDays: 10, sickLeaveExhausted: false })).sickness.sssBenefit, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sicknessDays: 10, sickLeaveExhausted: true, isWorkRelated: false })).sickness.ecBenefit, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sector: 'government', sicknessDays: 10, isWorkRelated: true })).sickness.ecBenefit, 0);
});

test('unemployment gates and PHP20000 cap', () => {
  const valid = { involuntarilySeparated: true, scenario: 'unemployment' };
  assert.equal(calculateWorkerBenefitsAndLoans(input(valid)).unemploymentBenefit, 20000);
  for (const override of [{ age: 61 }, { contributionMonths: 35 }, { unemploymentRecentContributions: 11 },
    { unemploymentClaimWithinThreeYears: true }, { sector: 'self_employed' }, { involuntarilySeparated: false }]) {
    assert.equal(calculateWorkerBenefitsAndLoans(input({ ...valid, ...override })).unemploymentBenefit, 0);
  }
});

test('funeral minimum, regular variable formula and EC additive recovery, dated GSIS increase', () => {
  assert.equal(calculateWorkerBenefitsAndLoans(input({ contributionMonths: 0 })).funeral.regularBenefit, 0);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ contributionMonths: 35 })).funeral.regularBenefit, 12000);
  const r = calculateWorkerBenefitsAndLoans(input({ scenario: 'funeral', isWorkRelated: true }));
  assert.equal(r.funeral.regularBenefit, 23600);
  assert.equal(r.funeral.combinedBenefit, 53600);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ contributionMonths: 500 })).funeral.regularBenefit, 60000);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sector: 'government', contingencyDate: '2026-07-12' })).funeral.regularBenefit, 30000);
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sector: 'government', contingencyDate: '2026-07-13' })).funeral.regularBenefit, 50000);
});

test('GSIS tenure tiers, contribution rate threshold, net-pay gate and emergency offsets', () => {
  const base = { sector: 'government', gsisNetTakeHomePay: 100000, monthlySalary: 50000 };
  for (const [months, multiplier] of [[1, 1], [20, 3], [36, 4], [60, 7], [120, 10], [180, 14]]) {
    const l = calculateWorkerBenefitsAndLoans(input({ ...base, contributionMonths: months })).loans[0];
    assert.equal(l.grossPrincipal, 50000 * multiplier);
    assert.equal(l.annualRate, months >= 36 ? .06 : .07);
    assert.equal(l.serviceFee, l.grossPrincipal * .02);
    assert.ok(l.effectiveAnnualRate > l.annualRate);
  }
  assert.equal(calculateWorkerBenefitsAndLoans(input({ ...base, gsisNetTakeHomePay: 5000 })).loans.length, 0);
  const l = calculateWorkerBenefitsAndLoans(input({ ...base, calamityDeclared: true, gsisEmergencyRenewal: true, gsisEmergencyOutstanding: 10000 })).loans.find(l => l.id === 'gsis_emergency');
  assert.equal(l.grossPrincipal, 40000);
  assert.equal(l.insurance, 480);
  assert.equal(l.netProceeds, 29520);
  assert.equal(l.monthlyAmortization, 1311.11);
});

test('TUPAD and OWWA membership tiers are conditional and non-debt candidates', () => {
  assert.equal(calculateWorkerBenefitsAndLoans(input({ sector: 'displaced', regionalDailyWage: 600, tupadDays: 20 })).livelihood.tupadEstimate, 12000);
  for (const [membership, benefit] of [['active', 20000], ['inactive_once', 5000], ['inactive_multiple', 10000], ['none', 0]]) {
    assert.equal(calculateWorkerBenefitsAndLoans(input({ sector: 'ofw', returnedWithinThreeYears: true, owwaMembership: membership })).livelihood.bpbhGrant, benefit);
  }
});

test('pure deterministic function, invalid amounts bounded, zero-rate loans and sourced no-em-dash dataset', () => {
  const p = Object.freeze(input({ scenario: 'sickness', sicknessDays: 10 }));
  assert.deepEqual(calculateWorkerBenefitsAndLoans(p), calculateWorkerBenefitsAndLoans(p));
  assert.equal(monthlyLoanPayment(1200, 0, 12), 100);
  assert.equal(monthlyLoanPayment(-1, 1, 12), 0);
  const r = calculateWorkerBenefitsAndLoans(input({ averageMonthlySalaryCredit: NaN, highestSixMonthlySalaryCredit: -1 }));
  assert.equal(r.maternity.sssBenefit, 0);
  assert.equal(r.loans.length, 0);
  assert.equal(new Set(workerPrograms.map(p => p.id)).size, workerPrograms.length);
  assert.ok(workerPrograms.every(p => p.source.startsWith('https://') && p.checklist.length));
  assert.ok(!JSON.stringify([workerPrograms, workerDirectory]).includes('\u2014'));
});

test('SSS salary and calamity loans deduct only their respective balances', () => {
  const loans = calculateWorkerBenefitsAndLoans(input({ calamityDeclared: true,
    sssOutstandingLoan: 1000, sssCalamityOutstandingLoan: 2500 })).loans;
  const salary = loans.find(l => l.id === 'sss_salary');
  const calamity = loans.find(l => l.id === 'sss_calamity');
  assert.equal(salary.offset, 1000);
  assert.equal(calamity.offset, 2500);
  assert.equal(salary.netProceeds, 18800);
  assert.equal(calamity.netProceeds, 17300);
  const noCalamityBalance = calculateWorkerBenefitsAndLoans(input({ calamityDeclared: true, sssOutstandingLoan: 1000 }));
  assert.equal(noCalamityBalance.loans.find(l => l.id === 'sss_calamity').offset, 0);
});

test('MPL Flex deducts advance RI only and includes ongoing RI in payments and net-pay gate', () => {
  const base = input({ sector: 'government', monthlySalary: 50000, gsisNetTakeHomePay: 100000 });
  const estimate = calculateWorkerBenefitsAndLoans(base).loans.find(l => l.id === 'gsis_mpl');
  const premium = 65.48; // PHP 200,000 / 1,000 * 0.32739, rounded to cents.
  assert.equal(estimate.insurance, premium);
  assert.equal(estimate.netProceeds, 195934.52);
  const debtPayment = monthlyLoanPayment(200000, .116630768, 36);
  assert.equal(estimate.monthlyAmortization, Math.round((debtPayment + premium) * 100) / 100);
  for (const installment of estimate.schedule) {
    assert.ok(Math.abs(installment.payment - installment.interest - installment.principal - premium) < .011);
  }
  assert.equal(estimate.schedule.at(-1).balance, 0);
  const twoMonths = calculateWorkerBenefitsAndLoans({ ...base, gsisAdvanceInsuranceMonths: 2 }).loans[0];
  assert.equal(twoMonths.insurance, premium * 2);
  assert.equal(twoMonths.netProceeds, 195869.04);
  assert.equal(twoMonths.monthlyAmortization, estimate.monthlyAmortization);
  assert.equal(calculateWorkerBenefitsAndLoans({ ...base, gsisNetTakeHomePay: 5000 + debtPayment }).loans.length, 0);
  assert.equal(calculateWorkerBenefitsAndLoans({ ...base, gsisNetTakeHomePay: 5000 + estimate.monthlyAmortization }).loans.length, 1);
});

test('GSIS MPL and emergency loans accept exactly PHP 5,000 remaining net pay', () => {
  const base = input({ sector: 'government', monthlySalary: 10000, contributionMonths: 60,
    gsisLoanTermYears: 1, gsisNetTakeHomePay: 11223.47 });
  assert.equal(calculateWorkerBenefitsAndLoans(base).loans.find(l => l.id === 'gsis_mpl').monthlyAmortization, 6223.47);
  assert.ok(!calculateWorkerBenefitsAndLoans({ ...base, gsisNetTakeHomePay: 11223.46 }).loans.some(l => l.id === 'gsis_mpl'));
  for (const [renewal, boundary, payment] of [[false, 5655.56, 655.56], [true, 6311.11, 1311.11]]) {
    const emergency = { ...base, calamityDeclared: true, gsisEmergencyRenewal: renewal, gsisNetTakeHomePay: boundary };
    assert.equal(calculateWorkerBenefitsAndLoans(emergency).loans.find(l => l.id === 'gsis_emergency').monthlyAmortization, payment);
    assert.ok(!calculateWorkerBenefitsAndLoans({ ...emergency, gsisNetTakeHomePay: boundary - .01 }).loans.some(l => l.id === 'gsis_emergency'));
  }
});

test('sea-based OFW work-related sickness and funeral include separate EC claims', () => {
  const base = input({ sector: 'ofw', scenario: 'sickness', sicknessDays: 10,
    isWorkRelated: true, approvedECMedicalReimbursement: 1200, ofwSeaBased: true });
  const covered = calculateWorkerBenefitsAndLoans(base);
  assert.equal(covered.sickness.ecBenefit, 4800);
  assert.equal(covered.sickness.combinedBenefit, 12000);
  assert.ok(covered.matchedPrograms.some(p => p.id === 'ecc'));
  assert.equal(calculateWorkerBenefitsAndLoans({ ...base, scenario: 'funeral' }).funeral.ecBenefit, 30000);
  for (const override of [{ ofwSeaBased: false }, { ofwSeaBased: undefined }, { isWorkRelated: false }]) {
    const result = calculateWorkerBenefitsAndLoans({ ...base, ...override });
    assert.equal(result.sickness.ecBenefit, 0);
    assert.equal(result.sickness.ecMedicalReimbursement, 0);
    assert.equal(result.funeral.ecBenefit, 0);
  }
});

test('finite extreme inputs cannot overflow monetary results or generate unbounded schedules', () => {
  function finiteNumbers(value) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (value && typeof value === 'object') Object.values(value).forEach(finiteNumbers);
  }
  const extreme = Object.fromEntries(Object.entries(defaultWorkerProfile).map(([key, value]) =>
    [key, typeof value === 'number' ? 1e307 : value]));
  for (const sector of ['private', 'government', 'self_employed', 'ofw', 'displaced']) {
    const result = calculateWorkerBenefitsAndLoans({ ...extreme, sector, age: 30, calamityDeclared: true,
      employerRemittancesCurrent: true, pagibigRecentContribution: true, isWorkRelated: true,
      involuntarilySeparated: true, pagibigOutstandingLoan: 0, gsisOutstandingLoan: 0,
      sssOutstandingLoan: 0, sssCalamityOutstandingLoan: 0 });
    finiteNumbers(result);
    assert.ok(result.loans.every(l => l.schedule.length <= 1200));
  }
  finiteNumbers(monthlyLoanPayment(1e307, 1e307, 1e307));
  assert.equal(monthlyLoanPayment(1e307, 0, 1e307), monthlyLoanPayment(1e9, 0, 1200));
});

test('failed privacy wipe clears the cancelled upload indicator and allows retry', async () => {
  const { readFile } = await import('node:fs/promises');
  const component = await readFile(new URL('../src/components/PrintFormsView.tsx', import.meta.url), 'utf8');
  assert.match(component, /const uploadRequestRef = useRef\(0\);/);
  assert.match(component, /const uploadRequest = \+\+uploadRequestRef\.current;/);
  assert.match(component, /if \(uploadRequestRef\.current === uploadRequest\) setProcessingDocType\(null\);/);

  let wipeGeneration = 0;
  let latestRequest = 0;
  let processingDocType = null;
  const beginUpload = type => {
    const request = ++latestRequest;
    processingDocType = type;
    return { request, generation: wipeGeneration };
  };
  const finishUpload = ({ request }) => {
    if (latestRequest === request) processingDocType = null;
  };

  const cancelledUpload = beginUpload('clinical_abstract');
  wipeGeneration++; // wipe-start invalidates the pending conversion
  // wipe-failed restores storage but does not restore the upload's generation
  finishUpload(cancelledUpload);
  assert.equal(processingDocType, null);

  const retry = beginUpload('clinical_abstract');
  assert.equal(processingDocType, 'clinical_abstract');
  finishUpload(retry);
  assert.equal(processingDocType, null);

  const olderUpload = beginUpload('statement_of_account');
  const newerUpload = beginUpload('clinical_abstract');
  finishUpload(olderUpload);
  assert.equal(processingDocType, 'clinical_abstract');
  finishUpload(newerUpload);
  assert.equal(processingDocType, null);
});

test('privacy wipe rejects pending document uploads and permits fresh saves in the same runtime', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const { default: ts } = await import('typescript');
  const records = new Map();
  const local = new Map();
  const idb = { get: async key => records.get(key), set: async (key, value) => records.set(key, value),
    del: async key => records.delete(key), clear: async () => records.clear() };
  const source = (await readFile(new URL('../src/lib/storage.ts', import.meta.url), 'utf8'))
    .replace("await import('idb-keyval')", "await Promise.resolve(require('idb-keyval'))");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  let privacyChannel;
  class MockBroadcastChannel {
    constructor() { privacyChannel = this; }
    postMessage() {}
  }
  runInNewContext(code, { exports: module.exports, require: () => idb,
    window: { addEventListener() {}, dispatchEvent() {}, BroadcastChannel: MockBroadcastChannel },
    BroadcastChannel: MockBroadcastChannel, Event,
    localStorage: { setItem: (key, value) => local.set(key, value), getItem: key => local.get(key), clear: () => local.clear() },
    sessionStorage: { clear() {} } });
  const storage = module.exports;
  await storage.saveWorkerSession(defaultWorkerProfile);
  await storage.savePatientProfile({ ...storage.defaultPatientProfile, firstName: 'Old synthetic' });
  const generation = storage.getWipeGeneration();
  let finishCompression;
  const compression = new Promise(resolve => { finishCompression = resolve; });
  const pendingUpload = (async () => {
    await compression;
    await storage.saveDocuments([{ fileName: 'Old synthetic document' }], generation);
  })();
  await storage.clearAllUserData();
  assert.ok(storage.getWipeGeneration() > generation);
  finishCompression();
  await pendingUpload;
  assert.equal(local.size, 0);
  assert.equal(records.size, 0);
  await storage.saveWorkerSession({ ...defaultWorkerProfile, monthlySalary: 4321 });
  await storage.saveEducationSession({ tuition: 5678 });
  await storage.savePatientProfile({ ...storage.defaultPatientProfile, firstName: 'New synthetic' });
  assert.equal((await storage.loadWorkerSession()).monthlySalary, 4321);
  assert.equal((await storage.loadEducationSession()).tuition, 5678);
  assert.equal((await storage.loadPatientProfile()).firstName, 'New synthetic');
  await storage.saveDocuments([{ fileName: 'New synthetic document' }], storage.getWipeGeneration());
  assert.equal((await storage.loadDocuments())[0].fileName, 'New synthetic document');
  const beforeBroadcast = storage.getWipeGeneration();
  privacyChannel.onmessage({ data: 'wipe-start' });
  assert.ok(storage.getWipeGeneration() > beforeBroadcast);
  // Even a failed remote wipe invalidates work captured before it started.
  privacyChannel.onmessage({ data: 'wipe-failed' });
  await storage.saveDocuments([{ fileName: 'Stale remote document' }], beforeBroadcast);
  assert.equal((await storage.loadDocuments())[0].fileName, 'New synthetic document');
  privacyChannel.onmessage({ data: 'wipe-complete' });
  assert.ok(storage.getWipeGeneration() > beforeBroadcast + 1);
});
