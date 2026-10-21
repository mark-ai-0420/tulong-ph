import type { ApplicationRecord, DocumentType, MedicalCase, PatientProfile, RepresentativeProfile, StoredDocument } from '@/types/assistance';
import type { StudentEducationProfile } from '@/types/education';
import type { WorkerSessionData, SharedFamilyContext, RestoreSessionToken } from '@/lib/storage';
import type { TreatmentSessionTracker } from '@/lib/treatmentTracker';
import type { OFWCaseRecord } from '@/lib/ofwTracker';
import { isGWATrackerRecord, type GWATrackerRecord } from '@/lib/gwaTracker';
import {
  beginBackupRestore,
  saveRestoreJournal,
  clearRestoreJournal,
  recoverAbandonedRestore,
  clearEducationSession,
  clearSharedFamilyContext,
  clearWorkerSession,
  finishBackupRestore,
  getWipeGeneration,
  isWipingInProgress,
  loadApplications,
  loadDocuments,
  loadEducationSession,
  loadMedicalCase,
  loadPatientProfile,
  loadRepresentativeProfile,
  loadSharedFamilyContext,
  loadTreatmentTracker,
  loadWorkerSession,
  saveApplications,
  saveDocuments,
  saveEducationSession,
  saveMedicalCase,
  savePatientProfile,
  saveRepresentativeProfile,
  saveSharedFamilyContext,
  saveTreatmentTracker,
  saveWorkerSession,
  clearTreatmentTracker,
  loadOFWCaseTracker,
  saveOFWCaseTracker,
  clearOFWCaseTracker,
  loadGWATracker,
  saveGWATracker,
  clearGWATracker,
} from '@/lib/storage';

export type RestoreErrorCode =
  | 'INVALID_PASSWORD_OR_CORRUPTED'
  | 'INVALID_FORMAT'
  | 'CORRUPTED_PAYLOAD'
  | 'RESTORE_LOCK_BUSY'
  | 'RESTORE_ABORTED_BY_WIPE'
  | 'RESTORE_FAILED_ROLLBACK_SUCCEEDED'
  | 'RESTORE_FAILED_ROLLBACK_FAILED';

export type RestoreEncryptedBackupResult =
  | { success: true; itemCount: number }
  | { success: false; code: RestoreErrorCode };

const MAGIC_HEADER_V1 = new TextEncoder().encode('TULONGPH_BACKUP_V1');
const MAGIC_HEADER_V2 = new TextEncoder().encode('TULONGPH_BACKUP_V2');
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_ITERATIONS_V1 = 100_000;

export interface BackupBundle {
  schemaVersion: 1;
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  documents: StoredDocument[];
  applications: ApplicationRecord[];
  educationSession: StudentEducationProfile | null;
  workerSession: WorkerSessionData | null;
  sharedFamilyContext: SharedFamilyContext | null;
  treatmentTracker?: TreatmentSessionTracker | null;
  ofwCaseTracker?: OFWCaseRecord | null;
  gwaTracker?: GWATrackerRecord | null;
}

const documentTypes: DocumentType[] = [
  'clinical_abstract', 'statement_of_account', 'barangay_indigency', 'patient_valid_id',
  'representative_valid_id', 'authorization_letter', 'proof_of_relationship', 'social_case_study',
  'doctor_prescription', 'death_certificate', 'certificate_of_enrollment', 'academic_grades',
  'income_tax_return', 'payslip_payroll', 'certificate_of_employment', 'incident_logbook',
];

const emergencyCategories = [
  'hospitalization', 'dialysis', 'chemotherapy', 'surgery_implants', 'prescription_medicines',
  'laboratory_diagnostics', 'burial_funeral', 'transportation_emergency', 'food_calamity',
];

