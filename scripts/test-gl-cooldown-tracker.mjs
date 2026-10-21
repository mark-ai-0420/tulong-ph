import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToDate,
  calculateGrantedGLTotal,
  calculateNetDeficit,
  daysUntilDate,
  defaultApplicationDeadline,
  lguLetterBalanceDisclosure,
  reapplicationReminderText,
} from '../src/lib/glTracking.ts';

test('live deficit sums only issued and claimed GLs and never drops below zero', () => {
  const applications = [
    { status: 'submitted', amountGranted: 5000 },
    { status: 'processing', amountGranted: 7000 },
    { status: 'rejected', amountGranted: 9000 },
    { status: 'gl_issued', amountGranted: 12000 },
    { status: 'claimed', amountGranted: 8000 },
  ];

  assert.equal(calculateGrantedGLTotal(applications), 20000);
  assert.equal(calculateNetDeficit(50000, applications), 30000);
  assert.equal(calculateNetDeficit(0, applications), 0);
  assert.equal(calculateNetDeficit(15000, applications), 0);
});

test('no GLs and invalid or negative granted amounts leave the initial balance unchanged', () => {
  assert.equal(calculateGrantedGLTotal([]), 0);
  assert.equal(calculateNetDeficit(42000, []), 42000);
  assert.equal(calculateNetDeficit(42000, [
    { status: 'gl_issued', amountGranted: -5000 },
    { status: 'claimed', amountGranted: Number.NaN },
  ]), 42000);
  assert.equal(calculateNetDeficit(-10, []), 0);
});

test('default tracking deadlines add 30 days for PCSO and 90 days for re-application reminders', () => {
  const filingDate = '2026-01-15';
  assert.deepEqual(defaultApplicationDeadline('pcso_map', filingDate), { glValidUntil: '2026-02-14' });
  for (const agency of ['senate_assist', 'dswd_aics', 'pace_op', 'lgu_congressional']) {
    assert.deepEqual(defaultApplicationDeadline(agency, filingDate), { canReapplyDate: '2026-04-15' });
  }
  assert.deepEqual(defaultApplicationDeadline('doh_malasakit', filingDate), {});
  assert.equal(addDaysToDate('2024-02-01', 30), '2024-03-02');
});

test('countdown returns positive, same-day zero, and negative days', () => {
  assert.equal(daysUntilDate('2026-01-06', '2026-01-01'), 5);
  assert.equal(daysUntilDate('2026-01-01', '2026-01-01'), 0);
  assert.equal(daysUntilDate('2025-12-31', '2026-01-01'), -1);
});

test('re-application reminders ask families to confirm with the agency once reached', () => {
  for (const daysLeft of [0, -1]) {
    assert.equal(
      reapplicationReminderText(daysLeft, 'taglish'),
      'Natapos ang reminder; kumpirmahin sa ahensya bago mag-reapply'
    );
    assert.equal(
      reapplicationReminderText(daysLeft, 'en'),
      'Reminder reached: confirm reapplication with agency'
    );
  }
  assert.equal(reapplicationReminderText(4, 'taglish'), 'Re-apply sa 4 araw');
  assert.equal(reapplicationReminderText(4, 'en'), 'Reapply in 4 days');
});

test('LGU letter disclosures show remaining deficit and prior approved GL coverage in both languages', () => {
  const applications = [
    { status: 'gl_issued', amountGranted: 12000 },
    { status: 'claimed', amountGranted: 8000 },
  ];
  const totalGrantedGLs = calculateGrantedGLTotal(applications);
  const remainingDeficit = calculateNetDeficit(50000, applications);

  assert.equal(remainingDeficit, 30000);
  assert.equal(
    lguLetterBalanceDisclosure('taglish', remainingDeficit, totalGrantedGLs),
    'Ang kasalukuyang natitirang deficit matapos ibawas ang mga naitalang aprubadong GL ay ₱30,000. Mayroon na pong naunang naaprubahang Guarantee Letter mula sa ibang ahensya na may kabuuang halagang ₱20,000; ibinawas na ito sa pagkalkula ng natitirang deficit.'
  );
  assert.equal(
    lguLetterBalanceDisclosure('en', remainingDeficit, totalGrantedGLs),
    'The current remaining deficit after recorded approved GLs is ₱30,000. Previously approved Guarantee Letter assistance totaling ₱20,000 from another agency has already been recorded and deducted when calculating this deficit.'
  );
});

test('LGU letter disclosures show the full remaining balance when no GL has been issued', () => {
  const applications = [
    { status: 'submitted', amountGranted: 12000 },
    { status: 'processing', amountGranted: 8000 },
  ];
  const totalGrantedGLs = calculateGrantedGLTotal(applications);
  const remainingDeficit = calculateNetDeficit(50000, applications);

  assert.equal(totalGrantedGLs, 0);
  assert.equal(remainingDeficit, 50000);
  assert.equal(
    lguLetterBalanceDisclosure('taglish', remainingDeficit, totalGrantedGLs),
    'Ang buong natitirang bill matapos ang mga naitalang deduction ay ₱50,000.'
  );
  assert.equal(
    lguLetterBalanceDisclosure('en', remainingDeficit, totalGrantedGLs),
    'The full remaining hospital balance after recorded deductions is ₱50,000.'
  );
});
