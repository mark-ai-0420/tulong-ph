import type { Language } from '@/types/assistance';

export type TreatmentCategory = 'hemodialysis' | 'peritoneal_dialysis' | 'chemotherapy';

export interface TreatmentSessionEntry {
  id: string;
  date: string;
  facility: string;
  notes: string;
}

export interface TreatmentSessionTracker {
  category: TreatmentCategory;
  year: number;
  annualQuota: number | null;
  sessionsCompleted: number;
  weeklyCadence: 2 | 3;
  glValidUntil?: string;
  entries: TreatmentSessionEntry[];
}

export interface TreatmentQuotaCalculation {
  sessionsCompleted: number;
  annualQuota: number | null;
  annualRemaining: number | null;
  percentUsed: number | null;
  projectedExhaustionDate: string | null;
  glDaysRemaining: number | null;
  isLowQuotaWarning: boolean;
  isExhausted: boolean;
  isGlExpiringSoon: boolean;
  isGlExpired: boolean;
  alertAdvice: {
    lowQuota: Record<Language, string>;
    exhausted: Record<Language, string>;
    glExpiringSoon: Record<Language, string>;
    glExpired: Record<Language, string>;
  };
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function localDateIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? timestamp
    : null;
}

function addDays(dateIso: string, days: number): string | null {
  const timestamp = validDate(dateIso);
  if (timestamp === null) return null;
  return new Date(timestamp + days * DAY_IN_MS).toISOString().slice(0, 10);
}

function advice(remaining: number): TreatmentQuotaCalculation['alertAdvice'] {
  return {
    lowQuota: {
      taglish: `${remaining} o mas kaunti na lang ang natitirang session. Magtanong sa hospital social worker tungkol sa susunod na hakbang at posibleng tulong.`,
      cebuano: `${remaining} o mas gamay na lang ang nahibiling session. Pangutana sa social worker sa ospital bahin sa sunod nga lakang ug posibleng tabang.`,
      ilocano: `${remaining} wenno basbassit ti nabati a session. Agdamag iti social worker ti ospital maipanggep iti sumaruno a tukad ken mabalin a tulong.`,
      en: `${remaining} or fewer sessions remain. Ask the hospital social worker about next steps and possible assistance.`,
    },
    exhausted: {
      taglish: 'Wala nang natitirang session sa naka-save na annual quota. Ipa-check sa treatment facility ang kasalukuyang benepisyo at mga susunod na opsyon.',
      cebuano: 'Wala nay nahibiling session sa natipig nga tinuig nga quota. Ipatan-aw sa treatment facility ang kasamtangang benepisyo ug sunod nga mga opsyon.',
      ilocano: 'Awanen ti nabati a session iti naidulin a quota iti tawen. Pasingkedan iti treatment facility dagiti agdama a benepisio ken sumaruno a pagpilian.',
      en: 'No sessions remain in the saved annual quota. Ask the treatment facility to confirm current benefits and next options.',
    },
    glExpiringSoon: {
      taglish: 'Malapit nang mag-expire ang nakatalang Guarantee Letter. Tawagan ang nag-isyu na ahensya o pasilidad para kumpirmahin ang renewal steps.',
      cebuano: 'Duol na matapos ang validity sa natala nga Guarantee Letter. Kontaka ang ahensiya o pasilidad nga nag-isyu aron kumpirmahon ang paagi sa pag-renew.',
      ilocano: 'Asidegen a maibus ti validity ti nairekord a Guarantee Letter. Kontaken ti ahensia wenno pasilidad a nangipaay tapno mapasingked dagiti addang iti panag-renew.',
      en: 'The recorded Guarantee Letter is nearing expiration. Contact the issuing agency or facility to confirm renewal steps.',
    },
    glExpired: {
      taglish: 'Nag-expire na ang nakatalang Guarantee Letter. Kumpirmahin sa nag-isyu na ahensya o pasilidad kung kailangan ng bagong sulat.',
      cebuano: 'Nahuman na ang validity sa natala nga Guarantee Letter. Kumpirmaha sa ahensiya o pasilidad nga nag-isyu kon kinahanglan og bag-ong sulat.',
      ilocano: 'Napaayen ti validity ti nairekord a Guarantee Letter. Pasingkedan iti nangipaay nga ahensia wenno pasilidad no kasapulan ti baro a surat.',
      en: 'The recorded Guarantee Letter has expired. Confirm with the issuing agency or facility whether a new letter is needed.',
    },
  };
}

