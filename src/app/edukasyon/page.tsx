'use client';

import { useEffect, useRef, useState } from 'react';
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
import { clearAllUserData, loadEducationSession, saveEducationSession } from '@/lib/storage';
import type { StudentEducationProfile } from '@/types/education';
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
    loadEducationSession().then((saved) => {
      if (active) { setProfile(normalizeLocatedProfile(saved)); setLoaded(true); }
    }).catch(() => {
      if (active) { setError('Hindi mabasa ang saved session. Maaari kang magpatuloy; bagong edits lang ang ise-save.'); setLoaded(true); }
    });
    const freeze = () => { if (active) { setWritesDisabled(true); setProfile(defaultEducationProfile); } };
    window.addEventListener('tulongph-data-cleared', freeze);
    return () => { active = false; window.removeEventListener('tulongph-data-cleared', freeze); };
  }, []);

  function update(next: StudentEducationProfile) {
    if (!loaded || writesDisabled) return;
    const safe = normalizeLocatedProfile(next);
    setProfile(safe);
    saveEducationSession(safe).then(() => setError('')).catch(() => setError('Hindi na-save sa device ang huling edit. Panatilihing bukas ang page o i-print muna ang packet.'));
  }

  async function wipe() {
    if (manualWipe.current) return;
    manualWipe.current = true;
    setWiping(true); setWipeError(''); setWritesDisabled(true);
    try { await clearAllUserData(); }
    catch { manualWipe.current = false; setWiping(false); setWipeError('Hindi kumpleto ang pagbura. Subukan muli; huwag iwan ang shared computer habang may saved data.'); }
  }

  return <CivicPageShell className="education-page" navigation={
    <Navbar currentTab={currentTab} onTabChange={setCurrentTab} language={language} onToggleLanguage={() => setLanguage(language === 'taglish' ? 'en' : 'taglish')} readyDocCount={0} onOpenPrivacyModal={() => setPrivacyOpen(true)} isManualWipePending={() => manualWipe.current} />
  } footer={<CivicFooter language={language} onTabChange={setCurrentTab} onOpenPrivacyModal={() => setPrivacyOpen(true)} disclaimer={language === 'taglish' ? 'Disclaimer: Ang TulongPH ay isang independiyenteng civic utility at hindi ahensya ng gobyerno. Gabay lamang ang tuition relief, scholarship at allowance estimates; ang kaukulang ahensya at paaralan ang nagpapatunay ng eligibility, pondo at final award alinsunod sa kanilang opisyal na proseso.' : 'Disclaimer: TulongPH is an independent civic utility and not a government agency. Tuition relief, scholarship and allowance estimates are guidance; the relevant agencies and schools confirm eligibility, funding and final awards through their official processes.'} />}
    overlays={<PisonetPrivacyDialog open={privacyOpen} busy={wiping} cancelDisabled={writesDisabled} error={wipeError} language={language} titleId="education-wipe-title" descriptionId="education-wipe-desc" onCancel={() => setPrivacyOpen(false)} onConfirm={wipe} />}>
    {privacyToast && <CivicStatusBanner language={language} onDismiss={() => setPrivacyToast(false)} />}
    {error && <p role="alert" className="print:hidden rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
    {!loaded ? <p role="status" className="text-sm">{language === 'taglish' ? 'Binabasa ang local session...' : 'Loading local session...'}</p>
      : writesDisabled ? <p role="status" className="text-sm">{language === 'taglish' ? 'Nakahinto ang pag-save habang binubura ang data.' : 'Saving is stopped while data is being cleared.'}</p>
      : currentTab === 'print_forms' ? <EducationPrintView profile={profile} onChange={update} language={language} />
      : currentTab === 'directory' ? <EducationDirectoryView language={language} />
      : <><CivicHeroBanner language={language} badge={language === 'taglish' ? 'Gabay sa Edukasyon at Scholarship' : 'Education and Scholarship Guide'}
        title={language === 'taglish' ? 'Gabay sa' : 'Your guide to'} accent={language === 'taglish' ? 'Edukasyon at Scholarship' : 'Education and Scholarships'}
        subtitle={language === 'taglish' ? 'Alamin ang posibleng tuition relief, scholarship at dagdag na tulong. Ahensya at paaralan ang magkukumpirma ng eligibility at pondo.' : 'Explore possible tuition relief, scholarships and additional support. Agencies and schools confirm eligibility and funding.'}
        onStart={() => { const target = document.getElementById('education-wizard'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}
        onPrint={() => setCurrentTab('print_forms')} onDirectory={() => setCurrentTab('directory')} />
        <div id="education-wizard" tabIndex={-1} className="scroll-mt-40 outline-none"><EducationWizard profile={profile} onChange={update} onPrint={() => setCurrentTab('print_forms')} language={language} /></div></>}
  </CivicPageShell>;
}
