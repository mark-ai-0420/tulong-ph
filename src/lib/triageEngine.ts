import {
  PatientProfile,
  MedicalCase,
  StackingStep,
  DocumentType,
  HospitalType,
  PrivateHospitalStrategy,
  TriageResult,
} from '@/types/assistance';

export type { TriageResult };

// Standard Private Hospital Guidance definition
const PRIVATE_HOSPITAL_GUIDANCE: NonNullable<TriageResult['privateHospitalGuidance']> = {
  nonApplicableServicesEn: [
    'No Malasakit Center desks (RA 11463 restricts desks to government hospitals)',
    'No automatic No-Balance-Billing on private rooms',
    'Private doctor Professional Fees (PF) are billed separately',
  ],
  nonApplicableServicesTl: [
    'Walang Malasakit Center desk (bawal sa pribado ayon sa RA 11463)',
    'Walang No-Balance-Billing sa private rooms at private doctor fees',
    'Hiwalay ang singil ng doktor (PF) na hindi sagot ng karaniwang tulong',
  ],
  applicableServicesEn: [
    'PhilHealth Case Rates (mandatory billing deduction)',
    'Senior Citizen / PWD 20% discount + 12% VAT exemption (mandatory by law on room, labs, meds, and doctor PF)',
    'PCSO MAP Guarantee Letter (if private hospital has MOA)',
    'PACe Malacañang Guarantee Letter (bills ₱50k+, ICU, surgeries)',
    'Senate Assist Hospital Guarantee Letter',
    'DSWD AICS Direct Cash for outside generic pharmacies',
  ],
  applicableServicesTl: [
    'PhilHealth Case Rates (awtomatikong bawas sa billing)',
    'Senior / PWD 20% Diskwento + 12% VAT Free (sapilitan sa batas sa doctor fee at gamot)',
    'PCSO Guarantee Letter (kung may MOA ang pribadong ospital)',
    'PACe Malacañang Guarantee Letter (para sa bill na ₱50k+, ICU, operasyon)',
    'Senate Assist Guarantee Letter (kung accredited ang ospital)',
    'DSWD AICS Direct Cash (para sa gamot na bibilhin sa labas)',
  ],
  transferPlaybook: {
    hotlines: [
      {
        label: 'NPNRC (National Patient Navigation and Referral Center - One Hospital Command)',
        number: '1555 / (02) 886-59850 / 0919-977-3333',
        description: '24/7 DOH national coordination hub linking private ER/ICU transfers to vacant government tertiary beds nationwide.',
      },
      {
        label: 'Philippine General Hospital (PGH) Social Services',
        number: '(02) 8554-8400',
        description: 'UP-PGH Medical Social Services for charity ward admission queries and apex tertiary referral.',
      },
      {
        label: 'Philippine Heart Center (PHC)',
        number: '(02) 8925-2401',
        description: 'National specialty referral center for cardiovascular surgeries and catheterization care.',
      },
      {
        label: 'National Kidney and Transplant Institute (NKTI)',
        number: '(02) 8981-0300',
        description: 'Specialty referral hospital for hemodialysis deficits, kidney transplants, and peritoneal treatments.',
      },
      {
        label: 'Lung Center of the Philippines (LCP)',
        number: '(02) 8924-6101',
        description: 'Specialty tertiary hospital for critical respiratory conditions and thoracic interventions.',
      },
      {
        label: 'Philippine Children\'s Medical Center (PCMC)',
        number: '(02) 8588-9900',
        description: 'Specialty tertiary referral hospital for pediatric critical care, neonatology, and pediatric surgery.',
      },
    ],
    targetHospitals: [
      {
        name: 'Philippine General Hospital (PGH)',
        specialization: 'Apex National Referral / All Specialties & Indigent Care',
        phone: '(02) 8554-8400',
        address: 'Taft Ave, Ermita, Manila',
      },
      {
        name: 'Philippine Heart Center (PHC)',
        specialization: 'Cardiovascular Surgery, Interventional Cardiology, Pediatric Heart Surgery',
        phone: '(02) 8925-2401',
        address: 'East Ave, Diliman, Quezon City',
      },
      {
        name: 'National Kidney and Transplant Institute (NKTI)',
        specialization: 'Kidney Transplants, Dialysis Deficit, Urology & Nephrology',
        phone: '(02) 8981-0300',
        address: 'East Ave, Diliman, Quezon City',
      },
      {
        name: 'Lung Center of the Philippines (LCP)',
        specialization: 'Pulmonary Diseases, Thoracic Surgery, Critical Respiratory Care',
        phone: '(02) 8924-6101',
        address: 'Quezon Ave, Diliman, Quezon City',
      },
      {
        name: 'Philippine Children\'s Medical Center (PCMC)',
        specialization: 'Pediatric Intensive Care, Neonatal Care, Pediatric Oncology',
        phone: '(02) 8588-9900',
        address: 'Quezon Ave cor. Agham Rd, Quezon City',
      },
    ],
    checklistEn: [
      'Obtain signed Clinical Abstract and complete laboratory/imaging reports from the private attending physician.',
      'Secure certified preliminary Statement of Account (SOA) indicating remaining balance.',
      'Private attending physician issues formal "Fit to Transfer" clinical stability clearance (under RA 8344 / RA 10932).',
      'Initiate doctor-to-doctor call via NPNRC (1555) or directly to the receiving DOH specialty center to reserve an available ICU or charity bed.',
      'Request local LGU / CDRRMO / Red Cross dispatched emergency ambulance with paramedic support.',
      'Execute an RA 9439 Promissory Note with collateral or guarantor if partial debt remains unpaid upon private exit.',
      'Upon arrival at the public hospital, immediately report to the in-hospital Malasakit Center desk for 100% zero-billing enrollment.',
    ],
    checklistTl: [
      'Kumuha ng pirmadong Clinical Abstract at kumpletong kopya ng mga laboratory/CT/X-ray results mula sa attending physician.',
      'Humingi ng certified preliminary Statement of Account (SOA) o running bill mula sa billing section.',
      'Pumirma ang doktor sa "Fit to Transfer" certification alinsunod sa RA 8344 / RA 10932 (bawal harangin ang pasyente).',
      'Makipag-ugnayan ang doktor o pamilya sa NPNRC (1555) o sa tatanggaping pampublikong ospital para kumpirmahin ang bakanteng kama o ICU bed.',
      'Tumawag sa LGU CDRRMO, BFP, o Philippine Red Cross para sa libreng transfer ambulance na may kasamang paramedic.',
      'Lumagda sa RA 9439 Promissory Note sa pribadong ospital kung may natitirang balanse bago lumabas.',
      'Pagdating sa pampublikong ospital, mag-check-in agad sa in-hospital Malasakit Center desk upang ma-enroll sa 100% DOH-MAIP zero-billing.',
    ],
  },
};

/**
 * Baseline Document Set Builder
 */
function initDocSet(): Set<DocumentType> {
  const docSet = new Set<DocumentType>();
  docSet.add('clinical_abstract');
  docSet.add('statement_of_account');
  docSet.add('patient_valid_id');
  docSet.add('barangay_indigency');
  return docSet;
}

/**
 * Check if the medical case is high deficit / catastrophic
 */
function checkIsHighDeficit(medicalCase: MedicalCase): boolean {
  return (
    Boolean(medicalCase.isIcuOrHighDeficit) ||
    medicalCase.totalHospitalBill >= 50000 ||
    medicalCase.netRemainingBalance >= 30000 ||
    medicalCase.category === 'chemotherapy' ||
    medicalCase.category === 'dialysis' ||
    medicalCase.category === 'surgery_implants' ||
    medicalCase.privateAccommodation === 'icu'
  );
}

