import { clear, createStore, del, get, set } from 'idb-keyval';
import type { PatientProfile, RepresentativeProfile, MedicalCase, StoredDocument, ApplicationRecord } from '@/types/assistance';

import type { StudentEducationProfile } from '@/types/education';
import type { BackupBundle } from './encryptedBackup';
import type { TreatmentSessionTracker } from './treatmentTracker';
import type { OFWCaseRecord } from './ofwTracker';
import { isGWATrackerRecord, type GWATrackerRecord } from './gwaTracker.ts';
import type { WorkerProfileInput } from '@/types/worker';
import { getCity, getProvince, resolveLocationMetadata } from './data/phLocations.ts';

export type RestoreSessionToken = symbol;
let activeRestoreToken: RestoreSessionToken | null = null;
let restoreLockActive = false;
let restoreSessionId: string | null = null;
let activeSessionId: string | null = null;
let activeSessionStartedAt = 0;
let lastCompletedAt = 0;
const RESTORE_LOCK_KEY = 'tulongph_restore_lock_session';
const RESTORE_COMPLETED_KEY = 'tulongph_restore_completed_at';
const RESTORE_LOCK_TTL_MS = 15000;
const RESTORE_JOURNAL_KEY = 'tulongph_restore_journal';
const RESTORE_JOURNAL_SESSION_KEY = 'tulongph_restore_journal_session';
let initialRecoveryRan = false;
let storageReadiness: Promise<void> | null = null;

interface PersistentRestoreLock {
  sessionId: string;
  startedAt: number;
  expiresAt: number;
}

function getActivePersistentLock(): PersistentRestoreLock | null {
  const value = localStorage.getItem(RESTORE_LOCK_KEY) ?? null;
  if (value === null) return null;
  try {
    const lock: unknown = JSON.parse(value);
    if (typeof lock === 'object' && lock !== null
      && 'sessionId' in lock && typeof lock.sessionId === 'string' && lock.sessionId
      && 'startedAt' in lock && typeof lock.startedAt === 'number' && Number.isFinite(lock.startedAt)) {
      const expiresAt = 'expiresAt' in lock ? lock.expiresAt : lock.startedAt + RESTORE_LOCK_TTL_MS;
      if (typeof expiresAt === 'number' && Number.isFinite(expiresAt) && Date.now() < expiresAt) {
        return { sessionId: lock.sessionId, startedAt: lock.startedAt, expiresAt };
      }
    }
  } catch { /* Discard malformed leases so they cannot strand storage. */ }
  localStorage.removeItem(RESTORE_LOCK_KEY);
  return null;
}

function resetLocalRestoreSession(): void {
  activeRestoreToken = null;
  restoreSessionId = null;
  activeSessionId = null;
  activeSessionStartedAt = 0;
  restoreLockActive = false;
  incrementWipeGeneration();
}

function reconcileRestoreLockState(): boolean {
  const completedAt = Number(localStorage.getItem(RESTORE_COMPLETED_KEY));
  if (Number.isFinite(completedAt) && completedAt > lastCompletedAt) {
    lastCompletedAt = completedAt;
    incrementWipeGeneration();
  }
  if (restoreLockActive && getActivePersistentLock() === null) {
    resetLocalRestoreSession();
    initialRecoveryRan = false;
    dispatchBackupRestoreEvent('tulongph-backup-restore-failed');
    return false;
  }
  return restoreLockActive;
}

export async function ensureReadyForStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  reconcileRestoreLockState();
  if (activeRestoreToken !== null) return;
  if (storageReadiness) return storageReadiness;
  storageReadiness = (async () => {
    while (true) {
      reconcileRestoreLockState();
      const lock = getActivePersistentLock();
      if (lock !== null && lock.sessionId !== restoreSessionId) {
        incrementWipeGeneration();
        await new Promise<void>(resolve => {
          const finish = () => {
            clearTimeout(timer);
            window.removeEventListener('tulongph-data-restored', finish);
            window.removeEventListener('tulongph-backup-restore-failed', finish);
            resolve();
          };
          const timer = setTimeout(finish, Math.max(0, lock.expiresAt - Date.now()));
          window.addEventListener('tulongph-data-restored', finish);
          window.addEventListener('tulongph-backup-restore-failed', finish);
        });
        continue;
      }
      if (initialRecoveryRan) return;
      await recoverAbandonedRestore();
      reconcileRestoreLockState();
      const currentLock = getActivePersistentLock();
      if (currentLock !== null && currentLock.sessionId !== restoreSessionId) continue;
      initialRecoveryRan = true;
      return;
    }
  })();
  try { await storageReadiness; }
  finally { storageReadiness = null; }
}

let wiping = false;
let wipeGeneration = 0;

