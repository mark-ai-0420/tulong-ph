'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { AlertCircle, CalendarDays, Clock3, Plus, Trash2 } from 'lucide-react';
import type { Language, MedicalCase } from '@/types/assistance';
import {
  addSessionEntry,
  calculateTreatmentQuota,
  createDefaultTreatmentTracker,
  removeSessionEntry,
  resetCalendarYear,
  type TreatmentCategory,
  type TreatmentSessionTracker,
} from '@/lib/treatmentTracker';
import { formatDateInput } from '@/lib/glTracking';
import { clearTreatmentTracker, loadTreatmentTracker, saveTreatmentTracker } from '@/lib/storage';

interface TreatmentQuotaTrackerCardProps {
  medicalCase?: Pick<MedicalCase, 'category' | 'diagnosis' | 'hospitalName'>;
  language: Language;
  readOnly?: boolean;
}

const COPY: Record<Language, {
  title: string;
  description: string;
  sessions: string;
  completed: string;
  remaining: string;
  noQuota: string;
  continuous: string;
  glActive: string;
  glNoDate: string;
  glExpired: string;
  glDays: string;
  glValidUntil: string;
  cadence: string;
  plannedCycles: string;
  projected: string;
  recordSession: string;
  hideForm: string;
  sessionDate: string;
  facility: string;
  notes: string;
  save: string;
  cancel: string;
  remove: string;
  noEntries: string;
  reset: string;
  resetDisabled: string;
  storageError: string;
  required: string;
  sessionYearError: (year: number) => string;
  privateNote: string;
  confirmReset: (year: number) => string;
  category: Record<TreatmentCategory, string>;
}> = {
  taglish: {
    title: 'Treatment Session Tracker',
    description: 'I-save sa device ang treatment dates at bilang. Kumpirmahin ang coverage at quota sa inyong facility.',
    sessions: 'sessions', completed: 'Nagamit', remaining: 'Natitira', noQuota: 'Walang annual session quota na itinakda',
    continuous: 'Tuluy-tuloy na regimen', glActive: 'Active', glNoDate: 'Walang GL date', glExpired: 'Expired',
    glDays: 'araw na lang', glValidUntil: 'Valid ang GL hanggang', cadence: 'Sessions kada linggo',
    plannedCycles: 'Planned chemo cycles', projected: 'Tantiyang mauubos', recordSession: '+ Itala ang Session',
    hideForm: 'Itago ang form', sessionDate: 'Petsa ng session', facility: 'Pasilidad / ospital', notes: 'Notes (opsyonal)',
    save: 'I-save ang session', cancel: 'Kanselahin', remove: 'Alisin ang session', noEntries: 'Wala pang naitatalang session.',
    reset: 'Reset para sa Bagong Taon', resetDisabled: 'Magiging available kapag nagpalit na ang taon.',
    storageError: 'Hindi na-save ang pagbabago sa device. Subukang muli.', required: 'Ilagay ang petsa at pasilidad.',
    sessionYearError: year => `Dapat nasa taong ${year} ang petsa ng session. Kung bagong cycle ito, gamitin ang "Bagong Taon" / Reset para sa Bagong Taon.`,
    privateNote: 'Nananatili sa browser na ito ang mga rekord na ito.',
    confirmReset: year => `I-reset ang bilang at alisin ang mga session entry para sa ${year}? Hindi ito mababawi.`,
    category: { hemodialysis: 'Hemodialysis', peritoneal_dialysis: 'Peritoneal dialysis', chemotherapy: 'Chemotherapy' },
  },
  cebuano: {
    title: 'Talaan sa Treatment Session',
    description: 'I-save sa device ang mga petsa ug ihap sa treatment. Kumpirmaha ang coverage ug quota sa inyong pasilidad.',
    sessions: 'session', completed: 'Nagamit', remaining: 'Nahibilin', noQuota: 'Walay gitakdang tinuig nga session quota',
    continuous: 'Padayon nga regimen', glActive: 'Aktibo', glNoDate: 'Walay petsa sa GL', glExpired: 'Expired',
    glDays: 'ka adlaw na lang', glValidUntil: 'Balido ang GL hangtod', cadence: 'Session kada semana',
    plannedCycles: 'Giplanong chemo cycles', projected: 'Gibanabanang mahurot', recordSession: '+ Itala ang Session',
    hideForm: 'Itago ang form', sessionDate: 'Petsa sa session', facility: 'Pasilidad / ospital', notes: 'Mga nota (opsyonal)',
    save: 'I-save ang session', cancel: 'Kanselahon', remove: 'Tangtanga ang session', noEntries: 'Wala pay natala nga session.',
    reset: 'I-reset para sa Bag-ong Tuig', resetDisabled: 'Magamit kini kon mausab na ang tuig.',
    storageError: 'Wala na-save ang kausaban sa device. Sulayi pag-usab.', required: 'Ibutang ang petsa ug pasilidad.',
    sessionYearError: year => `Kinahanglan ang petsa sa session naa sa tuig ${year}. Kung bag-ong cycle kini, gamita ang "Bagong Taon" / I-reset para sa Bag-ong Tuig.`,
    privateNote: 'Magpabilin kining mga rekord sa browser nga imong gigamit.',
    confirmReset: year => `I-reset ang ihap ug tangtangon ang mga entry sa session para sa ${year}? Dili na kini mabawi.`,
    category: { hemodialysis: 'Hemodialysis', peritoneal_dialysis: 'Peritoneal dialysis', chemotherapy: 'Chemotherapy' },
  },
  ilocano: {
    title: 'Pagilasinan ti Treatment Session',
    description: 'Idulin ditoy device dagiti petsa ken bilang ti treatment. Pasingkedan ti coverage ken quota iti pasilidad.',
    sessions: 'session', completed: 'Nausar', remaining: 'Nabati', noQuota: 'Awan ti naituding a quota ti session iti tawen',
    continuous: 'Agtultuloy a regimen', glActive: 'Aktibo', glNoDate: 'Awan ti petsa ti GL', glExpired: 'Napaayen',
    glDays: 'nga aldaw pay', glValidUntil: 'Valid ti GL agingga', cadence: 'Session iti tunggal lawas',
    plannedCycles: 'Naplano a chemo cycles', projected: 'Pakaammo a maibus', recordSession: '+ Itala ti Session',
    hideForm: 'Ilemmeng ti form', sessionDate: 'Petsa ti session', facility: 'Pasilidad / ospital', notes: 'Nota (opsyonal)',
    save: 'Idulin ti session', cancel: 'Ikkaten', remove: 'Ikkaten ti session', noEntries: 'Awan pay ti nairekord a session.',
    reset: 'I-reset para iti Baro a Tawen', resetDisabled: 'Magun-odan daytoy kalpasan ti panagbalbaliw ti tawen.',
    storageError: 'Saan a naidulin ti panagbalbaliw ditoy device. Padasen manen.', required: 'Iserrek ti petsa ken pasilidad.',
    sessionYearError: year => `Masapul a ti petsa ti session ket adda iti tawen ${year}. No baro a cycle daytoy, usaren ti "Bagong Taon" / I-reset para iti Baro a Tawen.`,
    privateNote: 'Dagitoy a rekord ket agtalinaed iti daytoy a browser.',
    confirmReset: year => `I-reset ti bilang ken ikkaten dagiti entry ti session para iti ${year}? Saanen a maisubli daytoy.`,
    category: { hemodialysis: 'Hemodialysis', peritoneal_dialysis: 'Peritoneal dialysis', chemotherapy: 'Chemotherapy' },
  },
  en: {
    title: 'Treatment Session Tracker',
    description: 'Save treatment dates and counts on this device. Confirm coverage and quota with your facility.',
    sessions: 'sessions', completed: 'Used', remaining: 'Remaining', noQuota: 'No annual session quota is set',
    continuous: 'Continuous regimen', glActive: 'Active', glNoDate: 'No GL date', glExpired: 'Expired',
    glDays: 'days left', glValidUntil: 'GL valid until', cadence: 'Sessions per week',
    plannedCycles: 'Planned chemo cycles', projected: 'Estimated exhaustion', recordSession: '+ Record a Session',
    hideForm: 'Hide form', sessionDate: 'Session date', facility: 'Facility / hospital', notes: 'Notes (optional)',
    save: 'Save session', cancel: 'Cancel', remove: 'Remove session', noEntries: 'No sessions recorded yet.',
    reset: 'Reset for New Year', resetDisabled: 'Available after the calendar year changes.',
    storageError: 'The change was not saved on this device. Try again.', required: 'Enter a date and facility.',
    sessionYearError: year => `The session date must be in ${year}. Use "Reset for New Year" if you are starting a new cycle.`,
    privateNote: 'These records stay in this browser.',
    confirmReset: year => `Reset the count and remove session entries for ${year}? This cannot be undone.`,
    category: { hemodialysis: 'Hemodialysis', peritoneal_dialysis: 'Peritoneal dialysis', chemotherapy: 'Chemotherapy' },
  },
};