/**
 * Common Contact Warning Check
 */
function addContactWarning(patient: PatientProfile, warningsEn: string[], warningsTl: string[]) {
  if (patient.contactNumber.length < 10) {
    warningsEn.push('Ensure an active mobile number is provided to receive SMS updates from agencies.');
    warningsTl.push('Siguraduhing aktibo ang cellphone number para sa matatanggap na SMS text advisory.');
  }
}

/**
 * PATHWAY A: Public DOH Retained / Specialty Hospital Pathway
 */
function buildPublicDOHTriage(patient: PatientProfile, medicalCase: MedicalCase): TriageResult {
  const steps: StackingStep[] = [];
  const criticalWarningsEn: string[] = [];
  const criticalWarningsTl: string[] = [];
  const docSet = initDocSet();

  addContactWarning(patient, criticalWarningsEn, criticalWarningsTl);

  // STEP 1: Mandatory PhilHealth Case Rates & No Balance Billing (NBB)
  steps.push({
    stepNumber: 1,
    agencyId: 'philhealth',
    agencyName: 'PhilHealth (Mandatory First Payer)',
    actionTitleEn: 'Deduct PhilHealth Case Rates & Enforce No Balance Billing (NBB)',
    actionTitleTl: 'Ibawas ang PhilHealth Case Rates at Ipatupad ang No Balance Billing (NBB)',
    explanationEn:
      'Under the Universal Health Care Act and DOH policy, indigent, 4Ps, and sponsored members in DOH basic ward accommodations are legally entitled to No Balance Billing (NBB). Deduct case rates first before tapping government assistance.',
    explanationTl:
      'Ayon sa Universal Health Care Act at polisiya ng DOH, ang mga indigent, 4Ps, at sponsored members sa charity ward ng DOH hospitals ay sakop ng No Balance Billing (NBB). Unahing ibawas ang PhilHealth bago lumapit sa ibang ahensya.',
    targetExpense: 'Initial Hospital Confinement, Ward Accommodation & Case Rates',
    estimatedTime: 'Instant upon Billing computation',
    priorityScore: 100,
    requiredDocuments: ['patient_valid_id'],
    pathwayScope: 'public_only',
    badgeTagEn: 'Statutory First Deductor',
    badgeTagTl: 'Unang Kaltas sa Batas',
    warningNoteEn: 'Ensure PhilHealth Point of Service (POS) enrollment at billing if not yet an active member.',
    warningNoteTl: 'Magpa-enroll sa hospital billing via Point of Service (POS) kung hindi pa miyembro ng PhilHealth.',
  });

  // Optional: OWWA MedPlus if OFW
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
      pathwayScope: 'all',
      badgeTagEn: 'OFW Supplemental Aid',
      badgeTagTl: 'Tulong para sa OFW',
    });
  }

  // STEP 2: In-Hospital Malasakit Center Desk (DOH MAIP)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'doh_malasakit',
    agencyName: 'DOH Malasakit Center & MAIP (In-Hospital Desk)',
    actionTitleEn: 'Submit Unified Request at the In-Hospital Malasakit Center Desk',
    actionTitleTl: 'Isumite ang Form sa In-Hospital Malasakit Center Desk',
    explanationEn:
      'Report directly to the Malasakit Center desk inside the hospital. Malasakit pools DOH Medical Assistance for Indigent Patients (MAIP), PCSO, and DSWD to drive your hospital balance toward zero without external agency visits.',
    explanationTl:
      'Magtungo agad sa Malasakit Center desk sa loob ng ospital. Pinagsasama ng Malasakit ang DOH-MAIP, PCSO, at DSWD para ma-zero ang inyong bill nang hindi kailangang lumabas ng ospital.',
    targetExpense: 'In-patient medications, diagnostic procedures, blood products, and hospital deficit',
    estimatedTime: 'Within 24 Hours of submission',
    priorityScore: 90,
    requiredDocuments: ['clinical_abstract', 'statement_of_account', 'barangay_indigency', 'patient_valid_id'],
    pathwayScope: 'public_only',
    badgeTagEn: 'Zero-Billing Lifeline',
    badgeTagTl: 'Pangunahing Bawas sa Loob ng Ospital',
    warningNoteEn: 'Coordinate with Malasakit on Day 1 or Day 2 of admission rather than waiting for discharge day.',
    warningNoteTl: 'Magtungo sa Malasakit desk sa unang araw pa lang ng confinement; huwag hintayin ang araw ng discharge.',
  });

  // STEP 3: PCSO Medical Access Program (MAP)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'pcso_map',
    agencyName: 'PCSO Medical Access Program (MAP / Online)',
    actionTitleEn: 'Obtain PCSO Guarantee Letter for Specialty Medicines & Procedures',
    actionTitleTl: 'Kumuha ng PCSO Guarantee Letter para sa Gamutan at Operasyon',
    explanationEn:
      'Apply via the PCSO E-Services portal starting at 7:00 AM on weekdays. Ensure all uploaded attachments are strictly single PDF files under 2MB each.',
    explanationTl:
      'Mag-apply sa PCSO E-Services simula 7:00 AM ng umaga tuwing weekdays. Tiyaking ang bawat ia-upload na PDF ay hindi lalampas sa 2MB.',
    targetExpense: 'Hospital confinement deficit, chemotherapy drugs, dialysis, or surgical implants',
    estimatedTime: '1 to 2 Business Days',
    priorityScore: 82,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'patient_valid_id',
      'authorization_letter',
      'proof_of_relationship',
    ],
    pathwayScope: 'all',
    badgeTagEn: 'National GL',
    badgeTagTl: 'Pambansang GL',
    warningNoteEn: 'Upload limits are strictly 2MB per PDF. If portal slots are full, coordinate through the in-hospital Malasakit PCSO desk.',
    warningNoteTl: 'Mahigpit ang 2MB limit. Kung puno na ang online slot, makipag-ugnayan sa PCSO desk ng Malasakit Center.',
  });

  // STEP 4: PACe Malacañang for bills >= ₱50k or ICU
  const isHighBill = checkIsHighDeficit(medicalCase);
  if (isHighBill) {
    docSet.add('social_case_study');
    steps.push({
      stepNumber: steps.length + 1,
      agencyId: 'pace_op',
      agencyName: 'Presidential Action Center (PACe) - Malacañang',
      actionTitleEn: 'Apply for High-Deficit Guarantee Letter via PACe (Office of the President)',
      actionTitleTl: 'Mag-file sa Presidential Action Center (PACe - Malacañang) para sa Malaking Bill',
      explanationEn:
        'PACe is the highest executive lifeline for bills exceeding ₱50,000, intensive care (ICU), and major surgical operations. Submit a formal request letter addressed to the President with your Social Case Study to pace@op.gov.ph or Malacañang Complex.',
      explanationTl:
        'Pangunahing sandigan para sa hospital bill na ₱50k pataas, ICU confinement, o major surgery. Mag-email ng liham-kahilingan sa Pangulo at Social Case Study sa pace@op.gov.ph o dalhin sa Malacañang Complex.',
      targetExpense: 'Catastrophic surgical deficit, ICU charges, organ transplants, or high medical balances',
      estimatedTime: '3 to 7 Business Days',
      priorityScore: 80,
      requiredDocuments: [
        'clinical_abstract',
        'statement_of_account',
        'barangay_indigency',
        'social_case_study',
        'patient_valid_id',
        'authorization_letter',
      ],
      pathwayScope: 'all',
      badgeTagEn: 'Executive High-Bill Lifeline',
      badgeTagTl: 'Tulong ng Pangulo sa Malaking Bill',
      warningNoteEn: 'Requires a Social Case Study Report (SCSR) explicitly indicating indigent or financially incapacitated status.',
      warningNoteTl: 'Kailangan ng Social Case Study Report mula sa CSWDO/MSWDO na nagpapatunay ng kakapusan sa pambayad.',
    });
  }

  // STEP 5: Senate Assist GL
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'senate_assist',
    agencyName: 'Senate Public Assistance Office (Senate Assist)',
    actionTitleEn: 'File for Hospital Guarantee Letter (GL) via assist.senate.gov.ph',
    actionTitleTl: 'Mag-apply ng Hospital Guarantee Letter sa assist.senate.gov.ph',
    explanationEn:
      'Upload remaining hospital billing and clinical abstract to receive an institutional Guarantee Letter. Note: Senate GL covers hospital billing directly and has a 90-day reapplication cooldown.',
    explanationTl:
      'I-upload ang natitirang billing at abstract para sa electronic Guarantee Letter (GL). Paalala: Ang Senate GL ay direktang ibinabawas sa hospital bill at may 90-araw na cooldown.',
    targetExpense: 'Hospital bill deficit or specialty medical procedures (Guarantee Letter only)',
    estimatedTime: '2 to 3 Business Days',
    priorityScore: 75,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'patient_valid_id',
      'authorization_letter',
    ],
    pathwayScope: 'all',
    badgeTagEn: 'Online Senate GL',
    badgeTagTl: 'Online GL sa Senado',
    warningNoteEn: 'Strict 90-day reapplication cooldown from the date of the previous Senate Guarantee Letter.',
    warningNoteTl: 'Mahigpit ang 90-day cooldown bago makapag-apply muli sa Senado.',
  });

  // STEP 6: DSWD AICS Direct Cash
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'dswd_aics',
    agencyName: 'DSWD AICS Direct Cash Assistance',
    actionTitleEn: 'Claim Direct Cash Aid for Outside Pharmacies & Transportation',
    actionTitleTl: 'Humingi ng Cash Aid para sa Gamot sa Labas at Pamasahe',
    explanationEn:
      'The premier government channel for outright cash grants (₱1,000–₱10,000). Best used for prescription medicines bought from outside pharmacies when out of stock in-house, outside laboratory/CT scans, or travel fare.',
    explanationTl:
      'Pangunahing pinagkukunan ng direct cash aid (₱1,000–₱10,000). Gamitin ito para sa mga gamot na binili sa labas (Mercury/generic), outside laboratory/CT scans, o pamasahe pauwi ng probinsya.',
    targetExpense: 'Out-of-pocket external pharmacy medicines, outside CT/MRI scans, transport fare, or caregiver food',
    estimatedTime: '1 to 3 Business Days',
    priorityScore: 70,
    requiredDocuments: ['clinical_abstract', 'barangay_indigency', 'patient_valid_id'],
    pathwayScope: 'all',
    badgeTagEn: 'Direct Cash Grant',
    badgeTagTl: 'Direktang Ayudang Cash',
    warningNoteEn: 'Anti-Duplication Note: If your Senate GL is endorsed to DSWD for hospital bills, do not file a duplicate claim for the same bill. Reserve DSWD for outside medicine receipts and transport.',
    warningNoteTl: 'Paalala: Kung ang Senate GL ay naka-endorso na sa DSWD para sa hospital bill, huwag mag-file ng hiwalay para sa parehong billing. Gamitin ang DSWD sa reseta sa labas at pamasahe.',
  });

  criticalWarningsEn.push(
    'Anti-Duplication Note: If your Senate Assist Guarantee Letter is endorsed to DSWD for your hospital bill, do not file a separate DSWD claim for the same hospital statement. Reserve DSWD AICS for outside pharmacy receipts and travel fare.'
  );
  criticalWarningsTl.push(
    'Paalala sa Senate at DSWD: Kung ang iyong Senate Assist GL ay naka-endorso na sa DSWD para sa hospital bill, huwag mag-file ng hiwalay na DSWD claim para sa parehong billing. Gamitin ang DSWD AICS para sa mga gamot sa labas o pamasahe.'
  );

  return {
    steps,
    estimatedCoverageRange: '90% to 100% Zero-Billing (DOH-MAIP & Charity Ward)',
    recommendedOrderSummaryEn:
      '1. PhilHealth NBB Deduction -> 2. In-Hospital Malasakit Center Desk -> 3. PCSO Online Queue -> 4. PACe (Office of the President) / Senate GL -> 5. DSWD Cash for out-of-pocket',
    recommendedOrderSummaryTl:
      '1. PhilHealth Kaltas (NBB) -> 2. Malasakit Center ng Ospital -> 3. PCSO Online Queue -> 4. PACe (Malacañang) / Senate GL -> 5. DSWD Cash para sa gamot sa labas at pamasahe',
    criticalWarningsEn,
    criticalWarningsTl,
    allRequiredDocuments: Array.from(docSet),
    hospitalType: 'public_doh',
  };
}