export function isWipingInProgress(): boolean {
  return wiping;
}

export function getWipeGeneration(): number {
  return wipeGeneration;
}

export function incrementWipeGeneration(): number {
  wipeGeneration++;
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

const backupChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('tulongph-backup') : null;
function dispatchBackupRestoreEvent(type: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(type));
}
if (backupChannel) {
  backupChannel.onmessage = (event: MessageEvent<unknown>) => {
    const message = event.data;
    if (typeof message === 'object' && message !== null
      && 'type' in message && message.type === 'restore-start'
      && 'sessionId' in message && typeof message.sessionId === 'string'
      && 'startedAt' in message && typeof message.startedAt === 'number' && Number.isFinite(message.startedAt)
      && message.sessionId !== restoreSessionId) {
      const { sessionId, startedAt } = message;
      // A delayed start from a completed session must not lock ordinary saves again.
      if (startedAt <= lastCompletedAt) return;
      if (restoreLockActive) {
        const incomingBeats = startedAt < activeSessionStartedAt
          || (startedAt === activeSessionStartedAt && sessionId < (activeSessionId ?? ''));
        if (!incomingBeats) return;
        if (activeRestoreToken !== null) {
          const forfeitedSessionId = restoreSessionId;
          if (getActivePersistentLock()?.sessionId === restoreSessionId) {
            localStorage.setItem(RESTORE_LOCK_KEY, JSON.stringify({ sessionId, startedAt, expiresAt: startedAt + RESTORE_LOCK_TTL_MS }));
          }
          resetLocalRestoreSession();
          backupChannel?.postMessage({ type: 'restore-forfeited', sessionId: forfeitedSessionId });
        }
      }
      activeSessionId = sessionId;
      activeSessionStartedAt = startedAt;
      restoreLockActive = true;
      incrementWipeGeneration();
      dispatchBackupRestoreEvent('tulongph-backup-restore-started');
    }
    const completion = typeof message === 'object' && message !== null
      && 'sessionId' in message && message.sessionId === activeSessionId
      && 'type' in message ? message.type : message;
    if (completion === 'restore-complete' || completion === 'restore-failed') {
      const completedAt = typeof message === 'object' && message && 'completedAt' in message
        && typeof message.completedAt === 'number' ? message.completedAt : Date.now();
      lastCompletedAt = Math.max(lastCompletedAt, completedAt);
      restoreLockActive = false;
      activeSessionId = null;
      activeSessionStartedAt = 0;
      activeRestoreToken = null;
      incrementWipeGeneration();
      dispatchBackupRestoreEvent(completion === 'restore-complete' ? 'tulongph-data-restored' : 'tulongph-backup-restore-failed');
    }
  };
}

export function beginBackupRestore(): RestoreSessionToken | null {
  reconcileRestoreLockState();
  if (restoreLockActive || wiping || getActivePersistentLock() !== null) return null;
  lastCompletedAt = Math.max(lastCompletedAt, Number(localStorage.getItem(RESTORE_COMPLETED_KEY)) || 0);
  const startedAt = Math.max(Date.now(), lastCompletedAt + 1);
  const sessionId = crypto.randomUUID();
  const token = Symbol('tulongph-restore-token');
  localStorage.setItem(RESTORE_LOCK_KEY, JSON.stringify({ sessionId, startedAt, expiresAt: startedAt + RESTORE_LOCK_TTL_MS }));
  activeRestoreToken = token;
  restoreSessionId = sessionId;
  activeSessionId = sessionId;
  activeSessionStartedAt = startedAt;
  restoreLockActive = true;
  incrementWipeGeneration();
  backupChannel?.postMessage({ type: 'restore-start', sessionId, startedAt });
  dispatchBackupRestoreEvent('tulongph-backup-restore-started');
  return token;
}

