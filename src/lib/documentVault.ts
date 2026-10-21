import type { DocumentType, StoredDocument } from '../types/assistance.ts';

export type DocumentPillar = 'medical' | 'education' | 'worker';
export type DocumentVaultPillar = DocumentPillar | 'all';
export type ReadinessProgram = 'Senate Assist' | 'PCSO MAP' | 'CHED' | 'UniFAST' | 'DOST' | 'SEnA' | 'SSS' | 'ECC';

export interface DocSlotConfig {
  type: DocumentType;
  labelEn: string;
  labelTl: string;
  helperEn: string;
  helperTl: string;
  pillars: DocumentPillar[];
  programs: ReadinessProgram[];
}

export const DOCUMENT_SLOTS: DocSlotConfig[] = [
  {
    type: 'clinical_abstract', labelEn: 'Clinical Abstract / Medical Certificate', labelTl: 'Clinical Abstract / Sertipiko Medikal',
    helperEn: 'Ask the attending physician to sign and date it.', helperTl: 'Hingin ang pirma at petsa ng attending physician.',
    pillars: ['medical', 'worker'], programs: ['Senate Assist', 'PCSO MAP', 'ECC'],
  },
  {
    type: 'statement_of_account', labelEn: 'Statement of Account / Running Bill', labelTl: 'Statement of Account / Kasalukuyang Bill',
    helperEn: 'Ask the billing office for an updated copy.', helperTl: 'Humingi ng updated na kopya sa billing office.',
    pillars: ['medical'], programs: ['Senate Assist', 'PCSO MAP'],
  },
  {
    type: 'barangay_indigency', labelEn: 'Barangay Certificate of Indigency', labelTl: 'Barangay Certificate of Indigency',
    helperEn: 'Request this from your barangay if the program asks for it.', helperTl: 'Humingi nito sa barangay kung kailangan ng programa.',
    pillars: ['medical', 'education', 'worker'], programs: ['Senate Assist', 'CHED', 'UniFAST'],
  },
  {
    type: 'patient_valid_id', labelEn: 'Applicant Valid Government ID', labelTl: 'Valid Government ID ng Aplikante',
    helperEn: 'Use a clear image of a current government ID.', helperTl: 'Gumamit ng malinaw na larawan ng kasalukuyang government ID.',
    pillars: ['medical', 'education', 'worker'], programs: ['Senate Assist', 'PCSO MAP', 'CHED', 'UniFAST', 'DOST', 'SEnA', 'SSS', 'ECC'],
  },
  {
    type: 'representative_valid_id', labelEn: 'Representative Valid Government ID', labelTl: 'Valid Government ID ng Kinatawan',
    helperEn: 'Add this when someone else will transact for the applicant.', helperTl: 'Idagdag ito kung ibang tao ang mag-aasikaso para sa aplikante.',
    pillars: ['medical', 'education', 'worker'], programs: ['Senate Assist', 'PCSO MAP'],
  },
  {
    type: 'authorization_letter', labelEn: 'Authorization Letter', labelTl: 'Authorization Letter / Liham Pahintulot',
    helperEn: 'Use a signed letter when a representative will apply.', helperTl: 'Gumamit ng pirmadong liham kung may kinatawan.',
    pillars: ['medical', 'education', 'worker'], programs: ['Senate Assist', 'PCSO MAP'],
  },
  {
    type: 'proof_of_relationship', labelEn: 'Proof of Relationship', labelTl: 'Katunayan ng Relasyon',
    helperEn: 'Examples include a PSA birth or marriage certificate.', helperTl: 'Halimbawa nito ang PSA birth o marriage certificate.',
    pillars: ['medical', 'education', 'worker'], programs: ['PCSO MAP', 'DOST'],
  },
  {
    type: 'social_case_study', labelEn: 'Social Case Study Report', labelTl: 'Social Case Study Report',
    helperEn: 'Request this from a hospital or local social worker if needed.', helperTl: 'Humingi nito sa hospital o local social worker kung kailangan.',
    pillars: ['medical', 'education', 'worker'], programs: ['Senate Assist', 'CHED'],
  },
  {
    type: 'doctor_prescription', labelEn: 'Doctor Prescription', labelTl: 'Reseta ng Doktor',
    helperEn: 'Keep the medicine name, date, and prescriber visible.', helperTl: 'Dapat mabasa ang pangalan ng gamot, petsa, at doktor.',
    pillars: ['medical', 'worker'], programs: ['PCSO MAP', 'ECC'],
  },
  {
    type: 'death_certificate', labelEn: 'Death Certificate', labelTl: 'Death Certificate',
    helperEn: 'Add this only when relevant to the application.', helperTl: 'Idagdag lamang kung kailangan sa aplikasyon.',
    pillars: ['medical', 'education', 'worker'], programs: ['DOST'],
  },
  {
    type: 'certificate_of_enrollment', labelEn: 'Certificate of Enrollment / Registration', labelTl: 'Certificate of Enrollment / Registration',
    helperEn: 'Request a current certificate from the school registrar.', helperTl: 'Humingi ng kasalukuyang certificate sa school registrar.',
    pillars: ['education'], programs: ['CHED', 'UniFAST', 'DOST'],
  },
  {
    type: 'academic_grades', labelEn: 'Academic Grades / Transcript', labelTl: 'Academic Grades / Transcript',
    helperEn: 'Use the latest available school record.', helperTl: 'Gamitin ang pinakabagong school record.',
    pillars: ['education'], programs: ['CHED', 'UniFAST', 'DOST'],
  },
  {
    type: 'income_tax_return', labelEn: 'Income Tax Return / Income Proof', labelTl: 'Income Tax Return / Katunayan ng Kita',
    helperEn: 'Use the income proof requested by the school or program.', helperTl: 'Gamitin ang hinihinging katunayan ng kita ng paaralan o programa.',
    pillars: ['education'], programs: ['CHED', 'UniFAST', 'DOST'],
  },
  {
    type: 'payslip_payroll', labelEn: 'Payslip / Payroll Record', labelTl: 'Payslip / Payroll Record',
    helperEn: 'Choose a recent record that shows the pay period.', helperTl: 'Pumili ng bagong record na may nakasaad na pay period.',
    pillars: ['worker'], programs: ['SEnA', 'SSS'],
  },
  {
    type: 'certificate_of_employment', labelEn: 'Certificate of Employment', labelTl: 'Certificate of Employment',
    helperEn: 'Request a dated copy from the employer if available.', helperTl: 'Humingi ng may petsang kopya sa employer kung maaari.',
    pillars: ['worker'], programs: ['SEnA', 'SSS'],
  },
  {
    type: 'incident_logbook', labelEn: 'Incident Report / EC Logbook Entry', labelTl: 'Incident Report / EC Logbook Entry',
    helperEn: 'Keep a copy of the report or proof that the employer recorded it.', helperTl: 'Itago ang kopya ng report o patunay na naitala ito ng employer.',
    pillars: ['worker'], programs: ['ECC'],
  },
];

