import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  calculateGSISRetirementPension,
  calculatePagIbigMP2Savings,
  calculateSSSDisabilityPension,
  calculateSSSRetirementPension,
  calculateWorkerBenefits,
  defaultWorkerProfile,
} from '../src/lib/workerBenefitsCalculator.ts';

const workerWizardSource = await readFile(new URL('../src/components/worker/WorkerWizard.tsx', import.meta.url), 'utf8');

function objectBody(name) {
  const start = workerWizardSource.indexOf(`const ${name}:`);
  assert.notEqual(start, -1, `${name} must be present in WorkerWizard`);
  const bodyStart = workerWizardSource.indexOf('= {', start) + 3;
  const bodyEnd = workerWizardSource.indexOf('\n};', bodyStart);
  assert.ok(bodyStart > 2 && bodyEnd > bodyStart, `${name} must be an object literal`);
  return workerWizardSource.slice(bodyStart, bodyEnd);
}

function propertyBody(source, name) {
  const match = new RegExp(`(?:^|\\n)\\s*${name}:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`).exec(source);
  assert.ok(match, `${name} must have a localization object`);
  return match[1];
}

const worker = overrides => ({
  ...defaultWorkerProfile,
  sector: 'private',
  scenario: 'pension_savings',
  age: 60,
  contributionMonths: 180,
  monthlySalary: 20_000,
  averageMonthlySalaryCredit: 10_000,
  ...overrides,
});

test('pension explanations and sector options cover all languages without em dashes', () => {
  const languages = ['taglish', 'cebuano', 'ilocano', 'en'];
  const sectors = ['private', 'government', 'self_employed', 'ofw', 'displaced'];
  const formulas = ['formula1', 'formula2', 'guaranteed_min', 'lump_sum', 'gsis_bmp'];
  const sectorLabels = objectBody('sectorLabels');
  const pensionExplanations = objectBody('pensionExplanationText');

  for (const sector of sectors) {
    const labels = propertyBody(sectorLabels, sector);
    for (const language of languages) assert.match(labels, new RegExp(`\\b${language}:\\s*'[^']+'`));
  }

  for (const language of languages) {
    const explanations = propertyBody(pensionExplanations, language);
    for (const formula of formulas) assert.match(explanations, new RegExp(`\\b${formula}:\\s*'[^']+'`));
  }

  assert.equal(`${sectorLabels}\n${pensionExplanations}`.includes('\u2014'), false);
  assert.match(workerWizardSource, /const ageLabel = local\('Edad', 'Age', 'Edad', 'Tawen'\);/);
  assert.match(workerWizardSource, /const backLabel = local\('Bumalik', 'Back', 'Balik', 'Subli'\);/);
  assert.match(workerWizardSource, /const nextLabel = local\('Susunod', 'Next', 'Sunod', 'Sumaruno'\);/);
});

test('SSS retirement compares all RA 11199 formulas and selects the highest', () => {
  const formula2 = calculateSSSRetirementPension(worker({ contributionMonths: 180, averageMonthlySalaryCredit: 10_000 }));
  assert.equal(formula2.formulaUsed, 'formula2');
  assert.deepEqual(formula2.formulaComparison, { formula1: 3_300, formula2: 4_000, guaranteedMin: 1_200 });
  assert.equal(formula2.baseMonthlyPension, 4_000);
  assert.equal(formula2.additionalBenefit, 1_000);
  assert.equal(formula2.totalMonthlyPension, 5_000);
  assert.equal(formula2.thirteenthMonthPension, 5_000);

  const formula1 = calculateSSSRetirementPension(worker({ contributionMonths: 240, averageMonthlySalaryCredit: 10_000 }));
  assert.equal(formula1.formulaUsed, 'formula1');
  assert.deepEqual(formula1.formulaComparison, { formula1: 4_300, formula2: 4_000, guaranteedMin: 2_400 });
});

