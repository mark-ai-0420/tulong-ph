'use client';

import React, { useId, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { ApplicationRecord, Language, MedicalCase } from '@/types/assistance';
import {
  calculateGrantedGLTotal,
  calculateNetDeficit,
  defaultApplicationDeadline,
  daysUntilDate,
  formatDateInput,
  reapplicationReminderText,
} from '@/lib/glTracking';

interface GLCooldownTrackerCardProps {
  medicalCase: MedicalCase;
  applications?: ApplicationRecord[];
  onSaveApplications?: (applications: ApplicationRecord[]) => void;
  language: Language;
  defaultAgencyId?: ApplicationRecord['agencyId'];
}

type TrackerForm = {
  agencyId: ApplicationRecord['agencyId'];
  referenceNumber: string;
  submissionDate: string;
  status: ApplicationRecord['status'];
  amountGranted: string;
  deadlineDate: string;
};

const AGENCIES: { id: ApplicationRecord['agencyId']; label: string; badge: string }[] = [
  { id: 'pcso_map', label: 'PCSO Medical Assistance Program (MAP)', badge: 'PCSO' },
  { id: 'senate_assist', label: 'Senate Public Assistance', badge: 'Senate' },
  { id: 'dswd_aics', label: 'DSWD Assistance to Individuals in Crisis Situations (AICS)', badge: 'DSWD' },
  { id: 'doh_malasakit', label: 'DOH-MAIP (Malasakit Center)', badge: 'DOH-MAIP' },
  { id: 'pace_op', label: 'Office of the President (PACe)', badge: 'OP PACe' },
  { id: 'lgu_congressional', label: 'Mayor / Governor / Congressional District', badge: 'LGU / Congressional' },
];

const STATUSES: ApplicationRecord['status'][] = [
  'draft',
  'submitted',
  'processing',
  'gl_issued',
  'claimed',
  'rejected',
];

const STATUS_STYLES: Record<ApplicationRecord['status'], string> = {
  draft: 'bg-slate-100 text-slate-800 border-slate-300',
  submitted: 'bg-blue-50 text-blue-950 border-blue-200',
  processing: 'bg-amber-50 text-amber-950 border-amber-200',
  gl_issued: 'bg-emerald-50 text-emerald-950 border-emerald-200',
  claimed: 'bg-teal-50 text-teal-950 border-teal-200',
  rejected: 'bg-red-50 text-red-950 border-red-200',
};

function createForm(
  agencyId: ApplicationRecord['agencyId'],
  record?: ApplicationRecord
): TrackerForm {
  const submissionDate = record?.submissionDate || formatDateInput();
  const defaults = defaultApplicationDeadline(agencyId, submissionDate);
  const deadlineDate = agencyId === 'pcso_map'
    ? record?.glValidUntil || defaults.glValidUntil || ''
    : record?.canReapplyDate || defaults.canReapplyDate || '';

  return {
    agencyId,
    referenceNumber: record?.referenceNumber || '',
    submissionDate,
    status: record?.status || 'submitted',
    amountGranted: record?.amountGranted === undefined ? '' : String(record.amountGranted),
    deadlineDate,
  };
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
}

function formatDisplayDate(dateString: string, language: Language): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return language === 'taglish' ? 'Walang petsa' : 'No date recorded';
  return new Intl.DateTimeFormat(language === 'taglish' ? 'fil-PH' : 'en-PH', {
    dateStyle: 'medium',
  }).format(date);
}

function agencyFor(id: ApplicationRecord['agencyId']) {
  return AGENCIES.find((agency) => agency.id === id) || AGENCIES[0];
}

function getDeadline(record: ApplicationRecord): { date?: string; isPcso: boolean } {
  if (record.agencyId === 'doh_malasakit') return { isPcso: false };
  const defaults = defaultApplicationDeadline(record.agencyId, record.submissionDate);
  if (record.agencyId === 'pcso_map') {
    return { date: record.glValidUntil || defaults.glValidUntil, isPcso: true };
  }
  return { date: record.canReapplyDate || defaults.canReapplyDate, isPcso: false };
}