const READINESS_DOCUMENTS: Record<ReadinessProgram, DocumentType[]> = {
  'Senate Assist': ['clinical_abstract', 'statement_of_account', 'barangay_indigency', 'patient_valid_id', 'representative_valid_id', 'authorization_letter'],
  'PCSO MAP': ['clinical_abstract', 'statement_of_account', 'patient_valid_id', 'representative_valid_id', 'authorization_letter', 'proof_of_relationship'],
  CHED: ['certificate_of_enrollment', 'academic_grades', 'income_tax_return', 'patient_valid_id', 'barangay_indigency'],
  UniFAST: ['certificate_of_enrollment', 'academic_grades', 'income_tax_return', 'patient_valid_id'],
  DOST: ['certificate_of_enrollment', 'academic_grades', 'income_tax_return', 'patient_valid_id', 'proof_of_relationship'],
  SEnA: ['payslip_payroll', 'certificate_of_employment', 'patient_valid_id'],
  SSS: ['payslip_payroll', 'certificate_of_employment', 'patient_valid_id'],
  ECC: ['incident_logbook', 'clinical_abstract', 'doctor_prescription', 'patient_valid_id'],
};

export function getDocumentSlotsForPillar(pillar: DocumentVaultPillar): DocSlotConfig[] {
  return pillar === 'all' ? DOCUMENT_SLOTS : DOCUMENT_SLOTS.filter((slot) => slot.pillars.includes(pillar));
}

