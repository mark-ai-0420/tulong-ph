import { PatientProfile, MedicalCase, StackingStep, DocumentType } from '@/types/assistance';

export interface TriageResult {
  steps: StackingStep[];
  estimatedCoverageRange: string;
  recommendedOrderSummaryEn: string;
  recommendedOrderSummaryTl: string;
  criticalWarningsEn: string[];
  criticalWarningsTl: string[];
  allRequiredDocuments: DocumentType[];
}

export function calculateAidStacking(
  patient: PatientProfile,
  medicalCase: MedicalCase
): TriageResult {
  const steps: StackingStep[] = [];
  const criticalWarningsEn: string[] = [];
  const criticalWarningsTl: string[] = [];
  const docSet = new Set<DocumentType>();

  // Baseline required documents
  docSet.add('clinical_abstract');
  docSet.add('statement_of_account');
  docSet.add('patient_valid_id');
  docSet.add('barangay_indigency');

  if (patient.contactNumber.length < 10) {
    criticalWarningsEn.push('Ensure an active mobile number is provided to receive SMS updates from agencies.');
    criticalWarningsTl.push('Siguraduhing aktibo ang cellphone number para sa matatanggap na SMS text advisory.');
  }

  // STEP 1: PhilHealth
  steps.push({
    stepNumber: 1,
    agencyId: 'philhealth',
    agencyName: 'PhilHealth (Mandatory First Payer)',
    actionTitleEn: 'Deduct PhilHealth Case Rates at Billing Section',
    actionTitleTl: 'Ibawas ang PhilHealth Case Rates sa Billing Section',
    explanationEn:
      'By law, all other government agencies require PhilHealth to be deducted first before evaluating residual assistance. If not a member, request Point of Service (POS) enrollment at the hospital.',
    explanationTl:
      'Ayon sa batas, kailangan munang ibawas ang PhilHealth bago tumanggap ang Senado o PCSO ng aplikasyon. Kung walang PhilHealth, magpa-enroll sa hospital billing via Point of Service.',
    targetExpense: 'Initial Hospital Confinement & Room Charges',
    estimatedTime: 'Instant upon Billing computation',
    priorityScore: 100,
    requiredDocuments: ['patient_valid_id'],
  });

  // If OFW or dependent, add OWWA
  if (patient.isOFWOrDependent) {
    docSet.add('proof_of_relationship');
    steps.push({
      stepNumber: steps.length + 1,
      agencyId: 'owwa_welfare',
      agencyName: 'OWWA MedPlus Program',
      actionTitleEn: 'Claim OWWA MedPlus Grant (Up to ₱50,000)',
      actionTitleTl: 'Kunin ang OWWA MedPlus Grant (Hanggang ₱50,000)',
      explanationEn:
        'Registered active/inactive OFWs and immediate dependents qualify for financial grants matching the PhilHealth medical coverage.',
      explanationTl:
        'Ang mga aktibo o dating OFW at kanilang pamilya ay may karapatan sa supplemental cash grant na tutapat sa bawas ng PhilHealth.',
      targetExpense: 'Supplemental Medical Balance',
      estimatedTime: '3 to 5 Days',
      priorityScore: 95,
      requiredDocuments: ['clinical_abstract', 'statement_of_account', 'patient_valid_id', 'proof_of_relationship'],
    });
  }

  // STEP 2: Malasakit Center / DOH MAIP (If public hospital)
  if (medicalCase.hospitalType.startsWith('public') || medicalCase.hasMalasakitCenter) {
    steps.push({
      stepNumber: steps.length + 1,
      agencyId: 'doh_malasakit',
      agencyName: 'DOH Malasakit Center (In-Hospital)',
      actionTitleEn: 'Submit Malasakit Unified Form to Medical Social Services',
      actionTitleTl: 'Isumite ang Malasakit Form sa Medical Social Services ng Ospital',
      explanationEn:
        'Coordinate immediately with the in-hospital Malasakit desk to tap DOH-MAIP funds. This reduces hospital bills without requiring external travel.',
      explanationTl:
        'Pumunta agad sa Malasakit desk sa loob ng ospital para sa pondo ng DOH-MAIP. Mababawasan ang bill nang hindi kailangang lumabas ng pagamutan.',
      targetExpense: 'In-patient medications, lab procedures, and bed charges',
      estimatedTime: 'Within 24 Hours of submission',
      priorityScore: 90,
      requiredDocuments: ['clinical_abstract', 'statement_of_account', 'barangay_indigency', 'patient_valid_id'],
    });
  }

  // STEP 3: PCSO Medical Access Program
  const isSpecialtyTreatment =
    medicalCase.category === 'chemotherapy' ||
    medicalCase.category === 'dialysis' ||
    medicalCase.category === 'surgery_implants';

  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'pcso_map',
    agencyName: 'PCSO Medical Access Program (Online / Malasakit)',
    actionTitleEn: 'Secure PCSO Online Queue Slot for Guarantee Letter',
    actionTitleTl: 'Kumuha ng PCSO Online Queue Slot para sa Guarantee Letter',
    explanationEn:
      'Apply via PCSO E-Services portal starting at 7:00 AM on weekdays. Ensure all uploaded attachments are strictly single PDF files under 2MB each.',
    explanationTl:
      'Mag-apply sa PCSO E-Services simula 7:00 AM ng umaga. Tiyaking ang bawat ia-upload na PDF ay hindi lalampas sa 2MB.',
    targetExpense: isSpecialtyTreatment
      ? 'Chemotherapy medications / Dialysis packs / Surgical implants'
      : 'Residual hospital confinement balance',
    estimatedTime: '1 to 2 Business Days',
    priorityScore: 80,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'patient_valid_id',
      'authorization_letter',
      'proof_of_relationship',
    ],
  });

  // STEP 4: Presidential Action Center (PACe - Office of the President) for Catastrophic/Large Bills (₱50k+)
  const isHighBill = medicalCase.totalHospitalBill >= 50000 || medicalCase.netRemainingBalance >= 30000 || isSpecialtyTreatment;
  if (isHighBill) {
    docSet.add('social_case_study');
    steps.push({
      stepNumber: steps.length + 1,
      agencyId: 'pace_op',
      agencyName: 'Presidential Action Center (PACe) - Office of the President',
      actionTitleEn: 'Apply for High-Deficit Guarantee Letter via PACe (Office of the President)',
      actionTitleTl: 'Mag-file sa Presidential Action Center (PACe - Malacañang) para sa Malaking Bill',
      explanationEn:
        'PACe is the highest executive lifeline for catastrophic bills (₱50,000 to ₱1,000,000+), open-heart surgeries, transplants, and ICU care. Submit a request letter addressed to the President with your Social Case Study to pace@op.gov.ph or Malacañang Complex.',
      explanationTl:
        'Pangunahing sandigan para sa napakalaking hospital bill (₱50k pataas), ICU confinement, o major surgery. Mag-email ng liham-kahilingan sa Pangulo at Social Case Study sa pace@op.gov.ph o dalhin sa PACe Malacañang Complex upang mabigyan ng Guarantee Letter.',
      targetExpense: 'Catastrophic surgical procedures, ICU room deficit, organ transplants, or high medical balances',
      estimatedTime: '3 to 7 Business Days',
      priorityScore: 78,
      requiredDocuments: [
        'clinical_abstract',
        'statement_of_account',
        'barangay_indigency',
        'social_case_study',
        'patient_valid_id',
        'authorization_letter',
      ],
    });
  }

  // STEP 5: Senate Public Assistance Office (Senate Assist)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'senate_assist',
    agencyName: 'Senate Public Assistance Office (Senate Assist)',
    actionTitleEn: 'File for Hospital Guarantee Letter (GL) via assist.senate.gov.ph',
    actionTitleTl: 'Mag-apply ng Hospital Guarantee Letter (GL) sa assist.senate.gov.ph',
    explanationEn:
      'Upload remaining hospital billing and clinical abstract to receive an institutional Guarantee Letter. Note: Senate GL covers hospital billing directly and has a 90-day reapplication cooldown.',
    explanationTl:
      'I-upload ang natitirang billing at abstract para sa electronic Guarantee Letter (GL). Paalala: Ang Senate GL ay direktang ibinabawas sa hospital bill at may 90-araw na pagitan bago makapag-apply muli.',
    targetExpense: 'Hospital bill deficit or in-hospital specialty medicines (Guarantee Letter only)',
    estimatedTime: '2 to 3 Business Days',
    priorityScore: 75,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'patient_valid_id',
      'authorization_letter',
    ],
  });

  // STEP 6: DSWD AICS & LGU Social Welfare (Cash Assistance & Out-of-Pocket Support)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'dswd_aics',
    agencyName: 'DSWD AICS & City/Municipal Social Welfare',
    actionTitleEn: 'Avail Cash Aid for Outside Medicines, Labs, and Transportation',
    actionTitleTl: 'Humingi ng Cash Aid para sa Gamot sa Labas, Outside Labs, at Pamasahe',
    explanationEn:
      'The premier government channel for outright cash grants (₱1,000–₱10,000). Best used for prescription medicines bought from outside pharmacies, outside laboratory/CT scans, transportation, or funeral assistance.',
    explanationTl:
      'Pangunahing pinagkukunan ng direct cash aid (₱1,000–₱10,000). Gamitin ito para sa mga gamot na binili sa labas (Mercury/generic), outside laboratory/CT scans, pamasahe pauwi ng probinsya, o tulong pampalibing.',
    targetExpense: 'Out-of-pocket external pharmacy medicines, outside CT/MRI scans, transport fare, or caregiver food',
    estimatedTime: '1 to 3 Business Days',
    priorityScore: 70,
    requiredDocuments: ['clinical_abstract', 'barangay_indigency', 'patient_valid_id'],
  });

  // Anti-Duplication Rule Clarification
  criticalWarningsEn.push(
    'Anti-Duplication Note: If your Senate Assist Guarantee Letter is endorsed to DSWD for your hospital bill, do not file a separate DSWD claim for the same hospital statement. Reserve DSWD AICS for outside pharmacy receipts and travel fare.'
  );
  criticalWarningsTl.push(
    'Paalala sa Senate at DSWD: Kung ang iyong Senate Assist GL ay naka-endorso na sa DSWD para sa hospital bill, hindi na maaaring humingi ng hiwalay na DSWD hospital assistance para sa parehong billing. Gamitin ang DSWD AICS para sa mga gamot sa labas o pamasahe.'
  );

  // Calculate estimated coverage
  let estimatedCoverageRange = '60% to 100% of Net Hospital Bill';
  if (medicalCase.hospitalType.startsWith('public') && (patient.is4PsBeneficiary || patient.socioeconomicClass === 'indigent')) {
    estimatedCoverageRange = 'Up to 100% Zero-Billing via Malasakit, PACe & National Funds';
  } else if (medicalCase.hospitalType === 'private') {
    estimatedCoverageRange = '40% to 75% Coverage (Private hospitals have separate co-pay policies)';
    criticalWarningsEn.push(
      'Private hospitals require advance confirmation that they accept Senate Assist, PACe, and PCSO Guarantee Letters before discharge.'
    );
    criticalWarningsTl.push(
      'Sa pribadong ospital, tiyakin muna sa billing kung tumatanggap sila ng Senate Assist, PACe, at PCSO Guarantee Letter bago ang discharge.'
    );
  }

  return {
    steps,
    estimatedCoverageRange,
    recommendedOrderSummaryEn:
      '1. PhilHealth Deduction -> 2. In-Hospital Malasakit Center -> 3. PCSO Online Queue -> 4. PACe (Office of the President) / Senate GL -> 5. DSWD Cash for out-of-pocket',
    recommendedOrderSummaryTl:
      '1. PhilHealth Kaltas -> 2. Malasakit Center ng Ospital -> 3. PCSO Online Queue -> 4. PACe (Malacañang) / Senate GL -> 5. DSWD Cash para sa gamot sa labas at pamasahe',
    criticalWarningsEn,
    criticalWarningsTl,
    allRequiredDocuments: Array.from(docSet),
  };
}
