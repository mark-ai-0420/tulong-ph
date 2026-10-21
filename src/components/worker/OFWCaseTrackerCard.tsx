'use client';

import { Check, Clipboard, FileText, Phone } from 'lucide-react';
import { useId, useState } from 'react';
import type { Language } from '@/lib/i18n';
import {
  calculateOFWEntitlements,
  OFW_CASE_MILESTONES,
  toggleChecklistItem,
  updateCaseMilestone,
  type OFWCaseMilestone,
  type OFWCaseRecord,
  type OFWChecklist,
  type OFWEmploymentCategory,
  type OFWCaseType,
  type OFWContractStatus,
  type OFWOwwaContributions,
  type OFWOwwaStatus,
} from '@/lib/ofwTracker';

const copy = {
  taglish: {
    title: 'OFW case tracker', description: 'I-save at i-update ang iyong local case record. Hindi ito konektado sa DMW o OWWA at hindi ito patunay ng agency action.',
    name: 'Pangalan ng OFW', category: 'Uri ng trabaho', country: 'Bansa o pangalan ng barko', employer: 'Foreign employer o shipowner', agency: 'Local recruitment o manning agency',
    caseType: 'Uri ng kaso', contract: 'Katayuan ng kontrata', owwa: 'Katayuan ng OWWA', contributions: 'Bilang ng OWWA contributions', singleContribution: 'Isang contribution, hanggang PHP 5,000', multipleContributions: 'Higit sa isang contribution, hanggang PHP 10,000', dmwNumber: 'DMW case number', mwoNumber: 'MWO case number', notes: 'Pribadong tala para sa iyong sarili',
    land: 'Land-based', sea: 'Sea-based', caseTypes: ['Repatriation', 'Unpaid salaries', 'Maltreatment', 'Medical emergency', 'Seafarer disability'],
    contractStatuses: ['Verified by DMW', 'Unverified direct hire', 'Tourist or irregular status', 'Expired'],
    owwaStatuses: ['Active', 'Inactive', 'Undocumented non-member'], milestones: ['Naitala', 'Nakontak ang agency', 'Nabuksan ang MWO case', 'Naaprubahan ang tulong', 'Nakauwi na', 'Naayos na'],
    progress: 'Hakbang sa kaso', checklist: 'Mga dokumentong ihanda', counter: 'nakumpleto', checklistItems: ['Passport', 'Kontrata', 'OEC o e-Registration', 'Incident report o ebidensya', 'Pormal na sulat sa agency'],
    liabilityTitle: 'Paalala tungkol sa joint and solidary liability', liabilityText: 'Maaaring jointly and severally liable ang principal/employer at local recruitment agency para sa qualifying money claims sa ilalim ng RA 8042/10022. Ipa-assess ang claim sa DMW o NLRC.',
    agencyNeeded: 'Ilagay ang pangalan ng local recruitment o manning agency kung mayroon.', entitlements: 'Mga posibleng tulong', aksyon: 'DMW AKSYON Fund', aksyonYes: 'Maaaring humingi ng tulong ang OFW na nasa distress anuman ang immigration status. DMW ang mag-a-assess.', bpbh: 'Tinatayang OWWA BPBH support', estimate: 'Tantiya lamang. Hindi ito garantiya ng approval; OWWA ang magkukumpirma ng eligibility at anyo ng tulong.',
    seaNote: 'Sea-based case: ipa-review ang signed SEC, CBA, applicable POEA-SEC terms at RA 12021 sa DMW o NLRC. Hindi nito kinukuwenta ang disability benefit o sick wage.',
    hotline: 'Tumawag sa DMW/OWWA 24/7 Public Assistance Desk', call: 'Tumawag sa 1348', letter: 'Pormal na abiso sa local agency', letterHint: 'Punuin ang pangalan at agency sa itaas bago kopyahin ang draft.', copy: 'Kopyahin ang sulat', copied: 'Nakopya ang sulat.', copyFailed: 'Hindi nakopya. Piliin at kopyahin ang draft nang mano-mano.',
    current: 'Kasalukuyang hakbang', missing: 'Wala pang detalye', saved: 'Nasa browser lang ang datos na ito. Huwag mag-save ng sensitibong detalye sa shared computer.',
  },
  cebuano: {
    title: 'OFW case tracker', description: 'I-save ug i-update ang imong lokal nga case record. Dili kini konektado sa DMW o OWWA ug dili kini pamatuod sa aksyon sa ahensiya.',
    name: 'Ngalan sa OFW', category: 'Matang sa trabaho', country: 'Nasod o ngalan sa barko', employer: 'Foreign employer o shipowner', agency: 'Lokal nga recruitment o manning agency',
    caseType: 'Matang sa kaso', contract: 'Kahimtang sa kontrata', owwa: 'Kahimtang sa OWWA', contributions: 'Gidaghanon sa kontribusyon sa OWWA', singleContribution: 'Usa ka kontribusyon, hangtod PHP 5,000', multipleContributions: 'Labaw sa usa ka kontribusyon, hangtod PHP 10,000', dmwNumber: 'DMW case number', mwoNumber: 'MWO case number', notes: 'Pribadong mga nota para sa imong kaugalingon',
    land: 'Land-based', sea: 'Sea-based', caseTypes: ['Pagpauli', 'Wala mabayri nga sweldo', 'Pagmaltrato', 'Medical emergency', 'Kakulangan sa seafarer'],
    contractStatuses: ['Gikumpirma sa DMW', 'Wala gikumpirma nga direct hire', 'Tourist o irregular nga kahimtang', 'Expired'],
    owwaStatuses: ['Aktibo', 'Dili aktibo', 'Walay dokumento ug dili miyembro'], milestones: ['Narekord', 'Nakontak ang agency', 'Giablihan ang MWO case', 'Gi-aprubahan ang tabang', 'Nauli na', 'Nasulbad na'],
    progress: 'Mga lakang sa kaso', checklist: 'Mga dokumentong andamon', counter: 'nahuman', checklistItems: ['Passport', 'Kontrata', 'OEC o e-Registration', 'Incident report o ebidensya', 'Pormal nga sulat sa agency'],
    liabilityTitle: 'Pahinumdom sa joint and solidary liability', liabilityText: 'Mahimong jointly and severally liable ang principal/employer ug lokal nga recruitment agency alang sa kwalipikadong money claims ubos sa RA 8042/10022. Ipa-assess ang claim sa DMW o NLRC.',
    agencyNeeded: 'Ibutang ang ngalan sa lokal nga recruitment o manning agency kon anaa.', entitlements: 'Posibleng tabang', aksyon: 'DMW AKSYON Fund', aksyonYes: 'Ang OFW nga naa sa kalisod mahimong mangayo og tabang bisan unsa ang immigration status. DMW ang motimbang.', bpbh: 'Gibanabana nga OWWA BPBH support', estimate: 'Banabana lamang. Dili garantiya sa approval; kumpirmahon sa OWWA ang eligibility ug matang sa tabang.',
    seaNote: 'Sea-based nga kaso: ipa-review sa DMW o NLRC ang gipirmahang SEC, CBA, magamit nga POEA-SEC terms ug RA 12021. Dili niini kwentahon ang disability benefit o sick wage.',
    hotline: 'Tawag sa DMW/OWWA 24/7 Public Assistance Desk', call: 'Tawag sa 1348', letter: 'Pormal nga pahibalo sa lokal nga agency', letterHint: 'Ibutang una ang ngalan ug agency sa ibabaw sa draft sa dili pa kopyahon.', copy: 'Kopyaha ang sulat', copied: 'Nakopya na ang sulat.', copyFailed: 'Wala makopya. Pilia ug kopyaha ang draft pinaagi sa kamot.',
    current: 'Karon nga lakang', missing: 'Wala pay detalye', saved: 'Naa lamang sa browser kining datos. Ayaw pagtipig og sensitibong detalye sa computer nga gipaambit.',
  },
  ilocano: {
    title: 'OFW case tracker', description: 'Idulin ken i-update ti lokal a case record. Saan daytoy a konektado iti DMW wenno OWWA ken saan a pammaneknek ti aksion ti ahensia.',
    name: 'Nagan ti OFW', category: 'Kita ti trabaho', country: 'Pagilian wenno nagan ti barko', employer: 'Foreign employer wenno shipowner', agency: 'Lokal a recruitment wenno manning agency',
    caseType: 'Kita ti kaso', contract: 'Kasasaad ti kontrata', owwa: 'Kasasaad ti OWWA', contributions: 'Bilang dagiti kontribusion ti OWWA', singleContribution: 'Maysa a kontribusion, agingga PHP 5,000', multipleContributions: 'Nasurok iti maysa a kontribusion, agingga PHP 10,000', dmwNumber: 'DMW case number', mwoNumber: 'MWO case number', notes: 'Pribado a nota para iti bagim',
    land: 'Land-based', sea: 'Sea-based', caseTypes: ['Panagawid', 'Sahod a saan a nabayadan', 'Panangmaltrato', 'Emergency medikal', 'Disability ti seafarer'],
    contractStatuses: ['Napaneknekan ti DMW', 'Saan a napaneknekan a direct hire', 'Tourist wenno irregular a kasasaad', 'Nagpaso'],
    owwaStatuses: ['Aktibo', 'Saan nga aktibo', 'Awan dokumento ken saan a miembro'], milestones: ['Nairekord', 'Nakontak ti agency', 'Nalukatan ti MWO case', 'Naaprobaran ti tulong', 'Nakadanon iti pagtaengan', 'Naurnos ti kaso'],
    progress: 'Dagiti addang ti kaso', checklist: 'Dagiti dokumento a maisagana', counter: 'nalpas', checklistItems: ['Passport', 'Kontrata', 'OEC wenno e-Registration', 'Incident report wenno pammaneknek', 'Pormal a surat iti agency'],
    liabilityTitle: 'Palagip maipanggep iti joint and solidary liability', liabilityText: 'Mabalin a jointly and severally liable ti principal/employer ken lokal a recruitment agency para kadagiti kwalipikado a money claims iti babaen ti RA 8042/10022. Ipa-assess ti claim iti DMW wenno NLRC.',
    agencyNeeded: 'Iserrek ti nagan ti lokal a recruitment wenno manning agency no adda.', entitlements: 'Dagiti mabalin a tulong', aksyon: 'DMW AKSYON Fund', aksyonYes: 'Mabalin a dumawat ti tulong ti OFW a marigatan uray aniaman ti immigration status. DMW ti mangamiris.', bpbh: 'Pagarup a OWWA BPBH support', estimate: 'Pagarup laeng. Saan a garantiya ti panag-apruba; OWWA ti mangpasingked iti eligibility ken kita ti tulong.',
    seaNote: 'Sea-based a kaso: ipa-review iti DMW wenno NLRC ti napirmaan a SEC, CBA, maipakat a POEA-SEC terms ken RA 12021. Saan a kalkularen daytoy ti disability benefit wenno sick wage.',
    hotline: 'Tumawag iti DMW/OWWA 24/7 Public Assistance Desk', call: 'Tumawag iti 1348', letter: 'Pormal a pannakaammo iti lokal nga agency', letterHint: 'Isurat ti nagan ken agency iti ngato ti draft sakbay a kopyaen.', copy: 'Kopyaen ti surat', copied: 'Nakopya ti surat.', copyFailed: 'Saan a nakopya. Pilien ken kopyaen ti draft babaen iti ima.',
    current: 'Agdama nga addang', missing: 'Awan pay detalye', saved: 'Iti browser laeng ti datos. Dimo idulin ti sensitibo a detalye iti kompyuter a pagsasaran.',
  },
  en: {
    title: 'OFW case tracker', description: 'Save and update a local case record. This is not connected to DMW or OWWA and does not confirm agency action.',
    name: 'OFW name', category: 'Employment category', country: 'Country or vessel name', employer: 'Foreign employer or shipowner', agency: 'Local recruitment or manning agency',
    caseType: 'Case type', contract: 'Contract status', owwa: 'OWWA status', contributions: 'OWWA contribution count', singleContribution: 'One contribution, up to PHP 5,000', multipleContributions: 'More than one contribution, up to PHP 10,000', dmwNumber: 'DMW case number', mwoNumber: 'MWO case number', notes: 'Private notes for your own use',
    land: 'Land-based', sea: 'Sea-based', caseTypes: ['Repatriation', 'Unpaid salaries', 'Maltreatment', 'Medical emergency', 'Seafarer disability'],
    contractStatuses: ['Verified by DMW', 'Unverified direct hire', 'Tourist or irregular status', 'Expired'],
    owwaStatuses: ['Active', 'Inactive', 'Undocumented non-member'], milestones: ['Reported', 'Local agency contacted', 'MWO case opened', 'Assistance approved', 'Repatriated', 'Settled'],
    progress: 'Case progress', checklist: 'Documents to prepare', counter: 'complete', checklistItems: ['Passport', 'Contract', 'OEC or e-Registration', 'Incident report or evidence', 'Formal letter to agency'],
    liabilityTitle: 'Joint and several liability reminder', liabilityText: 'The principal/employer and local recruitment agency may be jointly and severally liable for qualifying money claims under RA 8042/10022. Ask DMW or NLRC to assess the claim.',
    agencyNeeded: 'Enter the local recruitment or manning agency if known.', entitlements: 'Possible assistance', aksyon: 'DMW AKSYON Fund', aksyonYes: 'An OFW in distress may seek assistance regardless of immigration status. DMW assesses each request.', bpbh: 'Estimated OWWA BPBH support', estimate: 'Estimate only. This does not guarantee approval; OWWA confirms eligibility and the form of support.',
    seaNote: 'Sea-based case: ask DMW or NLRC to review the signed SEC, CBA, applicable POEA-SEC terms, and RA 12021. This tracker does not calculate disability benefits or sick wages.',
    hotline: 'Call the DMW/OWWA 24/7 Public Assistance Desk', call: 'Call 1348', letter: 'Formal notice to local agency', letterHint: 'Fill in the name and agency above before copying the draft.', copy: 'Copy letter', copied: 'Letter copied.', copyFailed: 'Could not copy. Select and copy the draft manually.',
    current: 'Current step', missing: 'Not provided', saved: 'This data stays in this browser. Avoid saving sensitive details on a shared computer.',
  },
} satisfies Record<Language, Record<string, string | string[]>>;

