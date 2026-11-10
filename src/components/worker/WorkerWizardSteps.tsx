import type { ReactNode } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { civicCard, civicLabel, civicInput, civicPrimary, civicSecondary, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';
import { LocationHierarchyFields } from '@/components/shared/LocationHierarchyFields';
import { LiveReliefBreakdownBox, ActionRoadmapStepCard, PrintablePacketCallout } from '@/components/shared/CivicStepCards';
import { PlainLanguageGlossaryCard, QuickStartActionCard } from '@/components/shared/PlainLanguageGuide';
import { CrossPillarBridgeCard } from '@/components/shared/CrossPillarBridgeCard';
import { OFWCaseTrackerCard } from '@/components/worker/OFWCaseTrackerCard';
import type { Language } from '@/lib/i18n';
import type { WorkerProfileInput, WorkerScenario } from '@/types/worker';
import { calculateWorkerBenefitsAndLoans } from '@/lib/workerBenefitsCalculator';
import type { OFWCaseRecord } from '@/lib/ofwTracker';
import type { WorkerWorksheetFields } from '@/lib/storage';

const control = civicInput;
const button = civicSecondary;
const peso = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
const scenarios: { id: WorkerScenario; title: string }[] = [
  { id: 'loans', title: 'Emergency cash / calamity loan' },
  { id: 'maternity', title: 'Maternity at salary differential' },
  { id: 'sickness', title: "Sakit o aksidente sa trabaho (Employees' Compensation / EC claim)" },
  { id: 'unemployment', title: 'Natanggal / nagsara ang kompanya' },
  { id: 'wages', title: 'Hindi nabayarang sahod / final pay' },
  { id: 'livelihood', title: 'Puhunan at livelihood grant' },
  { id: 'funeral', title: 'Funeral at survivor claims' },
  { id: 'pension_savings', title: 'Pensiyon at MP2 Savings' },
];

export type LocatedWorkerProfile = WorkerProfileInput & { province?: string; cityMunicipality?: string; barangay?: string; hasDisabilityOrDependent?: boolean };


type PensionFormulaUsed = 'formula1' | 'formula2' | 'guaranteed_min' | 'lump_sum' | 'gsis_bmp';

interface WorkerWizardStepsProps {
  step: number;
  profile: LocatedWorkerProfile;
  onChange: (profile: LocatedWorkerProfile) => void;
  language: Language;
  english: boolean;
  local: (taglish: string, en: string, cebuano: string, ilocano: string) => string;
  ageLabel: string;
  ageHint: string;
  pensionText: Record<string, string>;
  labelText: (text: string) => string;
  sectorLabels: Record<WorkerProfileInput['sector'], Record<Language, string>>;
  localizedPensionExplanation: (formulaUsed: PensionFormulaUsed, language: Language) => string;
  update: <K extends keyof WorkerProfileInput>(key: K, value: WorkerProfileInput[K]) => void;
  resetSalaryCredits: () => void;
  resetPagibigTAV: () => void;
  ofwCase: OFWCaseRecord | null;
  updateOFWCase: (record: OFWCaseRecord) => void;
  ofwCaseStorageError: boolean;
  roadmapQuery: string;
  setRoadmapQuery: (query: string) => void;
  roadmapAgency: string;
  setRoadmapAgency: (agency: string) => void;
  stepHeader: ReactNode;
  worksheet: WorkerWorksheetFields;
  onWorksheetChange: (fields: WorkerWorksheetFields) => void;
  onPrint: () => void;
}

export function WorkerWizardSteps({
  step, profile, onChange, language, english, local, ageLabel, ageHint, pensionText,
  labelText, sectorLabels, localizedPensionExplanation, update, resetSalaryCredits,
  resetPagibigTAV, ofwCase, updateOFWCase, ofwCaseStorageError, roadmapQuery,
  setRoadmapQuery, roadmapAgency, setRoadmapAgency, stepHeader, worksheet, onWorksheetChange, onPrint,
}: WorkerWizardStepsProps) {
  const result = calculateWorkerBenefitsAndLoans(profile);
  const payrollSchedule = profile.payrollSchedule === 'five_day_week' || profile.payrollSchedule === 'monthly_paid'
    ? profile.payrollSchedule : 'six_day_week';
  const sharedContext = {
    province: profile.province,
    cityMunicipality: profile.cityMunicipality,
    barangay: profile.barangay,
    regionalDailyWage: profile.regionalDailyWage,
    isPWD: profile.hasDisabilityOrDependent,
    ...(profile.sector === 'ofw' ? { isOFW: true } : {}),
    sourcePillar: 'worker' as const,
  };
  const query = roadmapQuery.trim().toLowerCase();
  const roadmapAgencies = [...new Set(result.matchedPrograms.map(program => program.agency))];
  const matchedPrograms = result.matchedPrograms.filter(program => (roadmapAgency === 'all' || program.agency === roadmapAgency) && `${program.name} ${program.agency}`.toLowerCase().includes(query));
  const visibleLoans = profile.scenario === 'loans' ? result.loans.filter(loan => (!query || loan.name.toLowerCase().includes(query)) && (roadmapAgency === 'all' || loan.name.toLowerCase().includes(roadmapAgency.split(' ')[0].toLowerCase()))) : [];
  function numeric(key: keyof WorkerProfileInput, label: string, hint?: string, max?: number) {
    return <div key={key}>
      <label htmlFor={`worker-${key}`} className={civicLabel}>{labelText(label)}</label>
      <input id={`worker-${key}`} type="number" min="0" max={max} step="any" autoComplete="off"
        className={control} value={Number(profile[key])} onChange={e => update(key, Math.max(0, Number(e.target.value)) as never)} />
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>;
  }
  function wageNumeric(key: keyof WorkerProfileInput, label: string, hint: string, max?: number, step = 'any') {
    return <div key={key}>
      <label htmlFor={`worker-${key}`} className={civicLabel}>{labelText(label)}</label>
      <input id={`worker-${key}`} type="number" min="0" max={max} step={step} autoComplete="off"
        className={control} value={Number(profile[key] ?? 0)} onChange={event => {
          const entered = Number(event.target.value);
          const bounded = Number.isFinite(entered) ? Math.max(0, max === undefined ? entered : Math.min(max, entered)) : 0;
          update(key, bounded as never);
        }} />
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>;
  }
  function pensionNumeric(id: string, label: string, value: number, min: number, max: number | undefined,
    step: string, setValue: (value: number) => void, hint?: string) {
    return <div key={id}>
      <label htmlFor={id} className={civicLabel}>{label}</label>
      <input id={id} type="number" min={min} max={max} step={step} autoComplete="off" className={control} value={value}
        onChange={event => {
          const entered = Number(event.target.value);
          setValue(Number.isFinite(entered) ? Math.max(0, max === undefined ? entered : Math.min(max, entered)) : 0);
        }} />
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
        ? [{ label: 'Regular SSS claim', amount: result.sickness.sssBenefit }, { label: "Separate Employees' Compensation (EC) claim", amount: result.sickness.ecBenefit }, { label: "Approved Employees' Compensation (EC) medical reimbursement", amount: result.sickness.ecMedicalReimbursement }, { label: 'Total separate claims', amount: result.sickness.combinedBenefit, isResult: true }]
    : profile.scenario === 'funeral'
      ? [{ label: 'Regular funeral', amount: result.funeral.regularBenefit }, { label: "Separate Employees' Compensation (EC) funeral benefit", amount: result.funeral.ecBenefit }, { label: 'Total separate claims', amount: result.funeral.combinedBenefit, isResult: true }]
    : profile.scenario === 'loans'
      ? result.loans.map(loan => ({ label: `${loan.name}: estimated proceeds`, amount: loan.netProceeds }))
      : [{ label: 'TUPAD work-pay illustration', amount: result.livelihood.tupadEstimate }, { label: 'OWWA BPBH candidate grant', amount: result.livelihood.bpbhGrant }, ...(profile.scenario === 'unemployment' ? [{ label: 'SSS unemployment', amount: result.unemploymentBenefit }] : [])];
  function wageClaimsTable() {
    return <div className="min-w-0 overflow-hidden rounded-lg border border-[#E2DFD6] bg-white">
      <table className="w-full table-fixed text-xs tabular-nums">
        <caption className="sr-only">{english ? 'Estimated itemized SEnA wage claims and legal bases' : 'Tinatayang itemized SEnA wage claim at legal na batayan'}</caption>
        <colgroup><col className="w-2/3" /><col className="w-1/3" /></colgroup>
        <thead><tr className="border-b border-[#E2DFD6] text-left"><th scope="col" className="p-2">{english ? 'Claim and basis' : 'Claim at batayan'}</th><th scope="col" className="p-2 text-right">{english ? 'Amount' : 'Halaga'}</th></tr></thead>
        <tbody>{result.wageClaims.breakdownItems.map(item => <tr key={item.label} className="border-b border-[#E2DFD6] last:border-0">
          <th scope="row" className="break-words p-2 text-left font-semibold">{item.label}<span className="mt-1 block font-normal text-slate-600">{item.basis}</span></th>
          <td className="break-words p-2 text-right">{peso(item.amount)}</td>
        </tr>)}</tbody>
        <tfoot><tr className="bg-[#FAF9F5] font-bold"><th scope="row" className="break-words p-2 text-left">{english ? 'Total estimated SEnA claim' : 'Kabuuang tantiya sa SEnA claim'}</th><td className="break-words p-2 text-right">{peso(result.wageClaims.totalClaim)}</td></tr></tfoot>
      </table>
    </div>;
  }
  return <>
        {step === 1 && <>
          <fieldset className="m-0 min-w-0 border-0 p-0 space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">{pensionText.choose}</legend>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={pensionText.choose}>
              {scenarios.map(s => <label key={s.id} className={`flex min-h-[44px] min-w-0 items-center gap-3 rounded-xl border p-3 text-sm ${profile.scenario === s.id ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-[#E2DFD6] bg-white'}`}>
                <input type="radio" name="worker-scenario" value={s.id} autoComplete="off" checked={profile.scenario === s.id} onChange={() => update('scenario', s.id)} className="h-5 w-5 shrink-0 accent-blue-900 focus-ring" />
                <span className="break-words">{s.id === 'pension_savings' ? pensionText.title : labelText(s.title)}</span>
              </label>)}
            </div>
          </fieldset>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label htmlFor="worker-sector" className={civicLabel}>{labelText('Sektor')}</label>
              <select id="worker-sector" autoComplete="off" className={control} value={profile.sector} onChange={event => {
                const sector = event.target.value as WorkerProfileInput['sector'];
                onChange({ ...profile, sector, ...(sector === 'government' ? { pensionType: 'retirement' as const } : {}) });
              }}>
                {(['private', 'government', 'self_employed', 'ofw', 'displaced'] as const).map(sector =>
                  <option key={sector} value={sector}>{sectorLabels[sector][language]}</option>)}
              </select></div>
            {profile.scenario !== 'pension_savings' && numeric('monthlySalary', local('Buwanang regular na sahod (PHP)', 'Regular monthly pay (PHP)', 'Regular nga binulan nga sweldo (PHP)', 'Regular a bulan a sueldo (PHP)'))}
            {numeric('age', ageLabel, ageHint, 100)}
            {profile.scenario !== 'pension_savings' && !['wages', 'livelihood'].includes(profile.scenario) && numeric('contributionMonths', government ? local('Ilang buwan ang hulog sa GSIS?', 'Months contributed to GSIS', 'Pila ka bulan ang hulog sa GSIS?', 'Mano a bulan dagiti kontribusion iti GSIS?') : local('Ilang buwan ang hulog sa SSS?', 'Months contributed to SSS', 'Pila ka bulan ang hulog sa SSS?', 'Mano a bulan dagiti kontribusion iti SSS?'))}
            {profile.scenario === 'loans' && numeric('pagibigContributionMonths', local('Ilang buwan ang hulog sa Pag-IBIG?', 'Months contributed to Pag-IBIG', 'Pila ka bulan ang hulog sa Pag-IBIG?', 'Mano a bulan dagiti kontribusion iti Pag-IBIG?'), local('Kailangan ng hindi bababa sa 24 buwan para sa ilang Pag-IBIG cash loan.', 'Some Pag-IBIG cash loans require at least 24 monthly contributions.', 'Kinahanglan ang labing menos 24 ka bulan para sa pipila ka Pag-IBIG cash loan.', 'Kasapulan ti saan a nababbaba ngem 24 a bulan para iti sumagmamano a Pag-IBIG cash loan.'))}
          </div>
          {profile.scenario !== 'pension_savings' && <LocationHierarchyFields idPrefix="worker" value={profile} language={language} showWageReference={true} onChange={(location, updateMetadata) => onChange({ ...profile, province: location.province, cityMunicipality: location.cityMunicipality, barangay: location.barangay, ...(updateMetadata ? { regionalDailyWage: profile.regionalDailyWageManual ? profile.regionalDailyWage : location.regionalDailyWage } : {}) } as LocatedWorkerProfile)} />}
          {profile.scenario !== 'pension_savings' && <label htmlFor="worker-disability-context" className={`flex min-h-[44px] items-center gap-3 rounded-xl border p-3 text-sm ${profile.hasDisabilityOrDependent ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-[#E2DFD6] bg-white text-slate-800'}`}>
            <input id="worker-disability-context" type="checkbox" autoComplete="off" checked={Boolean(profile.hasDisabilityOrDependent)}
              onChange={event => onChange({ ...profile, hasDisabilityOrDependent: event.target.checked })}
              className="h-5 w-5 shrink-0 accent-blue-900 focus-ring" />
            <span>{local('May miyembro ng pamilya na PWD o dependent (pang-konteksto lang ito, hindi patunay ng eligibility).', 'A family member is a person with disability (PWD) or dependent. This is context only and does not prove eligibility.', 'Adunay PWD o dependent sa pamilya. Impormasyon lamang kini ug dili pamatuod sa eligibility.', 'Adda kameng ti pamilya a PWD wenno dependent. Impormasion laeng daytoy, saan a pammaneknek ti eligibility.')}</span>
          </label>}
          {((!government && profile.scenario !== 'pension_savings') || profile.scenario === 'loans') && <details className="rounded-xl border border-[#E2DFD6] bg-white p-3">
            <summary className="min-h-[44px] cursor-pointer py-2 font-semibold text-slate-900 focus-ring">{local('I-edit ang eksaktong SSS / Pag-IBIG record (Optional)', 'Edit exact SSS / Pag-IBIG records (Optional)', 'Usba ang eksaktong rekord sa SSS / Pag-IBIG (Opsyonal)', 'Baliwan ti eksakto a rekord ti SSS / Pag-IBIG (Opsyonal)')}</summary>
            <div className="mt-3 space-y-4">
              {!government && <fieldset className="m-0 min-w-0 border-0 border-t border-[#E2DFD6] p-0 pt-4 space-y-4">
                <legend className="px-1 text-sm font-bold text-slate-900">{local('Batayang sahod sa SSS', 'SSS salary bracket', 'Salary bracket sa SSS', 'Salary bracket ti SSS')}</legend>
                <p className="text-sm text-slate-600">{local('Tinatantiya ito mula sa buwanang sahod. I-edit lang kung iba ang nasa My.SSS record mo.', 'This is estimated from monthly pay. Edit it only if your My.SSS record differs.', 'Gibanabana kini gikan sa binulan nga sweldo. Usba lang kon lahi ang naa sa My.SSS record.', 'Pagarupen daytoy manipud iti bulan a sueldo. Baliwan laeng no naiduma iti rekord ti My.SSS.')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {numeric('averageMonthlySalaryCredit', local('SSS salary bracket para sa loan (PHP)', 'SSS salary bracket for loans (PHP)', 'Salary bracket sa SSS para sa loan (PHP)', 'Salary bracket ti SSS para iti loan (PHP)'), local('Ginagamit ito sa ilang SSS loan.', 'Used for some SSS loans.', 'Usa kini sa pipila ka loan sa SSS.', 'Usaren daytoy iti sumagmamano a SSS loan.'), 20000)}
                  {numeric('highestSixMonthlySalaryCredit', local('SSS salary bracket para sa maternity o sakit (PHP)', 'SSS salary bracket for maternity or sickness (PHP)', 'Salary bracket sa SSS para sa maternity o sakit (PHP)', 'Salary bracket ti SSS para iti maternity wenno sakit (PHP)'), local('Base sa pinakamataas na 6 sa 12 buwang pasok sa claim.', 'Based on the highest 6 of 12 months that count for the claim.', 'Base sa pinakataas nga 6 sa 12 ka bulan nga apil sa claim.', 'Naibatay kadagiti kangatoan a 6 iti 12 a bulan a maibilang iti claim.'), 20000)}
                </div>
                <button type="button" className={`${button} text-sm`} onClick={resetSalaryCredits}>{local('Ibalik ang tantiya ng SSS mula sa sahod', 'Estimate SSS brackets from monthly pay', 'Ibanabana pag-usab ang SSS bracket gikan sa sweldo', 'Pagarupen manen dagiti bracket ti SSS manipud iti sueldo')}</button>
              </fieldset>}
              {profile.scenario === 'loans' && <fieldset className="m-0 min-w-0 border-0 border-t border-[#E2DFD6] p-0 pt-4 space-y-3">
                <legend className="px-1 text-sm font-bold text-slate-900">{local('Kabuuang ipon sa Pag-IBIG (TAV)', 'Total Pag-IBIG savings (TAV)', 'Kinatibuk-ang tinigom sa Pag-IBIG (TAV)', 'Dagup a naidulin iti Pag-IBIG (TAV)')}</legend>
                {numeric('pagibigTAV', local('Tinatayang kabuuang ipon (PHP)', 'Estimated total savings (PHP)', 'Gibanabanang kinatibuk-ang tinigom (PHP)', 'Naipagarup a dagup a naidulin (PHP)'), local('Ilagay ang totoong halaga sa Virtual Pag-IBIG kung alam mo.', 'Enter the actual amount from Virtual Pag-IBIG if known.', 'Ibutang ang tinuod nga kantidad sa Virtual Pag-IBIG kon nahibaloan.', 'Ilagam ti pudno a gatad manipud Virtual Pag-IBIG no ammo.'))}
                <button type="button" className={`${button} text-sm`} onClick={resetPagibigTAV}>{local('Tantiyahin mula sa buwan ng hulog (× ₱400/buwan)', 'Estimate from contribution months (× ₱400/month)', 'Ibanabana gikan sa bulan sa hulog (× ₱400/bulan)', 'Pagarupen manipud iti bulan ti kontribusion (× ₱400/bulan)')}</button>
                <details className="text-sm text-slate-600"><summary className="min-h-[44px] cursor-pointer py-2 font-semibold focus-ring">{local('Paano kinukuha ang tantiya?', 'How is this estimate calculated?', 'Giunsa pagkalkula ang banabana?', 'Kasano a maikalkula daytoy a pagarup?')}</summary>
                  <p className="mt-2">{local('Tinatantiya ang SSS bracket kada ₱500, hanggang ₱20,000. Ang Pag-IBIG estimate ay hulog na buwan times ₱400, hindi kasama ang dibidendo. Kumpirmahin sa My.SSS at Virtual Pag-IBIG.', 'SSS brackets round to ₱500 up to ₱20,000. The Pag-IBIG estimate multiplies contribution months by ₱400 and excludes dividends. Confirm with My.SSS and Virtual Pag-IBIG.', 'I-round ang SSS bracket sa ₱500 hangtod ₱20,000. Ang Pag-IBIG estimate kay bulan sa hulog times ₱400, wala pay dibidendo. Kumpirmaha sa My.SSS ug Virtual Pag-IBIG.', 'I-round ti SSS bracket iti ₱500 agingga ₱20,000. Ti pagarup ti Pag-IBIG ket bilang ti bulan ti kontribusion times ₱400, saan pay a karaman dagiti dividend. Kumpirmaran iti My.SSS ken Virtual Pag-IBIG.')}</p>
                </details>
                {check('pagibigRecentContribution', local('May hulog sa Pag-IBIG sa nakaraang 6 na buwan', 'Pag-IBIG contribution in the last 6 months', 'Adunay hulog sa Pag-IBIG sa miaging 6 ka bulan', 'Adda kontribusion iti Pag-IBIG iti napalabas a 6 a bulan'))}
              </fieldset>}
            </div>
          </details>}
        </>}
        {step === 2 && <>
          {profile.scenario === 'pension_savings' && <section aria-labelledby="worker-pension-inputs" className="min-w-0 space-y-4 rounded-xl border border-[#E2DFD6] bg-white p-4">
            <h3 id="worker-pension-inputs" className="text-base font-bold text-slate-900">{pensionText.title}</h3>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="worker-pensionType" className={civicLabel}>{pensionText.pensionType}</label>
                <select id="worker-pensionType" autoComplete="off" className={control} value={profile.pensionType ?? 'retirement'} onChange={event => update('pensionType', event.target.value as WorkerProfileInput['pensionType'])}>
                  <option value="retirement">{government ? 'GSIS ' : 'SSS '}{pensionText.retirement}</option>
                  {!government && <>
                    <option value="disability_ptd">SSS {pensionText.ptd}</option>
                    <option value="disability_ppd">SSS {pensionText.ppd}</option>
                  </>}
                </select>
              </div>
              {pensionNumeric('worker-contribution-years', pensionText.years, Math.floor(profile.contributionMonths / 12), 0, 100, '1', value => update('contributionMonths', value * 12 + profile.contributionMonths % 12))}
              {pensionNumeric('worker-contribution-remainder', pensionText.months, profile.contributionMonths % 12, 0, 11, '1', value => update('contributionMonths', Math.floor(profile.contributionMonths / 12) * 12 + value))}
              {government
                ? pensionNumeric('worker-monthlySalary', pensionText.amc, profile.monthlySalary, 0, undefined, 'any', value => update('monthlySalary', value), pensionText.amcHint)
                : pensionNumeric('worker-averageMonthlySalaryCredit', pensionText.amsc, profile.averageMonthlySalaryCredit, 0, 20_000, 'any', value => update('averageMonthlySalaryCredit', value), pensionText.amscHint)}
              {!government && profile.pensionType === 'disability_ppd' && pensionNumeric('worker-disabilityDurationMonths', pensionText.duration, profile.disabilityDurationMonths ?? 0, 1, 120, '1', value => update('disabilityDurationMonths', value), pensionText.ptdHint)}
            </div>
            {government && <p className="text-xs text-slate-600">{pensionText.gsisScopeNotice}</p>}
            <div className="border-t border-[#E2DFD6] pt-4">
              <h4 className="mb-3 text-sm font-bold text-slate-900">{pensionText.mp2Title}</h4>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <div><label htmlFor="worker-mp2ContributionMode" className={civicLabel}>{pensionText.mode}</label>
                  <select id="worker-mp2ContributionMode" autoComplete="off" className={control} value={profile.mp2ContributionMode ?? 'monthly'} onChange={event => update('mp2ContributionMode', event.target.value as WorkerProfileInput['mp2ContributionMode'])}>
                    <option value="monthly">{pensionText.monthlyMode}</option><option value="lump_sum">{pensionText.lumpMode}</option>
                  </select>
                </div>
                {profile.mp2ContributionMode === 'lump_sum'
                  ? pensionNumeric('worker-mp2OneTimeDeposit', pensionText.oneTimeAmount, profile.mp2OneTimeDeposit ?? 0, 500, undefined, '100', value => update('mp2OneTimeDeposit', value))
                  : pensionNumeric('worker-mp2MonthlyContribution', pensionText.monthlyAmount, profile.mp2MonthlyContribution ?? 500, 500, undefined, '100', value => update('mp2MonthlyContribution', value))}
                {pensionNumeric('worker-mp2DividendRatePercent', pensionText.rate, profile.mp2DividendRatePercent ?? 7, 0, 100, '0.1', value => update('mp2DividendRatePercent', value))}
                <div><label htmlFor="worker-mp2PayoutType" className={civicLabel}>{pensionText.payout}</label>
                  <select id="worker-mp2PayoutType" autoComplete="off" className={control} value={profile.mp2PayoutType ?? 'compounded'} onChange={event => update('mp2PayoutType', event.target.value as WorkerProfileInput['mp2PayoutType'])}>
                    <option value="compounded">{pensionText.compounded}</option><option value="annual">{pensionText.annual}</option>
                  </select>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-600">{pensionText.hint}</p>
            </div>
          </section>}
          {profile.scenario === 'loans' && <>
            <div className="grid sm:grid-cols-2 gap-4">
              {numeric('recentContributionMonths', government ? 'Posted GSIS premiums sa huling 6 months' : 'SSS contributions sa huling 12 months')}
              {numeric('pagibigOutstandingLoan', 'Pag-IBIG existing short-term balance (PHP)')}
              {numeric(government ? 'gsisOutstandingLoan' : 'sssOutstandingLoan', government ? 'Applicable prior loan balance / offset (PHP)' : 'SSS Salary Loan balance / offset (PHP)')}
              {!government && numeric('sssCalamityOutstandingLoan', 'SSS Calamity Loan balance / offset (PHP)')}
            </div>
            <details className="rounded-xl border border-[#E2DFD6] bg-white p-3">
              <summary className="min-h-[44px] cursor-pointer py-2 font-semibold text-slate-900 focus-ring">{local('I-edit ang eksaktong kaltas sa loan disclosure (Optional)', 'Edit exact deductions on the loan disclosure (Optional)', 'Usba ang eksaktong kaltas sa loan disclosure (Opsyonal)', 'Baliwan dagiti eksakto a kaltas iti loan disclosure (Opsyonal)')}</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {numeric('loanProratedDays', local('Araw ng paunang interes sa loan disclosure', 'Advance interest days on the loan disclosure', 'Mga adlaw sa advance interest sa loan disclosure', 'Dagiti aldaw ti advance interest iti loan disclosure'), local('Nakadepende ito sa aktuwal na petsa ng paglabas ng loan. Ilagay ang 0 kung hindi pa alam.', 'This depends on the actual loan release date. Enter 0 if unknown.', 'Nagdepende kini sa tinuod nga petsa sa pagpagawas sa loan. Ibutang ang 0 kon wala pa mahibaloi.', 'Daytoy ket nakadepende iti pudno a petsa ti panag-release ti loan. Isurat ti 0 no saan pay nga ammo.'), 62)}
                {government && <div><label htmlFor="worker-gsisAdvanceInsuranceMonths" className={civicLabel}>{local('Ilang buwan ang paunang kaltas sa GSIS loan insurance?', 'Months of advance GSIS loan insurance', 'Pila ka bulan ang paunang kaltas sa GSIS loan insurance?', 'Mano a bulan ti pauna a kaltas iti GSIS loan insurance?')}</label>
                  <select id="worker-gsisAdvanceInsuranceMonths" autoComplete="off" className={control} value={profile.gsisAdvanceInsuranceMonths ?? 1} onChange={e => update('gsisAdvanceInsuranceMonths', Number(e.target.value))}>
                    <option value="1">1 {local('buwan: loan bago o sa ika-23', 'month: loan on or before the 23rd', 'bulan: loan sa o sa wala pa ika-23', 'bulan: loan iti wenno sakbay ti ika-23')}</option>
                    <option value="2">2 {local('buwan: loan pagkatapos ng ika-23', 'months: loan after the 23rd', 'bulan: loan human sa ika-23', 'bulan: loan kalpasan ti ika-23')}</option>
                  </select>
                </div>}
              </div>
            </details>
            {check('employerRemittancesCurrent', 'Current ang remittances / membership coverage; walang final benefit o disqualification')}
            {check('hasPastDueLoan', 'May past-due loan')}
            {check('calamityDeclared', 'Nasa declared calamity area at bukas ang agency application window')}
            {!government && check('hadRecentCondonation', 'Renewal matapos ang penalty condonation sa huling 5 years')}
            {government && <div className="grid sm:grid-cols-2 gap-4">
              {numeric('gsisNetTakeHomePay', 'Net take-home pay bago bagong loan (PHP)')}
              {numeric('gsisLoanTermYears', 'Ilang taon babayaran ang GSIS Multi-Purpose Loan (MPL Flex)?', 'Automatic limit batay sa tenure / employment status.', 15)}
              {numeric('gsisEmergencyOutstanding', 'Emergency loan renewal offset (PHP)')}
              <div>{check('gsisPermanent', 'Permanent regular member')}{check('gsisEmergencyRenewal', 'Pinapayagan ang PHP 40,000 emergency renewal sa kasalukuyang announcement')}</div>
            </div>}
          </>}
          {['maternity', 'sickness'].includes(profile.scenario) && <>
            {!government && numeric('qualifyingBenefitContributions', local('Ilang buwan may SSS hulog bago ang 6-buwang panahon ng claim?', 'How many months had SSS contributions before the 6-month claim period?', 'Pila ka bulan adunay hulog sa SSS sa wala pa ang 6 ka bulan nga panahon sa claim?', 'Mano a bulan ti addaan kontribusion ti SSS sakbay ti 6 a bulan a panawen ti claim?'), local('Dapat may hindi bababa sa 3 buwan ng hulog sa 12 buwan bago magsimula ang panahong ito.', 'At least 3 contribution months are needed in the 12 months before this period.', 'Kinahanglan ang labing menos 3 ka bulan nga hulog sulod sa 12 ka bulan sa wala pa kini nga panahon.', 'Kasapulan ti saan a nababbaba ngem 3 a bulan a kontribusion iti 12 a bulan sakbay daytoy a panawen.'))}
            {profile.scenario === 'maternity' && <>
              <label htmlFor="worker-maternityType" className="block font-bold">Maternity leave category</label>
              <select id="worker-maternityType" autoComplete="off" value={profile.maternityType} onChange={e => update('maternityType', e.target.value as WorkerProfileInput['maternityType'])} className={control}>
                <option value="live_birth">Live birth: 105 days</option><option value="solo_parent">Qualified solo parent: 120 days</option><option value="miscarriage">{english ? 'Miscarriage, stillbirth, or Emergency Termination of Pregnancy (ETP): 60 days' : 'Nakunan, Stillbirth, o Emergency Termination of Pregnancy (Miscarriage / ETP): 60 days'}</option>
              </select>
              {check('employerDifferentialExempt', 'May valid DOLE-approved salary differential exemption ang employer')}
            </>}
            {profile.scenario === 'sickness' && <>
              {numeric('sicknessDays', local('Ilang araw ng sick leave ang inaprubahan?', 'How many sick leave days were approved?', 'Pila ka adlaw nga sick leave ang giaprobahan?', 'Mano nga aldaw ti sick leave ti naaprobaran?'), local('Tantiya hanggang 120 araw. Hihingi ng hiwalay na pagsusuri para sa extension hanggang 240.', 'Estimate up to 120 days. An extension up to 240 needs a separate agency review.', 'Banabana hangtod 120 ka adlaw. Kinahanglan og lahi nga pagsusi alang sa extension hangtod 240.', 'Pagarup agingga 120 nga aldaw. Kasapulan ti naisina a panangamiris para iti extension agingga 240.'), 120)}
              {check('sickLeaveExhausted', local('Naubos na ang bayad na sick leave', 'Paid sick leave has run out', 'Nahurot na ang bayad nga sick leave', 'Naibusenen ti bayad a sick leave'))}
              {check('isWorkRelated', local('Dahil sa trabaho ang sakit o aksidente at may EC coverage', 'Illness or injury was work-related and has EC coverage', 'Tungod sa trabaho ang sakit o kadaot ug adunay EC coverage', 'Gapu iti trabaho ti sakit wenno aksidente ken addaan EC coverage'))}
              {check('hasPermanentDisability', local('Aprubado ng ahensiya ang permanenteng kapansanan para sa caregiver allowance', 'Agency approved permanent disability for a caregiver allowance', 'Gi-aprobahan sa ahensiya ang permanenteng disability para sa caregiver allowance', 'Naaprobaran ti ahensia ti permanente a kapansanan para iti caregiver allowance'))}
              {numeric('approvedECMedicalReimbursement', local('Aprubadong bayad-pabalik sa gastusing medikal mula sa EC (PHP)', 'Approved EC medical expense reimbursement (PHP)', 'Gi-aprobahang bayad balik sa medical nga gasto gikan sa EC (PHP)', 'Naaprobaran a panagsubli ti gastos iti agas manipud EC (PHP)'), local('Ilagay ang 0 kung wala pang aprubadong halaga. Hindi ito ang kabuuang bill sa ospital.', 'Enter 0 if no amount has been approved. This is not the total hospital bill.', 'Ibutang ang 0 kon wala pay giaprobahang kantidad. Dili kini ang kinatibuk-ang bill sa ospital.', 'Isurat ti 0 no awan pay ti naaprobaran a gatad. Saan daytoy a kabuklan a bill ti ospital.'))}
            </>}
          </>}
          {profile.scenario === 'unemployment' && <>
              {numeric('unemploymentAverageMonthlySalaryCredit', local('Karaniwang salary bracket ng SSS para sa nawalang trabaho (PHP)', 'Average SSS salary bracket for job loss (PHP)', 'Kasagarang salary bracket sa SSS para sa pagkawala sa trabaho (PHP)', 'Average a salary bracket ti SSS para iti napukaw a trabaho (PHP)'), local('Kunin ang average sa 12 buwang hulog bago ang 6-buwang panahon ng claim. Hindi ito ang pinakahuling bracket para sa loan.', 'Use the average of 12 contribution months before the 6-month claim period, not the latest loan bracket.', 'Gamita ang average sa 12 ka bulan nga hulog sa wala pa ang 6 ka bulan nga panahon sa claim, dili ang pinakabag-ong loan bracket.', 'Usaren ti average dagiti 12 a bulan a kontribusion sakbay ti 6 a bulan a panawen ti claim, saan a ti maudi a bracket ti loan.'), 20000)}
            {numeric('unemploymentRecentContributions', 'SSS contributions sa huling 18 months', 'Minimum 12 sa 18 months bago separation.')}
            {check('involuntarilySeparated', 'Involuntary separation, hindi resignation / just-cause dismissal')}
            {check('unemploymentClaimWithinThreeYears', 'Nakakuha ng unemployment benefit sa nakaraang 3 years')}
          </>}
          {profile.scenario === 'funeral' && <>
            {numeric('funeralAverageMonthlySalaryCredit', local('Salary bracket ng SSS para sa funeral claim (PHP)', 'SSS salary bracket for a funeral claim (PHP)', 'Salary bracket sa SSS para sa funeral claim (PHP)', 'Salary bracket ti SSS para iti funeral claim (PHP)'), local('Ihambing ang average ng huling 60 buwan at ng buong hulog bago ang 6-buwang panahon ng claim.', 'Compare the average for the last 60 months with the lifetime average before the 6-month claim period.', 'Itandi ang average sa miaging 60 ka bulan ug sa kinatibuk-ang hulog sa wala pa ang 6 ka bulan nga panahon sa claim.', 'Ikompara ti average dagiti 60 a bulan ken ti intero a kontribusion sakbay ti 6 a bulan a panawen ti claim.'), 20000)}
            <div><label htmlFor="worker-contingencyDate" className="block font-bold mb-1.5">{local('Petsa ng pangyayari o funeral claim', 'Date of the event or funeral claim', 'Petsa sa hitabo o funeral claim', 'Petsa ti pasamak wenno funeral claim')}</label>
              <input id="worker-contingencyDate" type="date" autoComplete="off" value={profile.contingencyDate} onChange={e => update('contingencyDate', e.target.value)} className={control} /></div>
            {check('isWorkRelated', 'Work-related ang pagkamatay at may SSS Employees’ Compensation (EC) coverage')}
          </>}
          {profile.sector === 'ofw' && ['sickness', 'funeral'].includes(profile.scenario) && <>
            {check('ofwSeaBased', 'Sea-based OFW / seafarer na may SSS Employees’ Compensation (EC) coverage')}
            <p className="text-sm text-slate-600">{english ? 'Sea-based Overseas Filipino Workers (OFWs) have compulsory SSS Employees’ Compensation (EC) coverage. Land-based workers should confirm coverage with SSS and ask the Overseas Workers Welfare Administration (OWWA), Department of Migrant Workers (DMW) AKSYON Center, or foreign employer insurer about separate support.' : 'May sapilitang SSS Employees’ Compensation (EC) coverage ang sea-based Overseas Filipino Workers (OFWs). Kumpirmahin ng land-based workers ang coverage sa SSS at magtanong sa Overseas Workers Welfare Administration (OWWA), AKSYON Center ng Department of Migrant Workers (DMW), o insurer ng foreign employer tungkol sa hiwalay na tulong.'}</p>
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
          {profile.scenario === 'wages' && <p className="text-slate-700">{english ? 'Prepare employment dates, employer address, payslips and itemized unpaid wages. The DOLE Single Entry Approach (SEnA) is free; call ' : 'Ihanda ang employment dates, employer address, payslips at itemized unpaid wages. Libre ang Single Entry Approach (SEnA) ng DOLE; tumawag sa '}<span className="tabular-nums">1349</span>{english ? '. The worksheet is in the printable packet.' : '. Nasa printable packet ang worksheet.'}</p>}
          {profile.scenario === 'wages' && <>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="worker-payrollSchedule" className={civicLabel}>{english ? 'Payroll schedule / divisor' : 'Iskedyul ng payroll / divisor'}</label>
                <select id="worker-payrollSchedule" autoComplete="off" className={control} value={payrollSchedule}
                  onChange={event => update('payrollSchedule', event.target.value as WorkerProfileInput['payrollSchedule'])}>
                  <option value="six_day_week">{english ? '6-day week: 26 days/month (factor 313)' : '6-araw na linggo: 26 araw/buwan (factor 313)'}</option>
                  <option value="five_day_week">{english ? '5-day week: 21.75 days/month (factor 261)' : '5-araw na linggo: 21.75 araw/buwan (factor 261)'}</option>
                  <option value="monthly_paid">{english ? 'Monthly-paid: 30.42 days/month (factor 365)' : 'Monthly-paid: 30.42 araw/buwan (factor 365)'}</option>
                </select>
                <p className="mt-1 text-xs text-slate-600">{english ? 'Used to convert between monthly and daily pay for this estimate.' : 'Ginagamit para magpalit sa pagitan ng buwanan at arawang sahod sa tantiyang ito.'}</p>
              </div>
              {numeric('regionalDailyWage', english ? 'Daily wage used for this estimate (PHP)' : 'Arawang sahod para sa tantiya (PHP)', english ? 'For daily-paid workers, enter the actual daily basic wage; the regional minimum may be prefilled.' : 'Para sa daily-paid worker, ilagay ang aktwal na arawang basic wage; maaaring naka-fill ang regional minimum wage.')}
              {wageNumeric('unpaidDays', 'Araw na hindi nabayaran (Unpaid days worked)', english ? 'Enter regular workdays with unpaid basic wages.' : 'Ilagay ang bilang ng araw na nagtrabaho ngunit hindi nabayaran ang regular na sahod.')}
              {wageNumeric('monthsWorkedInCurrentYear', 'Buwan na naipasok ngayong taon para sa 13th Month Pay', english ? '0 to 12 months in the current calendar year under PD 851.' : '0 hanggang 12 buwan sa kasalukuyang taon sa ilalim ng PD 851.', 12, '1')}
              {wageNumeric('unusedServiceIncentiveLeaveDays', 'Hindi nagamit na Service Incentive Leave (SIL) days', english ? '0 to 5 unused days under Labor Code Art. 95; eligibility depends on coverage and service.' : '0 hanggang 5 araw sa ilalim ng Art. 95; nakadepende ang eligibility sa coverage at haba ng serbisyo.', 5, '1')}
              <div>
                <label htmlFor="worker-separationCause" className={civicLabel}>{local('Bakit natapos ang trabaho?', 'Why did the job end?', 'Ngano nahuman ang trabaho?', 'Apay a nagpatingga ti trabaho?')}</label>
                <select id="worker-separationCause" autoComplete="off" className={control} value={profile.separationCause ?? 'none'} onChange={event => update('separationCause', event.target.value as WorkerProfileInput['separationCause'])}>
                  <option value="none">{local('Walang claim / Kusang nag-resign', 'No claim / I resigned', 'Walay claim / Boluntaryong miundang', 'Awan ti claim / Nagresign a bukod')}</option>
                  <option value="redundancy">{local('Inalis ang posisyon o pinalitan ng makina (1 buwang sahod bawat taon)', 'Position removed or replaced by equipment (1 month pay per year)', 'Gikuha ang posisyon o gipulihan og makina (1 bulan nga sweldo matag tuig)', 'Naikkat ti posision wenno nasukat ti makina (1 bulan a sueldo tunggal tawen)')}</option>
                  <option value="retrenchment_closure">{local('Nagbawas ng tao dahil sa pagkalugi, pagsasara, o sakit na saklaw ng batas (kalahating buwang sahod bawat taon)', 'Staff cut due to losses, closure, or a qualifying illness (half a month pay per year)', 'Gipamenos ang trabahante tungod sa kapildihan, pagsira, o sakit nga sakop sa balaod (tunga sa bulan nga sweldo matag tuig)', 'Pinaspasan dagiti trabahante gapu iti pannakalugi, panagsara, wenno sakit a saklaw ti linteg (kagudua a bulan a sueldo tunggal tawen)')}</option>
                </select>
                <p className="mt-1 text-xs text-slate-600">{local('Tantiya lamang ito. Nakadepende ang separation pay sa dahilan ng pagtigil ng trabaho at payroll records; magtanong sa DOLE.', 'Estimate only. Separation pay depends on why the job ended and payroll records; confirm with DOLE.', 'Banabana lamang. Magdepende ang separation pay sa hinungdan sa pagtapos sa trabaho ug payroll records; pangutana sa DOLE.', 'Pagarup laeng. Ti separation pay ket naibatay iti rason ti panagpatingga ti trabaho ken payroll records; damagen iti DOLE.')}</p>
              </div>
              {profile.separationCause && profile.separationCause !== 'none' && wageNumeric('yearsOfService', 'Haba ng serbisyo (Years of service)', english ? 'Enter completed years and any fraction; at least 6 months is counted as one year.' : 'Ilagay ang taon at bahagi nito; binibilang na isang taon ang hindi bababa sa 6 na buwan.')}
              {wageNumeric('unpaidOvertimeHours', 'Unpaid Overtime (oras)', english ? 'Optional. Estimated at 125% of hourly rate for regular-day overtime.' : 'Opsyonal. Tinataya sa 125% ng hourly rate para sa overtime sa regular na araw.')}
              {wageNumeric('unpaidHolidayDays', 'Unpaid Regular Holiday (araw)', english ? 'Optional. Estimated at 100% of daily wage for unpaid regular-holiday pay.' : 'Opsyonal. Tinataya sa 100% ng daily wage para sa hindi nabayarang regular holiday.')}
            </div>
            <div aria-live="polite" aria-atomic="true" className="min-w-0 space-y-3 rounded-xl border border-[#E2DFD6] bg-[#FAF9F5] p-4">
              <h3 className="font-bold">{english ? 'Live SEnA claim estimate' : 'Live na tantiya ng SEnA claim'}</h3>
              {wageClaimsTable()}
              <p className="text-xs text-slate-600">{english ? 'Estimate only. Actual 13th-month pay uses basic salary earned in the year; coverage, work schedule, deductions and records affect final claims.' : 'Tantiya lamang. Ang aktwal na 13th-month pay ay base sa basic salary na kinita sa taon; nakaaapekto ang coverage, iskedyul, kaltas at records sa pinal na claim.'}</p>
            </div>
          </>}
          {profile.scenario !== 'wages' && <LiveReliefBreakdownBox title={english ? 'Live benefit / loan preview' : 'Live na benefit / loan preview'} rows={previewRows} note={profile.scenario === 'loans' && result.loans.length === 0 ? (english ? 'No loan illustration for the current record. Confirm contributions and remittances.' : 'Walang loan illustration sa record ngayon. Kumpirmahin ang hulog at remittances.') : (english ? 'Estimates only. Separate loans and grants are not added into one entitlement; agencies verify records and approval.' : 'Tantiya lamang. Hiwalay ang mga loan at grant; ahensya ang magkukumpirma ng records at approval.')} />}
        </>}
        {step === 3 && <>
          <QuickStartActionCard pillar="worker" language={language} scenario={profile.scenario} sector={profile.sector} />
          <PlainLanguageGlossaryCard pillar="worker" language={language} />
          {ofwCase && <OFWCaseTrackerCard record={ofwCase} onChange={updateOFWCase} language={language} />}
          {ofwCaseStorageError && (profile.sector === 'ofw' || ofwCase) && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-slate-800">{english ? 'The OFW case could not be loaded or saved in this browser. Check local storage before leaving this page.' : 'Hindi na-load o na-save ang OFW case sa browser na ito. Suriin ang local storage bago umalis sa page.'}</p>}
          <section className={civicCard}>
            {stepHeader}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{english ? 'Your guide is ready' : 'Handa na ang inyong gabay'}</span>
            <p className="text-sm leading-relaxed text-slate-600">{english ? 'Estimates only; agencies confirm records, eligibility and approval. Loans, grants and monthly allowances remain separate.' : 'Tantiya lamang; ahensya ang magkukumpirma ng records at approval. Hiwalay ang loans, grants at monthly allowance.'}</p>
            <p className="text-sm font-semibold">{profile.scenario === 'pension_savings' ? pensionText.title : labelText(scenarios.find(scenario => scenario.id === profile.scenario)?.title ?? '')}</p>
            <p className="text-sm tabular-nums">{result.matchedPrograms.length} {english ? 'programs to ask about' : 'programang maaaring itanong'}</p>
          </section>
          {profile.scenario === 'pension_savings' && result.pension && result.mp2 && <section role="region" aria-labelledby="worker-pension-result" className={`${civicCard} min-w-0 space-y-4`}>
            <h3 id="worker-pension-result" className="text-lg font-bold text-slate-900">{pensionText.result}</h3>
            <p role="status" aria-atomic="true" className="sr-only">{pensionText.monthlyPension}: {peso(result.pension.totalMonthlyPension)}. {pensionText.maturity}: {peso(result.mp2.totalValueAtMaturity)}.</p>
            {government && !result.pension.eligible && <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">
              <span className="inline-flex rounded-full border border-amber-500 bg-white px-3 py-1.5 font-bold">{pensionText.gsisIneligibleTitle}</span>
              <p className="mt-2 font-semibold">{pensionText.gsisIneligibleMessage}</p>
            </div>}
            <p className="text-sm text-slate-600">{pensionText.pensionNote}</p>
            <details className="rounded-lg border border-[#E2DFD6] p-3 text-xs text-slate-600">
              <summary className="min-h-[44px] cursor-pointer py-3 font-semibold focus-ring">{pensionText.calculationBasis}</summary>
              <p>{localizedPensionExplanation(result.pension.formulaUsed, language)}</p>
            </details>
            <dl className="grid min-w-0 gap-x-4 gap-y-2 rounded-xl border border-[#E2DFD6] bg-[#FAF9F5] p-4 sm:grid-cols-2">
              <dt className="text-sm font-semibold">{pensionText.base}</dt><dd className="text-sm font-bold tabular-nums sm:text-right">{peso(result.pension.baseMonthlyPension)}</dd>
              <dt className="text-sm font-semibold">{pensionText.additional}</dt><dd className="text-sm tabular-nums sm:text-right">{peso(result.pension.additionalBenefit)}</dd>
              {result.pension.supplementalAllowance > 0 && <><dt className="text-sm font-semibold">{pensionText.supplemental}</dt><dd className="text-sm tabular-nums sm:text-right">{peso(result.pension.supplementalAllowance)}</dd></>}
              <dt className="text-sm font-bold">{pensionText.monthlyPension}</dt><dd className="text-base font-extrabold tabular-nums text-blue-900 sm:text-right">{peso(result.pension.totalMonthlyPension)}</dd>
              {result.pension.thirteenthMonthPension > 0 && <><dt className="text-sm font-semibold">{pensionText.thirteenth}</dt><dd className="text-sm tabular-nums sm:text-right">{peso(result.pension.thirteenthMonthPension)}</dd></>}
              {result.pension.lumpSumEstimate > 0 && <><dt className="text-sm font-semibold">{pensionText.lumpEstimate}</dt><dd className="text-sm font-bold tabular-nums sm:text-right">{peso(result.pension.lumpSumEstimate)}</dd></>}
            </dl>
            {!government && <div className="min-w-0 rounded-xl border border-[#E2DFD6] p-4">
              <h4 className="mb-2 text-sm font-bold">{pensionText.formulaComparison}</h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm tabular-nums">
                <dt>{pensionText.formula1}</dt><dd className="text-right">{peso(result.pension.formulaComparison.formula1)}</dd>
                <dt>{pensionText.formula2}</dt><dd className="text-right">{peso(result.pension.formulaComparison.formula2)}</dd>
                <dt>{pensionText.minimum}</dt><dd className="text-right">{peso(result.pension.formulaComparison.guaranteedMin)}</dd>
              </dl>
            </div>}
            {government && <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-[#E2DFD6] p-4">
                <h4 className="text-sm font-bold">{pensionText.gsisFiveYear}</h4>
                <p className="mt-2 text-lg font-extrabold tabular-nums text-blue-900">{peso(result.pension.gsisFiveYearLumpSum)}</p>
                <p className="text-xs text-slate-600">{pensionText.gsisFiveYearTiming}</p>
              </article>
              <article className="rounded-xl border border-[#E2DFD6] p-4">
                <h4 className="text-sm font-bold">{pensionText.gsisCash}</h4>
                <p className="mt-2 text-lg font-extrabold tabular-nums text-blue-900">{peso(result.pension.gsisCashPayment)}</p>
                <p className="text-xs text-slate-600">{pensionText.gsisCashTiming}</p>
              </article>
            </div>}
            <div className="min-w-0 space-y-3">
              <div>
                <h4 className="text-base font-bold">{pensionText.mp2Title}</h4>
                <p className="text-sm font-semibold">{pensionText.payout}: {result.mp2.payoutType === 'annual' ? pensionText.annual : pensionText.compounded}</p>
                <p className="text-sm text-slate-600">{pensionText.hint}</p>
                <p className="text-xs text-slate-600">{pensionText.mp2Method}</p>
              </div>
              <div tabIndex={0} role="region" aria-label={pensionText.maturity} className="min-w-0 overflow-x-auto rounded-lg border border-[#E2DFD6] focus-ring">
                <table className="w-full min-w-[640px] text-xs tabular-nums">
                  <caption className="sr-only">{pensionText.maturity}</caption>
                  <thead className="bg-[#FAF9F5] text-left"><tr>
                    <th scope="col" className="p-2">{pensionText.tableYear}</th><th scope="col" className="p-2 text-right">{pensionText.starting}</th>
                    <th scope="col" className="p-2 text-right">{pensionText.contributions}</th><th scope="col" className="p-2 text-right">{pensionText.dividend}</th>
                    <th scope="col" className="p-2 text-right">{pensionText.ending}</th><th scope="col" className="p-2 text-right">{pensionText.annualPayout}</th>
                  </tr></thead>
                  <tbody>{result.mp2.yearlyBreakdown.map(row => <tr key={row.year} className="border-t border-[#E2DFD6]">
                    <th scope="row" className="p-2 text-left">{row.year}</th><td className="p-2 text-right">{peso(row.startingBalance)}</td>
                    <td className="p-2 text-right">{peso(row.contributions)}</td><td className="p-2 text-right">{peso(row.dividendEarned)}</td>
                    <td className="p-2 text-right">{peso(row.endingBalance)}</td><td className="p-2 text-right">{peso(row.annualPayout)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm tabular-nums">
                <dt className="font-semibold">{pensionText.principal}</dt><dd className="text-right">{peso(result.mp2.totalPrincipal)}</dd>
                <dt className="font-semibold">{pensionText.totalDividends}</dt><dd className="text-right">{peso(result.mp2.totalDividends)}</dd>
                <dt className="font-bold">{pensionText.maturity}</dt><dd className="text-right font-bold">{peso(result.mp2.totalValueAtMaturity)}</dd>
              </dl>
            </div>
            <p className="text-xs text-slate-600">{pensionText.estimateOnly}</p>
          </section>}
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
              <p>Employees’ Compensation (EC) temporary total disability (TTD): <strong>{peso(result.sickness.ecBenefit)}</strong> ({peso(result.sickness.ecDaily)} / day)</p>
              <p>Approved Employees’ Compensation (EC) medical reimbursement: {peso(result.sickness.ecMedicalReimbursement)}</p>
              <p>Total separate claims: <strong data-testid="worker-sickness-total">{peso(result.sickness.combinedBenefit)}</strong></p>
              <p>Permanent disability carer allowance: {peso(result.sickness.ecCarerMonthly)} / month (separate from one-time total)</p>
            </>}
            {profile.scenario === 'unemployment' && <p>SSS unemployment: <strong data-testid="worker-unemployment-total">{peso(result.unemploymentBenefit)}</strong></p>}
            {profile.scenario === 'funeral' && <><p>Regular funeral: {peso(result.funeral.regularBenefit)}</p><p>Separate Employees’ Compensation (EC) funeral benefit: {peso(result.funeral.ecBenefit)}</p><p>Total: <strong>{peso(result.funeral.combinedBenefit)}</strong></p><p className="text-sm">Survivor pension requires separate agency assessment; hindi kasama sa funeral total.</p></>}
            {['livelihood', 'unemployment'].includes(profile.scenario) && <><p>TUPAD work-pay illustration: {peso(result.livelihood.tupadEstimate)}</p><p>OWWA BPBH candidate grant: {peso(result.livelihood.bpbhGrant)}</p><p className="text-sm">Hindi automatic grant o job placement. DILP tools / materials require approved proposal.</p></>}
            {profile.scenario === 'wages' && <div className="min-w-0 space-y-3">
              <p>{english ? `Estimated SEnA claim: ${peso(result.wageClaims.totalClaim)}. Review each item and confirm it against your records.` : `Tinatayang SEnA claim: ${peso(result.wageClaims.totalClaim)}. Suriin ang bawat item at ikumpara sa iyong records.`}</p>
              {wageClaimsTable()}
              <p className="text-xs text-slate-600">{local('Panghanda lang ang mga halaga. Hindi ito pinal na pasya ng ahensya. Ipa-check sa DOLE ang separation pay at sa employer ang 13th-month at leave pay.', 'Preparation estimates only, not an agency decision. Ask DOLE to check separation pay and your employer to confirm 13th-month and leave pay.', 'Banabana lamang kini para mangandam, dili pinal nga desisyon sa ahensya. Pangutana sa DOLE bahin sa separation pay ug sa employer bahin sa 13th-month ug leave pay.', 'Pagarup laeng dagitoy a gatad para iti panagsagana, saan a pinal a pangngeddeng ti ahensia. Damagen iti DOLE ti separation pay ken iti employer ti 13th-month ken leave pay.')}</p>
              <button type="button" className={civicPrimary} onClick={() => {
                onWorksheetChange({ ...worksheet, worksheetUnpaidDetails: result.wageClaims.formattedSummary });
                onPrint();
              }}>{english ? 'Transfer estimate to SEnA Worksheet' : 'Ilipat ang Kuwenta sa SEnA Worksheet'}</button>
            </div>}
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
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <CrossPillarBridgeCard pillar="medical" title={english ? 'Hospital Guarantee Letter while your SSS or EC claim is pending' : 'Guarantee Letter sa ospital habang naghihintay ng SSS o EC claim'}
              description={english ? 'Review Malasakit Centers and PCSO MAP for possible hospital assistance. Ask the hospital social service desk about current requirements.' : 'Suriin ang Malasakit Centers at PCSO MAP para sa posibleng tulong sa ospital. Itanong sa Medical Social Service ang kasalukuyang requirements.'}
              benefit={english ? 'Hospital assistance is assessed separately from worker claims' : 'Hiwalay ang assessment ng tulong sa ospital at worker claims'}
              href="/" context={sharedContext} language={language} />
            <CrossPillarBridgeCard pillar="education" title={english ? 'Education support for children in school' : 'Tulong-edukasyon para sa mga anak na nag-aaral'}
              description={english ? 'Explore CHED / UniFAST TES, Free Higher Education, or OWWA EDSP, subject to program rules and available slots.' : 'Tingnan ang CHED / UniFAST TES, Free Higher Education, o OWWA EDSP ayon sa requirements at available slots.'}
              benefit={english ? 'Tuition support or scholarship; eligibility and funding apply' : 'Tulong-tuition o scholarship; may eligibility at funding requirements'}
              href="/edukasyon?bridge=1" context={sharedContext} language={language} />
          </div>
        </>}
  </>;
}
