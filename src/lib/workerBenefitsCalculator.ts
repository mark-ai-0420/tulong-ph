import type { LoanEstimate, LoanInstallment, WorkerCalculationResult, WorkerProfileInput } from '../types/worker.ts';
import { workerPrograms } from './data/workerPrograms.ts';

export const defaultWorkerProfile: WorkerProfileInput = {
  sector: 'private', scenario: 'loans', monthlySalary: 0, payrollSchedule: 'six_day_week',
  averageMonthlySalaryCredit: 0, highestSixMonthlySalaryCredit: 0,
  funeralAverageMonthlySalaryCredit: 0, unemploymentAverageMonthlySalaryCredit: 0, contributionMonths: 0,
  recentContributionMonths: 0, qualifyingBenefitContributions: 0,
  unemploymentRecentContributions: 0, age: 30,
  pagibigContributionMonths: 0, pagibigRecentContribution: false, pagibigTAV: 0,
  pagibigOutstandingLoan: 0, sssOutstandingLoan: 0, sssCalamityOutstandingLoan: 0, ofwSeaBased: false, loanProratedDays: 0,
  hadRecentCondonation: false, hasPastDueLoan: false, employerRemittancesCurrent: false,
  calamityDeclared: false, maternityType: 'live_birth', employerDifferentialExempt: false,
  sicknessDays: 0, sickLeaveExhausted: false, isWorkRelated: false,
  hasPermanentDisability: false, approvedECMedicalReimbursement: 0,
  involuntarilySeparated: false, unemploymentClaimWithinThreeYears: false,
  gsisPermanent: true, gsisNetTakeHomePay: 0, gsisOutstandingLoan: 0,
  gsisLoanTermYears: 3, gsisAdvanceInsuranceMonths: 1, gsisEmergencyRenewal: false, gsisEmergencyOutstanding: 0,
  contingencyDate: '2026-10-12', regionalDailyWage: 0, regionalDailyWageManual: false, tupadDays: 10,
  owwaMembership: 'none', returnedWithinThreeYears: false,
  unpaidDays: 0, monthsWorkedInCurrentYear: 0, unusedServiceIncentiveLeaveDays: 0,
  separationCause: 'none', yearsOfService: 0, unpaidOvertimeHours: 0, unpaidHolidayDays: 0,
  pensionType: 'retirement', disabilityDurationMonths: 0,
  mp2ContributionMode: 'monthly', mp2MonthlyContribution: 500, mp2OneTimeDeposit: 0,
  mp2DividendRatePercent: 7, mp2PayoutType: 'compounded',
};

const amount = (v: number) => Number.isFinite(v) ? Math.min(1_000_000_000, Math.max(0, v)) : 0;
const money = (v: number) => {
  const cents = Math.round((v + Number.EPSILON) * 100);
  return Number.isFinite(v) && Number.isFinite(cents) ? cents / 100 : 0;
};
const count = (v: number) => Math.min(1_200, Math.floor(amount(v)));

function sssFormulaComparison(input: WorkerProfileInput, disability = false) {
  const months = count(input.contributionMonths);
  const cys = Math.floor(months / 12);
  const amsc = Math.min(20_000, amount(input.averageMonthlySalaryCredit || input.monthlySalary));
  const formula1 = money(300 + .2 * amsc + .02 * amsc * Math.max(0, cys - 10));
  const formula2 = money(.4 * amsc);
  const guaranteedMin = disability
    ? cys >= 20 ? 2400 : cys >= 10 ? 1200 : 1000
    : cys >= 20 ? 2400 : cys >= 10 ? 1200 : 0;
  return { months, cys, amsc, formula1, formula2, guaranteedMin };
}

function highestSSSFormula(comparison: ReturnType<typeof sssFormulaComparison>) {
  if (comparison.guaranteedMin >= comparison.formula1 && comparison.guaranteedMin >= comparison.formula2) {
    return { amount: comparison.guaranteedMin, formulaUsed: 'guaranteed_min' as const };
  }
  if (comparison.formula2 > comparison.formula1) return { amount: comparison.formula2, formulaUsed: 'formula2' as const };
  return { amount: comparison.formula1, formulaUsed: 'formula1' as const };
}

