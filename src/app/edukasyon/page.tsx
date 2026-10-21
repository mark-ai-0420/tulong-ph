'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CivicPageShell } from '@/components/shared/CivicPageShell';
import { CivicFooter } from '@/components/shared/CivicFooter';
import { PisonetPrivacyDialog } from '@/components/shared/PisonetPrivacyDialog';
import { CivicStatusBanner } from '@/components/shared/CivicStatusBanner';
import { CivicHeroBanner } from '@/components/shared/CivicHeroBanner';
import { Navbar } from '@/components/Navbar';
import { EducationWizard } from '@/components/education/EducationWizard';
import { EducationPrintView } from '@/components/education/EducationPrintView';
import { EducationDirectoryView } from '@/components/education/EducationDirectoryView';
import { defaultEducationProfile, normalizeEducationProfile } from '@/lib/educationEngine';
import {
  clearAllUserData,
  getWipeGeneration,
  loadEducationSession,
  loadSharedFamilyContext,
  mergeEducationSharedContext,
  loadDocuments,
  saveDocuments,
  saveEducationSession,
} from '@/lib/storage';
import type { StoredDocument } from '@/types/assistance';
import type { StudentEducationProfile } from '@/types/education';
import { getNextLanguage, isLanguage } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

type LocatedEducationProfile = StudentEducationProfile & { province?: string; barangay?: string };
function normalizeLocatedProfile(value: unknown): LocatedEducationProfile {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { ...normalizeEducationProfile(value),
    province: typeof record.province === 'string' ? record.province.slice(0, 150) : '',
    barangay: typeof record.barangay === 'string' ? record.barangay.slice(0, 150) : '',
  };
}

