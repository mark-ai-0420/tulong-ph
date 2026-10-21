export interface KonsultaDiagnosticExam {
  id: string;
  name: string;
}

export interface YakapEssentialMedicine {
  id: string;
  name: string;
  category: string;
}

export const KONSULTA_YAKAP_SOURCES = {
  enhancementCircularUrl: 'https://www.philhealth.gov.ph/circulars/2024/PC2024-0013.pdf',
  earlierCoreLabListUrl: 'https://www.philhealth.gov.ph/circulars/2022/circ2022-0005.pdf',
  currentAvailabilityCircularUrl: 'https://www.philhealth.gov.ph/circulars/2026/PC2026-0007.pdf',
  yakapFaqUrl: 'https://www.philhealth.gov.ph/yakap/YAKAP_FAQs.pdf',
  annualGgamotMedicineLimit: 20000,
} as const;

export const KONSULTA_YAKAP_BENEFIT_SUMMARY = {
  programName: 'PhilHealth Konsulta / YAKAP',
  diagnosticExamCount: 13,
  essentialMedicineCount: 21,
  memberCopay: 0,
  memberCopayLabel: '₱0 member copayment for covered, provider-recommended services at participating accredited providers',
  medicineLimitNote: 'Medicines are subject to the applicable GAMOT annual limit, prescription, provider, and availability rules.',
  listScopeNote: 'This dataset lists 13 core laboratory exams. YAKAP may also provide additional preventive or screening services based on a provider assessment.',
} as const;

/** Core 13 laboratory and diagnostic exams in the PhilHealth Konsulta package. */
export const KONSULTA_DIAGNOSTIC_EXAMS: KonsultaDiagnosticExam[] = [
  { id: 'cbc', name: 'Complete blood count with platelet count' },
  { id: 'urinalysis', name: 'Urinalysis' },
  { id: 'fecalysis', name: 'Fecalysis' },
  { id: 'sputum_microscopy', name: 'Sputum microscopy' },
  { id: 'fecal_occult_blood', name: 'Fecal occult blood test' },
  { id: 'pap_smear', name: 'Pap smear' },
  { id: 'hba1c', name: 'HbA1c' },
  { id: 'fasting_blood_sugar', name: 'Fasting blood sugar' },
  { id: 'oral_glucose_tolerance', name: 'Oral glucose tolerance test' },
  { id: 'ecg', name: 'Electrocardiogram (ECG)' },
  { id: 'chest_xray', name: 'Chest X-ray' },
  { id: 'serum_creatinine', name: 'Serum creatinine' },
  { id: 'lipid_profile', name: 'Lipid profile' },
];

/** 21 essential medicines included in the enhanced Konsulta/YAKAP drug list. */
export const YAKAP_ESSENTIAL_MEDICINES: YakapEssentialMedicine[] = [
  { id: 'amoxicillin', name: 'Amoxicillin', category: 'Antimicrobial' },
  { id: 'co_amoxiclav', name: 'Co-amoxiclav', category: 'Antimicrobial' },
  { id: 'nitrofurantoin', name: 'Nitrofurantoin', category: 'Antimicrobial' },
  { id: 'cotrimoxazole', name: 'Cotrimoxazole', category: 'Antimicrobial' },
  { id: 'ciprofloxacin', name: 'Ciprofloxacin', category: 'Antimicrobial' },
  { id: 'clarithromycin', name: 'Clarithromycin', category: 'Antimicrobial' },
  { id: 'oral_rehydration_salts', name: 'Oral rehydration salts', category: 'Fluids and electrolytes' },
  { id: 'prednisone', name: 'Prednisone', category: 'Anti-asthma' },
  { id: 'salbutamol', name: 'Salbutamol', category: 'Anti-asthma' },
  { id: 'fluticasone_salmeterol', name: 'Fluticasone + salmeterol', category: 'Anti-asthma' },
  { id: 'paracetamol', name: 'Paracetamol', category: 'Antipyretic' },
  { id: 'simvastatin', name: 'Simvastatin', category: 'Anti-dyslipidemia' },
  { id: 'gliclazide', name: 'Gliclazide', category: 'Anti-diabetic' },
  { id: 'metformin', name: 'Metformin', category: 'Anti-diabetic' },
  { id: 'enalapril', name: 'Enalapril', category: 'Anti-hypertensive' },
  { id: 'metoprolol', name: 'Metoprolol', category: 'Anti-hypertensive' },
  { id: 'amlodipine', name: 'Amlodipine', category: 'Anti-hypertensive' },
  { id: 'hydrochlorothiazide', name: 'Hydrochlorothiazide', category: 'Anti-hypertensive' },
  { id: 'losartan', name: 'Losartan', category: 'Anti-hypertensive' },
  { id: 'aspirin', name: 'Aspirin', category: 'Anti-thrombotic' },
  { id: 'chlorphenamine', name: 'Chlorphenamine maleate', category: 'Anti-histamine' },
];

export const KONSULTA_YAKAP_COVERAGE_NOTE =
  'Covered services have no member copay when recommended by the YAKAP clinic physician and provided through an accredited clinic or partner. Medicines also depend on prescription, the annual GAMOT benefit limit, and pharmacy availability.';