export function calculateSSSRetirementPension(input: WorkerProfileInput): NonNullable<WorkerCalculationResult['pension']> {
  const comparison = sssFormulaComparison(input);
  const selected = highestSSSFormula(comparison);
  const lumpSum = comparison.months < 120;
  const eligible = comparison.months > 0;
  const baseMonthlyPension = lumpSum ? 0 : selected.amount;
  const additionalBenefit = baseMonthlyPension > 0 ? 1000 : 0;
  const totalMonthlyPension = money(baseMonthlyPension + additionalBenefit);
  return {
    eligible,
    formulaUsed: lumpSum ? 'lump_sum' : selected.formulaUsed,
    baseMonthlyPension,
    additionalBenefit,
    supplementalAllowance: 0,
    totalMonthlyPension,
    thirteenthMonthPension: totalMonthlyPension,
    lumpSumEstimate: lumpSum ? money(comparison.amsc * comparison.months * .15) : 0,
    gsisFiveYearLumpSum: 0,
    gsisCashPayment: 0,
    explanation: lumpSum
      ? 'Below 120 posted contributions: SSS pays a one-time benefit based on contributions paid plus interest. This illustration uses the entered AMSC, current 15% contribution rate, and month count; it excludes historical rates and interest. Check the My.SSS record for the amount.'
      : 'Monthly pension uses the highest of the three RA 11199 formulas. SSS also lists a PHP 1,000 additional monthly benefit and a 13th month pension. Age, separation status, credited years, MSC history, and agency records affect entitlement.',
    formulaComparison: { formula1: comparison.formula1, formula2: comparison.formula2, guaranteedMin: comparison.guaranteedMin },
  };
}

export function calculateSSSDisabilityPension(input: WorkerProfileInput): NonNullable<WorkerCalculationResult['pension']> {
  const isPpd = input.pensionType === 'disability_ppd';
  const comparison = sssFormulaComparison(input, true);
  const selected = highestSSSFormula(comparison);
  const duration = Math.min(120, count(input.disabilityDurationMonths ?? 0));
  const contributionLumpSum = comparison.months < 36;
  const ppdLumpSum = isPpd && duration > 0 && duration < 12;
  const lumpSum = contributionLumpSum || ppdLumpSum;
  const eligible = comparison.months > 0 && (!isPpd || duration > 0);
  const monthlyBase = eligible && !contributionLumpSum ? selected.amount : 0;
  const additionalBenefit = eligible && !lumpSum ? 1000 : 0;
  const supplementalAllowance = eligible && !lumpSum ? 500 : 0;
  const monthlyTotal = money(monthlyBase + additionalBenefit + supplementalAllowance);
  const contributionMonthsForLumpSum = Math.max(12, comparison.months);
  const ppdFraction = Math.min(1, Math.ceil((duration / 75) * 100) / 100);
  const lumpSumEstimate = !eligible ? 0
    : isPpd && contributionLumpSum ? money(selected.amount * contributionMonthsForLumpSum * ppdFraction)
      : isPpd && ppdLumpSum ? money(selected.amount * duration)
        : contributionLumpSum ? money(selected.amount * contributionMonthsForLumpSum) : 0;
  const thirteenthMonthPension = !isPpd || duration >= 12 ? monthlyTotal : 0;
  return {
    eligible,
    formulaUsed: lumpSum ? 'lump_sum' : selected.formulaUsed,
    baseMonthlyPension: monthlyBase,
    additionalBenefit,
    supplementalAllowance,
    totalMonthlyPension: lumpSum ? 0 : monthlyTotal,
    thirteenthMonthPension: lumpSum ? 0 : thirteenthMonthPension,
    lumpSumEstimate,
    gsisFiveYearLumpSum: 0,
    gsisCashPayment: 0,
    explanation: isPpd
      ? `Permanent partial disability uses the entered ${duration}-month schedule estimate. SSS determines the body-part schedule, disability rating, duration, and whether payment is monthly or lump sum. The PHP 1,000 additional benefit and PHP 500 supplemental allowance apply to disability pensioners; the 13th month applies when the approved duration is at least 12 months.`
      : 'Permanent total disability uses the SSS disability formula and requires at least 36 contributions for a monthly pension. A lump-sum estimate below that threshold uses the higher of 12 months or the entered contribution months. SSS confirms the medical assessment and final amount.',
    formulaComparison: { formula1: comparison.formula1, formula2: comparison.formula2, guaranteedMin: comparison.guaranteedMin },
  };
}

