'use client';

import React, { useState } from 'react';
import { AlertTriangle, Building2, Check, Copy, FileText, Landmark } from 'lucide-react';
import type {
  ApplicationRecord,
  Language,
  MedicalCase,
  PatientProfile,
  RepresentativeProfile,
} from '@/types/assistance';
import { supportedLanguages } from '@/lib/i18n';
import {
  calculateGrantedGLTotal,
  calculateNetDeficit,
  formatDateInput,
  lguLetterBalanceDisclosure,
} from '@/lib/glTracking';
import { GLCooldownTrackerCard } from '@/components/triage/GLCooldownTrackerCard';

type Authority = 'mayor' | 'governor' | 'congressional';

interface LGUAndCongressionalAssistantProps {
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  applications: ApplicationRecord[];
  onSaveApplications: (applications: ApplicationRecord[]) => void;
  language: Language;
}

const REQUIREMENTS = [
  { en: 'Clinical Abstract or Medical Certificate', tl: 'Clinical Abstract o Medical Certificate' },
  { en: 'Latest Hospital SOA showing PhilHealth deductions', tl: 'Pinakabagong Hospital SOA na may PhilHealth deductions' },
  { en: 'Barangay Certificate of Indigency', tl: 'Barangay Certificate of Indigency' },
  { en: 'Valid IDs of the patient and representative', tl: 'Valid IDs ng pasyente at kinatawan' },
];

const AUTHORITY_LABELS: Record<Authority, Record<Language, string>> = {
  mayor: {
    en: 'Office of the Mayor / CSWDO',
    taglish: 'Tanggapan ng Punong Lungsod / Punong Bayan',
    cebuano: 'Tanggapan sa Alkalde / CSWDO',
    ilocano: 'Opisina ti Mayor / CSWDO',
  },
  governor: {
    en: 'Office of the Governor / PSWDO',
    taglish: 'Tanggapan ng Punong Lalawigan',
    cebuano: 'Tanggapan sa Gobernador / PSWDO',
    ilocano: 'Opisina ti Gobernador / PSWDO',
  },
  congressional: {
    en: 'District or Party-List Representative - DOH MAIFIP / MAIP referral',
    taglish: 'Tanggapan ng Kinatawan / Kongresista - referral sa DOH MAIFIP / MAIP',
    cebuano: 'Opisina sa Representante / Kongresista - referral sa DOH MAIFIP / MAIP',
    ilocano: 'Opisina ti Representante / Kongresista - referral iti DOH MAIFIP / MAIP',
  },
};