function deadlineLabel(record: ApplicationRecord, language: Language): { text: string; className: string } {
  const deadline = getDeadline(record);
  if (!deadline.date) {
    return {
      text: language === 'taglish' ? 'Kumpirmahin sa ahensya' : 'Confirm with agency',
      className: 'bg-slate-100 text-slate-800 border-slate-300',
    };
  }

  const daysLeft = daysUntilDate(deadline.date);
  if (deadline.isPcso) {
    if (daysLeft < 0) {
      return {
        text: language === 'taglish' ? 'Nag-expire na ang GL' : 'GL expired',
        className: 'bg-red-50 text-red-950 border-red-200',
      };
    }
    return {
      text: daysLeft === 0
        ? (language === 'taglish' ? 'GL expires today' : 'GL expires today')
        : (language === 'taglish' ? `GL expires in ${daysLeft} araw` : `GL expires in ${daysLeft} days`),
      className: daysLeft <= 5
        ? 'bg-amber-50 text-amber-950 border-amber-200'
        : 'bg-blue-50 text-blue-950 border-blue-200',
    };
  }

  if (daysLeft <= 0) {
    return {
      text: reapplicationReminderText(daysLeft, language),
      className: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    };
  }
  return {
    text: reapplicationReminderText(daysLeft, language),
    className: daysLeft <= 5
      ? 'bg-amber-50 text-amber-950 border-amber-200'
      : 'bg-blue-50 text-blue-950 border-blue-200',
  };
}

