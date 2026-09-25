import { get, set, del } from 'idb-keyval';
import { PatientProfile, RepresentativeProfile, MedicalCase, StoredDocument, ApplicationRecord } from '@/types/assistance';

const KEYS = {
  PATIENT: 'tulong_patient_profile',
  REPRESENTATIVE: 'tulong_representative_profile',
  CASE: 'tulong_medical_case',
  DOCUMENTS: 'tulong_documents',
  APPLICATIONS: 'tulong_applications',
  LANGUAGE: 'tulong_preferred_language',
};

export const defaultPatientProfile: PatientProfile = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'female',
  civilStatus: 'married',
  contactNumber: '',
  email: '',
  address: {
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: 'NCR',
  },
  philhealthNumber: '',
  isSeniorCitizen: false,
  isPWD: false,
  is4PsBeneficiary: false,
  isOFWOrDependent: false,
  socioeconomicClass: 'indigent',
  monthlyHouseholdIncome: 12000,
};

export const defaultRepresentativeProfile: RepresentativeProfile = {
  isPatientHimself: true,
  fullName: '',
  relationshipToPatient: 'Self',
  contactNumber: '',
  email: '',
  validIdType: 'UMID / PhilSys National ID',
  validIdNumber: '',
};

export const defaultMedicalCase: MedicalCase = {
  category: 'hospitalization',
  diagnosis: '',
  hospitalName: '',
  hospitalType: 'public_doh',
  hospitalCity: 'Manila',
  hasMalasakitCenter: true,
  attendingPhysician: '',
  physicianLicenseNo: '',
  totalHospitalBill: 0,
  philhealthDeduction: 0,
  seniorPwdDiscount: 0,
  netRemainingBalance: 0,
  neededAssistanceType: 'guarantee_letter',
  dateAdmitted: new Date().toISOString().split('T')[0],
};

// Storage Helpers
export async function savePatientProfile(data: PatientProfile): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(KEYS.PATIENT, data);
}

export async function loadPatientProfile(): Promise<PatientProfile> {
  if (typeof window === 'undefined') return defaultPatientProfile;
  const data = await get<PatientProfile>(KEYS.PATIENT);
  return data || defaultPatientProfile;
}

export async function saveRepresentativeProfile(data: RepresentativeProfile): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(KEYS.REPRESENTATIVE, data);
}

export async function loadRepresentativeProfile(): Promise<RepresentativeProfile> {
  if (typeof window === 'undefined') return defaultRepresentativeProfile;
  const data = await get<RepresentativeProfile>(KEYS.REPRESENTATIVE);
  return data || defaultRepresentativeProfile;
}

export async function saveMedicalCase(data: MedicalCase): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(KEYS.CASE, data);
}

export async function loadMedicalCase(): Promise<MedicalCase> {
  if (typeof window === 'undefined') return defaultMedicalCase;
  const data = await get<MedicalCase>(KEYS.CASE);
  return data || defaultMedicalCase;
}

export async function saveDocuments(docs: StoredDocument[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(KEYS.DOCUMENTS, docs);
}

export async function loadDocuments(): Promise<StoredDocument[]> {
  if (typeof window === 'undefined') return [];
  const docs = await get<StoredDocument[]>(KEYS.DOCUMENTS);
  return docs || [];
}

export async function saveApplications(apps: ApplicationRecord[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(KEYS.APPLICATIONS, apps);
}

export async function loadApplications(): Promise<ApplicationRecord[]> {
  if (typeof window === 'undefined') return [];
  const apps = await get<ApplicationRecord[]>(KEYS.APPLICATIONS);
  return apps || [];
}

export async function clearAllUserData(): Promise<void> {
  await Promise.all([
    del(KEYS.PATIENT),
    del(KEYS.REPRESENTATIVE),
    del(KEYS.CASE),
    del(KEYS.DOCUMENTS),
    del(KEYS.APPLICATIONS),
  ]);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEYS.LANGUAGE);
    localStorage.removeItem('tulong_lang');
  }
}

export const clearAllLocalData = clearAllUserData;