export function calculateTreatmentQuota(
  tracker: TreatmentSessionTracker,
  todayIso = localDateIso(),
): TreatmentQuotaCalculation {
  const quota = typeof tracker.annualQuota === 'number' && Number.isFinite(tracker.annualQuota)
    ? Math.max(0, Math.floor(tracker.annualQuota))
    : null;
  const sessionsCompleted = Number.isFinite(tracker.sessionsCompleted)
    ? Math.max(0, Math.floor(tracker.sessionsCompleted))
    : 0;
  const annualRemaining = quota === null ? null : Math.max(0, quota - sessionsCompleted);
  const percentUsed = quota === null
    ? null
    : quota === 0 ? 0 : Math.min(100, Math.round((sessionsCompleted / quota) * 1000) / 10);
  const today = validDate(todayIso);
  const glDate = tracker.glValidUntil ? validDate(tracker.glValidUntil) : null;
  const glDaysRemaining = today === null || glDate === null
    ? null
    : Math.round((glDate - today) / DAY_IN_MS);
  const cadence = tracker.weeklyCadence === 2 ? 2 : 3;
  const daysUntilExhaustion = annualRemaining !== null && annualRemaining > 0
    ? Math.ceil((annualRemaining / cadence) * 7)
    : null;

  return {
    sessionsCompleted,
    annualQuota: quota,
    annualRemaining,
    percentUsed,
    projectedExhaustionDate: daysUntilExhaustion === null ? null : addDays(todayIso, daysUntilExhaustion),
    glDaysRemaining,
    isLowQuotaWarning: annualRemaining !== null && annualRemaining <= 12 && annualRemaining > 0,
    isExhausted: annualRemaining === 0,
    isGlExpiringSoon: glDaysRemaining !== null && glDaysRemaining <= 14 && glDaysRemaining >= 0,
    isGlExpired: glDaysRemaining !== null && glDaysRemaining < 0,
    alertAdvice: advice(annualRemaining ?? 0),
  };
}

export function createDefaultTreatmentTracker(
  category: TreatmentCategory,
  year = new Date().getFullYear(),
): TreatmentSessionTracker {
  const quotas: Record<TreatmentCategory, number | null> = {
    hemodialysis: 156,
    peritoneal_dialysis: null,
    chemotherapy: 12,
  };
  return {
    category,
    year: Number.isInteger(year) ? year : new Date().getFullYear(),
    annualQuota: quotas[category],
    sessionsCompleted: 0,
    weeklyCadence: category === 'chemotherapy' ? 2 : 3,
    entries: [],
  };
}

export function addSessionEntry(
  tracker: TreatmentSessionTracker,
  entry: TreatmentSessionEntry,
): TreatmentSessionTracker {
  return {
    ...tracker,
    sessionsCompleted: Math.max(0, tracker.sessionsCompleted) + 1,
    entries: [...tracker.entries, entry],
  };
}

export function removeSessionEntry(
  tracker: TreatmentSessionTracker,
  entryId: string,
): TreatmentSessionTracker {
  const entries = tracker.entries.filter(entry => entry.id !== entryId);
  const removed = tracker.entries.length - entries.length;
  if (removed === 0) return tracker;
  return {
    ...tracker,
    sessionsCompleted: Math.max(0, tracker.sessionsCompleted - removed),
    entries,
  };
}

export function resetCalendarYear(
  tracker: TreatmentSessionTracker,
  newYear: number,
): TreatmentSessionTracker {
  return {
    ...tracker,
    year: Number.isInteger(newYear) ? newYear : tracker.year,
    sessionsCompleted: 0,
    entries: [],
  };
}
