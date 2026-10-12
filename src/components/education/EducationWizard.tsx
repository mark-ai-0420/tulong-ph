'use client';

import { ArrowLeft, ArrowRight, Search, GraduationCap, CheckCircle2 } from 'lucide-react';
import { SampleDataBanner } from '@/components/shared/SampleDataBanner';
import { civicCard, civicLabel, civicInput, civicPrimary, civicSecondary, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';

import { useRef, useState } from 'react';
import { WizardStepper } from '@/components/shared/WizardStepper';
import { LocationHierarchyFields } from '@/components/shared/LocationHierarchyFields';
import { LiveReliefBreakdownBox, ActionRoadmapStepCard, PrintablePacketCallout } from '@/components/shared/CivicStepCards';
import { getProvince, resolveLocationMetadata } from '@/lib/data/phLocations';
import type { EducationMatch, StudentEducationProfile } from '@/types/education';
import type { Language } from '@/lib/i18n';
import { defaultEducationProfile, evaluateEducationAssistance } from '@/lib/educationEngine';
import { educationPrograms } from '@/lib/data/educationPrograms';

const inputClass = civicInput;
const primaryButton = civicPrimary;
const secondaryButton = civicSecondary;
const chipClass = civicPill;
type LocatedEducationProfile = StudentEducationProfile & { province?: string; barangay?: string };
const sampleProfiles: { label: string; values: Partial<LocatedEducationProfile> }[] = [
  { label: 'Sample: Private SHS NCR', values: { educationLevel: 'shs', schoolType: 'private', location: 'NCR', province: 'Metro Manila (NCR)', cityMunicipality: 'Quezon City', barangay: '', regionalDailyWage: 645, annualTuitionAndFees: 30000, yearLevel: 11, age: 16, voucherCategory: 'public_jhs', schoolParticipates: true } },
  { label: 'Sample: State Univ (SUC) 4Ps', values: { educationLevel: 'college', schoolType: 'suc_luc', location: 'other', province: 'Cavite', cityMunicipality: 'Indang', barangay: 'Daine I', regionalDailyWage: 520, annualTuitionAndFees: 0, annualHouseholdIncome: 120000, is4PsOrListahanan: true, schoolParticipates: true, yearLevel: 1, age: 18 } },
  { label: 'Sample: DOST / CHED Honor (96%)', values: { educationLevel: 'college', schoolType: 'suc_luc', location: 'other', province: 'Cavite', cityMunicipality: 'Indang', barangay: 'Daine I', regionalDailyWage: 520, annualTuitionAndFees: 0, annualHouseholdIncome: 240000, gwa: 96, yearLevel: 1, age: 18, isIncomingFreshman: true, priorityCourse: true, dostQualifiedSchool: true, isSTEMGraduateOrTop5: true, willingReturnService: true, schoolParticipates: true } },
  { label: 'Sample: TESDA Tech-Voc', values: { educationLevel: 'tvet', schoolType: 'public', location: 'other', province: 'Cavite', cityMunicipality: 'Indang', barangay: 'Daine I', regionalDailyWage: 520, annualTuitionAndFees: 0, yearLevel: 1, age: 20, trainingDays: 30, schoolParticipates: true } },
];
const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);

interface Props { profile: LocatedEducationProfile; onChange: (profile: StudentEducationProfile) => void; onPrint: () => void; language?: Language }

