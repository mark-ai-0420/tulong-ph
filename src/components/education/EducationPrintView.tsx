'use client';

import { Printer, Download } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicInput, civicPrimary, civicSecondary, civicPill, civicSelectedPill, civicPaperMat, civicPaper } from '@/components/shared/civicStyles';

import { useState } from 'react';
import { LocationHierarchyFields } from '@/components/shared/LocationHierarchyFields';
import type { StudentEducationProfile } from '@/types/education';
import type { Language } from '@/lib/i18n';
import { evaluateEducationAssistance } from '@/lib/educationEngine';

type LocatedEducationProfile = StudentEducationProfile & { province?: string; barangay?: string };
interface Props { profile: LocatedEducationProfile; onChange: (profile: StudentEducationProfile) => void; language?: Language }
const control = civicInput;
const chipClass = civicPill;
const money = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EducationPrintView({ profile, onChange, language = 'taglish' }: Props) {
  const [recipient, setRecipient] = useState('CHED / UniFAST Scholarship Coordinator');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const result = evaluateEducationAssistance(profile);
  const tl = language === 'taglish';
  const programs = [...new Map([
    ...(result.tuitionProgram ? [result.tuitionProgram] : []),
    ...result.primaryPrograms.filter((match) => !result.selectedPrimary || match === result.selectedPrimary).map((match) => match.program),
    ...result.supplementalPrograms.filter((match) => !match.requiresPrimaryProgram || match.requiresPrimaryProgram === result.selectedPrimary?.program.id).map((match) => match.program),
  ].map((program) => [program.id, program])).values()];

  async function downloadPdf() {
    setBusy(true); setError('');
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const text = [
        'TulongPH: EDUCATION ASSISTANCE REQUEST AND CHECKLIST',
        'Planning worksheet only. This is not an official agency application or an approved award.',
        '', `To: ${recipient}`, 'Date: ____________________',
        `Student: ${profile.fullName || '____________________'}`,
        `School: ${profile.schoolName || '____________________'}`,
        ...(profile.province ? [`Province / Region: ${profile.province}`] : []),
        `City / Municipality: ${profile.cityMunicipality || '____________________'}`,
        ...(profile.barangay ? [`Barangay: ${profile.barangay}`] : []), '',
        'Dear Sir / Madam:',
        'I respectfully request an assessment for educational assistance or a scholarship. Please advise me about the current application call, eligibility, available funds and required documents.',
        `Covered annual tuition and fees entered: ${money(profile.annualTuitionAndFees)}`,
        `Possible direct fee relief: ${money(result.directTuitionRelief)}`,
        `Remaining covered fees: ${money(result.netRemainingTuitionBalance)}`,
        result.selectedPrimary ? `Preferred scholarship inquiry: ${result.selectedPrimary.program.name} (${money(result.selectedPrimary.annualCashAmount ?? 0)} possible annual cash).` : 'No primary scholarship selected. Please advise which single primary award is appropriate.',
        'I will disclose my existing scholarships and will not claim the same expense twice.',
        'Thank you for your guidance.', '', 'Signature: ____________________', '',
        'DOCUMENT CHECKLIST', ...result.documentaryChecklist.map((item) => `[ ] ${item}`), '',
        'PROGRAM AND LEGAL REFERENCES', ...programs.flatMap((program) => [program.name, program.statutoryBasis, program.benefits, program.stackingRule, `Official reference: ${program.sourceUrl}`, ...(program.additionalSources ?? []).map((source) => `${source.title}: ${source.url}`), '']),
        'Bring originals and copies requested by the agency. Do not give passwords or pay a fixer. Delete your local data after using a shared computer.',
      ].join('\n').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E\n]/g, '');
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      let y = 16;
      for (const paragraph of text.split('\n')) {
        const lines: string[] = pdf.splitTextToSize(paragraph || ' ', 178);
        for (const line of lines) {
          if (y > 279) { pdf.addPage(); y = 16; }
          pdf.text(line, 16, y); y += 5;
        }
      }
      pdf.save('TulongPH-Education-Packet.pdf');
    } catch { setError(tl ? 'Hindi nagawa ang PDF. Maaari pa ring gamitin ang I-print.' : 'PDF generation failed. You can still use Print.'); }
    finally { setBusy(false); }
  }

  return <section className="space-y-6">
    <div className="education-print-tools space-y-4"><CivicViewHeader icon={Printer} badge={tl ? 'Print-ready na preparation worksheet' : 'Print-ready preparation worksheet'} title="Printable scholarship packet" description={tl ? 'Draft na liham at checklist, hindi official application. Optional ang pangalan; maaari mo ring sulatan ang papel pagkatapos mag-print.' : 'Draft letter and checklist, not an official application. Your name is optional; you can complete the paper after printing.'} actions={<><button type="button" onClick={() => window.print()} className={civicPrimary}><Printer aria-hidden="true" className="h-4 w-4" />{tl ? 'I-print ang packet' : 'Print packet'}</button><button type="button" onClick={downloadPdf} disabled={busy} className={civicSecondary}><Download aria-hidden="true" className="h-4 w-4" />{busy ? (tl ? 'Ginagawa ang PDF...' : 'Generating PDF...') : (tl ? 'I-download ang PDF (English)' : 'Download PDF (English)')}</button></>} />
      <form autoComplete="off" onSubmit={(event) => event.preventDefault()} className={`${civicCard} grid gap-4 sm:grid-cols-2`}>
        {([['fullName', 'edu-print-name', tl ? 'Pangalan ng estudyante (optional)' : 'Student name (optional)'], ['schoolName', 'edu-print-school', tl ? 'Paaralan (optional)' : 'School (optional)']] as const).map(([key, id, label]) => <div key={key}><label htmlFor={id} className={civicLabel}>{label}</label><input autoComplete="off" id={id} maxLength={150} className={control} value={profile[key]} onChange={(event) => onChange({ ...profile, [key]: event.target.value })} /></div>)}
        <div className="sm:col-span-2"><LocationHierarchyFields idPrefix="edu-print" cityId="edu-print-city" value={profile} language={language} onChange={(location, updateMetadata) => onChange({ ...profile, province: location.province, cityMunicipality: location.cityMunicipality, barangay: location.barangay, ...(updateMetadata ? { location: location.locationTier, regionalDailyWage: location.regionalDailyWage } : {}) } as LocatedEducationProfile)} /></div>
        <div><label htmlFor="edu-print-recipient" className={civicLabel}>{tl ? 'Para kanino ang liham?' : 'Letter recipient'}</label><select autoComplete="off" id="edu-print-recipient" className={control} value={recipient} onChange={(event) => setRecipient(event.target.value)}><option>CHED / UniFAST Scholarship Coordinator</option><option>DSWD Crisis Intervention Unit</option><option>Office of the Mayor / Governor</option></select></div>
      </form>
      <div className="space-y-3">
        <div role="group" aria-label={tl ? 'Mabilis na pili ng paaralan' : 'School presets'} className="flex flex-wrap gap-2">{['UP / PUP / TUP / State Univ', 'City / Municipal College (LUC)', 'Private Senior High / College'].map(schoolName => <button type="button" key={schoolName} className={profile.schoolName === schoolName ? civicSelectedPill : chipClass} aria-pressed={profile.schoolName === schoolName} onClick={() => onChange({ ...profile, schoolName })}>{schoolName}</button>)}</div>
        <div role="group" aria-label={tl ? 'Tatanggap ng liham' : 'Recipient presets'} className="flex flex-wrap gap-2">{['CHED / UniFAST Scholarship Coordinator', 'DSWD Crisis Intervention Unit', 'Office of the Mayor / Governor'].map(item => <button type="button" key={item} className={recipient === item ? civicSelectedPill : chipClass} aria-pressed={recipient === item} onClick={() => setRecipient(item)}>{item}</button>)}</div>
        <p className="text-xs text-slate-600">{tl ? 'Piliin ang halimbawa at palitan ng eksaktong paaralan o lungsod bago isumite.' : 'Choose an example and enter the exact school or city before submission.'}</p>
      </div>
      <p className="text-xs text-slate-600">{tl ? 'Native print: buong Filipino at mga pangalan. PDF: English, PHP currency at transliterated names para sa built-in font.' : 'Native print preserves full Filipino text and names. PDF uses English, PHP currency and transliterated names for its built-in font.'}</p>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    </div>
    <div className={civicPaperMat}><p className="mb-4 text-xs font-semibold text-slate-600 print:hidden">{tl ? 'Preview: A4 worksheet, matipid sa tinta' : 'Preview: A4 worksheet, low-ink print'}</p><div className={`education-print-packet ${civicPaper} space-y-8`}>
      <article className="space-y-4 text-sm leading-relaxed text-slate-900"><h2 className="text-xl font-bold">Liham Kahilingan para sa Educational Assistance</h2><p>Petsa: ____________________</p><p>Para sa: {recipient}</p><p>Magandang araw po,</p><p>Ako po si <strong>{profile.fullName || '____________________'}</strong>, nag-aaral sa <strong>{profile.schoolName || '____________________'}</strong> sa {[profile.barangay, profile.cityMunicipality, profile.province].filter(Boolean).join(', ') || '____________________'}. Magalang po akong humihiling ng assessment para sa educational assistance o scholarship. Pakigabayan po ako tungkol sa kasalukuyang application call, kwalipikasyon, pondo at mga dokumento.</p>
        <dl aria-live="polite" className="space-y-2 tabular-nums"><div className="flex flex-wrap justify-between gap-2"><dt>Covered annual tuition at fees</dt><dd>{money(profile.annualTuitionAndFees)}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Posibleng direct fee relief</dt><dd>{money(result.directTuitionRelief)}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Natitirang covered fees</dt><dd>{money(result.netRemainingTuitionBalance)}</dd></div></dl>
        {result.selectedPrimary && <p>Napiling scholarship na gustong itanong: <strong>{result.selectedPrimary.program.name}</strong>. {result.selectedPrimary.condition}</p>}<p>Ipapaalam ko po ang lahat ng kasalukuyang scholarship at tulong. Nauunawaan ko pong kailangang iwasan ang pag-claim nang dalawang beses para sa parehong gastos. Ang worksheet na ito ay gabay at hindi garantiya ng approval.</p><p>Maraming salamat po sa inyong gabay.</p><p>Lagda: ____________________</p>
      </article>
      <article className="education-print-section space-y-3 text-sm"><h2 className="text-xl font-bold">Documentary checklist</h2><p>Combined checklist ito ng mga posibleng programa. Kumpirmahin ang eksaktong requirements ng napiling programa; hindi kailangan lahat para sa bawat aplikasyon.</p><ul className="space-y-2">{result.documentaryChecklist.map((item) => <li key={item}>[ ] {item}</li>)}</ul>{result.documentaryChecklist.length === 0 && <p>Piliin muna ang iyong pathway sa gabay; dalhin ang school registration at valid ID para sa initial inquiry.</p>}<p>Kung kailangan ng Barangay Certificate of Indigency o social case study, magtanong sa barangay o CSWDO/MSWDO. Ang desk ang magpapasya kung kailangan ito.</p></article>
      <article className="education-print-section space-y-4 text-sm"><h2 className="text-xl font-bold">Statutory quick reference</h2>{programs.map((program) => <div key={program.id} className="break-inside-avoid space-y-1 border-t border-slate-300 pt-3"><h3 className="font-bold">{program.name}</h3><p>{program.statutoryBasis}</p><p className="tabular-nums">{program.benefits}</p><p>{program.stackingRule}</p><p className="break-all text-xs">{program.sourceUrl}</p>{program.additionalSources?.map((source) => <p key={source.url} className="break-all text-xs">{source.title}: {source.url}</p>)}</div>)}<p>Huwag magbayad sa fixer. Pagkatapos gamitin ang shared computer, pindutin ang Burahin ang Data.</p></article>
    </div>
    </div>
    <style>{`@media print { @page { size: A4; margin: 15mm; } .education-page > header, .education-print-tools, .education-page footer { display: none !important; } .education-page > main { padding: 0 !important; max-width: none !important; } .education-print-packet { border: 0 !important; border-radius: 0 !important; padding: 0 !important; background: white !important; box-shadow: none !important; } .education-print-section { break-before: page; } .education-print-packet * { color: #111 !important; } }`}</style>
  </section>;
}