export function finishBackupRestore(token: RestoreSessionToken, success: boolean): void {
  if (token !== activeRestoreToken) {
    if (restoreLockActive && activeRestoreToken === null) {
      restoreLockActive = false;
      activeSessionId = null;
      activeSessionStartedAt = 0;
    }
    return;
  }
  const sessionId = restoreSessionId;
  const completedAt = Math.max(Date.now(), activeSessionStartedAt, lastCompletedAt,
    Number(localStorage.getItem(RESTORE_COMPLETED_KEY)) || 0);
  localStorage.setItem(RESTORE_COMPLETED_KEY, String(completedAt));
  if (getActivePersistentLock()?.sessionId === restoreSessionId) localStorage.removeItem(RESTORE_LOCK_KEY);
  lastCompletedAt = completedAt;
  resetLocalRestoreSession();
  backupChannel?.postMessage({ type: success ? 'restore-complete' : 'restore-failed', sessionId, completedAt });
  dispatchBackupRestoreEvent(success ? 'tulongph-data-restored' : 'tulongph-backup-restore-failed');
}
function canWriteDuringRestore(token?: RestoreSessionToken): boolean {
  reconcileRestoreLockState();
  if (token) {
    if (token !== activeRestoreToken) return false;
    const lock = getActivePersistentLock();
    if (lock === null || lock.sessionId !== restoreSessionId
      || Number(localStorage.getItem(RESTORE_COMPLETED_KEY)) >= activeSessionStartedAt) {
      resetLocalRestoreSession();
      return false;
    }
    return true;
  }
  return !restoreLockActive && getActivePersistentLock() === null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (activeRestoreToken && restoreSessionId && getActivePersistentLock()?.sessionId === restoreSessionId) {
      localStorage.removeItem(RESTORE_LOCK_KEY);
    }
  });
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
  SHARED_CONTEXT: 'tulongph_shared_family_context',
  TREATMENT_TRACKER: 'tulong_treatment_tracker',
  OFW_CASE_TRACKER: 'tulong_ofw_case_tracker',
  GWA_TRACKER: 'tulong_gwa_tracker',
};

interface RestoreJournal {
  sessionId: string;
  snapshot: BackupBundle;
}

export async function saveRestoreJournal(token: RestoreSessionToken, snapshot: BackupBundle): Promise<void> {
  if (wiping || !canWriteDuringRestore(token)) throw new Error('RESTORE_SESSION_LOST');
  const generation = wipeGeneration;
  const sessionId = restoreSessionId;
  if (sessionId === null) throw new Error('RESTORE_SESSION_LOST');
  const journal = { sessionId, snapshot };
  localStorage.setItem(RESTORE_JOURNAL_SESSION_KEY, sessionId);
  await set(`${RESTORE_JOURNAL_KEY}_${sessionId}`, journal);
  if (wiping || generation !== wipeGeneration || !canWriteDuringRestore(token)) throw new Error('RESTORE_SESSION_LOST');
}

async function deleteRestoreJournal(sessionId: string | null): Promise<void> {
  if (sessionId) await del(`${RESTORE_JOURNAL_KEY}_${sessionId}`);
  await del(RESTORE_JOURNAL_KEY);
  localStorage.removeItem(RESTORE_JOURNAL_SESSION_KEY);
}

export async function clearRestoreJournal(token?: RestoreSessionToken): Promise<void> {
  if (token !== undefined && !canWriteDuringRestore(token)) return;
  if (token === undefined && getActivePersistentLock() !== null) return;
  await deleteRestoreJournal(localStorage.getItem(RESTORE_JOURNAL_SESSION_KEY) ?? restoreSessionId);
}

export async function recoverAbandonedRestore(): Promise<boolean> {
  const persistentLock = typeof window === 'undefined' ? null : localStorage.getItem(RESTORE_LOCK_KEY);
  if (typeof window === 'undefined' || wiping || getActivePersistentLock() !== null) return false;
  let sessionId = localStorage.getItem(RESTORE_JOURNAL_SESSION_KEY);
  if (!sessionId && persistentLock) {
    try {
      const lock: unknown = JSON.parse(persistentLock);
      if (typeof lock === 'object' && lock !== null && 'sessionId' in lock && typeof lock.sessionId === 'string') sessionId = lock.sessionId;
    } catch { /* Legacy journals can still be recovered without a valid lease. */ }
  }
  const journalKey = sessionId ? `${RESTORE_JOURNAL_KEY}_${sessionId}` : RESTORE_JOURNAL_KEY;
  const readJournal = async () => {
    try {
      return (await get<RestoreJournal>(journalKey)) ?? (await get<RestoreJournal>(RESTORE_JOURNAL_KEY));
    } catch {
      return null;
    }
  };
  const journal = await readJournal();
  if (!journal) return false;
  const token = beginBackupRestore();
  if (token === null) return false;
  const generation = wipeGeneration;
  const assertOwnership = () => {
    if (wiping || generation !== wipeGeneration || !canWriteDuringRestore(token)) throw new Error('RESTORE_SESSION_LOST');
  };
  try {
    // Re-read under the lease in case another tab recovered while the first read was pending.
    const currentJournal = await readJournal();
    assertOwnership();
    if (!currentJournal || currentJournal.sessionId !== journal.sessionId) {
      finishBackupRestore(token, false);
      return false;
    }
    const snapshot = currentJournal.snapshot;
    const entries = [
      [KEYS.PATIENT, snapshot.patient], [KEYS.REPRESENTATIVE, snapshot.representative],
      [KEYS.CASE, snapshot.medicalCase], [KEYS.DOCUMENTS, snapshot.documents],
      [KEYS.APPLICATIONS, snapshot.applications],
    ] as const;
    for (const [key, value] of entries) {
      assertOwnership();
      await set(key, value);
    }
    assertOwnership();
    if (snapshot.workerSession) await set(KEYS.WORKER, snapshot.workerSession, workerSessionStore);
    else await del(KEYS.WORKER, workerSessionStore);
    assertOwnership();
    if (snapshot.treatmentTracker) await set(KEYS.TREATMENT_TRACKER, snapshot.treatmentTracker);
    else await del(KEYS.TREATMENT_TRACKER);
    assertOwnership();
    if (snapshot.ofwCaseTracker) await set(KEYS.OFW_CASE_TRACKER, snapshot.ofwCaseTracker);
    else await del(KEYS.OFW_CASE_TRACKER);
    assertOwnership();
    if (snapshot.gwaTracker && isGWATrackerRecord(snapshot.gwaTracker)) await set(KEYS.GWA_TRACKER, snapshot.gwaTracker);
    else await del(KEYS.GWA_TRACKER);
    assertOwnership();
    localStorage.removeItem(KEYS.WORKER);
    for (const [key, value] of [[KEYS.EDUCATION, snapshot.educationSession], [KEYS.SHARED_CONTEXT, snapshot.sharedFamilyContext]] as const) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    }
    assertOwnership();
    await deleteRestoreJournal(journal.sessionId);
    assertOwnership();
    finishBackupRestore(token, true);
    return true;
  } catch (error) {
    finishBackupRestore(token, false);
    throw error;
  }
}