const workerNumberFields = [
  'monthlySalary', 'averageMonthlySalaryCredit', 'highestSixMonthlySalaryCredit',
  'funeralAverageMonthlySalaryCredit', 'unemploymentAverageMonthlySalaryCredit', 'contributionMonths',
  'recentContributionMonths', 'qualifyingBenefitContributions', 'unemploymentRecentContributions', 'age',
  'pagibigContributionMonths', 'pagibigTAV', 'pagibigOutstandingLoan', 'sssOutstandingLoan',
  'sssCalamityOutstandingLoan', 'loanProratedDays', 'sicknessDays', 'approvedECMedicalReimbursement',
  'gsisNetTakeHomePay', 'gsisOutstandingLoan', 'gsisLoanTermYears', 'gsisEmergencyOutstanding',
  'regionalDailyWage', 'tupadDays', 'unpaidDays', 'monthsWorkedInCurrentYear',
  'unusedServiceIncentiveLeaveDays', 'yearsOfService', 'unpaidOvertimeHours', 'unpaidHolidayDays',
  'disabilityDurationMonths', 'gsisAdvanceInsuranceMonths', 'mp2MonthlyContribution', 'mp2OneTimeDeposit', 'mp2DividendRatePercent',
];

const workerBooleanFields = [
  'pagibigRecentContribution', 'ofwSeaBased', 'hadRecentCondonation', 'hasPastDueLoan',
  'employerRemittancesCurrent', 'calamityDeclared', 'employerDifferentialExempt', 'sickLeaveExhausted',
  'isWorkRelated', 'hasPermanentDisability', 'involuntarilySeparated', 'unemploymentClaimWithinThreeYears',
  'gsisPermanent', 'gsisEmergencyRenewal', 'regionalDailyWageManual',
  'returnedWithinThreeYears', 'hasDisabilityOrDependent',
];

const workerStringFields = [
  'sector', 'scenario', 'payrollSchedule', 'maternityType', 'contingencyDate', 'owwaMembership',
  'province', 'cityMunicipality', 'barangay', 'separationCause', 'pensionType', 'mp2ContributionMode',
  'mp2PayoutType', 'worksheetName', 'worksheetEmployer', 'worksheetEmployerAddress',
  'worksheetStartDate', 'worksheetEndDate', 'worksheetUnpaidDetails', 'worksheetEventDetails',
  'worksheetProjectTitle', 'worksheetProposedBudget',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStrings(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => typeof record[key] === 'string');
}

function hasBooleans(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => typeof record[key] === 'boolean');
}

function hasNumbers(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => typeof record[key] === 'number' && Number.isFinite(record[key]));
}

function optionalField(record: Record<string, unknown>, key: string, valid: (value: unknown) => boolean): boolean {
  return !(key in record) || valid(record[key]);
}

function isPatient(value: unknown): value is PatientProfile {
  if (!isRecord(value) || !hasStrings(value, [
    'firstName', 'middleName', 'lastName', 'dateOfBirth', 'contactNumber', 'email', 'socioeconomicClass',
  ])) return false;
  const address = value.address;
  if (!isRecord(address)) return false;
  return ['street', 'barangay', 'cityMunicipality', 'province', 'region'].every(key => typeof address[key] === 'string')
    && ['male', 'female', 'other'].includes(String(value.gender))
    && ['single', 'married', 'widowed', 'separated'].includes(String(value.civilStatus))
    && ['indigent', 'low_income', 'minimum_wage', 'middle_income'].includes(String(value.socioeconomicClass))
    && hasBooleans(value, ['isSeniorCitizen', 'isPWD', 'is4PsBeneficiary', 'isOFWOrDependent'])
    && optionalField(value, 'isSoloParent', item => typeof item === 'boolean')
    && optionalField(value, 'philhealthNumber', item => typeof item === 'string')
    && optionalField(value, 'monthlyHouseholdIncome', item => typeof item === 'number' && Number.isFinite(item) && item >= 0);
}

function isRepresentative(value: unknown): value is RepresentativeProfile {
  return isRecord(value)
    && hasBooleans(value, ['isPatientHimself'])
    && hasStrings(value, ['fullName', 'relationshipToPatient', 'contactNumber', 'email', 'validIdType', 'validIdNumber']);
}

