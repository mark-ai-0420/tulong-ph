import type { EmergencyCategory } from '../../types/assistance';

export interface PhilHealthCaseRate {
  id: string;
  code?: string;
  name: string;
  description: string;
  rate: number;
  category: EmergencyCategory;
  keywords: string[];
  severity?: 'mild' | 'moderate' | 'severe' | 'standard';
  notes?: string;
}

export interface CaseRateMatchResult {
  rate: number;
  matchedName: string;
  isEstimated: boolean;
  note: string;
  caseRate?: PhilHealthCaseRate;
}

export const PHILHEALTH_CIRCULAR_REF = 'PhilHealth Circular No. 2024-0037';

/**
 * Curated PhilHealth All Case Rates (ACR) updated per PhilHealth Circular No. 2024-0037.
 * Covers 35+ common medical and surgical inpatient conditions, procedures, and packages.
 */
export const PHILHEALTH_CASE_RATES: PhilHealthCaseRate[] = [
  // 1. Severe Pneumonia (High Risk)
  {
    id: 'pneumonia_severe',
    code: 'J18.9-S',
    name: 'Pneumonia (High-Risk / Severe)',
    description: 'Community-acquired pneumonia high-risk / severe (PCAP D), requiring intensive care or oxygenation',
    rate: 90100,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'severe pneumonia',
      'high risk pneumonia',
      'high-risk pneumonia',
      'pcap d',
      'pcap-d',
      'malalang pulmonya',
      'severe pulmonya',
      'critical pneumonia',
      'respiratory failure pneumonia',
    ],
    notes: 'PhilHealth Circular 2024-0037 upward adjusted ACR',
  },

  // 2. Pneumonia Moderate Risk
  {
    id: 'pneumonia_moderate',
    code: 'J18.9-M',
    name: 'Pneumonia (Moderate Risk)',
    description: 'Community-acquired pneumonia moderate risk (PCAP C)',
    rate: 32000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'pneumonia',
      'pulmonya',
      'pcap c',
      'pcap-c',
      'pcap',
      'moderate pneumonia',
      'moderate risk pneumonia',
      'bronchopneumonia',
      'lung infection',
      'tubig sa baga',
      'bacterial pneumonia',
      'viral pneumonia',
    ],
    notes: 'Standard moderate pneumonia ACR',
  },

  // 3. Severe Dengue / Dengue Shock Syndrome
  {
    id: 'dengue_severe',
    code: 'A91',
    name: 'Severe Dengue / Dengue Shock Syndrome',
    description: 'Severe dengue hemorrhagic fever with plasma leakage, severe bleeding, or organ impairment',
    rate: 40000,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'severe dengue',
      'dengue shock syndrome',
      'dss',
      'dengue hemorrhagic fever',
      'dhf',
      'dengue shock',
      'malalang dengue',
      'dengue with shock',
      'dengue grade 3',
      'dengue grade 4',
    ],
    notes: 'Severe dengue package',
  },

  // 4. Dengue with Warning Signs
  {
    id: 'dengue_warning_signs',
    code: 'A90',
    name: 'Dengue with Warning Signs',
    description: 'Dengue fever with warning signs (abdominal pain, persistent vomiting, fluid accumulation)',
    rate: 16000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'dengue',
      'dengue with warning signs',
      'dengue fever',
      'dengue warning signs',
      'dengue probable',
      'dengue confirmed',
      'dengue moderate',
      'dengue infection',
    ],
    notes: 'Adjusted ACR under Circular 2024-0037',
  },

  // 5. Hemorrhagic Stroke (Intracerebral / Subarachnoid Hemorrhage)
  {
    id: 'stroke_hemorrhagic',
    code: 'I61.9',
    name: 'Hemorrhagic Stroke (CVA Bleed)',
    description: 'Intracerebral hemorrhage, subarachnoid hemorrhage, or vascular brain rupture',
    rate: 76000,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'hemorrhagic stroke',
      'hemorrhagic',
      'cva bleed',
      'cva bleeding',
      'brain bleed',
      'intracerebral hemorrhage',
      'ich',
      'subarachnoid hemorrhage',
      'sah',
      'putok ugat sa utak',
      'stroke bleed',
      'cerebral hemorrhage',
    ],
    notes: 'Hemorrhagic stroke package',
  },

  // 6. Acute Ischemic Stroke
  {
    id: 'stroke_ischemic',
    code: 'I63.9',
    name: 'Acute Ischemic Stroke (CVA Infarct)',
    description: 'Cerebrovascular accident due to thrombosis or embolism',
    rate: 38000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'acute ischemic stroke',
      'ischemic stroke',
      'stroke',
      'cva infarct',
      'cva thrombosis',
      'cva',
      'cerebrovascular accident',
      'na-stroke',
      'nastroke',
      'paralisis',
      'brain attack',
      'ischemia',
    ],
    notes: 'Ischemic stroke package',
  },

  // 7. Cesarean Section
  {
    id: 'cesarean_section',
    code: 'CS-01',
    name: 'Cesarean Section (C-Section)',
    description: 'Delivery of fetus through abdominal and uterine incision',
    rate: 30000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'cesarean section',
      'cesarean',
      'c-section',
      'c section',
      'cs delivery',
      'cs',
      'opera sa panganganak',
      'caesarean',
      'emergency cs',
      'elective cs',
    ],
    notes: 'Increased from ₱19,000 to ₱30,000 under recent revisions',
  },

  // 8. Normal Spontaneous Delivery (NSD)
  {
    id: 'normal_delivery',
    code: 'NSD-01',
    name: 'Normal Spontaneous Delivery (NSD)',
    description: 'Vaginal delivery in Level 1-3 hospitals or accredited birthing homes',
    rate: 9750,
    category: 'hospitalization',
    severity: 'standard',
    keywords: [
      'normal spontaneous delivery',
      'nsd',
      'normal delivery',
      'panganak',
      'panganganak',
      'vaginal delivery',
      'spontaneous delivery',
      'maternity delivery',
      'nanganak',
    ],
    notes: 'Basic maternal care delivery package',
  },

  // 9. Hemodialysis
  {
    id: 'hemodialysis_session',
    code: 'HEMO-01',
    name: 'Hemodialysis (per session)',
    description: 'Outpatient or inpatient renal replacement hemodialysis (₱4,000/session)',
    rate: 4000,
    category: 'dialysis',
    severity: 'standard',
    keywords: [
      'hemodialysis',
      'hemo',
      'dialysis',
      'salang sa dialysis',
      'kidney dialysis',
      'hd session',
      'blood filtration dialysis',
    ],
    notes: 'PhilHealth expanded hemodialysis rate (₱4,000/session up to 156 sessions/year)',
  },

  // 10. Peritoneal Dialysis
  {
    id: 'peritoneal_dialysis',
    code: 'PD-01',
    name: 'Peritoneal Dialysis (PD First Package)',
    description: 'Continuous Ambulatory Peritoneal Dialysis (monthly allowance)',
    rate: 14000,
    category: 'dialysis',
    severity: 'standard',
    keywords: [
      'peritoneal dialysis',
      'peritoneal',
      'pd first',
      'capd',
      'pd',
      'peritoneal hemo',
    ],
    notes: 'Monthly PD First coverage benefit',
  },

  // 11. Chemotherapy
  {
    id: 'chemotherapy_cycle',
    code: 'CHEMO-01',
    name: 'Chemotherapy (per cycle)',
    description: 'Chemotherapy infusion or administration cycle for malignant neoplasms',
    rate: 10000,
    category: 'chemotherapy',
    severity: 'standard',
    keywords: [
      'chemotherapy',
      'chemo',
      'kemoterapya',
      'kemo',
      'cancer chemotherapy',
      'chemo cycle',
      'antineoplastic therapy',
    ],
    notes: 'Standard case rate per outpatient/inpatient chemo session',
  },

  // 12. Appendectomy
  {
    id: 'appendectomy',
    code: '47.0',
    name: 'Appendectomy',
    description: 'Surgical excision of the vermiform appendix for acute appendicitis',
    rate: 24000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'appendectomy',
      'appendicitis',
      'apendisitis',
      'apendiks',
      'appendix',
      'tinanggal ang appendix',
      'acute appendicitis',
    ],
    notes: 'Common emergency surgical package',
  },

  // 13. Cholecystectomy (Laparoscopic)
  {
    id: 'cholecystectomy_lap',
    code: '51.23',
    name: 'Cholecystectomy (Laparoscopic)',
    description: 'Minimally invasive removal of gallbladder with gallstones',
    rate: 45000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'laparoscopic cholecystectomy',
      'lap chole',
      'laparoscopic gallbladder',
      'laparoscopic apdo',
      'minimally invasive cholecystectomy',
    ],
    notes: 'Laparoscopic gallbladder procedure rate',
  },

  // 14. Cholecystectomy (Open)
  {
    id: 'cholecystectomy_open',
    code: '51.22',
    name: 'Cholecystectomy (Open Surgery)',
    description: 'Open surgical removal of gallbladder for cholelithiasis / cholecystitis',
    rate: 31000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'cholecystectomy',
      'open cholecystectomy',
      'gallbladder surgery',
      'bato sa apdo',
      'apdo',
      'tinanggal ang apdo',
      'cholelithiasis',
      'cholecystitis',
      'opera sa apdo',
    ],
    notes: 'Standard open surgical rate',
  },

  // 15. Severe Acute Myocardial Infarction (STEMI / Cardiogenic Shock)
  {
    id: 'heart_attack_severe',
    code: 'I21.0-S',
    name: 'Acute Myocardial Infarction (Severe / STEMI)',
    description: 'ST-segment elevation myocardial infarction or heart attack complicated by heart failure / shock',
    rate: 96000,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'severe heart attack',
      'stemi',
      'acute stemi',
      'massive heart attack',
      'cardiogenic shock',
      'severe myocardial infarction',
      'anterior stemi',
      'inferior stemi',
    ],
    notes: 'Severe cardiovascular catastrophic package',
  },

  // 16. Acute Myocardial Infarction (Standard / NSTEMI)
  {
    id: 'heart_attack_standard',
    code: 'I21.9',
    name: 'Acute Myocardial Infarction (Heart Attack / NSTEMI)',
    description: 'Acute coronary syndrome / non-ST elevation myocardial infarction',
    rate: 40000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'myocardial infarction',
      'heart attack',
      'atake sa puso',
      'ami',
      'nstemi',
      'acute coronary syndrome',
      'acs',
      'sakit sa puso',
      'coronary thrombosis',
    ],
    notes: 'Standard acute MI case rate',
  },

  // 17. Acute Gastroenteritis (AGE)
  {
    id: 'acute_gastroenteritis',
    code: 'A09',
    name: 'Acute Gastroenteritis (AGE)',
    description: 'Acute gastroenteritis with mild to moderate dehydration',
    rate: 11800,
    category: 'hospitalization',
    severity: 'mild',
    keywords: [
      'acute gastroenteritis',
      'gastroenteritis',
      'age',
      'pagtatae',
      'lbm',
      'diarrhea',
      'severe diarrhea',
      'food poisoning',
      'dehydration gastroenteritis',
      'stomach flu',
    ],
    notes: 'Adjusted AGE package',
  },

  // 18. Chronic Kidney Disease (CKD)
  {
    id: 'chronic_kidney_disease',
    code: 'N18.9',
    name: 'Chronic Kidney Disease (CKD Stage 5 / ESRD)',
    description: 'End-stage renal disease admission with electrolyte imbalance or uremia',
    rate: 35000,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'chronic kidney disease',
      'ckd',
      'ckd 5',
      'ckd stage 5',
      'esrd',
      'kidney disease',
      'kidney failure',
      'sakit sa bato',
      'renal failure',
      'end stage renal disease',
      'uremia',
    ],
    notes: 'Inpatient renal disease rate',
  },

  // 19. Asthma in Acute Exacerbation
  {
    id: 'asthma_exacerbation',
    code: 'J45.9',
    name: 'Asthma in Acute Exacerbation',
    description: 'Severe bronchospasm and wheezing requiring continuous nebulization and inpatient management',
    rate: 13000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'asthma in acute exacerbation',
      'asthma',
      'hika',
      'bronchial asthma',
      'acute asthma',
      'hapo',
      'asthma attack',
      'status asthmaticus',
    ],
    notes: 'Pediatric and adult asthma package',
  },

  // 20. Cataract Extraction
  {
    id: 'cataract_extraction',
    code: '13.41',
    name: 'Cataract Extraction (Phacoemulsification / Extracapsular)',
    description: 'Surgical extraction of lens with intraocular lens (IOL) insertion',
    rate: 16000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'cataract extraction',
      'cataract',
      'katarata',
      'phaco',
      'phacoemulsification',
      'opera sa mata',
      'cataract surgery',
      'extracapsular cataract',
    ],
    notes: 'Standard ophthalmology package',
  },

  // 21. Fracture / Orthopedic Implants (ORIF)
  {
    id: 'fracture_implants',
    code: '79.3',
    name: 'Fracture Fixation / Orthopedic Implants (ORIF)',
    description: 'Open Reduction Internal Fixation with plates and screws for major bone fracture',
    rate: 45000,
    category: 'surgery_implants',
    severity: 'moderate',
    keywords: [
      'fracture',
      'bone fracture',
      'bali sa buto',
      'orthopedic implants',
      'orif',
      'bali',
      'nabalian',
      'femur fracture',
      'tibia fracture',
      'hip fracture',
      'open reduction',
      'bale',
    ],
    notes: 'Major trauma and fracture fixation rate',
  },

  // 22. Hernia Repair (Herniorrhaphy)
  {
    id: 'hernia_repair',
    code: '53.0',
    name: 'Hernia Repair (Herniorrhaphy / Hernioplasty)',
    description: 'Repair of inguinal, umbilical, or incisional hernia with mesh',
    rate: 21000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'hernia repair',
      'herniorrhaphy',
      'hernioplasty',
      'hernia',
      'luslos',
      'inguinal hernia',
      'umbilical hernia',
      'opera sa luslos',
    ],
    notes: 'Standard herniorrhaphy case rate',
  },

  // 23. Diabetic Ketoacidosis / Diabetes Complication
  {
    id: 'diabetes_ketoacidosis',
    code: 'E11.1',
    name: 'Diabetic Ketoacidosis / Hyperosmolar Hyperglycemic State',
    description: 'Severe metabolic dysregulation secondary to diabetes mellitus',
    rate: 18000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'diabetic ketoacidosis',
      'dka',
      'diabetes complication',
      'diabetes mellitus',
      'diabetes',
      'mataas ang asukal',
      'hyperglycemia',
      'hhs',
    ],
    notes: 'Inpatient endocrine package',
  },

  // 24. Sepsis / Septic Shock
  {
    id: 'sepsis_septic_shock',
    code: 'A41.9',
    name: 'Sepsis / Septic Shock',
    description: 'Life-threatening organ dysfunction caused by a dysregulated systemic host response to infection',
    rate: 60000,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'sepsis',
      'septic shock',
      'blood infection',
      'severe sepsis',
      'bacteremia',
      'septicemia',
      'impeksyon sa dugo',
    ],
    notes: 'Upward adjusted critical care case rate',
  },

  // 25. Newborn Care Package
  {
    id: 'newborn_care_package',
    code: 'NCP-01',
    name: 'Newborn Care Package (NCP)',
    description: 'Essential newborn care including newborn screening, hearing test, and hepatitis B/BCG vaccination',
    rate: 2900,
    category: 'hospitalization',
    severity: 'standard',
    keywords: [
      'newborn care package',
      'newborn care',
      'ncp',
      'bagong panganak na sanggol',
      'newborn screening',
      'sanggol package',
    ],
    notes: 'Standard neonatal package',
  },

  // 26. Hypertension / Hypertensive Urgency
  {
    id: 'hypertension_urgency',
    code: 'I10',
    name: 'Hypertensive Urgency / Severe Essential Hypertension',
    description: 'Blood pressure crisis requiring inpatient observation and parenteral stabilization',
    rate: 12000,
    category: 'hospitalization',
    severity: 'mild',
    keywords: [
      'hypertension',
      'high blood',
      'hypertensive urgency',
      'hypertensive emergency',
      'hypertensive crisis',
      'altapresyon',
      'alta presyon',
      'high blood pressure',
    ],
    notes: 'Cardiovascular basic inpatient rate',
  },

  // 27. Congestive Heart Failure (CHF)
  {
    id: 'congestive_heart_failure',
    code: 'I50.9',
    name: 'Congestive Heart Failure (CHF)',
    description: 'Acute decompensated heart failure with peripheral edema or pulmonary congestion',
    rate: 28000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'congestive heart failure',
      'chf',
      'heart failure',
      'acute decompensated heart failure',
      'mahina ang puso',
      'pulmonary edema',
    ],
    notes: 'Heart failure inpatient rate',
  },

  // 28. COPD Exacerbation
  {
    id: 'copd_exacerbation',
    code: 'J44.1',
    name: 'Chronic Obstructive Pulmonary Disease (COPD Exacerbation)',
    description: 'Acute worsening of chronic obstructive pulmonary disease requiring inpatient therapy',
    rate: 25500,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'chronic obstructive pulmonary disease',
      'copd',
      'copd exacerbation',
      'emphysema',
      'chronic bronchitis',
      'empysema',
    ],
    notes: 'Chronic respiratory disease package',
  },

  // 29. Urinary Tract Infection (Severe / Pyelonephritis)
  {
    id: 'uti_severe',
    code: 'N39.0',
    name: 'Urinary Tract Infection (Complicated / Pyelonephritis)',
    description: 'Complicated UTI or acute pyelonephritis requiring parenteral antibiotics',
    rate: 10500,
    category: 'hospitalization',
    severity: 'mild',
    keywords: [
      'urinary tract infection',
      'uti',
      'pyelonephritis',
      'complicated uti',
      'impeksyon sa ihi',
      'acute pyelonephritis',
      'kidney infection',
    ],
    notes: 'Nephrology/Urology inpatient rate',
  },

  // 30. Typhoid / Enteric Fever
  {
    id: 'typhoid_fever',
    code: 'A01.0',
    name: 'Typhoid / Enteric Fever',
    description: 'Salmonella typhi infection requiring prolonged inpatient intravenous antibiotics',
    rate: 14000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'typhoid fever',
      'typhoid',
      'enteric fever',
      'tipus',
      'salmonella typhi',
    ],
    notes: 'Infectious disease ACR',
  },

  // 31. Leptospirosis
  {
    id: 'leptospirosis',
    code: 'A27.9',
    name: 'Leptospirosis (Moderate to Severe)',
    description: 'Zoonotic bacterial infection from flood waters, requiring inpatient monitoring',
    rate: 18000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'leptospirosis',
      'lepto',
      'ihi ng daga',
      'leptospira',
      'floodwater infection',
    ],
    notes: 'Tropical infectious disease rate',
  },

  // 32. Pulmonary Tuberculosis (Inpatient TB)
  {
    id: 'pulmonary_tuberculosis',
    code: 'A15.0',
    name: 'Pulmonary Tuberculosis (Inpatient Care)',
    description: 'Active pulmonary tuberculosis with hemoptysis or respiratory compromise',
    rate: 21000,
    category: 'hospitalization',
    severity: 'moderate',
    keywords: [
      'pulmonary tuberculosis',
      'tuberculosis',
      'tb',
      'pulmonary tb',
      'tisis',
      'koch infection',
      'ptb',
    ],
    notes: 'Inpatient TB management',
  },

  // 33. Major Burn
  {
    id: 'major_burn',
    code: 'T20-T32',
    name: 'Major Burn (2nd or 3rd Degree > 20% TBSA)',
    description: 'Extensive burns requiring specialized burn unit debridement and fluid resuscitation',
    rate: 55000,
    category: 'surgery_implants',
    severity: 'severe',
    keywords: [
      'major burn',
      'burn',
      'sunog sa balat',
      'lapnos',
      'pagkasunog',
      'second degree burn',
      'third degree burn',
      'severe burns',
    ],
    notes: 'Burn intensive therapy ACR',
  },

  // 34. Bacterial Meningitis / Encephalitis
  {
    id: 'meningitis_encephalitis',
    code: 'G00.9',
    name: 'Bacterial Meningitis / Encephalitis',
    description: 'Central nervous system infection requiring lumbar puncture and intravenous antimicrobial therapy',
    rate: 42000,
    category: 'hospitalization',
    severity: 'severe',
    keywords: [
      'meningitis',
      'bacterial meningitis',
      'encephalitis',
      'impeksyon sa utak',
      'meningoencephalitis',
    ],
    notes: 'Neurology infectious ACR',
  },

  // 35. Mastectomy (Breast Cancer Surgery)
  {
    id: 'mastectomy',
    code: '85.4',
    name: 'Mastectomy (Total or Modified Radical)',
    description: 'Surgical removal of one or both breasts for malignant neoplasm',
    rate: 38000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'mastectomy',
      'breast cancer surgery',
      'breast removal',
      'modified radical mastectomy',
      'opera sa suso',
      'opera sa dede',
    ],
    notes: 'Oncologic surgical case rate',
  },

  // 36. Colectomy (Colon Cancer Surgery)
  {
    id: 'colectomy',
    code: '45.7',
    name: 'Colectomy / Partial Colon Resection',
    description: 'Surgical excision of part or all of the colon for neoplasm or diverticular perforation',
    rate: 50000,
    category: 'surgery_implants',
    severity: 'severe',
    keywords: [
      'colectomy',
      'colon cancer surgery',
      'colon resection',
      'opera sa bituka',
      'hemicolectomy',
      'sigmoidectomy',
    ],
    notes: 'Major abdominal oncologic surgery',
  },

  // 37. Arteriovenous (AV) Fistula Creation
  {
    id: 'av_fistula_creation',
    code: '39.27',
    name: 'Arteriovenous (AV) Fistula Creation for Hemodialysis',
    description: 'Surgical vascular connection between artery and vein for chronic dialysis access',
    rate: 26000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'av fistula',
      'arteriovenous fistula',
      'fistula creation',
      'fistula surgery',
      'dialysis access',
      'fistula',
      'lagayan ng dialysis',
    ],
    notes: 'Vascular access procedure',
  },

  // 38. Tonsillectomy
  {
    id: 'tonsillectomy',
    code: '28.2',
    name: 'Tonsillectomy / Adenotonsillectomy',
    description: 'Surgical removal of the tonsils for recurrent tonsillitis or obstructive airway',
    rate: 18000,
    category: 'surgery_implants',
    severity: 'standard',
    keywords: [
      'tonsillectomy',
      'adenotonsillectomy',
      'tonsillitis surgery',
      'opera sa tonsil',
      'tinanggal ang tonsil',
      'tonsilitis',
    ],
    notes: 'ENT surgical package',
  },
];

