import { get, set, del } from 'idb-keyval';
import { PatientProfile, RepresentativeProfile, MedicalCase, StoredDocument, ApplicationRecord } from '@/types/assistance';

import type { StudentEducationProfile } from '@/types/education';
import type { WorkerProfileInput } from '@/types/worker';

let wiping = false;
let wipeGeneration = 0;

export function getWipeGeneration(): number {
  return wipeGeneration;
}

// A second open pillar must not write an old profile back after a privacy wipe.
const privacyChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('tulongph-privacy') : null;
if (privacyChannel) {
  privacyChannel.onmessage = (event: MessageEvent<unknown>) => {
    if (event.data === 'wipe-start') { wipeGeneration++; wiping = true; }
    if (event.data === 'wipe-complete') {
      wipeGeneration++;
      wiping = true;
      try { sessionStorage.clear(); } catch { window.alert('Burahin ang session data sa browser bago umalis.'); }
      window.dispatchEvent(new Event('tulongph-data-cleared'));
    }
    if (event.data === 'wipe-failed') wiping = false;
  };
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === null && !privacyChannel) {
      wipeGeneration++;
      wiping = true;
      try { sessionStorage.clear(); } catch { window.alert('Burahin ang session data sa browser bago umalis.'); }
      window.dispatchEvent(new Event('tulongph-data-cleared'));
    }
  });
}

const KEYS = {
  PATIENT: 'tulong_patient_profile',
  REPRESENTATIVE: 'tulong_representative_profile',
  CASE: 'tulong_medical_case',
  DOCUMENTS: 'tulong_documents',
  APPLICATIONS: 'tulong_applications',
  LANGUAGE: 'tulong_preferred_language',
  EDUCATION: 'tulongph_education_session',
  WORKER: 'tulongph_worker_session',
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
  admissionStatus: 'confined_running_bill',
};

// Storage Helpers
export async function savePatientProfile(data: PatientProfile): Promise<void> {
  if (typeof window === 'undefined' || wiping) return;
  await set(KEYS.PATIENT, data);
}

export async function loadPatientProfile(): Promise<PatientProfile> {
  if (typeof window === 'undefined') return defaultPatientProfile;
  const data = await get<PatientProfile>(KEYS.PATIENT);
  return data || defaultPatientProfile;
}

export async function saveRepresentativeProfile(data: RepresentativeProfile): Promise<void> {
  if (typeof window === 'undefined' || wiping) return;
  await set(KEYS.REPRESENTATIVE, data);
}

export async function loadRepresentativeProfile(): Promise<RepresentativeProfile> {
  if (typeof window === 'undefined') return defaultRepresentativeProfile;
  const data = await get<RepresentativeProfile>(KEYS.REPRESENTATIVE);
  return data || defaultRepresentativeProfile;
}

export async function saveMedicalCase(data: MedicalCase): Promise<void> {
  if (typeof window === 'undefined' || wiping) return;
  await set(KEYS.CASE, data);
}

export async function loadMedicalCase(): Promise<MedicalCase> {
  if (typeof window === 'undefined') return defaultMedicalCase;
  const data = await get<MedicalCase>(KEYS.CASE);
  return data || defaultMedicalCase;
}

export async function saveDocuments(docs: StoredDocument[], expectedGeneration = wipeGeneration): Promise<void> {
  if (typeof window === 'undefined' || wiping || expectedGeneration !== wipeGeneration) return;
  await set(KEYS.DOCUMENTS, docs);
}

export async function loadDocuments(): Promise<StoredDocument[]> {
  if (typeof window === 'undefined') return [];
  const docs = await get<StoredDocument[]>(KEYS.DOCUMENTS);
  return docs || [];
}

export async function saveApplications(apps: ApplicationRecord[]): Promise<void> {
  if (typeof window === 'undefined' || wiping) return;
  await set(KEYS.APPLICATIONS, apps);
}

export async function loadApplications(): Promise<ApplicationRecord[]> {
  if (typeof window === 'undefined') return [];
  const apps = await get<ApplicationRecord[]>(KEYS.APPLICATIONS);
  return apps || [];
}

export async function clearAllUserData(): Promise<void> {
  wipeGeneration++;
  wiping = true;
  privacyChannel?.postMessage('wipe-start');
  const errors: unknown[] = [];
  // 1. Purge all keys from IndexedDB (idb-keyval store)
  try {
    const { clear } = await import('idb-keyval');
    await clear();
  } catch {
    // Fallback to explicit key deletions
    const results = await Promise.allSettled([
      del(KEYS.PATIENT),
      del(KEYS.REPRESENTATIVE),
      del(KEYS.CASE),
      del(KEYS.DOCUMENTS),
      del(KEYS.APPLICATIONS),
      del(KEYS.EDUCATION),
      del(KEYS.WORKER),
      del(KEYS.LANGUAGE),
    ]);
    results.forEach(result => { if (result.status === 'rejected') errors.push(result.reason); });
  }

  // 2. Wipe browser local and session storage
  if (typeof window !== 'undefined') {
    try { localStorage.clear(); } catch (e) { errors.push(e); }
    try { sessionStorage.clear(); } catch (e) { errors.push(e); }

    // 3. Purge browser CacheStorage if registered
    if ('caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length) {
      wiping = false;
      privacyChannel?.postMessage('wipe-failed');
      throw new Error('Hindi nabura ang lahat ng storage. Burahin ang site data sa browser bago umalis.');
    }
    privacyChannel?.postMessage('wipe-complete');
    window.dispatchEvent(new Event('tulongph-data-cleared'));
  }
  // Other tabs remain blocked until their reload; this caller can start a fresh session.
  wiping = false;
}

export const clearAllLocalData = clearAllUserData;

export async function saveEducationSession(data: StudentEducationProfile): Promise<void> {
  if (typeof window === 'undefined' || wiping) return;
  localStorage.setItem(KEYS.EDUCATION, JSON.stringify(data));
}

export async function loadEducationSession(): Promise<StudentEducationProfile | null> {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(KEYS.EDUCATION);
  if (!value) return null;
  try { return JSON.parse(value) as StudentEducationProfile; } catch { return null; }
}

export async function saveWorkerSession(data: WorkerProfileInput): Promise<void> {
  if (typeof window === 'undefined' || wiping) return;
  localStorage.setItem(KEYS.WORKER, JSON.stringify(data));
}

export async function loadWorkerSession(): Promise<WorkerProfileInput | null> {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(KEYS.WORKER);
  if (!value) return null;
  try { return JSON.parse(value) as WorkerProfileInput; } catch { return null; }
}
