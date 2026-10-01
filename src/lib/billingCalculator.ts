import type { EmergencyCategory, HospitalType } from '../types/assistance';
import { matchPhilHealthCaseRate } from './data/philhealthRates.ts';

export interface CalculationInput {
  totalBill: number;
  hospitalType: HospitalType;
  isSeniorCitizen: boolean;
  isPWD: boolean;
  patientAge?: number;
  diagnosis?: string;
  category?: EmergencyCategory;
}

export interface DetailedBillBreakdown {
  totalBill: number;
  isSeniorOrPwdApplied: boolean;
  vatExemptSales: number;
  vatAmountRemoved: number;
  seniorPwdDiscountAmount: number;
  totalSeniorPwdRelief: number;
  balanceAfterSeniorPwd: number;
  philhealthDeductionAmount: number;
  philhealthMatchedCondition?: string;
  isPhilhealthEstimated: boolean;
  netRemainingBalance: number;
  isNoBalanceBillingEligible: boolean;
}

/**
 * Calculates hospital bill statutory deductions in the exact mandatory legal order:
 * 1. Senior Citizen / PWD 12% VAT exemption (private hospitals only, per RA 9994 / RA 10754)
 * 2. Senior Citizen / PWD 20% discount on VAT-exempt base
 * 3. PhilHealth All Case Rate (ACR) deduction capped at remaining balance
 * 4. Net remaining balance for Government Guarantee Letters (GL) / Charity Stacking
 * 5. Public DOH No Balance Billing (NBB) eligibility check
 */
export function calculateHospitalBill(input: CalculationInput): DetailedBillBreakdown {
  const rawBill = Number(input.totalBill) || 0;
  const totalBill = Math.max(0, Math.round(rawBill * 100) / 100);

  const isSeniorOrPwdApplied = Boolean(
    input.isSeniorCitizen ||
      input.isPWD ||
      (typeof input.patientAge === 'number' && input.patientAge >= 60)
  );

  let vatExemptSales = totalBill;
  let vatAmountRemoved = 0;
  let seniorPwdDiscountAmount = 0;
  let totalSeniorPwdRelief = 0;

  if (totalBill > 0 && isSeniorOrPwdApplied) {
    if (input.hospitalType === 'private') {
      // In private hospitals, standard bills are 12% VAT inclusive.
      // Under RA 9994 & RA 10754:
      // 1. Strip the 12% VAT to get VAT-exempt sales base
      vatExemptSales = Math.round((totalBill / 1.12) * 100) / 100;
      vatAmountRemoved = Math.round((totalBill - vatExemptSales) * 100) / 100;

      // 2. Compute 20% discount on the VAT-exempt sales base
      seniorPwdDiscountAmount = Math.round((vatExemptSales * 0.2) * 100) / 100;

      // 3. Total relief is the sum of VAT eliminated + 20% discount
      totalSeniorPwdRelief = Math.round((vatAmountRemoved + seniorPwdDiscountAmount) * 100) / 100;
    } else {
      // In public (DOH and LGU) hospitals, government services are non-VATable.
      // Full 20% discount applies directly to the hospital bill.
      vatExemptSales = totalBill;
      vatAmountRemoved = 0;
      seniorPwdDiscountAmount = Math.round((totalBill * 0.2) * 100) / 100;
      totalSeniorPwdRelief = seniorPwdDiscountAmount;
    }
  }

  // Balance after statutory Senior/PWD relief
  const balanceAfterSeniorPwd = Math.max(
    0,
    Math.round((totalBill - totalSeniorPwdRelief) * 100) / 100
  );

  // PhilHealth Case Rate matching
  const match = matchPhilHealthCaseRate(input.diagnosis, input.category, totalBill);
  const rawPhilHealthRate = match.rate;

  // PhilHealth deduction is capped at the balance remaining after Senior/PWD relief
  const philhealthDeductionAmount = Math.min(rawPhilHealthRate, balanceAfterSeniorPwd);

  // Net remaining balance (subject to Guarantee Letter / Malasakit Center / PCSO / DSWD)
  const netRemainingBalance = Math.max(
    0,
    Math.round((balanceAfterSeniorPwd - philhealthDeductionAmount) * 100) / 100
  );

  // Under Universal Health Care Act & PhilHealth Circular 2017-0017:
  // Indigents, Seniors, PWDs, and Sponsored members admitted to Ward Accommodation
  // in DOH-retained hospitals enjoy the No Balance Billing (NBB) policy.
  const isNoBalanceBillingEligible =
    input.hospitalType === 'public_doh' && isSeniorOrPwdApplied;

  return {
    totalBill,
    isSeniorOrPwdApplied,
    vatExemptSales,
    vatAmountRemoved,
    seniorPwdDiscountAmount,
    totalSeniorPwdRelief,
    balanceAfterSeniorPwd,
    philhealthDeductionAmount,
    philhealthMatchedCondition: match.matchedName,
    isPhilhealthEstimated: match.isEstimated,
    netRemainingBalance,
    isNoBalanceBillingEligible,
  };
}

// Alias for semantic clarity across calculation workflows
export const calculateStatutoryBill = calculateHospitalBill;
export const computeStatutoryDeductions = calculateHospitalBill;
export default calculateHospitalBill;