export function EducationWizard({ profile, onChange, onPrint, language = 'taglish' }: Props) {
  const [roadmapQuery, setRoadmapQuery] = useState('');
  const [roadmapAgency, setRoadmapAgency] = useState('all');
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [stepAnimating, setStepAnimating] = useState(true);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const result = evaluateEducationAssistance(profile);
  const tl = language === 'taglish';
  const matchVisible = (match: EducationMatch) => (roadmapAgency === 'all' || match.program.agency === roadmapAgency) && `${match.program.name} ${match.program.agency} ${match.reason}`.toLowerCase().includes(roadmapQuery.trim().toLowerCase());
  const primaryMatches = result.primaryPrograms.filter(matchVisible);
  const supplementalMatches = result.supplementalPrograms.filter(matchVisible);
  const roadmapAgencies = [...new Set([...result.primaryPrograms, ...result.supplementalPrograms].map(match => match.program.agency))];
  const collegePathway = profile.educationLevel === 'college' || profile.educationLevel === 'medicine';
  const update = <K extends keyof StudentEducationProfile>(key: K, value: StudentEducationProfile[K]) => onChange({ ...profile, [key]: value });
  function move(next: number) {
    if (next > step && step === 1) {
      const validYear = profile.educationLevel === 'jhs' ? profile.yearLevel >= 7 && profile.yearLevel <= 10
        : profile.educationLevel === 'shs' ? profile.yearLevel >= 11 && profile.yearLevel <= 12
        : profile.yearLevel >= 1 && profile.yearLevel <= 8;
      if (!validYear) { setError(tl ? 'Ilagay ang tamang grade o year level bago magpatuloy.' : 'Enter a valid grade or year level before continuing.'); return; }
    }
    setError(''); setDirection(next > step ? 'forward' : 'backward'); setStepAnimating(true); setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function numberPresets(key: keyof StudentEducationProfile, options: { value: number; label: string }[]) {
    return <div role="group" aria-label={`${key} presets`} className="mt-2 flex flex-wrap gap-2">{options.map(({ value, label }) => <button key={value} type="button" className={profile[key] === value ? civicSelectedPill : chipClass} aria-pressed={profile[key] === value} onClick={() => update(key, value)}>{label}</button>)}</div>;
  }
  function numberField(key: keyof StudentEducationProfile, id: string, label: string, max?: number, min = 0) {
    const presets = key === 'annualTuitionAndFees' ? [0, 15000, 30000, 50000, 80000].map(value => ({ value, label: value === 0 ? (tl ? '₱0 Libre' : '₱0 Free') : `₱${value.toLocaleString('en-PH')}` }))
      : key === 'gwa' ? [85, 90, 94, 96].map((value, index) => ({ value, label: `${value}% ${['Pasado', 'Honor', 'High Honor', 'Full Merit'][index]}` }))
      : key === 'yearLevel' ? (profile.educationLevel === 'jhs' ? [7, 8, 9, 10] : profile.educationLevel === 'shs' ? [11, 12] : [1, 2, 3, 4, 5]).map(value => ({ value, label: `${profile.educationLevel === 'jhs' || profile.educationLevel === 'shs' ? 'Grade' : 'Year'} ${value}` }))
      : key === 'annualHouseholdIncome' ? [0, 120000, 240000, 360000, 450000].map((value, index) => ({ value, label: `₱${value.toLocaleString('en-PH')} ${['Indigent', 'Minimum Wage', 'Low-Income', 'Pasok sa CHED', '+'][index]}` })) : [];
    return <div key={id}><label htmlFor={id} className={civicLabel}>{label}</label><input autoComplete="off" id={id} type="number" inputMode="decimal" min={min} max={max} step={key === 'gwa' || key === 'annualTuitionAndFees' || key === 'annualHouseholdIncome' ? '0.01' : '1'} className={inputClass} value={profile[key] as number} onChange={(event) => update(key, Math.max(0, Number(event.target.value)))} />{numberPresets(key, presets)}</div>;
  }
  function checkbox(key: keyof StudentEducationProfile, id: string, label: string) {
    return <label key={id} htmlFor={id} className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${profile[key] ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-[#E2DFD6] bg-white text-slate-800'}`}><input autoComplete="off" id={id} type="checkbox" checked={profile[key] as boolean} onChange={(event) => update(key, event.target.checked)} className="h-5 w-5 shrink-0 accent-blue-900 focus-ring" /><span>{label}</span></label>;
  }
  const renderMatch = (match: EducationMatch, index: number, supplemental = false) => <details open={!supplemental && index === 0} key={`${match.program.id}-${index}`} className="rounded-xl border border-[#E2DFD6] bg-white animate-relief-pillar animate-cascade-item relief-pillar">
    <summary className="min-h-[44px] cursor-pointer p-4 font-semibold text-slate-900 focus-ring"><span className="block">{match.program.name}</span><span className="mt-1 block text-sm font-medium tabular-nums text-blue-900">{match.annualCashAmount === null ? (tl ? 'Halaga ayon sa assessment / terms' : 'Amount subject to assessment / terms') : `${money(match.annualCashAmount)} / ${tl ? 'taon o program cycle' : 'year or program cycle'}`}</span></summary>
    <div className="space-y-3 border-t border-[#E2DFD6] p-4 text-sm leading-relaxed text-slate-700">
      <p>{match.reason}</p><p className="font-semibold text-amber-800">{match.condition}</p>
      {match.tuitionAmount > 0 && <p className="tabular-nums">{tl ? 'Karagdagang tuition ceiling sa napiling award' : 'Tuition ceiling within this award'}: {money(match.tuitionAmount)}</p>}
      {match.oneTimeAmount > 0 && <p className="tabular-nums">{tl ? 'One-time ceiling, hiwalay sa annual cash' : 'One-time ceiling, separate from annual cash'}: {money(match.oneTimeAmount)}</p>}
      {match.requiresPrimaryProgram && <p>{tl ? 'Kailangan ang primary award' : 'Requires primary award'}: {match.requiresPrimaryProgram.toUpperCase()}. {tl ? 'Hindi idinadagdag sa ibang scholarship.' : 'Not added to other scholarships.'}</p>}
      <ol className="list-decimal space-y-1 pl-5">{match.program.steps.map((item) => <li key={item}>{item}</li>)}</ol>
      <p>{match.program.stackingRule}</p><p className="text-xs">{match.program.statutoryBasis}; {match.program.verifiedAsOf}</p>
      <a className="inline-flex min-h-[44px] items-center break-all font-semibold text-blue-900 underline focus-ring" href={match.program.sourceUrl} target="_blank" rel="noreferrer">{tl ? 'Opisyal na source at application guidance' : 'Official source and application guidance'}</a>{match.program.additionalSources?.map((source) => <a key={source.url} className="flex min-h-[44px] items-center font-semibold text-blue-900 underline focus-ring" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}
      {!supplemental && <button type="button" className={secondaryButton} aria-pressed={profile.selectedPrimaryProgram === match.id} onClick={() => update('selectedPrimaryProgram', match.id)}>{profile.selectedPrimaryProgram === match.id ? (tl ? 'Napili para sa print packet' : 'Selected for print packet') : (tl ? 'Piliin para sa print packet' : 'Choose for print packet')}</button>}
    </div>
  </details>;

  const stepHeader = <div className="space-y-4">
    <div>
      <h2 ref={heading} tabIndex={-1} className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 focus:outline-none"><GraduationCap aria-hidden="true" className="mr-2 inline h-5 w-5 text-blue-900" />{tl ? `Hakbang ${step}: ${['Paaralan at Tuition', 'Pamilya at Kwalipikasyon', 'Gabay sa Scholarship'][step - 1]}` : `Step ${step}: ${['School and Tuition', 'Family and Eligibility', 'Scholarship Roadmap'][step - 1]}`}</h2>
      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{step === 1 ? (tl ? 'Saan nag-aaral at magkano ang covered tuition at fees?' : 'Where are you studying and what are your covered tuition and fees?') : step === 2 ? (tl ? 'Ano ang kita at kalagayan ng pamilya?' : 'What are your family income and circumstances?') : (tl ? 'Suriin ang posibleng tulong at mga susunod na hakbang.' : 'Review possible assistance and your next steps.')}</p>
    </div>
    <SampleDataBanner language={language}>
      <div className="flex flex-wrap gap-2">{sampleProfiles.map(({ label, values }) => <button key={label} type="button" className={chipClass} onClick={() => {
        onChange({ ...defaultEducationProfile, ...values, fullName: profile.fullName, schoolName: profile.schoolName });
        setError('');
        requestAnimationFrame(() => heading.current?.focus());
      }}>{label}</button>)}</div>
      <p className="text-xs text-slate-600">{tl ? 'Halimbawa lang ang sahod at kita; kumpirmahin ang lokal na rate at school requirements.' : 'Wages and income are examples; confirm local rates and school requirements.'}</p>
      <p className="text-xs text-slate-600">{tl ? 'Dito lang sa device ang impormasyon mo; ahensya ang magkukumpirma ng approval o pondo.' : 'Your information stays on this device; agencies confirm approval and funding.'}</p>
    </SampleDataBanner>
  </div>;

  return <section className="space-y-6">
    <WizardStepper currentStep={step} onStepChange={move} steps={[
      { title: tl ? 'Paaralan at Tuition' : 'School and Tuition', subtitle: tl ? 'Saan nag-aaral at magkano?' : 'School and covered fees' },
      { title: tl ? 'Pamilya at Kwalipikasyon' : 'Family and Eligibility', subtitle: tl ? 'Kita at sektor ng pamilya' : 'Family income and circumstances' },
      { title: tl ? 'Gabay sa Scholarship' : 'Scholarship Roadmap', subtitle: tl ? 'Tatlong hakbang sa tulong' : 'Three steps to assistance' },
    ]} />

    <form autoComplete="off" className={stepAnimating ? 'overflow-x-clip motion-reduce:overflow-x-visible' : undefined} onSubmit={(event) => { event.preventDefault(); if (step < 3) move(step + 1); }}>
      <div key={step} onAnimationEnd={(event) => { if (event.target === event.currentTarget) setStepAnimating(false); }} className={`space-y-6 animate-step-enter ${direction === 'forward' ? 'step-enter-forward' : 'animate-step-enter-back step-enter-backward'}`}>
        {step === 1 && <section className={civicCard}>
          {stepHeader}
          <fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">{tl ? 'Antas at paaralan' : 'Level and school'}</legend><div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="edu-level" className={civicLabel}>{tl ? 'Antas ng pag-aaral' : 'Education level'}</label><select autoComplete="off" id="edu-level" className={inputClass} value={profile.educationLevel} onChange={(event) => { const level = event.target.value as StudentEducationProfile['educationLevel']; onChange({ ...profile, educationLevel: level, yearLevel: level === 'jhs' ? 7 : level === 'shs' ? 11 : 1, selectedPrimaryProgram: '' }); }}><option value="jhs">JHS: Grades 7 to 10</option><option value="shs">SHS: Grades 11 to 12</option><option value="college">College / Undergraduate</option><option value="tvet">TESDA Tech-Voc</option><option value="medicine">Doctor of Medicine</option></select><div role="group" aria-label={tl ? 'Mabilis na pili ng antas' : 'Education level presets'} className="mt-2 flex flex-wrap gap-2">{([
              ['jhs', 'JHS'], ['shs', 'SHS'], ['college', 'College'], ['tvet', 'Tech-Voc'], ['medicine', 'Medicine'],
            ] as const).map(([educationLevel, label]) => <button key={educationLevel} type="button" className={profile.educationLevel === educationLevel ? civicSelectedPill : chipClass} aria-pressed={profile.educationLevel === educationLevel} onClick={() => onChange({ ...profile, educationLevel, yearLevel: educationLevel === 'jhs' ? 7 : educationLevel === 'shs' ? 11 : 1, selectedPrimaryProgram: '' })}>{label}</button>)}</div></div>
            <div><label htmlFor="edu-school-type" className={civicLabel}>{tl ? 'Uri ng paaralan' : 'School type'}</label><select autoComplete="off" id="edu-school-type" className={inputClass} value={profile.schoolType} onChange={(event) => update('schoolType', event.target.value as StudentEducationProfile['schoolType'])}><option value="public">DepEd public / state-run TVI</option><option value="suc_luc">SUC / CHED-recognized LUC</option><option value="private">Private school / HEI / TVI</option></select><div role="group" aria-label={tl ? 'Mabilis na pili ng uri ng paaralan' : 'School type presets'} className="mt-2 flex flex-wrap gap-2">{([
              ['public', 'Public / state-run TVI'], ['suc_luc', 'SUC / LUC'], ['private', 'Private'],
            ] as const).map(([schoolType, label]) => <button key={schoolType} type="button" className={profile.schoolType === schoolType ? civicSelectedPill : chipClass} aria-pressed={profile.schoolType === schoolType} onClick={() => update('schoolType', schoolType)}>{label}</button>)}</div></div>
            <div className="sm:col-span-2"><LocationHierarchyFields idPrefix="edu" value={profile} language={language} onChange={(location, updateMetadata) => onChange({ ...profile, province: location.province, cityMunicipality: location.cityMunicipality, barangay: location.barangay, ...(updateMetadata ? { location: location.locationTier, regionalDailyWage: location.regionalDailyWage } : {}) } as LocatedEducationProfile)} /></div>
            <div><label htmlFor="edu-location" className={civicLabel}>{tl ? 'School location tier (puwedeng itama)' : 'School location tier (manual override)'}</label><select autoComplete="off" id="edu-location" className={inputClass} value={profile.location} onChange={(event) => {
              const location = event.target.value as StudentEducationProfile['location'];
              const regionalDailyWage = getProvince(profile.province ?? '')
                ? resolveLocationMetadata(profile.province ?? '', profile.cityMunicipality).regionalDailyWage
                : location === 'NCR' ? 645 : location === 'HUC' ? 500 : 450;
              onChange({ ...profile, location, regionalDailyWage });
            }}><option value="NCR">NCR</option><option value="HUC">Highly Urbanized City outside NCR</option><option value="other">{tl ? 'Ibang lungsod / bayan' : 'Other city / municipality'}</option></select><p className="mt-2 text-xs text-slate-600">{tl ? 'Awtomatikong sumusunod sa lokasyon sa itaas. Kumpirmahin ang school classification at lokal na rate.' : 'Follows the location above. Confirm the school classification and local wage rate.'}</p></div>
            {numberField('annualTuitionAndFees', 'edu-tuition', tl ? 'Covered tuition at fees bawat taon (PHP)' : 'Covered annual tuition and fees (PHP)')}
            {numberField('gwa', 'edu-gwa', 'GWA (%)', 100)}
            {numberField('yearLevel', 'edu-year', tl ? 'Grade / year level' : 'Grade / year level', profile.educationLevel === 'jhs' ? 10 : profile.educationLevel === 'shs' ? 12 : 8, profile.educationLevel === 'jhs' ? 7 : profile.educationLevel === 'shs' ? 11 : 1)}
          </div><p className="mt-3 text-xs leading-relaxed text-slate-600">{tl ? 'Ilagay ang covered fees lamang; PHP0 kung libre na. Hindi kasama ang dorm, pagkain, multa o ibang hindi covered na gastos.' : 'Enter covered fees only; PHP0 if already free. Exclude lodging, food, penalties and other uncovered costs.'}</p><div className="mt-4">{checkbox('schoolParticipates', 'edu-school-participates', tl ? 'Kumpirmado ng school na kasali ito sa programa' : 'School confirms program participation / recognition')}</div></fieldset>
          {profile.educationLevel === 'jhs' && checkbox('isExistingEsc', 'edu-existing-esc', tl ? 'May ESC award mula noong Grade 7 (para sa continuing student)' : 'Existing ESC award from Grade 7 (for continuing students)')}
          {((profile.educationLevel === 'jhs' && profile.yearLevel > 7 && profile.isExistingEsc) || (profile.educationLevel === 'shs' && profile.yearLevel === 12 && profile.hasSHSVoucher)) && <div className="rounded-xl border border-[#E2DFD6] bg-white p-4">{numberField('previousAnnualGrant', 'edu-previous-grant', tl ? 'Kumpirmadong original annual grant (PHP; 0 kung hindi alam)' : 'Confirmed original annual grant (PHP; 0 if unknown)')}<p className="mt-2 text-xs text-slate-600">{tl ? 'Hindi tataas ang voucher sa paglipat sa mas mahal na lokasyon. Kumpirmahin sa school ang continuing grant.' : 'A transfer to a higher-value location does not increase your voucher. Confirm the continuing grant with the school.'}</p></div>}{profile.educationLevel === 'shs' && <div className="border-t border-[#E2DFD6] pt-6"><fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">SHS voucher</legend><label htmlFor="edu-voucher-category" className="block text-sm font-bold">{tl ? 'Kumpirmadong voucher category' : 'Confirmed voucher category'}</label><select autoComplete="off" id="edu-voucher-category" className={inputClass} value={profile.voucherCategory} onChange={(event) => update('voucherCategory', event.target.value as StudentEducationProfile['voucherCategory'])}><option value="none">{tl ? 'Hindi pa kumpirmado' : 'Not yet confirmed'}</option><option value="public_jhs">Public JHS / qualified ALS or PEPT</option><option value="esc">Private JHS ESC completer</option><option value="approved_private">Approved private/non-ESC voucher applicant</option></select>{checkbox('hasSHSVoucher', 'edu-existing-shs', tl ? 'May voucher sa Grade 11 (kailangan para sa Grade 12)' : 'Used a voucher in Grade 11 (required for Grade 12)')}</fieldset></div>}
          <LiveReliefBreakdownBox title={tl ? 'Live Tuition Relief Breakdown' : 'Live Tuition Relief Breakdown'} rows={[
            { label: tl ? 'Covered tuition at fees' : 'Covered tuition and fees', amount: profile.annualTuitionAndFees },
            { label: tl ? 'Less: Automatic Tuition Relief / Voucher' : 'Less: Automatic Tuition Relief / Voucher', amount: result.directTuitionRelief, testId: 'education-relief' },
            { label: tl ? 'Net Remaining Tuition' : 'Net Remaining Tuition', amount: result.netRemainingTuitionBalance, testId: 'education-balance', isResult: true },
          ]} note={tl ? 'Covered fees lamang. School at ahensya ang magkukumpirma ng tulong.' : 'Covered fees only. Schools and agencies confirm assistance.'} />
          <div className="border-t border-[#E2DFD6] pt-6"><fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">{tl ? 'Pangunahing kwalipikasyon' : 'Basic eligibility'}</legend>{checkbox('isFilipino', 'edu-filipino', 'Filipino citizen')}{['college', 'tvet'].includes(profile.educationLevel) && checkbox('firstDegree', 'edu-first-degree', tl ? 'Unang college degree o Tech-Voc qualification' : 'First undergraduate degree / post-secondary TVET qualification')}{profile.educationLevel === 'college' && checkbox('withinResidencyLimit', 'edu-residency', tl ? 'Regular na estudyante at pasok sa patakaran at tagal ng pag-aaral sa school' : 'Within FHE admission, retention and residency limits')}</fieldset></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-wrap justify-between gap-3 border-t border-[#E2DFD6] pt-4"><span /><button type="submit" className={primaryButton}>{tl ? 'Susunod' : 'Next'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button></div>
        </section>}
        {step === 2 && <section className={civicCard}>
          {stepHeader}
          <fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">{tl ? 'Pamilya at academic pathway' : 'Family and academic pathway'}</legend><div className="grid gap-4 sm:grid-cols-2">{numberField('annualHouseholdIncome', 'edu-income', tl ? 'Kabuuang kita ng pamilya bawat taon (PHP)' : 'Combined annual family income (PHP)')}{numberField('age', 'edu-age', tl ? 'Edad' : 'Age', 100)}{collegePathway && numberField('regionalDailyWage', 'edu-daily-wage', tl ? 'Sahod bawat araw sa lugar mo (PHP; 0 kung hindi alam)' : 'Local Tara, Basa! daily wage (PHP; 0 if unknown)')}{profile.educationLevel === 'tvet' && numberField('trainingDays', 'edu-training-days', tl ? 'Eligible training days' : 'Eligible training days', 365)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{collegePathway && checkbox('isIncomingFreshman', 'edu-incoming', tl ? 'Incoming first-year college student' : 'Incoming first-year college student')}{collegePathway && checkbox('priorityCourse', 'edu-priority-course', tl ? 'Kursong science o technology na nasa priority list' : 'Confirmed priority S&T / STEM degree')}{collegePathway && checkbox('isSTEMGraduateOrTop5', 'edu-stem-rank', 'SHS STEM graduate / top 5% non-STEM')}{collegePathway && checkbox('dostQualifiedSchool', 'edu-dost-school', tl ? 'Kumpirmadong school at kursong sakop ng DOST' : 'DOST-qualified school and degree')}{collegePathway && checkbox('willingReturnService', 'edu-return-service', tl ? 'Handang magtrabaho ayon sa return-service agreement' : 'Willing to sign the required return-service agreement')}{checkbox('hasOtherNationalScholarship', 'edu-other-award', tl ? 'May kasalukuyang national scholarship' : 'Already receiving a national scholarship')}{profile.educationLevel === 'tvet' && checkbox('hasNC3OrHigher', 'edu-nc3', 'May National Certificate III or higher')}</div></fieldset>
          <div className="border-t border-[#E2DFD6] pt-6"><fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">{tl ? 'Kalagayan at sektor' : 'Circumstances and sectors'}</legend><div className="grid gap-3 sm:grid-cols-2">{checkbox('is4PsOrListahanan', 'edu-4ps', '4Ps / Listahanan household')}{collegePathway && checkbox('noLocalSUC', 'edu-no-suc', tl ? 'Private HEI sa lugar na walang SUC/LUC' : 'Private HEI in a locality without a SUC/LUC')}{checkbox('isPWD', 'edu-pwd', 'PWD student')}{checkbox('isSoloParentDependent', 'edu-solo-parent', tl ? 'Anak ng solo parent' : 'Solo-parent dependent')}{checkbox('isOWWADependent', 'edu-owwa', tl ? 'Dependent ng OFW / OWWA member' : 'OFW / OWWA-member dependent')}{checkbox('isCoconutFarmerDependent', 'edu-coconut', tl ? 'Rehistrado sa NCFRS na magsasaka ng niyog o anak niya' : 'NCFRS farmer or dependent')}{checkbox('isGSISDependent', 'edu-gsis', tl ? 'Dependent ng GSIS member' : 'GSIS-member dependent')}{collegePathway && checkbox('isTop10PublicHS', 'edu-top10', 'Top 10 public high school graduate')}{checkbox('hasFamilyCrisis', 'edu-crisis', tl ? 'May krisis sa pamilya' : 'Family in crisis')}{collegePathway && checkbox('needsLicensureReimbursement', 'edu-licensure', tl ? 'TES graduate na may licensure receipts' : 'TES graduate with licensure receipts')}</div>
          {profile.isOWWADependent && <div className="mt-4 space-y-3 rounded-xl bg-stone-50 p-4">{checkbox('owwaActive', 'edu-owwa-active', tl ? 'Kumpirmadong active OWWA membership' : 'Confirmed active OWWA membership')}{checkbox('isDeceasedOFWDependent', 'edu-owwa-deceased', tl ? 'Deceased OWWA member ang OFW parent' : 'OFW parent is a deceased OWWA member')}{numberField('ofwMonthlySalaryUSD', 'edu-ofw-salary', 'OFW monthly salary (USD; 0 if unknown)')}</div>}
          {collegePathway && profile.isCoconutFarmerDependent && <div className="mt-4">{checkbox('coconutPriorityCourse', 'edu-coconut-course', tl ? 'Kursong pang-agrikultura o niyog na nasa PCA priority list' : 'Confirmed PCA priority degree')}</div>}
          {profile.isGSISDependent && <div className="mt-4">{numberField('gsisSalaryGrade', 'edu-gsis-sg', 'GSIS parent salary grade', 33)}</div>}</fieldset></div>
          <LiveReliefBreakdownBox title="Live Tuition Relief Breakdown" rows={[{ label: tl ? 'Covered tuition at fees' : 'Covered tuition and fees', amount: profile.annualTuitionAndFees }, { label: tl ? 'Less: Automatic Tuition Relief / Voucher' : 'Automatic tuition relief / voucher', amount: result.directTuitionRelief, testId: 'education-relief' }, { label: tl ? 'Net Remaining Tuition' : 'Remaining covered tuition', amount: result.netRemainingTuitionBalance, testId: 'education-balance', isResult: true }]} note={tl ? 'Covered fees lamang. School at ahensya ang magkukumpirma ng tulong.' : 'Covered fees only. Schools and agencies confirm assistance.'} />
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-wrap justify-between gap-3 border-t border-[#E2DFD6] pt-4"><button type="button" className={secondaryButton} onClick={() => move(1)}><ArrowLeft aria-hidden="true" className="h-4 w-4" />{tl ? 'Bumalik' : 'Back'}</button><button type="submit" className={primaryButton}>{tl ? 'Tingnan ang mga programa' : 'See possible programs'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button></div>
        </section>}
        {step === 3 && <div className="space-y-6">
          <section className={civicCard}>
            {stepHeader}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{tl ? 'Handa na ang inyong gabay' : 'Your guide is ready'}</span>
            <p className="text-sm leading-relaxed text-slate-600">{tl ? 'Gabay lang ang halaga; ahensya ang magpapasya sa approval at pondo. Nasa device lang ang iyong impormasyon.' : 'Estimates only; agencies decide approval and funding. Your information stays on this device.'}</p>
          <div className="grid gap-3 sm:grid-cols-3" aria-live="polite" aria-atomic="true">{[
            [tl ? 'Libre o bawas sa tuition' : 'Free or reduced tuition', result.directTuitionRelief, 'education-relief'],
            [tl ? 'Natitirang babayaran' : 'Remaining covered fees', result.netRemainingTuitionBalance, 'education-balance'],
            [tl ? 'Posibleng cash allowance / taon' : 'Possible annual cash allowance', result.bestPrimaryAnnualStipend, 'education-primary'],
          ].map(([label, amount, testId]) => <div key={testId} className="rounded-xl border border-[#E2DFD6] bg-white p-4 animate-relief-pillar animate-cascade-item relief-pillar"><p className="text-sm text-slate-600">{label}</p><p data-testid={testId} className="mt-2 break-words text-xl font-bold tabular-nums text-slate-900">{money(Number(amount))}</p></div>)}</div>
          </section>
          <details className="rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900"><summary className="min-h-[44px] cursor-pointer p-4 font-semibold focus-ring">{tl ? 'Bakit ito mahalaga? / Batas at Paalala' : 'Why this matters / Rules and reminders'}</summary><div className="space-y-2 px-4 pb-4 leading-relaxed">{result.advisories.map((item) => <p key={item}>{item}</p>)}</div></details>
          <div className={civicCard}>
            <label htmlFor="education-roadmap-search" className={civicLabel}>{tl ? 'Hanapin ang scholarship o ahensya' : 'Find a scholarship or agency'}</label>
            <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500" /><input autoComplete="off" id="education-roadmap-search" type="search" className={`${civicInput} pl-10`} value={roadmapQuery} onChange={event => setRoadmapQuery(event.target.value)} /></div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={tl ? 'Roadmap: ahensya' : 'Roadmap agencies'}>{['all', ...roadmapAgencies].map(agency => <button type="button" key={agency} aria-pressed={roadmapAgency === agency} className={roadmapAgency === agency ? civicSelectedPill : civicPill} onClick={() => setRoadmapAgency(agency)}>{agency === 'all' ? (tl ? 'Lahat ng scholarship' : 'All scholarships') : agency}</button>)}</div>
            {(roadmapQuery || roadmapAgency !== 'all') && <button type="button" className={civicSecondary} onClick={() => { setRoadmapQuery(''); setRoadmapAgency('all'); }}>{tl ? 'I-clear ang roadmap filter' : 'Clear roadmap filter'}</button>}
            <p role="status" className="text-sm tabular-nums text-slate-600">{primaryMatches.length + supplementalMatches.length} {tl ? 'scholarship match' : 'scholarship matches'}</p>
            {(roadmapQuery || roadmapAgency !== 'all') && !primaryMatches.length && !supplementalMatches.length && <p className="text-sm">{tl ? 'Walang tugma sa roadmap filter. Subukan ang ibang pangalan o i-clear ang filter.' : 'No roadmap matches. Try another name or clear the filter.'}</p>}
          </div>
          <h2 className="text-xl font-bold">{tl ? 'Tatlong Hakbang: Action Roadmap' : 'Three-step Action Roadmap'}</h2>
          {result.tuitionProgram && <ActionRoadmapStepCard step={1} title={tl ? 'Libreng Tuition / Voucher sa Paaralan' : 'Free Tuition / School Voucher'} amount={result.directTuitionRelief} open>
            <h3 className="text-lg font-bold">{result.tuitionProgram.name}</h3>
            <ol className="list-decimal space-y-2 pl-5">{result.tuitionProgram.steps.map(item => <li key={item}>{item}</li>)}</ol>
            <p>{result.tuitionProgram.stackingRule}</p><p className="text-xs">{result.tuitionProgram.statutoryBasis}; {result.tuitionProgram.verifiedAsOf}</p>
            <a href={result.tuitionProgram.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-blue-900 underline focus-ring">{tl ? 'Opisyal na source at application guidance' : 'Official source and application guidance'}</a>
          </ActionRoadmapStepCard>}
          {!result.tuitionProgram && <ActionRoadmapStepCard step={1} title={tl ? 'Libreng Tuition / Voucher sa Paaralan' : 'Free Tuition / School Voucher'} open><p>{tl ? 'Kumpirmahin sa registrar kung may libreng tuition o voucher na sakop ng iyong school at antas.' : 'Ask the registrar whether your school and level have a free tuition or voucher pathway.'}</p></ActionRoadmapStepCard>}
          <ActionRoadmapStepCard step={2} title={tl ? 'Cash Allowance at Scholarship' : 'Cash Allowance and Scholarships'} open>
            <p className="text-sm text-slate-600">{tl ? 'Pumili ng isang primary scholarship. Naka-rank ayon sa annual cash; hiwalay ang tuition at one-time items.' : 'Choose one primary scholarship. Ranked by annual cash; tuition and one-time items are separate.'}</p>
            {primaryMatches.length ? primaryMatches.map((match, index) => renderMatch(match, index)) : <p className="rounded-xl border border-[#E2DFD6] bg-white p-4 text-sm">{result.primaryPrograms.length > 0 ? (tl ? 'May eligible na primary scholarship, pero walang tumugma sa kasalukuyang filter. Baguhin o i-clear ang filter para makita ang mga ito.' : 'Eligible primary scholarships exist, but none match the current filter. Change or clear the filter to see them.') : result.tuitionProgram ? (tl ? 'Ang pangunahing tulong mo ngayon ay ang Tuition Relief / Voucher sa Unang Hakbang. Tingnan ang LGU at DSWD na dagdag na tulong sa ibaba.' : 'Your main benefit now is the Tuition Relief / Voucher in the First Step. Check LGU and DSWD additional support below.') : (tl ? 'Wala pang primary match sa iyong inputs. Tingnan ang lahat ng programa o makipag-usap sa school scholarship desk.' : 'No primary match for these inputs. Review all programs or contact the school scholarship desk.')}</p>}
          </ActionRoadmapStepCard>
          <ActionRoadmapStepCard step={3} title={tl ? 'Dagdag na Tulong at Printable Packet' : 'Additional Support and Printable Packet'} open>
            {supplementalMatches.map((match, index) => renderMatch(match, index, true))}
            {result.supplementalPrograms.length === 0 && <p className="text-sm text-slate-600">{tl ? 'Walang supplemental match sa kasalukuyang profile. Maaari kang magtanong sa LGU o school desk tungkol sa ibang lokal na tulong.' : 'No supplemental match for the current profile. Ask the LGU or school desk about other local assistance.'}</p>}
            <PrintablePacketCallout language={language} buttonLabel={tl ? 'Buksan ang printable scholarship packet' : 'Open printable scholarship packet'} onPrint={onPrint} />
          </ActionRoadmapStepCard>
          <details className="rounded-xl border border-[#E2DFD6] bg-white"><summary className="min-h-[44px] cursor-pointer p-4 font-bold focus-ring">{tl ? 'Lahat ng sakop na programa at requirements' : 'All covered programs and requirements'}</summary><div className="space-y-5 p-4">{educationPrograms.map((program) => <article key={program.id} className="border-t border-[#E2DFD6] pt-4 text-sm leading-relaxed"><h3 className="font-bold">{program.name}</h3><p className="mt-2 tabular-nums">{program.benefits}</p><ul className="my-2 list-disc pl-5">{program.eligibility.map((item) => <li key={item}>{item}</li>)}</ul><a href={program.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-blue-900 underline focus-ring">{program.statutoryBasis}</a></article>)}</div></details>
        </div>}
      </div>
      {step === 3 && <div className="flex justify-start border-t border-[#E2DFD6] pt-4"><button type="button" className={secondaryButton} onClick={() => move(2)}><ArrowLeft aria-hidden="true" className="h-4 w-4" />{tl ? 'Bumalik' : 'Back'}</button></div>}
    </form>
  </section>;
}