const caseTypes: Record<Language, Record<OFWCaseType, string>> = {
  taglish: { repatriation: 'Repatriation', unpaid_salaries: 'Unpaid salaries', maltreatment: 'Maltreatment', medical_emergency: 'Medical emergency', seafarer_disability: 'Seafarer disability' },
  cebuano: { repatriation: 'Pagpauli', unpaid_salaries: 'Wala mabayri nga sweldo', maltreatment: 'Pagmaltrato', medical_emergency: 'Medical emergency', seafarer_disability: 'Kakulangan sa seafarer' },
  ilocano: { repatriation: 'Panagawid', unpaid_salaries: 'Sahod a saan a nabayadan', maltreatment: 'Panangmaltrato', medical_emergency: 'Emergency medikal', seafarer_disability: 'Disability ti seafarer' },
  en: { repatriation: 'Repatriation', unpaid_salaries: 'Unpaid salaries', maltreatment: 'Maltreatment', medical_emergency: 'Medical emergency', seafarer_disability: 'Seafarer disability' },
};
const contractStatuses: Record<Language, Record<OFWContractStatus, string>> = {
  taglish: { verified_dmw: 'Verified by DMW', unverified_direct_hire: 'Unverified direct hire', tourist_irregular: 'Tourist or irregular status', expired: 'Expired' },
  cebuano: { verified_dmw: 'Gikumpirma sa DMW', unverified_direct_hire: 'Wala gikumpirma nga direct hire', tourist_irregular: 'Tourist o irregular nga kahimtang', expired: 'Expired' },
  ilocano: { verified_dmw: 'Napaneknekan ti DMW', unverified_direct_hire: 'Saan a napaneknekan a direct hire', tourist_irregular: 'Tourist wenno irregular a kasasaad', expired: 'Nagpaso' },
  en: { verified_dmw: 'Verified by DMW', unverified_direct_hire: 'Unverified direct hire', tourist_irregular: 'Tourist or irregular status', expired: 'Expired' },
};
const owwaStatuses: Record<Language, Record<OFWOwwaStatus, string>> = {
  taglish: { active: 'Active', inactive: 'Inactive', undocumented_non_member: 'Undocumented non-member' },
  cebuano: { active: 'Aktibo', inactive: 'Dili aktibo', undocumented_non_member: 'Walay dokumento ug dili miyembro' },
  ilocano: { active: 'Aktibo', inactive: 'Saan nga aktibo', undocumented_non_member: 'Awan dokumento ken saan a miembro' },
  en: { active: 'Active', inactive: 'Inactive', undocumented_non_member: 'Undocumented non-member' },
};
const milestones: Record<Language, Record<OFWCaseMilestone, string>> = {
  taglish: { reported: 'Naitala', agency_contacted: 'Nakontak ang agency', mwo_case_opened: 'Nabuksan ang MWO case', assistance_approved: 'Naaprubahan ang tulong', repatriated: 'Nakauwi na', settled: 'Naayos na' },
  cebuano: { reported: 'Narekord', agency_contacted: 'Nakontak ang agency', mwo_case_opened: 'Giablihan ang MWO case', assistance_approved: 'Gi-aprubahan ang tabang', repatriated: 'Nauli na', settled: 'Nasulbad na' },
  ilocano: { reported: 'Nairekord', agency_contacted: 'Nakontak ti agency', mwo_case_opened: 'Nalukatan ti MWO case', assistance_approved: 'Naaprobaran ti tulong', repatriated: 'Nakadanon iti pagtaengan', settled: 'Naurnos ti kaso' },
  en: { reported: 'Reported', agency_contacted: 'Local agency contacted', mwo_case_opened: 'MWO case opened', assistance_approved: 'Assistance approved', repatriated: 'Repatriated', settled: 'Settled' },
};