export default function EducationPage() {
  const [profile, setProfile] = useState<LocatedEducationProfile>(defaultEducationProfile);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('triage');
  const [language, setLanguage] = useState<Language>('taglish');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [writesDisabled, setWritesDisabled] = useState(false);
  const manualWipe = useRef(false);
  const [privacyToast, setPrivacyToast] = useState(false);
  const [bridgeNotice, setBridgeNotice] = useState(false);
  const [bridgeSource, setBridgeSource] = useState('medical');
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
    Promise.all([
      loadEducationSession().catch(() => {
        if (active) setError('Hindi mabasa ang saved session. Maaari kang magpatuloy; bagong edits lang ang ise-save.');
        return null;
      }),
      loadSharedFamilyContext().catch(() => null),
      loadDocuments().catch(() => {
        if (active) setError('Hindi mabasa ang saved documents. Maaari kang magpatuloy; maaaring i-upload muli ang mga ito.');
        return [];
      }),
    ]).then(([saved, shared, savedDocuments]) => {
      if (!active || getWipeGeneration() !== generation) return;
      setDocuments(savedDocuments);
      let next = normalizeLocatedProfile(saved);
      if (bridgeRequested || shared) {
        if (shared) {
          next = mergeEducationSharedContext(next, shared) as LocatedEducationProfile;
          setBridgeSource(shared.sourcePillar ?? 'medical');
          setBridgeNotice(Boolean(shared.province || shared.cityMunicipality || shared.barangay || shared.region || shared.locationTier || shared.regionalDailyWage !== undefined || shared.monthlyIncome !== undefined || shared.is4Ps || shared.isPWD || shared.isOFW || shared.isSoloParent || shared.isSeniorCitizen));
          void saveEducationSession(next).catch(() => setError('Hindi na-save sa device ang family details. Maaari ka pa ring magpatuloy at mag-print.'));
        }
      }
      setProfile(next);
      setLoaded(true);
    }).catch(() => {
      if (active && getWipeGeneration() === generation) { setError('Hindi mabasa ang saved session. Maaari kang magpatuloy; bagong edits lang ang ise-save.'); setLoaded(true); }
    });
    const freeze = () => { if (active) { setWritesDisabled(true); setProfile(defaultEducationProfile); setDocuments([]); setLanguage('taglish'); } };
    window.addEventListener('tulongph-data-cleared', freeze);
    return () => { active = false; window.removeEventListener('tulongph-data-cleared', freeze); };
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

  function update(next: StudentEducationProfile) {
    if (!loaded || writesDisabled) return;
    const safe = normalizeLocatedProfile(next);
    setProfile(safe);
    saveEducationSession(safe).then(() => setError('')).catch(() => setError('Hindi na-save sa device ang huling edit. Panatilihing bukas ang page o i-print muna ang packet.'));
  }

  function updateDocuments(next: StoredDocument[]) {
    if (!loaded || writesDisabled) return;
    setDocuments(next);
    saveDocuments(next).catch(() => setError('Hindi na-save sa device ang mga dokumento. Panatilihing bukas ang page o i-download ang mga file.'));
  }

  async function wipe() {
    if (manualWipe.current) return;
    manualWipe.current = true;
    setWiping(true); setWipeError(''); setWritesDisabled(true);
    setDocuments([]);
    setLanguage('taglish');
    try { await clearAllUserData(); }
    catch { manualWipe.current = false; setWiping(false); setWipeError('Hindi kumpleto ang pagbura. Subukan muli; huwag iwan ang shared computer habang may saved data.'); }
  }

  return <CivicPageShell className="education-page" navigation={
    <Navbar currentTab={currentTab} onTabChange={setCurrentTab} language={language} onToggleLanguage={() => {
      const next = getNextLanguage(language);
      setLanguage(next);
      localStorage.setItem('tulong_lang', next);
    }} readyDocCount={documents.filter((document) => document.isCompliantUnder2MB).length} onOpenPrivacyModal={() => setPrivacyOpen(true)} isManualWipePending={() => manualWipe.current} />
  } footer={<CivicFooter language={language} onTabChange={setCurrentTab} onOpenPrivacyModal={() => setPrivacyOpen(true)} disclaimer={language === 'taglish' ? 'Disclaimer: Ang TulongPH ay isang independiyenteng civic utility at hindi ahensya ng gobyerno. Gabay lamang ang tuition relief, scholarship at allowance estimates; ang kaukulang ahensya at paaralan ang nagpapatunay ng eligibility, pondo at final award alinsunod sa kanilang opisyal na proseso.' : 'Disclaimer: TulongPH is an independent civic utility and not a government agency. Tuition relief, scholarship and allowance estimates are guidance; the relevant agencies and schools confirm eligibility, funding and final awards through their official processes.'} />}
    overlays={<PisonetPrivacyDialog open={privacyOpen} busy={wiping} cancelDisabled={writesDisabled} error={wipeError} language={language} titleId="education-wipe-title" descriptionId="education-wipe-desc" onCancel={() => setPrivacyOpen(false)} onConfirm={wipe} />}>
    {privacyToast && <CivicStatusBanner language={language} onDismiss={() => setPrivacyToast(false)} />}
    {bridgeNotice && <div role="status" className="mb-4 flex min-w-0 flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 break-words">{language === 'taglish' ? `Na-prefill ang lokasyon at sektor ng iyong pamilya mula sa ${bridgeSource === 'medical' ? 'Ospital Triage' : bridgeSource === 'worker' ? 'Manggagawa at Benepisyo' : 'Edukasyon at Scholarship'}. Nasa device lang ang shared context.` : `Your family location and sector details were prefilled from ${bridgeSource === 'medical' ? 'Hospital Triage' : bridgeSource === 'worker' ? 'Worker Benefits' : 'Education and Scholarship'}. Shared context stays on this device.`}</p>
      <button type="button" onClick={() => setBridgeNotice(false)} className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 font-semibold text-blue-950 focus-ring">
        {language === 'taglish' ? 'Isara' : 'Dismiss'}<X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>}
    {error && <p role="alert" className="print:hidden rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
    {!loaded ? <p role="status" className="text-sm">{language === 'taglish' ? 'Binabasa ang local session...' : 'Loading local session...'}</p>
      : writesDisabled ? <p role="status" className="text-sm">{language === 'taglish' ? 'Nakahinto muna ang pag-save habang ina-update ang saved data.' : 'Saving is paused while saved data is being updated.'}</p>
      : currentTab === 'print_forms' ? <EducationPrintView profile={profile} onChange={update} language={language} documents={documents} onUpdateDocuments={updateDocuments} />
      : currentTab === 'directory' ? <EducationDirectoryView language={language} />
      : <><CivicHeroBanner language={language} badge={language === 'taglish' ? 'Gabay sa Edukasyon at Scholarship' : 'Education and Scholarship Guide'}
        title={language === 'taglish' ? 'Gabay sa' : 'Your guide to'} accent={language === 'taglish' ? 'Edukasyon at Scholarship' : 'Education and Scholarships'}
        subtitle={language === 'taglish' ? 'Alamin ang posibleng tuition relief, scholarship at dagdag na tulong. Ahensya at paaralan ang magkukumpirma ng eligibility at pondo.' : 'Explore possible tuition relief, scholarships and additional support. Agencies and schools confirm eligibility and funding.'}
        onStart={() => { const target = document.getElementById('education-wizard'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}
        onPrint={() => setCurrentTab('print_forms')} onDirectory={() => setCurrentTab('directory')} />
        <div id="education-wizard" tabIndex={-1} className="scroll-mt-40 outline-none"><EducationWizard profile={profile} onChange={update} onPrint={() => setCurrentTab('print_forms')} language={language} /></div></>}
  </CivicPageShell>;
}