function isMedicalCase(value: unknown): value is MedicalCase {
  if (!isRecord(value) || !hasStrings(value, ['category', 'diagnosis', 'hospitalName', 'hospitalType', 'hospitalCity', 'neededAssistanceType'])
    || !hasBooleans(value, ['hasMalasakitCenter'])
    || !hasStrings(value, ['attendingPhysician'])
    || !hasNumbers(value, ['totalHospitalBill', 'philhealthDeduction', 'seniorPwdDiscount', 'netRemainingBalance'])
    || ['totalHospitalBill', 'philhealthDeduction', 'seniorPwdDiscount', 'netRemainingBalance'].some(key => Number(value[key]) < 0)) return false;
  return emergencyCategories.includes(value.category as string)
    && ['public_doh', 'public_lgu', 'private'].includes(String(value.hospitalType))
    && ['guarantee_letter', 'cash_medicine', 'burial_help', 'transport_fare'].includes(String(value.neededAssistanceType))
    && optionalField(value, 'physicianLicenseNo', item => typeof item === 'string')
    && optionalField(value, 'dateAdmitted', item => typeof item === 'string')
    && optionalField(value, 'admissionStatus', item => ['confined_running_bill', 'discharge_final_soa', 'outpatient'].includes(String(item)))
    && optionalField(value, 'privateStrategy', item => ['gl_stacking', 'transfer_referral'].includes(String(item)))
    && optionalField(value, 'privateAccommodation', item => ['ward_bed', 'semi_private', 'private_room', 'icu'].includes(String(item)))
    && optionalField(value, 'isIcuOrHighDeficit', item => typeof item === 'boolean')
    && optionalField(value, 'hospitalAcceptsGovGL', item => typeof item === 'boolean' || item === 'unknown')
    && optionalField(value, 'doctorPFChargedSeparately', item => typeof item === 'boolean')
    && optionalField(value, 'isAutoCalculated', item => typeof item === 'boolean')
    && optionalField(value, 'philhealthMatchedCondition', item => typeof item === 'string')
    && optionalField(value, 'seniorPwdVatExempt', item => typeof item === 'number' && Number.isFinite(item))
    && optionalField(value, 'seniorPwdDiscountAmount', item => typeof item === 'number' && Number.isFinite(item));
}

function isSafeDataUrl(value: unknown, allowedMimeTypes: string[]): value is string {
  if (typeof value !== 'string') return false;
  return allowedMimeTypes.some(mimeType => value.startsWith(`data:${mimeType};base64,`))
    && /^[A-Za-z0-9+/=]*$/.test(value.slice(value.indexOf(',') + 1));
}

function isStoredDocument(value: unknown): value is StoredDocument {
  if (!isRecord(value) || !hasStrings(value, ['id', 'docType', 'fileName', 'mimeType', 'uploadedAt'])
    || !hasNumbers(value, ['originalSize', 'compressedSize'])
    || !hasBooleans(value, ['isCompliantUnder2MB'])) return false;
  return documentTypes.includes(value.docType as DocumentType)
    && value.mimeType === 'application/pdf'
    && Number(value.originalSize) >= 0 && Number(value.compressedSize) >= 0
    && optionalField(value, 'dataUrl', item => isSafeDataUrl(item, ['application/pdf']))
    && optionalField(value, 'attachmentDataUrl', item => isSafeDataUrl(item, ['image/jpeg']));
}

function isApplication(value: unknown): value is ApplicationRecord {
  if (!isRecord(value) || !hasStrings(value, ['id', 'agencyId', 'referenceNumber', 'submissionDate', 'status'])) return false;
  return ['senate_assist', 'pcso_map', 'doh_malasakit', 'dswd_aics', 'pace_op', 'lgu_congressional'].includes(String(value.agencyId))
    && ['draft', 'submitted', 'processing', 'gl_issued', 'claimed', 'rejected'].includes(String(value.status))
    && optionalField(value, 'amountGranted', item => typeof item === 'number' && Number.isFinite(item))
    && optionalField(value, 'glValidUntil', item => typeof item === 'string')
    && optionalField(value, 'canReapplyDate', item => typeof item === 'string')
    && optionalField(value, 'notes', item => typeof item === 'string');
}