/**
 * PATHWAY B: Public LGU Provincial / City Hospital Pathway
 */
function buildPublicLGUTriage(patient: PatientProfile, medicalCase: MedicalCase): TriageResult {
  const steps: StackingStep[] = [];
  const criticalWarningsEn: string[] = [];
  const criticalWarningsTl: string[] = [];
  const docSet = initDocSet();

  addContactWarning(patient, criticalWarningsEn, criticalWarningsTl);

  // STEP 1: PhilHealth Case Rates & NBB (ward capacity permitting)
  steps.push({
    stepNumber: 1,
    agencyId: 'philhealth',
    agencyName: 'PhilHealth (Mandatory First Payer)',
    actionTitleEn: 'Apply PhilHealth Case Rates & Verify Ward NBB Entitlement',
    actionTitleTl: 'Ibawas ang PhilHealth Case Rates at Alamin ang NBB sa Ward',
    explanationEn:
      'PhilHealth case rates must be deducted first. Patients confined in basic wards who are classified as indigent or sponsored members qualify for No Balance Billing (NBB), subject to local LGU facility capacity and drug formulary availability.',
    explanationTl:
      'Dapat maunang ibawas ang PhilHealth case rates. Ang mga pasyente sa charity ward na indigent o 4Ps ay may karapatan sa No Balance Billing (NBB) depende sa gamit at kapasidad ng LGU ospital.',
    targetExpense: 'Basic hospital accommodation, room charges, and standardized case rates',
    estimatedTime: 'Instant upon Billing computation',
    priorityScore: 100,
    requiredDocuments: ['patient_valid_id'],
    pathwayScope: 'public_only',
    badgeTagEn: 'Mandatory First Deductor',
    badgeTagTl: 'Unang Bawas sa Billing',
    warningNoteEn: 'If supplies or medicines are out of stock in the LGU hospital, secure doctor prescriptions stamped "Not Available" for LGU/DSWD reimbursement.',
    warningNoteTl: 'Kung walang gamot sa botika ng LGU ospital, humingi ng reseta na may tatak na "Not Available" para ma-reimburse sa City Hall o DSWD.',
  });

  // Optional: OWWA MedPlus if OFW
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
      pathwayScope: 'all',
      badgeTagEn: 'OFW Supplemental Aid',
      badgeTagTl: 'Tulong para sa OFW',
    });
  }

  // STEP 2: Malasakit Center or City/Municipal Social Welfare (CSWDO/MSWDO)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'doh_malasakit',
    agencyName: 'Malasakit Center / Hospital Social Service Desk',
    actionTitleEn: 'Submit Unified Request to Hospital Social Service / Malasakit',
    actionTitleTl: 'Isumite ang Form sa Hospital Social Service / Malasakit Desk',
    explanationEn:
      'Coordinate with the in-hospital Malasakit Center or Medical Social Services (MSS). If the LGU hospital does not host a Malasakit desk, the social service officer will endorse your papers to the Provincial/City Social Welfare Office.',
    explanationTl:
      'Pumunta sa Malasakit Center o Medical Social Service (MSS) ng LGU ospital. Kung walang Malasakit desk, ang social worker ng ospital ang mag-eendorso sa inyo sa City o Provincial Social Welfare Office.',
    targetExpense: 'Hospital laboratory fees, medications, and room balance deficit',
    estimatedTime: 'Within 24 to 48 Hours',
    priorityScore: 90,
    requiredDocuments: ['clinical_abstract', 'statement_of_account', 'barangay_indigency', 'patient_valid_id'],
    pathwayScope: 'public_only',
    badgeTagEn: 'In-Hospital Social Desk',
    badgeTagTl: 'Social Service ng Ospital',
  });

  // STEP 3: Governor & Mayor Medical Assistance / LGU Medicine Vouchers
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'lgu_cswdo',
    agencyName: "LGU Social Welfare (Governor's / Mayor's Office & CSWDO)",
    actionTitleEn: 'Avail LGU Guarantee Letter & Municipal Medicine Vouchers',
    actionTitleTl: 'Kumuha ng LGU Guarantee Letter at Libreng Gamot sa Munisipyo',
    explanationEn:
      'City and provincial governments maintain dedicated medical trust funds, pharmacy vouchers, and direct financial subsidies for local residents. Submit your Barangay Residency and Indigency at the City/Municipal Hall.',
    explanationTl:
      'May pondo ang opisina ng Mayor at Gobernador (CSWDO/MSWDO) para sa libreng gamot sa botika ng lungsod o Guarantee Letter para sa ospital. Magdala ng Barangay Indigency at Residency sa munisipyo o kapitolyo.',
    targetExpense: 'Local pharmacy medicine vouchers, hospital bill deficit, or municipal ambulance assistance',
    estimatedTime: '1 to 3 Days',
    priorityScore: 85,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'patient_valid_id',
      'representative_valid_id',
    ],
    pathwayScope: 'public_only',
    badgeTagEn: 'LGU Provincial / City Aid',
    badgeTagTl: 'Ayuda ng Probinsya / Lungsod',
    warningNoteEn: 'Many LGUs have express medicine vouchers that can be redeemed immediately at designated partner municipal pharmacies.',
    warningNoteTl: 'Maraming munisipyo ang may mabilisang medicine voucher na maaaring ipalit agad sa mga partner na botika.',
  });

  // STEP 4: PCSO MAP
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'pcso_map',
    agencyName: 'PCSO Medical Access Program (MAP)',
    actionTitleEn: 'Secure PCSO Online Queue Slot or Branch Guarantee Letter',
    actionTitleTl: 'Kumuha ng PCSO Online Queue Slot o GL sa Branch',
    explanationEn:
      'File an online application at 7:00 AM on weekdays via PCSO E-Services, or visit the nearest PCSO Provincial Branch Office if online slots fill up quickly in your region.',
    explanationTl:
      'Mag-apply online ng 7:00 AM tuwing weekdays sa PCSO E-Services, o pumunta sa pinakamalapit na sangay ng PCSO sa probinsya kung maubusan ng online slots.',
    targetExpense: 'Remaining hospital balance, specialty diagnostic tests, or dialysis/chemo supplies',
    estimatedTime: '1 to 2 Business Days',
    priorityScore: 80,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'patient_valid_id',
      'authorization_letter',
      'proof_of_relationship',
    ],
    pathwayScope: 'all',
    badgeTagEn: 'National GL',
    badgeTagTl: 'Pambansang GL',
  });

  // STEP 5: Senate Assist GL
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'senate_assist',
    agencyName: 'Senate Public Assistance Office (Senate Assist)',
    actionTitleEn: 'File for Hospital Guarantee Letter via assist.senate.gov.ph',
    actionTitleTl: 'Mag-apply ng Hospital Guarantee Letter sa assist.senate.gov.ph',
    explanationEn:
      'Submit the running hospital bill to the Senate Assist portal for an additional digital Guarantee Letter credited to your LGU hospital account.',
    explanationTl:
      'Isumite ang running bill sa Senate Assist portal para sa karagdagang Guarantee Letter na ibabawas sa bill ng inyong LGU ospital.',
    targetExpense: 'Hospital bill balance deficit',
    estimatedTime: '2 to 3 Business Days',
    priorityScore: 75,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'patient_valid_id',
      'authorization_letter',
    ],
    pathwayScope: 'all',
    badgeTagEn: 'National Senate GL',
    badgeTagTl: 'Pambansang Senate GL',
  });

  // STEP 6: DSWD AICS Direct Cash
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'dswd_aics',
    agencyName: 'DSWD AICS Direct Cash Assistance',
    actionTitleEn: 'Claim Direct Cash Aid for Outside Medicines & Transport',
    actionTitleTl: 'Kumuha ng Direct Cash Aid para sa Gamot sa Labas at Pamasahe',
    explanationEn:
      'Essential for purchasing prescribed medications and medical disposables that the LGU hospital pharmacy does not have in stock, as well as patient and watcher travel expenses.',
    explanationTl:
      'Mahalaga para sa pambili ng mga gamot at medical supplies na wala sa botika ng LGU ospital, pati na rin sa pamasahe ng pasyente at bantay.',
    targetExpense: 'External pharmacy medicines, out-of-stock medical disposables, and transportation',
    estimatedTime: '1 to 3 Business Days',
    priorityScore: 70,
    requiredDocuments: ['clinical_abstract', 'barangay_indigency', 'patient_valid_id'],
    pathwayScope: 'all',
    badgeTagEn: 'Direct Cash Grant',
    badgeTagTl: 'Direktang Ayudang Cash',
  });

  criticalWarningsEn.push(
    'LGU hospitals may have fluctuating medicine supplies. Always request stamped outside prescriptions to claim cash assistance from DSWD AICS and your Mayor\'s Office.'
  );
  criticalWarningsTl.push(
    'Maaaring maubusan ng gamot sa LGU ospital. Laging humingi ng reseta na may tatak para makakuha ng tulong sa DSWD AICS o sa tanggapan ng Mayor.'
  );

  return {
    steps,
    estimatedCoverageRange: '60% to 90% Bill Reduction (LGU & National Funds)',
    recommendedOrderSummaryEn:
      '1. PhilHealth Case Rates -> 2. Hospital Social Service / Malasakit -> 3. Governor/Mayor LGU Aid -> 4. PCSO MAP -> 5. Senate GL -> 6. DSWD Cash',
    recommendedOrderSummaryTl:
      '1. PhilHealth Kaltas -> 2. Social Service ng Ospital / Malasakit -> 3. Ayuda ng Mayor/Governor -> 4. PCSO MAP -> 5. Senate GL -> 6. DSWD Cash',
    criticalWarningsEn,
    criticalWarningsTl,
    allRequiredDocuments: Array.from(docSet),
    hospitalType: 'public_lgu',
  };
}

