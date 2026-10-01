'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
} from '@/types/assistance';
import { Language, translations } from '@/lib/i18n';

interface PACEAssistantProps {
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  language: Language;
}

export const PACEAssistant: React.FC<PACEAssistantProps> = ({
  patient,
  representative,
  medicalCase,
  language,
}) => {
  const isTl = language === 'taglish';
  const [copied, setCopied] = useState(false);

  const patientFullName = `${patient.firstName} ${patient.middleName} ${patient.lastName}`.trim();
  const representativeName = representative.isPatientHimself
    ? patientFullName
    : representative.fullName;

  const relationshipLabel = representative.isPatientHimself
    ? (isTl ? 'aking sarili' : 'myself')
    : representative.relationshipToPatient;

  // Formal letter addressed to the President of the Philippines
  const letterTaglish = `Kagalang-galang na Pangulo ng Republika ng Pilipinas
Presidential Action Center (PACe)
Mabini Hall, Malacañang Complex
J.P. Laurel St., San Miguel, Maynila

Mahal na Pangulo:

Ako po si ${representativeName}, naninirahan sa ${patient.address.barangay || 'aming barangay'}, ${patient.address.cityMunicipality || 'aming lungsod'}, ${patient.address.province || ''}, ay buong-pagpapakumbabang lumalapit sa inyong butihing tanggapan sa Presidential Action Center (PACe) upang humiling ng tulong medikal sa pamamagitan ng Guarantee Letter (GL) para sa aking ${relationshipLabel} na si ${patientFullName}.

Ang pasyente po ay kasalukuyang sumasailalim sa gamutan sa ${medicalCase.hospitalName || 'ospital'} dahil sa ${medicalCase.diagnosis || 'karamdaman'}. Ang aming natitirang babayarin sa ospital matapos maibawas ang PhilHealth ay humigit-kumulang ₱${medicalCase.netRemainingBalance.toLocaleString()} (mula sa kabuuang bill na ₱${medicalCase.totalHospitalBill.toLocaleString()}).

Dahil po sa labis na kakapusan sa pananalapi at mataas na gastusin sa operasyon at gamutan, naubos na po ang limitasyon ng aming lokal na pondo sa Malasakit Center. Kalakip po ng liham na ito ang Certified Medical Abstract, Running Statement of Account mula sa ospital, Social Case Study Report mula sa aming MSWDO, at patunay ng aming pagkakakilanlan.

Umaasa po kami sa inyong malasakit at tulong upang maipagpatuloy ang pagpapagaling ng pasyente. Maraming salamat po sa inyong tapat na paglilingkod sa bayang Pilipino.

Gumagalang,

${representativeName}
Contact Number: ${representative.contactNumber || patient.contactNumber}
Email: ${representative.email || patient.email || 'N/A'}`;

  const letterEnglish = `His Excellency, The President of the Republic of the Philippines
Through: Presidential Action Center (PACe)
Mabini Hall, Malacañang Complex
J.P. Laurel St., San Miguel, Manila

Dear Mr. President:

I am writing to humbly request financial and medical assistance through a Guarantee Letter (GL) from the Presidential Action Center (PACe) on behalf of my ${relationshipLabel}, ${patientFullName}.

The patient is currently admitted at ${medicalCase.hospitalName || 'the hospital'} diagnosed with ${medicalCase.diagnosis || 'medical illness'}. Our remaining hospital balance after initial PhilHealth case rate deductions stands at approximately ₱${medicalCase.netRemainingBalance.toLocaleString()} (out of a total hospital bill of ₱${medicalCase.totalHospitalBill.toLocaleString()}).

Due to extreme financial incapacity and catastrophic medical costs, our family has exhausted available in-hospital assistance. Attached to this letter are the Certified Medical Abstract, Running Statement of Account, Social Case Study Report (SCSR) issued by our City/Municipal Social Welfare and Development Office, and our valid government identification.

We earnestly appeal to your compassion and good office to help shoulder this medical deficit. Thank you very much for your leadership and dedicated public service.

Respectfully yours,

${representativeName}
Contact Number: ${representative.contactNumber || patient.contactNumber}
Email: ${representative.email || patient.email || 'N/A'}`;

  const requestLetter = isTl ? letterTaglish : letterEnglish;

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(requestLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoSubject = encodeURIComponent(
    `Medical Assistance Request - ${patientFullName} (${medicalCase.hospitalName || 'Hospital'})`
  );
  const mailtoBody = encodeURIComponent(requestLetter);
  const mailtoUrl = `mailto:pace@op.gov.ph?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-200">
            <Landmark className="w-3.5 h-3.5 text-amber-800" />
            <span>{isTl ? 'Tanggapan ng Pangulo ng Pilipinas' : 'Office of the President of the Philippines'}</span>
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {isTl ? 'Para sa mga Bill na ₱50,000 pataas' : 'Recommended for bills ₱50,000 and above'}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isTl
            ? 'Presidential Action Center (PACe) Assistance Toolkit'
            : 'Presidential Action Center (PACe) Assistance Toolkit'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
          {isTl
            ? 'Ang PACe ang pinakamataas na sandigan kapag umabot sa daang-libo o milyon ang hospital bill para sa open heart surgery, organ transplant, ICU, cancer, o mamahaling operasyon na hindi na kayang sagutin nang buo ng Malasakit at PCSO.'
            : 'PACe is the highest executive lifeline for catastrophic six-to-seven-figure hospital bills, organ transplants, open-heart procedures, ICU confinement, and costly treatments exceeding hospital Malasakit and PCSO caps.'}
        </p>
      </div>

      {/* Official Contact & Filing Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2DFD6] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <Mail className="w-4 h-4 text-blue-700" />
            <span>{isTl ? 'Email Filing (Online)' : 'Online Email Filing'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isTl
              ? 'Ipadala ang liham at PDF attachments sa opisyal na email:'
              : 'Transmit formal request letter and PDF proofs to:'}
          </p>
          <a
            href={mailtoUrl}
            className="text-xs font-bold text-blue-900 underline block break-all hover:text-blue-700"
          >
            pace@op.gov.ph
          </a>
        </div>

        <div className="bg-white border border-[#E2DFD6] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Phone className="w-4 h-4 text-slate-700" />
            <span>{isTl ? 'Hotline & Follow-up' : 'Hotline & Tracking'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isTl ? 'Para sa status at verification ng Guarantee Letter:' : 'Direct inquiries and Guarantee Letter verification:'}
          </p>
          <div className="text-xs font-bold text-slate-900">
            (02) 8249-8310 <span className="text-slate-500 font-medium">loc. 8174 / 8175</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2DFD6] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <MapPin className="w-4 h-4 text-slate-700" />
            <span>{isTl ? 'Physical Walk-In' : 'Physical Submission'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            PACe Building, Malacañang Complex, J.P. Laurel St., San Miguel, Maynila (Lunes-Biyernes, 8AM - 5PM).
          </p>
        </div>
      </div>

      {/* Mandatory Requirements Checklist */}
      <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-900" />
          <h4 className="text-base font-bold text-slate-900">
            {isTl ? 'Kailangang Dokumento para sa PACe (Malacañang)' : 'Documentary Requirements for PACe Evaluation'}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                {isTl ? '1. Pormal na Liham-Kahilingan sa Pangulo' : '1. Formal Letter Addressed to the President'}
              </span>
              <span className="text-slate-600">
                {isTl ? 'Nakasulat ang buong kalagayan at natitirang babayaran.' : 'Detailed account of medical case and financial need.'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                {isTl ? '2. Social Case Study Report (SCSR)' : '2. Social Case Study Report (SCSR)'}
              </span>
              <span className="text-slate-600">
                {isTl ? 'Mula sa City/Municipal Social Welfare (MSWDO) o hospital social worker.' : 'Issued by City/Municipal MSWDO confirming indigent status.'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                {isTl ? '3. Certified Statement of Account / Running Bill' : '3. Certified Statement of Account / Running Bill'}
              </span>
              <span className="text-slate-600">
                {isTl ? 'May pirma ng billing clerk at bawas na ang PhilHealth.' : 'Signed by hospital billing clerk with PhilHealth case rates deducted.'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                {isTl ? '4. Certified Medical Abstract / Certificate' : '4. Certified Medical Abstract / Certificate'}
              </span>
              <span className="text-slate-600">
                {isTl ? 'May pirma at PRC license number ng attending physician.' : 'Signed with physician PRC license number and dry seal.'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                {isTl ? '5. Valid IDs ng Pasyente at Kinatawan' : '5. Valid IDs of Patient & Representative'}
              </span>
              <span className="text-slate-600">
                {isTl ? 'Malinaw na kopya ng government ID (harap at likod).' : 'Front and back copies of government-issued IDs.'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                {isTl ? '6. Katunayan ng Relasyon (PSA Certificate)' : '6. Proof of Relationship (PSA Certificate)'}
              </span>
              <span className="text-slate-600">
                {isTl ? 'Birth Certificate o Marriage Contract kung kinatawan ang nagpa-file.' : 'Birth or Marriage Certificate if representative files on patient behalf.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Formal Letter to the President */}
      <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {isTl ? 'Pre-Formatted na Liham sa Pangulo ng Pilipinas' : 'Generated Request Letter to the President'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {isTl
                ? 'Naka-format na base sa detalye ng pasyente, ospital, at kabuuang bill.'
                : 'Pre-filled with your patient intake details, hospital name, and bill balance.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLetter}
              className="bg-white hover:bg-stone-50 border border-[#E2DFD6] text-slate-800 min-h-[44px] h-11 px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? (isTl ? 'Nakopya na!' : 'Copied!') : (isTl ? 'Kopyahin ang Liham' : 'Copy Letter')}</span>
            </button>
            <a
              href={mailtoUrl}
              className="bg-blue-900 hover:bg-blue-800 text-white min-h-[44px] h-11 px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isTl ? 'I-email sa PACe' : 'Send via Email'}</span>
            </a>
          </div>
        </div>

        <div className="p-4 bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto select-all">
          {requestLetter}
        </div>
      </div>
    </div>
  );
};