function isEducationSession(value: unknown): value is StudentEducationProfile {
  if (!isRecord(value) || !hasStrings(value, ['fullName', 'schoolName', 'degreeProgram', 'cityMunicipality', 'educationLevel', 'schoolType', 'location', 'voucherCategory', 'selectedPrimaryProgram'])
    || !hasNumbers(value, ['annualTuitionAndFees', 'gwa', 'yearLevel', 'age', 'annualHouseholdIncome', 'previousAnnualGrant', 'ofwMonthlySalaryUSD', 'gsisSalaryGrade', 'trainingDays', 'regionalDailyWage'])
    || !hasBooleans(value, [
      'isFilipino', 'schoolParticipates', 'firstDegree', 'withinResidencyLimit', 'isIncomingFreshman', 'isExistingEsc',
      'hasSHSVoucher', 'noLocalSUC', 'priorityCourse', 'dostQualifiedSchool', 'isSTEMGraduateOrTop5', 'is4PsOrListahanan',
      'isPWD', 'isSoloParentDependent', 'isOWWADependent', 'owwaActive', 'isDeceasedOFWDependent', 'isCoconutFarmerDependent',
      'coconutPriorityCourse', 'isGSISDependent', 'isTop10PublicHS', 'hasFamilyCrisis', 'hasOtherNationalScholarship',
      'hasNC3OrHigher', 'regionalDailyWageManual', 'willingReturnService', 'needsLicensureReimbursement',
    ])) return false;
  return ['jhs', 'shs', 'college', 'tvet', 'medicine'].includes(String(value.educationLevel))
    && ['public', 'suc_luc', 'private'].includes(String(value.schoolType))
    && ['NCR', 'HUC', 'other'].includes(String(value.location))
    && ['public_jhs', 'esc', 'approved_private', 'none'].includes(String(value.voucherCategory));
}

function isWorkerSession(value: unknown): value is WorkerSessionData {
  if (!isRecord(value)) return false;
  const requiredNumbers = workerNumberFields.filter(key => ![
    'unpaidDays', 'monthsWorkedInCurrentYear', 'unusedServiceIncentiveLeaveDays', 'yearsOfService',
    'unpaidOvertimeHours', 'unpaidHolidayDays', 'disabilityDurationMonths', 'mp2MonthlyContribution',
    'gsisAdvanceInsuranceMonths', 'mp2OneTimeDeposit', 'mp2DividendRatePercent',
  ].includes(key));
  const requiredBooleans = workerBooleanFields.filter(key => ![
    'ofwSeaBased', 'hasDisabilityOrDependent',
  ].includes(key));
  const requiredStrings = workerStringFields.filter(key => ![
    'province', 'cityMunicipality', 'barangay', 'separationCause', 'pensionType', 'mp2ContributionMode',
    'mp2PayoutType', 'worksheetName', 'worksheetEmployer', 'worksheetEmployerAddress', 'worksheetStartDate',
    'worksheetEndDate', 'worksheetUnpaidDetails', 'worksheetEventDetails', 'worksheetProjectTitle',
    'worksheetProposedBudget',
  ].includes(key));
  if (!hasNumbers(value, requiredNumbers) || !hasBooleans(value, requiredBooleans) || !hasStrings(value, requiredStrings)) return false;
  return ['private', 'government', 'self_employed', 'ofw', 'displaced'].includes(String(value.sector))
    && ['loans', 'maternity', 'sickness', 'unemployment', 'wages', 'livelihood', 'funeral', 'pension_savings'].includes(String(value.scenario))
    && ['six_day_week', 'five_day_week', 'monthly_paid'].includes(String(value.payrollSchedule))
    && ['live_birth', 'solo_parent', 'miscarriage'].includes(String(value.maternityType))
    && ['active', 'inactive_once', 'inactive_multiple', 'none'].includes(String(value.owwaMembership))
    && optionalField(value, 'separationCause', item => ['none', 'redundancy', 'retrenchment_closure', 'disease'].includes(String(item)))
    && optionalField(value, 'pensionType', item => ['retirement', 'disability_ptd', 'disability_ppd'].includes(String(item)))
    && optionalField(value, 'mp2ContributionMode', item => ['monthly', 'lump_sum'].includes(String(item)))
    && optionalField(value, 'mp2PayoutType', item => ['compounded', 'annual'].includes(String(item)))
    && [...workerNumberFields.filter(key => !requiredNumbers.includes(key))].every(key => optionalField(value, key, item => typeof item === 'number' && Number.isFinite(item)))
    && [...workerBooleanFields.filter(key => !requiredBooleans.includes(key))].every(key => optionalField(value, key, item => typeof item === 'boolean'))
    && [...workerStringFields.filter(key => !requiredStrings.includes(key))].every(key => optionalField(value, key, item => typeof item === 'string'));
}

