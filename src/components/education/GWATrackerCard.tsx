'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language } from '@/lib/i18n';
import {
  calculateStipendSummary,
  evaluateRetentionStatus,
  formatGradeDisplay,
  normalizeGWAToPercentage,
  type AcademicTermRecord,
  type DisbursementStatus,
  type GradingScale,
  type GWATrackerRecord,
  type ScholarshipProgramId,
} from '@/lib/gwaTracker';
import { clearGWATracker, loadGWATracker, saveGWATracker } from '@/lib/storage';

interface Props { language?: Language }

interface TermForm {
  academicYear: string;
  semester: AcademicTermRecord['semester'];
  gradingScale: GradingScale;
  rawGWA: string;
  unitsEnrolled: string;
  unitsPassed: string;
  hasFailingGrade: boolean;
  programId: ScholarshipProgramId;
  programName: string;
  expectedStipend: string;
  receivedStipend: string;
  dateDisbursed: string;
  notes: string;
}

const blankForm: TermForm = {
  academicYear: '', semester: '1st', gradingScale: 'percentage', rawGWA: '',
  unitsEnrolled: '', unitsPassed: '', hasFailingGrade: false, programId: 'ched-cmsp-full',
  programName: '', expectedStipend: '35000', receivedStipend: '0', dateDisbursed: '', notes: '',
};