const checklistKeys: (keyof OFWChecklist)[] = ['passport', 'contract', 'oecOrEreg', 'incidentReportOrEvidence', 'localAgencyLetter'];

function makeAgencyLetter(record: OFWCaseRecord, language: Language): string {
  const agency = record.localAgency || '____________________________';
  const name = record.ofwName || '____________________________';
  const employer = record.foreignEmployer || '____________________________';
  const location = record.countryOrVessel || '____________________________';
  const caseName = caseTypes[language][record.caseType];
  if (language === 'cebuano') return `Petsa: ____________________\n\nNgadto sa: ${agency}\n\nSubject: Pormal nga pahibalo ug hangyo og tabang\n\nAko si ${name}, bahin sa akong trabaho sa ${employer} sa ${location}. Nagsulat ko bahin sa ${caseName}. Palihog kumpirmahi sa pagsulat ang pagdawat niini ug ipahibalo ang mga lakang nga inyong buhaton. Palihog tabangi ang pagkoordinar sa DMW/MWO ug pagpreserbar sa may kalabotan nga rekord ug ebidensya.\n\nAng pahibalo sa posibleng responsibilidad ubos sa RA 8042/10022 dili pinal nga legal nga konklusyon. Palihog ipasusi ang mga kamatuoran ug kontrata sa DMW o NLRC.\n\nMatinahuron,\n${name}\n\nContact: ____________________`;
  if (language === 'ilocano') return `Petsa: ____________________\n\nPara iti: ${agency}\n\nSubject: Pormal a pannakaaammo ken kiddaw a tulong\n\nSiak ni ${name}, a nagtrabaho iti babaen ni ${employer} idiay ${location}. Agsurat ak maipanggep iti ${caseName}. Pangngaasiyo ta pasingkedan iti surat ti panangawat iti daytoy ken ibaga dagiti addang nga aramidenyo. Tulonganyo ti panagkoordinar iti DMW/MWO ken ti panangsalaknib kadagiti rekord ken pammaneknek a mainaig.\n\nTi pannakaaammo maipanggep iti mabalin a responsabilidad iti babaen ti RA 8042/10022 ket saan a pinal a legal a konklusyon. Ipaamiris dagiti kinapudno ken kontrata iti DMW wenno NLRC.\n\nAgyamanak,\n${name}\n\nContact: ____________________`;
  if (language === 'en') return `Date: ____________________\n\nTo: ${agency}\n\nSubject: Formal notice and request for assistance\n\nI am ${name}, in connection with my employment with ${employer} in ${location}. I am writing about ${caseName}. Please confirm receipt in writing and advise what steps your agency will take. Please assist with coordination with DMW/MWO and preserve relevant records and evidence.\n\nThis notice of possible responsibility under RA 8042/10022 is not a final legal conclusion. Please have DMW or NLRC assess the facts and contract.\n\nSincerely,\n${name}\n\nContact: ____________________`;
  return `Petsa: ____________________\n\nPara sa: ${agency}\n\nPaksa: Pormal na abiso at kahilingan ng tulong\n\nAko si ${name}, kaugnay ng aking trabaho sa ${employer} sa ${location}. Sumusulat ako tungkol sa ${caseName}. Pakikumpirma sa sulat ang pagtanggap nito at ipaalam ang mga hakbang na gagawin ng inyong agency. Tumulong sa pakikipag-ugnayan sa DMW/MWO at panatilihin ang kaugnay na records at ebidensya.\n\nAng abisong ito tungkol sa posibleng pananagutan sa ilalim ng RA 8042/10022 ay hindi pinal na legal na konklusyon. Ipa-assess sa DMW o NLRC ang mga pangyayari at kontrata.\n\nLubos na gumagalang,\n${name}\n\nContact: ____________________`;
}