function isSharedFamilyContext(value: unknown): value is SharedFamilyContext {
  if (!isRecord(value) || Object.keys(value).length === 0) return false;
  return ['province', 'cityMunicipality', 'barangay', 'region', 'updatedAt'].every(key => optionalField(value, key, item => typeof item === 'string'))
    && ['regionalDailyWage', 'monthlyIncome'].every(key => optionalField(value, key, item => typeof item === 'number' && Number.isFinite(item) && item >= 0))
    && ['is4Ps', 'isPWD', 'isOFW', 'isSoloParent', 'isSeniorCitizen'].every(key => optionalField(value, key, item => typeof item === 'boolean'))
    && optionalField(value, 'locationTier', item => ['NCR', 'HUC', 'other'].includes(String(item)))
    && optionalField(value, 'sourcePillar', item => ['medical', 'education', 'worker'].includes(String(item)));
}

function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isTreatmentSessionTracker(value: unknown): value is TreatmentSessionTracker {
  if (!isRecord(value)
    || !['hemodialysis', 'peritoneal_dialysis', 'chemotherapy'].includes(String(value.category))
    || typeof value.year !== 'number' || !Number.isInteger(value.year) || value.year < 1900 || value.year > 9999
    || !(value.annualQuota === null || (typeof value.annualQuota === 'number' && Number.isInteger(value.annualQuota) && value.annualQuota >= 0 && value.annualQuota <= 100_000))
    || typeof value.sessionsCompleted !== 'number' || !Number.isInteger(value.sessionsCompleted) || value.sessionsCompleted < 0 || value.sessionsCompleted > 100_000
    || (value.weeklyCadence !== 2 && value.weeklyCadence !== 3)
    || !Array.isArray(value.entries) || value.entries.length > 10_000
    || !(value.glValidUntil === undefined || isDateString(value.glValidUntil))) {
    return false;
  }
  return value.entries.every(entry => isRecord(entry)
    && typeof entry.id === 'string' && entry.id.length > 0 && entry.id.length <= 120
    && isDateString(entry.date)
    && typeof entry.facility === 'string' && entry.facility.length <= 200
    && typeof entry.notes === 'string' && entry.notes.length <= 2_000);
}

