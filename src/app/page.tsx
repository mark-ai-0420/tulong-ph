'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CivicPageShell } from '@/components/shared/CivicPageShell';
import { CivicFooter } from '@/components/shared/CivicFooter';
import { PisonetPrivacyDialog } from '@/components/shared/PisonetPrivacyDialog';
import { CivicStatusBanner } from '@/components/shared/CivicStatusBanner';
import { CivicHeroBanner } from '@/components/shared/CivicHeroBanner';
import { Navbar } from '@/components/Navbar';
import { TriageWizard } from '@/components/TriageWizard';
import { PrintFormsView } from '@/components/PrintFormsView';
import { DirectoryView } from '@/components/DirectoryView';
import {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
  StoredDocument,
  ApplicationRecord,
} from '@/types/assistance';
import {
  loadPatientProfile,
  savePatientProfile,
  loadRepresentativeProfile,
  saveRepresentativeProfile,
  loadMedicalCase,
  saveMedicalCase,
  loadDocuments,
  saveDocuments,
  loadApplications,
  saveApplications,
  clearAllUserData,
  defaultPatientProfile,
  defaultRepresentativeProfile,
  defaultMedicalCase,
} from '@/lib/storage';
import { Language, translations } from '@/lib/i18n';
import { X, Layers } from 'lucide-react';
import { StackingInfographic } from '@/components/StackingInfographic';

