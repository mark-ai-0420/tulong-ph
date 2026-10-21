'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CivicPageShell } from '@/components/shared/CivicPageShell';
import { CivicFooter } from '@/components/shared/CivicFooter';
import { PisonetPrivacyDialog } from '@/components/shared/PisonetPrivacyDialog';
import { CivicStatusBanner } from '@/components/shared/CivicStatusBanner';
import { CivicHeroBanner } from '@/components/shared/CivicHeroBanner';
import { Navbar } from '@/components/Navbar';
import { WorkerWizard } from '@/components/worker/WorkerWizard';
import { WorkerPrintView } from '@/components/worker/WorkerPrintView';
import { WorkerDirectoryView } from '@/components/worker/WorkerDirectoryView';
import { defaultWorkerProfile } from '@/lib/workerBenefitsCalculator';
import {
  clearAllUserData,
  defaultWorkerWorksheetFields,
  getWorkerBridgeScenario,
  getWipeGeneration,
  loadSharedFamilyContext,
  loadWorkerSession,
  loadDocuments,
  mergeWorkerSharedContext,
  normalizeWorkerWorksheetFields,
  saveDocuments,
  saveWorkerSession,
  type WorkerWorksheetFields,
} from '@/lib/storage';
import type { StoredDocument } from '@/types/assistance';
import type { WorkerProfileInput } from '@/types/worker';
import { getNextLanguage, isLanguage } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

type LocatedWorkerProfile = WorkerProfileInput & { province?: string; cityMunicipality?: string; barangay?: string; region?: string; hasDisabilityOrDependent?: boolean };

