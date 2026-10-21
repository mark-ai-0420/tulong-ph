'use client';

import { Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicInput, civicPrimary, civicSecondary, civicPill, civicSelectedPill, civicPaperMat, civicPaper } from '@/components/shared/civicStyles';

import { useEffect, useState } from 'react';
import { LocationHierarchyFields } from '@/components/shared/LocationHierarchyFields';
import { EducationSchoolAutocomplete } from './EducationSchoolAutocomplete';
import type { StudentEducationProfile } from '@/types/education';
import type { Language } from '@/lib/i18n';
import type { StoredDocument } from '@/types/assistance';
import { evaluateEducationAssistance } from '@/lib/educationEngine';
import { generateEducationPacketPdf } from '@/lib/pdfGenerator';
import { DocumentVault } from '@/components/DocumentVault';
import { getAttachableDocuments, getChecklistDocumentStatus } from '@/lib/documentVault';
import { calculateStipendSummary, evaluateRetentionStatus, formatGradeDisplay, type AcademicTermRecord } from '@/lib/gwaTracker';
import { loadGWATracker } from '@/lib/storage';

type LocatedEducationProfile = StudentEducationProfile & { province?: string; barangay?: string };
interface Props {
  profile: LocatedEducationProfile;
  onChange: (profile: StudentEducationProfile) => void;
  language?: Language;
  documents: StoredDocument[];
  onUpdateDocuments: (documents: StoredDocument[]) => void;
}
const control = civicInput;
const chipClass = civicPill;
const money = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const recipientPresets = [
  'CHED / UniFAST Scholarship Coordinator',
  'DSWD Crisis Intervention Unit',
  'Office of the Mayor / Governor',
  'Tanggapan ng Punong Lungsod / Mayor - Scholarship Office',
  'Tanggapan ng Gobernador - Provincial Scholarship Office',
  'Tanggapan ng Kinatawan / District Representative',
];

