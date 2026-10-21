import type { ApplicationRecord, Language } from '../types/assistance.ts';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function calculateGrantedGLTotal(
  applications: Pick<ApplicationRecord, 'status' | 'amountGranted'>[]
): number {
  return applications.reduce((total, application) => {
    if (application.status !== 'gl_issued' && application.status !== 'claimed') return total;
    const amount = application.amountGranted;
    return typeof amount === 'number' && Number.isFinite(amount)
      ? total + Math.max(0, amount)
      : total;
  }, 0);
}

export function calculateNetDeficit(
  netRemainingBalance: number,
  applications: Pick<ApplicationRecord, 'status' | 'amountGranted'>[]
): number {
  const balance = Number.isFinite(netRemainingBalance) ? Math.max(0, netRemainingBalance) : 0;
  return Math.max(0, balance - calculateGrantedGLTotal(applications));
}

export function lguLetterBalanceDisclosure(
  language: Language,
  remainingDeficit: number,
  totalGrantedGLs: number
): string {
  const formatCurrency = (value: number) => {
    const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
    return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
  };
  const deficit = formatCurrency(remainingDeficit);
  const granted = Number.isFinite(totalGrantedGLs) ? Math.max(0, totalGrantedGLs) : 0;

  if (language === 'taglish') {
    return granted > 0
      ? `Ang kasalukuyang natitirang deficit matapos ibawas ang mga naitalang aprubadong GL ay ${deficit}. Mayroon na pong naunang naaprubahang Guarantee Letter mula sa ibang ahensya na may kabuuang halagang ${formatCurrency(granted)}; ibinawas na ito sa pagkalkula ng natitirang deficit.`
      : `Ang buong natitirang bill matapos ang mga naitalang deduction ay ${deficit}.`;
  }

  if (language === 'cebuano') {
    return granted > 0
      ? `Ang nahibiling kakulangan sa bayronon human ibawas ang mga na-record nga gi-aprubahang GL kay ${deficit}. Narekord na ug naapil sa pagkwenta ang naunang gi-aprubahang Guarantee Letter gikan sa laing ahensiya nga mokabat og ${formatCurrency(granted)}.`
      : `Ang nahibiling bayronon sa ospital human sa mga na-record nga bawas kay ${deficit}.`;
  }

  if (language === 'ilocano') {
    return granted > 0
      ? `Ti nabati a kulang ti bayad kalpasan nga naikkat dagiti nairekord a naaprubahan a GL ket ${deficit}. Nairekord ken naikuyog iti panangkwenta ti naudi a kulang ti naipalubos a Guarantee Letter manipud iti sabali nga ahensia a gatadna ket ${formatCurrency(granted)}.`
      : `Ti nabati a bill ti ospital kalpasan dagiti nairekord nga ikkat ket ${deficit}.`;
  }

  return granted > 0
    ? `The current remaining deficit after recorded approved GLs is ${deficit}. Previously approved Guarantee Letter assistance totaling ${formatCurrency(granted)} from another agency has already been recorded and deducted when calculating this deficit.`
    : `The full remaining hospital balance after recorded deductions is ${deficit}.`;
}

export function reapplicationReminderText(daysLeft: number, language: Language): string {
  const days = Number.isFinite(daysLeft) ? Math.max(0, Math.ceil(daysLeft)) : 0;
  if (days === 0) {
    switch (language) {
      case 'taglish': return 'Natapos ang reminder; kumpirmahin sa ahensya bago mag-reapply';
      case 'cebuano': return 'Human na ang pahinumdom. Palihog kumpirmaha sa ahensiya sa dili pa mag-aplay pag-usab.';
      case 'ilocano': return 'Nalpasen ti palagip. Pangngaasi a kumpirmaem iti ahensia sakbay ti panagaplay manen.';
      case 'en': return 'Reminder reached: confirm reapplication with agency';
    }
  }

  switch (language) {
    case 'taglish': return `Re-apply sa ${days} araw`;
    case 'cebuano': return `Pag-aplay pag-usab human sa ${days} ka adlaw`;
    case 'ilocano': return `Agaplay manen kalpasan ti ${days} nga aldaw`;
    case 'en': return `Reapply in ${days} days`;
  }
}

export function formatDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateString: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match || !Number.isInteger(days)) return '';

  const [, yearString, monthString, dayString] = match;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function defaultApplicationDeadline(
  agencyId: ApplicationRecord['agencyId'],
  submissionDate: string
): Pick<ApplicationRecord, 'glValidUntil' | 'canReapplyDate'> {
  if (agencyId === 'pcso_map') {
    return { glValidUntil: addDaysToDate(submissionDate, 30) };
  }

  if (
    agencyId === 'senate_assist' ||
    agencyId === 'dswd_aics' ||
    agencyId === 'pace_op' ||
    agencyId === 'lgu_congressional'
  ) {
    return { canReapplyDate: addDaysToDate(submissionDate, 90) };
  }

  return {};
}

export function daysUntilDate(targetDate: string, today = formatDateInput()): number {
  const target = addDaysToDate(targetDate, 0);
  const current = addDaysToDate(today, 0);
  if (!target || !current) return 0;
  return (Date.parse(`${target}T00:00:00Z`) - Date.parse(`${current}T00:00:00Z`)) / DAY_IN_MS;
}