interface Props {
  record: OFWCaseRecord;
  onChange: (record: OFWCaseRecord) => void;
  language?: Language;
  readOnly?: boolean;
}

export function OFWCaseTrackerCard({ record, onChange, language = 'taglish', readOnly = false }: Props) {
  const text = copy[language];
  const id = useId().replaceAll(':', '');
  const [copyStatus, setCopyStatus] = useState('');
  const entitlements = calculateOFWEntitlements(record);
  const advice = entitlements.advice[language];
  const checkedCount = checklistKeys.filter(key => record.checklist[key]).length;
  const fieldClass = 'min-h-[44px] w-full rounded-xl border border-[#C9C5B8] bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900';
  const fieldLabel = 'block text-sm font-semibold text-slate-800';
  const currentIndex = OFW_CASE_MILESTONES.indexOf(record.currentMilestone);
  const checklistLabels = text.checklistItems as string[];

  function update<K extends keyof OFWCaseRecord>(key: K, value: OFWCaseRecord[K]) {
    onChange({ ...record, [key]: value, updatedAt: new Date().toISOString() });
  }

  async function copyAgencyLetter() {
    try {
      await navigator.clipboard.writeText(makeAgencyLetter(record, language));
      setCopyStatus(text.copied);
    } catch {
      setCopyStatus(text.copyFailed);
    }
  }

  const detailValues: [string, string][] = [
    [text.name, record.ofwName], [text.category, record.category === 'sea_based' ? text.sea : text.land],
    [text.country, record.countryOrVessel], [text.employer, record.foreignEmployer], [text.agency, record.localAgency],
    [text.caseType, caseTypes[language][record.caseType]], [text.contract, contractStatuses[language][record.contractStatus]],
    [text.owwa, owwaStatuses[language][record.owwaStatus]], [text.dmwNumber, record.caseNumberDMW ?? ''],
    [text.mwoNumber, record.caseNumberMWO ?? ''],
  ];
  if (record.owwaStatus === 'inactive') {
    detailValues.push([text.contributions, record.owwaContributions === 'single' ? text.singleContribution : text.multipleContributions]);
  }

  return <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-[#D8D3C7] bg-white p-4 shadow-sm sm:p-5">
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-900">{record.category === 'sea_based' ? text.sea : text.land}</p>
        <h2 id={`${id}-title`} className="mt-1 text-xl font-bold text-slate-900">{text.title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{text.description}</p>
      </div>
      <span className="inline-flex min-h-[36px] items-center rounded-full border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-950">{caseTypes[language][record.caseType]}</span>
    </header>

    {readOnly ? <dl className="grid gap-x-4 gap-y-3 border-y border-[#E2DFD6] py-4 sm:grid-cols-2 lg:grid-cols-3">
      {detailValues.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{value || text.missing}</dd></div>)}
    </dl> : <div className="grid gap-3 border-y border-[#E2DFD6] py-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className={fieldLabel} htmlFor={`${id}-name`}>{text.name}<input id={`${id}-name`} autoComplete="off" maxLength={200} className={`${fieldClass} mt-1`} value={record.ofwName} onChange={event => update('ofwName', event.target.value)} /></label>
      <label className={fieldLabel} htmlFor={`${id}-category`}>{text.category}<select id={`${id}-category`} className={`${fieldClass} mt-1`} value={record.category} onChange={event => update('category', event.target.value as OFWEmploymentCategory)}><option value="land_based">{text.land}</option><option value="sea_based">{text.sea}</option></select></label>
      <label className={fieldLabel} htmlFor={`${id}-location`}>{text.country}<input id={`${id}-location`} autoComplete="off" maxLength={200} className={`${fieldClass} mt-1`} value={record.countryOrVessel} onChange={event => update('countryOrVessel', event.target.value)} /></label>
      <label className={fieldLabel} htmlFor={`${id}-employer`}>{text.employer}<input id={`${id}-employer`} autoComplete="off" maxLength={200} className={`${fieldClass} mt-1`} value={record.foreignEmployer} onChange={event => update('foreignEmployer', event.target.value)} /></label>
      <label className={fieldLabel} htmlFor={`${id}-agency`}>{text.agency}<input id={`${id}-agency`} autoComplete="off" maxLength={200} className={`${fieldClass} mt-1`} value={record.localAgency} onChange={event => update('localAgency', event.target.value)} /></label>
      <label className={fieldLabel} htmlFor={`${id}-type`}>{text.caseType}<select id={`${id}-type`} className={`${fieldClass} mt-1`} value={record.caseType} onChange={event => update('caseType', event.target.value as OFWCaseType)}>{(['repatriation', 'unpaid_salaries', 'maltreatment', 'medical_emergency', 'seafarer_disability'] as OFWCaseType[]).map((value, index) => <option key={value} value={value}>{(text.caseTypes as string[])[index]}</option>)}</select></label>
      <label className={fieldLabel} htmlFor={`${id}-contract`}>{text.contract}<select id={`${id}-contract`} className={`${fieldClass} mt-1`} value={record.contractStatus} onChange={event => update('contractStatus', event.target.value as OFWContractStatus)}>{(['verified_dmw', 'unverified_direct_hire', 'tourist_irregular', 'expired'] as OFWContractStatus[]).map((value, index) => <option key={value} value={value}>{(text.contractStatuses as string[])[index]}</option>)}</select></label>
      <label className={fieldLabel} htmlFor={`${id}-owwa`}>{text.owwa}<select id={`${id}-owwa`} className={`${fieldClass} mt-1`} value={record.owwaStatus} onChange={event => update('owwaStatus', event.target.value as OFWOwwaStatus)}>{(['active', 'inactive', 'undocumented_non_member'] as OFWOwwaStatus[]).map((value, index) => <option key={value} value={value}>{(text.owwaStatuses as string[])[index]}</option>)}</select></label>
      {record.owwaStatus === 'inactive' && <label className={fieldLabel} htmlFor={`${id}-contributions`}>{text.contributions}<select id={`${id}-contributions`} autoComplete="off" className={`${fieldClass} mt-1`} value={record.owwaContributions ?? 'multiple'} onChange={event => update('owwaContributions', event.target.value as OFWOwwaContributions)}><option value="single">{text.singleContribution}</option><option value="multiple">{text.multipleContributions}</option></select></label>}
      <label className={fieldLabel} htmlFor={`${id}-dmw`}>{text.dmwNumber}<input id={`${id}-dmw`} autoComplete="off" maxLength={120} className={`${fieldClass} mt-1`} value={record.caseNumberDMW ?? ''} onChange={event => update('caseNumberDMW', event.target.value || undefined)} /></label>
      <label className={fieldLabel} htmlFor={`${id}-mwo`}>{text.mwoNumber}<input id={`${id}-mwo`} autoComplete="off" maxLength={120} className={`${fieldClass} mt-1`} value={record.caseNumberMWO ?? ''} onChange={event => update('caseNumberMWO', event.target.value || undefined)} /></label>
      <label className={`${fieldLabel} sm:col-span-2 lg:col-span-3`} htmlFor={`${id}-notes`}>{text.notes}<textarea id={`${id}-notes`} autoComplete="off" maxLength={2000} className={`${fieldClass} mt-1 min-h-20`} value={record.notes ?? ''} onChange={event => update('notes', event.target.value || undefined)} /></label>
    </div>}

    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">{text.progress}</h3><span className="text-sm text-slate-600">{text.current}: {milestones[language][record.currentMilestone]}</span></div>
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label={text.progress}>
        {OFW_CASE_MILESTONES.map((milestone, index) => {
          const reached = index <= currentIndex;
          const content = <><span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${reached ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-400 bg-white text-slate-600'}`}>{index < currentIndex ? <Check className="h-4 w-4" /> : index + 1}</span><span className="text-left text-sm font-semibold">{milestones[language][milestone]}</span></>;
          return <li key={milestone}>
            {readOnly ? <div aria-current={milestone === record.currentMilestone ? 'step' : undefined} className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 ${milestone === record.currentMilestone ? 'border-blue-900 bg-blue-50 text-slate-950' : 'border-[#E2DFD6] text-slate-700'}`}>{content}</div>
              : <button type="button" aria-current={milestone === record.currentMilestone ? 'step' : undefined} onClick={() => onChange(updateCaseMilestone(record, milestone, { title: milestones[language][milestone], agencyOrDesk: record.localAgency || undefined }))} className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 ${milestone === record.currentMilestone ? 'border-blue-900 bg-blue-50 text-slate-950' : 'border-[#E2DFD6] text-slate-700 hover:bg-[#FAF9F5]'}`}>{content}</button>}
          </li>;
        })}
      </ol>
      {record.timeline.length > 0 && <ol className="mt-3 space-y-2 border-l-2 border-blue-200 pl-4 text-sm text-slate-700">{record.timeline.map(event => <li key={event.id}><span className="font-semibold">{event.date}</span> · {event.title}{event.agencyOrDesk ? ` · ${event.agencyOrDesk}` : ''}{event.notes ? <p className="mt-1">{event.notes}</p> : null}</li>)}</ol>}
    </div>

    <div className="mt-5 rounded-xl border border-[#E2DFD6] bg-[#FAF9F5] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{text.checklist}</h3><span className="rounded-full bg-white px-3 py-1 text-sm font-semibold tabular-nums text-slate-800">{checkedCount}/5 {text.counter}</span></div>
      <ul className="mt-2 grid gap-x-4 sm:grid-cols-2">{checklistKeys.map((key, index) => <li key={key}>
        {readOnly ? <div className="flex min-h-[44px] items-center gap-3 py-2 text-sm"><span aria-hidden="true" className={`h-5 w-5 shrink-0 rounded border ${record.checklist[key] ? 'border-emerald-800 bg-emerald-800' : 'border-slate-400 bg-white'}`}>{record.checklist[key] ? <Check className="h-4 w-4 text-white" /> : null}</span><span>{checklistLabels[index]}</span></div>
          : <label className="flex min-h-[44px] cursor-pointer items-center gap-3 py-2 text-sm font-medium text-slate-800"><input type="checkbox" checked={record.checklist[key]} onChange={() => onChange(toggleChecklistItem(record, key))} className="h-5 w-5 accent-blue-900" />{checklistLabels[index]}</label>}
      </li>)}</ul>
      {!record.localAgency.trim() && <p className="mt-2 text-sm text-slate-600">{text.agencyNeeded}</p>}
    </div>

    {entitlements.solidaryLiabilityApplicable && <aside className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4" aria-label={text.liabilityTitle}>
      <h3 className="font-bold text-slate-950">{text.liabilityTitle}</h3><p className="mt-1 text-sm leading-relaxed text-slate-800">{text.liabilityText}</p>
    </aside>}

    <div className="mt-4 rounded-xl border border-[#D8D3C7] p-4">
      <h3 className="font-bold text-slate-900">{text.entitlements}</h3>
      <p className="mt-2 text-sm"><strong>{text.aksyon}:</strong> {text.aksyonYes}</p>
      <p className="mt-2 text-sm"><strong>{text.bpbh}:</strong> PHP {entitlements.owwaBpbhEstimatedAmount.toLocaleString('en-PH')}</p>
      <p className="mt-1 text-sm text-slate-600">{advice.financial}</p>
      <p className="mt-2 text-sm text-slate-700">{advice.legal}</p>
      {entitlements.seafarerPoeaSecApplicable && <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-slate-800">{text.seaNote}</p>}
    </div>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><Phone aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-900" /><div><p className="text-sm font-semibold text-slate-900">{text.hotline}</p><p className="text-sm text-slate-600">{advice.hotline}</p></div></div>
      <a href="tel:1348" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"><Phone aria-hidden="true" className="h-4 w-4" />{text.call}</a>
    </div>

    <section className="mt-5 rounded-xl border border-[#E2DFD6] p-4" aria-labelledby={`${id}-letter-title`}>
      <h3 id={`${id}-letter-title`} className="flex items-center gap-2 font-bold text-slate-900"><FileText aria-hidden="true" className="h-5 w-5" />{text.letter}</h3>
      <p className="mt-1 text-sm text-slate-600">{text.letterHint}</p>
      {readOnly ? <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-[#E2DFD6] p-3 text-xs leading-relaxed text-slate-800">{makeAgencyLetter(record, language)}</pre> : <>
        <textarea aria-label={text.letter} readOnly autoComplete="off" value={makeAgencyLetter(record, language)} className={`${fieldClass} mt-3 min-h-48 resize-y font-normal leading-relaxed`} />
        <button type="button" onClick={() => void copyAgencyLetter()} className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-blue-900 px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"><Clipboard aria-hidden="true" className="h-4 w-4" />{text.copy}</button>
        {copyStatus && <p role="status" className="mt-2 text-sm text-slate-700">{copyStatus}</p>}
      </>}
    </section>

    <p className="mt-4 text-xs leading-relaxed text-slate-600">{text.saved}</p>
  </section>;
}
