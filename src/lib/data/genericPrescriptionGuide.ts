import type { Language } from '@/lib/i18n';

export type TherapeuticCategory =
  | 'antibiotic'
  | 'cardiovascular'
  | 'diabetes_endocrine'
  | 'pain_analgesic'
  | 'respiratory'
  | 'gastrointestinal'
  | 'critical_inpatient'
  | 'other';

export interface GenericMedicineItem {
  id: string;
  genericName: string;
  brandExamples: string[];
  therapeuticCategory: TherapeuticCategory;
  commonDosageForms: string[];
  pnfListed: boolean;
  konsultaCovered: boolean;
}

export interface PrescriptionRequirement {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  mandatory: boolean;
  ra6675Citation: string;
}

/**
 * Reference snapshots: the DOH PNF 8th Edition EML 2019, updated through
 * November 2022 with approved additions through April 2024, and PhilHealth's
 * January 2026 advisory continuing the 21 essential medicines under YAKAP.
 * The legacy `konsultaCovered` name is retained for the feature contract.
 * Brand names are examples only; they do not guarantee stock or an exact
 * strength, dosage form, or route match.
 */
export const GENERIC_MEDICINES: readonly GenericMedicineItem[] = [
  {
    id: 'amoxicillin',
    genericName: 'Amoxicillin',
    brandExamples: ['Amoxil'],
    therapeuticCategory: 'antibiotic',
    commonDosageForms: ['250 mg capsule', '500 mg capsule', '125 mg/5 mL oral suspension'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'co-amoxiclav',
    genericName: 'Co-amoxiclav (amoxicillin + clavulanate)',
    brandExamples: ['Augmentin'],
    therapeuticCategory: 'antibiotic',
    commonDosageForms: ['250 mg/125 mg tablet', '500 mg/125 mg tablet', 'oral suspension'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'cotrimoxazole',
    genericName: 'Cotrimoxazole (sulfamethoxazole + trimethoprim)',
    brandExamples: ['Bactrim'],
    therapeuticCategory: 'antibiotic',
    commonDosageForms: ['400 mg/80 mg tablet', '800 mg/160 mg tablet', 'oral suspension'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'nitrofurantoin',
    genericName: 'Nitrofurantoin',
    brandExamples: ['Macrodantin', 'Macrobid'],
    therapeuticCategory: 'antibiotic',
    commonDosageForms: ['50 mg capsule', '100 mg capsule'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'ciprofloxacin',
    genericName: 'Ciprofloxacin',
    brandExamples: ['Ciprobay'],
    therapeuticCategory: 'antibiotic',
    commonDosageForms: ['250 mg tablet', '500 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'clarithromycin',
    genericName: 'Clarithromycin',
    brandExamples: ['Klacid'],
    therapeuticCategory: 'antibiotic',
    commonDosageForms: ['250 mg tablet', '500 mg tablet', 'oral suspension'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'amlodipine',
    genericName: 'Amlodipine',
    brandExamples: ['Norvasc'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['5 mg tablet', '10 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'enalapril',
    genericName: 'Enalapril',
    brandExamples: ['Renitec'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['5 mg tablet', '10 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'metoprolol',
    genericName: 'Metoprolol',
    brandExamples: ['Betaloc'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['50 mg tablet', '100 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'hydrochlorothiazide',
    genericName: 'Hydrochlorothiazide',
    brandExamples: ['Hydrodiuril'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['25 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'losartan',
    genericName: 'Losartan',
    brandExamples: ['Cozaar'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['50 mg tablet', '100 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'simvastatin',
    genericName: 'Simvastatin',
    brandExamples: ['Zocor'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['10 mg tablet', '20 mg tablet', '40 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'aspirin',
    genericName: 'Aspirin',
    brandExamples: ['Aspilet', 'Bayer Aspirin'],
    therapeuticCategory: 'cardiovascular',
    commonDosageForms: ['80 mg enteric-coated tablet', '100 mg enteric-coated tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'gliclazide',
    genericName: 'Gliclazide',
    brandExamples: ['Diamicron'],
    therapeuticCategory: 'diabetes_endocrine',
    commonDosageForms: ['80 mg tablet', 'modified-release tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'metformin',
    genericName: 'Metformin',
    brandExamples: ['Glucophage'],
    therapeuticCategory: 'diabetes_endocrine',
    commonDosageForms: ['500 mg tablet', '850 mg tablet', 'modified-release tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'paracetamol',
    genericName: 'Paracetamol',
    brandExamples: ['Biogesic'],
    therapeuticCategory: 'pain_analgesic',
    commonDosageForms: ['300 mg tablet', '500 mg tablet', 'oral drops or suspension'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'ibuprofen',
    genericName: 'Ibuprofen',
    brandExamples: ['Medicol', 'Advil'],
    therapeuticCategory: 'pain_analgesic',
    commonDosageForms: ['200 mg tablet', '400 mg tablet', 'oral suspension'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'prednisone',
    genericName: 'Prednisone',
    brandExamples: ['Deltasone'],
    therapeuticCategory: 'respiratory',
    commonDosageForms: ['5 mg tablet', '20 mg tablet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'salbutamol',
    genericName: 'Salbutamol',
    brandExamples: ['Ventolin'],
    therapeuticCategory: 'respiratory',
    commonDosageForms: ['inhaler', '2 mg tablet', 'oral solution'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'fluticasone-salmeterol',
    genericName: 'Fluticasone + salmeterol',
    brandExamples: ['Seretide'],
    therapeuticCategory: 'respiratory',
    commonDosageForms: ['dry powder inhaler, 100 mcg/50 mcg per dose'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'chlorphenamine',
    genericName: 'Chlorphenamine (chlorpheniramine)',
    brandExamples: ['Antamin', 'Histapan', 'Chlor-Trimeton'],
    therapeuticCategory: 'respiratory',
    commonDosageForms: ['4 mg tablet', '2.5 mg/5 mL syrup'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'cetirizine',
    genericName: 'Cetirizine',
    brandExamples: ['Allerkid', 'Alnix', 'Zyrtec', 'Virlix'],
    therapeuticCategory: 'respiratory',
    commonDosageForms: ['10 mg tablet', '2.5 mg/mL oral drops', '5 mg/5 mL syrup'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'oral-rehydration-salts',
    genericName: 'Oral rehydration salts (ORS)',
    brandExamples: ['Hydrite'],
    therapeuticCategory: 'gastrointestinal',
    commonDosageForms: ['reduced-osmolarity oral powder sachet'],
    pnfListed: true,
    konsultaCovered: true,
  },
  {
    id: 'omeprazole',
    genericName: 'Omeprazole',
    brandExamples: ['Losec'],
    therapeuticCategory: 'gastrointestinal',
    commonDosageForms: ['20 mg capsule', '40 mg capsule', '40 mg injection vial'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'pantoprazole',
    genericName: 'Pantoprazole',
    brandExamples: ['Protonix'],
    therapeuticCategory: 'gastrointestinal',
    commonDosageForms: ['20 mg tablet', '40 mg tablet', '40 mg injection vial'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'ondansetron',
    genericName: 'Ondansetron',
    brandExamples: ['Zofran'],
    therapeuticCategory: 'gastrointestinal',
    commonDosageForms: ['8 mg tablet', '2 mg/mL injection'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'ceftriaxone',
    genericName: 'Ceftriaxone',
    brandExamples: ['Rocephin'],
    therapeuticCategory: 'critical_inpatient',
    commonDosageForms: ['250 mg vial', '500 mg vial', '1 g vial for injection'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'meropenem',
    genericName: 'Meropenem',
    brandExamples: ['Meronem'],
    therapeuticCategory: 'critical_inpatient',
    commonDosageForms: ['500 mg vial', '1 g vial for injection'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'vancomycin',
    genericName: 'Vancomycin',
    brandExamples: ['Vancocin'],
    therapeuticCategory: 'critical_inpatient',
    commonDosageForms: ['500 mg vial', '1 g vial for injection'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'norepinephrine',
    genericName: 'Norepinephrine',
    brandExamples: ['Levophed'],
    therapeuticCategory: 'critical_inpatient',
    commonDosageForms: ['1 mg/mL ampule or vial for infusion'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'regular-insulin',
    genericName: 'Insulin, regular (human)',
    brandExamples: ['Humulin R', 'Actrapid'],
    therapeuticCategory: 'critical_inpatient',
    commonDosageForms: ['100 units/mL injection vial or cartridge'],
    pnfListed: true,
    konsultaCovered: false,
  },
  {
    id: 'morphine',
    genericName: 'Morphine',
    brandExamples: ['MST Continus'],
    therapeuticCategory: 'pain_analgesic',
    commonDosageForms: ['10 mg tablet', '10 mg/mL injection ampule'],
    pnfListed: true,
    konsultaCovered: false,
  },
];

export const PRESCRIPTION_REQUIREMENTS: readonly PrescriptionRequirement[] = [
  {
    id: 'prescriber-details',
    title: {
      taglish: 'Detalye ng doktor',
      cebuano: 'Impormasyon sa doktor',
      ilocano: 'Detalye ti doktor',
      en: 'Doctor details',
    },
    description: {
      taglish: 'Tingnan kung nakasulat ang pangalan, PRC license number, PTR, at pirma.',
      cebuano: 'Susiha kon naa ang ngalan, numero sa lisensya sa PRC, PTR, ug pirma.',
      ilocano: 'Kitaen no naisurat ti nagan, numero ti lisensia ti PRC, PTR, ken pirma.',
      en: 'Check for the prescriber name, PRC license number, PTR, and signature.',
    },
    mandatory: false,
    ra6675Citation: 'Practical completeness check, not a specific requirement stated in RA 6675.',
  },
  {
    id: 'generic-name',
    title: {
      taglish: 'Malinaw na generic name',
      cebuano: 'Klaro nga generic name',
      ilocano: 'Nalawag a generic name',
      en: 'Clear generic name',
    },
    description: {
      taglish: 'Ito ang pangunahing pangalan sa reseta. Puwedeng idagdag ang brand name, pero hindi nito pinapalitan ang generic name.',
      cebuano: 'Kinahanglan gamiton ang generic name sa reseta. Mahimong idugang ang brand name.',
      ilocano: 'Masapul nga usaren ti generic name iti reseta. Mabalin met nga inayon ti brand name.',
      en: 'The prescription must use the generic name. A brand name may also be included.',
    },
    mandatory: true,
    ra6675Citation: 'RA No. 6675, Section 6(b), as amended by RA No. 9502.',
  },
  {
    id: 'strength-form',
    title: {
      taglish: 'Eksaktong lakas at porma',
      cebuano: 'Eksaktong kusog ug porma',
      ilocano: 'Eksakto a pigsa ken porma',
      en: 'Exact strength and form',
    },
    description: {
      taglish: 'Tingnan kung tugma ang lakas at porma, gaya ng tablet, capsule, suspension, o vial.',
      cebuano: 'Susiha ang kusog ug porma, sama sa tablet, capsule, suspension, o vial.',
      ilocano: 'Kitaen ti pigsa ken porma, kas iti tablet, capsule, suspension, wenno vial.',
      en: 'Check the strength and dosage form, such as tablet, capsule, suspension, or vial.',
    },
    mandatory: false,
    ra6675Citation: 'Practical completeness check, not a specific requirement stated in RA 6675.',
  },
  {
    id: 'quantity',
    title: {
      taglish: 'Kabuuang dami',
      cebuano: 'Kinatibuk-ang gidaghanon',
      ilocano: 'Dagup a bilang',
      en: 'Total quantity',
    },
    description: {
      taglish: 'Tingnan kung malinaw ang dami, sa numero at salita kung hinihingi ng form o patakaran.',
      cebuano: 'Susiha kon klaro ang gidaghanon, numero ug pulong kon gikinahanglan sa porma o lagda.',
      ilocano: 'Kitaen no nalawag ti bilang, iti numero ken sao no kiddawen ti porma wenno pagalagadan.',
      en: 'Check that the quantity is clear, in figures and words when the form or rules require it.',
    },
    mandatory: false,
    ra6675Citation: 'Practical completeness check, not a specific requirement stated in RA 6675.',
  },
  {
    id: 'directions-duration',
    title: {
      taglish: 'Malinaw na paraan at tagal',
      cebuano: 'Klaro nga paagi ug gidugayon',
      ilocano: 'Nalawag a panangusar ken kaatiddog',
      en: 'Clear directions and duration',
    },
    description: {
      taglish: 'Itanong kung malinaw ang tagubilin, dalas ng paggamit, at tagal ng gamutan.',
      cebuano: 'Pangutan-a kon klaro ang direksyon, kapila gamiton, ug unsa kadugay ang pagtambal.',
      ilocano: 'Saludsoden no nalawag ti bilin, kasano kasansan ti panangusar, ken kaatiddog ti panangagas.',
      en: 'Ask whether the directions, frequency, and treatment duration are clear.',
    },
    mandatory: false,
    ra6675Citation: 'Practical completeness check, not a specific requirement stated in RA 6675.',
  },
  {
    id: 'prescription-date',
    title: {
      taglish: 'Petsa at naaangkop na validity',
      cebuano: 'Petsa ug angay nga validity',
      ilocano: 'Petsa ken maitutop a kinapateg',
      en: 'Prescription date and applicable validity',
    },
    description: {
      taglish: 'Tingnan kung may petsa. Ipa-confirm sa parmasyutiko ang validity period na naaangkop sa gamot at reseta.',
      cebuano: 'Susiha kon adunay petsa. Ipakumpirma sa pharmacist ang validity period nga angay sa tambal ug reseta.',
      ilocano: 'Kitaen no adda ti petsa. Ipa-confirm iti parmasista ti validity period a maitutop iti agas ken reseta.',
      en: 'Check for a date. Ask the pharmacist which validity period applies to this medicine and prescription.',
    },
    mandatory: false,
    ra6675Citation: 'Practical completeness check, not a specific requirement stated in RA 6675.',
  },
];

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .trim();

export function filterGenericMedicines(query: string, category?: string): GenericMedicineItem[] {
  const normalizedQuery = normalize(query);
  const normalizedCategory = normalize(category ?? '');

  return GENERIC_MEDICINES.filter((medicine) => {
    const matchesCategory = !normalizedCategory
      || normalizedCategory === 'all'
      || normalize(medicine.therapeuticCategory) === normalizedCategory;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const searchableText = normalize([
      medicine.id,
      medicine.genericName,
      ...medicine.brandExamples,
      ...medicine.commonDosageForms,
      medicine.therapeuticCategory,
      medicine.pnfListed ? 'PNF Philippine National Formulary' : '',
      medicine.konsultaCovered ? 'Konsulta YAKAP' : '',
    ].join(' '));

    return searchableText.includes(normalizedQuery);
  });
}

export function getPrescriptionChecklist(language: Language) {
  return PRESCRIPTION_REQUIREMENTS.map(({ id, title, description, mandatory }) => ({
    id,
    title: title[language],
    description: description[language],
    mandatory,
  }));
}

const DOCTOR_REQUEST_SCRIPTS: Record<Language, (medicineName: string) => string> = {
  taglish: (medicineName) => `Dok, tungkol po sa ${medicineName}, maaari po bang ilagay sa reseta ang generic name, eksaktong lakas at porma, dami, malinaw na tagubilin, at tagal? Gusto rin po naming itanong sa parmasyutiko kung may kaparehong generic na available. Hindi po kami magpapalit ng gamot nang walang pahintulot ninyo.`,
  cebuano: (medicineName) => `Dok, bahin sa ${medicineName}, mahimo ba nga ibutang sa reseta ang generic name, eksaktong kusog ug porma, gidaghanon, klarong direksyon, ug gidugayon? Mangutana usab mi sa pharmacist kon adunay kaparehong generic nga available. Dili mi mag-ilis og tambal kon walay pagtugot ninyo.`,
  ilocano: (medicineName) => `Dok, maipanggep iti ${medicineName}, mabalin kadi nga maikabil iti reseta ti generic name, eksakto a pigsa ken porma, bilang, nalawag a bilin, ken kaatiddog? Saludsodenmi met ti parmasista no adda ti agpapada a generic a magun-od. Saan kami agbaliw iti agas no awan ti pammalubosyo.`,
  en: (medicineName) => `Doctor, about ${medicineName}, could the prescription include the generic name, exact strength and form, quantity, clear directions, and duration? We would also like to ask the pharmacist whether the same generic is available. We will not change the medicine without your approval.`,
};

export function getDoctorRequestScript(language: Language, medicine?: GenericMedicineItem): string {
  return DOCTOR_REQUEST_SCRIPTS[language](medicine?.genericName ?? 'the prescribed medicine');
}
