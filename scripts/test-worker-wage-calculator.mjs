import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWorkerBenefitsAndLoans, defaultWorkerProfile } from '../src/lib/workerBenefitsCalculator.ts';

const input = overrides => ({
  ...defaultWorkerProfile,
  scenario: 'wages',
  ...overrides,
});

test('pro-rata 13th month pay uses the monthly salary and months worked', () => {
  const result = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 26000, monthsWorkedInCurrentYear: 6 }));
  assert.equal(result.wageClaims.thirteenthMonthPay, 13000);
});

test('daily-paid workers use the daily wage as a monthly equivalent for 13th month and separation pay', () => {
  const result = calculateWorkerBenefitsAndLoans(input({
    monthlySalary: 0,
    regionalDailyWage: 755,
    payrollSchedule: 'six_day_week',
    monthsWorkedInCurrentYear: 6,
    separationCause: 'redundancy',
    yearsOfService: 2,
  }));
  assert.equal(result.wageClaims.dailyWage, 755);
  assert.equal(result.wageClaims.thirteenthMonthPay, 9815);
  assert.equal(result.wageClaims.separationPay, 39260);
});

test('selected payroll schedule controls monthly-to-daily and daily-to-monthly conversion', () => {
  for (const [payrollSchedule, divisor, annualFactor] of [
    ['six_day_week', 26, 313],
    ['five_day_week', 21.75, 261],
    ['monthly_paid', 30.42, 365],
  ]) {
    const dailyPaid = calculateWorkerBenefitsAndLoans(input({
      monthlySalary: 0,
      regionalDailyWage: 1000,
      payrollSchedule,
      monthsWorkedInCurrentYear: 12,
      separationCause: 'redundancy',
      yearsOfService: 1,
    }));
    assert.equal(dailyPaid.wageClaims.dailyWage, 1000);
    assert.equal(dailyPaid.wageClaims.thirteenthMonthPay, 1000 * divisor);
    assert.equal(dailyPaid.wageClaims.separationPay, 1000 * divisor);
    assert.match(dailyPaid.wageClaims.breakdownItems[0].basis, new RegExp(`factor ${annualFactor}`));

    const monthlyPaid = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 1000 * divisor, payrollSchedule }));
    assert.equal(monthlyPaid.wageClaims.dailyWage, 1000);
  }
});

test('unused SIL is monetized at the daily wage and capped at five days', () => {
  const result = calculateWorkerBenefitsAndLoans(input({ regionalDailyWage: 755, unusedServiceIncentiveLeaveDays: 6 }));
  assert.equal(result.wageClaims.dailyWage, 755);
  assert.equal(result.wageClaims.monetizedSIL, 3775);
});

test('redundancy separation pay uses one month per year and a one month floor', () => {
  const twoYears = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 20000, separationCause: 'redundancy', yearsOfService: 2 }));
  const minimum = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 20000, separationCause: 'redundancy', yearsOfService: 0 }));
  assert.equal(twoYears.wageClaims.separationPay, 40000);
  assert.equal(minimum.wageClaims.separationPay, 20000);
});

test('retrenchment separation pay uses half a month per year and a one month floor', () => {
  const threeYears = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 20000, separationCause: 'retrenchment_closure', yearsOfService: 3 }));
  const minimum = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 20000, separationCause: 'disease', yearsOfService: 1 }));
  assert.equal(threeYears.wageClaims.separationPay, 30000);
  assert.equal(minimum.wageClaims.separationPay, 20000);
});

test('a service fraction of at least six months counts as a full year', () => {
  const result = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 20000, separationCause: 'redundancy', yearsOfService: 1.6 }));
  assert.equal(result.wageClaims.separationPay, 40000);
  assert.match(result.wageClaims.formattedSummary, /Statutory Separation Pay \(2 years/);
});

test('unpaid overtime and regular holiday pay use their stated rates', () => {
  const result = calculateWorkerBenefitsAndLoans(input({ monthlySalary: 26000, unpaidOvertimeHours: 2, unpaidHolidayDays: 1 }));
  assert.equal(result.wageClaims.dailyWage, 1000);
  assert.equal(result.wageClaims.overtimePay, 312.5);
  assert.equal(result.wageClaims.holidayPay, 1000);
  assert.equal(result.wageClaims.totalClaim, 1312.5);
});

test('negative and non-finite inputs become zero and extreme claims remain bounded', () => {
  const invalid = calculateWorkerBenefitsAndLoans(input({
    monthlySalary: -26000,
    unpaidDays: Number.NaN,
    monthsWorkedInCurrentYear: Number.POSITIVE_INFINITY,
    unusedServiceIncentiveLeaveDays: -5,
    separationCause: 'redundancy',
    yearsOfService: Number.NaN,
    unpaidOvertimeHours: -2,
    unpaidHolidayDays: Number.NaN,
  }));
  assert.equal(invalid.wageClaims.totalClaim, 0);
  assert.ok(Object.values(invalid.wageClaims).filter(value => typeof value === 'number').every(Number.isFinite));

  const extreme = calculateWorkerBenefitsAndLoans(input({
    monthlySalary: 26000,
    unpaidDays: Number.MAX_VALUE,
    monthsWorkedInCurrentYear: Number.MAX_VALUE,
    unusedServiceIncentiveLeaveDays: Number.MAX_VALUE,
    separationCause: 'redundancy',
    yearsOfService: Number.MAX_VALUE,
    unpaidOvertimeHours: Number.MAX_VALUE,
    unpaidHolidayDays: Number.MAX_VALUE,
  }));
  assert.ok(extreme.wageClaims.totalClaim <= 1_000_000_000);
  assert.ok(Object.values(extreme.wageClaims).filter(value => typeof value === 'number').every(Number.isFinite));
});