export const LGUAndCongressionalAssistant: React.FC<LGUAndCongressionalAssistantProps> = ({
  patient,
  representative,
  medicalCase,
  applications,
  onSaveApplications,
  language,
}) => {
  const isTl = language === 'taglish';
  const [authority, setAuthority] = useState<Authority>('mayor');
  const [recipientDetails, setRecipientDetails] = useState('');
  const [letterLanguage, setLetterLanguage] = useState<Language>(language);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [checkedRequirements, setCheckedRequirements] = useState<boolean[]>(REQUIREMENTS.map(() => false));

  const patientName = `${patient.firstName} ${patient.middleName} ${patient.lastName}`.trim() || 'the patient';
  const representativeName = representative.isPatientHimself
    ? patientName
    : representative.fullName || 'the patient representative';
  const totalGrantedGLs = calculateGrantedGLTotal(applications);
  const remainingDeficit = calculateNetDeficit(medicalCase.netRemainingBalance, applications);
  const balanceDisclosure = lguLetterBalanceDisclosure(letterLanguage, remainingDeficit, totalGrantedGLs);
  const authorityLabel = AUTHORITY_LABELS[authority][letterLanguage];
  const recipientLabel = authority === 'mayor'
    ? letterLanguage === 'taglish' ? 'Lungsod / Bayan' : letterLanguage === 'cebuano' ? 'Dakbayan / Munisipyo' : letterLanguage === 'ilocano' ? 'Siudad / Munisipalidad' : 'City / Municipality'
    : authority === 'governor'
    ? letterLanguage === 'taglish' ? 'Lalawigan' : letterLanguage === 'cebuano' ? 'Probinsya' : letterLanguage === 'ilocano' ? 'Probinsia' : 'Province'
    : letterLanguage === 'taglish' ? 'Distrito at pangalan ng kinatawan' : letterLanguage === 'cebuano' ? 'Distrito ug ngalan sa representante' : letterLanguage === 'ilocano' ? 'Distrito ken nagan ti representante' : 'District and representative name';
  const requestText = letterLanguage === 'taglish'
    ? authority === 'congressional'
      ? 'Humihingi po kami ng gabay at, kung naaangkop, referral sa DOH MAIFIP/MAIP o hospital Malasakit Center / medical social service desk para sa direktang pagsusuri ng aming aplikasyon. Nauunawaan naming ang kwalipikasyon, pag-apruba, at pamamahagi ng tulong ay pinangangasiwaan ng mga awtorisadong kawani o accredited partners. Hindi po kami humihiling ng pakikialam sa assessment o pamamahagi.'
      : `Humihingi po kami ng pagsusuri para sa anumang medical assistance na available sa inyong LGU, kabilang ang Guarantee Letter o referral kung naaangkop sa inyong programa. Makikipag-ugnayan kami sa ${authority === 'mayor' ? 'CSWDO' : 'PSWDO'} at hospital social worker para sa requirements at direktang assessment.`
    : letterLanguage === 'cebuano'
    ? authority === 'congressional'
      ? 'Nagahangyo kami og giya ug, kon angay, referral ngadto sa DOH MAIFIP/MAIP o sa Malasakit Center / medical social service desk sa ospital aron didto direktang susihon ang among aplikasyon. Nasabtan namo nga ang mga awtorisadong kawani o accredited partners ang motimbang sa kwalipikasyon, moapruba, ug mopanghatag sa tabang. Dili kami mangayo nga manghilabot ang opisina sa pagtimbang-timbang o pag-apod-apod.'
      : `Nagahangyo kami nga susihon ang bisan unsang medical assistance nga anaa sa inyong LGU, lakip ang Guarantee Letter o referral kon sakop sa inyong programa. Makig-koordinar kami sa ${authority === 'mayor' ? 'CSWDO' : 'PSWDO'} ug sa hospital social worker aron mahibal-an ang mga kinahanglanon ug makapa-assess diretso.`
    : letterLanguage === 'ilocano'
    ? authority === 'congressional'
      ? 'Kiddawenmi ti panangiturong ken, no maitutop, referral iti DOH MAIFIP/MAIP wenno iti Malasakit Center / medical social service desk ti ospital tapno sika a diretso a maamiris ti aplikasionmi. Ammomi a dagiti awtorisado a kawani wenno accredited partners ti mangamiris iti kwalipikasion, mangipalubos, ken mangipaay iti tulong. Saanmi a dawaten a salungasingan ti opisina ti panangamiris wenno panangibingay ti tulong.'
      : `Kiddawenmi a maamiris ti aniaman a medical assistance a magun-od iti LGU yo, agraman ti Guarantee Letter wenno referral no maitutop iti programa yo. Makikoordinarmi iti ${authority === 'mayor' ? 'CSWDO' : 'PSWDO'} ken iti hospital social worker tapno maammuan dagiti kasapulan ken direkta a maamiris.`
    : authority === 'congressional'
      ? 'We respectfully request guidance and, if appropriate, a referral to the DOH MAIFIP/MAIP or the hospital Malasakit Center / medical social service desk for direct assessment of our application. We understand that eligibility, approval, and distribution are handled by authorized government personnel or accredited partners. We are not asking the office to influence the assessment or distribution.'
      : `We respectfully request assessment for any medical assistance available through your LGU, including a Guarantee Letter or referral if applicable under your program. We will coordinate with the ${authority === 'mayor' ? 'CSWDO' : 'PSWDO'} and hospital social worker for requirements and direct assessment.`;

  const letter = letterLanguage === 'taglish'
    ? `${formatDateInput()}\n\n${authorityLabel}${recipientDetails ? `\n${recipientDetails}` : ''}\n\nMahal na ${authority === 'mayor' ? 'Punong Lungsod / Punong Bayan' : authority === 'governor' ? 'Punong Lalawigan' : 'Kinatawan / Kongresista'}:\n\nAko po si ${representativeName}, sumusulat para kay ${patientName}. Siya po ay nagpapagamot sa ${medicalCase.hospitalName || 'ospital'} para sa ${medicalCase.diagnosis || 'kanyang kondisyon'}. ${balanceDisclosure}\n\n${requestText}\n\nKalakip po ang mga dokumentong mayroon kami. Makikipag-ugnayan kami sa hospital social worker at billing desk upang maitugma ang bawat aprubadong tulong sa kasalukuyang Statement of Account at matiyak na isang beses lamang ito maikakaltas.\n\nMaraming salamat po sa inyong oras at malasakit.\n\nLubos na gumagalang,\n${representativeName}\nPara kay ${patientName}`
    : letterLanguage === 'cebuano'
    ? `${formatDateInput()}\n\n${authorityLabel}${recipientDetails ? `\n${recipientDetails}` : ''}\n\nMahal nga ${authority === 'mayor' ? 'Alkalde' : authority === 'governor' ? 'Gobernador' : 'Representante'}:\n\nAko si ${representativeName}, nagsulat alang kang ${patientName}. Nagpatambal siya sa ${medicalCase.hospitalName || 'ospital'} tungod sa ${medicalCase.diagnosis || 'iyang kahimtang sa panglawas'}. ${balanceDisclosure}\n\n${requestText}\n\nGilakip namo ang mga dokumentong anaa kanamo aron inyong masusi. Makig-koordinar kami sa hospital social worker ug billing desk aron itugma ang matag giaprubahang tabang sa kasamtangang Statement of Account ug masiguro nga kausa ra kini ibawas.\n\nDaghang salamat sa inyong panahon ug pagtagad sa among kahimtang.\n\nMatinahuron,\n${representativeName}\nAlang kang ${patientName}`
    : letterLanguage === 'ilocano'
    ? `${formatDateInput()}\n\n${authorityLabel}${recipientDetails ? `\n${recipientDetails}` : ''}\n\nKagalang-galang a ${authority === 'mayor' ? 'Mayor' : authority === 'governor' ? 'Gobernador' : 'Representante'}:\n\nSiak ni ${representativeName}, agsurat para ken ni ${patientName}. Agagasen isuna iti ${medicalCase.hospitalName || 'ospital'} gapu iti ${medicalCase.diagnosis || 'kasasaad ti salun-atna'}. ${balanceDisclosure}\n\n${requestText}\n\nNailakip dagiti dokumento a magun-odmi tapno maamirisyo. Makikoordinarmi iti hospital social worker ken billing desk tapno maitunos ti tunggal naipalubos a tulong iti agdama a Statement of Account ken masigurado a maminsan laeng nga ikkat daytoy.\n\nAgyaman kami iti tiempo ken panangikankano yo iti kasasaadmi.\n\nAgraman iti panagraem,\n${representativeName}\nPara ken ni ${patientName}`
    : `${formatDateInput()}\n\n${authorityLabel}${recipientDetails ? `\n${recipientDetails}` : ''}\n\nDear ${authority === 'mayor' ? 'Mayor' : authority === 'governor' ? 'Governor' : 'Representative'}:\n\nI am writing on behalf of ${patientName}. The patient is receiving treatment at ${medicalCase.hospitalName || 'the hospital'} for ${medicalCase.diagnosis || 'a medical condition'}. ${balanceDisclosure}\n\n${requestText}\n\nThe available documents are attached for review. We will coordinate with the hospital social worker and billing desk so every approved amount is matched to the current Statement of Account and credited only once.\n\nThank you for your time and public service.\n\nRespectfully,\n${representativeName}\nFor ${patientName}`;

  const copyLetter = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  const toggleRequirement = (index: number) => {
    setCheckedRequirements((current) => current.map((checked, item) => item === index ? !checked : checked));
  };

  return (
    <div className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-[#E2DFD6] bg-white p-4 shadow-xs sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-blue-900 text-white">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              {isTl ? 'LGU at Congressional Medical Assistance' : 'LGU and Congressional Medical Assistance'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              {isTl
                ? 'Gumawa ng pormal na liham para sa lokal na pamahalaan o tanggapan ng kinatawan, at itala ang tugon sa GL tracker.'
                : 'Prepare a formal request for a local government office or representative, then record the response in the GL tracker.'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lgu-authority" className="mb-1.5 block text-xs font-bold text-slate-800">
              {isTl ? 'Tanggapan na lalapitan' : 'Target authority'}
            </label>
            <select
              id="lgu-authority"
              autoComplete="off"
              value={authority}
              onChange={(event) => setAuthority(event.target.value as Authority)}
              className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 sm:text-sm"
            >
              <option value="mayor">Tanggapan ng Punong Lungsod / Punong Bayan (Office of the Mayor / CSWDO)</option>
              <option value="governor">Tanggapan ng Punong Lalawigan (Office of the Governor / PSWDO)</option>
              <option value="congressional">Tanggapan ng Kinatawan / Kongresista (District / Party-List Representative - DOH MAIFIP / MAIP referral)</option>
            </select>
          </div>
          <div>
            <label htmlFor="lgu-recipient-details" className="mb-1.5 block text-xs font-bold text-slate-800">{recipientLabel}</label>
            <input
              id="lgu-recipient-details"
              autoComplete="off"
              value={recipientDetails}
              onChange={(event) => setRecipientDetails(event.target.value)}
              maxLength={120}
              placeholder={authority === 'mayor' ? 'Hal. Quezon City' : authority === 'governor' ? 'Hal. Laguna' : 'Hal. District 1, Rep. Maria Dela Cruz'}
              className="h-11 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-[#FAF9F5] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="h-4 w-4 text-blue-900" />
              {isTl ? 'Pormal na liham-kahilingan' : 'Formal request letter'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {supportedLanguages.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setLetterLanguage(choice.id)}
                  aria-pressed={letterLanguage === choice.id}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-xs font-bold ${letterLanguage === choice.id ? 'border-blue-900 bg-blue-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
                >
                  {choice.label}
                </button>
              ))}
              <button
                type="button"
                onClick={copyLetter}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
                {copied ? (isTl ? 'Nakopya na!' : 'Copied!') : (isTl ? 'Kopyahin ang Liham' : 'Copy Letter')}
              </button>
            </div>
          </div>
          <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-800" aria-live="polite">
            {letter}
          </p>
          {copyError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-800">
              {isTl ? 'Hindi ma-access ang clipboard. Piliin at kopyahin ang liham sa itaas.' : 'Clipboard access failed. Select and copy the letter above.'}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E2DFD6] bg-white p-4 shadow-xs sm:p-6">
        <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Building2 className="h-5 w-5 text-blue-900" />
          {isTl ? 'Mga dokumentong ihanda' : 'Documents to prepare'}
        </h4>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REQUIREMENTS.map((requirement, index) => (
            <label key={requirement.en} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-[#FAF9F5] p-3 text-xs leading-relaxed text-slate-800">
              <input
                type="checkbox"
                autoComplete="off"
                checked={checkedRequirements[index]}
                onChange={() => toggleRequirement(index)}
                className="h-5 w-5 shrink-0 accent-blue-900"
              />
              <span>{letterLanguage === 'taglish' ? requirement.tl : requirement.en}</span>
            </label>
          ))}
        </div>
      </section>

      <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5" aria-labelledby="lgu-maip-advisory-title">
        <h4 id="lgu-maip-advisory-title" className="flex items-start gap-2 text-sm font-bold text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          {isTl ? 'Mahalagang paalala: Congressional MAIP at dobleng billing' : 'Important: Congressional MAIP and duplicate billing'}
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-amber-950">
          {isTl
            ? 'Ang Congressional MAIFIP/MAIP ay pondo ng DOH at ang tulong ay sinusuri at ipinapamahagi ng mga awtorisadong kawani o accredited partners. Sa FY 2026 GAA, hindi maaaring impluwensyahan o salihan ng mga halal na opisyal ang aktuwal na pamamahagi. Maaari kang humingi ng gabay o referral sa opisina ng kinatawan, pero dumiretso sa hospital Malasakit Center / medical social service desk para sa assessment. Ipa-match ang bawat aprubadong tulong sa kasalukuyang SOA at tiyaking isang beses lang ito ikakaltas.'
            : 'Congressional MAIFIP/MAIP funding is administered through DOH, and assistance is assessed and distributed by authorized personnel or accredited partners. Under the FY 2026 GAA, elected officials may not influence or participate in actual distribution. You may ask a representative’s office for guidance or a referral, then go directly to the hospital Malasakit Center / medical social service desk for assessment. Match each approved amount to the current SOA and make sure it is credited only once.'}
        </p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-950">
          {isTl
            ? 'Ang tulong at pag-apruba ay nakadepende sa pagsusuri ng ahensya at available na pondo.'
            : 'Assistance and approval depend on agency assessment and available funds.'}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
          <a href="https://pco.gov.ph/press-briefing/malacanang-press-briefing-of-palace-press-officer-and-pco-undersecretary-claire-castro-with-department-of-health-secretary-teodoro-herbosa-and-philhealth-president-and-chi/" target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center text-blue-900 underline">
            {isTl ? 'FY 2026 GAA at gabay ng DOH' : 'FY 2026 GAA and DOH guidance'}
          </a>
          <a href="https://www.dbm.gov.ph/wp-content/uploads/GAA/GAA2026/VolumeIA/DOH/A.pdf" target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center text-blue-900 underline">
            {isTl ? 'Opisyal na MAIFIP provisions' : 'Official MAIFIP provisions'}
          </a>
        </p>
      </aside>

      <GLCooldownTrackerCard
        medicalCase={medicalCase}
        applications={applications}
        onSaveApplications={onSaveApplications}
        language={language}
        defaultAgencyId="lgu_congressional"
      />
    </div>
  );
};