/**
 * PATHWAY C: Private Hospital Pathway - GL Stacking (`gl_stacking`)
 */
function buildPrivateGLStackingTriage(patient: PatientProfile, medicalCase: MedicalCase): TriageResult {
  const steps: StackingStep[] = [];
  const criticalWarningsEn: string[] = [];
  const criticalWarningsTl: string[] = [];
  const docSet = initDocSet();

  addContactWarning(patient, criticalWarningsEn, criticalWarningsTl);

  // STEP 1: PhilHealth Case Rates (Mandatory statutory first deductor at billing)
  steps.push({
    stepNumber: 1,
    agencyId: 'philhealth',
    agencyName: 'PhilHealth (Mandatory First Deductor)',
    actionTitleEn: 'Demand Mandatory PhilHealth Case Rate Deduction at Billing',
    actionTitleTl: 'Ipabawas ang PhilHealth Case Rates sa Billing ng Pribadong Ospital',
    explanationEn:
      'Under RA 11223, all private accredited hospitals must deduct PhilHealth case rates from the final or running bill prior to requiring patient payments or accepting third-party guarantee letters.',
    explanationTl:
      'Alinsunod sa RA 11223, sapilitan sa accredited na pribadong ospital na ibawas ang PhilHealth case rates bago maningil sa pasyente o tumanggap ng Guarantee Letter.',
    targetExpense: 'Initial Private Hospital Room, Surgical, and Standard Case Rate Charges',
    estimatedTime: 'Instant upon Billing computation',
    priorityScore: 100,
    requiredDocuments: ['patient_valid_id'],
    pathwayScope: 'private_gl',
    badgeTagEn: 'Mandatory Statutory First Payer',
    badgeTagTl: 'Unang Kaltas Ayon sa Batas',
    warningNoteEn: 'Private hospitals cannot refuse PhilHealth deductions if accredited. Request an itemized statement showing the exact case rate credit.',
    warningNoteTl: 'Bawal tanggihan ng accredited na ospital ang PhilHealth. Humingi ng preliminary statement na nagpapakita ng case rate deduction.',
  });

  // STEP 2: Senior Citizen (RA 9994) / PWD (RA 10754) 20% Discount + 12% VAT Exemption
  steps.push({
    stepNumber: 2,
    agencyId: 'senior_pwd_statutory',
    agencyName: 'Senior Citizen (RA 9994) / PWD (RA 10754) Statutory Benefit',
    actionTitleEn: 'Enforce 20% Discount + 12% VAT Exemption on Hospital & Doctor Fees',
    actionTitleTl: 'Ipatupad ang 20% Diskwento + 12% VAT Exemption sa Ospital at Doctor Fee',
    explanationEn:
      'By law, private hospitals MUST apply a 20% discount and 12% VAT exemption on room charges, diagnostic tests, medicines, and attending doctor Professional Fees (PF). Present Senior or PWD ID immediately to billing and doctors.',
    explanationTl:
      'Ayon sa batas (RA 9994 at RA 10754), obligado ang pribadong ospital na magbawas ng 20% discount at 12% VAT exemption sa kwarto, laboratoryo, gamot, at pati sa Professional Fee (PF) ng doktor. Ipakita agad ang Senior o PWD ID.',
    targetExpense: 'Room accommodations, diagnostic imaging, laboratory tests, medicines, and Doctor Professional Fees (PF)',
    estimatedTime: 'Instant upon presentation of Senior/PWD ID',
    priorityScore: 98,
    requiredDocuments: ['patient_valid_id'],
    pathwayScope: 'private_gl',
    badgeTagEn: 'Mandatory Statutory Discount',
    badgeTagTl: 'Sapilitang Diskwento sa Batas',
    warningNoteEn: 'Mandatory by national law even in private hospitals. VAT exemption (12%) must be deducted first before applying the 20% discount on the net subtotal.',
    warningNoteTl: 'Sapilitan sa batas kahit sa pribadong ospital. Tinatanggal muna ang 12% VAT bago ibawas ang 20% discount sa halaga.',
  });

  // Optional: OWWA MedPlus if OFW
  if (patient.isOFWOrDependent) {
    docSet.add('proof_of_relationship');
    steps.push({
      stepNumber: steps.length + 1,
      agencyId: 'owwa_welfare',
      agencyName: 'OWWA MedPlus Program',
      actionTitleEn: 'Claim OWWA MedPlus Grant (Up to ₱50,000)',
      actionTitleTl: 'Kunin ang OWWA MedPlus Grant (Hanggang ₱50,000)',
      explanationEn:
        'Active and inactive OFWs and recognized dependents can claim cash reimbursements up to ₱50,000 matching their PhilHealth hospital coverage.',
      explanationTl:
        'Ang mga miyembro ng OWWA at kanilang dependents ay may karapatan sa hanggang ₱50,000 na cash grant na tumutugma sa ibinawas ng PhilHealth.',
      targetExpense: 'Private hospital bill balance',
      estimatedTime: '3 to 5 Days',
      priorityScore: 95,
      requiredDocuments: ['clinical_abstract', 'statement_of_account', 'patient_valid_id', 'proof_of_relationship'],
      pathwayScope: 'all',
      badgeTagEn: 'OFW Supplemental Aid',
      badgeTagTl: 'Tulong para sa OFW',
    });
  }

  // STEP 3: Credit & Collection Preliminary SOA & Medical Abstract coordination
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'private_credit_collection',
    agencyName: 'Hospital Credit & Collection / Billing Dept',
    actionTitleEn: 'Obtain Certified Running SOA & Medical Abstract for Government Endorsement',
    actionTitleTl: 'Kumuha ng Certified Running Bill (SOA) at Clinical Abstract sa Billing',
    explanationEn:
      'Request the Credit & Collection department to release an official interim Statement of Account (SOA) stamped for "Guarantee Letter Application" alongside the Attending Physician Medical Abstract. Ask specifically which government agencies (PCSO, Senate, PACe) have an active MOA with their facility.',
    explanationTl:
      'Humingi sa Billing / Credit & Collection ng certified preliminary Statement of Account (SOA) na may tatak para sa Guarantee Letter, kasama ang Clinical Abstract mula sa doktor. Itanong kung sinong mga ahensya (PCSO, Senado, PACe) ang may aktibong MOA sa kanilang ospital.',
    targetExpense: 'Prerequisite document bundle for external government Guarantee Letters',
    estimatedTime: 'Same Day (Request at morning rounds)',
    priorityScore: 92,
    requiredDocuments: ['clinical_abstract', 'statement_of_account'],
    pathwayScope: 'private_gl',
    badgeTagEn: 'Billing & Records Prerequisite',
    badgeTagTl: 'Kailangang Dokumento sa Billing',
    warningNoteEn: 'Do not wait for actual discharge day to request running bills. Public agencies require 2 to 5 days to issue Guarantee Letters.',
    warningNoteTl: 'Huwag hintayin ang mismong araw ng discharge. Ang mga ahensya ng gobyerno ay nangangailangan ng 2 hanggang 5 araw bago maglabas ng GL.',
  });

  // STEP 4: PCSO MAP Guarantee Letter (verify hospital MOA)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'pcso_map',
    agencyName: 'PCSO Medical Access Program (Accredited Partner Facility)',
    actionTitleEn: 'Secure PCSO Online Guarantee Letter for Private Confinement / Chemo / Dialysis',
    actionTitleTl: 'Mag-file ng PCSO Guarantee Letter para sa Accredited Private Hospital',
    explanationEn:
      'Apply at 7:00 AM on weekdays via PCSO E-Services. Verify that your private hospital is included in the PCSO partner facility dropdown. PCSO issues Guarantee Letters creditable against the hospital bill.',
    explanationTl:
      'Mag-apply ng 7:00 AM tuwing weekdays sa PCSO E-Services portal. Tiyaking kasama ang inyong pribadong ospital sa dropdown ng accredited facilities. Ang GL ay direktang ibabawas sa bill.',
    targetExpense: 'Private hospital room balance, surgical procedures, chemotherapy, or dialysis',
    estimatedTime: '1 to 2 Business Days',
    priorityScore: 85,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'patient_valid_id',
      'authorization_letter',
      'proof_of_relationship',
    ],
    pathwayScope: 'private_gl',
    badgeTagEn: 'National GL',
    badgeTagTl: 'Pambansang GL',
    warningNoteEn: 'Ensure all uploaded files are strictly single PDFs under 2MB. GL amounts are determined by the PCSO charity evaluation scale.',
    warningNoteTl: 'Dapat ay PDF under 2MB bawat file. Ang halaga ng GL ay batay sa pagsusuri ng PCSO social worker.',
  });

  // STEP 5: PACe Malacañang Guarantee Letter (for bills >= ₱50k, ICU, transplants)
  const isHighBill = checkIsHighDeficit(medicalCase);
  if (isHighBill) {
    docSet.add('social_case_study');
    steps.push({
      stepNumber: steps.length + 1,
      agencyId: 'pace_op',
      agencyName: 'Presidential Action Center (PACe) - Malacañang',
      actionTitleEn: 'Apply for High-Value Private Deficit Guarantee Letter via PACe',
      actionTitleTl: 'Mag-apply ng High-Value Guarantee Letter sa PACe (Office of the President)',
      explanationEn:
        'PACe can issue high-value Guarantee Letters (₱50,000 to ₱1,000,000+) to private hospitals that maintain an accreditation arrangement with the national government for catastrophic ICU care, organ transplants, and major surgeries. Send a formal letter addressed to the President with your Social Case Study to pace@op.gov.ph.',
      explanationTl:
        'Ang Malacañang PACe ay nagkakaloob ng malalaking Guarantee Letter (₱50k pataas) sa mga accredited na pribadong ospital para sa ICU confinement, organ transplant, at malalaking operasyon. I-email ang liham sa Pangulo at Social Case Study sa pace@op.gov.ph.',
      targetExpense: 'Catastrophic private ICU deficits, open-heart surgeries, or six-figure hospital balances',
      estimatedTime: '3 to 7 Business Days',
      priorityScore: 82,
      requiredDocuments: [
        'clinical_abstract',
        'statement_of_account',
        'barangay_indigency',
        'social_case_study',
        'patient_valid_id',
        'authorization_letter',
      ],
      pathwayScope: 'private_gl',
      badgeTagEn: 'High-Deficit GL',
      badgeTagTl: 'GL para sa Malaking Bill',
      warningNoteEn: 'Ensure the Social Case Study explicitly states that private hospitalization was necessitated by an acute emergency or referral.',
      warningNoteTl: 'Tiyaking nakasaad sa Social Case Study na emergency o walang available na public ICU kaya na-confine sa pribado.',
    });
  }

  // STEP 6: Senate Assist Hospital Guarantee Letter
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'senate_assist',
    agencyName: 'Senate Public Assistance Office (Senate Assist)',
    actionTitleEn: 'Submit Online Guarantee Letter Application via assist.senate.gov.ph',
    actionTitleTl: 'Isumite ang Online Guarantee Letter sa assist.senate.gov.ph',
    explanationEn:
      'Senate Assist issues electronic Guarantee Letters strictly to partner private hospitals that have a signed Memorandum of Agreement (MOA). Verify that your private hospital appears in the official portal directory before submitting.',
    explanationTl:
      'Nagbibigay ang Senado ng electronic Guarantee Letter sa mga pribadong ospital na may pinirmahang MOA. Tiyaking nakalista ang inyong ospital sa portal bago magsumite.',
    targetExpense: 'Remaining private hospital room deficit or inpatient medicines',
    estimatedTime: '2 to 3 Business Days',
    priorityScore: 78,
    requiredDocuments: [
      'clinical_abstract',
      'statement_of_account',
      'barangay_indigency',
      'patient_valid_id',
      'authorization_letter',
    ],
    pathwayScope: 'private_gl',
    badgeTagEn: 'Senate Partner GL',
    badgeTagTl: 'GL sa Partner Hospital',
    warningNoteEn: 'Strict 90-day cooldown period applies between Senate Assist grants per patient.',
    warningNoteTl: 'May 90-day cooldown bago makapag-apply muli ng Senate GL.',
  });

  // STEP 7: DSWD AICS Direct Cash (essential for buying outside pharmacy medicines to avoid private hospital markups)
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'dswd_aics',
    agencyName: 'DSWD AICS Direct Cash Assistance',
    actionTitleEn: 'Claim Direct Cash Aid to Purchase Outside Pharmacy Medicines',
    actionTitleTl: 'Kumuha ng Direct Cash Aid para sa Gamot sa Labas (Iwas-Markup)',
    explanationEn:
      'Private in-hospital pharmacies frequently mark up medicine and IV prices by 100% to 300%. Request outside doctor prescriptions and use DSWD AICS cash grants to purchase medicines at retail or generic pharmacies outside the hospital.',
    explanationTl:
      'Napakataas ng patong sa gamot sa loob ng pribadong botika (100%–300% markup). Humingi ng reseta sa labas at gamitin ang DSWD AICS cash para bumili sa generic o tingiang botika sa labas.',
    targetExpense: 'External pharmacy medicines, maintenance medications, and diagnostic imaging procedures',
    estimatedTime: '1 to 3 Business Days',
    priorityScore: 72,
    requiredDocuments: ['clinical_abstract', 'barangay_indigency', 'patient_valid_id'],
    pathwayScope: 'private_gl',
    badgeTagEn: 'Direct Cash Grant',
    badgeTagTl: 'Direktang Ayudang Cash',
    warningNoteEn: 'Bring doctor prescriptions explicitly authorizing external pharmacy procurement along with your Barangay Indigency.',
    warningNoteTl: 'Magdala ng reseta ng doktor na pinapayagang bilhin sa labas kasama ang Barangay Indigency.',
  });

  // STEP 8: RA 9439 (Anti-Hospital Detention Act) Promissory Note literacy if residual balance remains
  steps.push({
    stepNumber: steps.length + 1,
    agencyId: 'ra9439_promissory',
    agencyName: 'Legal Discharge Right: RA 9439 (Anti-Hospital Detention Act)',
    actionTitleEn: 'Execute Promissory Note with Guarantor/Mortgage for Legal Discharge',
    actionTitleTl: 'Lumagda sa Promissory Note sa Ilalim ng RA 9439 para Makauwi',
    explanationEn:
      'Under Republic Act No. 9439, it is strictly illegal for any hospital to detain, withhold discharge, or refuse release of medical records of non-private room patients due to unpaid bills. Patients may sign a notarized Promissory Note secured by a co-maker, mortgage, or guarantee.',
    explanationTl:
      'Ayon sa Batas Republika Blg. 9439, labag sa batas para sa anumang ospital na i-detain, pigilan ang paglabas, o ipagkait ang medical certificate ng pasyente sa ward/semi-private dahil sa kakulangan sa bayad. Maaaring pumirma ng Promissory Note na may co-maker o garantiya upang makauwi.',
    targetExpense: 'Residual unpaid balance upon hospital discharge clearance',
    estimatedTime: 'Same Day at discharge negotiation',
    priorityScore: 65,
    requiredDocuments: ['patient_valid_id', 'representative_valid_id'],
    pathwayScope: 'private_gl',
    badgeTagEn: 'Statutory Patient Protection',
    badgeTagTl: 'Proteksyon sa Ilalim ng Batas',
    warningNoteEn: 'Note: Full private deluxe suite patients are excluded from automatic criminal sanctions under RA 9439, but hospitals still cannot physically detain patients.',
    warningNoteTl: 'Paalala: Ang mga nasa private deluxe room ay hindi sakop ng buong proteksyon ng RA 9439, ngunit bawal pa rin ang pisikal na pagkulong sa pasyente.',
  });

  criticalWarningsEn.push(
    'Private Hospital Reality: Malasakit Centers are strictly unavailable in private hospitals (RA 11463). Government GLs require active MOAs with the facility, and attending doctor Professional Fees (PF) are billed separately.'
  );
  criticalWarningsEn.push(
    'Mandatory Statutory Discounts: Private hospitals are legally required (RA 9994 / RA 10754) to deduct 20% and 12% VAT exemption for Senior Citizens and PWDs on room, labs, medicines, and doctor fees.'
  );
  criticalWarningsTl.push(
    'Katotohanan sa Pribadong Ospital: Walang Malasakit Center sa pribadong ospital ayon sa RA 11463. Ang mga Guarantee Letter ay tinatanggap lamang kung may MOA ang ospital, at hiwalay ang singil sa Professional Fee (PF) ng doktor.'
  );
  criticalWarningsTl.push(
    'Sapilitang Diskwento: Obligado sa batas ang pribadong ospital na magbigay ng 20% discount at 12% VAT exemption para sa Senior Citizen at PWD sa kwarto, laboratoryo, gamot, at doctor PF.'
  );

  return {
    steps,
    estimatedCoverageRange: '35% to 70% Coverage (Private co-pays and doctor PF apply)',
    recommendedOrderSummaryEn:
      '1. PhilHealth Deduction -> 2. Senior/PWD 20% Discount + 12% VAT Exemption -> 3. Credit & Collection Preliminary SOA -> 4. PCSO & PACe GLs -> 5. Senate GL -> 6. DSWD Cash for Outside Pharmacy -> 7. RA 9439 Promissory Note',
    recommendedOrderSummaryTl:
      '1. PhilHealth Kaltas -> 2. Senior/PWD 20% Diskwento + VAT Exemption -> 3. Running SOA sa Billing -> 4. PCSO at PACe GLs -> 5. Senate GL -> 6. DSWD Cash para sa Gamot sa Labas -> 7. RA 9439 Promissory Note',
    criticalWarningsEn,
    criticalWarningsTl,
    allRequiredDocuments: Array.from(docSet),
    hospitalType: 'private',
    selectedStrategy: 'gl_stacking',
    privateHospitalGuidance: PRIVATE_HOSPITAL_GUIDANCE,
  };
}