export default function WorkerPage() {
  const [profile, setProfile] = useState<LocatedWorkerProfile>({ ...defaultWorkerProfile, region: '', hasDisabilityOrDependent: false });
  const [worksheet, setWorksheet] = useState<WorkerWorksheetFields>(defaultWorkerWorksheetFields);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [tab, setTab] = useState('triage');
  const [language, setLanguage] = useState<Language>('taglish');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [writesDisabled, setWritesDisabled] = useState(false);
  const manualWipe = useRef(false);
  const [privacyToast, setPrivacyToast] = useState(false);
  const [bridgeNotice, setBridgeNotice] = useState(false);
  const [bridgeSource, setBridgeSource] = useState('medical');
  useEffect(() => {
    const syncLanguage = () => {
      try {
        const savedLanguage = localStorage.getItem('tulong_lang');
        setLanguage(isLanguage(savedLanguage) ? savedLanguage : 'taglish');
      }
      catch { setLanguage('taglish'); }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'tulong_lang' || event.key === null) syncLanguage();
    };
    syncLanguage();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    const reset = () => {
      setProfile({ ...defaultWorkerProfile, region: '', hasDisabilityOrDependent: false });
      setWorksheet(defaultWorkerWorksheetFields);
      setDocuments([]);
      setLanguage('taglish');
      setBridgeNotice(false);
      setWritesDisabled(true);
    };
    window.addEventListener('tulongph-data-cleared', reset);
    return () => window.removeEventListener('tulongph-data-cleared', reset);
  }, []);
  useEffect(() => {
    const pauseWrites = () => setWritesDisabled(true);
    const resumeWrites = () => setWritesDisabled(false);
    const reloadAfterRestore = () => window.location.reload();
    window.addEventListener('tulongph-backup-restore-started', pauseWrites);
    window.addEventListener('tulongph-backup-restore-failed', resumeWrites);
    window.addEventListener('tulongph-data-restored', reloadAfterRestore);
    return () => {
      window.removeEventListener('tulongph-backup-restore-started', pauseWrites);
      window.removeEventListener('tulongph-backup-restore-failed', resumeWrites);
      window.removeEventListener('tulongph-data-restored', reloadAfterRestore);
    };
  }, []);
  useEffect(() => {
    if (window.location.hash !== '#privacy-cleared') return;
    const timer = setTimeout(() => {
      setPrivacyToast(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }, 0);
    const dismiss = setTimeout(() => setPrivacyToast(false), 5000);
    return () => { clearTimeout(timer); clearTimeout(dismiss); };
  }, []);

  useEffect(() => {
    let active = true;
    const generation = getWipeGeneration();
    const bridgeRequested = new URLSearchParams(window.location.search).get('bridge') === '1';
    const queryScenario = getWorkerBridgeScenario(window.location.search);
    Promise.all([
      loadWorkerSession().catch(() => { throw new Error('worker-session'); }),
      loadSharedFamilyContext().catch(() => null),
      loadDocuments().catch(() => {
        if (active) setError('Hindi mabasa ang saved documents. Maaari kang magpatuloy; maaaring i-upload muli ang mga ito.');
        return [];
      }),
    ]).then(([saved, shared, savedDocuments]) => {
      if (!active || getWipeGeneration() !== generation) return;
      setDocuments(savedDocuments);
      let clean: LocatedWorkerProfile = { ...defaultWorkerProfile, region: '', hasDisabilityOrDependent: false };
      if (saved && typeof saved === 'object') {
        for (const key of Object.keys(clean) as (keyof WorkerProfileInput)[]) {
          const value = saved[key];
          if (typeof value === typeof clean[key] && (typeof value !== 'number' || Number.isFinite(value) && value >= 0)) {
            Object.assign(clean, { [key]: value });
          }
        }
        const enums = {
          sector: ['private', 'government', 'self_employed', 'ofw', 'displaced'],
          scenario: ['loans', 'maternity', 'sickness', 'unemployment', 'wages', 'livelihood', 'funeral', 'pension_savings'],
          payrollSchedule: ['six_day_week', 'five_day_week', 'monthly_paid'],
          maternityType: ['live_birth', 'solo_parent', 'miscarriage'],
          owwaMembership: ['active', 'inactive_once', 'inactive_multiple', 'none'],
        };
        for (const key of Object.keys(enums) as (keyof typeof enums)[]) {
          if (!enums[key].includes(clean[key])) Object.assign(clean, { [key]: defaultWorkerProfile[key] });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.contingencyDate)) clean.contingencyDate = defaultWorkerProfile.contingencyDate;
        const savedLocation = saved as WorkerProfileInput & Record<string, unknown>;
        for (const key of ['province', 'cityMunicipality', 'barangay', 'region'] as const) {
          if (typeof savedLocation[key] === 'string') clean[key] = savedLocation[key].slice(0, 150);
        }
        if (typeof saved.hasDisabilityOrDependent === 'boolean') clean.hasDisabilityOrDependent = saved.hasDisabilityOrDependent;
        setWorksheet(normalizeWorkerWorksheetFields(saved));
      } else {
        setWorksheet(defaultWorkerWorksheetFields);
      }
      if (bridgeRequested || shared) {
        if (shared) {
          clean = mergeWorkerSharedContext(clean, shared);
          setBridgeSource(shared.sourcePillar ?? 'medical');
          setBridgeNotice(Boolean(shared.province || shared.cityMunicipality || shared.barangay || shared.region || shared.locationTier || shared.regionalDailyWage !== undefined || shared.monthlyIncome !== undefined || shared.is4Ps || shared.isPWD || shared.isOFW || shared.isSoloParent || shared.isSeniorCitizen));
        }
      }
      if (queryScenario) clean.scenario = queryScenario;
      setProfile(clean);
      if (shared || queryScenario) {
        void saveWorkerSession({ ...clean, ...normalizeWorkerWorksheetFields(saved) }).catch(() => setError('Hindi na-save sa device ang family details. Maaari ka pa ring magpatuloy at mag-print.'));
      }
    }).catch(() => { if (active && getWipeGeneration() === generation) setError('Hindi mabuksan ang local save. Maaari pa ring magkompyut; i-print bago umalis.'); })
      .finally(() => { if (active && getWipeGeneration() === generation) setLoaded(true); });
    return () => { active = false; };
  }, []);
  function update(next: LocatedWorkerProfile) {
    if (!loaded || writesDisabled || manualWipe.current) return;
    const updated = { ...profile, ...next };
    setProfile(updated);
    void saveWorkerSession({ ...updated, ...worksheet }).catch(() => setError('Hindi na-save sa device. I-print ang worksheet bago umalis.'));
  }
  function updateWorksheet(next: WorkerWorksheetFields) {
    if (!loaded || writesDisabled || manualWipe.current) return;
    const safe = normalizeWorkerWorksheetFields(next);
    setWorksheet(safe);
    void saveWorkerSession({ ...profile, ...safe }).catch(() => setError('Hindi na-save sa device. I-print ang worksheet bago umalis.'));
  }
  function updateDocuments(next: StoredDocument[]) {
    if (!loaded || writesDisabled || manualWipe.current) return;
    setDocuments(next);
    void saveDocuments(next).catch(() => setError('Hindi na-save sa device ang mga dokumento. Panatilihing bukas ang page o i-download ang mga file.'));
  }
  async function wipe() {
    if (manualWipe.current) return;
    manualWipe.current = true;
    setWiping(true); setWipeError(''); setWritesDisabled(true);
    setDocuments([]);
    setProfile({ ...defaultWorkerProfile, region: '', hasDisabilityOrDependent: false });
    setWorksheet(defaultWorkerWorksheetFields);
    setLanguage('taglish');
    setTab('triage');
    try { await clearAllUserData(); }
    catch { manualWipe.current = false; setWiping(false); setWipeError(language === 'taglish' ? 'Hindi kumpleto ang pagbura. Subukan muli; huwag iwan ang shared computer habang may saved data.' : 'Clearing is incomplete. Retry before leaving this shared computer.'); }
  }
  return <CivicPageShell className="worker-page" navigation={
    <Navbar currentTab={tab} onTabChange={setTab} language={language} onToggleLanguage={() => {
      const next = getNextLanguage(language);
      setLanguage(next);
      localStorage.setItem('tulong_lang', next);
    }} readyDocCount={documents.filter((document) => document.isCompliantUnder2MB).length} onOpenPrivacyModal={() => setPrivacyOpen(true)} isManualWipePending={() => manualWipe.current} />
  } footer={<CivicFooter language={language} onTabChange={setTab} onOpenPrivacyModal={() => setPrivacyOpen(true)} disclaimer={language === 'taglish' ? 'Disclaimer: Ang TulongPH ay isang independiyenteng civic utility at hindi ahensya ng gobyerno. Gabay lamang ang benefit, loan at livelihood estimates; ang kaukulang ahensya at employer ang nagpapatunay ng eligibility, records at final amount alinsunod sa kanilang opisyal na proseso.' : 'Disclaimer: TulongPH is an independent civic utility and not a government agency. Benefit, loan and livelihood estimates are guidance; the relevant agencies and employers confirm eligibility, records and final amounts through their official processes.'} />}
    overlays={<PisonetPrivacyDialog open={privacyOpen} busy={wiping} cancelDisabled={writesDisabled} error={wipeError} language={language} titleId="worker-wipe-title" descriptionId="worker-wipe-desc" confirmAriaLabel={language === 'taglish' ? 'Oo, Burahin Lahat' : undefined} onCancel={() => setPrivacyOpen(false)} onConfirm={wipe} />}>
    {privacyToast && <CivicStatusBanner language={language} onDismiss={() => setPrivacyToast(false)} />}
    {bridgeNotice && <div role="status" className="mb-4 flex min-w-0 flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 break-words">{language === 'taglish' ? `Na-prefill ang lokasyon at sektor ng iyong pamilya mula sa ${bridgeSource === 'medical' ? 'Ospital Triage' : bridgeSource === 'education' ? 'Edukasyon at Scholarship' : 'Manggagawa at Benepisyo'}. Nasa device lang ang shared context.` : `Your family location and sector details were prefilled from ${bridgeSource === 'medical' ? 'Hospital Triage' : bridgeSource === 'education' ? 'Education and Scholarship' : 'Worker Benefits'}. Shared context stays on this device.`}</p>
      <button type="button" onClick={() => setBridgeNotice(false)} className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 font-semibold text-blue-950 focus-ring">
        {language === 'taglish' ? 'Isara' : 'Dismiss'}<X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>}
    {tab === 'triage' && <CivicHeroBanner language={language} badge={language === 'taglish' ? 'Gabay sa Manggagawa at Benepisyo' : 'Worker Benefits Guide'} title={language === 'taglish' ? 'Gabay sa' : 'Your guide to'} accent={language === 'taglish' ? 'Manggagawa at Benepisyo' : 'Workers and Benefits'}
      subtitle={language === 'taglish' ? 'Alamin ang benepisyo, loan options, hiwalay na EC claims at karapatan sa trabaho. Ahensya ang magpapatunay ng eligibility at final amount.' : 'Explore benefits, loan options, separate EC claims and worker rights. Agencies confirm eligibility and final amounts.'}
      onStart={() => { const target = document.getElementById('worker-wizard'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}
      onPrint={() => setTab('print_forms')} onDirectory={() => setTab('directory')} />}
    {error && <p role="alert" className="border border-amber-300 bg-amber-50 rounded-xl p-4 print:hidden">{error}</p>}
    {!loaded ? <p role="status">{language === 'taglish' ? 'Binubuksan ang local session...' : 'Loading local session...'}</p> : writesDisabled ? <p role="status">{language === 'taglish' ? 'Nakahinto muna ang pag-save habang ina-update ang saved data.' : 'Saving is paused while saved data is being updated.'}</p> : tab === 'triage' ? <div id="worker-wizard" tabIndex={-1} className="scroll-mt-40 outline-none"><WorkerWizard language={language} profile={profile} onChange={update} onPrint={() => setTab('print_forms')} worksheet={worksheet} onWorksheetChange={updateWorksheet} /></div> : tab === 'print_forms' ? <WorkerPrintView profile={profile} language={language} worksheet={worksheet} onWorksheetChange={updateWorksheet} documents={documents} onUpdateDocuments={updateDocuments} /> : <WorkerDirectoryView language={language} region={profile.region} province={profile.province} />}
  </CivicPageShell>;
}