export function calculateGSISRetirementPension(input: WorkerProfileInput): NonNullable<WorkerCalculationResult['pension']> {
  const months = count(input.contributionMonths);
  const years = Math.floor(months / 12);
  const amc = amount(input.monthlySalary || input.averageMonthlySalaryCredit);
  const ramc = amc > 0 ? amc + 700 : 0;
  const rawBmp = years <= 15 ? .375 * ramc : (.375 + .025 * (years - 15)) * ramc;
  const minimum = years >= 20 ? 2400 : 1300;
  const bmp = amc > 0 ? money(Math.min(amc * .9, Math.max(minimum, rawBmp))) : 0;
  const eligible = years >= 15 && input.age >= 60;
  return {
    eligible,
    formulaUsed: 'gsis_bmp',
    baseMonthlyPension: bmp,
    additionalBenefit: 0,
    supplementalAllowance: 0,
    totalMonthlyPension: bmp,
    thirteenthMonthPension: 0,
    lumpSumEstimate: 0,
    gsisFiveYearLumpSum: money(bmp * 60),
    gsisCashPayment: money(bmp * 18),
    explanation: `GSIS estimate uses RAMC = AMC + PHP 700, a 37.5% RAMC formula through 15 years, then 2.5% for each additional year; BMP is capped at 90% of AMC and uses a PHP ${minimum.toLocaleString('en-PH')} minimum for this service range. RA 8291 retirement generally requires at least 15 years of service and age 60.`,
    formulaComparison: { formula1: 0, formula2: 0, guaranteedMin: minimum },
  };
}

export function calculatePagIbigMP2Savings(input: WorkerProfileInput): NonNullable<WorkerCalculationResult['mp2']> {
  const payoutType = input.mp2PayoutType === 'annual' ? 'annual' : 'compounded';
  const contributionMode = input.mp2ContributionMode === 'lump_sum' ? 'lump_sum' : 'monthly';
  const monthlyContribution = amount(input.mp2MonthlyContribution ?? 0) >= 500 ? amount(input.mp2MonthlyContribution ?? 0) : 0;
  const oneTimeDeposit = amount(input.mp2OneTimeDeposit ?? 0) >= 500 ? amount(input.mp2OneTimeDeposit ?? 0) : 0;
  const annualRate = Math.min(100, amount(input.mp2DividendRatePercent ?? 0)) / 100;
  const yearlyBreakdown: NonNullable<WorkerCalculationResult['mp2']>['yearlyBreakdown'] = [];
  let balance = 0;
  let totalPrincipal = 0;
  let totalDividends = 0;
  let totalAnnualPayout = 0;
  for (let year = 1; year <= 5; year++) {
    const startingBalance = balance;
    const contributions = contributionMode === 'monthly' ? monthlyContribution * 12 : year === 1 ? oneTimeDeposit : 0;
    const newDepositEarnings = contributionMode === 'monthly'
      ? monthlyContribution * annualRate * 6.5
      : contributions * annualRate;
    const dividendEarned = money(startingBalance * annualRate + newDepositEarnings);
    const annualPayout = payoutType === 'annual' ? dividendEarned : 0;
    balance = money(startingBalance + contributions + (payoutType === 'compounded' ? dividendEarned : 0));
    totalPrincipal = money(totalPrincipal + contributions);
    totalDividends = money(totalDividends + dividendEarned);
    totalAnnualPayout = money(totalAnnualPayout + annualPayout);
    yearlyBreakdown.push({ year, startingBalance: money(startingBalance), contributions: money(contributions), dividendEarned, endingBalance: balance, annualPayout });
  }
  return {
    totalPrincipal,
    totalDividends,
    totalValueAtMaturity: money(balance + totalAnnualPayout),
    payoutType,
    yearlyBreakdown,
  };
}

