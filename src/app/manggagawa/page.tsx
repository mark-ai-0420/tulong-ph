'use client';

import { useEffect, useRef, useState } from 'react';
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
import { clearAllUserData, loadWorkerSession, saveWorkerSession } from '@/lib/storage';
import type { WorkerProfileInput } from '@/types/worker';
import type { Language } from '@/lib/i18n';

type LocatedWorkerProfile = WorkerProfileInput & { province?: string; cityMunicipality?: string; barangay?: string };

export default function WorkerPage() {
  const [profile, setProfile] = useState<LocatedWorkerProfile>(defaultWorkerProfile);
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
    loadWorkerSession().then(saved => {
      if (!active) return;
      if (saved && typeof saved === 'object') {
        const clean: LocatedWorkerProfile = { ...defaultWorkerProfile };
        for (const key of Object.keys(clean) as (keyof WorkerProfileInput)[]) {
          const value = saved[key];
          if (typeof value === typeof clean[key] && (typeof value !== 'number' || Number.isFinite(value) && value >= 0)) {
            Object.assign(clean, { [key]: value });
          }
        }
        const enums = {
          sector: ['private', 'government', 'self_employed', 'ofw', 'displaced'],
          scenario: ['loans', 'maternity', 'sickness', 'unemployment', 'wages', 'livelihood', 'funeral'],
          maternityType: ['live_birth', 'solo_parent', 'miscarriage'],
          owwaMembership: ['active', 'inactive_once', 'inactive_multiple', 'none'],
        };
        for (const key of Object.keys(enums) as (keyof typeof enums)[]) {
          if (!enums[key].includes(clean[key])) Object.assign(clean, { [key]: defaultWorkerProfile[key] });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.contingencyDate)) clean.contingencyDate = defaultWorkerProfile.contingencyDate;
        const savedLocation = saved as WorkerProfileInput & Record<string, unknown>;
        for (const key of ['province', 'cityMunicipality', 'barangay'] as const) {
          if (typeof savedLocation[key] === 'string') clean[key] = savedLocation[key].slice(0, 150);
        }
        setProfile(clean);
      }
    }).catch(() => { if (active) setError('Hindi mabuksan ang local save. Maaari pa ring magkompyut; i-print bago umalis.'); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  function update(next: WorkerProfileInput) {
    if (!loaded || writesDisabled || manualWipe.current) return;
    setProfile(next);
    void saveWorkerSession(next).catch(() => setError('Hindi na-save sa device. I-print ang worksheet bago umalis.'));
  }
  async function wipe() {
    if (manualWipe.current) return;
    manualWipe.current = true;
    setWiping(true); setWipeError(''); setWritesDisabled(true);
    try { await clearAllUserData(); }
    catch { manualWipe.current = false; setWiping(false); setWipeError(language === 'taglish' ? 'Hindi kumpleto ang pagbura. Subukan muli; huwag iwan ang shared computer habang may saved data.' : 'Clearing is incomplete. Retry before leaving this shared computer.'); }
  }
  return <CivicPageShell className="worker-page" navigation={
    <Navbar currentTab={tab} onTabChange={setTab} language={language} onToggleLanguage={() => setLanguage(language === 'taglish' ? 'en' : 'taglish')} readyDocCount={0} onOpenPrivacyModal={() => setPrivacyOpen(true)} isManualWipePending={() => manualWipe.current} />
  } footer={<CivicFooter language={language} onTabChange={setTab} onOpenPrivacyModal={() => setPrivacyOpen(true)} disclaimer={language === 'taglish' ? 'Disclaimer: Ang TulongPH ay isang independiyenteng civic utility at hindi ahensya ng gobyerno. Gabay lamang ang benefit, loan at livelihood estimates; ang kaukulang ahensya at employer ang nagpapatunay ng eligibility, records at final amount alinsunod sa kanilang opisyal na proseso.' : 'Disclaimer: TulongPH is an independent civic utility and not a government agency. Benefit, loan and livelihood estimates are guidance; the relevant agencies and employers confirm eligibility, records and final amounts through their official processes.'} />}
    overlays={<PisonetPrivacyDialog open={privacyOpen} busy={wiping} cancelDisabled={writesDisabled} error={wipeError} language={language} titleId="worker-wipe-title" descriptionId="worker-wipe-desc" confirmAriaLabel={language === 'taglish' ? 'Oo, Burahin Lahat' : undefined} onCancel={() => setPrivacyOpen(false)} onConfirm={wipe} />}>
    {privacyToast && <CivicStatusBanner language={language} onDismiss={() => setPrivacyToast(false)} />}
    {tab === 'triage' && <CivicHeroBanner language={language} badge={language === 'taglish' ? 'Gabay sa Manggagawa at Benepisyo' : 'Worker Benefits Guide'} title={language === 'taglish' ? 'Gabay sa' : 'Your guide to'} accent={language === 'taglish' ? 'Manggagawa at Benepisyo' : 'Workers and Benefits'}
      subtitle={language === 'taglish' ? 'Alamin ang benepisyo, loan options, hiwalay na EC claims at karapatan sa trabaho. Ahensya ang magpapatunay ng eligibility at final amount.' : 'Explore benefits, loan options, separate EC claims and worker rights. Agencies confirm eligibility and final amounts.'}
      onStart={() => { const target = document.getElementById('worker-wizard'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}
      onPrint={() => setTab('print_forms')} onDirectory={() => setTab('directory')} />}
    {error && <p role="alert" className="border border-amber-300 bg-amber-50 rounded-xl p-4 print:hidden">{error}</p>}
    {!loaded ? <p role="status">{language === 'taglish' ? 'Binubuksan ang local session...' : 'Loading local session...'}</p> : writesDisabled ? <p role="status">{language === 'taglish' ? 'Nakahinto ang pag-save habang binubura ang data.' : 'Saving is stopped while data is being cleared.'}</p> : tab === 'triage' ? <div id="worker-wizard" tabIndex={-1} className="scroll-mt-40 outline-none"><WorkerWizard language={language} profile={profile} onChange={update} onPrint={() => setTab('print_forms')} /></div> : tab === 'print_forms' ? <WorkerPrintView profile={profile} language={language} /> : <WorkerDirectoryView language={language} />}
  </CivicPageShell>;
}