export interface SharedFamilyContext {
  province?: string;
  cityMunicipality?: string;
  barangay?: string;
  region?: string;
  locationTier?: 'NCR' | 'HUC' | 'other';
  regionalDailyWage?: number;
  is4Ps?: boolean;
  isPWD?: boolean;
  isOFW?: boolean;
  isSoloParent?: boolean;
  isSeniorCitizen?: boolean;
  monthlyIncome?: number;
  sourcePillar?: 'medical' | 'education' | 'worker';
  updatedAt?: string;
}

function normalizeSharedFamilyContext(value: unknown): SharedFamilyContext | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const context: SharedFamilyContext = {};
  for (const key of ['province', 'cityMunicipality', 'barangay', 'region'] as const) {
    if (typeof record[key] === 'string') context[key] = record[key].slice(0, 150);
  }
  if (record.locationTier === 'NCR' || record.locationTier === 'HUC' || record.locationTier === 'other') {
    context.locationTier = record.locationTier;
  }
  for (const key of ['regionalDailyWage', 'monthlyIncome'] as const) {
    const amount = record[key];
    if (typeof amount === 'number' && Number.isFinite(amount) && amount >= 0) context[key] = amount;
  }
  for (const key of ['is4Ps', 'isPWD', 'isOFW', 'isSoloParent', 'isSeniorCitizen'] as const) {
    if (typeof record[key] === 'boolean') context[key] = record[key];
  }
  if (record.sourcePillar === 'medical' || record.sourcePillar === 'education' || record.sourcePillar === 'worker') {
    context.sourcePillar = record.sourcePillar;
  }
  if (typeof record.updatedAt === 'string') context.updatedAt = record.updatedAt.slice(0, 40);
  return Object.keys(context).length ? context : null;
}

type SharedAddress = {
  province?: string;
  cityMunicipality?: string;
  barangay?: string;
  region?: string;
};

const locationKey = (value: string) => value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function sameProvince(left: string, right: string): boolean {
  return locationKey(getProvince(left)?.name ?? left) === locationKey(getProvince(right)?.name ?? right);
}

function sameCity(province: string, left: string, right: string): boolean {
  return locationKey(getCity(province, left)?.name ?? left) === locationKey(getCity(province, right)?.name ?? right);
}

function adoptSharedAddress<T extends SharedAddress>(current: T, context: SharedFamilyContext): T {
  const province = context.province?.trim() ?? '';
  const city = context.cityMunicipality?.trim() ?? '';
  const hasIncomingHierarchy = Boolean(province || city);
  return {
    ...current,
    ...(hasIncomingHierarchy ? {
      province,
      cityMunicipality: city,
      barangay: context.barangay?.trim() ?? '',
    } : context.barangay?.trim() && !current.barangay?.trim() ? { barangay: context.barangay.trim() } : {}),
    ...('region' in current && (context.region?.trim() || province)
      ? { region: context.region?.trim() || getProvince(province)?.region || '' }
      : {}),
  };
}