function calculatePensionSavings(input: WorkerProfileInput) {
  const pension = input.sector === 'government'
    ? calculateGSISRetirementPension(input)
    : (input.pensionType ?? 'retirement') === 'retirement'
      ? calculateSSSRetirementPension(input)
      : calculateSSSDisabilityPension(input);
  return { pension, mp2: calculatePagIbigMP2Savings(input) };
}

const payrollScheduleDivisors = {
  six_day_week: { monthly: 26, annualFactor: 313 },
  five_day_week: { monthly: 21.75, annualFactor: 261 },
  monthly_paid: { monthly: 30.42, annualFactor: 365 },
} as const;

function wageClaims(input: WorkerProfileInput): WorkerCalculationResult['wageClaims'] {
  const schedule = payrollScheduleDivisors[input.payrollSchedule] ?? payrollScheduleDivisors.six_day_week;
  const salary = amount(input.monthlySalary);
  const enteredDailyWage = amount(input.regionalDailyWage);
  const dailyWageBasis = salary > 0 ? salary / schedule.monthly : enteredDailyWage;
  const monthlySalaryBasis = salary > 0 ? salary : enteredDailyWage * schedule.monthly;
  const dailyWage = money(dailyWageBasis);
  const unpaidDays = amount(input.unpaidDays ?? 0);
  const months = Math.min(12, amount(input.monthsWorkedInCurrentYear ?? 0));
  const silDays = Math.min(5, amount(input.unusedServiceIncentiveLeaveDays ?? 0));
  const unpaidOvertimeHours = amount(input.unpaidOvertimeHours ?? 0);
  const unpaidHolidayDays = amount(input.unpaidHolidayDays ?? 0);
  const unpaidBasicPay = money(amount(unpaidDays * dailyWageBasis));
  const thirteenthMonthPay = money(amount(monthlySalaryBasis * months / 12));
  const monetizedSIL = money(amount(silDays * dailyWageBasis));
  const cause = input.separationCause === 'redundancy' || input.separationCause === 'retrenchment_closure' || input.separationCause === 'disease'
    ? input.separationCause : 'none';
  const effectiveYears = cause === 'none' ? 0 : Math.max(1, Math.round(amount(input.yearsOfService ?? 0)));
  const separationRate = cause === 'redundancy' ? monthlySalaryBasis : monthlySalaryBasis * 0.5;
  const separationPay = cause === 'none' ? 0 : money(amount(Math.max(monthlySalaryBasis, effectiveYears * separationRate)));
  const overtimePay = money(amount(unpaidOvertimeHours * (dailyWageBasis / 8) * 1.25));
  const holidayPay = money(amount(unpaidHolidayDays * dailyWageBasis));
  const totalClaim = money(amount(unpaidBasicPay + thirteenthMonthPay + monetizedSIL + separationPay + overtimePay + holidayPay));
  const formatPHP = (value: number) => `PHP ${value.toFixed(2)}`;
  const formatCount = (value: number) => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  const separationBasis = cause === 'redundancy' ? 'Art. 298, Labor Code' : 'Art. 298/299, Labor Code';
  const scheduleDescription = `${schedule.monthly} days/month; annual factor ${schedule.annualFactor}`;
  const breakdownItems = [
    { label: 'Unpaid basic salary', amount: unpaidBasicPay, basis: `Unpaid days x daily wage (${salary > 0 ? `monthly salary / ${schedule.monthly}` : `daily wage x ${schedule.monthly}`} days; ${scheduleDescription})` },
    { label: 'Pro-rata 13th month pay', amount: thirteenthMonthPay, basis: `PD 851; estimated as monthly wage equivalent x months worked / 12 (${scheduleDescription})` },
    { label: 'Monetized Service Incentive Leave (SIL)', amount: monetizedSIL, basis: 'Art. 95, Labor Code; up to 5 days, subject to coverage and service eligibility' },
    { label: 'Statutory separation pay', amount: separationPay, basis: cause === 'none' ? 'No authorized cause selected' : `${separationBasis}; at least 1 month salary, with a fraction of 6 months or more counted as a year` },
    { label: 'Unpaid overtime pay', amount: overtimePay, basis: 'Art. 87, Labor Code; regular-day overtime estimated at 125% of hourly rate' },
    { label: 'Unpaid regular holiday pay', amount: holidayPay, basis: 'Art. 94, Labor Code; unpaid regular holiday pay estimated at 100% of daily wage' },
  ];
  const summary = [
    `Unpaid Basic Salary (${formatCount(unpaidDays)} days @ ${formatPHP(dailyWage)}/day): ${formatPHP(unpaidBasicPay)}`,
    `Pro-Rata 13th Month Pay (${formatCount(months)} months / 12 - PD 851): ${formatPHP(thirteenthMonthPay)}`,
    `Unused Service Incentive Leave (${formatCount(silDays)} days - Art. 95): ${formatPHP(monetizedSIL)}`,
  ];
  if (cause !== 'none') summary.push(`Statutory Separation Pay (${formatCount(effectiveYears)} years - ${separationBasis}): ${formatPHP(separationPay)}`);
  if (unpaidOvertimeHours > 0 || unpaidHolidayDays > 0) {
    summary.push(`Unpaid OT / Holiday Pay: ${formatPHP(overtimePay + holidayPay)} (OT ${formatCount(unpaidOvertimeHours)} hours: ${formatPHP(overtimePay)}; Holiday ${formatCount(unpaidHolidayDays)} days: ${formatPHP(holidayPay)})`);
  }
  summary.push(`TOTAL ESTIMATED SENA CLAIM: ${formatPHP(totalClaim)}`);
  return { dailyWage, unpaidBasicPay, thirteenthMonthPay, monetizedSIL, separationPay, overtimePay, holidayPay,
    totalClaim, formattedSummary: summary.join('\n'), breakdownItems };
}