export function EducationPrintView({ profile, onChange, language = 'taglish', documents, onUpdateDocuments }: Props) {
  const [recipient, setRecipient] = useState('CHED / UniFAST Scholarship Coordinator');
  const [busy, setBusy] = useState(false);
  const [includeVaultAttachments, setIncludeVaultAttachments] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [gwaRecords, setGwaRecords] = useState<AcademicTermRecord[]>([]);
  const result = evaluateEducationAssistance(profile);
  const tl = language === 'taglish';
  const attachableDocumentCount = getAttachableDocuments(documents).length;
  const trackerCopy = language === 'taglish'
    ? { title: 'Rekord ng GWA at Stipend', term: 'Academic term', program: 'Programa', grade: 'GWA', units: 'Units passed / enrolled', stipend: 'Stipend summary', status: 'Retention', expected: 'Inaasahan', received: 'Natanggap', deficit: 'Kulang pa', total: 'Kabuuan' }
    : language === 'cebuano'
      ? { title: 'Rekord sa GWA ug Stipend', term: 'Academic term', program: 'Programa', grade: 'GWA', units: 'Units passed / enrolled', stipend: 'Stipend summary', status: 'Retention', expected: 'Gipaabot', received: 'Nadawat', deficit: 'Kulang pa', total: 'Kinatibuk-an' }
      : language === 'ilocano'
        ? { title: 'Rekord ti GWA ken Stipend', term: 'Academic term', program: 'Programa', grade: 'GWA', units: 'Units passed / enrolled', stipend: 'Stipend summary', status: 'Retention', expected: 'Namnamaen', received: 'Naawat', deficit: 'Akurang pay', total: 'Dagup' }
        : { title: 'GWA and Stipend Record', term: 'Academic term', program: 'Program', grade: 'GWA', units: 'Units passed / enrolled', stipend: 'Stipend summary', status: 'Retention', expected: 'Expected', received: 'Received', deficit: 'Remaining', total: 'Total' };
  const gwaSummary = calculateStipendSummary(gwaRecords);

  useEffect(() => {
    let active = true;
    const readTracker = () => {
      void loadGWATracker().then(data => { if (active) setGwaRecords(data?.records ?? []); }).catch(() => {});
    };
    const clearTracker = () => setGwaRecords([]);
    readTracker();
    window.addEventListener('tulongph-data-cleared', clearTracker);
    window.addEventListener('tulongph-data-restored', readTracker);
    return () => {
      active = false;
      window.removeEventListener('tulongph-data-cleared', clearTracker);
      window.removeEventListener('tulongph-data-restored', readTracker);
    };
  }, []);
  const programs = [...new Map([
    ...(result.tuitionProgram ? [result.tuitionProgram] : []),
    ...result.primaryPrograms.filter((match) => !result.selectedPrimary || match === result.selectedPrimary).map((match) => match.program),
    ...result.supplementalPrograms.filter((match) => !match.requiresPrimaryProgram || match.requiresPrimaryProgram === result.selectedPrimary?.program.id).map((match) => match.program),
  ].map((program) => [program.id, program])).values()];

  function showToast(message: string) {
    setSuccessToast(message);
    window.setTimeout(() => setSuccessToast(''), 4000);
  }

  const shareSummary = tl
    ? 'Educational assistance preparation packet: tuition summary, documentary checklist, at mga program reference. Kumpirmahin ang requirements sa paaralan o ahensya.'
    : 'Education assistance preparation packet with a tuition summary, documentary checklist, and program references. Confirm requirements with the school or agency.';

  async function downloadPdf() {
    if (busy) return;
    setBusy(true); setError(''); setSuccessToast('');
    try {
      const pdf = await generateEducationPacketPdf(profile, recipient, documents, includeVaultAttachments);
      pdf.save('TulongPH-Education-Packet.pdf');
      showToast(tl ? 'Na-download ang education packet PDF.' : 'Education packet PDF downloaded.');
    } catch { setError(tl ? 'Hindi nagawa ang PDF. Maaari pa ring gamitin ang I-print.' : 'PDF generation failed. You can still use Print.'); }
    finally { setBusy(false); }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true); setError(''); setSuccessToast('');
    try {
      const pdf = await generateEducationPacketPdf(profile, recipient, documents, includeVaultAttachments);
      const pdfBlob = pdf.output('blob');
      const file = typeof File === 'undefined' ? null : new File([pdfBlob], 'TulongPH-Education-Packet.pdf', { type: 'application/pdf' });
      if (navigator.share) {
        let canShareFile = false;
        try { canShareFile = Boolean(file && navigator.canShare?.({ files: [file] })); } catch { canShareFile = false; }
        if (file && canShareFile) {
          try {
            await navigator.share({ files: [file], title: 'TulongPH Education Assistance Packet', text: shareSummary });
            showToast(tl ? 'Naibahagi ang education packet.' : 'Education packet shared.');
            return;
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            /* Try text sharing or clipboard next. */
          }
        }
        try {
          await navigator.share({ title: 'TulongPH Education Assistance Packet', text: shareSummary });
          showToast(tl ? 'Naibahagi ang buod.' : 'Summary shared.');
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          /* Try the clipboard next. */
        }
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareSummary);
        showToast(tl ? 'Nakopya ang buod para maibahagi.' : 'Summary copied for sharing.');
      } else {
        setError(tl ? 'Hindi available ang pagbabahagi o pagkopya. Gamitin ang Download PDF.' : 'Sharing and clipboard are unavailable. Use Download PDF.');
      }
    } catch {
      setError(tl ? 'Hindi naibahagi ang packet. Maaari mo itong i-download.' : 'Could not share the packet. You can download it instead.');
    } finally { setBusy(false); }
  }

  return <section className="space-y-6">
    <div className="education-print-tools space-y-4"><CivicViewHeader icon={Printer} badge={tl ? 'Print-ready na preparation worksheet' : 'Print-ready preparation worksheet'} title="Printable scholarship packet" description={tl ? 'Draft na liham at checklist, hindi official application. Optional ang pangalan; maaari mo ring sulatan ang papel pagkatapos mag-print.' : 'Draft letter and checklist, not an official application. Your name is optional; you can complete the paper after printing.'} actions={<><button type="button" onClick={() => window.print()} className={civicPrimary}><Printer aria-hidden="true" className="h-4 w-4" />{tl ? 'I-print ang packet' : 'Print packet'}</button><button type="button" onClick={downloadPdf} disabled={busy} className={civicSecondary}><Download aria-hidden="true" className="h-4 w-4" />{busy ? (tl ? 'Ginagawa ang PDF...' : 'Generating PDF...') : (tl ? 'I-download ang PDF (English)' : 'Download PDF (English)')}</button><button type="button" onClick={handleShare} disabled={busy} className={civicSecondary}><Share2 aria-hidden="true" className="h-4 w-4" />{tl ? 'Ibahagi' : 'Share'}</button></>} />
      <form autoComplete="off" onSubmit={(event) => event.preventDefault()} className={`${civicCard} grid gap-4 sm:grid-cols-2`}>
        <div><label htmlFor="edu-print-name" className={civicLabel}>{tl ? 'Pangalan ng estudyante (optional)' : 'Student name (optional)'}</label><input autoComplete="off" id="edu-print-name" maxLength={150} className={control} value={profile.fullName} onChange={(event) => onChange({ ...profile, fullName: event.target.value })} /></div>
        <EducationSchoolAutocomplete id="edu-print-school" profile={profile} onChange={onChange} language={language} />
        <div className="sm:col-span-2"><LocationHierarchyFields idPrefix="edu-print" cityId="edu-print-city" value={profile} language={language} onChange={(location, updateMetadata) => onChange({ ...profile, province: location.province, cityMunicipality: location.cityMunicipality, barangay: location.barangay, ...(updateMetadata ? { location: location.locationTier, regionalDailyWage: profile.regionalDailyWageManual ? profile.regionalDailyWage : location.regionalDailyWage } : {}) } as LocatedEducationProfile)} /></div>
        <div><label htmlFor="edu-print-recipient" className={civicLabel}>{tl ? 'Para kanino ang liham?' : 'Letter recipient'}</label><select autoComplete="off" id="edu-print-recipient" className={control} value={recipient} onChange={(event) => setRecipient(event.target.value)}>{recipientPresets.map(item => <option key={item}>{item}</option>)}</select></div>
      </form>
      <details className="rounded-2xl border border-[#E2DFD6] bg-white p-4 print:hidden">
        <summary className="flex min-h-[44px] cursor-pointer items-center rounded-lg text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900">
          {tl ? 'Buksan ang Education Document Vault' : 'Open Education Document Vault'}
        </summary>
        <div className="pt-4">
          <DocumentVault documents={documents} onUpdateDocuments={onUpdateDocuments} applicantName={profile.fullName} language={language} currentPillar="education" />
        </div>
      </details>
      <label htmlFor="education-include-vault" className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 print:hidden">
        <input autoComplete="off" id="education-include-vault" type="checkbox" checked={includeVaultAttachments} disabled={attachableDocumentCount === 0}
          onChange={(event) => setIncludeVaultAttachments(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-blue-900" />
        <span>{tl ? `Isama ang ${attachableDocumentCount} compliant na vault image sa PDF packet` : `Append ${attachableDocumentCount} compliant vault image(s) to the PDF packet`}</span>
      </label>
      <div className="space-y-3">
        <div role="group" aria-label={tl ? 'Tatanggap ng liham' : 'Recipient presets'} className="flex flex-wrap gap-2">{recipientPresets.map(item => <button type="button" key={item} className={recipient === item ? civicSelectedPill : chipClass} aria-pressed={recipient === item} onClick={() => setRecipient(item)}>{item}</button>)}</div>
        <p className="text-xs text-slate-600">{tl ? 'Piliin ang halimbawa at palitan ng eksaktong paaralan o lungsod bago isumite.' : 'Choose an example and enter the exact school or city before submission.'}</p>
      </div>
      <p className="text-xs text-slate-600">{tl ? 'Native print: buong Filipino at mga pangalan. PDF: English, PHP currency at transliterated names para sa built-in font.' : 'Native print preserves full Filipino text and names. PDF uses English, PHP currency and transliterated names for its built-in font.'}</p>{successToast && <p role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900"><CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />{successToast}</p>}{error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    </div>
    <div className={civicPaperMat}><p className="mb-4 text-xs font-semibold text-slate-600 print:hidden">{tl ? 'Preview: A4 worksheet, matipid sa tinta' : 'Preview: A4 worksheet, low-ink print'}</p><div className={`education-print-packet ${civicPaper} space-y-8`}>
      <article className="space-y-4 text-sm leading-relaxed text-slate-900"><header className="space-y-1 border-b border-slate-400 pb-3 text-center"><p className="text-xs font-semibold uppercase">Republika ng Pilipinas</p><p className="text-sm font-bold uppercase">Komisyon sa Lalong Mataas na Edukasyon / DSWD</p><h2 className="text-lg font-bold">Unified Educational Assistance &amp; Scholarship Worksheet</h2><p className="text-xs">Under RA 10931 &amp; CHED/DSWD Guidelines</p></header><p>Petsa: ____________________ <span className="float-right">Control No.: EDU-________________</span></p><h3 className="text-base font-bold">Formal Request Letter</h3><p>Para sa: {recipient}</p><p>Magandang araw po,</p><p>Ako po si <strong>{profile.fullName || '____________________'}</strong>, nag-aaral sa <strong>{profile.schoolName || '____________________'}</strong> at kumukuha ng <strong>{profile.degreeProgram || '____________________'}</strong> sa {[profile.barangay, profile.cityMunicipality, profile.province].filter(Boolean).join(', ') || '____________________'}. Magalang po akong humihiling ng assessment para sa educational assistance o scholarship. Pakigabayan po ako tungkol sa kasalukuyang application call, kwalipikasyon, pondo at mga dokumento.</p>
        <h3 className="text-base font-bold">Part I: Student and School Information</h3><dl className="grid grid-cols-1 gap-2 sm:grid-cols-2"><div><dt className="font-semibold">Degree program</dt><dd>{profile.degreeProgram || '____________________'}</dd></div><div><dt className="font-semibold">School type</dt><dd>{profile.schoolType === 'suc_luc' ? 'SUC / LUC' : profile.schoolType}</dd></div><div><dt className="font-semibold">Location tier</dt><dd>{profile.location}</dd></div><div><dt className="font-semibold">Province</dt><dd>{profile.province || '____________________'}</dd></div><div><dt className="font-semibold">City / municipality</dt><dd>{profile.cityMunicipality || '____________________'}</dd></div><div><dt className="font-semibold">Barangay</dt><dd>{profile.barangay || '____________________'}</dd></div></dl>
        <h3 className="text-base font-bold">Part II: Tuition and Financial Summary</h3><dl aria-live="polite" className="space-y-2 tabular-nums"><div className="flex flex-wrap justify-between gap-2 border-b border-slate-300 py-1"><dt>Covered annual tuition and fees</dt><dd>{money(profile.annualTuitionAndFees)}</dd></div><div className="flex flex-wrap justify-between gap-2 border-b border-slate-300 py-1"><dt>Possible direct fee relief</dt><dd>{money(result.directTuitionRelief)}</dd></div><div className="flex flex-wrap justify-between gap-2 border-b border-slate-300 py-1"><dt>Remaining covered tuition balance</dt><dd>{money(result.netRemainingTuitionBalance)}</dd></div></dl>
        {gwaRecords.length > 0 && <section className="education-print-section space-y-3" aria-labelledby="education-gwa-print-title">
          <h3 id="education-gwa-print-title" className="text-base font-bold">{trackerCopy.title}</h3>
          <table className="w-full max-w-full table-fixed border-collapse text-xs text-slate-900">
            <thead><tr className="border-y border-slate-500 text-left"><th className="break-words p-1.5">{trackerCopy.term}</th><th className="break-words p-1.5">{trackerCopy.program}</th><th className="break-words p-1.5">{trackerCopy.grade}</th><th className="break-words p-1.5">{trackerCopy.units}</th><th className="break-words p-1.5">{trackerCopy.stipend}</th><th className="break-words p-1.5">{trackerCopy.status}</th></tr></thead>
            <tbody>{gwaRecords.map(record => {
              const retentionStatus = evaluateRetentionStatus(record).status;
              const retentionLabel = retentionStatus === 'retained' ? (language === 'en' ? 'Retained' : language === 'taglish' ? 'Retained' : language === 'cebuano' ? 'Retained' : 'Retained')
                : retentionStatus === 'warning' ? (language === 'en' ? 'Warning' : language === 'taglish' ? 'Warning' : language === 'cebuano' ? 'Pasidaan' : 'Pakaammo')
                  : (language === 'en' ? 'At risk' : language === 'taglish' ? 'At risk' : language === 'cebuano' ? 'Naa sa peligro' : 'Adda iti peggad');
              const statusLabel = record.disbursementStatus === 'disbursed' ? (language === 'taglish' ? 'Natanggap' : language === 'cebuano' ? 'Nadawat' : language === 'ilocano' ? 'Naawat' : 'Disbursed')
                : record.disbursementStatus === 'partial' ? (language === 'taglish' ? 'Bahagya' : language === 'cebuano' ? 'Partial' : language === 'ilocano' ? 'Paset' : 'Partial')
                  : (language === 'taglish' ? 'Nakabinbin' : language === 'cebuano' ? 'Pending' : language === 'ilocano' ? 'Agtultuloy' : 'Pending');
              return <tr key={record.id} className="border-b border-slate-300 align-top">
                <td className="break-words p-1.5">{record.academicYear}<br />{record.semester}</td>
                <td className="break-words p-1.5">{record.programName || record.programId}</td>
                <td className="break-words p-1.5">{formatGradeDisplay(record.rawGWA, record.gradingScale)}<br />{record.normalizedPercentage.toFixed(1)}%</td>
                <td className="break-words p-1.5">{record.unitsPassed} / {record.unitsEnrolled}</td>
                <td className="break-words p-1.5 tabular-nums">{trackerCopy.expected}: {money(record.expectedStipend)}<br />{trackerCopy.received}: {money(record.receivedStipend)}<br />{trackerCopy.deficit}: {money(Math.max(0, record.expectedStipend - record.receivedStipend))}<br />{statusLabel}</td>
                <td className="break-words p-1.5">{retentionLabel}</td>
              </tr>;
            })}</tbody>
          </table>
          <p className="break-words border-t border-slate-400 pt-2 text-xs tabular-nums">{trackerCopy.total}: {trackerCopy.expected} {money(gwaSummary.totalExpected)}; {trackerCopy.received} {money(gwaSummary.totalReceived)}; {trackerCopy.deficit} {money(gwaSummary.totalDeficit)}.</p>
        </section>}
        {result.selectedPrimary && <p>Napiling scholarship na gustong itanong: <strong>{result.selectedPrimary.program.name}</strong>. {result.selectedPrimary.condition}</p>}<p>Ipapaalam ko po ang lahat ng kasalukuyang scholarship at tulong. Nauunawaan ko pong kailangang iwasan ang pag-claim nang dalawang beses para sa parehong gastos. Ang worksheet na ito ay gabay at hindi garantiya ng approval.</p><p>Maraming salamat po sa inyong gabay.</p><p>Lagda: ____________________</p>
      </article>
      <article className="education-print-section space-y-3 text-sm"><h2 className="text-xl font-bold">Documentary checklist</h2><p>Combined checklist ito ng mga posibleng programa. Kumpirmahin ang eksaktong requirements ng napiling programa; hindi kailangan lahat para sa bawat aplikasyon.</p><ul className="space-y-2">{result.documentaryChecklist.map((item) => {
        const status = getChecklistDocumentStatus(item, documents, 'education');
        const marker = status?.status === 'ready' ? '[x]' : '[ ]';
        const statusLabel = status?.status === 'ready' ? 'In vault and ready to attach'
          : status?.status === 'over-limit' ? 'In vault, over 2 MB'
            : status?.status === 'download-only' ? 'In vault, packet preview unavailable'
              : status ? 'Not in vault' : '';
        return <li key={item} className="flex flex-wrap items-baseline justify-between gap-2"> <span>{marker} {item}</span>{statusLabel && <span className="text-xs font-semibold text-slate-700">{statusLabel}</span>}</li>;
      })}</ul>{result.documentaryChecklist.length === 0 && <p>Piliin muna ang iyong pathway sa gabay; dalhin ang school registration at valid ID para sa initial inquiry.</p>}<p>Kung kailangan ng Barangay Certificate of Indigency o social case study, magtanong sa barangay o CSWDO/MSWDO. Ang desk ang magpapasya kung kailangan ito.</p></article>
      <article className="education-print-section space-y-4 text-sm"><h2 className="text-xl font-bold">Statutory quick reference</h2>{programs.map((program) => <div key={program.id} className="break-inside-avoid space-y-1 border-t border-slate-300 pt-3"><h3 className="font-bold">{program.name}</h3><p>{program.statutoryBasis}</p><p className="tabular-nums">{program.benefits}</p><p>{program.stackingRule}</p><p className="break-all text-xs">{program.sourceUrl}</p>{program.additionalSources?.map((source) => <p key={source.url} className="break-all text-xs">{source.title}: {source.url}</p>)}</div>)}<p>Huwag magbayad sa fixer. Pagkatapos gamitin ang shared computer, pindutin ang Burahin ang Data.</p></article>
    </div>
    </div>
    <style>{`@media print { @page { size: A4; margin: 15mm; } .education-page > header, .education-print-tools, .education-page footer { display: none !important; } .education-page > main { padding: 0 !important; max-width: none !important; } .education-print-packet { border: 0 !important; border-radius: 0 !important; padding: 0 !important; background: white !important; box-shadow: none !important; } .education-print-packet > article + article { break-before: page; } .education-print-section { break-inside: avoid; } .education-print-packet * { color: #111 !important; } }`}</style>
  </section>;
}