export function getProgramReadiness(documents: StoredDocument[], pillar: DocumentVaultPillar) {
  const programs = pillar === 'medical' ? ['Senate Assist', 'PCSO MAP']
    : pillar === 'education' ? ['CHED', 'UniFAST', 'DOST']
      : pillar === 'worker' ? ['SEnA', 'SSS', 'ECC']
        : Object.keys(READINESS_DOCUMENTS) as ReadinessProgram[];

  return programs.map((program) => {
    const required = READINESS_DOCUMENTS[program as ReadinessProgram];
    const ready = required.filter((type) => documents.some((document) => document.docType === type && document.isCompliantUnder2MB)).length;
    return { program, ready, total: required.length };
  });
}

export function getDocumentAttachmentDataUrl(document: StoredDocument): string | undefined {
  if (!document.isCompliantUnder2MB) return undefined;
  if (document.attachmentDataUrl) return document.attachmentDataUrl;
  return document.mimeType.startsWith('image/') ? document.dataUrl : undefined;
}

export function getAttachableDocuments(documents: StoredDocument[]): StoredDocument[] {
  return documents.filter((document) => Boolean(getDocumentAttachmentDataUrl(document)));
}

export function getChecklistDocumentTypes(item: string, pillar: DocumentPillar): DocumentType[] | undefined {
  const text = item.toLocaleLowerCase();

  if (text.includes('indigency')) return ['barangay_indigency'];
  if (text.includes('social case study')) return ['social_case_study'];
  if (text.includes('valid id') && !text.includes('pwd') && !text.includes('solo parent')) return ['patient_valid_id'];
  if (text.includes('death certificate')) return ['death_certificate'];

  if (pillar === 'education') {
    if (text.includes('enrollment') || text.includes('registration') || text.includes('school record')) return ['certificate_of_enrollment'];
    if (text.includes('grade') || text.includes('transcript') || text.includes('gwa')) return ['academic_grades'];
    if (text.includes('income tax') || text.includes('itr') || text.includes('income proof')) return ['income_tax_return'];
    if (text.includes('relationship') || text.includes('birth certificate')) return ['proof_of_relationship'];
  }

  if (pillar === 'worker') {
    if (text.includes('payslip') || text.includes('payroll') || text.includes('wage record')) return ['payslip_payroll'];
    if (text.includes('certificate of employment') || text.includes('coe') || text.includes('employment record')) return ['certificate_of_employment'];
    if (text.includes('incident') || text.includes('logbook') || text.includes('accident report')) return ['incident_logbook'];
    if (text.includes('clinical abstract') || text.includes('medical abstract') || text.includes('medical certificate')) {
      return text.includes('prescription') ? ['clinical_abstract', 'doctor_prescription'] : ['clinical_abstract'];
    }
    if (text.includes('prescription')) return ['doctor_prescription'];
  }

  return undefined;
}

export function getChecklistDocumentType(item: string, pillar: DocumentPillar): DocumentType | undefined {
  return getChecklistDocumentTypes(item, pillar)?.[0];
}

export function getChecklistDocumentStatus(item: string, documents: StoredDocument[], pillar: DocumentPillar) {
  const docTypes = getChecklistDocumentTypes(item, pillar);
  if (!docTypes) return undefined;
  const matched = docTypes.map((docType) => ({
    docType,
    document: documents.find((entry) => entry.docType === docType),
  }));
  if (matched.some(({ document }) => !document)) return { docType: docTypes[0], status: 'missing' as const };
  if (matched.some(({ document }) => !document?.isCompliantUnder2MB)) return { docType: docTypes[0], status: 'over-limit' as const };
  if (matched.some(({ document }) => !document || !getDocumentAttachmentDataUrl(document))) {
    return { docType: docTypes[0], status: 'download-only' as const };
  }
  return { docType: docTypes[0], status: 'ready' as const };
}
