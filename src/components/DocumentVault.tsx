'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { DocumentType, StoredDocument, PatientProfile } from '@/types/assistance';
import {
  convertAndCompressImageToPdf,
  formatBytes,
  getStandardizedDocFileName,
} from '@/lib/compressor';
import { Language, translations } from '@/lib/i18n';

interface DocumentVaultProps {
  documents: StoredDocument[];
  onUpdateDocuments: (docs: StoredDocument[]) => void;
  patient: PatientProfile;
  language: Language;
}

export interface DocSlotConfig {
  type: DocumentType;
  labelEn: string;
  labelTl: string;
  requiredFor: string[];
  helperEn: string;
  helperTl: string;
}

export const DOCUMENT_SLOTS: DocSlotConfig[] = [
  {
    type: 'clinical_abstract',
    labelEn: 'Clinical Abstract / Medical Certificate',
    labelTl: 'Medical Abstract / Sertipiko ng Doktor',
    requiredFor: ['Senate Assist', 'PCSO MAP', 'Malasakit', 'DSWD'],
    helperEn: 'Signed by attending physician with License & PTR numbers.',
    helperTl: 'May pirma ng doktor, License Number, at PTR number.',
  },
  {
    type: 'statement_of_account',
    labelEn: 'Statement of Account (SOA) / Running Bill',
    labelTl: 'Hospital Billing / Statement of Account (SOA)',
    requiredFor: ['Senate Assist', 'PCSO MAP', 'Malasakit', 'DSWD'],
    helperEn: 'Must reflect PhilHealth and Senior/PWD deductions if applicable.',
    helperTl: 'Kailangang nakalagay ang bawas ng PhilHealth o Senior/PWD kung mayroon.',
  },
  {
    type: 'barangay_indigency',
    labelEn: 'Barangay Certificate of Indigency',
    labelTl: 'Barangay Certificate of Indigency',
    requiredFor: ['Senate Assist', 'Malasakit', 'DSWD', 'LGU Aid'],
    helperEn: 'Issued by the Barangay Hall stating the patient/claimant is in financial crisis.',
    helperTl: 'Galing sa Barangay Hall na nagpapatunay na kapos sa pananalapi.',
  },
  {
    type: 'patient_valid_id',
    labelEn: "Patient's Valid Government ID",
    labelTl: 'Valid ID ng Pasyente',
    requiredFor: ['Senate Assist', 'PCSO MAP', 'Malasakit', 'DSWD'],
    helperEn: 'PhilSys National ID, UMID, Driver’s License, Senior Citizen ID, or Passport.',
    helperTl: 'National ID, UMID, Driver’s License, Senior ID, Voter’s, o Passport.',
  },
  {
    type: 'representative_valid_id',
    labelEn: "Representative's Valid Government ID",
    labelTl: 'Valid ID ng Maglalakad / Kamag-anak',
    requiredFor: ['Senate Assist', 'PCSO MAP', 'Malasakit', 'DSWD'],
    helperEn: 'Government ID of the family member transacting for the patient.',
    helperTl: 'Valid ID ng kapamilyang nag-aasikaso ng tulong.',
  },
  {
    type: 'authorization_letter',
    labelEn: 'Authorization Letter',
    labelTl: 'Authorization Letter (Liham Pahintulot)',
    requiredFor: ['Senate Assist', 'PCSO MAP'],
    helperEn: 'Signed letter from the patient authorizing the representative to apply.',
    helperTl: 'Pirmadong sulat ng pasyente na pumapayag na lakarin ng kamag-anak ang tulong.',
  },
  {
    type: 'proof_of_relationship',
    labelEn: 'Proof of Relationship (PSA Birth / Marriage Cert)',
    labelTl: 'Katunayan ng Relasyon (PSA Birth / Marriage Cert)',
    requiredFor: ['PCSO MAP', 'OWWA'],
    helperEn: 'To establish legitimate kinship between representative and patient.',
    helperTl: 'Katunayan na lehitimong kadugo o asawa ang maglalakad ng papel.',
  },
  {
    type: 'social_case_study',
    labelEn: 'Social Case Study Report (SCSR)',
    labelTl: 'Social Case Study Report (SCSR)',
    requiredFor: ['PAGCOR', 'High Bill Assistance (>₱50k)'],
    helperEn: 'Prepared by a licensed medical social worker (MSS or CSWDO).',
    helperTl: 'Galing sa lisensyadong social worker ng ospital o munisipyo para sa malalaking halaga.',
  },
];

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  onUpdateDocuments,
  patient,
  language,
}) => {
  const t = translations[language];
  const [processingType, setProcessingType] = useState<DocumentType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDoc = (type: DocumentType) => documents.find((d) => d.docType === type);

  const handleFileUpload = async (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingType(type);
    setErrorMessage(null);

    try {
      const standardizedName = getStandardizedDocFileName(patient.lastName, type);
      const result = await convertAndCompressImageToPdf(file, standardizedName);

      const newDoc: StoredDocument = {
        id: `${type}_${Date.now()}`,
        docType: type,
        fileName: result.fileName,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        mimeType: result.mimeType,
        dataUrl: result.dataUrl,
        uploadedAt: new Date().toISOString(),
        isCompliantUnder2MB: result.isCompliantUnder2MB,
      };

      const updated = documents.filter((d) => d.docType !== type).concat(newDoc);
      onUpdateDocuments(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process document';
      setErrorMessage(`Error compressing file: ${msg}`);
    } finally {
      setProcessingType(null);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (type: DocumentType) => {
    const updated = documents.filter((d) => d.docType !== type);
    onUpdateDocuments(updated);
  };

  // Readiness calculations
  const senateReqs: DocumentType[] = [
    'clinical_abstract',
    'statement_of_account',
    'barangay_indigency',
    'patient_valid_id',
    'representative_valid_id',
    'authorization_letter',
  ];
  const pcsoReqs: DocumentType[] = [
    'clinical_abstract',
    'statement_of_account',
    'patient_valid_id',
    'representative_valid_id',
    'authorization_letter',
    'proof_of_relationship',
  ];

  const senateReadyCount = senateReqs.filter((r) => getDoc(r)?.isCompliantUnder2MB).length;
  const pcsoReadyCount = pcsoReqs.filter((r) => getDoc(r)?.isCompliantUnder2MB).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
                CLIENT-SIDE ENGINE
              </span>
              <span className="text-xs text-blue-200">
                Strict PCSO & Senate 2.0MB Limit Enforced
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {language === 'taglish' ? 'Document Vault & Auto-Compressor' : 'Document Vault & Auto-Compressor'}
            </h2>
            <p className="text-sm text-blue-100 max-w-2xl mt-1">
              {language === 'taglish'
                ? 'Mag-upload ng picture mula sa cellphone. Awtomatikong lilinisin, gagawing PDF, at icocompress sa ilalim ng 2MB para hindi ma-reject sa portal ng PCSO at Senado.'
                : 'Upload photos directly from your phone. Our engine auto-converts, cleans, and compresses each document into a high-clarity PDF under 2MB so government portals never reject your upload.'}
            </p>
          </div>

          {/* Readiness Badges */}
          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">Senate Assist Ready</div>
              <div className="text-lg font-black text-amber-300">
                {senateReadyCount} / {senateReqs.length} Documents
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-blue-200 font-medium">PCSO MAP Ready</div>
              <div className="text-lg font-black text-emerald-300">
                {pcsoReadyCount} / {pcsoReqs.length} Documents
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Privacy Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">
            {language === 'taglish' ? '100% Pribado at Ligtas:' : '100% Private & Browser-Secured:'}
          </span>{' '}
          {language === 'taglish'
            ? 'Ang inyong mga medical abstract, billing, at ID ay pinoproseso LAMANG sa inyong browser (Data Privacy Act of 2012). Hindi ito pinapadala o iniimbak sa mga pampublikong cloud server.'
            : 'All medical records and government IDs are converted inside your browser using client-side WebAssembly and Canvas APIs (RA 10173 compliant). Documents are never transmitted to an unvetted cloud server.'}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid of Document Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_SLOTS.map((slot) => {
          const doc = getDoc(slot.type);
          const isProcessing = processingType === slot.type;
          const isUploaded = !!doc;

          return (
            <div
              key={slot.type}
              className={`rounded-2xl border p-5 transition-all ${
                isUploaded
                  ? 'bg-white border-emerald-400 shadow-sm'
                  : 'bg-white border-[#E2DFD6] hover:border-slate-400 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUploaded
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isUploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {language === 'taglish' ? slot.labelTl : slot.labelEn}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {language === 'taglish' ? slot.helperTl : slot.helperEn}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {slot.requiredFor.map((agency) => (
                        <span
                          key={agency}
                          className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700"
                        >
                          {agency}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {isUploaded && (
                  <button
                    onClick={() => handleRemoveDoc(slot.type)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                    title={language === 'taglish' ? 'Alisin ang dokumento' : 'Remove document'}
                    aria-label={language === 'taglish' ? 'Alisin ang dokumento' : 'Remove document'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Uploaded State Details */}
              {isUploaded && doc && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[240px]">
                      {doc.fileName}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {formatBytes(doc.compressedSize)}
                      </span>
                      <span>(from {formatBytes(doc.originalSize)})</span>
                      <span className="text-emerald-700 font-bold">
                        ✓ {t.compliantBadge}
                      </span>
                    </div>
                  </div>

                  <a
                    href={doc.dataUrl}
                    download={doc.fileName}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-blue-50 text-blue-950 hover:bg-blue-100 border border-blue-200 font-bold text-xs transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-800" />
                    <span>{language === 'taglish' ? 'I-download ang PDF' : 'Download PDF'}</span>
                  </a>
                </div>
              )}

              {/* Upload Trigger Button */}
              {!isUploaded && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label htmlFor={`vault-upload-${slot.type}`} className="relative flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 cursor-pointer text-xs font-bold text-blue-950 transition-colors">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
                        <span>{language === 'taglish' ? 'Kino-convert at Kino-compress...' : 'Compressing & Converting to PDF...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-blue-700" />
                        <span>
                          {language === 'taglish' ? 'Pumili ng Larawan o PDF' : 'Select Photo or PDF'}
                        </span>
                      </>
                    )}
                    <input
                      id={`vault-upload-${slot.type}`}
                      name={`vault-upload-${slot.type}`}
                      type="file"
                      accept="image/*,application/pdf"
                      aria-label={language === 'taglish' ? `I-upload ang ${slot.labelTl}` : `Upload ${slot.labelEn}`}
                      disabled={isProcessing}
                      onChange={(e) => handleFileUpload(slot.type, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pro-Tips Checklist Footer */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2DFD6] shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>
            {language === 'taglish'
              ? 'Paano masigurong 100% Ma-a-approve ang mga Dokumento:'
              : 'How to Ensure 100% Document Approval:'}
          </span>
        </div>
        <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-slate-900">Doctor’s License & PTR Number:</strong> Karaniwang nare-reject ang Medical Abstract kapag walang pirma at License Number ng attending physician.
          </li>
          <li>
            <strong className="text-slate-900">PhilHealth Deduction on SOA:</strong> Humingi ng updated Statement of Account kung saan bawas na ang PhilHealth Case Rates.
          </li>
          <li>
            <strong className="text-slate-900">Barangay Indigency:</strong> Tiyaking tugma ang pangalan ng pasyente o kinatawan sa nakalagay sa sedula o Valid ID.
          </li>
        </ul>
      </div>
    </div>
  );
};