/**
 * PATHWAY D: Private Hospital Pathway - Public Tertiary Transfer (`transfer_referral`)
 */
function buildPrivateTransferTriage(patient: PatientProfile, medicalCase: MedicalCase): TriageResult {
  const steps: StackingStep[] = [];
  const criticalWarningsEn: string[] = [];
  const criticalWarningsTl: string[] = [];
  const docSet = initDocSet();

  addContactWarning(patient, criticalWarningsEn, criticalWarningsTl);

  // STEP 1: Clinical Stabilization clearance (RA 8344 / RA 10932)
  steps.push({
    stepNumber: 1,
    agencyId: 'ra8344_stabilization',
    agencyName: 'Emergency Stabilization & Anti-Deposit Law (RA 8344 / RA 10932)',
    actionTitleEn: 'Secure Attending Physician "Fit to Transfer" Clinical Clearance',
    actionTitleTl: 'Kunin ang "Fit to Transfer" Clinical Clearance mula sa Doktor',
    explanationEn:
      'Under RA 8344 as amended by RA 10932, hospitals are legally mandated to administer emergency treatment and stabilization without requiring any advance deposit. Once stable, request formal medical clearance confirming the patient is fit for transport.',
    explanationTl:
      'Sa ilalim ng RA 8344 at RA 10932 (Anti-Deposit Law), obligado ang pribadong ospital na gamutin at i-stabilize ang pasyente nang walang paunang deposito. Kapag stable na, hilingin ang "Fit to Transfer" clearance para ligtas na mailipat.',
    targetExpense: 'Clinical stabilization assessment and transport safety clearance',
    estimatedTime: 'Immediate upon patient vitals stabilization',
    priorityScore: 100,
    requiredDocuments: ['clinical_abstract'],
    pathwayScope: 'private_transfer',
    badgeTagEn: 'Emergency Rights',
    badgeTagTl: 'Karapatan sa Emergency',
    warningNoteEn: 'Never attempt transfer without attending physician authorization and an ambulance equipped for the patient condition.',
    warningNoteTl: 'Huwag ililipat ang pasyente nang walang clearance ng doktor at angkop na ambulansya na may kaukulang medical equipment.',
  });

  // STEP 2: Release of complete Clinical Abstract, diagnostic tests, and preliminary statement
  steps.push({
    stepNumber: 2,
    agencyId: 'hospital_records_release',
    agencyName: 'Medical Records & Preliminary Statement of Account (SOA)',
    actionTitleEn: 'Demand Complete Diagnostic Records, Imaging Plates, and Itemized SOA',
    actionTitleTl: 'Kunin ang Lahat ng Laboratory Results, X-ray/CT Scan, at Running Bill',
    explanationEn:
      'The receiving public specialty hospital cannot evaluate admission without complete clinical data. Insist on immediate copies of all laboratory results, CT/MRI discs, pathology reports, and the itemized interim SOA.',
    explanationTl:
      'Hindi matatanggap ng pampublikong specialty hospital ang pasyente kung walang kumpletong tala. Kunin agad ang copies ng lahat ng laboratory tests, CT/X-ray scans, at itemized running bill.',
    targetExpense: 'Clinical data packet required by receiving tertiary triage teams',
    estimatedTime: 'Within 2 to 4 Hours of clearance',
    priorityScore: 95,
    requiredDocuments: ['clinical_abstract', 'statement_of_account'],
    pathwayScope: 'private_transfer',
    badgeTagEn: 'Transfer Documentation',
    badgeTagTl: 'Dokumentasyon sa Paglipat',
    warningNoteEn: 'Hospitals are required by medical ethics and DOH rules to provide copies of clinical abstracts upon formal request.',
    warningNoteTl: 'May obligasyon ang ospital na ibigay ang medical records at clinical abstract kapag hiniling para sa paglilipat.',
  });

  // STEP 3: Doctor-to-doctor bed hunting via NPNRC (1555) and DOH Specialty Centers
  steps.push({
    stepNumber: 3,
    agencyId: 'npnrc_referral',
    agencyName: 'National Patient Navigation & Referral Center (NPNRC / 1555)',
    actionTitleEn: 'Initiate Doctor-to-Doctor Transfer via NPNRC (1555) & DOH Specialty Centers',
    actionTitleTl: 'Magpa-coordinate sa NPNRC (1555) at DOH Specialty Hospitals para sa Bakanteng Kama',
    explanationEn:
      'Call the DOH 24/7 One Hospital Command hotline 1555 or contact receiving tertiary centers (PGH, Philippine Heart Center, NKTI, Lung Center, PCMC). Have the private attending physician speak directly with the receiving medical team to secure a guaranteed charity/ICU bed before dispatching.',
    explanationTl:
      'Tumawag sa DOH One Hospital Command hotline 1555 o direktang makipag-ugnayan sa PGH, Heart Center, NKTI, Lung Center, o PCMC. Dapat magkausap ang private attending doctor at receiving hospital doctor para matiyak na may bakanteng kama bago bumiyahe.',
    targetExpense: 'Bed allocation reservation at public tertiary or specialty facility',
    estimatedTime: '2 to 6 Hours (Dependent on tertiary bed availability)',
    priorityScore: 90,
    requiredDocuments: ['clinical_abstract', 'statement_of_account'],
    pathwayScope: 'private_transfer',
    badgeTagEn: '24/7 DOH Referral Command',
    badgeTagTl: 'Pambansang Referral Hotline',
    warningNoteEn: 'Do not discharge or board an ambulance until the receiving public hospital formally confirms acceptance and bed reservation.',
    warningNoteTl: 'HUWAG aalis sa pribadong ospital hangga\'t walang kumpirmadong pagtanggap at reserbasyon sa tatanggaping pampublikong ospital.',
  });

  // STEP 4: Private hospital settlement via RA 9439 Promissory Note + LGU ambulance dispatch
  steps.push({
    stepNumber: 4,
    agencyId: 'ra9439_promissory',
    agencyName: 'RA 9439 Promissory Note & LGU Emergency Ambulance Dispatch',
    actionTitleEn: 'Execute Promissory Note for Private Exit & Dispatch LGU / Red Cross Ambulance',
    actionTitleTl: 'Pumirma ng Promissory Note sa Pribadong Ospital at Tumawag ng LGU Ambulance',
    explanationEn:
      'If private hospitalization debt remains unpaid, execute a promissory note under RA 9439 to allow patient release. Contact your City/Municipal DRRMO or Philippine Red Cross for a free emergency transfer ambulance with life-support capabilities.',
    explanationTl:
      'Kung may natitirang utang sa pribadong ospital, lumagda sa promissory note alinsunod sa RA 9439 para payagang lumabas. Tawagan ang inyong CDRRMO/MDRRMO o Philippine Red Cross para sa libreng ambulansya na may kagamitang medikal.',
    targetExpense: 'Private hospital debt restructuring and inter-hospital emergency paramedic transit',
    estimatedTime: '1 to 2 Hours',
    priorityScore: 85,
    requiredDocuments: ['patient_valid_id', 'representative_valid_id'],
    pathwayScope: 'private_transfer',
    badgeTagEn: 'Exit & Transport Settlement',
    badgeTagTl: 'Paglabas at Transportasyon',
    warningNoteEn: 'Ensure the transfer ambulance has the necessary equipment (ventilator/oxygen/paramedic) matching the patient acuity.',
    warningNoteTl: 'Tiyaking may sapat na kagamitan (oxygen, monitor, paramedic) ang ambulansya ayon sa kalagayan ng pasyente.',
  });

  // STEP 5: Admission to Public DOH charity ward + 100% Malasakit Center activation to stop runaway private debt
  steps.push({
    stepNumber: 5,
    agencyId: 'doh_malasakit',
    agencyName: 'Public Hospital Charity Ward & In-Situ Malasakit Center',
    actionTitleEn: 'Complete Public Ward Admission & Activate 100% Malasakit Center Zero-Billing',
    actionTitleTl: 'Pumasok sa Charity Ward ng Pampublikong Ospital at I-activate ang 100% Malasakit Center',
    explanationEn:
      'Upon arrival and triage admission into the public specialty facility, immediately report to the in-hospital Malasakit Center desk. Present your Barangay Indigency to link DOH-MAIP and PCSO allocations, effectively driving the new hospitalization balance to 100% Zero-Billing.',
    explanationTl:
      'Pagkatanggap sa pampublikong tertiary hospital, magpunta agad sa in-hospital Malasakit Center desk. Ipakita ang Barangay Indigency para magamit ang DOH-MAIP at PCSO funds upang ma-zero ang bagong gastusin at mahinto ang patuloy na pagbaon sa utang.',
    targetExpense: 'Full hospitalization, specialty procedures, medications, and zero-balance coverage in public tertiary ward',
    estimatedTime: 'Within 24 Hours of public admission',
    priorityScore: 80,
    requiredDocuments: ['clinical_abstract', 'statement_of_account', 'barangay_indigency', 'patient_valid_id'],
    pathwayScope: 'private_transfer',
    badgeTagEn: 'Zero-Billing Recovery',
    badgeTagTl: 'Tulong Patungong Libreng Gamutan',
    warningNoteEn: 'Malasakit Center benefits in the public hospital only cover bills incurred at the receiving public facility, stopping future debt accumulation.',
    warningNoteTl: 'Ang Malasakit Center ng pampublikong ospital ay sumasagot sa bagong gastusin sa pampublikong pagamutan upang hindi na madagdagan ang utang.',
  });

  criticalWarningsEn.push(
    'CRITICAL TRANSFER RULE: Never transfer an emergency patient without guaranteed bed confirmation from the receiving hospital and formal doctor-to-doctor endorsement via NPNRC (Hotline 1555).'
  );
  criticalWarningsEn.push(
    'Under RA 8344 and RA 10932, private hospitals cannot refuse emergency stabilization or hold patients hostage for lack of cash deposit.'
  );
  criticalWarningsTl.push(
    'MAHALAGANG PAALALA SA PAGLIPAT: Huwag aalis sa pribadong ospital nang walang kumpirmadong reserbasyon ng kama mula sa tatanggaping pampublikong ospital at doctor-to-doctor endorsement sa NPNRC (1555).'
  );
  criticalWarningsTl.push(
    'Sa ilalim ng RA 8344 at RA 10932, bawal harangin ng pribadong ospital ang pasyente kung kailangan itong i-transfer at stable na ang kalagayan.'
  );

  return {
    steps,
    estimatedCoverageRange: '100% Zero-Billing once admitted to public tertiary facility',
    recommendedOrderSummaryEn:
      '1. Emergency Stabilization Clearance (RA 8344) -> 2. Diagnostic Records Release -> 3. Doctor Bed Coordination via NPNRC 1555 -> 4. RA 9439 Promissory Exit & Ambulance -> 5. Public Charity Admission & 100% Malasakit Zero-Billing',
    recommendedOrderSummaryTl:
      '1. Stabilization Clearance (RA 8344) -> 2. Paglabas ng Records at SOA -> 3. Doctor Coordination sa NPNRC 1555 -> 4. RA 9439 Promissory Note at Ambulansya -> 5. Admission sa Public Charity Ward at 100% Malasakit',
    criticalWarningsEn,
    criticalWarningsTl,
    allRequiredDocuments: Array.from(docSet),
    hospitalType: 'private',
    selectedStrategy: 'transfer_referral',
    privateHospitalGuidance: PRIVATE_HOSPITAL_GUIDANCE,
  };
}

/**
 * Main Triage Engine Aid Stacking Calculator
 */
export function calculateAidStacking(
  patient: PatientProfile,
  medicalCase: MedicalCase
): TriageResult {
  if (medicalCase.hospitalType === 'public_doh') {
    return buildPublicDOHTriage(patient, medicalCase);
  } else if (medicalCase.hospitalType === 'public_lgu') {
    return buildPublicLGUTriage(patient, medicalCase);
  } else {
    // Private Hospital
    if (medicalCase.privateStrategy === 'transfer_referral') {
      return buildPrivateTransferTriage(patient, medicalCase);
    }
    return buildPrivateGLStackingTriage(patient, medicalCase);
  }
}
