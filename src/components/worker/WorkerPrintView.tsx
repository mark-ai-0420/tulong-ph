'use client';

import { Printer, Download } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicTextarea, civicPrimary, civicSecondary, civicPill, civicPaperMat, civicPaper } from '@/components/shared/civicStyles';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';
import type { WorkerProfileInput } from '@/types/worker';
import { calculateWorkerBenefitsAndLoans } from '@/lib/workerBenefitsCalculator';

export function WorkerPrintView({ profile, language = 'taglish' }: { profile: WorkerProfileInput; language?: Language }) {
  const english = language === 'en';
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState(true);
  const result = calculateWorkerBenefitsAndLoans(profile);
  const [fields, setFields] = useState({ name: '', employer: '', address: '', start: '', end: '', unpaid: '', event: '', project: '', budget: '' });
  const issuePresets = ['Hindi nabayarang sahod', 'Hindi nabayarang 13th Month Pay', 'Naantalang Final Pay at COE', 'Kulang sa Minimum Wage / OT / Holiday Pay', 'Tinanggal nang walang tamang proseso'];
  const eventPresets = ['Naaksidente habang nasa trabaho', 'Naaksidente papasok o pauwi (Commuting)', 'Nagkasakit dahil sa trabaho', 'Maternity Leave at Salary Differential'];
  const projectPresets = [
    { project: 'Sari-Sari Store at Bigasan', amount: 25000, budget: 'Paninda at kagamitan: PHP 25,000' },
    { project: 'Karinderya / Food Cart', amount: 25000, budget: 'Lutuan at ingredients: PHP 25,000' },
    { project: 'Welding / Repair Shop', amount: 30000, budget: 'Equipment at tools: PHP 30,000' },
    { project: 'Tahian / Laundry Shop', amount: 25000, budget: 'Makina at supplies: PHP 25,000' },
  ];
  function toggleText(key: 'unpaid' | 'event', text: string) {
    setFields(current => {
      const lines = current[key].split('\n').filter(Boolean);
      return { ...current, [key]: (lines.includes(text) ? lines.filter(line => line !== text) : [...lines, text]).join('\n') };
    });
  }
  const chip = civicPill;
  const [error, setError] = useState('');
  const peso = (n: number) => `PHP ${n.toFixed(2)}`;
  const sections = [
    { title: 'HR Benefit Notice', lines: [
      `Worker: ${fields.name || '________________________'}`, `Employer: ${fields.employer || '________________________'}`,
      `Employment dates: ${fields.start || '________'} to ${fields.end || '________'}`, `Event / contingency: ${fields.event || '________________________'}`,
      `Please assess my ${profile.scenario} claim and record the required agency notification.`,
      `Maternity illustration: SSS ${peso(result.maternity.sssBenefit)}; employer differential ${peso(result.maternity.employerSalaryDifferential)}.`,
      `Sickness illustration: SSS ${peso(result.sickness.sssBenefit)}; separate EC TTD ${peso(result.sickness.ecBenefit)}.`,
      'Basis: RA 11210 / RA 11199. Request written payroll and contribution verification. These figures are estimates, not an approved benefit.',
      'Signature: ________________________   Date: ________________________',
    ] },
    { title: 'DOLE SEnA Request for Assistance Pre-Filing Worksheet', lines: [
      `Worker / requesting party: ${fields.name || '________________________'}`, `Respondent employer: ${fields.employer || '________________________'}`,
      `Employer address / contact: ${fields.address || '________________________'}`, `Employment: ${fields.start || '________'} to ${fields.end || '________'}`,
      `Itemized unpaid wages / 13th-month / final pay: ${fields.unpaid || 'List dates, amounts due, amounts received and evidence.'}`,
      'Requested relief: reconciliation of payroll, release of unpaid amounts and certificate of employment as applicable.',
      'Evidence: contract, payslips, time records, termination notice and correspondence.',
      'This is a preparation worksheet, not an official filed RFA. Submit through sena.dole.gov.ph or a SEnA desk. Hotline 1349. Free conciliation under RA 10396.',
    ] },
    { title: 'EC + SSS / GSIS Separate-Claim Checklist', lines: [
      `Event and work connection: ${fields.event || '________________________'}`,
      'Ask employer to record the event in the EC logbook. Prepare accident report, duties, service record and medical abstract.',
      'File regular and EC claims separately with SSS for private workers or GSIS for government workers. Agency decides compensability under PD 626.',
      `Regular funeral illustration: ${peso(result.funeral.regularBenefit)}; separate work-related EC funeral: ${peso(result.funeral.ecBenefit)}.`,
      `Approved EC medical reimbursement: ${peso(result.sickness.ecMedicalReimbursement)}; permanent-disability carer allowance: ${peso(result.sickness.ecCarerMonthly)} / month.`,
      'Retain bills, prescriptions and funeral receipts. A survivor pension needs separate assessment; no pension estimate is included.',
    ] },
    { title: 'Kabuhayan / OWWA BPBH Livelihood Proposal Worksheet', lines: [
      `Proponent: ${fields.name || '________________________'}`, `Project, customers and location: ${fields.project || '________________________'}`,
      `Tools, raw materials, unit costs and requested budget: ${fields.budget || '________________________'}`,
      'Add: skills / experience, suppliers, estimated sales, operating costs, permits and monitoring plan.',
      'DILP provides approved livelihood inputs, not automatic cash. BPBH depends on OWWA membership and assessed returnee distress.',
      `BPBH candidate tier: ${peso(result.livelihood.bpbhGrant)}. Confirm eligibility and non-duplication with the regional office.`,
    ] },
    { title: 'Consolidated Documentary Checklist', lines: result.consolidatedChecklist.map(c => `[ ] ${c}`) },
    { title: 'Program References', lines: result.matchedPrograms.flatMap(p => [p.name, p.basis, p.source]) },
  ];
  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      setError('');
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 18;
      for (const section of sections) {
        const lines = [section.title, ...section.lines, ''];
        // Keep each short worksheet together instead of leaving its last lines on a new page.
        doc.setFontSize(10);
        const height = lines.reduce((total, line) => total + doc.splitTextToSize(line, 175).length * 6, 0) + 5;
        if (y > 18 && height <= 257 && y + height > 275) { doc.addPage(); y = 18; }
        for (let index = 0; index < lines.length; index++) {
          doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
          doc.setFontSize(index === 0 ? 12 : 10);
          const wrapped: string[] = doc.splitTextToSize(lines[index], 175);
          for (const line of wrapped) {
            if (y > 275) { doc.addPage(); y = 18; }
            doc.text(line, 18, y); y += 6;
          }
        }
        y += 5;
      }
      doc.save('TulongPH-Worker-Worksheet.pdf');
    } catch { setError(english ? 'PDF download failed. Try Print / Save as PDF.' : 'Hindi na-download ang PDF. Subukan ang Print / Save as PDF.'); }
    finally { setBusy(false); }
  }
  return <section className={moving ? "overflow-x-clip motion-reduce:overflow-x-visible" : "overflow-visible"}><div onAnimationEnd={e => { if (e.target === e.currentTarget) setMoving(false); }} className="space-y-6 animate-step-enter step-enter-forward">
    <style>{`@media print { @page { size: A4; margin: 15mm; } .worker-packet { color: #111; background: white; } .worker-packet article { break-inside: avoid; border: 0; padding: 0; margin-bottom: 8mm; } }`}</style>
    <div className="print:hidden"><CivicViewHeader icon={Printer} badge={english ? 'Print-ready preparation worksheets' : 'Print-ready na preparation worksheets'} title="Printable Worker Packet" description={english ? 'Choose presets and add your details. These preparation worksheets stay in the current tab and are not official filed applications.' : 'Piliin ang chips at idagdag ang detalye mo; preparation worksheet lang ito, hindi official filed application. Nasa kasalukuyang tab ang datos.'} actions={<><button type="button" onClick={() => window.print()} className={civicPrimary}><Printer aria-hidden="true" className="h-4 w-4" />{english ? 'Print / Save as PDF' : 'I-print / Save as PDF'}</button><button type="button" disabled={busy} onClick={() => void download()} className={civicSecondary}><Download aria-hidden="true" className="h-4 w-4" />{busy ? (english ? 'Generating PDF...' : 'Ginagawa ang PDF...') : 'Download PDF'}</button></>} /></div>
    <form autoComplete="off" onSubmit={e => e.preventDefault()} className={`${civicCard} grid sm:grid-cols-2 gap-4 print:hidden`}>
      {([
        ['name', 'Pangalan ng manggagawa'], ['employer', 'Employer / respondent'], ['address', 'Employer address / contact'],
        ['start', 'Employment start date'], ['end', 'Employment end date'], ['unpaid', 'Itemized unpaid amounts / dates'],
        ['event', 'Event / work connection'], ['project', 'Livelihood project / customers'], ['budget', 'Tools / costs / budget'],
      ] as const).map(([key, label]) => <div key={key} className={['unpaid', 'event', 'project'].includes(key) ? 'sm:col-span-2 min-w-0' : 'min-w-0'}><label htmlFor={`worker-print-${key}`} className={civicLabel}>{label}</label>
        {(key === 'unpaid' || key === 'event') && <div className="flex flex-wrap gap-2 mb-2" aria-label={`${label} quick picks`}>
          {(key === 'unpaid' ? issuePresets : eventPresets).map(text => <button key={text} type="button" aria-pressed={fields[key].split('\n').includes(text)}
            className={`${chip} ${fields[key].split('\n').includes(text) ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-[#E2DFD6] bg-white'}`}
            onClick={() => toggleText(key, text)}>{text}</button>)}
        </div>}
        {key === 'project' && <div className="flex flex-wrap gap-2 mb-2" aria-label="Livelihood project presets">
          {projectPresets.map(preset => <button key={preset.project} type="button" aria-pressed={fields.project === preset.project && fields.budget === preset.budget}
            className={`${chip} ${fields.project === preset.project && fields.budget === preset.budget ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-[#E2DFD6] bg-white'}`}
            onClick={() => setFields(current => ({ ...current, project: preset.project, budget: preset.budget }))}>{preset.project} (PHP {preset.amount.toLocaleString('en-PH')})</button>)}
        </div>}
        <textarea id={`worker-print-${key}`} autoComplete="off" rows={2} value={fields[key]} onChange={e => setFields(current => ({ ...current, [key]: e.target.value }))} className={`${civicTextarea} tabular-nums`} />
      </div>)}
    </form>
    {error && <p role="alert">{error}</p>}
    <div className={civicPaperMat}><p className="mb-4 text-xs font-semibold text-slate-600 print:hidden">{english ? 'Preview: A4 worksheets, low-ink print' : 'Preview: A4 worksheets, matipid sa tinta'}</p><div className={`worker-packet ${civicPaper} space-y-8 tabular-nums`}>{sections.map(section => <article key={section.title} className="space-y-3 border-b border-[#E2DFD6] pb-6 last:border-0">
      <h3 className="text-lg font-bold mb-3">{section.title}</h3>{section.lines.map((line, i) => <p key={i} className="text-sm mb-2 whitespace-pre-wrap break-words">{line}</p>)}
    </article>)}</div></div>
  </div></section>;
}