function mergeSharedAddress<T extends SharedAddress>(current: T, context: SharedFamilyContext): { address: T; matchesContext: boolean } {
  const province = current.province?.trim() ?? '';
  const city = current.cityMunicipality?.trim() ?? '';
  const incomingProvince = context.province?.trim() ?? '';
  const incomingCity = context.cityMunicipality?.trim() ?? '';
  const hasCurrentHierarchy = Boolean(province || city);

  if (!hasCurrentHierarchy) {
    return { address: adoptSharedAddress(current, context), matchesContext: true };
  }

  // A partial incoming hierarchy cannot prove that its city or barangay belongs to the saved parent.
  if (!incomingProvince || !incomingCity) return { address: current, matchesContext: false };
  if ((province && !sameProvince(province, incomingProvince)) || (city && !sameCity(incomingProvince, city, incomingCity))) {
    return { address: current, matchesContext: false };
  }

  if (!province || !city) return { address: adoptSharedAddress(current, context), matchesContext: true };

  return {
    address: {
      ...current,
      ...(!province ? { province: incomingProvince } : {}),
      ...(!city ? { cityMunicipality: incomingCity } : {}),
      ...(!current.barangay?.trim() && context.barangay?.trim() ? { barangay: context.barangay.trim() } : {}),
      ...('region' in current && context.region?.trim() ? { region: context.region.trim() } : {}),
    },
    matchesContext: true,
  };
}

function sharedLocationMetadata(address: SharedAddress, matchesContext: boolean) {
  if (!matchesContext || !address.province?.trim() || !address.cityMunicipality?.trim()) return null;
  return resolveLocationMetadata(address.province, address.cityMunicipality);
}

export function applySharedFamilyContextToPatient(patient: PatientProfile, context: SharedFamilyContext): PatientProfile {
  const { address } = mergeSharedAddress(patient.address, context);
  const next = { ...patient, address };
  if (context.is4Ps) next.is4PsBeneficiary = true;
  if (context.isPWD) next.isPWD = true;
  if (context.isOFW) next.isOFWOrDependent = true;
  if (context.isSoloParent) next.isSoloParent = true;
  if (context.isSeniorCitizen) next.isSeniorCitizen = true;
  if (context.monthlyIncome !== undefined && (patient.monthlyHouseholdIncome === undefined || patient.monthlyHouseholdIncome === 0 || patient.monthlyHouseholdIncome === defaultPatientProfile.monthlyHouseholdIncome)) {
    next.monthlyHouseholdIncome = context.monthlyIncome;
  }
  return next;
}

export function mergeEducationSharedContext<T extends object>(profile: T, context: SharedFamilyContext): T {
  const current = profile as Record<string, unknown>;
  const { address, matchesContext } = mergeSharedAddress(current, context);
  const merged = { ...current, ...address };
  const metadata = sharedLocationMetadata(address, matchesContext);
  if (metadata) merged.location = metadata.locationTier;
  if (metadata && current.regionalDailyWageManual !== true) {
    merged.regionalDailyWage = metadata.regionalDailyWage;
  }
  if (context.is4Ps && current.is4PsOrListahanan !== true) merged.is4PsOrListahanan = true;
  if (context.isPWD && current.isPWD !== true) merged.isPWD = true;
  if (context.isOFW && current.isOWWADependent !== true) merged.isOWWADependent = true;
  if (context.isSoloParent && current.isSoloParentDependent !== true) merged.isSoloParentDependent = true;
  return merged as T;
}

export function mergeWorkerSharedContext<T extends object>(profile: T, context: SharedFamilyContext): T {
  const current = profile as Record<string, unknown>;
  const { address, matchesContext } = mergeSharedAddress(current, context);
  const merged = { ...current, ...address };
  const metadata = sharedLocationMetadata(address, matchesContext);
  if (metadata && current.regionalDailyWageManual !== true) {
    merged.regionalDailyWage = metadata.regionalDailyWage;
  }
  if (!current.hasDisabilityOrDependent && context.isPWD) merged.hasDisabilityOrDependent = true;
  return merged as T;
}

export function getWorkerBridgeScenario(search: string): 'funeral' | 'sickness' | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const scenario = params.get('scenario');
  return scenario === 'funeral' || scenario === 'sickness' ? scenario : null;
}

export interface WorkerSessionData extends WorkerProfileInput {
  province?: string;
  cityMunicipality?: string;
  barangay?: string;
  hasDisabilityOrDependent?: boolean;
  worksheetName?: string;
  worksheetEmployer?: string;
  worksheetEmployerAddress?: string;
  worksheetStartDate?: string;
  worksheetEndDate?: string;
  worksheetUnpaidDetails?: string;
  worksheetEventDetails?: string;
  worksheetProjectTitle?: string;
  worksheetProposedBudget?: string;
}

export const WORKER_WORKSHEET_LIMITS = {
  worksheetName: 200,
  worksheetEmployer: 200,
  worksheetEmployerAddress: 200,
  worksheetStartDate: 10,
  worksheetEndDate: 10,
  worksheetUnpaidDetails: 2000,
  worksheetEventDetails: 2000,
  worksheetProjectTitle: 200,
  worksheetProposedBudget: 2000,
} as const;

