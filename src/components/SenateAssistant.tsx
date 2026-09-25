'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  PlusCircle,
  FileText,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
  ApplicationRecord,
} from '@/types/assistance';
import { Language, translations } from '@/lib/i18n';

interface SenateAssistantProps {
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  applications: ApplicationRecord[];
  onSaveApplications: (apps: ApplicationRecord[]) => void;
  language: Language;
}

export const SenateAssistant: React.FC<SenateAssistantProps> = ({
  patient,
  representative,
  medicalCase,
  applications,
  onSaveApplications,
  language,
}) => {
  const t = translations[language];
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // New Application Tracker State
  const [newRefNumber, setNewRefNumber] = useState('');
  const [filingDate, setFilingDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountGranted, setAmountGranted] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const senateApps = applications.filter((a) => a.agencyId === 'senate_assist');

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Justification statement in Tagalog/English for Senate Assist intake
  const patientFullName = `${patient.firstName} ${patient.middleName} ${patient.lastName}`.trim();
  const representativeName = representative.isPatientHimself
    ? patientFullName
    : representative.fullName;

  const relationshipLabel = representative.isPatientHimself
    ? 'sarili'
    : representative.relationshipToPatient;

  const formalJustificationTl = `Ako po si ${representativeName}, lumalapit sa Kagalang-galang na Senado ng Pilipinas upang humingi ng tulong medikal sa pamamagitan ng Guarantee Letter (GL) para sa aking ${relationshipLabel} na si ${patientFullName}. Siya po ay kasalukuyang sumasailalim sa gamutan sa ${
    medicalCase.hospitalName || 'ospital'
  } dahil sa ${medicalCase.diagnosis || 'sakit'}. Ang aming natitirang babayarin matapos ang PhilHealth deduction ay humigit-kumulang ₱${medicalCase.netRemainingBalance.toLocaleString()}. Dahil po sa kakapusan sa pananalapi, labis po kaming umaasa sa inyong tanggapan upang maibsan ang aming bayarin. Maraming salamat po sa inyong malasakit.`;

  const formalJustificationEn = `I am writing to formally request medical assistance via a Guarantee Letter (GL) from the Senate Public Assistance Office on behalf of my ${relationshipLabel}, ${patientFullName}. The patient is currently receiving treatment at ${
    medicalCase.hospitalName || 'the hospital'
  } for ${medicalCase.diagnosis || 'medical condition'}. Our remaining balance after PhilHealth case rate deductions stands at ₱${medicalCase.netRemainingBalance.toLocaleString()}. Given our limited household financial resources, any assistance granted will go a long way in ensuring continued medical care. Thank you very much for your public service.`;

  const justification = language === 'taglish' ? formalJustificationTl : formalJustificationEn;

  const handleAddTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefNumber.trim()) return;

    // Calculate 90-day cooldown date
    const d = new Date(filingDate);
    d.setDate(d.getDate() + 90);
    const canReapply = d.toISOString().split('T')[0];

    const record: ApplicationRecord = {
      id: `senate_${Date.now()}`,
      agencyId: 'senate_assist',
      referenceNumber: newRefNumber.trim(),
      submissionDate: filingDate,
      status: 'submitted',
      amountGranted: amountGranted > 0 ? amountGranted : undefined,
      canReapplyDate: canReapply,
      notes: notes.trim(),
    };

    onSaveApplications([...applications, record]);
    setNewRefNumber('');
    setNotes('');
    setAmountGranted(0);
  };

  const calculateDaysLeft = (targetDateStr?: string) => {
    if (!targetDateStr) return 0;
    const target = new Date(targetDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200">
                PORTAL: assist.senate.gov.ph
              </span>
              <span className="text-xs font-semibold text-blue-700">Official Senate Assistance Office</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {language === 'taglish' ? 'Senate Assist Auto-Filing Helper' : 'Senate Assist Filing Helper'}
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              {language === 'taglish'
                ? 'I-copy ang mga pre-formatted na datos sa ibaba at i-paste nang mabilis sa opisyal na website ng Senado. May kasama ring 90-day cooldown tracker para malaman kung kailan puwedeng mag-reapply.'
                : 'Copy pre-formatted patient and case details directly into the official Senate portal. Includes automated justification generator and 90-day re-application countdown timer.'}
            </p>
          </div>

          <a
            href="https://assist.senate.gov.ph"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-xs transition-colors shrink-0"
          >
            <span>Open assist.senate.gov.ph</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 90-Day Policy Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs leading-relaxed">
        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">
            {language === 'taglish' ? 'Polisiya ng Senado (90-Day Cooldown):' : 'Senate Policy (90-Day Rule):'}
          </span>{' '}
          {language === 'taglish'
            ? 'Ang medical assistance ay ibinibigay sa pamamagitan ng Guarantee Letter (GL). Maaari lamang mag-apply ulit makalipas ang tatlong buwan (90 days) mula sa petsa ng naunang natanggap na GL.'
            : 'Assistance is issued via a Guarantee Letter directly to partner health facilities. Re-application is strictly permitted only after 3 months (90 days) from your previous GL date.'}
        </div>
      </div>

      {/* Two Column Grid: Field Copy Helper & 90-Day Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quick Copy Field Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>
                {language === 'taglish' ? 'Mga Datos na Hinihingi sa Portal' : 'Required Form Values'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Click copy button to paste into form
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Patient Full Name */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Patient Full Name</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {patientFullName || '(Ilagay sa Triage Tab)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(patientFullName, 'name')}
                  disabled={!patientFullName}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors shadow-xs"
                >
                  {copiedField === 'name' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                  <span>{copiedField === 'name' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Patient Address */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Address</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {`${patient.address.street} ${patient.address.barangay}, ${patient.address.cityMunicipality}, ${patient.address.province}`.trim() ||
                      '(Ilagay sa Triage Tab)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${patient.address.street} ${patient.address.barangay}, ${patient.address.cityMunicipality}, ${patient.address.province}`.trim(),
                      'address'
                    )
                  }
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors shadow-xs"
                >
                  {copiedField === 'address' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                  <span>{copiedField === 'address' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Hospital & Diagnosis */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Hospital & Diagnosis
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {medicalCase.hospitalName || 'Ospital'} - {medicalCase.diagnosis || 'Sakit'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${medicalCase.hospitalName} - ${medicalCase.diagnosis}`,
                      'hospital'
                    )
                  }
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors shadow-xs"
                >
                  {copiedField === 'hospital' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                  <span>{copiedField === 'hospital' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Amount Needed */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Net Balance to Request (₱)
                  </div>
                  <div className="font-bold text-emerald-800 text-sm mt-0.5">
                    ₱ {medicalCase.netRemainingBalance.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(medicalCase.netRemainingBalance.toString(), 'amount')
                  }
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors shadow-xs"
                >
                  {copiedField === 'amount' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                  <span>{copiedField === 'amount' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Generated Justification Statement */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {language === 'taglish' ? 'Pormal na Sulat / Reason for Request' : 'Justification Statement'}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(justification, 'justification')}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors shadow-xs"
                  >
                    {copiedField === 'justification' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                    <span>{copiedField === 'justification' ? 'Copied' : 'Copy Justification'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                  &ldquo;{justification}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Reference Tracker & 90-Day Timer */}
        <div className="space-y-4">
          {/* Tracker Form */}
          <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>
                {language === 'taglish' ? 'I-record ang Na-file na Request' : 'Track Submitted Request'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'taglish'
                ? 'Itala ang binigay na Reference Number mula sa assist.senate.gov.ph.'
                : 'Log the reference code issued upon submitting on assist.senate.gov.ph.'}
            </p>

            <form onSubmit={handleAddTracking} className="space-y-3.5">
              <div>
                <label htmlFor="senate-ref-no" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Senate Reference Number *
                </label>
                <input
                  id="senate-ref-no"
                  name="senateReferenceNumber"
                  type="text"
                  required
                  aria-required="true"
                  value={newRefNumber}
                  onChange={(e) => setNewRefNumber(e.target.value)}
                  placeholder="e.g. SEN-2026-XXXX"
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="senate-filing-date" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  {language === 'taglish' ? 'Petsa ng Pag-apply' : 'Date Filed / Submitted'} *
                </label>
                <input
                  id="senate-filing-date"
                  name="senateFilingDate"
                  type="date"
                  required
                  aria-required="true"
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="senate-amount-granted" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  {language === 'taglish' ? 'Halagang Na-approve (₱ kung alam na)' : 'Approved Amount (₱ if known)'}
                </label>
                <input
                  id="senate-amount-granted"
                  name="senateAmountGranted"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={amountGranted || ''}
                  onChange={(e) => setAmountGranted(Number(e.target.value) || 0)}
                  placeholder="₱ 20,000"
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-xs"
              >
                {t.markFiled}
              </button>
            </form>
          </div>

          {/* Active Senate Applications List */}
          <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              {language === 'taglish' ? 'Kasalukuyang mga Application' : 'Logged Senate Requests'}
            </h4>

            {senateApps.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Walang pang naitalang application.
              </div>
            ) : (
              <div className="space-y-3">
                {senateApps.map((app) => {
                  const daysLeft = calculateDaysLeft(app.canReapplyDate);
                  return (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 font-mono text-sm">
                          {app.referenceNumber}
                        </span>
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-950 border border-amber-200">
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-slate-600 text-xs">
                        Submitted on: {new Date(app.submissionDate).toLocaleDateString()}
                      </div>

                      {/* Cooldown Timer */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-600">90-Day Cooldown:</span>
                          <span
                            className={`font-bold ${
                              daysLeft === 0 ? 'text-emerald-700' : 'text-amber-800'
                            }`}
                          >
                            {daysLeft === 0
                              ? 'Eligible to Re-apply Now!'
                              : `${daysLeft} days remaining`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 transition-all"
                            style={{
                              width: `${Math.max(0, Math.min(100, ((90 - daysLeft) / 90) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
