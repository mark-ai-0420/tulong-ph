import type { StackingStep } from '../types/assistance.ts';

export function buildOwwaMedPlusStep(stepNumber: number, details: Omit<StackingStep, 'stepNumber' | 'agencyId' | 'agencyName' | 'actionTitleEn' | 'actionTitleTl' | 'estimatedTime' | 'priorityScore' | 'requiredDocuments' | 'pathwayScope' | 'badgeTagEn' | 'badgeTagTl'>): StackingStep {
  return {
    stepNumber,
    agencyId: 'owwa_welfare',
    agencyName: 'OWWA MedPlus Program',
    actionTitleEn: 'Claim OWWA MedPlus Grant (Up to ₱50,000)',
    actionTitleTl: 'Kunin ang OWWA MedPlus Grant (Hanggang ₱50,000)',
    estimatedTime: '3 to 5 Days',
    priorityScore: 95,
    requiredDocuments: ['clinical_abstract', 'statement_of_account', 'patient_valid_id', 'proof_of_relationship'],
    pathwayScope: 'all',
    badgeTagEn: 'OFW Supplemental Aid',
    badgeTagTl: 'Tulong para sa OFW',
    ...details,
  };
}

export function buildPcsoMapStep(stepNumber: number, details: Omit<StackingStep, 'stepNumber' | 'agencyId' | 'estimatedTime' | 'requiredDocuments' | 'badgeTagEn' | 'badgeTagTl'>): StackingStep {
  return {
    stepNumber,
    agencyId: 'pcso_map',
    estimatedTime: '1 to 2 Business Days',
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'patient_valid_id',
      'authorization_letter',
      'proof_of_relationship',
    ],
    badgeTagEn: 'National GL',
    badgeTagTl: 'Pambansang GL',
    ...details,
  };
}

export function buildPaceStep(stepNumber: number, details: Omit<StackingStep, 'stepNumber' | 'agencyId' | 'agencyName' | 'estimatedTime' | 'requiredDocuments'>): StackingStep {
  return {
    stepNumber,
    agencyId: 'pace_op',
    agencyName: 'Presidential Action Center (PACe) - Malacañang',
    estimatedTime: '3 to 7 Business Days',
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'social_case_study',
      'patient_valid_id',
      'authorization_letter',
    ],
    ...details,
  };
}

export function buildSenateAssistStep(stepNumber: number, details: Omit<StackingStep, 'stepNumber' | 'agencyId' | 'agencyName' | 'estimatedTime' | 'requiredDocuments'>): StackingStep {
  return {
    stepNumber,
    agencyId: 'senate_assist',
    agencyName: 'Senate Public Assistance Office (Senate Assist)',
    estimatedTime: '2 to 3 Business Days',
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'patient_valid_id',
      'authorization_letter',
    ],
    ...details,
  };
}

export function buildDswdAicsStep(stepNumber: number, details: Omit<StackingStep, 'stepNumber' | 'agencyId' | 'agencyName' | 'estimatedTime' | 'requiredDocuments' | 'badgeTagEn' | 'badgeTagTl'>): StackingStep {
  return {
    stepNumber,
    agencyId: 'dswd_aics',
    agencyName: 'DSWD AICS Direct Cash Assistance',
    estimatedTime: '1 to 3 Business Days',
    requiredDocuments: ['clinical_abstract', 'barangay_indigency', 'patient_valid_id'],
    badgeTagEn: 'Direct Cash Grant',
    badgeTagTl: 'Direktang Ayudang Cash',
    ...details,
  };
}