export type WorkerWorksheetFields = { [K in keyof typeof WORKER_WORKSHEET_LIMITS]: string };

export const defaultWorkerWorksheetFields: WorkerWorksheetFields = {
  worksheetName: '',
  worksheetEmployer: '',
  worksheetEmployerAddress: '',
  worksheetStartDate: '',
  worksheetEndDate: '',
  worksheetUnpaidDetails: '',
  worksheetEventDetails: '',
  worksheetProjectTitle: '',
  worksheetProposedBudget: '',
};

const workerWageNumberLimits = {
  unpaidDays: 1_000_000_000,
  monthsWorkedInCurrentYear: 12,
  unusedServiceIncentiveLeaveDays: 5,
  yearsOfService: 1_000_000_000,
  unpaidOvertimeHours: 1_000_000_000,
  unpaidHolidayDays: 1_000_000_000,
} as const;

function normalizeWorkerSession(value: unknown): WorkerSessionData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const normalized = { ...record } as unknown as WorkerSessionData;
  for (const [key, limit] of Object.entries(workerWageNumberLimits) as [keyof typeof workerWageNumberLimits, number][]) {
    const amount = record[key];
    Object.assign(normalized, { [key]: typeof amount === 'number' && Number.isFinite(amount)
      ? Math.min(limit, Math.max(0, amount)) : 0 });
  }
  if (!['none', 'redundancy', 'retrenchment_closure', 'disease'].includes(String(record.separationCause))) {
    normalized.separationCause = 'none';
  }
  return normalized;
}

export function normalizeWorkerWorksheetFields(value: unknown): WorkerWorksheetFields {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    Object.entries(WORKER_WORKSHEET_LIMITS).map(([key, maxLength]) => [
      key,
      typeof record[key] === 'string' ? record[key].slice(0, maxLength) : '',
    ]),
  ) as WorkerWorksheetFields;
}

const workerSessionStore = createStore('tulongph-worker-session', 'workerSession');

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
  isSoloParent: false,
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
export async function savePatientProfile(data: PatientProfile, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.PATIENT, data);
}

export async function loadPatientProfile(): Promise<PatientProfile> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return defaultPatientProfile;
  const data = await get<PatientProfile>(KEYS.PATIENT);
  return data || defaultPatientProfile;
}

export async function saveRepresentativeProfile(data: RepresentativeProfile, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.REPRESENTATIVE, data);
}

export async function loadRepresentativeProfile(): Promise<RepresentativeProfile> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return defaultRepresentativeProfile;
  const data = await get<RepresentativeProfile>(KEYS.REPRESENTATIVE);
  return data || defaultRepresentativeProfile;
}

export async function saveMedicalCase(data: MedicalCase, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.CASE, data);
}

export async function loadMedicalCase(): Promise<MedicalCase> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return defaultMedicalCase;
  const data = await get<MedicalCase>(KEYS.CASE);
  return data || defaultMedicalCase;
}

export async function saveDocuments(docs: StoredDocument[], expectedGeneration?: number, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  const generationToCheck = expectedGeneration ?? wipeGeneration;
  if (generationToCheck !== wipeGeneration) return;
  await set(KEYS.DOCUMENTS, docs);
}

export async function loadDocuments(): Promise<StoredDocument[]> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return [];
  const docs = await get<StoredDocument[]>(KEYS.DOCUMENTS);
  return docs || [];
}

export async function saveApplications(apps: ApplicationRecord[], token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.APPLICATIONS, apps);
}

export async function loadApplications(): Promise<ApplicationRecord[]> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return [];
  const apps = await get<ApplicationRecord[]>(KEYS.APPLICATIONS);
  return apps || [];
}

export async function saveTreatmentTracker(data: TreatmentSessionTracker, token?: RestoreSessionToken): Promise<void> {
  const expectedGeneration = wipeGeneration;
  await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping || (token === undefined && expectedGeneration !== wipeGeneration)) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.TREATMENT_TRACKER, data);
}

export async function loadTreatmentTracker(): Promise<TreatmentSessionTracker | null> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return null;
  const data = await get<TreatmentSessionTracker>(KEYS.TREATMENT_TRACKER);
  return data ?? null;
}

export async function clearTreatmentTracker(token?: RestoreSessionToken): Promise<void> {
  const expectedGeneration = wipeGeneration;
  await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping || (token === undefined && expectedGeneration !== wipeGeneration)) return;
  if (!canWriteDuringRestore(token)) return;
  await del(KEYS.TREATMENT_TRACKER);
}