test('SSS retirement minimum pension boundaries are PHP 1,200 and PHP 2,400', () => {
  const tenYears = calculateSSSRetirementPension(worker({ contributionMonths: 120, averageMonthlySalaryCredit: 0, monthlySalary: 0 }));
  const twentyYears = calculateSSSRetirementPension(worker({ contributionMonths: 240, averageMonthlySalaryCredit: 0, monthlySalary: 0 }));
  assert.equal(tenYears.formulaUsed, 'guaranteed_min');
  assert.equal(tenYears.baseMonthlyPension, 1_200);
  assert.equal(twentyYears.formulaUsed, 'guaranteed_min');
  assert.equal(twentyYears.baseMonthlyPension, 2_400);
});

test('SSS retirement below 120 contributions shows an estimated lump sum, not a monthly pension', () => {
  const result = calculateSSSRetirementPension(worker({ contributionMonths: 119, averageMonthlySalaryCredit: 10_000 }));
  assert.equal(result.eligible, true);
  assert.equal(result.formulaUsed, 'lump_sum');
  assert.equal(result.baseMonthlyPension, 0);
  assert.equal(result.totalMonthlyPension, 0);
  assert.equal(result.lumpSumEstimate, 178_500);
  assert.match(result.explanation, /contributions paid plus interest/i);
});

test('SSS disability adds the PHP 1,000 benefit and PHP 500 supplemental allowance', () => {
  const ptd = calculateSSSDisabilityPension(worker({ pensionType: 'disability_ptd', contributionMonths: 120 }));
  assert.equal(ptd.formulaUsed, 'formula2');
  assert.equal(ptd.baseMonthlyPension, 4_000);
  assert.equal(ptd.additionalBenefit, 1_000);
  assert.equal(ptd.supplementalAllowance, 500);
  assert.equal(ptd.totalMonthlyPension, 5_500);
  assert.equal(ptd.thirteenthMonthPension, 5_500);

  const ppd = calculateSSSDisabilityPension(worker({ pensionType: 'disability_ppd', disabilityDurationMonths: 6, contributionMonths: 120 }));
  assert.equal(ppd.formulaUsed, 'lump_sum');
  assert.equal(ppd.lumpSumEstimate, 24_000);
  assert.equal(ppd.totalMonthlyPension, 0);
});

test('SSS PPD below 36 contributions prorates the base pension by disability fraction', () => {
  const ptd = calculateSSSDisabilityPension(worker({ pensionType: 'disability_ptd', contributionMonths: 24 }));
  assert.equal(ptd.lumpSumEstimate, 96_000);

  const ppd = calculateSSSDisabilityPension(worker({
    pensionType: 'disability_ppd', contributionMonths: 24, disabilityDurationMonths: 10,
  }));
  assert.equal(ppd.formulaUsed, 'lump_sum');
  assert.equal(ppd.lumpSumEstimate, 19_200);
  assert.equal(ppd.additionalBenefit, 0);
  assert.equal(ppd.supplementalAllowance, 0);
  assert.equal(ppd.totalMonthlyPension, 0);
});

test('GSIS BMP returns both RA 8291 payment choices and respects minimum and cap', () => {
  const result = calculateGSISRetirementPension(worker({
    sector: 'government', contributionMonths: 240, age: 60, monthlySalary: 10_000,
  }));
  assert.equal(result.formulaUsed, 'gsis_bmp');
  assert.equal(result.eligible, true);
  assert.equal(result.baseMonthlyPension, 5_350);
  assert.equal(result.gsisFiveYearLumpSum, 321_000);
  assert.equal(result.gsisCashPayment, 96_300);

  const minimum = calculateGSISRetirementPension(worker({
    sector: 'government', contributionMonths: 180, age: 60, monthlySalary: 2_000,
  }));
  assert.equal(minimum.baseMonthlyPension, 1_300);

  const capped = calculateGSISRetirementPension(worker({
    sector: 'government', contributionMonths: 600, age: 60, monthlySalary: 10_000,
  }));
  assert.equal(capped.baseMonthlyPension, 9_000);
});