function isOFWCaseRecord(value: unknown): value is OFWCaseRecord {
  if (!isRecord(value) || !hasStrings(value, [
    'id', 'ofwName', 'countryOrVessel', 'foreignEmployer', 'localAgency', 'caseType',
    'contractStatus', 'owwaStatus', 'currentMilestone', 'createdAt', 'updatedAt',
  ]) || typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 120
    || typeof value.ofwName !== 'string' || value.ofwName.length > 200
    || typeof value.countryOrVessel !== 'string' || value.countryOrVessel.length > 200
    || typeof value.foreignEmployer !== 'string' || value.foreignEmployer.length > 200
    || typeof value.localAgency !== 'string' || value.localAgency.length > 200
    || !['land_based', 'sea_based'].includes(String(value.category))
    || !['repatriation', 'unpaid_salaries', 'maltreatment', 'medical_emergency', 'seafarer_disability'].includes(String(value.caseType))
    || !['verified_dmw', 'unverified_direct_hire', 'tourist_irregular', 'expired'].includes(String(value.contractStatus))
    || !['active', 'inactive', 'undocumented_non_member'].includes(String(value.owwaStatus))
    || !optionalField(value, 'owwaContributions', item => item === undefined || item === 'single' || item === 'multiple')
    || !['reported', 'agency_contacted', 'mwo_case_opened', 'assistance_approved', 'repatriated', 'settled'].includes(String(value.currentMilestone))
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))
    || !Array.isArray(value.timeline) || value.timeline.length > 10_000
    || !optionalField(value, 'caseNumberDMW', item => typeof item === 'string' && item.length <= 120)
    || !optionalField(value, 'caseNumberMWO', item => typeof item === 'string' && item.length <= 120)
    || !optionalField(value, 'notes', item => typeof item === 'string' && item.length <= 2_000)) return false;

  const checklist = value.checklist;
  if (!isRecord(checklist)
    || !['passport', 'contract', 'oecOrEreg', 'incidentReportOrEvidence', 'localAgencyLetter'].every(key => typeof checklist[key] === 'boolean')) return false;

  return value.timeline.every(event => isRecord(event)
    && typeof event.id === 'string' && event.id.length > 0 && event.id.length <= 120
    && typeof event.date === 'string' && Number.isFinite(Date.parse(event.date))
    && ['reported', 'agency_contacted', 'mwo_case_opened', 'assistance_approved', 'repatriated', 'settled'].includes(String(event.milestone))
    && typeof event.title === 'string' && event.title.length <= 300
    && optionalField(event, 'notes', item => typeof item === 'string' && item.length <= 2_000)
    && optionalField(event, 'agencyOrDesk', item => typeof item === 'string' && item.length <= 200));
}

function validateBundle(value: unknown): BackupBundle {
  if (!isRecord(value) || value.schemaVersion !== 1
    || !isPatient(value.patient) || !isRepresentative(value.representative) || !isMedicalCase(value.medicalCase)
    || !Array.isArray(value.documents) || !value.documents.every(isStoredDocument)
    || !Array.isArray(value.applications) || !value.applications.every(isApplication)
    || !(value.educationSession === null || isEducationSession(value.educationSession))
    || !(value.workerSession === null || isWorkerSession(value.workerSession))
    || !(value.sharedFamilyContext === null || isSharedFamilyContext(value.sharedFamilyContext))
    || !optionalField(value, 'treatmentTracker', item => item === null || isTreatmentSessionTracker(item))
    || !optionalField(value, 'ofwCaseTracker', item => item === null || isOFWCaseRecord(item))
    || !optionalField(value, 'gwaTracker', item => item === null || isGWATrackerRecord(item))) {
    throw new Error('This backup has an invalid or unsupported data format.');
  }
  return value as unknown as BackupBundle;
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) throw new Error('Secure encryption is not available in this browser.');
  return globalThis.crypto;
}

