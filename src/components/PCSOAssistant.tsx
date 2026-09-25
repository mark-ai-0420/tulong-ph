'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Download,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { StoredDocument, DocumentType, PatientProfile } from '@/types/assistance';
import { formatBytes } from '@/lib/compressor';
import { Language, translations } from '@/lib/i18n';

interface PCSOAssistantProps {
  documents: StoredDocument[];
  patient: PatientProfile;
  language: Language;
  onNavigateToVault: () => void;
}

export const PCSOAssistant: React.FC<PCSOAssistantProps> = ({
  documents,
  patient,
  language,
  onNavigateToVault,
}) => {
  const t = translations[language];
  const [phTime, setPhTime] = useState<string>('');
  const [isMorningQueueWindow, setIsMorningQueueWindow] = useState<boolean>(false);

  // Keep Philippine Time updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Asia/Manila
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
      setPhTime(timeString);

      // Check if weekday between 7:00 AM and 12:00 PM
      const manilaHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          hour: 'numeric',
          hour12: false,
        }).format(now),
        10
      );
      const manilaDay = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
      ).getDay(); // 0 is Sunday, 6 is Saturday

      const isWeekday = manilaDay >= 1 && manilaDay <= 5;
      setIsMorningQueueWindow(isWeekday && manilaHour >= 7 && manilaHour < 12);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pcsoRequiredTypes: { type: DocumentType; labelEn: string; labelTl: string }[] = [
    {
      type: 'clinical_abstract',
      labelEn: 'Original Medical Abstract (Signed with License No.)',
      labelTl: 'Medical Abstract (May pirma at license ng doktor)',
    },
    {
      type: 'statement_of_account',
      labelEn: 'Hospital Statement of Account (Net of PhilHealth)',
      labelTl: 'Hospital Billing / SOA (Bawas na ang PhilHealth)',
    },
    {
      type: 'patient_valid_id',
      labelEn: "Patient's Government ID / Birth Cert",
      labelTl: 'Valid ID ng Pasyente / Birth Certificate',
    },
    {
      type: 'representative_valid_id',
      labelEn: "Representative's Government ID",
      labelTl: 'Valid ID ng Kamag-anak na Maglalakad',
    },
    {
      type: 'authorization_letter',
      labelEn: 'Signed Authorization Letter',
      labelTl: 'Pirmadong Authorization Letter',
    },
    {
      type: 'proof_of_relationship',
      labelEn: 'Proof of Relationship (PSA Birth/Marriage)',
      labelTl: 'Katunayan ng Relasyon (PSA Birth/Marriage)',
    },
  ];

  const getDoc = (type: DocumentType) => documents.find((d) => d.docType === type);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200">
                DAILY QUOTA SYSTEM
              </span>
              <span className="text-xs font-semibold text-emerald-800">PCSO Online E-Services MAP</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {language === 'taglish' ? 'PCSO MAP Queue & File Readiness' : 'PCSO MAP Morning Queue Readiness'}
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              {language === 'taglish'
                ? 'Ang PCSO Online portal ay may mahigpit na daily quota at 2MB per file limit. Ihanda ang mga dokumento bago sumapit ang 7:00 AM para mabilis na maipasa pagkabukas ng queue.'
                : 'PCSO online assistance operates with strict daily case allocations and rigid 2MB PDF maximum limits. Prepare and verify your document stack before 7:00 AM to submit smoothly.'}
            </p>
          </div>

          <a
            href="https://www.pcso.gov.ph"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors shrink-0"
          >
            <span>Open PCSO E-Services</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Live Philippine Standard Time & Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2DFD6] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Philippine Standard Time</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{phTime || 'Loading...'}</div>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
            GMT+8
          </span>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
            isMorningQueueWindow
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isMorningQueueWindow
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-amber-200 text-amber-900'
              }`}
            >
              {isMorningQueueWindow ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-85">Daily Submission Window</div>
              <div className="text-base font-bold mt-0.5">
                {isMorningQueueWindow
                  ? 'Queue Window Active (7 AM - 12 PM)'
                  : 'Queue Closed (Opens weekdays 7:00 AM)'}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
            {isMorningQueueWindow ? 'SUBMIT NOW' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Strict 2MB PDF Enforcer Checklist */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'taglish' ? 'PCSO 2.0MB PDF Verification' : 'PCSO Document Stack & 2.0MB Verification'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {language === 'taglish'
                ? 'Lahat ng dokumento ay dapat nakahiwalay na PDF at hindi lalampas sa 2MB.'
                : 'Every single uploaded attachment must be an individual PDF file strictly below 2.0MB.'}
            </p>
          </div>
          <button
            onClick={onNavigateToVault}
            className="min-h-[44px] inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-800 underline text-left sm:text-right"
          >
            {language === 'taglish' ? 'Pumunta sa Vault para mag-compress' : 'Go to Vault to compress files'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {pcsoRequiredTypes.map((item) => {
            const doc = getDoc(item.type);
            const isReady = doc && doc.isCompliantUnder2MB;

            return (
              <div
                key={item.type}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isReady
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isReady ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="font-bold truncate text-slate-900 text-sm">
                      {language === 'taglish' ? item.labelTl : item.labelEn}
                    </div>
                    {doc && (
                      <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                        {doc.fileName} ({formatBytes(doc.compressedSize)})
                      </div>
                    )}
                  </div>
                </div>

                {doc?.dataUrl ? (
                  <a
                    href={doc.dataUrl}
                    download={doc.fileName}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-blue-700 hover:border-blue-400 shadow-xs shrink-0 transition-colors"
                    title="Download ready PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-xs font-bold text-amber-950 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded shrink-0">
                    Missing
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step by Step PCSO Workflow */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-700" />
          <span>
            {language === 'taglish' ? 'Hakbang-hakbang sa PCSO E-Services Portal:' : 'PCSO Portal Step-by-Step:'}
          </span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-sm text-blue-800">1. Create & Verify</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Mag-sign up sa pcso.gov.ph at ilagay ang OTP na matatanggap sa email.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-sm text-blue-800">2. Select Hospital</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Piliin ang accredited Partner Health Facility (PHF) kung saan naka-admit ang pasyente.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-sm text-blue-800">3. Upload PDFs</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              I-upload ang mga dokumentong galing sa Document Vault (lahat ay under 2MB).
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-sm text-blue-800">4. Receive GL</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              I-download ang electronic Guarantee Letter at i-present sa Billing ng ospital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