test('Pag-IBIG MP2 projects five years of compounding and annual dividend payout', () => {
  const compounded = calculatePagIbigMP2Savings(worker({
    mp2ContributionMode: 'monthly', mp2MonthlyContribution: 500,
    mp2DividendRatePercent: 7, mp2PayoutType: 'compounded',
  }));
  const annual = calculatePagIbigMP2Savings(worker({
    mp2ContributionMode: 'monthly', mp2MonthlyContribution: 500,
    mp2DividendRatePercent: 7, mp2PayoutType: 'annual',
  }));
  assert.equal(compounded.yearlyBreakdown.length, 5);
  assert.equal(compounded.yearlyBreakdown[0].contributions, 6_000);
  assert.equal(compounded.yearlyBreakdown[0].dividendEarned, 227.5);
  assert.equal(compounded.totalPrincipal, 30_000);
  assert.equal(compounded.yearlyBreakdown[4].annualPayout, 0);
  assert.equal(annual.yearlyBreakdown[0].annualPayout, 227.5);
  assert.equal(annual.yearlyBreakdown[4].endingBalance, 30_000);
  assert.equal(annual.totalValueAtMaturity, annual.totalPrincipal + annual.totalDividends);
  assert.ok(compounded.totalValueAtMaturity > annual.totalValueAtMaturity);

  const lumpSum = calculatePagIbigMP2Savings(worker({
    mp2ContributionMode: 'lump_sum', mp2OneTimeDeposit: 10_000,
    mp2DividendRatePercent: 7, mp2PayoutType: 'compounded',
  }));
  const lumpSumAnnual = calculatePagIbigMP2Savings(worker({
    mp2ContributionMode: 'lump_sum', mp2OneTimeDeposit: 10_000,
    mp2DividendRatePercent: 7, mp2PayoutType: 'annual',
  }));
  assert.equal(lumpSum.yearlyBreakdown[0].contributions, 10_000);
  assert.equal(lumpSum.yearlyBreakdown[0].dividendEarned, 700);
  assert.equal(lumpSum.totalPrincipal, 10_000);
  assert.deepEqual(lumpSum.yearlyBreakdown.slice(1).map(({ year, startingBalance, dividendEarned, endingBalance }) => [year, startingBalance, dividendEarned, endingBalance]), [
    [2, 10_700, 749, 11_449],
    [3, 11_449, 801.43, 12_250.43],
    [4, 12_250.43, 857.53, 13_107.96],
    [5, 13_107.96, 917.56, 14_025.52],
  ]);
  assert.equal(lumpSum.totalValueAtMaturity, 14_025.52);
  assert.deepEqual(lumpSumAnnual.yearlyBreakdown.slice(1).map(({ year, startingBalance, dividendEarned, endingBalance, annualPayout }) => [year, startingBalance, dividendEarned, endingBalance, annualPayout]), [
    [2, 10_000, 700, 10_000, 700],
    [3, 10_000, 700, 10_000, 700],
    [4, 10_000, 700, 10_000, 700],
    [5, 10_000, 700, 10_000, 700],
  ]);
  assert.equal(lumpSumAnnual.totalValueAtMaturity, 13_500);
});

test('pension scenario links the correct agency retirement or disability programs and MP2', () => {
  const sss = calculateWorkerBenefits(worker({ pensionType: 'retirement' }));
  assert.ok(sss.pension);
  assert.ok(sss.mp2);
  assert.deepEqual(sss.matchedPrograms.map(program => program.id).sort(), ['pagibig_mp2', 'sss_retirement']);

  const gsis = calculateWorkerBenefits(worker({ sector: 'government', pensionType: 'retirement' }));
  assert.deepEqual(gsis.matchedPrograms.map(program => program.id).sort(), ['gsis_retirement', 'pagibig_mp2']);

  const disability = calculateWorkerBenefits(worker({ pensionType: 'disability_ptd' }));
  assert.deepEqual(disability.matchedPrograms.map(program => program.id), ['sss_disability', 'pagibig_mp2']);
});
