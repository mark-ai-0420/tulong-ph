'use client';

import React, { useState, useEffect } from 'react';
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
import {
  ShieldCheck,
  Printer,
  FileCheck2,
  Compass,
  Building2,
  Trash2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function Home() {
  const [language, setLanguage] = useState<Language>('taglish');
  const [currentTab, setCurrentTab] = useState<string>('triage');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [triageResetKey, setTriageResetKey] = useState(0);
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);

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
    setPatient(p);
    savePatientProfile(p);
  };

  const handleUpdateRepresentative = (r: RepresentativeProfile) => {
    setRepresentative(r);
    saveRepresentativeProfile(r);
  };

  const handleUpdateMedicalCase = (c: MedicalCase) => {
    setMedicalCase(c);
    saveMedicalCase(c);
  };

  const handleUpdateDocuments = (docs: StoredDocument[]) => {
    setDocuments(docs);
    saveDocuments(docs);
  };

  const handleSaveApplications = (apps: ApplicationRecord[]) => {
    setApplications(apps);
    saveApplications(apps);
  };

  const handleToggleLanguage = () => {
    const nextLang = language === 'taglish' ? 'en' : 'taglish';
    setLanguage(nextLang);
    localStorage.setItem('tulong_lang', nextLang);
  };

  const handleConfirmWipeData = async () => {
    try {
      await clearAllUserData();
      setPatient(defaultPatientProfile);
      setRepresentative(defaultRepresentativeProfile);
      setMedicalCase(defaultMedicalCase);
      setDocuments([]);
      setApplications([]);
      setTriageResetKey((prev) => prev + 1);
      setCurrentTab('triage');
      setIsPrivacyModalOpen(false);
      setPrivacyToast(
        language === 'taglish'
          ? 'Nabura na ang lahat ng datos para sa inyong privacy.'
          : 'All data has been wiped for your privacy.'
      );
      setTimeout(() => {
        setPrivacyToast(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to wipe data:', err);
    }
  };

  const t = translations[language];
  const readyDocsCount = documents.filter((d) => d.isCompliantUnder2MB).length;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAF9F5] font-sans text-[#0F172A] antialiased overflow-x-hidden">
      {/* Sticky Global Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        readyDocCount={readyDocsCount}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Privacy Wipe Success Banner */}
        {privacyToast && (
          <div
            role="status"
            className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{privacyToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrivacyToast(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              aria-label="Isara ang abiso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Authoritative Civic Editorial Announcement Board */}
        {currentTab === 'triage' && (
          <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="max-w-3xl space-y-4">
              {/* Civic Seal & Dignified Reassurance Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                  <span>{t.badgeOfficialData}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'taglish'
                    ? '• 100% Libre at Pribado sa Inyong Device'
                    : '• 100% Free & Private on Your Device'}
                </span>
              </div>

              {/* Crisp, high-contrast headings */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {language === 'taglish' ? (
                  <>
                    Huwag mawalan ng pag-asa.{' '}
                    <span className="text-blue-900">May tulong ang gobyerno.</span>
                  </>
                ) : (
                  <>
                    Never face a medical crisis alone.{' '}
                    <span className="text-blue-900">Government aid is available.</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
                {t.appSubtitle}
              </p>

              {/* Quick Jump Action Buttons with min-h-[44px] touch targets */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => setCurrentTab('print_forms')}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-900 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors focus-ring cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>
                    {language === 'taglish'
                      ? 'I-print ang Malasakit & DSWD Form'
                      : 'Print Malasakit & DSWD Forms'}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentTab('print_forms')}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-slate-800 border border-[#E2DFD6] shadow-2xs transition-colors focus-ring cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    {language === 'taglish'
                      ? 'I-handa ang Requirements'
                      : 'Prepare Requirements'}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentTab('directory')}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-slate-800 border border-[#E2DFD6] shadow-2xs transition-colors focus-ring cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>
                    {language === 'taglish'
                      ? '200 Malasakit Hospital Desks'
                      : '200 Malasakit Hospital Desks'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher Container hosting the 3 consolidated tabs */}
        <div>
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
      </main>

      {/* Footer with Elevated Contrast (text-slate-600) */}
      <footer className="bg-white border-t border-[#E2DFD6] mt-12 py-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                T
              </div>
              <span className="font-bold text-slate-900">TulongPH</span>
              <span className="text-slate-600">— Open-Source Philippine Assistance Navigator</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-700 font-medium">
              <button
                onClick={() => setCurrentTab('triage')}
                className="min-h-[44px] inline-flex items-center hover:text-blue-700 transition-colors cursor-pointer"
              >
                {language === 'taglish' ? 'Gabay sa Tulong' : 'Aid Navigator'}
              </button>
              <button
                onClick={() => setCurrentTab('print_forms')}
                className="min-h-[44px] inline-flex items-center hover:text-blue-700 transition-colors cursor-pointer"
              >
                {language === 'taglish' ? 'I-print ang Forms' : 'Print Official Forms'}
              </button>
              <button
                onClick={() => setCurrentTab('directory')}
                className="min-h-[44px] inline-flex items-center hover:text-blue-700 transition-colors cursor-pointer"
              >
                {language === 'taglish' ? 'Direktoryo at Desks' : 'Directory & Desks'}
              </button>
            </div>
          </div>

          {/* Computer Shop Privacy Wipe Action Banner in Footer */}
          <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-red-950 text-center sm:text-left">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {language === 'taglish'
                  ? 'Nasa computer shop o pisonet ka ba? Burahin ang inyong mga pribadong datos bago umalis ng computer.'
                  : 'Using a public computer shop or pisonet? Wipe your private data before leaving the terminal.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {language === 'taglish'
                  ? 'Burahin ang Aking Datos (Pisonet / Shop Mode)'
                  : 'Burahin ang Aking Datos (Pisonet / Shop Mode)'}
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-center sm:text-left">
            Disclaimer: Ang TulongPH ay isang open-source civic technology tool na binuo upang tulungan ang mga mamamayang Pilipino na maorganisa at ma-compress ang kanilang mga dokumento para sa pag-file ng tulong medikal. Hindi ito kapalit ng opisyal na portal ng gobyerno. Ang lahat ng opisyal na Guarantee Letter ay eksklusibong iniisyu ng kaukulang ahensya (Senado, PCSO, DOH, DSWD).
          </p>
        </div>
      </footer>

      {/* Public Computer Shop Privacy Wipe Accessible Confirmation Modal */}
      {isPrivacyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          aria-describedby="privacy-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsPrivacyModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h2 id="privacy-modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {language === 'taglish'
                    ? 'Burahin ang Lahat ng Datos sa Computer na Ito?'
                    : 'Clear All Data from this Device?'}
                </h2>
                <span className="inline-block text-[11px] font-bold text-red-700 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {language === 'taglish' ? 'Pisonet / Shop Mode' : 'Computer Shop Mode'}
                </span>
              </div>
            </div>

            <p id="privacy-modal-desc" className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'taglish'
                ? 'Nasa computer shop o pisonet ka ba? Buburahin nito ang inyong profile, medical abstract, PhilHealth PIN, at na-upload na mga dokumento mula sa browser na ito upang hindi makita ng susunod na gagamit ng computer.'
                : 'Nasa computer shop o pisonet ka ba? Buburahin nito ang inyong profile, medical abstract, PhilHealth PIN, at na-upload na mga dokumento mula sa browser na ito upang hindi makita ng susunod na gagamit ng computer.'}
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === 'taglish'
                  ? 'Hindi na maibabalik ang datos kapag nabura na. Siguraduhing na-download o na-print na ang inyong mga form.'
                  : 'This cannot be undone. Ensure you have downloaded or printed your forms before proceeding.'}
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === 'taglish' ? 'Kanselahin' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmWipeData}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-900/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'taglish' ? 'Oo, Burahin ang Lahat' : 'Yes, Wipe All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