const copy = {
  taglish: {
    title: 'GWA Retention at Stipend Tracker', description: 'I-record ang bawat semestre at ikumpara ang inaasahan at natanggap na stipend. Gabay lang ang thresholds; sundin ang award notice at kumpirmahin sa ahensya.',
    cumulative: 'Cumulative normalized GWA', latest: 'Status ng pinakahuling term', empty: 'Magdagdag ng term para makita ang GWA at stipend history.',
    expected: 'Inaasahan', received: 'Natanggap', deficit: 'Kulang pa', progress: 'Bahagi ng inaasahang stipend na natanggap', add: 'Magdagdag ng semestre', edit: 'I-edit', remove: 'Burahin',
    termHistory: 'Kasaysayan ng semestre', formAdd: 'Bagong academic term', formEdit: 'I-edit ang academic term', cancel: 'Kanselahin', save: 'I-save ang term', saving: 'Sine-save...',
    year: 'Academic year', semester: 'Semester', scale: 'Grading scale', grade: 'GWA o grade', enrolled: 'Units enrolled', passed: 'Units passed', failing: 'May failing grade',
    program: 'Scholarship program', customProgram: 'Pangalan ng programa', expectedField: 'Inaasahang stipend (PHP)', receivedField: 'Natanggap na stipend (PHP)', statusField: 'Disbursement status', date: 'Petsa ng huling disbursement', notes: 'Notes',
    yearHint: 'Hal. AY 2026-2027', noProgramName: 'Optional na pangalan kung custom ang programa', awardNotice: 'Prefill lang ang halaga. I-edit ayon sa iyong award notice.',
    validation: 'Suriin ang academic year, grade, units, at halaga. Dapat pasado ang units ay hindi lalampas sa enrolled units.', loadError: 'Hindi mabasa ang lokal na tracker. Subukan muling buksan ang pahina.', saveError: 'Hindi na-save ang term sa device. Subukan muli.',
    deleteConfirm: 'Burahin ang rekord na ito ng semestre?', pending: 'Pending', partial: 'Partial', disbursed: 'Disbursed', retained: 'Retained', warning: 'Warning', atRisk: 'At Risk',
    yearShort: 'AY', units: 'Units passed / enrolled', normalize: 'Normalized',
    semesters: { '1st': '1st semester', '2nd': '2nd semester', summer: 'Summer', midyear: 'Midyear' },
    scales: { percentage: 'Percentage (0 to 100)', one_to_five: '1.0 to 5.0 scale', four_point: '4.0 scale' },
    programs: { 'ched-cmsp-full': 'CHED CMSP Full', 'ched-cmsp-half': 'CHED CMSP Half', 'dost-sei': 'DOST-SEI', 'pca-coscho': 'PCA CoScho', 'ched-tes': 'CHED TES', 'lgu-iskolar': 'LGU Iskolar', custom: 'Custom program' },
  },
  cebuano: {
    title: 'GWA ug Stipend Tracker', description: 'Irekord ang matag semestre ug itandi ang gipaabot ug nadawat nga stipend. Giya lamang ang thresholds; sunda ang award notice ug kumpirmaha sa ahensya.',
    cumulative: 'Cumulative normalized GWA', latest: 'Status sa pinakabag-ong term', empty: 'Pagdugang og term aron makita ang GWA ug stipend history.',
    expected: 'Gipaabot', received: 'Nadawat', deficit: 'Kulang pa', progress: 'Bahín sa gipaabot nga stipend nga nadawat', add: 'Pagdugang og semestre', edit: 'Usba', remove: 'Tangtanga',
    termHistory: 'Kasaysayan sa semestre', formAdd: 'Bag-ong academic term', formEdit: 'Usba ang academic term', cancel: 'Kanselahon', save: 'I-save ang term', saving: 'Nag-save...',
    year: 'Academic year', semester: 'Semester', scale: 'Grading scale', grade: 'GWA o grado', enrolled: 'Units enrolled', passed: 'Units passed', failing: 'Adunay failing grade',
    program: 'Scholarship program', customProgram: 'Ngalan sa programa', expectedField: 'Gipaabot nga stipend (PHP)', receivedField: 'Nadawat nga stipend (PHP)', statusField: 'Disbursement status', date: 'Petsa sa kataposang disbursement', notes: 'Notes',
    yearHint: 'Pananglitan AY 2026-2027', noProgramName: 'Opsyonal nga ngalan kon custom ang programa', awardNotice: 'Prefill lamang ang kantidad. Usba sumala sa imong award notice.',
    validation: 'Susiha ang academic year, grado, units, ug kantidad. Dili molapas ang units passed sa enrolled units.', loadError: 'Dili mabasa ang lokal nga tracker. Ablihi pag-usab ang panid.', saveError: 'Wala ma-save ang term sa device. Sulayi pag-usab.',
    deleteConfirm: 'Tangtangon kining rekord sa semestre?', pending: 'Pending', partial: 'Partial', disbursed: 'Disbursed', retained: 'Retained', warning: 'Warning', atRisk: 'At Risk',
    yearShort: 'AY', units: 'Units passed / enrolled', normalize: 'Normalized',
    semesters: { '1st': '1st semester', '2nd': '2nd semester', summer: 'Summer', midyear: 'Midyear' },
    scales: { percentage: 'Percentage (0 to 100)', one_to_five: '1.0 to 5.0 scale', four_point: '4.0 scale' },
    programs: { 'ched-cmsp-full': 'CHED CMSP Full', 'ched-cmsp-half': 'CHED CMSP Half', 'dost-sei': 'DOST-SEI', 'pca-coscho': 'PCA CoScho', 'ched-tes': 'CHED TES', 'lgu-iskolar': 'LGU Iskolar', custom: 'Custom program' },
  },
  ilocano: {
    title: 'GWA ken Stipend Tracker', description: 'Itala ti tunggal semestre ken idilig ti namnamaen ken naawat a stipend. Giya laeng dagiti threshold; suroten ti award notice ken pasingkedan iti ahensya.',
    cumulative: 'Cumulative normalized GWA', latest: 'Kasasaad ti kabaruan a term', empty: 'Manginayon ti term tapno makita ti GWA ken stipend history.',
    expected: 'Namnamaen', received: 'Naawat', deficit: 'Akurang pay', progress: 'Paset ti namnamaen a stipend a naawat', add: 'Manginayon ti semestre', edit: 'Baliwan', remove: 'Punasen',
    termHistory: 'Pakasaritaan dagiti semestre', formAdd: 'Baro nga academic term', formEdit: 'Baliwan ti academic term', cancel: 'Ikkaten', save: 'Idulin ti term', saving: 'I-idulin...',
    year: 'Academic year', semester: 'Semester', scale: 'Grading scale', grade: 'GWA wenno grado', enrolled: 'Units enrolled', passed: 'Units passed', failing: 'Adda bagsak a grado',
    program: 'Scholarship program', customProgram: 'Nagan ti programa', expectedField: 'Namnamaen a stipend (PHP)', receivedField: 'Naawat a stipend (PHP)', statusField: 'Disbursement status', date: 'Petsa ti maudi a disbursement', notes: 'Notes',
    yearHint: 'Kas pagarigan AY 2026-2027', noProgramName: 'Optional a nagan no custom ti programa', awardNotice: 'Pauna a bilang laeng. Baliwan segun iti award notice.',
    validation: 'Sukimatam ti academic year, grado, units, ken gatad. Saan a lumablabes ti units passed iti enrolled units.', loadError: 'Saan a mabasa ti lokal a tracker. Lukatan manen ti panid.', saveError: 'Saan a naidulin ti term iti device. Padasen manen.',
    deleteConfirm: 'Punasen daytoy a rekord ti semestre?', pending: 'Pending', partial: 'Partial', disbursed: 'Disbursed', retained: 'Retained', warning: 'Warning', atRisk: 'At Risk',
    yearShort: 'AY', units: 'Units passed / enrolled', normalize: 'Normalized',
    semesters: { '1st': '1st semester', '2nd': '2nd semester', summer: 'Summer', midyear: 'Midyear' },
    scales: { percentage: 'Percentage (0 to 100)', one_to_five: '1.0 to 5.0 scale', four_point: '4.0 scale' },
    programs: { 'ched-cmsp-full': 'CHED CMSP Full', 'ched-cmsp-half': 'CHED CMSP Half', 'dost-sei': 'DOST-SEI', 'pca-coscho': 'PCA CoScho', 'ched-tes': 'CHED TES', 'lgu-iskolar': 'LGU Iskolar', custom: 'Custom program' },
  },
  en: {
    title: 'GWA Retention and Stipend Tracker', description: 'Record each semester and compare expected and received stipend. Thresholds are a guide; follow your award notice and confirm with the agency.',
    cumulative: 'Cumulative normalized GWA', latest: 'Latest term status', empty: 'Add a term to see your GWA and stipend history.',
    expected: 'Expected', received: 'Received', deficit: 'Remaining', progress: 'Share of expected stipend received', add: 'Add a semester', edit: 'Edit', remove: 'Delete',
    termHistory: 'Semester history', formAdd: 'New academic term', formEdit: 'Edit academic term', cancel: 'Cancel', save: 'Save term', saving: 'Saving...',
    year: 'Academic year', semester: 'Semester', scale: 'Grading scale', grade: 'GWA or grade', enrolled: 'Units enrolled', passed: 'Units passed', failing: 'Has a failing grade',
    program: 'Scholarship program', customProgram: 'Program name', expectedField: 'Expected stipend (PHP)', receivedField: 'Received stipend (PHP)', statusField: 'Disbursement status', date: 'Last disbursement date', notes: 'Notes',
    yearHint: 'For example, AY 2026-2027', noProgramName: 'Optional name for a custom program', awardNotice: 'Reference prefill only. Edit this to match your award notice.',
    validation: 'Check the academic year, grade, units, and amounts. Units passed cannot exceed units enrolled.', loadError: 'Could not read the local tracker. Reopen this page and try again.', saveError: 'The term was not saved on this device. Try again.',
    deleteConfirm: 'Delete this semester record?', pending: 'Pending', partial: 'Partial', disbursed: 'Disbursed', retained: 'Retained', warning: 'Warning', atRisk: 'At Risk',
    yearShort: 'AY', units: 'Units passed / enrolled', normalize: 'Normalized',
    semesters: { '1st': '1st semester', '2nd': '2nd semester', summer: 'Summer', midyear: 'Midyear' },
    scales: { percentage: 'Percentage (0 to 100)', one_to_five: '1.0 to 5.0 scale', four_point: '4.0 scale' },
    programs: { 'ched-cmsp-full': 'CHED CMSP Full', 'ched-cmsp-half': 'CHED CMSP Half', 'dost-sei': 'DOST-SEI', 'pca-coscho': 'PCA CoScho', 'ched-tes': 'CHED TES', 'lgu-iskolar': 'LGU Iskolar', custom: 'Custom program' },
  },
} satisfies Record<Language, {
  title: string; description: string; cumulative: string; latest: string; empty: string; expected: string; received: string; deficit: string; progress: string;
  add: string; edit: string; remove: string; termHistory: string; formAdd: string; formEdit: string; cancel: string; save: string; saving: string;
  year: string; semester: string; scale: string; grade: string; enrolled: string; passed: string; failing: string; program: string; customProgram: string;
  expectedField: string; receivedField: string; statusField: string; date: string; notes: string; yearHint: string; noProgramName: string; awardNotice: string;
  validation: string; loadError: string; saveError: string; deleteConfirm: string; pending: string; partial: string; disbursed: string; retained: string; warning: string; atRisk: string;
  yearShort: string; units: string; normalize: string;
  semesters: Record<AcademicTermRecord['semester'], string>; scales: Record<GradingScale, string>; programs: Record<ScholarshipProgramId, string>;
}>;