export function monthlyLoanPayment(principal: number, annualRate: number, months: number): number {
  const p = amount(principal), n = count(months), r = amount(annualRate) / 12;
  if (!n || !p) return 0;
  return money(r ? p * r / (1 - Math.pow(1 + r, -n)) : p / n);
}

function loan(id: string, name: string, principal: number, annualRate: number, months: number,
  grace: number, feeRate: number, advanceInterest: number, insurance: number, offset: number,
  effectiveRate = annualRate, financedGraceInterest = 0, note = ''): LoanEstimate {
  const gross = money(amount(principal));
  const fee = money(gross * feeRate);
  const advance = money(advanceInterest);
  const insured = money(insurance);
  const deducted = money(Math.min(gross, amount(offset)));
  const financed = money(gross + financedGraceInterest);
  const payment = monthlyLoanPayment(financed, effectiveRate, months);
  const schedule: LoanInstallment[] = [];
  let balance = financed;
  for (let month = 1; month <= months; month++) {
    const interest = money(balance * effectiveRate / 12);
    const paid = month === months ? money(balance + interest) : Math.min(payment, money(balance + interest));
    const repaid = money(paid - interest);
    balance = money(Math.max(0, balance - repaid));
    schedule.push({ month, payment: paid, interest, principal: repaid, balance });
  }
  return { id, name, grossPrincipal: gross, serviceFee: fee, advanceInterest: advance,
    insurance: insured, offset: deducted, netProceeds: money(Math.max(0, gross - fee - advance - insured - deducted)),
    annualRate, effectiveAnnualRate: effectiveRate, monthlyAmortization: payment,
    termMonths: months, graceMonths: grace, schedule, note };
}

// Published MPL Flex annual effective rates and monthly insurance per PHP 1,000.
const gsisRates6 = [11.4573797, 11.7120016, 11.6630768, 11.5441329, 11.4038854,
  11.2582026, 11.1134005, 10.9722352, 10.8359228, 10.7049479, 10.5794269,
  10.4592854, 10.3443505, 10.2344005, 10.1291928];
const gsisRates7 = [13.4421961, 13.7030186, 13.6096275, 13.4383335, 13.2461477,
  13.0512190, 12.8604790, 12.6767332, 12.5010403, 12.3336560];
const gsisRI6 = [.31157, .31492, .32739, .34254, .35908, .37657, .39486, .41392,
  .43379, .45452, .47617, .49880, .52244, .54707, .57269];
const gsisRI7 = [.31238, .31663, .33000, .34605, .36350, .38190, .40111, .42111, .44193, .46364];

