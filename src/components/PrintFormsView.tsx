'use client';

import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicPaperMat } from '@/components/shared/civicStyles';

import React, { useState, useCallback, useRef } from 'react';
import {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
  StoredDocument,
  ApplicationRecord,
} from '@/types/assistance';
import { Language } from '@/lib/i18n';
import { GLCooldownTrackerCard } from '@/components/triage/GLCooldownTrackerCard';
import { TreatmentQuotaTrackerCard } from '@/components/triage/TreatmentQuotaTrackerCard';
import { MedicalPrintableSheets } from '@/components/triage/MedicalPrintableSheets';
import {
  generateMalasakitFormPdf,
  generateDSWDIntakePdf,
  generateChecklistCoverSheetPdf,
  generateCompleteHospitalPacketPdf,
  printPdfDocument,
} from '@/lib/pdfGenerator';
import {
  Printer,
  Download,
  FileCheck,
  FileText,
  Files,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Building,
  ChevronDown,
  ChevronUp,
  Upload,
  RefreshCw,
  Trash2,
  FolderCheck,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import {
  convertAndCompressImageToPdf,
  formatBytes,
  getStandardizedDocFileName,
} from '@/lib/compressor';
import { getWipeGeneration, saveDocuments } from '@/lib/storage';
import { DocumentType } from '@/types/assistance';

interface PrintFormsViewProps {
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  documents: StoredDocument[];
  onUpdatePatient: (updated: PatientProfile) => void;
  onUpdateMedicalCase: (updated: MedicalCase) => void;
  onUpdateDocuments?: (updated: StoredDocument[]) => void;
  applications?: ApplicationRecord[];
  onSaveApplications?: (apps: ApplicationRecord[]) => void;
  language: Language;
}

interface PrepRequirement {
  type: DocumentType;
  labelEn: string;
  labelTl: string;
  helperEn: string;
  helperTl: string;
}

const PREP_REQUIREMENTS: PrepRequirement[] = [
  {
    type: 'clinical_abstract',
    labelEn: 'Medical Certificate / Clinical Abstract',
    labelTl: 'Medical Certificate / Clinical Abstract',
    helperEn: 'Signed by attending physician with License & PTR numbers.',
    helperTl: 'May pirma ng doktor, License Number, at PTR number.',
  },
  {
    type: 'statement_of_account',
    labelEn: 'Hospital Bill / Statement of Account (SOA)',
    labelTl: 'Hospital Bill / Statement of Account (SOA)',
    helperEn: 'Latest running bill or final SOA reflecting PhilHealth deductions.',
    helperTl: 'Running bill o pinal na SOA na may bawas na ng PhilHealth.',
  },
  {
    type: 'barangay_indigency',
    labelEn: 'Barangay Certificate of Indigency',
    labelTl: 'Barangay Certificate of Indigency',
    helperEn: 'Issued for medical assistance purpose matching patient/claimant name.',
    helperTl: 'Para sa layunin ng Medical Assistance; tugma ang pangalan.',
  },
  {
    type: 'patient_valid_id',
    labelEn: 'Valid Government ID (Patient / Representative)',
    labelTl: 'Valid ID ng Pasyente o Kinatawan',
    helperEn: 'PhilSys National ID, UMID, Driver’s License, Senior Citizen ID, or Passport.',
    helperTl: 'National ID, UMID, Driver’s License, Senior ID, Voter’s, o Passport.',
  },
];

type SelectedForm = 'complete_packet' | 'malasakit' | 'dswd' | 'checklist' | 'prescription_checklist';

export const PrintFormsView: React.FC<PrintFormsViewProps> = ({
  patient,
  representative,
  medicalCase,
  documents,
  onUpdatePatient,
  onUpdateMedicalCase,
  onUpdateDocuments,
  applications = [],
  onSaveApplications,
  language,
}) => {
  const [selectedForm, setSelectedForm] = useState<SelectedForm>('complete_packet');
  const isPrescriptionChecklist = selectedForm === 'prescription_checklist';
  const [includeVaultAttachments, setIncludeVaultAttachments] = useState(true);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  }, []);

  // Document Requirement Preparation State
  const [showDocDrawer, setShowDocDrawer] = useState(true);
  const [processingDocType, setProcessingDocType] = useState<DocumentType | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const uploadRequestRef = useRef(0);

  const getDoc = (type: DocumentType) => documents.find((d) => d.docType === type);

  const handleFileUpload = useCallback(
    async (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const uploadGeneration = getWipeGeneration();
      const uploadRequest = ++uploadRequestRef.current;

      setProcessingDocType(type);
      setCompressionError(null);

      try {
        const standardizedName = getStandardizedDocFileName(patient.lastName || 'Applicant', type);
        const result = await convertAndCompressImageToPdf(file, standardizedName);
        if (getWipeGeneration() !== uploadGeneration) {
          if (result.dataUrl.startsWith('blob:')) URL.revokeObjectURL(result.dataUrl);
          return;
        }

        const newDoc: StoredDocument = {
          id: `${type}_${Date.now()}`,
          docType: type,
          fileName: result.fileName,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          mimeType: result.mimeType,
          dataUrl: result.dataUrl,
          attachmentDataUrl: result.attachmentDataUrl,
          uploadedAt: new Date().toISOString(),
          isCompliantUnder2MB: result.isCompliantUnder2MB,
        };

        const updated = documents.filter((d) => d.docType !== type).concat(newDoc);
        if (onUpdateDocuments) {
          onUpdateDocuments(updated);
        }
        await saveDocuments(updated, uploadGeneration);
        if (getWipeGeneration() !== uploadGeneration) return;
        triggerToast(
          language === 'taglish'
            ? `Na-compress at naidagdag ang ${result.fileName} (${formatBytes(result.compressedSize)})!`
            : `Compressed & saved ${result.fileName} (${formatBytes(result.compressedSize)})!`
        );
      } catch (err: unknown) {
        if (getWipeGeneration() !== uploadGeneration) return;
        const msg = err instanceof Error ? err.message : 'Nabigong i-compress ang file';
        setCompressionError(msg);
      } finally {
        if (uploadRequestRef.current === uploadRequest) setProcessingDocType(null);
        e.target.value = '';
      }
    },
    [patient.lastName, documents, onUpdateDocuments, language, triggerToast]
  );

  const handleRemoveDoc = async (type: DocumentType) => {
    const updated = documents.filter((d) => d.docType !== type);
    if (onUpdateDocuments) {
      onUpdateDocuments(updated);
    }
    await saveDocuments(updated);
    triggerToast(
      language === 'taglish' ? 'Naalis na ang dokumento.' : 'Document removed.'
    );
  };

  const hasName = Boolean(patient.lastName?.trim() || patient.firstName?.trim());
  const fullName = hasName
    ? `${patient.lastName || ''}, ${patient.firstName || ''} ${patient.middleName || ''}`.trim().replace(/^,\s*/, '')
    : 'Dela Cruz, Juan';
  const applicantName = representative.isPatientHimself
    ? fullName
    : representative.fullName || 'Juan Dela Cruz (Kinatawan)';

  const availableVaultDocs = documents.filter((document) => document.isCompliantUnder2MB && document.attachmentDataUrl);

  const handleDownload = async () => {
    if (isPrescriptionChecklist) {
      window.print();
      return;
    }

    setIsGenerating(true);
    try {
      const cleanPatientName = (patient.lastName || 'Applicant').replace(/[^a-zA-Z0-9]/g, '');

      if (selectedForm === 'complete_packet') {
        const doc = await generateCompleteHospitalPacketPdf(
          patient,
          representative,
          medicalCase,
          documents,
          includeVaultAttachments
        );
        doc.save(`TulongPH_HospitalDeskPacket_${cleanPatientName}.pdf`);
        triggerToast('Na-download na ang Kumpletong Hospital Packet PDF!');
      } else if (selectedForm === 'malasakit') {
        const doc = await generateMalasakitFormPdf(patient, representative, medicalCase);
        doc.save(`Malasakit_Unified_Form_${cleanPatientName}.pdf`);
        triggerToast('Na-download na ang Malasakit Unified Intake Form!');
      } else if (selectedForm === 'dswd') {
        const doc = await generateDSWDIntakePdf(patient, representative, medicalCase);
        doc.save(`DSWD_AICS_GeneralIntake_${cleanPatientName}.pdf`);
        triggerToast('Na-download na ang DSWD AICS General Intake Sheet!');
      } else {
        const doc = await generateChecklistCoverSheetPdf(patient, representative, medicalCase, documents);
        doc.save(`Hospital_Desk_Checklist_${cleanPatientName}.pdf`);
        triggerToast('Na-download na ang Hospital Checklist Cover Sheet!');
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectPrint = async () => {
    if (isPrescriptionChecklist) {
      window.print();
      return;
    }

    setIsGenerating(true);
    try {
      if (selectedForm === 'complete_packet') {
        const doc = await generateCompleteHospitalPacketPdf(
          patient,
          representative,
          medicalCase,
          documents,
          includeVaultAttachments
        );
        printPdfDocument(doc);
      } else if (selectedForm === 'malasakit') {
        const doc = await generateMalasakitFormPdf(patient, representative, medicalCase);
        printPdfDocument(doc);
      } else if (selectedForm === 'dswd') {
        const doc = await generateDSWDIntakePdf(patient, representative, medicalCase);
        printPdfDocument(doc);
      } else {
        const doc = await generateChecklistCoverSheetPdf(patient, representative, medicalCase, documents);
        printPdfDocument(doc);
      }
      triggerToast('Binubuksan ang print dialog...');
    } catch (err) {
      console.error('Direct Print Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToRelatives = async () => {
    if (isPrescriptionChecklist) return;

    setIsGenerating(true);
    const cleanPatientName = (patient.lastName || 'Applicant').replace(/[^a-zA-Z0-9]/g, '');
    const patientDisplay = fullName || 'Pasyente';
    const hospitalDisplay = medicalCase.hospitalName || 'Pampublikong Ospital';
    const diagnosisDisplay = medicalCase.diagnosis || 'Medikal na Kasong Pang-ayuda';
    const balanceDisplay = `₱${medicalCase.netRemainingBalance.toLocaleString()}`;

    const shareTitle = `TulongPH Form & Checklist - ${patientDisplay}`;
    const shareMessage = `📋 TULONGPH CHECKLIST AT GABAY SA PAG-FILE NG TULONG MEDIKAL
Para kay: ${patientDisplay}
Ospital: ${hospitalDisplay}
Diagnosis: ${diagnosisDisplay}
Balanse sa Bill: ${balanceDisplay}

Mga Kailangang Dalhin sa Malasakit / DSWD Desk:
1. 📄 Original Medical Certificate / Clinical Abstract (May pirma ng doktor at PRC License)
2. 🏥 Hospital Bill / Statement of Account (SOA) na may PhilHealth bawas
3. 🏛️ Barangay Certificate of Indigency (Para sa Medical Assistance)
4. 🪪 Valid ID ng Pasyente at Kinatawan (May 3 pirma sa photocopy)

Paalala: 100% LIBRE ang tulong mula sa gobyerno (DOH-MAIP, PCSO, DSWD). Walang kailangang bayaran sa fixer.`;

    try {
      // 1. Generate active PDF document
      let doc;
      let fileName = '';

      if (selectedForm === 'complete_packet') {
        doc = await generateCompleteHospitalPacketPdf(
          patient,
          representative,
          medicalCase,
          documents,
          includeVaultAttachments
        );
        fileName = `TulongPH_HospitalDeskPacket_${cleanPatientName}.pdf`;
      } else if (selectedForm === 'malasakit') {
        doc = await generateMalasakitFormPdf(patient, representative, medicalCase);
        fileName = `Malasakit_Unified_Form_${cleanPatientName}.pdf`;
      } else if (selectedForm === 'dswd') {
        doc = await generateDSWDIntakePdf(patient, representative, medicalCase);
        fileName = `DSWD_AICS_GeneralIntake_${cleanPatientName}.pdf`;
      } else {
        doc = await generateChecklistCoverSheetPdf(patient, representative, medicalCase, documents);
        fileName = `Hospital_Desk_Checklist_${cleanPatientName}.pdf`;
      }

      // 2. Native Web Share check
      if (typeof navigator !== 'undefined' && navigator.share) {
        let sharedFile = false;
        try {
          const pdfBlob = doc.output('blob');
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              files: [pdfFile],
              title: shareTitle,
              text: shareMessage,
            });
            sharedFile = true;
            triggerToast(
              language === 'taglish'
                ? 'Na-share ang PDF at checklist sa inyong kamag-anak!'
                : 'Shared PDF & checklist with family members!'
            );
            return;
          }
        } catch (shareFileErr: unknown) {
          if (shareFileErr instanceof Error && shareFileErr.name === 'AbortError') {
            return;
          }
          console.warn('File share attempt skipped or failed, falling back to text share/clipboard:', shareFileErr);
        }

        if (!sharedFile) {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareMessage,
              url: typeof window !== 'undefined' ? window.location.href : undefined,
            });
            triggerToast(
              language === 'taglish'
                ? 'Na-share ang buod at checklist sa inyong kamag-anak!'
                : 'Shared summary & checklist with family members!'
            );
            return;
          } catch (textShareErr: unknown) {
            if (textShareErr instanceof Error && textShareErr.name === 'AbortError') {
              return;
            }
            console.warn('Text share failed, falling back to clipboard:', textShareErr);
          }
        }
      }

      // 3. Fallback for non-share browsers / desktop: copy checklist to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
        triggerToast(
          language === 'taglish'
            ? 'Nakopya sa clipboard ang requirements! Handa nang i-paste sa Viber o Messenger.'
            : 'Checklist copied to clipboard! Ready to paste into Viber or Messenger.'
        );
      } else {
        triggerToast(
          language === 'taglish'
            ? 'Na-generate na ang form para sa pag-share.'
            : 'Form generated successfully.'
        );
      }
    } catch (err) {
      console.error('Share Error:', err);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareMessage);
          triggerToast(
            language === 'taglish'
              ? 'Nakopya sa clipboard ang buod ng requirements!'
              : 'Requirements summary copied to clipboard!'
          );
        } catch {
          // ignore
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={isPrescriptionChecklist ? 'print:hidden' : ''}>
      <CivicViewHeader
        icon={Printer}
        badge={isPrescriptionChecklist
          ? language === 'taglish' ? 'Matipid sa tinta na checklist' : language === 'cebuano' ? 'Checklist nga gamay og tinta' : language === 'ilocano' ? 'Checklist a makurtian iti tinta' : 'Low-ink checklist'
          : language === 'taglish' ? 'Print-Ready para sa Pisonet & Computer Shop' : 'Print-Ready for Computer Shops'}
        title={isPrescriptionChecklist
          ? language === 'taglish' ? 'Checklist ng Reseta' : language === 'cebuano' ? 'Checklist sa Reseta' : language === 'ilocano' ? 'Checklist ti Reseta' : 'Prescription Checklist'
          : language === 'taglish' ? 'I-print ang mga Opisyal na Form' : 'Printable Hospital Packets & Forms'}
        description={isPrescriptionChecklist
          ? language === 'taglish' ? 'Isang malinis at low-ink na checklist na puwedeng i-print at dalhin sa doktor o parmasyutiko.' : language === 'cebuano' ? 'Usa ka limpyo ug tipid-og-tinta nga checklist nga maimprinta ug madala sa doktor o pharmacist.' : language === 'ilocano' ? 'Nalinis ken makurtian iti tinta a checklist a mabalin nga i-print ken iyeg iti doktor wenno parmasista.' : 'A clean, low-ink checklist to print and bring to a doctor or pharmacist.'
          : language === 'taglish' ? 'Pre-filled na Malasakit Unified Intake Sheet (RA 11463), DSWD AICS Form, at Checklist Cover Sheet na handang dalhin sa Social Worker Desk ng ospital.' : 'Pre-filled official Malasakit Center Intake Sheet (RA 11463), DSWD AICS Form, and Hospital Checklist ready for submission at hospital social service desks.'}
        actions={
<div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleDirectPrint}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>
                {isPrescriptionChecklist
                  ? language === 'taglish'
                    ? 'I-print ang Checklist'
                    : language === 'cebuano'
                      ? 'I-print ang Checklist'
                      : language === 'ilocano'
                        ? 'I-print ti Checklist'
                        : 'Print checklist'
                  : language === 'taglish' ? 'I-print ang Form' : 'Print Form'}
              </span>
            </button>
            {!isPrescriptionChecklist && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-4 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>{isGenerating ? (language === 'taglish' ? 'Ginagawa...' : 'Generating...') : (language === 'taglish' ? 'I-download ang PDF' : 'Download PDF')}</span>
                </button>
                <button
                  onClick={handleShareToRelatives}
                  disabled={isGenerating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title={language === 'taglish' ? 'I-share sa Kamag-anak (Viber / Messenger)' : 'Share to Relatives (Viber / Messenger)'}
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>{language === 'taglish' ? 'I-share (Viber/Messenger)' : 'Share (Viber/Messenger)'}</span>
                </button>
              </>
            )}
          </div>
      }>
        <GLCooldownTrackerCard
          medicalCase={medicalCase}
          applications={applications}
          onSaveApplications={onSaveApplications}
          language={language}
        />

        {/* Printer Optimization & Public PC Advice */}
        <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>
              {language === 'taglish'
                ? 'Black & White / Monochrome Optimized: Matipid sa tinta at madaling i-print sa Pisonet o computer shop.'
                : 'Black & White / Monochrome Optimized: High-contrast layouts save ink on computer shop printers.'}
            </p>
            <p>
              {language === 'taglish'
                ? 'Payo sa Pisonet / Computer Shop: Piliin ang "I-print ang Form" upang walang maiwang PDF sa Downloads folder ng publikong computer.'
                : 'Public PC Privacy Tip: Choose "Print Form" to avoid leaving a PDF in the shared computer’s Downloads folder.'}
            </p>
          </div>
        </div>
      </CivicViewHeader>

      {!isPrescriptionChecklist && <TreatmentQuotaTrackerCard medicalCase={medicalCase} language={language} readOnly />}

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Form Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-[#E2DFD6] shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setSelectedForm('complete_packet')}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedForm === 'complete_packet'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Files className="w-4 h-4 shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">{language === 'taglish' ? 'Kumpletong Packet (3-in-1)' : 'Complete Packet'}</span>
          </button>

          <button
            onClick={() => setSelectedForm('malasakit')}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedForm === 'malasakit'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">Malasakit Unified Form</span>
          </button>

          <button
            onClick={() => setSelectedForm('dswd')}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedForm === 'dswd'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">DSWD AICS Intake Sheet</span>
          </button>

          <button
            onClick={() => setSelectedForm('checklist')}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedForm === 'checklist'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">{language === 'taglish' ? 'Checklist Cover Sheet' : 'Filing Checklist'}</span>
          </button>
          <button
            onClick={() => setSelectedForm('prescription_checklist')}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isPrescriptionChecklist
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">
              {language === 'taglish' ? 'Checklist ng Reseta' : language === 'cebuano' ? 'Checklist sa Reseta' : language === 'ilocano' ? 'Checklist ti Reseta' : 'Prescription Checklist'}
            </span>
          </button>
        </div>
      </div>

      {/* Integrated Document Requirement Preparation & Quick Upload Drawer */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 border border-blue-100">
              <FolderCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'taglish'
                    ? 'Paghahanda at Compression ng mga Kalakip na Dokumento'
                    : 'Document Requirement Preparation & Compression'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  PREP_REQUIREMENTS.filter((req) => getDoc(req.type)?.isCompliantUnder2MB).length === PREP_REQUIREMENTS.length
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-950'
                }`}>
                  {PREP_REQUIREMENTS.filter((req) => getDoc(req.type)?.isCompliantUnder2MB).length} / {PREP_REQUIREMENTS.length} {language === 'taglish' ? 'Handa na' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'taglish'
                  ? 'I-verify at i-compress ang Medical Certificate, Hospital Bill, Barangay Indigency, at Valid ID bago i-print ang packet.'
                  : 'Verify and auto-compress Medical Certificate, Hospital Bill, Barangay Indigency, and Valid ID before printing.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDocDrawer(!showDocDrawer)}
            className="min-h-[44px] h-11 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl border border-[#E2DFD6] hover:border-slate-400 bg-[#FAF8F5] hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors shrink-0"
          >
            <span>
              {showDocDrawer
                ? language === 'taglish' ? 'Itago ang Drawer' : 'Hide Drawer'
                : language === 'taglish' ? 'Buksan ang Upload Drawer' : 'Open Upload Drawer'}
            </span>
            {showDocDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {compressionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{compressionError}</span>
          </div>
        )}

        {showDocDrawer && (
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {PREP_REQUIREMENTS.map((req) => {
              const doc = getDoc(req.type);
              const isUploaded = !!doc;
              const isProcessing = processingDocType === req.type;

              return (
                <div
                  key={req.type}
                  className={`rounded-2xl border p-4 transition-all ${
                    isUploaded
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-[#FAF8F5] border-[#E2DFD6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isUploaded
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isUploaded ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {language === 'taglish' ? req.labelTl : req.labelEn}
                          </span>
                          {isUploaded ? (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                              ✓ {language === 'taglish' ? 'Nakalakip' : 'Attached'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-950">
                              {language === 'taglish' ? 'Kailangan' : 'Required'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {language === 'taglish' ? req.helperTl : req.helperEn}
                        </p>
                      </div>
                    </div>

                    {isUploaded && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(req.type)}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                        title={language === 'taglish' ? 'Alisin ang dokumento' : 'Remove document'}
                        aria-label={language === 'taglish' ? 'Alisin ang dokumento' : 'Remove document'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Attached file details */}
                  {isUploaded && doc && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                      <div className="truncate text-slate-800 max-w-[170px] sm:max-w-[220px]">
                        <span className="font-semibold block truncate text-xs">{doc.fileName}</span>
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-100/80 px-1 rounded">
                          {formatBytes(doc.compressedSize)} (✓ &lt;2MB PDF)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={doc.dataUrl}
                          download={doc.fileName}
                          className="min-h-[44px] px-3.5 inline-flex items-center justify-center gap-1 rounded-xl bg-white border border-emerald-300 text-emerald-950 hover:bg-emerald-100 font-bold text-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-800" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Direct upload dropzone */}
                  {!isUploaded && (
                    <div className="mt-3 pt-2 border-t border-[#E2DFD6]">
                      <label htmlFor={`print-upload-${req.type}`} className="relative flex items-center justify-center gap-2 w-full min-h-[44px] py-2 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 cursor-pointer text-xs font-bold text-blue-950 transition-colors">
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
                            <span>{language === 'taglish' ? 'Kino-convert at Kino-compress...' : 'Compressing to PDF...'}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-blue-700" />
                            <span>{language === 'taglish' ? 'Pumili ng larawan para i-compress' : 'Upload and compress an image'}</span>
                          </>
                        )}
                        <input
                          autoComplete="off"
                          id={`print-upload-${req.type}`}
                          name={`upload-${req.type}`}
                          type="file"
                          accept="image/*"
                          aria-label={language === 'taglish' ? `I-upload ang ${req.labelTl}` : `Upload ${req.labelEn}`}
                          disabled={isProcessing}
                          onChange={(e) => handleFileUpload(req.type, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Packet Options & Quick Edit Accordion */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Vault merge toggle */}
          {selectedForm === 'complete_packet' && (
            <label htmlFor="merge-vault-attachments" className="inline-flex items-center min-h-[44px] py-1 gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                autoComplete="off"
                id="merge-vault-attachments"
                name="includeVaultAttachments"
                type="checkbox"
                checked={includeVaultAttachments}
                onChange={(e) => setIncludeVaultAttachments(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>
                {language === 'taglish'
                  ? `Isama sa dulo ng PDF ang ${availableVaultDocs.length} naka-upload na litrato/dokumento sa Vault`
                  : `Append ${availableVaultDocs.length} uploaded Vault documents to PDF bundle`}
              </span>
            </label>
          )}

          {/* Toggle Quick Edit Panel */}
          <button
            onClick={() => setShowQuickEdit(!showQuickEdit)}
            className="min-h-[44px] h-11 inline-flex items-center gap-1.5 px-3 rounded-xl border border-transparent hover:border-slate-200 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>
              {showQuickEdit
                ? language === 'taglish' ? 'Itago ang Quick Edit' : 'Hide Quick Edit'
                : language === 'taglish' ? 'Mabilisang Baguhin ang mga Detalye (Quick Edit)' : 'Quick Edit Form Details'}
            </span>
            {showQuickEdit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Edit Drawer */}
        {showQuickEdit && (
          <form
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
            className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#FAF8F5] p-4 rounded-xl border border-[#E2DFD6]"
          >
            <div>
              <label htmlFor="quick-edit-last-name" className="block text-xs font-bold text-slate-800 mb-1">Apelyido (Last Name)</label>
              <input
                id="quick-edit-last-name"
                name="lastName"
                type="text"
                autoComplete="off"
                value={patient.lastName}
                onChange={(e) => onUpdatePatient({ ...patient, lastName: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="Dela Cruz"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-first-name" className="block text-xs font-bold text-slate-800 mb-1">Pangalan (First Name)</label>
              <input
                id="quick-edit-first-name"
                name="firstName"
                type="text"
                autoComplete="off"
                value={patient.firstName}
                onChange={(e) => onUpdatePatient({ ...patient, firstName: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="Juan"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-philhealth" className="block text-xs font-bold text-slate-800 mb-1">PhilHealth PIN</label>
              <input
                id="quick-edit-philhealth"
                name="philhealthPIN"
                type="text"
                autoComplete="off"
                inputMode="numeric"
                maxLength={12}
                value={patient.philhealthNumber || ''}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 12);
                  onUpdatePatient({ ...patient, philhealthNumber: onlyNums });
                }}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="123456789012"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-hospital-name" className="block text-xs font-bold text-slate-800 mb-1">Pangalan ng Ospital</label>
              <input
                id="quick-edit-hospital-name"
                name="hospitalName"
                type="text"
                autoComplete="off"
                value={medicalCase.hospitalName}
                onChange={(e) => onUpdateMedicalCase({ ...medicalCase, hospitalName: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="Philippine General Hospital"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-diagnosis" className="block text-xs font-bold text-slate-800 mb-1">Medikal na Diagnosis</label>
              <input
                id="quick-edit-diagnosis"
                name="diagnosis"
                type="text"
                autoComplete="off"
                value={medicalCase.diagnosis}
                onChange={(e) => onUpdateMedicalCase({ ...medicalCase, diagnosis: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="Hal. Acute Coronary Syndrome"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-physician" className="block text-xs font-bold text-slate-800 mb-1">Attending Physician (Doktor)</label>
              <input
                id="quick-edit-physician"
                name="physician"
                type="text"
                autoComplete="off"
                value={medicalCase.attendingPhysician}
                onChange={(e) => onUpdateMedicalCase({ ...medicalCase, attendingPhysician: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="Dr. Maria Santos, MD"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-total-bill" className="block text-xs font-bold text-slate-800 mb-1">Kabuuang Bill (Gross ₱)</label>
              <input
                id="quick-edit-total-bill"
                name="totalBill"
                type="number"
                autoComplete="off"
                value={medicalCase.totalHospitalBill}
                onChange={(e) => {
                  const gross = Number(e.target.value);
                  const net = Math.max(0, gross - medicalCase.philhealthDeduction - medicalCase.seniorPwdDiscount);
                  onUpdateMedicalCase({ ...medicalCase, totalHospitalBill: gross, netRemainingBalance: net });
                }}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="quick-edit-net-balance" className="block text-xs font-bold text-slate-800 mb-1">Netong Balanse (₱)</label>
              <input
                id="quick-edit-net-balance"
                name="netBalance"
                type="number"
                autoComplete="off"
                value={medicalCase.netRemainingBalance}
                onChange={(e) => onUpdateMedicalCase({ ...medicalCase, netRemainingBalance: Number(e.target.value) })}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        )}
      </div>
      </div>

      {/* LIVE PAPER PREVIEW CONTAINER */}
      <div className={`${civicPaperMat} flex flex-col items-center`}>
        <div className={`w-full max-w-3xl flex items-center justify-between mb-3 text-xs font-bold text-slate-600 px-1 ${isPrescriptionChecklist ? 'print:hidden' : ''}`}>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>
              {isPrescriptionChecklist
                ? language === 'taglish' ? 'Preview: Checklist ng Reseta' : language === 'cebuano' ? 'Preview: Checklist sa Reseta' : language === 'ilocano' ? 'Preview: Checklist ti Reseta' : 'Preview: Prescription Checklist'
                : selectedForm === 'complete_packet'
                ? 'Preview: Hospital Desk Submission Packet'
                : selectedForm === 'malasakit'
                ? 'Preview: Malasakit Center Unified Intake Sheet (RA 11463)'
                : selectedForm === 'dswd'
                ? 'Preview: DSWD AICS General Intake Sheet'
                : 'Preview: Filing Checklist & Cover Sheet'}
            </span>
          </div>
          <span className="text-xs bg-white px-2 py-0.5 rounded-lg border border-[#E2DFD6] shadow-2xs font-semibold text-slate-700">
            Standard A4 • Monochrome Print
          </span>
        </div>

        <MedicalPrintableSheets
          selectedForm={selectedForm}
          patient={patient}
          medicalCase={medicalCase}
          documents={documents}
          fullName={fullName}
          applicantName={applicantName}
          language={language}
        />
      </div>

      {/* Prominent Bottom Action Bar */}
      {!isPrescriptionChecklist && <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E2DFD6] shadow-xs">
        <div className="text-xs text-slate-700 font-medium">
          <strong className="text-slate-900 block font-bold text-sm">
            {language === 'taglish' ? 'Handa na bang mag-print ng dokumento?' : 'Ready to Print & Submit?'}
          </strong>
          <span>
            {language === 'taglish'
              ? 'Maaaring i-print sa computer shop malapit sa ospital o i-save ang PDF sa inyong cellphone.'
              : 'Print directly at computer shops near the hospital or download the PDF packet to your device.'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDirectPrint}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{language === 'taglish' ? 'I-print ang Form' : 'Print Form'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-4 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>{isGenerating ? (language === 'taglish' ? 'Ginagawa...' : 'Generating...') : (language === 'taglish' ? 'I-download ang PDF' : 'Download PDF')}</span>
          </button>
          <button
            onClick={handleShareToRelatives}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title={
              language === 'taglish'
                ? 'I-share sa Kamag-anak (Viber / Messenger)'
                : 'Share to Relatives (Viber / Messenger)'
            }
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>
              {language === 'taglish'
                ? 'I-share sa Kamag-anak (Viber / Messenger)'
                : 'Share to Relatives (Viber / Messenger)'}
            </span>
          </button>
        </div>
      </div>}
    </div>
  );
};
