'use client';

import { Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicTextarea, civicPrimary, civicSecondary, civicPill, civicSelectedPill, civicPaperMat, civicPaper } from '@/components/shared/civicStyles';

import { useEffect, useState } from 'react';
import type { Language } from '@/lib/i18n';
import type { WorkerProfileInput } from '@/types/worker';
import type { StoredDocument } from '@/types/assistance';
import { loadOFWCaseTracker, WORKER_WORKSHEET_LIMITS, type WorkerWorksheetFields } from '@/lib/storage';
import { calculateWorkerBenefitsAndLoans } from '@/lib/workerBenefitsCalculator';
import { generateWorkerWorksheetPdf, type WorkerWorksheetSelection } from '@/lib/pdfGenerator';
import { DocumentVault } from '@/components/DocumentVault';
import { getAttachableDocuments, getChecklistDocumentStatus } from '@/lib/documentVault';
import { OFWCaseTrackerCard } from '@/components/worker/OFWCaseTrackerCard';
import type { OFWCaseRecord } from '@/lib/ofwTracker';

interface Props {
  profile: WorkerProfileInput;
  language?: Language;
  worksheet: WorkerWorksheetFields;
  onWorksheetChange: (fields: WorkerWorksheetFields) => void;
  documents: StoredDocument[];
  onUpdateDocuments: (documents: StoredDocument[]) => void;
}

