export type WorkerSector = 'private' | 'government' | 'self_employed' | 'ofw' | 'displaced';
export type WorkerScenario = 'loans' | 'maternity' | 'sickness' | 'unemployment' | 'wages' | 'livelihood' | 'funeral';

export interface WorkerProfileInput {
  sector: WorkerSector;
  scenario: WorkerScenario;
  monthlySalary: number;
  averageMonthlySalaryCredit: number;
  highestSixMonthlySalaryCredit: number;
  funeralAverageMonthlySalaryCredit: number;
  unemploymentAverageMonthlySalaryCredit: number;
  contributionMonths: number;
  recentContributionMonths: number;
  qualifyingBenefitContributions: number;
  unemploymentRecentContributions: number;
  age: number;
  pagibigContributionMonths: number;
  pagibigRecentContribution: boolean;
  pagibigTAV: number;
  pagibigOutstandingLoan: number;
  sssOutstandingLoan: number;
  sssCalamityOutstandingLoan: number;
  ofwSeaBased?: boolean;
  loanProratedDays: number;
  hadRecentCondonation: boolean;
  hasPastDueLoan: boolean;
  employerRemittancesCurrent: boolean;
  calamityDeclared: boolean;
  maternityType: 'live_birth' | 'solo_parent' | 'miscarriage';
  employerDifferentialExempt: boolean;
  sicknessDays: number;
  sickLeaveExhausted: boolean;
  isWorkRelated: boolean;
  hasPermanentDisability: boolean;
  approvedECMedicalReimbursement: number;
  involuntarilySeparated: boolean;
  unemploymentClaimWithinThreeYears: boolean;
  gsisPermanent: boolean;
  gsisNetTakeHomePay: number;
  gsisOutstandingLoan: number;
  gsisLoanTermYears: number;
  gsisAdvanceInsuranceMonths?: number;
  gsisEmergencyRenewal: boolean;
  gsisEmergencyOutstanding: number;
  contingencyDate: string;
  regionalDailyWage: number;
  tupadDays: number;
  owwaMembership: 'active' | 'inactive_once' | 'inactive_multiple' | 'none';
  returnedWithinThreeYears: boolean;
}

export interface WorkerProgram {
  id: string;
  name: string;
  agency: string;
  basis: string;
  benefit: string;
  eligibility: string;
  checklist: string[];
  source: string;
  verifiedOn: string;
}

export interface WorkerAgencyContact {
  name: string;
  services: string;
  hotline: string;
  url: string;
  officeUrl: string;
}

export interface LoanInstallment { month: number; payment: number; interest: number; principal: number; balance: number }
export interface LoanEstimate {
  id: string;
  name: string;
  grossPrincipal: number;
  serviceFee: number;
  advanceInterest: number;
  insurance: number;
  offset: number;
  netProceeds: number;
  annualRate: number;
  effectiveAnnualRate: number;
  monthlyAmortization: number;
  termMonths: number;
  graceMonths: number;
  note: string;
  schedule: LoanInstallment[];
}

export interface WorkerCalculationResult {
  loans: LoanEstimate[];
  maternity: { days: number; averageDailySalaryCredit: number; sssBenefit: number; fullPayEquivalent: number; employerSalaryDifferential: number; governmentPaidLeave: number };
  sickness: { days: number; sssDaily: number; sssBenefit: number; ecDaily: number; ecBenefit: number; ecMedicalReimbursement: number; ecCarerMonthly: number; combinedBenefit: number };
  unemploymentBenefit: number;
  funeral: { regularBenefit: number; ecBenefit: number; combinedBenefit: number };
  livelihood: { tupadEstimate: number; bpbhGrant: number };
  matchedPrograms: WorkerProgram[];
  consolidatedChecklist: string[];
  advisories: string[];
}