export function calculateWorkerBenefits(input: WorkerProfileInput): WorkerCalculationResult {
  const msc = Math.min(20000, amount(input.averageMonthlySalaryCredit));
  const sixMSC = Math.min(20000, amount(input.highestSixMonthlySalaryCredit));
  const ads = sixMSC * 6 / 180;
  const salary = amount(input.monthlySalary), months = count(input.contributionMonths);
  const isSSS = input.sector !== 'government';
  const loans: LoanEstimate[] = [];
  const advisories = [
    'Gabay at pagtataya lamang. Ahensiya ang magpapatunay ng eligibility, release date, insurance, offsets at final Disclosure Statement.',
    'Regular SSS MSC hanggang PHP 20,000 lamang. Hindi kasama sa cash benefit ang provident fund MSC hanggang PHP 35,000.',
    'Ihambing ang effective annual rate, kabuuang bayad at fees. Ang stated advance rate ay iba sa diminishing rate. Iwasan ang loan app na may mataas na buwanang singil.',
  ];
  const sssLoanEligible = isSSS && months >= 36 && count(input.recentContributionMonths) >= 6 &&
    input.age >= 18 && input.age < 65 && !input.hasPastDueLoan && input.employerRemittancesCurrent;
  if (sssLoanEligible && msc > 0) {
    const rate = input.hadRecentCondonation ? .10 : .08;
    const principal = Math.ceil(msc / 500) * 500 * (months >= 72 ? 2 : 1);
    loans.push(loan('sss_salary', 'SSS Salary Loan', principal, rate, 24, 1, .01,
      principal * rate * Math.min(62, count(input.loanProratedDays)) / 365, 0, input.sssOutstandingLoan,
      rate, 0, 'Average of latest 12 regular MSC, rounded to next MSC. First amortization in second month after approval; actual advance-interest days must match SSS disclosure.'));
    if (input.calamityDeclared) {
      const rate = input.hadRecentCondonation ? .10 : .07;
      const principal = Math.ceil(msc / 500) * 500;
      loans.push(loan('sss_calamity', 'SSS Calamity Loan', principal, rate, 24, 1, .01,
        principal * rate * Math.min(62, count(input.loanProratedDays)) / 365, 0, input.sssCalamityOutstandingLoan,
        rate, 0, 'Only within announced calamity window. Current program begins amortization second month after approval. Enter applicable prior balance.'));
    }
  }
  if (count(input.pagibigContributionMonths) >= 24 && input.pagibigRecentContribution && !input.hasPastDueLoan) {
    const principal = Math.max(0, amount(input.pagibigTAV) * .8 - amount(input.pagibigOutstandingLoan));
    if (principal) {
      loans.push(loan('pagibig_mpl', 'Pag-IBIG MPL (80% baseline)', principal, .105, 24, 2, 0, 0, 0, 0,
        .175, principal * .175 * 2 / 12,
        'Conservative 80% TAV baseline. Enhanced MPL may allow 90%. Payment estimate uses equivalent 17.5% diminishing rate and grace interest; request official schedule. Existing STL reduces available entitlement.'));
      if (input.calamityDeclared) loans.push(loan('pagibig_calamity', 'Pag-IBIG Calamity Loan', principal,
        .0595, 24, 3, 0, 0, 0, 0, .0595, principal * .0595 * 3 / 12,
        '5.95% annual interest; illustration spreads grace-period interest across repayments. Agency confirms application window and amortization.'));
    }
  }
  if (!isSSS && months >= 1 && !input.hasPastDueLoan && input.employerRemittancesCurrent) {
    const tier = months < 20 ? (input.gsisPermanent ? 1 : 0) : months < 36 ? 3 : months < 60 ? 4 : months < 120 ? 7 : months < 180 ? 10 : 14;
    const maxYears = months < 20 ? 3 : months < 120 ? (input.gsisPermanent ? 6 : 3) : input.gsisPermanent ? 15 : 9;
    const years = Math.max(1, Math.min(maxYears, count(input.gsisLoanTermYears)));
    const rate = months >= 36 ? .06 : .07;
    const effective = (rate === .06 ? gsisRates6 : gsisRates7)[years - 1] / 100;
    const ri = (rate === .06 ? gsisRI6 : gsisRI7)[years - 1];
    const principal = Math.min(5000000, salary * tier);
    if (principal > 0) {
      const monthlyInsurance = money(principal / 1000 * ri);
      const advanceInsuranceMonths = Math.max(1, Math.min(2, count(input.gsisAdvanceInsuranceMonths ?? 1)));
      const estimate = loan('gsis_mpl', 'GSIS MPL Flex', principal, rate, years * 12, 0, .02,
        principal * effective * Math.min(62, count(input.loanProratedDays)) / 365,
        monthlyInsurance * advanceInsuranceMonths, input.gsisOutstandingLoan, effective, 0,
        'Regular-member tenure tier; 2% service fee, advance RI (1 month through the 23rd, 2 months afterward) and monthly RI included. Published effective-rate illustration. Special-member and current GSIS disclosure terms may differ.');
      estimate.monthlyAmortization = money(estimate.monthlyAmortization + monthlyInsurance);
      estimate.schedule = estimate.schedule.map(installment => ({ ...installment, payment: money(installment.payment + monthlyInsurance) }));
      if (money(amount(input.gsisNetTakeHomePay) - estimate.monthlyAmortization) >= 5000) loans.push(estimate);
      else advisories.push('GSIS MPL: kailangang manatili ang hindi bababa sa PHP 5,000 net take-home pay matapos ang amortization.');
    }
    if (input.calamityDeclared && count(input.recentContributionMonths) >= 3) {
      const principal = input.gsisEmergencyRenewal ? 40000 : 20000;
      // GSIS emergency uses 6% advance annual rate, equivalent monthly collection PHP 655.56 per PHP20k.
      const estimate = loan('gsis_emergency', 'GSIS Emergency Loan', principal, .06, 36, 0, 0,
        0, principal * .012, input.gsisEmergencyOutstanding, .06, 0,
        '36 payments at 6% advance interest. PHP 40,000 renewal only if current area announcement permits; balance offset and 1.2% insurance apply.');
      const payment = money(principal * (1 + .06 * 3) / 36);
      estimate.monthlyAmortization = payment;
      // The agency advance-interest schedule has equal principal and fixed interest, not an annuity.
      estimate.schedule = Array.from({ length: 36 }, (_, i) => ({ month: i + 1, payment,
        interest: money(principal * .06 / 12), principal: money(principal / 36), balance: money(principal * (35 - i) / 36) }));
      if (money(amount(input.gsisNetTakeHomePay) - payment) >= 5000) loans.push(estimate);
    }
  }

  const days = input.maternityType === 'miscarriage' ? 60 : input.maternityType === 'solo_parent' ? 120 : 105;
  const qualifying = count(input.qualifyingBenefitContributions) >= 3;
  const maternityBenefit = isSSS && qualifying ? money(ads * days) : 0;
  const fullPay = money(salary * days / 30);
  const differential = input.sector === 'private' && qualifying && !input.employerDifferentialExempt
    ? money(Math.max(0, fullPay - maternityBenefit)) : 0;
  const sickDays = Math.min(120, count(input.sicknessDays));
  const sickEligible = isSSS && qualifying && sickDays >= 4 && (input.sector !== 'private' || input.sickLeaveExhausted);
  const sickDaily = sickEligible ? money(.9 * ads) : 0;
  const sickBenefit = sickEligible ? money(.9 * ads * sickDays) : 0;
  const ecCovered = input.isWorkRelated && (input.sector === 'private' || input.sector === 'government' || input.sector === 'self_employed' || (input.sector === 'ofw' && input.ofwSeaBased === true));
  if (input.sector === 'ofw') advisories.push('Sea-based OFW / seafarer: compulsory SSS EC coverage, subject to claim assessment. Land-based OFW: confirm EC coverage and contributions with SSS; ask OWWA / DMW AKSYON and the foreign employer insurer about separate support. Land-based EC is not estimated here.');
  const ecDays = Math.min(120, count(input.sicknessDays));
  const ecDaily = ecCovered && isSSS && sixMSC > 0 ? money(Math.min(480, Math.max(110, .9 * ads))) : 0;
  const ecBenefit = money(ecDaily * ecDays);
  const ecMedical = ecCovered ? money(amount(input.approvedECMedicalReimbursement)) : 0;
  const ecCarer = ecCovered && input.hasPermanentDisability ? 1000 : 0;
  if (ecCovered && !isSSS) advisories.push('Public EC: ipakompyut sa GSIS ang TTD; hindi ginagamit ang private SSS EC daily cap sa government salary.');
  if (ecCovered) advisories.push('Hiwalay ang EC claim sa regular SSS / GSIS claim. Walang bawas sa regular benefit. Ang medical amount ay approved reimbursement lamang; hindi awtomatikong buong bill.');
  const unemployment = isSSS && (input.sector === 'private' || input.sector === 'displaced' || input.sector === 'ofw') &&
    input.involuntarilySeparated && input.age <= 60 && months >= 36 && count(input.unemploymentRecentContributions) >= 12 &&
    !input.unemploymentClaimWithinThreeYears ? money(Math.min(20000, amount(input.unemploymentAverageMonthlySalaryCredit)) * .5 * 2) : 0;
  const funeralMSC = Math.min(20000, amount(input.funeralAverageMonthlySalaryCredit));
  const regularFuneral = !isSSS ? (months === 0 ? 0 : input.contingencyDate >= '2026-07-13' ? 50000 : 30000)
    : months === 0 ? 0 : months < 36 ? 12000 : money(Math.min(60000, 20000 + .005 * months * funeralMSC));
  const ecFuneral = ecCovered ? 30000 : 0;
  const tupad = ['displaced', 'self_employed'].includes(input.sector) || input.involuntarilySeparated
    ? money(amount(input.regionalDailyWage) * Math.min(30, Math.max(10, count(input.tupadDays)))) : 0;
  const bpbh = input.sector === 'ofw' && input.returnedWithinThreeYears
    ? input.owwaMembership === 'active' ? 20000 : input.owwaMembership === 'inactive_once' ? 5000 : input.owwaMembership === 'inactive_multiple' ? 10000 : 0 : 0;
  const pensionSavings = input.scenario === 'pension_savings' ? calculatePensionSavings(input) : {};
  const ids = new Set<string>(input.scenario === 'loans' ? loans.map(l => l.id) : []);
  if (input.scenario === 'maternity') ids.add('sss_maternity');
  if (input.scenario === 'sickness') { ids.add('sss_sickness'); if (ecCovered) ids.add('ecc'); }
  if (input.scenario === 'funeral') { ids.add(isSSS ? 'sss_funeral' : 'gsis_funeral'); if (ecCovered) ids.add('ecc'); }
  if (input.scenario === 'unemployment' || input.scenario === 'livelihood') {
    if (isSSS) ids.add('sss_unemployment');
    ids.add('tupad'); ids.add('dilp'); ids.add('sena');
    if (input.sector === 'ofw') { ids.add('bpbh'); ids.add('aksyon'); }
  }
  if (input.scenario === 'wages') ids.add('sena');
  if (input.scenario === 'pension_savings') {
    ids.add('pagibig_mp2');
    ids.add(input.sector === 'government' ? 'gsis_retirement'
      : (input.pensionType ?? 'retirement') === 'retirement' ? 'sss_retirement' : 'sss_disability');
  }
  const matched = workerPrograms.filter(p => ids.has(p.id));
  return {
    loans, maternity: { days, averageDailySalaryCredit: money(ads), sssBenefit: maternityBenefit,
      fullPayEquivalent: fullPay, employerSalaryDifferential: differential, governmentPaidLeave: !isSSS ? fullPay : 0 },
    sickness: { days: sickDays, sssDaily: sickDaily, sssBenefit: sickBenefit, ecDaily, ecBenefit,
      ecMedicalReimbursement: ecMedical, ecCarerMonthly: ecCarer, combinedBenefit: money(sickBenefit + ecBenefit + ecMedical) },
    unemploymentBenefit: unemployment,
    funeral: { regularBenefit: regularFuneral, ecBenefit: ecFuneral, combinedBenefit: regularFuneral + ecFuneral },
    livelihood: { tupadEstimate: tupad, bpbhGrant: bpbh }, wageClaims: wageClaims(input), matchedPrograms: matched,
    ...pensionSavings,
    consolidatedChecklist: [...new Set(matched.flatMap(p => p.checklist))], advisories,
  };
}

export const calculateWorkerBenefitsAndLoans = calculateWorkerBenefits;