export async function saveOFWCaseTracker(data: OFWCaseRecord, token?: RestoreSessionToken): Promise<void> {
  const expectedGeneration = wipeGeneration;
  await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping || (token === undefined && expectedGeneration !== wipeGeneration)) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.OFW_CASE_TRACKER, data);
}

export async function loadOFWCaseTracker(): Promise<OFWCaseRecord | null> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return null;
  return (await get<OFWCaseRecord>(KEYS.OFW_CASE_TRACKER)) ?? null;
}

export async function clearOFWCaseTracker(token?: RestoreSessionToken): Promise<void> {
  const expectedGeneration = wipeGeneration;
  await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping || (token === undefined && expectedGeneration !== wipeGeneration)) return;
  if (!canWriteDuringRestore(token)) return;
  await del(KEYS.OFW_CASE_TRACKER);
}

export async function saveGWATracker(data: GWATrackerRecord, token?: RestoreSessionToken): Promise<void> {
  const expectedGeneration = wipeGeneration;
  if (!isGWATrackerRecord(data)) throw new TypeError('Invalid GWA tracker record.');
  await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping || (token === undefined && expectedGeneration !== wipeGeneration)) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.GWA_TRACKER, data);
}

export async function loadGWATracker(): Promise<GWATrackerRecord | null> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return null;
  const data = await get<unknown>(KEYS.GWA_TRACKER);
  return isGWATrackerRecord(data) ? data : null;
}

export async function clearGWATracker(token?: RestoreSessionToken): Promise<void> {
  const expectedGeneration = wipeGeneration;
  await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping || (token === undefined && expectedGeneration !== wipeGeneration)) return;
  if (!canWriteDuringRestore(token)) return;
  await del(KEYS.GWA_TRACKER);
}

export async function clearAllUserData(): Promise<void> {
  wipeGeneration++;
  wiping = true;
  if (restoreLockActive) {
    activeRestoreToken = null;
    restoreLockActive = false;
  }
  privacyChannel?.postMessage('wipe-start');
  const errors: unknown[] = [];
  let journalSessionId = restoreSessionId;
  if (typeof window !== 'undefined') {
    try { journalSessionId = localStorage.getItem(RESTORE_JOURNAL_SESSION_KEY) ?? journalSessionId; }
    catch (error) { errors.push(error); }
  }
  // 1. Purge all keys from IndexedDB (idb-keyval store)
  const clearResults = await Promise.allSettled([clear(), clear(workerSessionStore)]);
  if (clearResults.some(result => result.status === 'rejected')) {
    // Fallback to explicit key deletions
    const results = await Promise.allSettled([
      del(RESTORE_JOURNAL_KEY),
      ...(journalSessionId ? [del(`${RESTORE_JOURNAL_KEY}_${journalSessionId}`)] : []),
      del(KEYS.PATIENT),
      del(KEYS.REPRESENTATIVE),
      del(KEYS.CASE),
      del(KEYS.DOCUMENTS),
      del(KEYS.APPLICATIONS),
      del(KEYS.EDUCATION),
      del(KEYS.WORKER),
      del(KEYS.LANGUAGE),
      del(KEYS.SHARED_CONTEXT),
      del(KEYS.TREATMENT_TRACKER),
      del(KEYS.OFW_CASE_TRACKER),
      del(KEYS.GWA_TRACKER),
      del(KEYS.WORKER, workerSessionStore),
    ]);
    results.forEach(result => { if (result.status === 'rejected') errors.push(result.reason); });
  }

  // 2. Wipe browser local and session storage
  if (typeof window !== 'undefined') {
    try { localStorage.clear(); } catch (e) { errors.push(e); }
    try { localStorage.setItem('tulong_lang', 'taglish'); } catch (e) { errors.push(e); }
    try { sessionStorage.clear(); } catch (e) { errors.push(e); }

    // 3. Ask the app service worker to clear its caches, then verify the origin cache store is empty.
    try { await requestServiceWorkerCacheClear(); } catch (e) { errors.push(e); }
    if ('caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
        if ((await caches.keys()).length > 0) throw new Error('CacheStorage still contains entries after deletion.');
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

export async function saveEducationSession(data: StudentEducationProfile, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  localStorage.setItem(KEYS.EDUCATION, JSON.stringify(data));
}

export async function loadEducationSession(): Promise<StudentEducationProfile | null> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(KEYS.EDUCATION);
  if (!value) return null;
  try { return JSON.parse(value) as StudentEducationProfile; } catch { return null; }
}

export async function clearEducationSession(): Promise<void> {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.EDUCATION);
}

export async function saveSharedFamilyContext(context: Partial<SharedFamilyContext>, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  const generation = wipeGeneration;
  const previous = await loadSharedFamilyContext();
  if (wiping || generation !== wipeGeneration || !canWriteDuringRestore(token)) return;
  const merged = normalizeSharedFamilyContext({ ...previous, ...context, updatedAt: new Date().toISOString() });
  if (!merged) return;

  const province = merged.province?.trim() ?? '';
  const city = merged.cityMunicipality?.trim() ?? '';
  const locationChanged = previous !== null && (
    (context.province?.trim() && !sameProvince(previous.province ?? '', province)) ||
    (context.cityMunicipality?.trim() && !sameCity(province || previous.province || '', previous.cityMunicipality ?? '', city))
  );
  if (locationChanged && province && city) {
    const metadata = resolveLocationMetadata(province, city);
    merged.locationTier = metadata.locationTier;
    merged.regionalDailyWage = metadata.regionalDailyWage;
  }

  localStorage.setItem(KEYS.SHARED_CONTEXT, JSON.stringify(merged));
}

export async function loadSharedFamilyContext(): Promise<SharedFamilyContext | null> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return null;
  let value: string | null;
  try { value = localStorage.getItem(KEYS.SHARED_CONTEXT); } catch { return null; }
  if (!value) return null;
  try { return normalizeSharedFamilyContext(JSON.parse(value)); } catch { return null; }
}