export function WorkerPrintView({ profile, language = 'taglish', worksheet: fields, onWorksheetChange, documents, onUpdateDocuments }: Props) {
  const english = language === 'en';
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState(true);
  const [includeVaultAttachments, setIncludeVaultAttachments] = useState(false);
  const [ofwCase, setOFWCase] = useState<OFWCaseRecord | null>(null);
  const [ofwCaseUnavailable, setOFWCaseUnavailable] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<WorkerWorksheetSelection>(
    fields.worksheetUnpaidDetails.includes('TOTAL ESTIMATED SENA CLAIM:') ? 'sena' : 'all',
  );
  const [successToast, setSuccessToast] = useState('');
  const result = calculateWorkerBenefitsAndLoans(profile);
  const attachableDocumentCount = getAttachableDocuments(documents).length;
  useEffect(() => {
    let active = true;
    void loadOFWCaseTracker().then(record => { if (active) setOFWCase(record); }).catch(() => { if (active) setOFWCaseUnavailable(true); });
    return () => { active = false; };
  }, []);
  const issuePresets = ['Hindi nabayarang sahod', 'Hindi nabayarang 13th Month Pay', 'Naantalang Final Pay at COE', 'Kulang sa Minimum Wage / OT / Holiday Pay', 'Tinanggal nang walang tamang proseso'];
  const eventPresets = ['Naaksidente habang nasa trabaho', 'Naaksidente papasok o pauwi (Commuting)', 'Nagkasakit dahil sa trabaho', 'Maternity Leave at Salary Differential'];
  const projectPresets = [
    { project: 'Sari-Sari Store at Bigasan', amount: 25000, budget: 'Paninda at kagamitan: PHP 25,000' },
    { project: 'Karinderya / Food Cart', amount: 25000, budget: 'Lutuan at ingredients: PHP 25,000' },
    { project: 'Welding / Repair Shop', amount: 30000, budget: 'Equipment at tools: PHP 30,000' },
    { project: 'Tahian / Laundry Shop', amount: 25000, budget: 'Makina at supplies: PHP 25,000' },
  ];
  function toggleText(key: 'worksheetUnpaidDetails' | 'worksheetEventDetails', text: string) {
    const lines = fields[key].split('\n').filter(Boolean);
    onWorksheetChange({
      ...fields,
      [key]: (lines.includes(text) ? lines.filter(line => line !== text) : [...lines, text]).join('\n'),
    });
  }
  const chip = civicPill;
  const [error, setError] = useState('');
  const peso = (n: number) => `PHP ${n.toFixed(2)}`;
  const sections: { key: string; title: string; lines: string[]; checklistItems?: string[] }[] = [
    { key: 'sena', title: 'DOLE SEnA Request for Assistance Pre-Filing Worksheet', lines: [
      `Worker / requesting party: ${fields.worksheetName || '________________________'}`, `Respondent employer: ${fields.worksheetEmployer || '________________________'}`,
      `Employer address / contact: ${fields.worksheetEmployerAddress || '________________________'}`, `Employment duration: ${fields.worksheetStartDate || '________'} to ${fields.worksheetEndDate || '________'}`,
      `Itemized unpaid wages / amounts: ${fields.worksheetUnpaidDetails || 'List dates, amounts due, amounts received and evidence.'}`,
      'Requested relief: payroll reconciliation, release of verified unpaid amounts, and a certificate of employment as applicable.',
      'Attached evidence: contract, payslips, time records, termination notice, and correspondence.',
      'Preparation worksheet only. Free conciliation under RA 10396. Submit through a SEnA desk or sena.dole.gov.ph. Hotline 1349.',
    ] },
    { key: 'notice', title: 'HR Maternity / Sickness Benefit Notice', lines: [
      `Worker: ${fields.worksheetName || '________________________'}`, `Employer: ${fields.worksheetEmployer || '________________________'}`,
      `Employment dates: ${fields.worksheetStartDate || '________'} to ${fields.worksheetEndDate || '________'}`, `Event / contingency: ${fields.worksheetEventDetails || '________________________'}`,
      `Please assess my ${profile.scenario} claim and record the required agency notification.`,
      `Maternity illustration: SSS ${peso(result.maternity.sssBenefit)}; employer differential ${peso(result.maternity.employerSalaryDifferential)}.`,
      `Sickness illustration: SSS ${peso(result.sickness.sssBenefit)}; separate EC TTD ${peso(result.sickness.ecBenefit)}.`,
      'Basis: RA 11210 / RA 11199. Request written payroll and contribution verification. These figures are estimates, not an approved benefit.',
      'Signature: ________________________   Date: ________________________',
    ] },
    { key: 'ecc', title: 'ECC Work-Related Injury / Sickness Claim Checklist', lines: [
      `Event and work connection: ${fields.worksheetEventDetails || '________________________'}`,
      'Ask employer to record the event in the EC logbook. Prepare accident report, duties, service record and medical abstract.',
      'File the regular claim with SSS or GSIS, as applicable, and the separate EC claim through the employer for ECC assessment under PD 626.',
      `Regular funeral illustration: ${peso(result.funeral.regularBenefit)}; separate work-related EC funeral: ${peso(result.funeral.ecBenefit)}.`,
      `Approved EC medical reimbursement: ${peso(result.sickness.ecMedicalReimbursement)}; permanent-disability carer allowance: ${peso(result.sickness.ecCarerMonthly)} / month.`,
    ], checklistItems: ['Accident / incident report and logbook notice', 'Medical abstract and prescriptions', 'Employment record'] },
    { key: 'livelihood', title: 'DOLE Kabuhayan / OWWA BPBH Proposal Worksheet', lines: [
      `Proponent: ${fields.worksheetName || '________________________'}`, `Project, customers and location: ${fields.worksheetProjectTitle || '________________________'}`,
      `Tools, raw materials, unit costs and requested budget: ${fields.worksheetProposedBudget || '________________________'}`,
      'Add: skills / experience, suppliers, estimated sales, operating costs, permits and monitoring plan.',
      'DILP provides approved livelihood inputs, not automatic cash. BPBH depends on OWWA membership and assessed returnee distress.',
      `BPBH candidate tier: ${peso(result.livelihood.bpbhGrant)}. Confirm eligibility and non-duplication with the regional office.`,
    ] },
    { key: 'checklist', title: 'Consolidated Documentary Checklist', lines: [], checklistItems: result.consolidatedChecklist },
    { key: 'references', title: 'Program References', lines: result.matchedPrograms.flatMap(p => [p.name, p.basis, p.benefit, p.source]) },
  ];
  const worksheetOptions: { value: WorkerWorksheetSelection; label: string }[] = [
    { value: 'all', label: english ? 'All Worksheets' : 'All Worksheets / Lahat ng Worksheets' },
    { value: 'sena', label: 'DOLE SEnA Unpaid Wage RFA' },
    { value: 'notice', label: 'HR Maternity / Sickness Benefit Notice' },
    { value: 'ecc', label: 'ECC Work-Related Claim Checklist' },
    { value: 'livelihood', label: 'DOLE Kabuhayan / OWWA BPBH Proposal' },
  ];
  const visibleSections = sections.filter(section => selectedWorksheet === 'all' || section.key === selectedWorksheet);
  const worksheetInputs = [
    { id: 'name', field: 'worksheetName', label: 'Pangalan ng manggagawa' },
    { id: 'employer', field: 'worksheetEmployer', label: 'Employer / respondent' },
    { id: 'address', field: 'worksheetEmployerAddress', label: 'Employer address / contact' },
    { id: 'start', field: 'worksheetStartDate', label: 'Employment start date' },
    { id: 'end', field: 'worksheetEndDate', label: 'Employment end date' },
    { id: 'unpaid', field: 'worksheetUnpaidDetails', label: 'Itemized unpaid amounts / dates' },
    { id: 'event', field: 'worksheetEventDetails', label: 'Event / work connection' },
    { id: 'project', field: 'worksheetProjectTitle', label: 'Livelihood project / location / customers' },
    { id: 'budget', field: 'worksheetProposedBudget', label: 'Tools / costs / budget' },
  ] as const;
  function showToast(message: string) {
    setSuccessToast(message);
    window.setTimeout(() => setSuccessToast(''), 4000);
  }
  const selectedLabel = worksheetOptions.find(option => option.value === selectedWorksheet)?.label ?? 'Worker worksheet';
  const shareSummary = `${selectedLabel}: preparation worksheet with details and requirements. Confirm current eligibility and documents with the relevant agency.`;

  async function download() {
    if (busy) return;
    setBusy(true);
    setSuccessToast('');
    try {
      setError('');
      const doc = await generateWorkerWorksheetPdf(profile, fields, selectedWorksheet, documents, includeVaultAttachments);
      doc.save(`TulongPH-Worker-${selectedWorksheet}.pdf`);
      showToast(english ? 'Worksheet PDF downloaded.' : 'Na-download ang worksheet PDF.');
    } catch { setError(english ? 'PDF download failed. Try Print / Save as PDF.' : 'Hindi na-download ang PDF. Subukan ang Print / Save as PDF.'); }
    finally { setBusy(false); }
  }
  async function handleShare() {
    if (busy) return;
    setBusy(true); setError('');
    setSuccessToast('');
    try {
      const doc = await generateWorkerWorksheetPdf(profile, fields, selectedWorksheet, documents, includeVaultAttachments);
      const pdfBlob = doc.output('blob');
      const file = typeof File === 'undefined' ? null : new File([pdfBlob], `TulongPH-Worker-${selectedWorksheet}.pdf`, { type: 'application/pdf' });
      if (navigator.share) {
        let canShareFile = false;
        try { canShareFile = Boolean(file && navigator.canShare?.({ files: [file] })); } catch { canShareFile = false; }
        if (file && canShareFile) {
          try {
            await navigator.share({ files: [file], title: `TulongPH ${selectedLabel}`, text: shareSummary });
            showToast(english ? 'Worksheet shared.' : 'Naibahagi ang worksheet.');
            return;
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            /* Try text sharing or clipboard next. */
          }
        }
        try {
          await navigator.share({ title: `TulongPH ${selectedLabel}`, text: shareSummary });
          showToast(english ? 'Summary shared.' : 'Naibahagi ang buod.');
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          /* Try the clipboard next. */
        }
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareSummary);
        showToast(english ? 'Summary copied for sharing.' : 'Nakopya ang buod para maibahagi.');
      } else {
        setError(english ? 'Sharing and clipboard are unavailable. Use Download PDF.' : 'Hindi available ang sharing o clipboard. Gamitin ang Download PDF.');
      }
    } catch {
      setError(english ? 'Could not share the worksheet. You can download it instead.' : 'Hindi naibahagi ang worksheet. Maaari mo itong i-download.');
    } finally { setBusy(false); }
  }
  return <section className={moving ? "overflow-x-clip motion-reduce:overflow-x-visible" : "overflow-visible"}><div onAnimationEnd={e => { if (e.target === e.currentTarget) setMoving(false); }} className="space-y-6 animate-step-enter step-enter-forward">
    <style>{`@media print { @page { size: A4; margin: 15mm; } .worker-packet { color: #111; background: white; } .worker-packet article { break-inside: auto; border: 0; padding: 0; margin: 0; } .worker-packet article + article { break-before: page; } }`}</style>
    <div className="print:hidden"><CivicViewHeader icon={Printer} badge={english ? 'Print-ready preparation worksheets' : 'Print-ready na preparation worksheets'} title="Printable Worker Packet" description={english ? 'Choose a worksheet and add your details. These preparation worksheets stay in the current tab and are not official filed applications.' : 'Pumili ng worksheet at idagdag ang detalye mo. Preparation worksheet lang ito, hindi official filed application. Nasa kasalukuyang tab ang datos.'} actions={<><button type="button" onClick={() => window.print()} className={civicPrimary}><Printer aria-hidden="true" className="h-4 w-4" />{english ? 'Print / Save as PDF' : 'I-print / Save as PDF'}</button><button type="button" disabled={busy} onClick={() => void download()} className={civicSecondary}><Download aria-hidden="true" className="h-4 w-4" />{busy ? (english ? 'Generating PDF...' : 'Ginagawa ang PDF...') : 'Download PDF'}</button><button type="button" disabled={busy} onClick={() => void handleShare()} className={civicSecondary}><Share2 aria-hidden="true" className="h-4 w-4" />{english ? 'Share' : 'Ibahagi'}</button></>} /></div>
    <div role="group" aria-label={english ? 'Worksheet selector' : 'Pumili ng worksheet'} className="flex min-w-0 flex-wrap gap-2 print:hidden">
      {worksheetOptions.map(option => <button key={option.value} type="button" aria-pressed={selectedWorksheet === option.value} onClick={() => setSelectedWorksheet(option.value)} className={`${selectedWorksheet === option.value ? civicSelectedPill : civicPill} min-w-0 whitespace-normal break-words`}>
        {option.label}
      </button>)}
    </div>
    <details className="rounded-2xl border border-[#E2DFD6] bg-white p-4 print:hidden">
      <summary className="flex min-h-[44px] cursor-pointer items-center rounded-lg text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900">
        {english ? 'Open Worker Document Vault' : 'Buksan ang Worker Document Vault'}
      </summary>
      <div className="pt-4">
        <DocumentVault documents={documents} onUpdateDocuments={onUpdateDocuments} applicantName={fields.worksheetName} language={language} currentPillar="worker" />
      </div>
    </details>
    <label htmlFor="worker-include-vault" className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 print:hidden">
      <input id="worker-include-vault" type="checkbox" autoComplete="off" checked={includeVaultAttachments} disabled={attachableDocumentCount === 0}
        onChange={event => setIncludeVaultAttachments(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-blue-900" />
      <span>{english ? `Append ${attachableDocumentCount} compliant vault image(s) to the worksheet PDF` : `Isama ang ${attachableDocumentCount} compliant na vault image sa worksheet PDF`}</span>
    </label>
    <form autoComplete="off" onSubmit={e => e.preventDefault()} className={`${civicCard} grid sm:grid-cols-2 gap-4 print:hidden`}>
      {worksheetInputs.map(({ id, field, label }) => <div key={id} className={['unpaid', 'event', 'project'].includes(id) ? 'sm:col-span-2 min-w-0' : 'min-w-0'}><label htmlFor={`worker-print-${id}`} className={civicLabel}>{label}</label>
        {(id === 'unpaid' || id === 'event') && <div className="flex flex-wrap gap-2 mb-2" aria-label={`${label} quick picks`}>
          {(id === 'unpaid' ? issuePresets : eventPresets).map(text => <button key={text} type="button" aria-pressed={fields[field].split('\n').includes(text)}
            className={`${chip} ${fields[field].split('\n').includes(text) ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-[#E2DFD6] bg-white'}`}
            onClick={() => toggleText(id === 'unpaid' ? 'worksheetUnpaidDetails' : 'worksheetEventDetails', text)}>{text}</button>)}
        </div>}
        {id === 'project' && <div className="flex flex-wrap gap-2 mb-2" aria-label="Livelihood project presets">
          {projectPresets.map(preset => <button key={preset.project} type="button" aria-pressed={fields.worksheetProjectTitle === preset.project && fields.worksheetProposedBudget === preset.budget}
            className={`${chip} ${fields.worksheetProjectTitle === preset.project && fields.worksheetProposedBudget === preset.budget ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-[#E2DFD6] bg-white'}`}
            onClick={() => onWorksheetChange({ ...fields, worksheetProjectTitle: preset.project, worksheetProposedBudget: preset.budget })}>{preset.project} (PHP {preset.amount.toLocaleString('en-PH')})</button>)}
        </div>}
        <textarea id={`worker-print-${id}`} autoComplete="off" rows={2} maxLength={WORKER_WORKSHEET_LIMITS[field]} value={fields[field]} onChange={e => onWorksheetChange({ ...fields, [field]: e.target.value.slice(0, WORKER_WORKSHEET_LIMITS[field]) })} className={`${civicTextarea} tabular-nums`} />
      </div>)}
    </form>
    {fields.worksheetUnpaidDetails.includes('TOTAL ESTIMATED SENA CLAIM:') && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 print:hidden">
      {english ? 'The wage estimate is pre-filled in the DOLE SEnA worksheet below.' : 'Nailipat na ang tantiya sa DOLE SEnA worksheet sa ibaba.'}
    </p>}
    {successToast && <p role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900"><CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />{successToast}</p>}
    {error && <p role="alert">{error}</p>}
    {ofwCaseUnavailable && <p role="alert" className="print:hidden text-sm text-amber-900">{english ? 'Saved OFW case details could not be loaded.' : 'Hindi na-load ang naka-save na OFW case.'}</p>}
    <div className={civicPaperMat}><p className="mb-4 text-xs font-semibold text-slate-600 print:hidden">{english ? `Preview: ${selectedLabel}, low-ink A4 print` : `Preview: ${selectedLabel}, matipid sa tinta`}</p><div className={`worker-packet ${civicPaper} min-w-0 space-y-8 tabular-nums`}>
      {ofwCase && <OFWCaseTrackerCard record={ofwCase} onChange={() => undefined} language={language} readOnly />}
      {visibleSections.map(section => <article key={section.key} className="min-w-0 space-y-3 border-b border-[#E2DFD6] pb-6 last:border-0">
      <h3 className="text-lg font-bold mb-3">{section.title}</h3>{section.lines.map((line, i) => <p key={i} className="text-sm mb-2 whitespace-pre-wrap break-words">{line}</p>)}
      {section.checklistItems?.map(item => {
        const status = getChecklistDocumentStatus(item, documents, 'worker');
        const marker = status?.status === 'ready' ? '[x]' : '[ ]';
        const statusLabel = status?.status === 'ready' ? 'In vault and ready to attach'
          : status?.status === 'over-limit' ? 'In vault, over 2 MB'
            : status?.status === 'download-only' ? 'In vault, packet preview unavailable'
              : status ? 'Not in vault' : '';
        return <p key={item} className="flex flex-wrap justify-between gap-2 text-sm"><span>{marker} {item}</span>{statusLabel && <span className="text-xs font-semibold text-slate-700">{statusLabel}</span>}</p>;
      })}
    </article>)}</div></div>
  </div></section>;
}