export const GLCooldownTrackerCard: React.FC<GLCooldownTrackerCardProps> = ({
  medicalCase,
  applications = [],
  onSaveApplications,
  language,
  defaultAgencyId = 'pcso_map',
}) => {
  const trackerId = useId().replace(/:/g, '');
  const isTl = language === 'taglish';
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TrackerForm>(() => createForm(defaultAgencyId));
  const totalGranted = calculateGrantedGLTotal(applications);
  const netDeficit = calculateNetDeficit(medicalCase.netRemainingBalance, applications);
  const initialBalance = Math.max(0, Number.isFinite(medicalCase.netRemainingBalance) ? medicalCase.netRemainingBalance : 0);
  const coveragePercent = initialBalance === 0 ? 100 : Math.min(100, (totalGranted / initialBalance) * 100);

  const setAgency = (agencyId: ApplicationRecord['agencyId']) => {
    const defaults = defaultApplicationDeadline(agencyId, form.submissionDate);
    setForm({
      ...form,
      agencyId,
      deadlineDate: agencyId === 'pcso_map'
        ? defaults.glValidUntil || ''
        : defaults.canReapplyDate || '',
    });
  };

  const setSubmissionDate = (submissionDate: string) => {
    const defaults = defaultApplicationDeadline(form.agencyId, submissionDate);
    setForm({
      ...form,
      submissionDate,
      deadlineDate: form.agencyId === 'pcso_map'
        ? defaults.glValidUntil || ''
        : defaults.canReapplyDate || '',
    });
  };

  const saveForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSaveApplications || !form.submissionDate) return;

    const amount = form.amountGranted.trim() ? Number(form.amountGranted) : undefined;
    const commonFields: ApplicationRecord = {
      id: editingId || `${form.agencyId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agencyId: form.agencyId,
      referenceNumber: form.referenceNumber.trim(),
      submissionDate: form.submissionDate,
      status: form.status,
      amountGranted: form.status === 'gl_issued' || form.status === 'claimed' ? amount : undefined,
      glValidUntil: form.agencyId === 'pcso_map' ? form.deadlineDate || undefined : undefined,
      canReapplyDate: form.agencyId !== 'pcso_map' && form.agencyId !== 'doh_malasakit'
        ? form.deadlineDate || undefined
        : undefined,
    };
    const existing = applications.find((application) => application.id === editingId);
    const record = existing ? { ...existing, ...commonFields } : commonFields;
    const updatedApplications = existing
      ? applications.map((application) => application.id === editingId ? record : application)
      : [...applications, record];

    onSaveApplications(updatedApplications);
    setEditingId(null);
    setIsAdding(false);
    setForm(createForm(defaultAgencyId));
  };

  const editRecord = (record: ApplicationRecord) => {
    setIsAdding(false);
    setEditingId(record.id);
    setForm(createForm(record.agencyId, record));
  };

  const deleteRecord = (recordId: string) => {
    onSaveApplications?.(applications.filter((application) => application.id !== recordId));
    if (editingId === recordId) setEditingId(null);
  };

  const renderEditor = (idPrefix: string, allowAgencyChange: boolean) => (
    <form autoComplete="off" onSubmit={saveForm} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200 pt-4">
      {allowAgencyChange && (
        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-agency`} className="mb-1.5 block text-xs font-bold text-slate-800">
            {isTl ? 'Ahensyang hiningan ng tulong' : 'Assistance agency'}
          </label>
          <select
            id={`${idPrefix}-agency`}
            autoComplete="off"
            value={form.agencyId}
            onChange={(event) => setAgency(event.target.value as ApplicationRecord['agencyId'])}
            className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900"
          >
            {AGENCIES.map((agency) => <option key={agency.id} value={agency.id}>{agency.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={`${idPrefix}-reference`} className="mb-1.5 block text-xs font-bold text-slate-800">
          {isTl ? 'Reference / Control Number' : 'Reference / Control Number'}
        </label>
        <input
          id={`${idPrefix}-reference`}
          autoComplete="off"
          value={form.referenceNumber}
          onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}
          maxLength={80}
          className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-filing-date`} className="mb-1.5 block text-xs font-bold text-slate-800">
          {isTl ? 'Petsa ng paghahain' : 'Filing date'}
        </label>
        <input
          id={`${idPrefix}-filing-date`}
          type="date"
          autoComplete="off"
          required
          value={form.submissionDate}
          onChange={(event) => setSubmissionDate(event.target.value)}
          className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-status`} className="mb-1.5 block text-xs font-bold text-slate-800">
          {isTl ? 'Katayuan' : 'Status'}
        </label>
        <select
          id={`${idPrefix}-status`}
          autoComplete="off"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value as ApplicationRecord['status'] })}
          className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900"
        >
          {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
        </select>
      </div>
      {(form.status === 'gl_issued' || form.status === 'claimed') && (
        <div>
          <label htmlFor={`${idPrefix}-amount`} className="mb-1.5 block text-xs font-bold text-slate-800">
            {isTl ? 'Halagang ipinagkaloob (₱)' : 'Granted amount (₱)'}
          </label>
          <input
            id={`${idPrefix}-amount`}
            type="number"
            autoComplete="off"
            min="0.01"
            step="0.01"
            required
            value={form.amountGranted}
            onChange={(event) => setForm({ ...form, amountGranted: event.target.value })}
            className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900"
          />
        </div>
      )}
      {form.agencyId !== 'doh_malasakit' && (
        <div>
          <label htmlFor={`${idPrefix}-deadline`} className="mb-1.5 block text-xs font-bold text-slate-800">
            {form.agencyId === 'pcso_map'
              ? (isTl ? 'GL expiry date' : 'GL expiry date')
              : (isTl ? 'Petsa ng muling pag-apply' : 'Re-application date')}
          </label>
          <input
            id={`${idPrefix}-deadline`}
            type="date"
            autoComplete="off"
            required
            value={form.deadlineDate}
            onChange={(event) => setForm({ ...form, deadlineDate: event.target.value })}
            className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900"
          />
        </div>
      )}
      <div className="sm:col-span-2 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!onSaveApplications}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          {editingId ? (isTl ? 'I-save ang pagbabago' : 'Save changes') : (isTl ? 'Idagdag sa tracker' : 'Add to tracker')}
        </button>
        <button
          type="button"
          onClick={() => { setEditingId(null); setIsAdding(false); setForm(createForm(defaultAgencyId)); }}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
          {isTl ? 'Kanselahin' : 'Cancel'}
        </button>
      </div>
    </form>
  );

  return (
    <section className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-4 shadow-xs sm:p-6" aria-labelledby={`${trackerId}-title`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-blue-900 text-white">
          <Landmark className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={`${trackerId}-title`} className="text-lg font-bold text-slate-900 sm:text-xl">
            {isTl ? 'Tagasubaybay ng mga GL at Tulong' : 'Guarantee Letter (GL) & Assistance Tracker'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {isTl
              ? 'Itala ang iba’t ibang aplikasyon at GL, tingnan ang natitirang bill, at bantayan ang expiry o susunod na petsa ng pag-apply.'
              : 'Track applications and issued GLs, review the remaining bill, and watch expiry or re-application dates.'}
          </p>
          <p className="mt-1 text-xs font-semibold text-blue-900">
            {isTl ? 'Naka-save sa device na ito' : 'Saved on this device'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-live="polite">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-xs font-bold text-slate-600">{isTl ? 'Net Initial Hospital Bill' : 'Net Initial Hospital Bill'}</p>
          <p className="mt-1 break-words text-lg font-bold tabular-nums text-slate-900">{formatCurrency(initialBalance)}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <p className="text-xs font-bold text-emerald-950">{isTl ? 'Kabuuang na-grant na GL' : 'Total Granted GLs'}</p>
          <p className="mt-1 break-words text-lg font-bold tabular-nums text-emerald-950">{formatCurrency(totalGranted)}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <p className="text-xs font-bold text-amber-950">{isTl ? 'Kasalukuyang net deficit' : 'Current Net Deficit'}</p>
          <p className="mt-1 break-words text-lg font-bold tabular-nums text-amber-950">{formatCurrency(netDeficit)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-3.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-800">{isTl ? 'Bahaging natakpan ng mga na-isyu na GL' : 'Bill covered by issued GLs'}</p>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-950">
            {Math.round(coveragePercent)}%
          </span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={isTl ? 'Bahagi ng bill na natakpan ng GL' : 'Bill coverage from granted GLs'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(coveragePercent)}
        >
          <div className="h-full rounded-full bg-emerald-700 transition-[width]" style={{ width: `${coveragePercent}%` }} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">
          {isTl ? `Mga aplikasyon at GL (${applications.length})` : `Applications and GLs (${applications.length})`}
        </h3>
        <button
          type="button"
          onClick={() => { setEditingId(null); setForm(createForm(defaultAgencyId)); setIsAdding(!isAdding); }}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-blue-950 hover:bg-blue-100"
        >
          <Plus className="h-4 w-4" />
          {isAdding ? (isTl ? 'Isara ang form' : 'Close form') : (isTl ? 'Magdagdag ng aplikasyon' : 'Add application')}
        </button>
      </div>

      <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <span>
          {isTl
            ? 'Paalala lamang ang mga default na petsa. Gamitin ang petsang nakasulat sa GL o kumpirmahin ang patakaran sa ahensya.'
            : 'Default dates are reminders. Use the expiry date printed on the GL or confirm the current rule with the agency.'}
        </span>
      </p>

      {applications.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          {isTl ? 'Wala pang nakatalang aplikasyon. Idagdag ang unang record para masubaybayan ang mga GL.' : 'No applications recorded yet. Add the first record to track your GLs.'}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {applications.map((record) => {
            const agency = agencyFor(record.agencyId);
            const deadline = getDeadline(record);
            const countdown = deadlineLabel(record, language);
            const granted = record.status === 'gl_issued' || record.status === 'claimed';
            return (
              <article key={record.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800">
                        <Building2 className="h-4 w-4" aria-hidden="true" /> {agency.badge}
                      </span>
                      <span className={`inline-flex min-h-[32px] items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[record.status]}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${countdown.className}`}>
                        <Clock3 className="h-4 w-4" aria-hidden="true" /> {countdown.text}
                      </span>
                    </div>
                    <p className="break-words text-sm font-bold text-slate-900">
                      <FileText className="mr-1 inline h-4 w-4 text-slate-500" aria-hidden="true" />
                      {record.referenceNumber || (isTl ? 'Walang reference number' : 'No reference number')}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-600">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {isTl ? 'Inihain:' : 'Filed:'} {formatDisplayDate(record.submissionDate, language)}
                      {deadline.date && <span>· {isTl ? 'Deadline:' : 'Deadline:'} {formatDisplayDate(deadline.date, language)}</span>}
                    </p>
                    {granted && (
                      <p className="text-sm font-bold text-emerald-800">
                        {isTl ? 'Ipinagkaloob:' : 'Granted:'} {record.amountGranted === undefined ? (isTl ? 'Hindi pa naitala' : 'Not recorded') : formatCurrency(Math.max(0, record.amountGranted))}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => editRecord(record)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                      aria-label={`${isTl ? 'I-edit' : 'Edit'} ${agency.badge}`}
                    >
                      <Pencil className="h-4 w-4" /> {isTl ? 'Edit' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      disabled={!onSaveApplications}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-950 hover:bg-red-100 disabled:opacity-50"
                      aria-label={`${isTl ? 'Burahin' : 'Delete'} ${agency.badge}`}
                    >
                      <Trash2 className="h-4 w-4" /> {isTl ? 'Burahin' : 'Delete'}
                    </button>
                  </div>
                </div>
                {editingId === record.id && renderEditor(`${trackerId}-edit-${record.id}`, true)}
              </article>
            );
          })}
        </div>
      )}

      {isAdding && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 sm:p-4">
          <h4 className="text-sm font-bold text-slate-900">{isTl ? 'Bagong application record' : 'New application record'}</h4>
          {renderEditor(`${trackerId}-new-application`, true)}
        </div>
      )}
    </section>
  );
};
