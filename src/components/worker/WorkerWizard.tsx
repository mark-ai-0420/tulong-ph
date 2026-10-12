'use client';

import { ArrowLeft, ArrowRight, Search, BriefcaseBusiness, CheckCircle2 } from 'lucide-react';
import { SampleDataBanner } from '@/components/shared/SampleDataBanner';
import { civicCard, civicLabel, civicInput, civicPrimary, civicSecondary, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';

import { useEffect, useRef, useState } from 'react';
import { WizardStepper } from '@/components/shared/WizardStepper';
import { LocationHierarchyFields } from '@/components/shared/LocationHierarchyFields';
import { LiveReliefBreakdownBox, ActionRoadmapStepCard, PrintablePacketCallout } from '@/components/shared/CivicStepCards';
import type { Language } from '@/lib/i18n';
import type { WorkerProfileInput, WorkerScenario } from '@/types/worker';
import { calculateWorkerBenefitsAndLoans, defaultWorkerProfile } from '@/lib/workerBenefitsCalculator';

const control = civicInput;
const button = civicSecondary;
const chip = civicPill;
const peso = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
const scenarios: { id: WorkerScenario; title: string }[] = [
  { id: 'loans', title: 'Emergency cash / calamity loan' },
  { id: 'maternity', title: 'Maternity at salary differential' },
  { id: 'sickness', title: 'Sakit / aksidente at EC claim' },
  { id: 'unemployment', title: 'Natanggal / nagsara ang kompanya' },
  { id: 'wages', title: 'Hindi nabayarang sahod / final pay' },
  { id: 'livelihood', title: 'Puhunan at livelihood grant' },
  { id: 'funeral', title: 'Funeral at survivor claims' },
];

type LocatedWorkerProfile = WorkerProfileInput & { province?: string; cityMunicipality?: string; barangay?: string };

export function WorkerWizard({ profile, onChange, onPrint, language = 'taglish' }: {
  language?: Language; profile: LocatedWorkerProfile; onChange: (p: WorkerProfileInput) => void; onPrint: () => void;
}) {
  const english = language === 'en';
  const labels: Record<string, string> = {
    'Sektor at Kontribusyon': 'Sector and Contributions', 'Pangangailangan': 'Current Need', 'Resulta at Hakbang': 'Results and Next Steps',
    'Sektor': 'Worker sector', 'Buwanang regular na sahod (PHP)': 'Regular monthly wage (PHP)', 'Edad': 'Age',
    'Kabuuang GSIS paid premium months': 'Total GSIS paid premium months', 'Kabuuang posted SSS contribution months': 'Total posted SSS contribution months',
    'Average ng huling 12 regular MSC (PHP)': 'Average of latest 12 regular MSC (PHP)', 'Average ng 6 pinakamataas na MSC (PHP)': 'Average of 6 highest regular MSC (PHP)',
    'Pag-IBIG posted savings months': 'Pag-IBIG posted savings months', 'Actual total accumulated value / TAV (PHP)': 'Actual total accumulated value / TAV (PHP)',
    'Emergency cash / calamity loan': 'Emergency cash / calamity loan', 'Maternity at salary differential': 'Maternity and salary differential',
    'Sakit / aksidente at EC claim': 'Sickness / accident and EC claim', 'Natanggal / nagsara ang kompanya': 'Involuntary separation / company closure',
    'Hindi nabayarang sahod / final pay': 'Unpaid wages / final pay', 'Puhunan at livelihood grant': 'Capital and livelihood grant', 'Funeral at survivor claims': 'Funeral and survivor claims',
    'May Pag-IBIG savings payment sa huling 6 months': 'Pag-IBIG payment within the last 6 months',
    'SSS contributions sa huling 12 months': 'SSS contributions in last 12 months', 'Posted GSIS premiums sa huling 6 months': 'GSIS premiums in last 6 months',
    'May past-due loan': 'Has a past-due loan', 'Advance-interest days sa disclosure': 'Advance-interest days in disclosure',
    'Applicable prior loan balance / offset (PHP)': 'Applicable prior loan balance / offset (PHP)',
    'SSS Salary Loan balance / offset (PHP)': 'SSS Salary Loan balance / offset (PHP)',
    'SSS Calamity Loan balance / offset (PHP)': 'SSS Calamity Loan balance / offset (PHP)',
    'Sea-based OFW / seafarer na may SSS EC coverage': 'Sea-based OFW / seafarer with SSS EC coverage',
    'Posted contributions bago contingency semester': 'Posted contributions before contingency semester',
    'Approved compensable sickness days': 'Approved compensable sickness days', 'Naubos ang paid sick leave': 'Paid sick leave is exhausted',
    'Work-related ang sakit / injury at may EC coverage': 'Work-related sickness / injury with EC coverage',
    'May approved permanent disability para sa carer allowance': 'Approved permanent disability for carer allowance',
    'SSS contributions sa huling 18 months': 'SSS contributions in last 18 months',
    'Involuntary separation, hindi resignation / just-cause dismissal': 'Involuntary separation, not resignation / just-cause dismissal',
    'Nakakuha ng unemployment benefit sa nakaraang 3 years': 'Received unemployment benefit in previous 3 years',
    'Funeral AMSC (PHP)': 'Funeral AMSC (PHP)', 'Work-related ang pagkamatay at may EC coverage': 'Work-related death with EC coverage',
    'Approved TUPAD days': 'Approved TUPAD days', 'Approved regional daily minimum wage (PHP)': 'Approved regional daily minimum wage (PHP)',
  };
  const plainLabels: Record<string, string> = {
    'Kabuuang GSIS paid premium months': 'Ilang buwan ang hulog sa GSIS?',
    'Kabuuang posted SSS contribution months': 'Ilang buwan ang hulog sa SSS?',
    'Average ng huling 12 regular MSC (PHP)': 'Average na SSS salary credit para sa loan (PHP)',
    'Average ng 6 pinakamataas na MSC (PHP)': 'Average na SSS salary credit para sa benepisyo (PHP)',
    'Pag-IBIG posted savings months': 'Ilang buwan ang hulog sa Pag-IBIG?',
    'Actual total accumulated value / TAV (PHP)': 'Kabuuang ipon sa Pag-IBIG / TAV (PHP)',
    'Posted contributions bago contingency semester': 'Hulog bago ang semester ng panganganak / pagkakasakit',
    'Approved compensable sickness days': 'Ilang araw ang approved na sick leave?',
    'Work-related ang sakit / injury at may EC coverage': 'Dahil sa trabaho ang sakit / aksidente at may EC coverage',
    'Approved regional daily minimum wage (PHP)': 'Approved na minimum wage bawat araw (PHP)',
    'Approved TUPAD days': 'Ilang araw ang approved na TUPAD?',
    'Current ang remittances / membership coverage; walang final benefit o disqualification': 'Updated ang hulog at walang membership disqualification',
    'Nasa declared calamity area at bukas ang agency application window': 'Nasa declared calamity area at bukas ang application',
    'May valid DOLE-approved salary differential exemption ang employer': 'May DOLE-approved exemption ang employer sa dagdag na maternity pay',
    'May approved permanent disability para sa carer allowance': 'Approved na permanent disability para sa carer allowance',
    'Involuntary separation, hindi resignation / just-cause dismissal': 'Natanggal o nagsara ang kumpanya; hindi resignation o just-cause dismissal',
  };
  const labelText = (text: string) => english ? labels[text] ?? text : plainLabels[text] ?? text;
  const [roadmapQuery, setRoadmapQuery] = useState('');
  const [roadmapAgency, setRoadmapAgency] = useState('all');
  const [step, setStep] = useState(1);
  const [backward, setBackward] = useState(false);
  const [moving, setMoving] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const result = calculateWorkerBenefitsAndLoans(profile);
  const query = roadmapQuery.trim().toLowerCase();
  const roadmapAgencies = [...new Set(result.matchedPrograms.map(program => program.agency))];
  const matchedPrograms = result.matchedPrograms.filter(program => (roadmapAgency === 'all' || program.agency === roadmapAgency) && `${program.name} ${program.agency}`.toLowerCase().includes(query));
  const visibleLoans = profile.scenario === 'loans' ? result.loans.filter(loan => (!query || loan.name.toLowerCase().includes(query)) && (roadmapAgency === 'all' || loan.name.toLowerCase().includes(roadmapAgency.split(' ')[0].toLowerCase()))) : [];
  function update<K extends keyof WorkerProfileInput>(key: K, value: WorkerProfileInput[K]) {
    onChange({ ...profile, [key]: value });
  }
  function go(next: number) { if (next === step) return; setMoving(true); setBackward(next < step); setStep(next); }
  function loadSample(scenario: WorkerScenario) {
    const sample: LocatedWorkerProfile = {
      ...defaultWorkerProfile, province: 'Metro Manila (NCR)', cityMunicipality: 'Quezon City', barangay: '', regionalDailyWage: 645, age: profile.age, contingencyDate: profile.contingencyDate,
      scenario, monthlySalary: 25000, averageMonthlySalaryCredit: 20000, highestSixMonthlySalaryCredit: 20000,
      contributionMonths: 72, recentContributionMonths: 6, qualifyingBenefitContributions: 3,
      pagibigContributionMonths: 72, pagibigRecentContribution: true, pagibigTAV: 28800,
      employerRemittancesCurrent: true,
    };
    if (scenario === 'sickness') Object.assign(sample, { sicknessDays: 10, sickLeaveExhausted: true, isWorkRelated: true });
    if (scenario === 'wages') Object.assign(sample, { sector: 'displaced', regionalDailyWage: 645, tupadDays: 10 });
    onChange(sample);
  }
  function applyPreset(key: keyof WorkerProfileInput, value: number) {
    if (key === 'monthlySalary') {
      const credit = Math.min(20000, Math.round(value / 500) * 500);
      onChange({ ...profile, monthlySalary: value, averageMonthlySalaryCredit: credit, highestSixMonthlySalaryCredit: credit });
    } else if (key === 'contributionMonths') {
      onChange({ ...profile, contributionMonths: value, pagibigContributionMonths: value, pagibigTAV: value * 400 });
    } else update(key, value as never);
  }
  const presets: Partial<Record<keyof WorkerProfileInput, { value: number; label: string }[]>> = {
    monthlySalary: [10000, 15000, 20000, 25000, 30000, 40000, 50000].map(value => ({ value, label: `₱${value.toLocaleString('en-PH')}` })),
    contributionMonths: [
      { value: 6, label: '6 buwan' }, { value: 12, label: '12 buwan (1 yr)' },
      { value: 36, label: '36 buwan (3 yrs - 1-Mo Loan)' }, { value: 72, label: '72 buwan (6 yrs - 2-Mo Loan)' },
      { value: 120, label: '120 buwan (10 yrs)' },
    ],
    pagibigTAV: [10000, 25000, 50000, 100000].map(value => ({ value, label: `₱${value.toLocaleString('en-PH')}` })),
    sicknessDays: [4, 7, 10, 15, 30, 60].map(value => ({ value, label: `${value} ${english ? 'days' : 'araw'}` })),
    regionalDailyWage: [
      { value: 645, label: 'NCR ₱645' }, { value: 520, label: 'CALABARZON / Central Luzon ₱520' },
      { value: 500, label: 'Visayas / Davao ₱500' }, { value: 450, label: 'Ibang Rehiyon ₱450' },
    ],
    tupadDays: [10, 15, 30].map(value => ({ value, label: `${value} ${english ? 'days' : 'araw'}` })),
  };
  function numeric(key: keyof WorkerProfileInput, label: string, hint?: string, max?: number) {
    return <div key={key}>
      <label htmlFor={`worker-${key}`} className={civicLabel}>{labelText(label)}</label>
      <input id={`worker-${key}`} type="number" min="0" max={max} step="any" autoComplete="off"
        className={control} value={Number(profile[key])} onChange={e => update(key, Math.max(0, Number(e.target.value)) as never)} />
      {presets[key] && <div className="flex flex-wrap gap-2 mt-2" aria-label={`${labelText(label)} presets`}>
        {presets[key]?.map(preset => <button key={preset.value} type="button" aria-pressed={Number(profile[key]) === preset.value}
          className={`${chip} ${Number(profile[key]) === preset.value ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-white border-[#E2DFD6]'}`}
          onClick={() => applyPreset(key, preset.value)}>{preset.label}</button>)}
      </div>}
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>;
  }
  function check(key: keyof WorkerProfileInput, label: string) {
    return <label key={key} htmlFor={`worker-${key}`} className={`flex items-center gap-3 min-h-[44px] rounded-xl border p-3 text-sm ${profile[key] ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-[#E2DFD6] bg-white'}`}>
      <input id={`worker-${key}`} type="checkbox" autoComplete="off" checked={Boolean(profile[key])}
        onChange={e => update(key, e.target.checked as never)} className="h-5 w-5 shrink-0 accent-blue-900 focus-ring" />{labelText(label)}
    </label>;
  }
  const government = profile.sector === 'government';
  const previewRows = profile.scenario === 'maternity'
    ? government
      ? [{ label: 'Government paid leave equivalent', amount: result.maternity.governmentPaidLeave, isResult: true }]
      : [{ label: 'SSS maternity', amount: result.maternity.sssBenefit }, { label: 'Employer salary differential', amount: result.maternity.employerSalaryDifferential }]
    : profile.scenario === 'sickness'
      ? [{ label: 'Regular SSS claim', amount: result.sickness.sssBenefit }, { label: 'Separate EC claim', amount: result.sickness.ecBenefit }, { label: 'Approved EC medical reimbursement', amount: result.sickness.ecMedicalReimbursement }, { label: 'Total separate claims', amount: result.sickness.combinedBenefit, isResult: true }]
    : profile.scenario === 'funeral'
      ? [{ label: 'Regular funeral', amount: result.funeral.regularBenefit }, { label: 'Separate EC funeral', amount: result.funeral.ecBenefit }, { label: 'Total separate claims', amount: result.funeral.combinedBenefit, isResult: true }]
    : profile.scenario === 'loans'
      ? result.loans.map(loan => ({ label: `${loan.name}: estimated proceeds`, amount: loan.netProceeds }))
      : [{ label: 'TUPAD work-pay illustration', amount: result.livelihood.tupadEstimate }, { label: 'OWWA BPBH candidate grant', amount: result.livelihood.bpbhGrant }, ...(profile.scenario === 'unemployment' ? [{ label: 'SSS unemployment', amount: result.unemploymentBenefit }] : [])];
  const stepHeader = <div className="space-y-4">
    <div>
      <h2 ref={heading} className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 focus:outline-none" tabIndex={-1}><BriefcaseBusiness aria-hidden="true" className="mr-2 inline h-5 w-5 text-blue-900" />{english ? 'Step' : 'Hakbang'} <span className="tabular-nums">{step}</span>: {english ? ['Sector and contributions', 'Current needs', 'Calculation and guide'][step - 1] : step === 1 ? 'Sektor at kontribusyon' : step === 2 ? 'Pangangailangan ngayon' : 'Kompyutasyon at gabay'}</h2>
      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{step === 1 ? (english ? 'What is your sector and what is in your contribution records?' : 'Anong sektor mo at ano ang nasa contribution records?') : step === 2 ? (english ? 'What support do you need and what records do you have?' : 'Anong tulong ang kailangan at anong records ang mayroon ka?') : (english ? 'Review the estimate and prepare your records for the claim.' : 'Suriin ang tantiya at ihanda ang records para sa claim.')}</p>
    </div>
    <SampleDataBanner language={language}>
      <div className="flex flex-wrap gap-2">
        {([
          ['maternity', 'Sample: Maternity + Differential'], ['sickness', 'Sample: Sakit + ECC Work Claim'],
          ['loans', 'Sample: SSS at Pag-IBIG Loan'], ['wages', 'Sample: Unpaid Sahod / SEnA'],
        ] as const).map(([scenario, label]) => <button key={scenario} type="button" className={`${chip} bg-white border-[#E2DFD6]`} onClick={() => loadSample(scenario)}>{label}</button>)}
      </div>
    </SampleDataBanner>
  </div>;
  return <section aria-label="Worker benefits simulator" className="space-y-6">
    <WizardStepper currentStep={step} onStepChange={go} steps={[
      { title: labelText('Sektor at Kontribusyon'), subtitle: english ? 'Worker and contribution records' : 'Manggagawa at hulog' },
      { title: labelText('Pangangailangan'), subtitle: english ? 'Situation and calculation' : 'Sitwasyon at kalkulasyon' },
      { title: labelText('Resulta at Hakbang'), subtitle: english ? 'Claim and loan guide' : 'Gabay sa claim at loan' },
    ]} />

    <form autoComplete="off" className={moving ? "overflow-x-clip motion-reduce:overflow-x-visible" : "overflow-visible"} onSubmit={e => { e.preventDefault(); go(Math.min(3, step + 1)); }}>
      <div key={step} onAnimationEnd={e => { if (e.target === e.currentTarget) setMoving(false); }} className={`${step === 3 ? 'space-y-6' : civicCard} ${backward ? 'animate-step-enter-back step-enter-backward' : 'animate-step-enter step-enter-forward'}`}>
        {step < 3 && stepHeader}
        {step === 1 && <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label htmlFor="worker-sector" className={civicLabel}>{labelText('Sektor')}</label>
              <select id="worker-sector" autoComplete="off" className={control} value={profile.sector} onChange={e => update('sector', e.target.value as WorkerProfileInput['sector'])}>
                <option value="private">Pribadong empleyado / SSS</option><option value="government">Kawani ng gobyerno / GSIS</option>
                <option value="self_employed">Self-employed / freelancer / informal</option><option value="ofw">OFW / balik-manggagawa</option><option value="displaced">Nawalan ng trabaho</option>
              </select></div>
            {numeric('monthlySalary', 'Buwanang regular na sahod (PHP)')}
            {numeric('age', 'Edad', 'Special occupation unemployment age limits require agency assessment.', 100)}
            {numeric('contributionMonths', government ? 'Kabuuang GSIS paid premium months' : 'Kabuuang posted SSS contribution months')}
          </div>
          <LocationHierarchyFields idPrefix="worker" value={profile} language={language} onChange={(location, updateMetadata) => onChange({ ...profile, province: location.province, cityMunicipality: location.cityMunicipality, barangay: location.barangay, ...(updateMetadata ? { regionalDailyWage: location.regionalDailyWage } : {}) } as LocatedWorkerProfile)} />
          {!government && <div className="border-t border-[#E2DFD6] pt-6"><fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">SSS salary credit / MSC sa My.SSS record</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              {numeric('averageMonthlySalaryCredit', 'Average ng huling 12 regular MSC (PHP)', 'Para sa salary / calamity loan. Regular MSC cap: PHP 20,000.', 20000)}
              {numeric('highestSixMonthlySalaryCredit', 'Average ng 6 pinakamataas na MSC (PHP)', 'Sa 12 months bago ang contingency semester; hindi kasalukuyang sahod.', 20000)}
            </div>
          </fieldset></div>}
          <div className="border-t border-[#E2DFD6] pt-6"><fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">Pag-IBIG savings</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              {numeric('pagibigContributionMonths', 'Pag-IBIG posted savings months')}
              {numeric('pagibigTAV', 'Actual total accumulated value / TAV (PHP)', 'Gamitin ang Virtual Pag-IBIG record; estimate lang ang preset.')}
            </div>
            <button type="button" className={`${button} text-sm mt-3`} onClick={() => update('pagibigTAV', profile.pagibigContributionMonths * 400)}>Gamitin ang rough TAV baseline</button>
            <details className="mt-2 text-sm text-slate-600"><summary className="min-h-[44px] py-3 cursor-pointer focus-ring font-bold">{english ? 'How are the presets estimated?' : 'Paano tinantiya ang presets?'}</summary>
              <p>Salary chips use a rounded salary credit capped at PHP 20,000; contribution chips use PHP 400 times paid months for rough Pag-IBIG savings, excluding dividends and historical rates. Confirm actual records before applying.</p>
            </details>
            {check('pagibigRecentContribution', 'May Pag-IBIG savings payment sa huling 6 months')}
          </fieldset></div>
        </>}
        {step === 2 && <>
          <fieldset className="m-0 min-w-0 border-0 p-0 space-y-4"><legend className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">{english ? 'Choose your main situation' : 'Piliin ang pangunahing sitwasyon'}</legend><div className="grid sm:grid-cols-2 gap-2">
            {scenarios.map(s => <label key={s.id} className={`flex min-h-[44px] gap-3 items-center rounded-xl border p-3 ${profile.scenario === s.id ? 'border-blue-600 bg-blue-50/50' : 'border-[#E2DFD6]'}`}>
              <input type="radio" name="worker-scenario" value={s.id} autoComplete="off" checked={profile.scenario === s.id} onChange={() => update('scenario', s.id)} className="h-5 w-5 shrink-0 accent-blue-900 focus-ring" />{labelText(s.title)}
            </label>)}
          </div></fieldset>
          {profile.scenario === 'loans' && <>
            <div className="grid sm:grid-cols-2 gap-4">
              {numeric('recentContributionMonths', government ? 'Posted GSIS premiums sa huling 6 months' : 'SSS contributions sa huling 12 months')}
              {numeric('loanProratedDays', 'Advance-interest days sa disclosure', 'SSS / GSIS actual release date determines days; 0 means not yet known.', 62)}
              {numeric('pagibigOutstandingLoan', 'Pag-IBIG existing short-term balance (PHP)')}
              {numeric(government ? 'gsisOutstandingLoan' : 'sssOutstandingLoan', government ? 'Applicable prior loan balance / offset (PHP)' : 'SSS Salary Loan balance / offset (PHP)')}
              {!government && numeric('sssCalamityOutstandingLoan', 'SSS Calamity Loan balance / offset (PHP)')}
            </div>
            {check('employerRemittancesCurrent', 'Current ang remittances / membership coverage; walang final benefit o disqualification')}
            {check('hasPastDueLoan', 'May past-due loan')}
            {check('calamityDeclared', 'Nasa declared calamity area at bukas ang agency application window')}
            {!government && check('hadRecentCondonation', 'Renewal matapos ang penalty condonation sa huling 5 years')}
            {government && <div className="grid sm:grid-cols-2 gap-4">
              {numeric('gsisNetTakeHomePay', 'Net take-home pay bago bagong loan (PHP)')}
              {numeric('gsisLoanTermYears', 'MPL Flex requested term (years)', 'Automatic limit batay sa tenure / employment status.', 15)}
              <div><label htmlFor="worker-gsisAdvanceInsuranceMonths" className={civicLabel}>Advance RI premium</label>
                <select id="worker-gsisAdvanceInsuranceMonths" autoComplete="off" className={control} value={profile.gsisAdvanceInsuranceMonths ?? 1} onChange={e => update('gsisAdvanceInsuranceMonths', Number(e.target.value))}>
                  <option value="1">1 month: loan granted on / before the 23rd</option>
                  <option value="2">2 months: loan granted after the 23rd</option>
                </select>
              </div>
              {numeric('gsisEmergencyOutstanding', 'Emergency loan renewal offset (PHP)')}
              <div>{check('gsisPermanent', 'Permanent regular member')}{check('gsisEmergencyRenewal', 'Pinapayagan ang PHP 40,000 emergency renewal sa kasalukuyang announcement')}</div>
            </div>}
          </>}
          {['maternity', 'sickness'].includes(profile.scenario) && <>
            {!government && numeric('qualifyingBenefitContributions', 'Posted contributions bago contingency semester', 'Sa 12 months bago ang semester; minimum 3 contributions.')}
            {profile.scenario === 'maternity' && <>
              <label htmlFor="worker-maternityType" className="block font-bold">Maternity leave category</label>
              <select id="worker-maternityType" autoComplete="off" value={profile.maternityType} onChange={e => update('maternityType', e.target.value as WorkerProfileInput['maternityType'])} className={control}>
                <option value="live_birth">Live birth: 105 days</option><option value="solo_parent">Qualified solo parent: 120 days</option><option value="miscarriage">Miscarriage / ETP: 60 days</option>
              </select>
              {check('employerDifferentialExempt', 'May valid DOLE-approved salary differential exemption ang employer')}
            </>}
            {profile.scenario === 'sickness' && <>
              {numeric('sicknessDays', 'Approved compensable sickness days', 'Illustration up to 120 days. Extension to 240 needs separate agency assessment.', 120)}
              {check('sickLeaveExhausted', 'Naubos ang paid sick leave')}
              {check('isWorkRelated', 'Work-related ang sakit / injury at may EC coverage')}
              {check('hasPermanentDisability', 'May approved permanent disability para sa carer allowance')}
              {numeric('approvedECMedicalReimbursement', 'Approved EC medical reimbursement (PHP)', '0 hangga’t walang approved amount; hindi ito total hospital bill.')}
            </>}
          </>}
          {profile.scenario === 'unemployment' && <>
            {numeric('unemploymentAverageMonthlySalaryCredit', 'Unemployment AMSC (PHP)', 'Average ng 12 regular MSC bago ang contingency semester, hindi latest loan MSC.', 20000)}
            {numeric('unemploymentRecentContributions', 'SSS contributions sa huling 18 months', 'Minimum 12 sa 18 months bago separation.')}
            {check('involuntarilySeparated', 'Involuntary separation, hindi resignation / just-cause dismissal')}
            {check('unemploymentClaimWithinThreeYears', 'Nakakuha ng unemployment benefit sa nakaraang 3 years')}
          </>}
          {profile.scenario === 'funeral' && <>
            {numeric('funeralAverageMonthlySalaryCredit', 'Funeral AMSC (PHP)', 'Higher of last-60-month or lifetime average bago contingency semester.', 20000)}
            <div><label htmlFor="worker-contingencyDate" className="block font-bold mb-1.5">Contingency / funeral claim reference date</label>
              <input id="worker-contingencyDate" type="date" autoComplete="off" value={profile.contingencyDate} onChange={e => update('contingencyDate', e.target.value)} className={control} /></div>
            {check('isWorkRelated', 'Work-related ang pagkamatay at may EC coverage')}
          </>}
          {profile.sector === 'ofw' && ['sickness', 'funeral'].includes(profile.scenario) && <>
            {check('ofwSeaBased', 'Sea-based OFW / seafarer na may SSS EC coverage')}
            <p className="text-sm text-slate-600">Sea-based workers have compulsory SSS EC coverage. Land-based workers should confirm EC coverage with SSS and ask OWWA / DMW AKSYON or their foreign employer insurer about separate support.</p>
          </>}
          {['livelihood', 'unemployment'].includes(profile.scenario) && <div className="grid sm:grid-cols-2 gap-4">
            {numeric('regionalDailyWage', 'Approved regional daily minimum wage (PHP)', 'Kunin sa kasalukuyang regional wage order / PESO.')}
            {numeric('tupadDays', 'Approved TUPAD days', '10 to 30 days; walang automatic placement.', 30)}
            {profile.sector === 'ofw' && <>
              <div><label htmlFor="worker-owwaMembership" className="block font-bold mb-1.5">OWWA membership sa return</label>
                <select id="worker-owwaMembership" autoComplete="off" value={profile.owwaMembership} onChange={e => update('owwaMembership', e.target.value as WorkerProfileInput['owwaMembership'])} className={control}>
                  <option value="none">Walang qualifying membership</option><option value="active">Active</option><option value="inactive_once">Inactive, 1 contribution</option><option value="inactive_multiple">Inactive, higit sa 1 contribution</option>
                </select></div>{check('returnedWithinThreeYears', 'Distressed / displaced returnee sa huling 3 years')}
            </>}
          </div>}
          {profile.scenario === 'wages' && <p className="text-slate-700">Ihanda ang employment dates, employer address, payslips at itemized unpaid wages. Libre ang SEnA; tumawag sa <span className="tabular-nums">1349</span>. Nasa printable packet ang worksheet.</p>}
          {profile.scenario === 'wages' ? <div className="rounded-xl border border-[#E2DFD6] bg-[#FAF9F5] p-4"><h3 className="font-bold">{english ? 'Live filing preview' : 'Live na gabay sa filing'}</h3><p className="mt-2 text-sm">{english ? 'Unpaid wages require an itemized claim. The printable SEnA worksheet helps you prepare the amounts and records.' : 'I-itemize ang unpaid sahod. Gamitin ang printable SEnA worksheet para ihanda ang halaga at records.'}</p></div> : <LiveReliefBreakdownBox title={english ? 'Live benefit / loan preview' : 'Live na benefit / loan preview'} rows={previewRows} note={profile.scenario === 'loans' && result.loans.length === 0 ? (english ? 'No loan illustration for the current record. Confirm contributions and remittances.' : 'Walang loan illustration sa record ngayon. Kumpirmahin ang hulog at remittances.') : (english ? 'Estimates only. Separate loans and grants are not added into one entitlement; agencies verify records and approval.' : 'Tantiya lamang. Hiwalay ang mga loan at grant; ahensya ang magkukumpirma ng records at approval.')} />}
        </>}
        {step === 3 && <>
          <section className={civicCard}>
            {stepHeader}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{english ? 'Your guide is ready' : 'Handa na ang inyong gabay'}</span>
            <p className="text-sm leading-relaxed text-slate-600">{english ? 'Estimates only; agencies confirm records, eligibility and approval. Loans, grants and monthly allowances remain separate.' : 'Tantiya lamang; ahensya ang magkukumpirma ng records at approval. Hiwalay ang loans, grants at monthly allowance.'}</p>
            <p className="text-sm font-semibold">{labelText(scenarios.find(scenario => scenario.id === profile.scenario)?.title ?? '')}</p>
            <p className="text-sm tabular-nums">{result.matchedPrograms.length} {english ? 'programs to ask about' : 'programang maaaring itanong'}</p>
          </section>
          <div className={civicCard}>
            <label htmlFor="worker-roadmap-search" className={civicLabel}>{english ? 'Find a loan or program' : 'Hanapin ang loan o programa'}</label>
            <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500" /><input autoComplete="off" id="worker-roadmap-search" type="search" className={`${civicInput} pl-10`} value={roadmapQuery} onChange={event => setRoadmapQuery(event.target.value)} /></div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={english ? 'Roadmap agencies' : 'Roadmap: ahensya'}>{['all', ...roadmapAgencies].map(agency => <button key={agency} type="button" aria-pressed={roadmapAgency === agency} className={roadmapAgency === agency ? civicSelectedPill : civicPill} onClick={() => setRoadmapAgency(agency)}>{agency === 'all' ? (english ? 'All programs' : 'Lahat ng programa') : agency}</button>)}</div>
            {(roadmapQuery || roadmapAgency !== 'all') && <button type="button" className={civicSecondary} onClick={() => { setRoadmapQuery(''); setRoadmapAgency('all'); }}>{english ? 'Clear roadmap filter' : 'I-clear ang roadmap filter'}</button>}
            <p role="status" className="text-sm tabular-nums text-slate-600">{matchedPrograms.length} {english ? 'program matches' : 'programang tumutugma'}</p>
            {(roadmapQuery || roadmapAgency !== 'all') && !matchedPrograms.length && !visibleLoans.length && <p className="text-sm">{english ? 'No roadmap matches. Try another name or clear the filter.' : 'Walang tugma sa roadmap filter. Subukan ang ibang pangalan o i-clear ang filter.'}</p>}
          </div>
          <ActionRoadmapStepCard step={1} title={english ? 'Review Your Benefit / Loan Estimate' : 'Suriin ang Benefit / Loan Estimate'} open>
          <div aria-live="polite" aria-atomic="true" className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl p-4 tabular-nums space-y-2">
            {profile.scenario === 'maternity' && <>
              <p>Leave days: <strong>{result.maternity.days}</strong></p>
              <p>SSS maternity: <strong data-testid="worker-maternity-total">{peso(result.maternity.sssBenefit)}</strong></p>
              <p>Employer salary differential: <strong>{peso(result.maternity.employerSalaryDifferential)}</strong></p>
              {government && <p>Government paid leave equivalent: {peso(result.maternity.governmentPaidLeave)}. Agency payroll confirms full pay.</p>}
            </>}
            {profile.scenario === 'sickness' && <>
              <p>Regular SSS: <strong>{peso(result.sickness.sssBenefit)}</strong> ({peso(result.sickness.sssDaily)} / day)</p>
              <p>Separate EC TTD: <strong>{peso(result.sickness.ecBenefit)}</strong> ({peso(result.sickness.ecDaily)} / day)</p>
              <p>Approved EC medical: {peso(result.sickness.ecMedicalReimbursement)}</p>
              <p>Total separate claims: <strong data-testid="worker-sickness-total">{peso(result.sickness.combinedBenefit)}</strong></p>
              <p>Permanent disability carer allowance: {peso(result.sickness.ecCarerMonthly)} / month (separate from one-time total)</p>
            </>}
            {profile.scenario === 'unemployment' && <p>SSS unemployment: <strong data-testid="worker-unemployment-total">{peso(result.unemploymentBenefit)}</strong></p>}
            {profile.scenario === 'funeral' && <><p>Regular funeral: {peso(result.funeral.regularBenefit)}</p><p>Separate EC funeral: {peso(result.funeral.ecBenefit)}</p><p>Total: <strong>{peso(result.funeral.combinedBenefit)}</strong></p><p className="text-sm">Survivor pension requires separate agency assessment; hindi kasama sa funeral total.</p></>}
            {['livelihood', 'unemployment'].includes(profile.scenario) && <><p>TUPAD work-pay illustration: {peso(result.livelihood.tupadEstimate)}</p><p>OWWA BPBH candidate grant: {peso(result.livelihood.bpbhGrant)}</p><p className="text-sm">Hindi automatic grant o job placement. DILP tools / materials require approved proposal.</p></>}
            {profile.scenario === 'wages' && <p>Para sa unpaid sahod o final pay, buksan ang printable packet at ihanda ang SEnA worksheet.</p>}
            {profile.scenario === 'loans' && <p>{result.loans.length} candidate loan illustrations. Hindi pinagsasama ang magkakaibang loan entitlement.</p>}
          </div>
          {profile.scenario === 'loans' && <div className="space-y-4">
            {result.loans.length === 0 && <p>Walang loan illustration sa kasalukuyang record. Suriin ang contributions, recent payments, MSC, remittances at net pay.</p>}
            {visibleLoans.map(l => <article key={l.id} className="border border-[#E2DFD6] rounded-xl p-4 animate-cascade-item relief-pillar">
              <h3 className="font-bold text-lg">{l.name}</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm tabular-nums mt-3">
                <dt>Gross principal</dt><dd className="text-right">{peso(l.grossPrincipal)}</dd>
                <dt>Service fee</dt><dd className="text-right">{peso(l.serviceFee)}</dd>
                <dt>Advance interest</dt><dd className="text-right">{peso(l.advanceInterest)}</dd>
                <dt>Insurance / offsets</dt><dd className="text-right">{peso(l.insurance + l.offset)}</dd>
                <dt>Estimated proceeds</dt><dd className="text-right font-bold">{peso(l.netProceeds)}</dd>
                <dt>Stated annual rate</dt><dd className="text-right">{(l.annualRate * 100).toFixed(2)}%</dd>
                <dt>Monthly illustration</dt><dd className="text-right font-bold">{peso(l.monthlyAmortization)}</dd>
                <dt>Repayments / grace</dt><dd className="text-right">{l.termMonths} / {l.graceMonths} months</dd>
              </dl>
              <p className="text-xs mt-3 text-slate-600">{l.note}</p>
              <details className="mt-3"><summary className="min-h-[44px] py-3 cursor-pointer font-bold focus-ring">Tingnan ang repayment schedule</summary>
                <div className="max-h-80 overflow-y-auto"><table className="w-full text-xs tabular-nums"><caption className="text-left pb-2">Rounded estimate; final payment adjusts cents.</caption><thead><tr><th>Month</th><th>Bayad</th><th>Interest</th><th>Balance</th></tr></thead><tbody>
                  {l.schedule.map(row => <tr key={row.month}><td className="py-2">{row.month}</td><td className="text-right">{row.payment.toFixed(2)}</td><td className="text-right">{row.interest.toFixed(2)}</td><td className="text-right">{row.balance.toFixed(2)}</td></tr>)}
                </tbody></table></div>
              </details>
            </article>)}
          </div>}
          </ActionRoadmapStepCard>
          <ActionRoadmapStepCard step={2} title={english ? 'Prepare Records and File Your Claim' : 'Ihanda ang Records at Mag-file ng Claim'} open>
          <p className="text-sm text-slate-600">{english ? 'Estimates only; agency approval and verified records are required.' : 'Tantiya lang ito; kailangan ang verified record at approval ng ahensiya.'}</p>
          <details className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <summary className="min-h-[44px] py-3 cursor-pointer font-bold focus-ring">{english ? 'Why this matters / Rules and reminders' : 'Bakit ito mahalaga? / Batas at Paalala'}</summary>
            <div className="space-y-2 mt-2">{profile.scenario === 'maternity' && <p>Full-pay illustration uses monthly wage / 30 days. Employer payroll and lawful deductions may affect differential; non-remittance cases require DOLE / SSS assessment.</p>}{result.advisories.map(a => <p key={a}>{a}</p>)}</div>
          </details>
          <div className="space-y-3">{matchedPrograms.map((p, index) => <details open={index === 0} key={p.id} className="border-b border-[#E2DFD6]">
            <summary className="min-h-[44px] py-3 font-bold cursor-pointer focus-ring">{p.name}: checklist at susunod na hakbang</summary>
            <div className="pb-4 space-y-2 text-sm"><p>{p.benefit}</p><p>{p.eligibility}</p><p>{p.basis}</p><ul className="list-disc pl-5">{p.checklist.map(c => <li key={c}>{c}</li>)}</ul><a href={p.source} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-[44px] text-blue-900 underline break-all">Opisyal na source at application guidance</a></div>
          </details>)}</div>
          </ActionRoadmapStepCard>
          <ActionRoadmapStepCard step={3} title={english ? 'Bring Your Printable Worker Packet' : 'Dalhin ang Printable Worker Packet'} open>
          <PrintablePacketCallout language={language} buttonLabel={english ? 'Open Printable Worker Packet' : 'Buksan ang Printable Worker Packet'} onPrint={onPrint} />
          </ActionRoadmapStepCard>
        </>}
        <div className="flex justify-between gap-3 border-t border-[#E2DFD6] pt-4">
          <button type="button" disabled={step === 1} onClick={() => go(step - 1)} className={`${button} disabled:opacity-40`}><ArrowLeft aria-hidden="true" className="h-4 w-4" />{english ? 'Back' : 'Bumalik'}</button>
          {step < 3 && <button type="submit" className={civicPrimary}>{english ? 'Next' : 'Susunod'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>}
        </div>
      </div>
    </form>
  </section>;
}