/**
 * Escapes characters for regular expressions.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches a patient's diagnosis and/or emergency category to the corresponding PhilHealth Case Rate.
 * Supports English medical terms, Tagalog colloquialisms, and common medical acronyms.
 * 
 * If the diagnosis is missing or unlisted, returns an estimated benchmark based on emergency category.
 */
export function matchPhilHealthCaseRate(
  diagnosis?: string,
  category?: EmergencyCategory,
  totalBill?: number
): CaseRateMatchResult {
  const cleanDiag = (diagnosis || '').trim().toLowerCase();

  if (cleanDiag.length > 0) {
    // Collect potential matches with their best matched keyword length
    interface CandidateMatch {
      caseRate: PhilHealthCaseRate;
      matchedKeyword: string;
      keywordLength: number;
    }

    const candidates: CandidateMatch[] = [];

    for (const rate of PHILHEALTH_CASE_RATES) {
      for (const kw of rate.keywords) {
        const lowerKw = kw.toLowerCase().trim();
        let isMatched = false;

        // If keyword is short (<= 3 characters, e.g. cs, age, ckd, ami, uti, chf, orif, dka, ncp, cva, pd)
        // require word boundary match so we do not match inside words
        if (lowerKw.length <= 3) {
          const regex = new RegExp(`\\b${escapeRegex(lowerKw)}\\b`, 'i');
          isMatched = regex.test(cleanDiag);
        } else {
          // Substring search for multi-word or longer keywords
          isMatched = cleanDiag.includes(lowerKw);
        }

        if (isMatched) {
          candidates.push({
            caseRate: rate,
            matchedKeyword: lowerKw,
            keywordLength: lowerKw.length,
          });
        }
      }
    }

    if (candidates.length > 0) {
      // Sort candidates by keyword length descending (most specific phrase wins, e.g. "severe dengue" over "dengue")
      candidates.sort((a, b) => b.keywordLength - a.keywordLength);
      const best = candidates[0];

      return {
        rate: best.caseRate.rate,
        matchedName: best.caseRate.name,
        isEstimated: false,
        note: `Official PhilHealth Case Rate per ${PHILHEALTH_CIRCULAR_REF}`,
        caseRate: best.caseRate,
      };
    }
  }

  // Fallback: Category-based benchmark if diagnosis is empty or unlisted
  if (category) {
    switch (category) {
      case 'dialysis':
        return {
          rate: 4000,
          matchedName: 'Hemodialysis (Benchmark: ₱4,000/session)',
          isEstimated: true,
          note: 'Benchmark rate per hemodialysis session under PhilHealth Circular 2024-0037',
        };

      case 'chemotherapy':
        return {
          rate: 10000,
          matchedName: 'Chemotherapy (Benchmark: ₱10,000/cycle)',
          isEstimated: true,
          note: 'Benchmark rate per chemotherapy cycle under PhilHealth ACR',
        };

      case 'surgery_implants':
        return {
          rate: 30000,
          matchedName: 'Surgical Package (Benchmark: ₱30,000)',
          isEstimated: true,
          note: 'Estimated surgical case rate benchmark (₱30,000)',
        };

      case 'hospitalization': {
        const estimatedRate =
          totalBill && totalBill > 0
            ? Math.min(35000, Math.round(totalBill * 0.20))
            : 20000;
        return {
          rate: estimatedRate,
          matchedName:
            totalBill && totalBill > 0
              ? `Inpatient Hospitalization (20% Benchmark: ₱${estimatedRate.toLocaleString()})`
              : 'Inpatient Hospitalization (Benchmark: ₱20,000)',
          isEstimated: true,
          note: 'Estimated benchmark rate for general inpatient hospitalization (20% capped at ₱35,000)',
        };
      }

      case 'laboratory_diagnostics':
      case 'prescription_medicines':
        return {
          rate: 0,
          matchedName: 'Outpatient / Pharmacy (No Direct Case Rate)',
          isEstimated: true,
          note: 'Outpatient prescriptions and standalone lab tests are generally non-case rate items under PhilHealth',
        };

      case 'burial_funeral':
      case 'transportation_emergency':
      case 'food_calamity':
        return {
          rate: 0,
          matchedName: 'Non-Medical Emergency (Not Covered by PhilHealth)',
          isEstimated: true,
          note: 'PhilHealth does not cover non-medical or burial expenses',
        };
    }
  }

  // Final unlisted fallback
  return {
    rate: 0,
    matchedName: 'Unlisted Condition / Benchmark Unavailable',
    isEstimated: true,
    note: 'Diagnosis could not be mapped to standard ACR schedule. Case rate deduction defaulted to ₱0.',
  };
}