async function deriveKey(password: string, salt: BufferSource, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const cryptoApi = getCrypto();
  const passwordKey = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function readBundle(): Promise<BackupBundle> {
  const [patient, representative, medicalCase, documents, applications, educationSession, workerSession, sharedFamilyContext, treatmentTracker, ofwCaseTracker, gwaTracker] = await Promise.all([
    loadPatientProfile(), loadRepresentativeProfile(), loadMedicalCase(), loadDocuments(), loadApplications(),
    loadEducationSession(), loadWorkerSession(), loadSharedFamilyContext(), loadTreatmentTracker(), loadOFWCaseTracker(), loadGWATracker(),
  ]);
  return { schemaVersion: 1, patient, representative, medicalCase, documents, applications, educationSession, workerSession, sharedFamilyContext, treatmentTracker, ofwCaseTracker, gwaTracker };
}

function assertRestoreNotWiped(generation: number): void {
  // The wipe may have completed while an IndexedDB write was pending.
  if (isWipingInProgress() || getWipeGeneration() !== generation) throw new Error('WIPE_ABORT');
}

async function persistBundle(bundle: BackupBundle, sessionToken: RestoreSessionToken, generation: number): Promise<void> {
  assertRestoreNotWiped(generation);
  await savePatientProfile(bundle.patient, sessionToken);
  assertRestoreNotWiped(generation);
  await saveRepresentativeProfile(bundle.representative, sessionToken);
  assertRestoreNotWiped(generation);
  await saveMedicalCase(bundle.medicalCase, sessionToken);
  assertRestoreNotWiped(generation);
  await saveDocuments(bundle.documents, undefined, sessionToken);
  assertRestoreNotWiped(generation);
  await saveApplications(bundle.applications, sessionToken);
  assertRestoreNotWiped(generation);
  if (bundle.educationSession) await saveEducationSession(bundle.educationSession, sessionToken);
  else await clearEducationSession();
  assertRestoreNotWiped(generation);
  if (bundle.workerSession) await saveWorkerSession(bundle.workerSession, sessionToken);
  else await clearWorkerSession();
  assertRestoreNotWiped(generation);
  await clearSharedFamilyContext();
  assertRestoreNotWiped(generation);
  if (bundle.sharedFamilyContext) await saveSharedFamilyContext(bundle.sharedFamilyContext, sessionToken);
  assertRestoreNotWiped(generation);
  if (bundle.treatmentTracker) await saveTreatmentTracker(bundle.treatmentTracker, sessionToken);
  else await clearTreatmentTracker(sessionToken);
  assertRestoreNotWiped(generation);
  if (bundle.ofwCaseTracker) await saveOFWCaseTracker(bundle.ofwCaseTracker, sessionToken);
  else await clearOFWCaseTracker(sessionToken);
  assertRestoreNotWiped(generation);
  if (bundle.gwaTracker) await saveGWATracker(bundle.gwaTracker, sessionToken);
  else await clearGWATracker(sessionToken);
  assertRestoreNotWiped(generation);
}

function itemCount(bundle: BackupBundle): number {
  return 3 + bundle.documents.length + bundle.applications.length
    + Number(bundle.educationSession !== null) + Number(bundle.workerSession !== null)
    + Number(bundle.sharedFamilyContext !== null) + Number(bundle.treatmentTracker != null)
    + Number(bundle.ofwCaseTracker != null) + Number(bundle.gwaTracker != null);
}

export async function createEncryptedBackup(password: string): Promise<Blob> {
  const initialWipeGen = getWipeGeneration();
  if (isWipingInProgress()) throw new Error('Backup aborted: data wipe in progress.');
  if (!password) throw new Error('Enter a password for this backup.');
  if (typeof window === 'undefined') throw new Error('Backups can only be created in a browser.');
  const cryptoApi = getCrypto();
  const bundle = await readBundle();
  if (isWipingInProgress() || getWipeGeneration() !== initialWipeGen) {
    throw new Error('Backup aborted: data wipe occurred during backup creation.');
  }
  const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(bundle));
  const ciphertext = new Uint8Array(await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  if (isWipingInProgress() || getWipeGeneration() !== initialWipeGen) {
    throw new Error('Backup aborted: data wipe occurred during backup creation.');
  }
  const output = new Uint8Array(MAGIC_HEADER_V2.length + SALT_LENGTH + IV_LENGTH + ciphertext.length);
  output.set(MAGIC_HEADER_V2, 0);
  output.set(salt, MAGIC_HEADER_V2.length);
  output.set(iv, MAGIC_HEADER_V2.length + SALT_LENGTH);
  output.set(ciphertext, MAGIC_HEADER_V2.length + SALT_LENGTH + IV_LENGTH);
  return new Blob([output], { type: 'application/octet-stream' });
}

export async function restoreEncryptedBackup(
  fileData: ArrayBuffer | Blob,
  password: string,
): Promise<RestoreEncryptedBackupResult> {
  const initialWipeGen = getWipeGeneration();
  if (isWipingInProgress()) return { success: false, code: 'RESTORE_ABORTED_BY_WIPE' };
  if (!password) throw new Error('Enter the backup password.');
  if (typeof window === 'undefined') throw new Error('Backups can only be restored in a browser.');
  const bytes = new Uint8Array(fileData instanceof Blob ? await fileData.arrayBuffer() : fileData);
  const headerLength = MAGIC_HEADER_V2.length;
  const minimumLength = headerLength + SALT_LENGTH + IV_LENGTH + 16;
  if (bytes.length < minimumLength) {
    return { success: false, code: 'INVALID_FORMAT' };
  }

  const isV2 = MAGIC_HEADER_V2.every((byte, index) => bytes[index] === byte);
  const isV1 = MAGIC_HEADER_V1.every((byte, index) => bytes[index] === byte);
  if (!isV2 && !isV1) {
    return { success: false, code: 'INVALID_FORMAT' };
  }
  const iterations = isV2 ? PBKDF2_ITERATIONS : PBKDF2_ITERATIONS_V1;

  const saltStart = headerLength;
  const ivStart = saltStart + SALT_LENGTH;
  const ciphertextStart = ivStart + IV_LENGTH;
  const salt = bytes.slice(saltStart, ivStart);
  const iv = bytes.slice(ivStart, ciphertextStart);
  const key = await deriveKey(password, salt, iterations);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv }, key, bytes.slice(ciphertextStart));
  } catch {
    return { success: false, code: 'INVALID_PASSWORD_OR_CORRUPTED' };
  }

  if (isWipingInProgress() || getWipeGeneration() !== initialWipeGen) {
    return { success: false, code: 'RESTORE_ABORTED_BY_WIPE' };
  }

  let bundle: BackupBundle;
  try {
    const decoded: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext));
    bundle = validateBundle(decoded);
  } catch {
    return { success: false, code: 'CORRUPTED_PAYLOAD' };
  }

  await recoverAbandonedRestore();
  const sessionToken = beginBackupRestore();
  if (sessionToken === null) return { success: false, code: 'RESTORE_LOCK_BUSY' };
  const generation = getWipeGeneration();
  let previous: BackupBundle;
  try {
    previous = await readBundle();
    assertRestoreNotWiped(generation);
    await saveRestoreJournal(sessionToken, previous);
  } catch (error) {
    finishBackupRestore(sessionToken, false);
    throw error;
  }
  try {
    await persistBundle(bundle, sessionToken, generation);
    await clearRestoreJournal(sessionToken);
    assertRestoreNotWiped(generation);
  } catch (error) {
    if ((error instanceof Error && error.message === 'WIPE_ABORT')
      || isWipingInProgress() || getWipeGeneration() !== generation) {
      finishBackupRestore(sessionToken, false);
      return { success: false, code: 'RESTORE_ABORTED_BY_WIPE' };
    }
    try {
      await persistBundle(previous, sessionToken, generation);
      await clearRestoreJournal(sessionToken);
      assertRestoreNotWiped(generation);
    } catch {
      const wiped = isWipingInProgress() || getWipeGeneration() !== generation;
      finishBackupRestore(sessionToken, false);
      return { success: false, code: wiped ? 'RESTORE_ABORTED_BY_WIPE' : 'RESTORE_FAILED_ROLLBACK_FAILED' };
    }
    finishBackupRestore(sessionToken, false);
    return { success: false, code: 'RESTORE_FAILED_ROLLBACK_SUCCEEDED' };
  }

  finishBackupRestore(sessionToken, true);
  return { success: true, itemCount: itemCount(bundle) };
}