export async function clearSharedFamilyContext(): Promise<void> {
  const results: Promise<unknown>[] = [];
  if (typeof indexedDB !== 'undefined') results.push(del(KEYS.SHARED_CONTEXT));
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(KEYS.SHARED_CONTEXT); } catch (error) { results.push(Promise.reject(error)); }
  }
  const settled = await Promise.allSettled(results);
  const failure = settled.find(result => result.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
}

export async function saveWorkerSession(data: WorkerSessionData, token?: RestoreSessionToken): Promise<void> {
  if (token === undefined) await ensureReadyForStorage();
  if (typeof window === 'undefined' || wiping) return;
  if (!canWriteDuringRestore(token)) return;
  await set(KEYS.WORKER, normalizeWorkerSession(data), workerSessionStore);
}

export async function clearWorkerSession(): Promise<void> {
  const errors: unknown[] = [];
  if (typeof indexedDB !== 'undefined') {
    try { await del(KEYS.WORKER, workerSessionStore); } catch (error) { errors.push(error); }
  }
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(KEYS.WORKER); } catch (error) { errors.push(error); }
  }
  if (errors.length) throw errors[0];
}

export async function loadWorkerSession(): Promise<WorkerSessionData | null> {
  await ensureReadyForStorage();
  if (typeof window === 'undefined') return null;
  const generation = wipeGeneration;
  let saved: WorkerSessionData | undefined;
  try { saved = await get<WorkerSessionData>(KEYS.WORKER, workerSessionStore); } catch {
    // Continue to the legacy localStorage draft when IndexedDB is unavailable.
  }
  if (wiping || generation !== wipeGeneration) return null;
  const normalized = normalizeWorkerSession(saved);
  if (normalized) return normalized;

  // Keep existing worker drafts when moving from the previous localStorage-backed session.
  const legacy = localStorage.getItem(KEYS.WORKER);
  if (!legacy) return null;
  let data: WorkerSessionData | null;
  try { data = normalizeWorkerSession(JSON.parse(legacy)); } catch { return null; }
  if (!data) return null;
  try {
    if (wiping || generation !== wipeGeneration) return null;
    await set(KEYS.WORKER, data, workerSessionStore);
    localStorage.removeItem(KEYS.WORKER);
  } catch {
    // Keep the legacy record until IndexedDB becomes available, and allow the caller to restore it.
  }
  return data;
}

async function requestServiceWorkerCacheClear(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  let registration: ServiceWorkerRegistration | undefined;
  try { registration = await navigator.serviceWorker.getRegistration('/'); } catch { return; }
  const candidates = [
    navigator.serviceWorker.controller,
    registration?.active,
    registration?.waiting,
    registration?.installing,
  ].filter((worker): worker is ServiceWorker => worker !== null && worker !== undefined);
  const workers = [...new Set(candidates.filter(worker => new URL(worker.scriptURL).pathname === '/sw.js'))];
  if (workers.length === 0) return;
  if (typeof MessageChannel === 'undefined') {
    workers.forEach(worker => worker.postMessage('CLEAR_CACHE'));
    return;
  }

  await Promise.all(workers.map(worker => new Promise<void>(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      resolve();
    }, 2000);
    channel.port1.onmessage = event => {
      if (event.data === 'CACHE_CLEARED') {
        clearTimeout(timer);
        channel.port1.close();
        resolve();
      }
    };
    try { worker.postMessage('CLEAR_CACHE', [channel.port2]); }
    catch {
      clearTimeout(timer);
      channel.port1.close();
      resolve();
    }
  })));
}
