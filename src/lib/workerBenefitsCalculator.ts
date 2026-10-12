import type { LoanEstimate, LoanInstallment, WorkerCalculationResult, WorkerProfileInput } from '../types/worker.ts';
import { workerPrograms } from './data/workerPrograms.ts';

export const defaultWorkerProfile: WorkerProfileInput = {
  sector: 'private', scenario: 'loans', monthlySalary: 0,
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
  contingencyDate: '2026-10-12', regionalDailyWage: 0, tupadDays: 10,
  owwaMembership: 'none', returnedWithinThreeYears: false,
};

const amount = (v: number) => Number.isFinite(v) ? Math.min(1_000_000_000, Math.max(0, v)) : 0;
const money = (v: number) => {
  const cents = Math.round((v + Number.EPSILON) * 100);
  return Number.isFinite(v) && Number.isFinite(cents) ? cents / 100 : 0;
};
const count = (v: number) => Math.min(1_200, Math.floor(amount(v)));

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

export function calculateWorkerBenefitsAndLoans(input: WorkerProfileInput): WorkerCalculationResult {
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
  const matched = workerPrograms.filter(p => ids.has(p.id));
  return {
    loans, maternity: { days, averageDailySalaryCredit: money(ads), sssBenefit: maternityBenefit,
      fullPayEquivalent: fullPay, employerSalaryDifferential: differential, governmentPaidLeave: !isSSS ? fullPay : 0 },
    sickness: { days: sickDays, sssDaily: sickDaily, sssBenefit: sickBenefit, ecDaily, ecBenefit,
      ecMedicalReimbursement: ecMedical, ecCarerMonthly: ecCarer, combinedBenefit: money(sickBenefit + ecBenefit + ecMedical) },
    unemploymentBenefit: unemployment,
    funeral: { regularBenefit: regularFuneral, ecBenefit: ecFuneral, combinedBenefit: regularFuneral + ecFuneral },
    livelihood: { tupadEstimate: tupad, bpbhGrant: bpbh }, matchedPrograms: matched,
    consolidatedChecklist: [...new Set(matched.flatMap(p => p.checklist))], advisories,
  };
}