function inferCategory(medicalCase?: Pick<MedicalCase, 'category' | 'diagnosis'>): TreatmentCategory | undefined {
  const diagnosis = medicalCase?.diagnosis ?? '';
  if (medicalCase?.category === 'dialysis') {
    return /\b(peritoneal dialysis|capd|apd|pd first)\b/i.test(diagnosis) ? 'peritoneal_dialysis' : 'hemodialysis';
  }
  if (medicalCase?.category === 'chemotherapy') return 'chemotherapy';
  if (/\b(dialysis|hemodialysis|haemodialysis|capd|apd)\b/i.test(diagnosis)) {
    return /\b(peritoneal dialysis|capd|apd|pd first)\b/i.test(diagnosis) ? 'peritoneal_dialysis' : 'hemodialysis';
  }
  if (/\b(chemotherapy|chemo)\b/i.test(diagnosis)) return 'chemotherapy';
  return undefined;
}

function displayDate(date: string, language: Language): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (!Number.isFinite(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(language === 'taglish' ? 'fil-PH' : language === 'cebuano' ? 'ceb-PH' : language === 'ilocano' ? 'ilo-PH' : 'en-PH', {
    dateStyle: 'medium',
  }).format(parsed);
}

export function TreatmentQuotaTrackerCard({ medicalCase, language, readOnly = false }: TreatmentQuotaTrackerCardProps) {
  const copy = COPY[language];
  const id = useId();
  const requestedCategory = inferCategory(medicalCase);
  const [tracker, setTracker] = useState<TreatmentSessionTracker | null>(null);
  const [loadedCategory, setLoadedCategory] = useState<TreatmentCategory | null>();
  const [formOpen, setFormOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(formatDateInput());
  const [entryFacility, setEntryFacility] = useState(medicalCase?.hospitalName ?? '');
  const [entryNotes, setEntryNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    void loadTreatmentTracker().then(saved => {
      if (!active) return;
      const matchesCategory = saved && requestedCategory && saved.category !== requestedCategory;
      setTracker(matchesCategory
        ? createDefaultTreatmentTracker(requestedCategory)
        : saved ?? (requestedCategory ? createDefaultTreatmentTracker(requestedCategory) : null));
      setLoadedCategory(requestedCategory ?? null);
    }).catch(() => {
      if (active) {
        setTracker(requestedCategory ? createDefaultTreatmentTracker(requestedCategory) : null);
        setLoadedCategory(requestedCategory ?? null);
      }
    });
    return () => { active = false; };
  }, [requestedCategory]);

  const persist = (next: TreatmentSessionTracker | null) => {
    if (readOnly) return;
    setTracker(next);
    setStorageError(false);
    const save = next ? saveTreatmentTracker(next) : clearTreatmentTracker();
    void save.catch(() => setStorageError(true));
  };

  if (loadedCategory !== (requestedCategory ?? null) || !tracker) return null;

  const calculation = calculateTreatmentQuota(tracker);
  const todayYear = new Date().getFullYear();
  const resetYear = todayYear > tracker.year ? todayYear : tracker.year;
  const glStatus = calculation.isGlExpired
    ? copy.glExpired
    : calculation.isGlExpiringSoon
      ? `${calculation.glDaysRemaining} ${copy.glDays}`
      : tracker.glValidUntil ? copy.glActive : copy.glNoDate;
  const isCritical = calculation.isGlExpired || calculation.isExhausted;
  const orderedEntries = [...tracker.entries].sort((first, second) => second.date.localeCompare(first.date));

  const save = (next: TreatmentSessionTracker) => persist(next);
  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entryDate || !entryFacility.trim()) {
      setFormError(copy.required);
      return;
    }
    if (!entryDate.startsWith(String(tracker.year))) {
      setFormError(copy.sessionYearError(tracker.year));
      return;
    }
    const next = addSessionEntry(tracker, {
      id: crypto.randomUUID(),
      date: entryDate,
      facility: entryFacility.trim().slice(0, 200),
      notes: entryNotes.trim().slice(0, 2_000),
    });
    save(next);
    setEntryNotes('');
    setFormError('');
    setFormOpen(false);
  };

  const handleReset = () => {
    if (resetYear <= tracker.year || !window.confirm(copy.confirmReset(resetYear))) return;
    save(resetCalendarYear(tracker, resetYear));
  };

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4 rounded-2xl border border-[#E2DFD6] bg-white p-4 sm:p-5 shadow-xs print:break-inside-avoid print:border-slate-500 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id={`${id}-title`} className="text-base font-bold text-slate-900">{copy.title}</h2>
          <p className="text-xs leading-relaxed text-slate-600">{copy.category[tracker.category]} · {tracker.year}</p>
          <p className="text-xs leading-relaxed text-slate-600">{copy.description}</p>
        </div>
        {tracker.annualQuota === null ? (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-950">{copy.continuous}</span>
        ) : (
          <span className={`rounded-full border px-3 py-2 text-xs font-bold ${calculation.isExhausted ? 'border-red-200 bg-red-50 text-red-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>
            {calculation.annualRemaining} {copy.remaining.toLowerCase()}
          </span>
        )}
      </header>

      {tracker.annualQuota !== null ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-lg tabular-nums text-slate-900">
              {calculation.sessionsCompleted} / {calculation.annualQuota} {copy.sessions}
            </strong>
            <span className="text-xs font-semibold text-slate-700">{copy.remaining}: {calculation.annualRemaining}</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${copy.completed} / ${copy.sessions}`}
            aria-valuemin={0}
            aria-valuemax={tracker.annualQuota}
            aria-valuenow={Math.min(calculation.sessionsCompleted, tracker.annualQuota)}
            aria-valuetext={`${calculation.sessionsCompleted} / ${tracker.annualQuota} ${copy.sessions}`}
            className="h-3 overflow-hidden rounded-full bg-slate-100"
          >
            <div className={`h-full rounded-full ${calculation.isExhausted ? 'bg-red-600' : calculation.isLowQuotaWarning ? 'bg-amber-600' : 'bg-blue-900'}`} style={{ width: `${calculation.percentUsed ?? 0}%` }} />
          </div>
          <p className="text-xs text-slate-600">{copy.completed}: {calculation.percentUsed ?? 0}%</p>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800">{copy.noQuota}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800">
          <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-900" />
          <span>{copy.glValidUntil}: <strong>{tracker.glValidUntil ? displayDate(tracker.glValidUntil, language) : copy.glNoDate}</strong></span>
          <span className={`ml-auto rounded-full border px-2 py-1 text-xs font-bold ${isCritical ? 'border-red-200 bg-red-50 text-red-950' : calculation.isGlExpiringSoon ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>
            {glStatus}
          </span>
        </div>
        {!readOnly && (
          <label htmlFor={`${id}-gl-valid`} className="block text-xs font-bold text-slate-800">
            {copy.glValidUntil}
            <input
              autoComplete="off"
              id={`${id}-gl-valid`}
              name="glValidUntil"
              type="date"
              value={tracker.glValidUntil ?? ''}
              onChange={event => save({ ...tracker, glValidUntil: event.target.value || undefined })}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
            />
          </label>
        )}
      </div>

      {tracker.annualQuota !== null && (
        <div className="grid gap-3 sm:grid-cols-2">
          {readOnly ? (
            <p className="text-xs font-bold text-slate-800">{copy.cadence}: <strong>{tracker.weeklyCadence}</strong></p>
          ) : (
            <label htmlFor={`${id}-cadence`} className="block text-xs font-bold text-slate-800">
              {copy.cadence}
              <select
                autoComplete="off"
                id={`${id}-cadence`}
                name="weeklyCadence"
                value={tracker.weeklyCadence}
                onChange={event => save({ ...tracker, weeklyCadence: Number(event.target.value) as 2 | 3 })}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
          )}
          {tracker.category === 'chemotherapy' && (
            readOnly ? (
              <p className="text-xs font-bold text-slate-800">{copy.plannedCycles}: <strong>{tracker.annualQuota}</strong></p>
            ) : (
              <label htmlFor={`${id}-quota`} className="block text-xs font-bold text-slate-800">
                {copy.plannedCycles}
                <input
                  autoComplete="off"
                  id={`${id}-quota`}
                  name="annualQuota"
                  type="number"
                  min={1}
                  max={100_000}
                  step={1}
                  value={tracker.annualQuota}
                  onChange={event => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 1 && value <= 100_000) save({ ...tracker, annualQuota: value });
                  }}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
                />
              </label>
            )
          )}
          {calculation.projectedExhaustionDate && (
            <p className="flex min-h-[44px] items-center gap-2 text-xs text-slate-700 sm:col-span-2">
              <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
              {copy.projected}: <strong>{displayDate(calculation.projectedExhaustionDate, language)}</strong>
            </p>
          )}
        </div>
      )}

      {calculation.isLowQuotaWarning && (
        <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 print:bg-white print:text-slate-900">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{calculation.alertAdvice.lowQuota[language]}</p>
        </div>
      )}
      {calculation.isExhausted && (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-950 print:bg-white print:text-slate-900">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{calculation.alertAdvice.exhausted[language]}</p>
        </div>
      )}
      {calculation.isGlExpiringSoon && (
        <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 print:bg-white print:text-slate-900">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{calculation.alertAdvice.glExpiringSoon[language]}</p>
        </div>
      )}
      {calculation.isGlExpired && (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-950 print:bg-white print:text-slate-900">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{calculation.alertAdvice.glExpired[language]}</p>
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={() => setFormOpen(open => !open)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 print:hidden"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {formOpen ? copy.hideForm : copy.recordSession}
        </button>
      )}

      {!readOnly && formOpen && (
        <form autoComplete="off" onSubmit={handleAdd} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 print:hidden">
          <label htmlFor={`${id}-entry-date`} className="block text-xs font-bold text-slate-800">
            {copy.sessionDate}
            <input autoComplete="off" id={`${id}-entry-date`} name="sessionDate" type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium" />
          </label>
          <label htmlFor={`${id}-facility`} className="block text-xs font-bold text-slate-800">
            {copy.facility}
            <input autoComplete="off" id={`${id}-facility`} name="facility" type="text" maxLength={200} value={entryFacility} onChange={event => setEntryFacility(event.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium" />
          </label>
          <label htmlFor={`${id}-notes`} className="block text-xs font-bold text-slate-800 sm:col-span-2">
            {copy.notes}
            <textarea autoComplete="off" id={`${id}-notes`} name="notes" maxLength={2_000} value={entryNotes} onChange={event => setEntryNotes(event.target.value)} rows={3} className="mt-1 min-h-[88px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium" />
          </label>
          {formError && <p role="alert" className="text-sm font-semibold text-red-800 sm:col-span-2">{formError}</p>}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="min-h-[44px] rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white">{copy.save}</button>
            <button type="button" onClick={() => { setFormOpen(false); setFormError(''); }} className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">{copy.cancel}</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900">{copy.completed}: {tracker.sessionsCompleted}</h3>
        {orderedEntries.length === 0 ? (
          <p className="text-xs text-slate-600">{copy.noEntries}</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {orderedEntries.map(entry => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-slate-900">{displayDate(entry.date, language)} · {entry.facility}</p>
                  {entry.notes && <p className="text-xs text-slate-600 print:hidden">{entry.notes}</p>}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => save(removeSessionEntry(tracker, entry.id))}
                    aria-label={`${copy.remove}: ${entry.facility}, ${displayDate(entry.date, language)}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-red-50 hover:text-red-800 print:hidden"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 print:hidden">
          <button type="button" onClick={handleReset} disabled={resetYear <= tracker.year} className="min-h-[44px] rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            {copy.reset}
          </button>
          {resetYear <= tracker.year && <span className="text-xs text-slate-600">{copy.resetDisabled}</span>}
        </div>
      )}
      {storageError && <p role="alert" className="text-sm font-semibold text-red-800">{copy.storageError}</p>}
      <p className="text-xs text-slate-600">{copy.privateNote}</p>
    </section>
  );
}
