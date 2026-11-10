import { civicPaper } from '@/components/shared/civicStyles';
import { GenericPrescriptionChecklistPrintView } from '@/components/triage/GenericPrescriptionGuideCard';
import type { MedicalCase, PatientProfile, StoredDocument } from '@/types/assistance';
import type { Language } from '@/lib/i18n';

interface MedicalPrintableSheetsProps {
  selectedForm: 'complete_packet' | 'malasakit' | 'dswd' | 'checklist' | 'prescription_checklist';
  patient: PatientProfile;
  medicalCase: MedicalCase;
  documents: StoredDocument[];
  fullName: string;
  applicantName: string;
  language: Language;
}

export function MedicalPrintableSheets({ selectedForm, patient, medicalCase, documents, fullName, applicantName, language }: MedicalPrintableSheetsProps) {
  const isPrescriptionChecklist = selectedForm === 'prescription_checklist';
  return (
        <div className={`${civicPaper} w-full text-slate-900 font-sans transition-all ${isPrescriptionChecklist ? 'overflow-visible' : 'overflow-x-auto'} text-xs`}>
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-900 mb-4">
            <p className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
              {isPrescriptionChecklist
                ? 'TulongPH • Gabay sa Paghahanda'
                : 'Republika ng Pilipinas • Department of Health / DSWD'}
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-900 mt-0.5">
              {isPrescriptionChecklist
                ? language === 'taglish' ? 'Para sa pag-uusap sa doktor at lisensyadong parmasyutiko' : language === 'cebuano' ? 'Alang sa pakig-istorya sa doktor ug lisensyadong pharmacist' : language === 'ilocano' ? 'Para iti pannakisarita iti doktor ken lisensiado a parmasista' : 'For discussion with a doctor and licensed pharmacist'
                : selectedForm === 'dswd'
                ? 'Department of Social Welfare and Development (DSWD)'
                : 'Malasakit Center Operations Unit • Republic Act No. 11463'}
            </p>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 mt-1">
              {isPrescriptionChecklist
                ? language === 'taglish' ? 'Kumpletong Reseta: 6 na Tsek' : language === 'cebuano' ? 'Kompletong Reseta: 6 ka Tsek' : language === 'ilocano' ? 'Kumpleto a Reseta: 6 a Panang-check' : 'Complete Prescription: Six Checks'
                : selectedForm === 'dswd'
                ? 'General Intake Sheet - Assistance to Individuals in Crisis (AICS)'
                : selectedForm === 'checklist'
                ? 'Hospital Desk Submission Checklist & Cover Sheet'
                : 'Unified Intake Sheet / Application Form'}
            </h2>
            <p className="text-xs text-slate-600 italic">
              {isPrescriptionChecklist
                ? language === 'taglish' ? 'Hindi ito opisyal na reseta o kapalit ng payo ng doktor.' : language === 'cebuano' ? 'Dili kini opisyal nga reseta o kapuli sa tambag sa doktor.' : language === 'ilocano' ? 'Saan daytoy opisial a reseta wenno sukat ti balakad ti doktor.' : 'This is not an official prescription or a substitute for a doctor’s advice.'
                : selectedForm === 'dswd'
                ? 'Hospital Satellite Social Service Unit • AO No. 15 Series of 2022'
                : selectedForm === 'checklist'
                ? 'TulongPH Bayanihan Initiative • Official Hospital Desk Submission Guide'
                : 'In compliance with Republic Act No. 11463 (Malasakit Centers Act) & Joint Admin Order 2020-0001'}
            </p>
          </div>

          {/* Body Content based on active view */}
          {isPrescriptionChecklist ? (
            <GenericPrescriptionChecklistPrintView language={language} />
          ) : selectedForm === 'checklist' ? (
            <div className="space-y-4">
              <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-600 font-semibold block text-xs">PASYENTE:</span>
                  <span className="font-bold text-slate-900 uppercase text-xs">{fullName}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold block text-xs">OSPITAL:</span>
                  <span className="font-bold text-slate-900 text-xs">{medicalCase.hospitalName}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold block text-xs">DIAGNOSIS:</span>
                  <span className="font-bold text-slate-900 text-xs">{medicalCase.diagnosis}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold block text-xs">NETONG BALANSE:</span>
                  <span className="font-bold text-blue-700 text-xs">₱{medicalCase.netRemainingBalance.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase bg-slate-100 px-3 py-1.5 border border-[#E2DFD6] mb-2 rounded-lg text-slate-900">
                  Tamang Pagkakasunod-sunod sa Paglapit sa Ospital
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 border border-[#E2DFD6] bg-[#FAF9F5] rounded-xl text-xs">
                    <strong>1. Billing Counter (PhilHealth Deduction):</strong> Humingi ng SOA na may bawas na ng PhilHealth Case Rates at Senior/PWD 20% discount.
                  </div>
                  <div className="p-2.5 border border-[#E2DFD6] bg-[#FAF9F5] rounded-xl text-xs">
                    <strong>2. Malasakit Center Window (DOH MAIP):</strong> Isumite ang Malasakit Unified Intake Sheet kasama ang Clinical Abstract at SOA.
                  </div>
                  <div className="p-2.5 border border-[#E2DFD6] bg-[#FAF9F5] rounded-xl text-xs">
                    <strong>3. PCSO & DSWD Satellite Desks:</strong> Para sa natitirang balanse o pambili ng gamot na wala sa pharmacy ng ospital.
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase bg-slate-100 px-3 py-1.5 border border-[#E2DFD6] mb-2 rounded-lg text-slate-900">
                  Talaan ng mga Kalakip na Dokumento (Checklist)
                </h4>
                <div className="border border-[#E2DFD6] divide-y divide-[#E2DFD6] rounded-xl overflow-hidden text-xs">
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-xs">
                        {documents.some((d) => d.docType === 'clinical_abstract') ? '[ X ]' : '[   ]'} Original Clinical Abstract / Medical Certificate
                      </strong>
                      <span className="text-slate-600 text-xs">May pirma ng doktor at PRC License Number.</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      documents.some((d) => d.docType === 'clinical_abstract')
                        ? 'text-emerald-800 bg-emerald-50'
                        : 'text-amber-800 bg-amber-50'
                    }`}>
                      {documents.some((d) => d.docType === 'clinical_abstract') ? 'ATTACHED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-xs">
                        {documents.some((d) => d.docType === 'statement_of_account') ? '[ X ]' : '[   ]'} Certified True Copy ng Hospital SOA / Final Bill
                      </strong>
                      <span className="text-slate-600 text-xs">May opisyal na pirma ng Billing Officer.</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      documents.some((d) => d.docType === 'statement_of_account')
                        ? 'text-emerald-800 bg-emerald-50'
                        : 'text-amber-800 bg-amber-50'
                    }`}>
                      {documents.some((d) => d.docType === 'statement_of_account') ? 'ATTACHED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-xs">
                        {documents.some((d) => d.docType === 'barangay_indigency') ? '[ X ]' : '[   ]'} Barangay Certificate of Indigency
                      </strong>
                      <span className="text-slate-600 text-xs">Para sa layunin ng Medical Assistance.</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      documents.some((d) => d.docType === 'barangay_indigency')
                        ? 'text-emerald-800 bg-emerald-50'
                        : 'text-amber-800 bg-amber-50'
                    }`}>
                      {documents.some((d) => d.docType === 'barangay_indigency') ? 'ATTACHED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-xs">
                        {documents.some((d) => d.docType === 'patient_valid_id' || d.docType === 'representative_valid_id') ? '[ X ]' : '[   ]'} Photocopy ng Valid IDs na may 3 Pirma
                      </strong>
                      <span className="text-slate-600 text-xs">ID ng Pasyente at ID ng Kinatawan / Naglalakad.</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      documents.some((d) => d.docType === 'patient_valid_id' || d.docType === 'representative_valid_id')
                        ? 'text-emerald-800 bg-emerald-50'
                        : 'text-amber-800 bg-amber-50'
                    }`}>
                      {documents.some((d) => d.docType === 'patient_valid_id' || d.docType === 'representative_valid_id') ? 'ATTACHED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Part 1: Patient Data Grid */}
              <div>
                <h4 className="font-bold text-sm uppercase bg-slate-100 px-3 py-1.5 border border-[#E2DFD6] mb-1 rounded-t-lg text-slate-900">
                  Part I. Impormasyon ng Pasyente (Patient Profile)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 border border-[#E2DFD6] text-xs">
                  <div className="p-2.5 border-b sm:border-r border-[#E2DFD6] sm:col-span-2">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Buong Pangalan</span>
                    <span className="font-bold uppercase text-slate-900 text-xs">{fullName}</span>
                  </div>
                  <div className="p-2.5 border-b sm:border-r border-[#E2DFD6]">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Petsa ng Kapanganakan</span>
                    <span className="font-bold text-slate-900 text-xs">{patient.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 border-b border-[#E2DFD6]">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Kasarian / Sibil</span>
                    <span className="font-bold uppercase text-slate-900 text-xs">{patient.gender} / {patient.civilStatus}</span>
                  </div>
                  <div className="p-2.5 border-b sm:border-r border-[#E2DFD6] sm:col-span-2">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">PhilHealth PIN</span>
                    <span className="font-bold text-slate-900 text-xs">{patient.philhealthNumber || 'Unregistered / Indigent'}</span>
                  </div>
                  <div className="p-2.5 border-b border-[#E2DFD6] sm:col-span-2">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Mobile / Telepono</span>
                    <span className="font-bold text-slate-900 text-xs">{patient.contactNumber || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 sm:col-span-4">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Permanenteng Tirahan</span>
                    <span className="font-bold text-slate-900 text-xs leading-relaxed">
                      {patient.address.street}, Brgy. {patient.address.barangay}, {patient.address.cityMunicipality}, {patient.address.province}
                    </span>
                  </div>
                </div>
              </div>

              {/* Part 2: Medical Case & Billing */}
              <div>
                <h4 className="font-bold text-sm uppercase bg-slate-100 px-3 py-1.5 border border-[#E2DFD6] mb-1 rounded-t-lg text-slate-900">
                  Part II. Ospital at Datos sa Pagsingil (Clinical & Financial Breakdown)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#E2DFD6] text-xs">
                  <div className="p-2.5 border-r border-b border-[#E2DFD6] col-span-2">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Pangalan ng Ospital</span>
                    <span className="font-bold text-slate-900 text-xs">{medicalCase.hospitalName}</span>
                  </div>
                  <div className="p-2.5 border-b border-[#E2DFD6] col-span-2">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Attending Doctor</span>
                    <span className="font-bold text-slate-900 text-xs">{medicalCase.attendingPhysician || 'Attending Physician'}</span>
                  </div>
                  <div className="p-2.5 border-b border-[#E2DFD6] col-span-2 sm:col-span-4">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Medikal na Diagnosis</span>
                    <span className="font-bold text-slate-900 text-xs">{medicalCase.diagnosis}</span>
                  </div>
                  <div className="p-2.5 border-r border-b sm:border-b-0 border-[#E2DFD6]">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Kabuuang Bill</span>
                    <span className="font-bold text-slate-900 text-xs">₱{medicalCase.totalHospitalBill.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-[#E2DFD6]">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">PhilHealth Bawas</span>
                    <span className="font-bold text-slate-900 text-xs">₱{medicalCase.philhealthDeduction.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 border-r border-[#E2DFD6]">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Senior/PWD 20%</span>
                    <span className="font-bold text-slate-900 text-xs">₱{medicalCase.seniorPwdDiscount.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-[#FAF9F5]">
                    <span className="text-xs text-slate-600 uppercase block font-semibold">Netong Balanse</span>
                    <span className="font-extrabold text-blue-700 text-xs">₱{medicalCase.netRemainingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Part 3: Signatures & MSW Certification */}
              <div>
                <h4 className="font-bold text-sm uppercase bg-slate-100 px-3 py-1.5 border border-[#E2DFD6] mb-1 rounded-t-lg text-slate-900">
                  Part III. Pagpapatunay, Lagda at Social Worker Assessment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-[#E2DFD6] p-3.5 text-xs">
                  {/* Signature Box */}
                  <div className="border border-[#E2DFD6] p-3 flex flex-col justify-between h-32 text-center rounded-xl bg-white">
                    <span className="text-xs text-slate-600 font-semibold block uppercase">Lagda ng Nag-aaplay</span>
                    <div className="border-b border-slate-700 mx-2 mb-1 mt-auto" />
                    <span className="font-bold text-xs text-slate-900">{applicantName}</span>
                    <span className="text-xs text-slate-500">Pasyente / Kinatawan</span>
                  </div>

                  {/* Thumbmark Box */}
                  <div className="border border-[#E2DFD6] p-3 flex flex-col justify-between h-32 text-center rounded-xl bg-white">
                    <span className="text-xs text-slate-600 font-semibold block uppercase">Kanang Hinlalaki</span>
                    <div className="w-16 h-16 border border-dashed border-slate-400 mx-auto my-auto flex items-center justify-center text-xs text-slate-400 rounded-lg">
                      Right Thumb
                    </div>
                  </div>

                  {/* Social Worker Assessment Box */}
                  <div className="border border-[#E2DFD6] p-3 flex flex-col justify-between h-32 text-left bg-[#FAF9F5] rounded-xl">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">FOR SOCIAL WORKER USE:</span>
                      <span className="text-xs text-slate-600 block">[  ] Indigent / In Crisis</span>
                      <span className="text-xs text-slate-600 block">MAIP Grant: PHP ___________</span>
                    </div>
                    <div>
                      <div className="border-b border-slate-700 mx-1 mb-1 mt-auto" />
                      <span className="text-xs text-center text-slate-600 block">Medical Social Worker Signature</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-3 border-t border-[#E2DFD6] text-center text-xs text-slate-500 italic">
            {isPrescriptionChecklist
              ? language === 'taglish' ? 'TulongPH preparation guide. Ipa-confirm sa doktor at parmasyutiko ang lahat ng detalye.' : language === 'cebuano' ? 'TulongPH preparation guide. Ipakumpirma sa doktor ug pharmacist ang tanang detalye.' : language === 'ilocano' ? 'TulongPH preparation guide. Ipa-confirm iti doktor ken parmasista amin a detalye.' : 'TulongPH preparation guide. Confirm all details with a doctor and pharmacist.'
              : 'TulongPH • RA 11463 & RA 10173 Compliant Document Engine • Libre ang tulong mula sa pamahalaan.'}
          </div>
        </div>
  );
}