export default function Home() {
  const [language, setLanguage] = useState<Language>('taglish');
  const [currentTab, setCurrentTab] = useState<string>('triage');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isInfographicModalOpen, setIsInfographicModalOpen] = useState(false);
  const [triageResetKey] = useState(0);
  const [privacyToast, setPrivacyToast] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState('');
  const [writesFrozen, setWritesFrozen] = useState(false);
  const manualWipe = useRef(false);
  const writesDisabled = useRef(false);
  useEffect(() => {
    if (window.location.hash !== '#privacy-cleared') return;
    const timer = setTimeout(() => {
      setPrivacyToast(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }, 0);
    const dismiss = setTimeout(() => setPrivacyToast(false), 5000);
    return () => { clearTimeout(timer); clearTimeout(dismiss); };
  }, []);


  // Domain State
  const [patient, setPatient] = useState<PatientProfile>(defaultPatientProfile);
  const [representative, setRepresentative] = useState<RepresentativeProfile>(
    defaultRepresentativeProfile
  );
  const [medicalCase, setMedicalCase] = useState<MedicalCase>(defaultMedicalCase);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [, setIsLoaded] = useState(false);

  // Load from IndexedDB on initial mount
  useEffect(() => {
    async function initData() {
      try {
        const [savedP, savedR, savedC, savedDocs, savedApps] = await Promise.all([
          loadPatientProfile(),
          loadRepresentativeProfile(),
          loadMedicalCase(),
          loadDocuments(),
          loadApplications(),
        ]);
        setPatient(savedP);
        setRepresentative(savedR);
        setMedicalCase(savedC);
        setDocuments(savedDocs);
        setApplications(savedApps);

        const savedLang = localStorage.getItem('tulong_lang') as Language;
        if (savedLang) setLanguage(savedLang);
      } catch (err) {
        console.error('Failed to load local state', err);
      } finally {
        setIsLoaded(true);
      }
    }
    initData();
  }, []);

  // Handlers with persistent sync
  const handleUpdatePatient = (p: PatientProfile) => {
    if (writesDisabled.current) return;
    setPatient(p);
    savePatientProfile(p);
  };

  const handleUpdateRepresentative = (r: RepresentativeProfile) => {
    if (writesDisabled.current) return;
    setRepresentative(r);
    saveRepresentativeProfile(r);
  };

  const handleUpdateMedicalCase = (c: MedicalCase) => {
    if (writesDisabled.current) return;
    setMedicalCase(c);
    saveMedicalCase(c);
  };

  const handleUpdateDocuments = (docs: StoredDocument[]) => {
    if (writesDisabled.current) return;
    setDocuments(docs);
    saveDocuments(docs);
  };

  const handleSaveApplications = (apps: ApplicationRecord[]) => {
    if (writesDisabled.current) return;
    setApplications(apps);
    saveApplications(apps);
  };

  const handleToggleLanguage = () => {
    const nextLang = language === 'taglish' ? 'en' : 'taglish';
    setLanguage(nextLang);
    localStorage.setItem('tulong_lang', nextLang);
  };

  const handleConfirmWipeData = async () => {
    if (manualWipe.current) return;
    manualWipe.current = true;
    writesDisabled.current = true;
    setWritesFrozen(true);
    setWiping(true);
    setWipeError('');
    try {
      // 1. Revoke all active document blob URLs to purge in-memory scans
      documents.forEach((d) => {
        if (d.dataUrl?.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(d.dataUrl);
          } catch {
            // ignore
          }
        }
      });

      // 2. Clean up any residual print iframes in the DOM
      if (typeof document !== 'undefined') {
        document.querySelectorAll('iframe[src^="blob:"]').forEach((el) => el.remove());
      }

      // 3. Purge storage layers (IndexedDB, localStorage, sessionStorage, caches)
      await clearAllUserData();

      // Navbar owns the successful full reload and the generic notice fragment.
    } catch {
      manualWipe.current = false;
      setWiping(false);
      setWipeError(language === 'taglish' ? 'Hindi kumpleto ang pagbura. Subukan muli; huwag iwan ang shared computer habang may saved data.' : 'Clearing is incomplete. Retry before leaving this shared computer.');
    }
  };

  const t = translations[language];
  const readyDocsCount = documents.filter((d) => d.isCompliantUnder2MB).length;

  return (
    <CivicPageShell navigation={<Navbar
        currentTab={currentTab} onTabChange={setCurrentTab} language={language}
        onToggleLanguage={handleToggleLanguage} readyDocCount={readyDocsCount}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)} isManualWipePending={() => manualWipe.current}
      />} footer={<CivicFooter language={language} onTabChange={setCurrentTab} onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        disclaimer={language === 'taglish'
          ? 'Disclaimer: Ang TulongPH ay isang independiyenteng civic utility at hindi ahensya ng gobyerno. Ang tulong pinansyal at mga Guarantee Letter ay eksklusibong ipinagkakaloob ng mga opisyal na hospital social workers (MSWD), DOH, DSWD, PCSO, at Senado alinsunod sa kanilang opisyal na proseso.'
          : 'Disclaimer: TulongPH is an independent civic utility and not a government agency. Financial aid and Guarantee Letters are evaluated and granted exclusively by official hospital social workers (MSWD), DOH, DSWD, PCSO, and the Senate.'}
      />} overlays={<>
        <PisonetPrivacyDialog open={isPrivacyModalOpen} busy={wiping} cancelDisabled={writesFrozen} error={wipeError} language={language}
          titleId="privacy-modal-title" descriptionId="privacy-modal-desc"
          onCancel={() => setIsPrivacyModalOpen(false)} onConfirm={handleConfirmWipeData} />
      {/* 5-Step Aid Stacking Infographic Modal */}
      {isInfographicModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="infographic-modal-title"
        >
          <div
            className="relative w-full max-w-4xl my-auto max-h-[90vh] bg-white border border-[#E2DFD6] rounded-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2DFD6] bg-[#FAF9F5]">
              <div>
                <h2 id="infographic-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                  {language === 'taglish' ? '5-Hakbang Aid Infographic' : '5-Step Aid Infographic'}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'taglish'
                    ? 'Tamang pagkakasunod-sunod ng PhilHealth, Malasakit, PCSO, PACe, at DSWD'
                    : 'Proper sequencing of PhilHealth, Malasakit, PCSO, PACe, and DSWD assistance'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInfographicModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-stone-200 text-slate-600 transition-colors focus-ring"
                aria-label="Isara"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              <StackingInfographic
                language={language}
                onSelectTab={(tab) => {
                  setIsInfographicModalOpen(false);
                  setCurrentTab(tab);
                }}
              />
            </div>

            <div className="p-3 sm:p-4 border-t border-[#E2DFD6] bg-[#FAF9F5] flex justify-end">
              <button
                type="button"
                onClick={() => setIsInfographicModalOpen(false)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors focus-ring cursor-pointer"
              >
                {language === 'taglish' ? 'Isara' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>}>
      {privacyToast && <CivicStatusBanner language={language} onDismiss={() => setPrivacyToast(false)} />}
      {currentTab === 'triage' && <CivicHeroBanner language={language} badge={t.badgeOfficialData}
        title={language === 'taglish' ? 'Huwag mawalan ng pag-asa.' : 'Never face a medical crisis alone.'}
        accent={language === 'taglish' ? 'May tulong ang gobyerno.' : 'Government aid is available.'}
        subtitle={t.appSubtitle} startHref="#triage-wizard-root" startLabel={language === 'taglish' ? 'Simulan ang Pagtutuos' : 'Start Triage'}
        onStart={() => { const target = document.getElementById('triage-wizard-root'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}
        onPrint={() => setCurrentTab('print_forms')} thirdIcon={Layers}
        thirdLabel={language === 'taglish' ? '5-Hakbang Aid Infographic' : '5-Step Aid Infographic'} onThird={() => setIsInfographicModalOpen(true)} />}

        {/* View Switcher Container hosting the 3 consolidated tabs */}
        <div
          id={currentTab === 'triage' ? 'triage-wizard-root' : undefined}
          tabIndex={-1}
          className="scroll-mt-40 outline-none focus:outline-none"
        >
          {currentTab === 'triage' && (
            <TriageWizard
              key={triageResetKey}
              patient={patient}
              representative={representative}
              medicalCase={medicalCase}
              documents={documents}
              applications={applications}
              onSaveApplications={handleSaveApplications}
              onUpdatePatient={handleUpdatePatient}
              onUpdateRepresentative={handleUpdateRepresentative}
              onUpdateMedicalCase={handleUpdateMedicalCase}
              onNavigateToTab={(tab) => {
                if (tab === 'vault') setCurrentTab('print_forms');
                else if (tab === 'malasakit' || tab === 'senate' || tab === 'pcso') setCurrentTab('directory');
                else setCurrentTab(tab);
              }}
              language={language}
            />
          )}

          {(currentTab === 'print_forms' || currentTab === 'vault') && (
            <PrintFormsView
              patient={patient}
              representative={representative}
              medicalCase={medicalCase}
              documents={documents}
              onUpdatePatient={handleUpdatePatient}
              onUpdateMedicalCase={handleUpdateMedicalCase}
              onUpdateDocuments={handleUpdateDocuments}
              language={language}
            />
          )}

          {(currentTab === 'directory' || currentTab === 'malasakit' || currentTab === 'senate' || currentTab === 'pcso') && (
            <DirectoryView language={language} />
          )}
        </div>
    </CivicPageShell>
  );
}