const stipendDefaults: Partial<Record<ScholarshipProgramId, number>> = {
  'ched-cmsp-full': 35_000,
  'ched-cmsp-half': 17_500,
};

const fieldClass = 'h-11 min-h-[44px] w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900';
const buttonClass = 'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-[#D6D3C9] bg-white px-4 py-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900';
const semesterOrder: Record<AcademicTermRecord['semester'], number> = { '1st': 1, '2nd': 2, midyear: 3, summer: 4 };
const money = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `gwa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function currentDisbursementStatus(expected: number, received: number): DisbursementStatus {
  if (received <= 0) return 'pending';
  if (expected <= 0 || received >= expected) return 'disbursed';
  return 'partial';
}

function toForm(record?: AcademicTermRecord): TermForm {
  if (!record) return { ...blankForm };
  return {
    academicYear: record.academicYear, semester: record.semester, gradingScale: record.gradingScale,
    rawGWA: String(record.rawGWA), unitsEnrolled: String(record.unitsEnrolled), unitsPassed: String(record.unitsPassed),
    hasFailingGrade: record.hasFailingGrade, programId: record.programId, programName: record.programName ?? '',
    expectedStipend: String(record.expectedStipend), receivedStipend: String(record.receivedStipend),
    dateDisbursed: record.dateDisbursed ?? '', notes: record.notes ?? '',
  };
}

function number(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function gradeBounds(scale: GradingScale): { min: number; max: number; step: string } {
  if (scale === 'percentage') return { min: 0, max: 100, step: '0.01' };
  if (scale === 'one_to_five') return { min: 1, max: 5, step: '0.01' };
  return { min: 0, max: 4, step: '0.01' };
}

export function GWATrackerCard({ language = 'taglish' }: Props) {
  const t = copy[language];
  const readSequence = useRef(0);
  const loadError = useRef(t.loadError);
  const [records, setRecords] = useState<AcademicTermRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TermForm>({ ...blankForm });
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadError.current = t.loadError;
  }, [t.loadError]);

  useEffect(() => {
    const read = async () => {
      setLoaded(false);
      const sequence = ++readSequence.current;
      try {
        const data = await loadGWATracker();
        if (sequence !== readSequence.current) return;
        setRecords(data?.records ?? []);
        setLoadFailed(false);
        setError('');
      } catch {
        if (sequence !== readSequence.current) return;
        setError(loadError.current);
        setLoadFailed(true);
      } finally {
        if (sequence === readSequence.current) setLoaded(true);
      }
    };
    const clear = () => {
      readSequence.current += 1;
      setRecords([]);
      setLoadFailed(false);
      setLoaded(true);
      setError('');
      setShowForm(false);
      setEditingId(null);
    };
    const refresh = () => { void read(); };
    void read();
    window.addEventListener('tulongph-data-cleared', clear);
    window.addEventListener('tulongph-data-restored', refresh);
    return () => {
      readSequence.current += 1;
      window.removeEventListener('tulongph-data-cleared', clear);
      window.removeEventListener('tulongph-data-restored', refresh);
    };
  }, []);

  const orderedRecords = useMemo(() => [...records].sort((left, right) => {
    const yearDiff = (Number(right.academicYear.match(/\d{4}/)?.[0]) || 0) - (Number(left.academicYear.match(/\d{4}/)?.[0]) || 0);
    return yearDiff || semesterOrder[right.semester] - semesterOrder[left.semester] || right.id.localeCompare(left.id);
  }), [records]);
  const summary = useMemo(() => calculateStipendSummary(records), [records]);
  const latestStatus = orderedRecords[0] ? evaluateRetentionStatus(orderedRecords[0]) : null;
  const percentReceived = summary.totalExpected > 0 ? Math.min(100, summary.totalReceived / summary.totalExpected * 100) : 0;
  const bounds = gradeBounds(form.gradingScale);

  function changeForm<K extends keyof TermForm>(key: K, value: TermForm[K]) {
    if (!loaded || loadFailed || saving) return;
    setForm(current => ({ ...current, [key]: value }));
    setError('');
    setSavedMessage('');
  }

  function changeProgram(programId: ScholarshipProgramId) {
    if (!loaded || loadFailed || saving) return;
    const expected = stipendDefaults[programId] ?? 0;
    setForm(current => ({
      ...current,
      programId,
      programName: programId === 'custom' ? current.programName : '',
      expectedStipend: String(expected),
      receivedStipend: '0',
    }));
    setError('');
    setSavedMessage('');
  }

  async function commitTerm() {
    if (!loaded || loadFailed || saving) return;
    const rawGWA = number(form.rawGWA);
    const unitsEnrolled = number(form.unitsEnrolled);
    const unitsPassed = number(form.unitsPassed);
    const expectedStipend = number(form.expectedStipend);
    const receivedStipend = number(form.receivedStipend);
    let normalizedPercentage: number;
    try {
      if (!form.academicYear.trim() || form.academicYear.length > 40 || rawGWA === null || unitsEnrolled === null || unitsPassed === null
        || expectedStipend === null || receivedStipend === null || unitsEnrolled < 1 || unitsPassed < 0 || unitsPassed > unitsEnrolled
        || !Number.isInteger(unitsEnrolled) || !Number.isInteger(unitsPassed) || expectedStipend < 0 || receivedStipend < 0
        || expectedStipend > 1_000_000_000 || receivedStipend > 1_000_000_000) throw new RangeError();
      normalizedPercentage = normalizeGWAToPercentage(rawGWA, form.gradingScale);
    } catch {
      setError(t.validation);
      return;
    }

    const previous = editingId ? records.find(record => record.id === editingId) : undefined;
    const nextRecord: AcademicTermRecord = {
      id: editingId ?? newId(),
      academicYear: form.academicYear.trim(),
      semester: form.semester,
      rawGWA,
      gradingScale: form.gradingScale,
      normalizedPercentage,
      unitsEnrolled,
      unitsPassed,
      hasFailingGrade: form.hasFailingGrade,
      programId: form.programId,
      ...(form.programName.trim() ? { programName: form.programName.trim().slice(0, 160) } : {}),
      expectedStipend,
      receivedStipend,
      disbursementStatus: currentDisbursementStatus(expectedStipend, receivedStipend),
      ...(form.dateDisbursed ? { dateDisbursed: form.dateDisbursed } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim().slice(0, 2_000) } : {}),
    };
    const next = previous
      ? records.map(record => record.id === previous.id ? nextRecord : record)
      : [...records, nextRecord];
    setSaving(true);
    setError('');
    try {
      const data: GWATrackerRecord = { records: next, updatedAt: new Date().toISOString() };
      await saveGWATracker(data);
      setRecords(next);
      setForm({ ...blankForm });
      setEditingId(null);
      setShowForm(false);
      setSavedMessage(t.save);
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  function editTerm(record: AcademicTermRecord) {
    if (!loaded || loadFailed || saving) return;
    setEditingId(record.id);
    setForm(toForm(record));
    setShowForm(true);
    setError('');
    setSavedMessage('');
  }

  async function deleteTerm(id: string) {
    if (!loaded || loadFailed || saving || !window.confirm(t.deleteConfirm)) return;
    const next = records.filter(record => record.id !== id);
    setSaving(true);
    setError('');
    try {
      if (next.length) await saveGWATracker({ records: next, updatedAt: new Date().toISOString() });
      else await clearGWATracker();
      setRecords(next);
      setSavedMessage(t.save);
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  function startNewTerm() {
    if (!loaded || loadFailed || saving) return;
    setEditingId(null);
    setForm({ ...blankForm });
    setShowForm(true);
    setError('');
    setSavedMessage('');
  }

  function closeForm() {
    if (!loaded || loadFailed || saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm({ ...blankForm });
    setError('');
  }

  const statusLabel = (status: string) => status === 'retained' ? t.retained : status === 'warning' ? t.warning : status === 'at_risk' ? t.atRisk : status === 'partial' ? t.partial : status === 'disbursed' ? t.disbursed : t.pending;
  const statusClass = (status: string) => status === 'retained' || status === 'disbursed'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : status === 'warning' || status === 'partial'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-red-200 bg-red-50 text-red-800';

  return <section className="min-w-0 space-y-4 rounded-2xl border border-[#E2DFD6] bg-white p-4 sm:p-5" aria-labelledby="gwa-tracker-title">
    <header className="min-w-0 space-y-2">
      <h2 id="gwa-tracker-title" className="break-words text-lg font-bold text-slate-900">{t.title}</h2>
      <p className="break-words text-sm leading-relaxed text-slate-600">{t.description}</p>
    </header>

    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <div className="min-w-0 rounded-xl border border-[#E2DFD6] bg-[#FAF9F5] p-4">
        <p className="break-words text-sm font-semibold text-slate-700">{t.cumulative}</p>
        <p className="mt-1 break-words text-2xl font-bold tabular-nums text-slate-900">{summary.cumulativeGWA.toFixed(1)}%</p>
        <p className="mt-2 break-words text-xs text-slate-600">{t.units}: {records.reduce((sum, record) => sum + record.unitsPassed, 0)} / {records.reduce((sum, record) => sum + record.unitsEnrolled, 0)}</p>
      </div>
      <div className="min-w-0 rounded-xl border border-[#E2DFD6] p-4">
        <p className="break-words text-sm font-semibold text-slate-700">{t.latest}</p>
        {latestStatus ? <>
          <span className={`mt-2 inline-flex min-h-[32px] max-w-full items-center break-words rounded-full border px-3 py-1 text-xs font-bold ${statusClass(latestStatus.status)}`}>{statusLabel(latestStatus.status)}</span>
          <p className="mt-2 break-words text-xs leading-relaxed text-slate-600">{latestStatus.explanation[language]}</p>
        </> : <p className="mt-2 break-words text-sm text-slate-600">{t.empty}</p>}
      </div>
    </div>

    <section className="min-w-0 rounded-xl border border-[#E2DFD6] p-4" aria-label={t.progress}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        {[[t.expected, summary.totalExpected], [t.received, summary.totalReceived], [t.deficit, summary.totalDeficit]].map(([label, amount]) => <div key={String(label)} className="min-w-0">
          <p className="break-words text-xs font-semibold text-slate-600">{label}</p>
          <p className="break-words text-base font-bold tabular-nums text-slate-900">{money(Number(amount))}</p>
        </div>)}
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentReceived)}>
        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${percentReceived}%` }} />
      </div>
    </section>

    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <h3 className="break-words text-base font-bold text-slate-900">{t.termHistory}</h3>
      <button type="button" onClick={startNewTerm} disabled={!loaded || loadFailed || saving} className={buttonClass}>+ {t.add}</button>
    </div>

    {savedMessage && <p className="break-words text-sm font-semibold text-emerald-800" role="status">{savedMessage}</p>}
    {error && <p className="break-words text-sm font-semibold text-red-800" role="alert">{error}</p>}
    {!loaded && <p role="status" className="text-sm text-slate-600">{language === 'en' ? 'Loading local tracker...' : language === 'taglish' ? 'Binabasa ang lokal na tracker...' : language === 'cebuano' ? 'Gibasa ang lokal nga tracker...' : 'Basaen ti lokal a tracker...'}</p>}
    {loaded && orderedRecords.length === 0 && <p className="break-words rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">{t.empty}</p>}

    <div className="grid min-w-0 gap-3">
      {orderedRecords.map(record => {
        const retention = evaluateRetentionStatus(record);
        const stipendStatus = statusLabel(record.disbursementStatus);
        const deficit = Math.max(0, record.expectedStipend - record.receivedStipend);
        return <article key={record.id} className="min-w-0 rounded-xl border border-[#E2DFD6] bg-[#FAF9F5] p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="break-words font-bold text-slate-900">{record.academicYear} · {t.semesters[record.semester]}</h4>
              <p className="mt-1 break-words text-sm text-slate-700">{t.programs[record.programId]}{record.programName ? ` · ${record.programName}` : ''}</p>
            </div>
            <span className={`inline-flex min-h-[32px] max-w-full shrink-0 items-center break-words rounded-full border px-3 py-1 text-xs font-bold ${statusClass(retention.status)}`}>{statusLabel(retention.status)}</span>
          </div>
          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p className="min-w-0 break-words"><span className="font-semibold">{t.grade}:</span> {formatGradeDisplay(record.rawGWA, record.gradingScale)} ({record.normalizedPercentage.toFixed(1)}% {t.normalize.toLowerCase()})</p>
            <p className="min-w-0 break-words"><span className="font-semibold">{t.units}:</span> {record.unitsPassed} / {record.unitsEnrolled}</p>
            <p className="min-w-0 break-words"><span className="font-semibold">{t.statusField}:</span> <span className={`inline-flex min-h-[28px] items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(record.disbursementStatus)}`}>{stipendStatus}</span></p>
            <p className="min-w-0 break-words tabular-nums"><span className="font-semibold">{t.deficit}:</span> {money(deficit)}</p>
          </div>
          {record.notes && <p className="mt-2 break-words text-sm text-slate-600">{record.notes}</p>}
          <div className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-[#E2DFD6] pt-3">
            <button type="button" className={buttonClass} onClick={() => editTerm(record)} disabled={!loaded || loadFailed || saving}>{t.edit}</button>
            <button type="button" className={buttonClass} onClick={() => void deleteTerm(record.id)} disabled={!loaded || loadFailed || saving}>{t.remove}</button>
          </div>
        </article>;
      })}
    </div>

    {showForm && <fieldset disabled={!loaded || loadFailed || saving} className="m-0 min-w-0 space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4" aria-label={editingId ? t.formEdit : t.formAdd}>
      <legend className="max-w-full break-words px-1 text-sm font-bold text-slate-900">{editingId ? t.formEdit : t.formAdd}</legend>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-academic-year">{t.year}</label><input autoComplete="off" id="gwa-academic-year" className={fieldClass} maxLength={40} placeholder={t.yearHint} value={form.academicYear} onChange={event => changeForm('academicYear', event.target.value)} /></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-semester">{t.semester}</label><select autoComplete="off" id="gwa-semester" className={fieldClass} value={form.semester} onChange={event => changeForm('semester', event.target.value as TermForm['semester'])}>{(['1st', '2nd', 'summer', 'midyear'] as const).map(value => <option key={value} value={value}>{t.semesters[value]}</option>)}</select></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-scale">{t.scale}</label><select autoComplete="off" id="gwa-scale" className={fieldClass} value={form.gradingScale} onChange={event => changeForm('gradingScale', event.target.value as GradingScale)}>{(['percentage', 'one_to_five', 'four_point'] as const).map(value => <option key={value} value={value}>{t.scales[value]}</option>)}</select></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-grade">{t.grade}</label><input autoComplete="off" id="gwa-grade" className={fieldClass} type="number" inputMode="decimal" min={bounds.min} max={bounds.max} step={bounds.step} value={form.rawGWA} onChange={event => changeForm('rawGWA', event.target.value)} /></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-units-enrolled">{t.enrolled}</label><input autoComplete="off" id="gwa-units-enrolled" className={fieldClass} type="number" inputMode="numeric" min={1} max={500} step={1} value={form.unitsEnrolled} onChange={event => changeForm('unitsEnrolled', event.target.value)} /></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-units-passed">{t.passed}</label><input autoComplete="off" id="gwa-units-passed" className={fieldClass} type="number" inputMode="numeric" min={0} max={500} step={1} value={form.unitsPassed} onChange={event => changeForm('unitsPassed', event.target.value)} /></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-program">{t.program}</label><select autoComplete="off" id="gwa-program" className={fieldClass} value={form.programId} onChange={event => changeProgram(event.target.value as ScholarshipProgramId)}>{(['ched-cmsp-full', 'ched-cmsp-half', 'dost-sei', 'pca-coscho', 'ched-tes', 'lgu-iskolar', 'custom'] as const).map(value => <option key={value} value={value}>{t.programs[value]}</option>)}</select></div>
        {form.programId === 'custom' && <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-program-name">{t.customProgram}</label><input autoComplete="off" id="gwa-program-name" className={fieldClass} maxLength={160} placeholder={t.noProgramName} value={form.programName} onChange={event => changeForm('programName', event.target.value)} /></div>}
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-expected">{t.expectedField}</label><input autoComplete="off" id="gwa-expected" className={fieldClass} type="number" inputMode="decimal" min={0} max={1_000_000_000} step="0.01" value={form.expectedStipend} onChange={event => changeForm('expectedStipend', event.target.value)} /><p className="mt-1 break-words text-xs text-slate-600">{t.awardNotice} <a className="inline-flex min-h-[44px] items-center font-semibold text-blue-900 underline" href="https://legacy.ched.gov.ph/merit-scholarship/" target="_blank" rel="noreferrer">CHED CMSP reference</a></p></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-received">{t.receivedField}</label><input autoComplete="off" id="gwa-received" className={fieldClass} type="number" inputMode="decimal" min={0} max={1_000_000_000} step="0.01" value={form.receivedStipend} onChange={event => changeForm('receivedStipend', event.target.value)} /></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-disbursement-status">{t.statusField}</label><select autoComplete="off" id="gwa-disbursement-status" className={fieldClass} value={currentDisbursementStatus(number(form.expectedStipend) ?? 0, number(form.receivedStipend) ?? 0)} onChange={event => {
          const status = event.target.value as DisbursementStatus;
          const expected = number(form.expectedStipend) ?? 0;
          const received = status === 'pending' ? 0 : status === 'disbursed' ? expected : Math.round(expected / 2 * 100) / 100;
          changeForm('receivedStipend', String(received));
        }}>{(['pending', 'partial', 'disbursed'] as const).map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></div>
        <div className="min-w-0"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-date-disbursed">{t.date}</label><input autoComplete="off" id="gwa-date-disbursed" className={fieldClass} type="date" value={form.dateDisbursed} onChange={event => changeForm('dateDisbursed', event.target.value)} /></div>
        <div className="min-w-0 sm:col-span-2"><label className="mb-1 block break-words text-sm font-semibold" htmlFor="gwa-notes">{t.notes}</label><textarea autoComplete="off" id="gwa-notes" className="min-h-[88px] w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900" maxLength={2_000} value={form.notes} onChange={event => changeForm('notes', event.target.value)} /></div>
      </div>
      <label htmlFor="gwa-failing-grade" className="flex min-h-[44px] min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900"><input autoComplete="off" id="gwa-failing-grade" type="checkbox" checked={form.hasFailingGrade} onChange={event => changeForm('hasFailingGrade', event.target.checked)} className="h-5 w-5 shrink-0 accent-blue-900" />{t.failing}</label>
      <div className="flex min-w-0 flex-wrap gap-2">
        <button type="button" onClick={() => void commitTerm()} disabled={!loaded || loadFailed || saving} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 disabled:opacity-60">{saving ? t.saving : t.save}</button>
        <button type="button" onClick={closeForm} disabled={saving} className={buttonClass}>{t.cancel}</button>
      </div>
    </fieldset>}
  </section>;
}
