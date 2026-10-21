import type { StudentEducationProfile } from '@/types/education';
import type { Language } from '@/lib/i18n';

export type LGUScholarshipJurisdiction = 'city_municipality' | 'province' | 'congressional_district';

export interface LGUScholarshipProgram {
  id: string;
  name: string;
  jurisdiction: LGUScholarshipJurisdiction;
  region: string;
  province?: string;
  cityMunicipality?: string;
  congressionalDistrict?: string;
  districtMatchNeedsConfirmation?: boolean;
  grantAmountPerSemOrYear: string;
  eligibilityHighlights: string[];
  requiredDocuments: string[];
  officeName: string;
  contactOrWebsite?: string;
  applicationPeriod?: string;
  sourceUrl: string;
  additionalSources?: { title: string; url: string }[];
  verifiedAsOf: string;
}

export const LGU_SCHOLARSHIP_REGIONS = [
  'National Capital Region (NCR)',
  'Region I (Ilocos Region)',
  'Region II (Cagayan Valley)',
  'Region III (Central Luzon)',
  'Region IV-A (CALABARZON)',
  'MIMAROPA Region',
  'Region V (Bicol Region)',
  'Region VI (Western Visayas)',
  'Region VII (Central Visayas)',
  'Region VIII (Eastern Visayas)',
  'Region IX (Zamboanga Peninsula)',
  'Region X (Northern Mindanao)',
  'Region XI (Davao Region)',
  'Region XII (SOCCSKSARGEN)',
  'Region XIII (Caraga)',
  'Cordillera Administrative Region (CAR)',
  'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
  'Negros Island Region (NIR)',
] as const;

const verifiedAsOf = '2026-10-21';

export const lguScholarshipPrograms: LGUScholarshipProgram[] = [
  {
    id: 'qc-scholarship-program',
    name: 'Quezon City Scholarship Program (QCSP)',
    jurisdiction: 'city_municipality',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila (NCR)',
    cityMunicipality: 'Quezon City',
    grantAmountPerSemOrYear: 'Varies by category. The 2026 QC Excel guide lists up to PHP 110,000 in tuition support and PHP 50,000 stipend per academic year.',
    eligibilityHighlights: [
      'General program criteria include Quezon City residency and enrollment or acceptance at a city-recognized institution.',
      'Applicants must not hold another local government scholarship. Category-specific academic, income, or sector rules apply.',
    ],
    requiredDocuments: [
      'Recent grades or transcript of records.',
      'Proof of enrollment or acceptance.',
      'Additional documents depend on the selected scholarship category.',
    ],
    officeName: 'Quezon City Youth Development Office (QCYDO)',
    contactOrWebsite: '8988-4242 local 8738; ywpo.QCYDO@quezoncity.gov.ph',
    applicationPeriod: 'Check QC eServices for the current application call and category deadlines.',
    sourceUrl: 'https://quezoncity.gov.ph/program/qc-scholarship-program/',
    additionalSources: [{ title: 'QCYDO program guide and contact', url: 'https://quezoncity.gov.ph/departments/quezon-city-youth-development-office/' }],
    verifiedAsOf,
  },
  {
    id: 'la-union-lueasp',
    name: 'La Union Educational Assistance and Scholarship Program (LUEASP)',
    jurisdiction: 'province',
    region: 'Region I (Ilocos Region)',
    province: 'La Union',
    grantAmountPerSemOrYear: 'Grant depends on the selected category and current provincial call. Confirm the amount with PYESDO.',
    eligibilityHighlights: [
      'The provincial service lists college and senior high school students and several priority sectors, including PWDs, solo parents or their children, Indigenous Peoples, and student-athletes.',
      'Additional category-specific qualifications apply.',
    ],
    requiredDocuments: [
      'Application form and latest grades.',
      'Good moral character certificate and proof of enrollment.',
      'Parent or guardian income documents, residency or voter record, PSA birth certificate, and 2x2 photo.',
      'Additional documents vary by applicant category. Confirm the current checklist with PYESDO.',
    ],
    officeName: 'Provincial Youth, Education and Sports Development Office (PYESDO)',
    contactOrWebsite: 'https://launion.gov.ph/department/provincial-youth-education-and-sports-development-office/',
    applicationPeriod: 'Check the PYESDO announcement for the current cycle. No current deadline was listed in the service page.',
    sourceUrl: 'https://launion.gov.ph/department/provincial-youth-education-and-sports-development-office/',
    verifiedAsOf,
  },
  {
    id: 'isabela-bro-ed',
    name: 'Bojie-Rodito Opportunities for Education (BRO-Ed)',
    jurisdiction: 'province',
    region: 'Region II (Cagayan Valley)',
    province: 'Isabela',
    grantAmountPerSemOrYear: 'The provincial office lists tuition support of up to PHP 3,000 per semester at ISU and partner colleges, with up to PHP 3,000 in miscellaneous-fee support for agriculture-related courses. Other categories vary.',
    eligibilityHighlights: [
      'The regular scholarship is for children of small farmers, with one scholar supported per farming family.',
      'Academic and non-academic college tracks are listed by the provincial program.',
    ],
    requiredDocuments: ['Ask the BRO-Ed office for the current application form and document checklist.'],
    officeName: 'Provincial Government Office - BRO Office',
    contactOrWebsite: 'bro@provinceofisabela.gov.ph',
    applicationPeriod: 'Ask the BRO Office for the next application schedule and available category.',
    sourceUrl: 'https://provinceofisabela.gov.ph/department/pgo-bro-office/',
    additionalSources: [{ title: 'Provincial BRO-Ed program categories', url: 'https://provinceofisabela.gov.ph/flagship-programs-and-projects/bojie-rodito-opportunities-for-education-bro-ed/' }],
    verifiedAsOf,
  },
  {
    id: 'bulacan-tulong-pang-edukasyon',
    name: 'Tulong Pang-Edukasyon para sa Bulakenyo',
    jurisdiction: 'province',
    region: 'Region III (Central Luzon)',
    province: 'Bulacan',
    grantAmountPerSemOrYear: 'A February 2026 payout report lists PHP 3,000 for students at state universities, colleges, and public senior high schools, and PHP 3,500 for private institutions. Confirm the amount in the next call.',
    eligibilityHighlights: [
      'The provincial citizen charter lists Bulakenyo students and other education-related applicant groups.',
      'The February 2026 report confirms payouts to students from public and private colleges and universities and senior high schools.',
    ],
    requiredDocuments: [
      'Request letter addressed to the Governor.',
      'Completed application form with 2x2 photo.',
      'Registration or enrollment document and latest grades.',
      'Check the current citizen charter or call for any additional requirements.',
    ],
    officeName: 'Provincial Government of Bulacan, scholarship assistance desk',
    contactOrWebsite: 'https://bulacan.gov.ph/',
    applicationPeriod: 'The February 2026 report documents a completed payout, not an open application period. Check the provincial site for the next call.',
    sourceUrl: 'https://bulacan.gov.ph/1900-bulakenyo-students-empowered-with-educational-aid-and-landbank-piso-accounts/',
    additionalSources: [{ title: '2025 Provincial Citizen Charter', url: 'https://bulacan.gov.ph/wp-content/uploads/2025/05/CitizensCharterHandbook2025_1stEdition.pdf' }],
    verifiedAsOf,
  },
  {
    id: 'laguna-iskolar-ng-laguna',
    name: 'Iskolar ng Laguna',
    jurisdiction: 'province',
    region: 'Region IV-A (CALABARZON)',
    province: 'Laguna',
    grantAmountPerSemOrYear: 'The provincial report confirms scholarship allowances but does not state the current amount. Confirm the category and award with the program office.',
    eligibilityHighlights: ['The provincial government reported scholars from cities and municipalities throughout Laguna. Current applicant criteria were not available in the inspected public guide.'],
    requiredDocuments: ['Ask the scholarship portal or Provincial Government of Laguna for the current category-specific checklist.'],
    officeName: 'Iskolar ng Laguna program office',
    contactOrWebsite: 'https://iskolar.laguna.gov.ph/',
    applicationPeriod: 'Application dates are not confirmed. Check the official portal for the next call.',
    sourceUrl: 'https://laguna.gov.ph/news/atm-payout-for-laguna-scholars-begins-this-august',
    additionalSources: [{ title: 'Provincial Government of Laguna', url: 'https://laguna.gov.ph/' }],
    verifiedAsOf,
  },
  {
    id: 'palawan-akbay-sa-mag-aaral',
    name: 'Akbay sa Mag-aaral Yaman ng Kinabukasan (Programang Pang-Edukasyon para sa Palawenyo)',
    jurisdiction: 'province',
    region: 'MIMAROPA Region',
    province: 'Palawan',
    grantAmountPerSemOrYear: 'Amount varies by scholarship category and was not stated in the current public reference. Confirm with the province.',
    eligibilityHighlights: [
      'The 2026 provincial procurement plan references an expanded scholarship orientation for new and continuing recipients.',
      'A related medical-course track describes qualified students pursuing medicine or medical-related courses. Confirm current eligibility with the province.',
    ],
    requiredDocuments: ['Ask the Provincial Government of Palawan for the current scholarship form and document checklist.'],
    officeName: 'Provincial Government of Palawan scholarship office',
    contactOrWebsite: 'https://palawan.gov.ph/contact-us/',
    applicationPeriod: 'Check the provincial contact directory for the current intake schedule.',
    sourceUrl: 'https://palawan.gov.ph/wp-content/uploads/2026/03/APP-2026-B1-V3_rotated.pdf',
    additionalSources: [{ title: 'Provincial contact directory', url: 'https://palawan.gov.ph/contact-us/' }],
    verifiedAsOf,
  },
  {
    id: 'albay-provincial-educational-assistance',
    name: 'Albay Provincial Educational Assistance',
    jurisdiction: 'province',
    region: 'Region V (Bicol Region)',
    province: 'Albay',
    grantAmountPerSemOrYear: 'The 2026 Provincial Citizen Charter does not state a standard amount. Ask the Provincial Education Department about the current assistance category.',
    eligibilityHighlights: ['The 2026 provincial citizen charter lists college students, Alternative Learning System learners, solo parents with college students, PWDs, and schools as applicants for educational assistance.'],
    requiredDocuments: [
      'Letter of intent addressed to the Governor. A parent signs for a student under 18.',
      'Certified true copy of enrollment form and a photocopy of school ID.',
      'Original Certificate of Indigency.',
      'Other documents may apply to activities, awards, or school requests. Confirm with the office.',
    ],
    officeName: 'Albay Provincial Education Department',
    contactOrWebsite: 'https://albay.gov.ph/',
    applicationPeriod: 'The citizen charter lists the service but no current application deadline. Confirm the next intake with the department.',
    sourceUrl: 'https://albay.gov.ph/wp-content/uploads/2026/03/PGO-Albay_CC_2026_1stEdition.pdf',
    verifiedAsOf,
  },
  {
    id: 'iloilo-isip',
    name: 'Iskolar sang Iloilo Program (ISIP)',
    jurisdiction: 'province',
    region: 'Region VI (Western Visayas)',
    province: 'Iloilo',
    grantAmountPerSemOrYear: 'The provincial 2024 report lists a PHP 3,500 monthly stipend, PHP 3,000 learning-resource assistance per semester, and a PHP 5,000 thesis or research allowance for graduating scholars. Verify current rates.',
    eligibilityHighlights: [
      'The program supports underprivileged and deserving senior high school graduates pursuing college at state colleges or universities in Iloilo.',
      'The 2024 provincial call required bonafide residency in Iloilo and a senior high school GWA of at least 90 percent.',
    ],
    requiredDocuments: [
      'Completed application form and Senior High School Form 138.',
      'Proof of income, such as a social welfare indigency certificate, ITR, or BIR tax-exemption certificate.',
      'Barangay certificate of residency and a valid school ID with photo and signature.',
    ],
    officeName: 'Iskolar sang Iloilo Program Secretariat, Provincial Capitol',
    contactOrWebsite: '3rd Floor, Iloilo Provincial Capitol; telephone 328-7961',
    applicationPeriod: 'The linked call closed in July 2024. Check the provincial website for the next intake.',
    sourceUrl: 'https://iloilo.gov.ph/en/node/8185',
    additionalSources: [{ title: '2024 application call and checklist', url: 'https://iloilo.gov.ph/index.php/en/announcements-news/call-scholarship-applicants' }],
    verifiedAsOf,
  },
  {
    id: 'cebu-cp-gifts',
    name: 'Cebu Provincial Government Grant for Indigent and Talented Students (CP-GIFTS)',
    jurisdiction: 'province',
    region: 'Region VII (Central Visayas)',
    province: 'Cebu',
    grantAmountPerSemOrYear: 'The 2026 program launch lists PHP 10,000 for each deserving college student and 5,900 slots for the season.',
    eligibilityHighlights: ['For continued eligibility, scholars must maintain at least an 85 percent grade average and enroll in a four-year program at a public higher education institution. Initial selection criteria vary by call.'],
    requiredDocuments: ['The launch article does not list initial application documents. Confirm the current checklist with the Cebu Provincial School Board.'],
    officeName: 'Cebu Provincial Government, Provincial School Board',
    contactOrWebsite: 'https://www.cebu.gov.ph/',
    applicationPeriod: 'A new season was announced in June 2026. Confirm whether applications remain open and the next deadline.',
    sourceUrl: 'https://www.cebu.gov.ph/12954/capitol-launches-new-season-of-cp-gifts-scholarship-program-with-%E2%82%B159m-funding/',
    verifiedAsOf,
  },
  {
    id: 'northern-samar-nursing-scholarship',
    name: 'Provincial Government of Northern Samar Nursing Scholarship Program (PGNS-NSP)',
    jurisdiction: 'province',
    region: 'Region VIII (Eastern Visayas)',
    province: 'Northern Samar',
    grantAmountPerSemOrYear: 'The provincial ordinance lists coverage for tuition, school fees, clinical requirements, lodging, books, uniforms, transportation, and other approved expenses. Confirm current limits with the province.',
    eligibilityHighlights: ['The 2023 ordinance covers qualified, indigent Northern Samar residents pursuing nursing, including students and graduates taking review classes. It includes academic criteria and a return-of-service obligation.'],
    requiredDocuments: ['The ordinance does not provide a current application checklist. Ask the Provincial Scholarship Secretariat for the latest requirements.'],
    officeName: 'Provincial Government of Northern Samar scholarship secretariat',
    contactOrWebsite: 'https://northernsamar.gov.ph/',
    applicationPeriod: 'No current call was verified. Check with the provincial government.',
    sourceUrl: 'https://northernsamar.gov.ph/wp-content/uploads/2024/04/ord2023-19.pdf',
    verifiedAsOf,
  },
  {
    id: 'zamboanga-agriculture-scholarship',
    name: 'Zamboanga City Agriculture and Fisheries Scholarship Grant',
    jurisdiction: 'city_municipality',
    region: 'Region IX (Zamboanga Peninsula)',
    province: 'Zamboanga del Sur',
    cityMunicipality: 'Zamboanga City',
    grantAmountPerSemOrYear: 'The city reported PHP 40,000 per academic year, or PHP 20,000 per semester, in its May 2026 distribution report.',
    eligibilityHighlights: ['The scholarship supports students in agriculture, forestry, fisheries, agricultural and biosystems engineering, and veterinary medicine. Confirm residency and current course rules in the city ordinance.'],
    requiredDocuments: ['The distribution report does not provide initial application requirements. Ask the Office of the City Agriculturist for the current checklist.'],
    officeName: 'Zamboanga City Office of the City Agriculturist',
    contactOrWebsite: 'https://zamboangacity.gov.ph/office-of-the-city-agriculturist/',
    applicationPeriod: 'A May 2026 payout was reported. The next application period is not confirmed.',
    sourceUrl: 'https://zamboangacity.gov.ph/agri-fishery-students-receive-city-scholarship-aid/',
    additionalSources: [{ title: 'City regulatory index, Ordinance No. 631', url: 'https://zamboangacity.gov.ph/regulatory/' }],
    verifiedAsOf,
  },
  {
    id: 'cagayan-de-oro-city-scholarship',
    name: 'Cagayan de Oro City Scholarship Program',
    jurisdiction: 'city_municipality',
    region: 'Region X (Northern Mindanao)',
    province: 'Misamis Oriental',
    cityMunicipality: 'Cagayan de Oro City',
    grantAmountPerSemOrYear: 'The 2025-2026 call described full tuition, matriculation and other fees, plus a monthly stipend. Confirm current award limits with the City Scholarships Office.',
    eligibilityHighlights: ['The 2025-2026 call required Filipino citizenship, permanent Cagayan de Oro residency, full-time first-year undergraduate study, household income not over PHP 300,000 per year, and no sibling with a city scholarship. Confirm current criteria.'],
    requiredDocuments: [
      'The official 2025-2026 application announcement lists the application documents and online process.',
      'Requirements may change by cycle. Check the City Scholarships Office page before applying.',
    ],
    officeName: 'Cagayan de Oro City Scholarships Office',
    contactOrWebsite: 'https://www.admin.cagayandeoro.gov.ph/index.php/news/the-city-hall/the-departments-and-offices/115-city-scholarships-office.html',
    applicationPeriod: 'The linked call is for 2025-2026. Check the office for the next application period.',
    sourceUrl: 'https://www.cagayandeoro.gov.ph/index.php/item/2438-scholarship-online-application-gibuksan-na.html',
    verifiedAsOf,
  },
  {
    id: 'davao-city-step',
    name: 'Scholarship on Tertiary Education Program (STEP)',
    jurisdiction: 'city_municipality',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    grantAmountPerSemOrYear: 'The 2025-2026 recipient report lists PHP 50,000, PHP 40,000, or PHP 15,000 per semester, depending on category. Verify current rates.',
    eligibilityHighlights: ['The city citizen charter identifies Davao City residency and academic requirements. The 2025-2026 report states that scholars must have no failing grade. Current category rules should be checked with EBSU.'],
    requiredDocuments: ['The 2024 city citizen charter lists report card or transcript, residency and good moral certificates, applicable indigency or eligibility proof, parent income documents, and photo. Confirm the current checklist.'],
    officeName: 'Davao City Educational Benefit System Unit (EBSU)',
    contactOrWebsite: 'https://ebsu-escholar.davaocity.gov.ph/',
    applicationPeriod: 'The linked recipient report covers 2025-2026. Check the EBSU portal for a new call.',
    sourceUrl: 'https://davaocity.gov.ph/education/ebsu-accepts-453-scholars-for-sy-2025-2026/',
    additionalSources: [{ title: 'Davao City Citizen Charter', url: 'https://www.davaocity.gov.ph/wp-content/uploads/2024/03/CC_VOLUME-II.pdf' }],
    verifiedAsOf,
  },
  {
    id: 'south-cotabato-kpsgiap',
    name: 'Kabugwason-Paglaum Scholarship and Grant-in-Aid Program (KPSGIAP)',
    jurisdiction: 'province',
    region: 'Region XII (SOCCSKSARGEN)',
    province: 'South Cotabato',
    grantAmountPerSemOrYear: 'The May 2026 provincial update lists up to PHP 45,000 per semester for regular scholars, limited to documented school expenses.',
    eligibilityHighlights: ['The province announced at least 120 college slots for school year 2026-2027. Check the current provincial call for course, residency, income, and academic criteria.'],
    requiredDocuments: ['Use the current provincial call for the official application form and checklist.'],
    officeName: 'South Cotabato Provincial Scholarship and Grant-in-Aid Program',
    contactOrWebsite: 'https://southcotabato.gov.ph/',
    applicationPeriod: 'The May 2026 notice announced 2026-2027 slots. Verify whether the application period is still open.',
    sourceUrl: 'https://southcotabato.gov.ph/financial-assistance-for-regular-scholars-increased-to-%E2%82%B145000-per-semester/',
    additionalSources: [{ title: '2026-2027 scholarship slot announcement', url: 'https://southcotabato.gov.ph/south-cotabato-scholarship-to-accept-120-slots-this-year/' }],
    verifiedAsOf,
  },
  {
    id: 'agusan-del-norte-agnoriskolar',
    name: 'Agusan del Norte Provincial Scholarship Programs (AgNorIskolar)',
    jurisdiction: 'province',
    region: 'Region XIII (Caraga)',
    province: 'Agusan del Norte',
    grantAmountPerSemOrYear: 'Varies by Provincial Special Education, Indigenous Peoples, Medical Scholarship, and other categories. The province has not published a standard amount in the linked notice.',
    eligibilityHighlights: ['The 2025-2026 soft launch named grantees under the Provincial Special Education Scholarship Program, Provincial Indigenous Peoples Scholarship Program, and Provincial Medical Scholarship Program.'],
    requiredDocuments: ['Ask the provincial scholarship focal office for the current category-specific checklist.'],
    officeName: 'Provincial Government of Agusan del Norte scholarship focal office',
    contactOrWebsite: 'https://www.agusandelnorte.gov.ph/government/contact-us',
    applicationPeriod: 'No current application call was listed in the soft-launch notice. Contact the province for the next cycle.',
    sourceUrl: 'https://www.agusandelnorte.gov.ph/news/9192025974583610-provincial-government-of-agusan-del-norte-soft-launches-agnoriskolar-a-digital-scholarship-management-system',
    verifiedAsOf,
  },
  {
    id: 'benguet-college-scholarship',
    name: 'College Educational Scholarship Program of the Province of Benguet',
    jurisdiction: 'province',
    region: 'Cordillera Administrative Region (CAR)',
    province: 'Benguet',
    grantAmountPerSemOrYear: 'The province confirms scholarship appropriations but the inspected sources do not state a current standard grant amount.',
    eligibilityHighlights: ['The program was established by Provincial Ordinance No. 2019-261. Confirm current residency, academic, income, and course criteria with the provincial office.'],
    requiredDocuments: ['Ask the Provincial Government of Benguet for the current application form and required documents.'],
    officeName: 'Provincial Government of Benguet scholarship office',
    contactOrWebsite: 'https://benguet.gov.ph/contact-us/',
    applicationPeriod: 'Check with the province for the next call and application schedule.',
    sourceUrl: 'https://benguet.gov.ph/ordinances/',
    additionalSources: [{ title: 'Benguet 2025 annual budget', url: 'https://benguet.gov.ph/wp-content/uploads/2025/10/Annual-Budget-2025.pdf' }],
    verifiedAsOf,
  },
  {
    id: 'lanao-del-sur-ranaw-iskolar',
    name: 'Ranaw Iskolar Program',
    jurisdiction: 'province',
    region: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
    province: 'Lanao del Sur',
    grantAmountPerSemOrYear: 'The 2026 pilot was described as covering tuition and other school fees, a monthly stipend, food allowance, and dormitory accommodation. Confirm the current approved package with the province.',
    eligibilityHighlights: ['The 2026 pilot prioritizes students from public schools and gives consideration to full scholars from private schools, orphans, children of solo parents, and vulnerable households who meet academic requirements.', 'The program was launched to prepare students for priority workforce needs in Lanao del Sur.'],
    requiredDocuments: ['No current application checklist was available in the launch report. Ask the Provincial Government of Lanao del Sur for current requirements.'],
    officeName: 'Ranaw Youth Development Office, Provincial Government of Lanao del Sur',
    contactOrWebsite: 'https://www.lanaodelsur.gov.ph/',
    applicationPeriod: 'The first pilot cohort was announced for academic year 2026-2027. Ask the province about future applications.',
    sourceUrl: 'https://pia.gov.ph/news/15-ranaw-scholars-to-study-in-cebu-under-scholarship-program/',
    additionalSources: [{ title: 'Program launch and target sectors', url: 'https://pia.gov.ph/news/teachers-youth-see-hope-in-lanao-sur-scholarship-program/' }],
    verifiedAsOf,
  },
  {
    id: 'negros-occidental-nosp',
    name: 'Negros Occidental Scholarship Program (NOSP)',
    jurisdiction: 'province',
    region: 'Negros Island Region (NIR)',
    province: 'Negros Occidental',
    grantAmountPerSemOrYear: 'Benefits depend on scholarship category. The provincial report describes free tuition and miscellaneous fees, book and uniform allowances, and other assistance. Confirm category limits with NOSP.',
    eligibilityHighlights: ['The 2025-2026 incoming-scholar report lists District Education, Degree Completion, Indigenous Peoples, medical and nursing, midwifery, PWD, solo-parent-child, and OFW-related categories.', 'Applicants undergo screening, examinations, or interviews depending on category.'],
    requiredDocuments: ['Ask the NOSP Division for the current category-specific checklist. Requirements in older citizen charters may have changed.'],
    officeName: 'Negros Occidental Scholarship Program Division (NOSPD)',
    contactOrWebsite: '(034) 434-1153; https://www.negros-occ.gov.ph/contact-us/',
    applicationPeriod: 'The linked scholar report covers school year 2025-2026. Check the provincial website for current calls.',
    sourceUrl: 'https://www.negros-occ.gov.ph/news/more-than-500-incoming-provincial-scholars-sign-agreement-with-gov-lacson/',
    additionalSources: [{ title: 'Provincial scholarship program update, August 2026', url: 'https://www.negros-occ.gov.ph/news/gad-execom-reprograms-%E2%82%B16-9m-for-priority-programs/' }],
    verifiedAsOf,
  },
  {
    id: 'paranaque-tulong-dunong-district-referral',
    name: 'CHED Tulong Dunong Program, Parañaque district referral',
    jurisdiction: 'congressional_district',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila (NCR)',
    cityMunicipality: 'Parañaque City',
    congressionalDistrict: '1st District',
    districtMatchNeedsConfirmation: true,
    grantAmountPerSemOrYear: 'UniFAST program guidance lists PHP 7,500 per regular semester, subject to prioritization and availability of funds. Confirm the current revised guidelines and local call.',
    eligibilityHighlights: [
      'UniFAST guidance lists Filipino citizenship, combined parent or guardian gross income not above PHP 400,000, first undergraduate degree enrollment, and no other listed national government scholarship.',
      'A Parañaque city bulletin documents district-office intake for a 2024 cycle. Current availability through that office is not confirmed.',
    ],
    requiredDocuments: [
      'TDP-TES application form, current certificate of registration or enrollment, and barangay Certificate of Indigency are listed by UniFAST for new applicants.',
      'Ask the district office or HEI scholarship office whether it handles the current call and whether additional documents are required.',
    ],
    officeName: 'Parañaque 1st Congressional District Office and CHED-UniFAST referral',
    contactOrWebsite: 'Current district member: https://congress.gov.ph/house-members; UniFAST regional offices: https://unifast.gov.ph/contact.html',
    applicationPeriod: 'Office-specific. The Parañaque bulletin documents a 2024 call only. Confirm current intake dates directly.',
    sourceUrl: 'https://unifast.gov.ph/tes.html',
    additionalSources: [{ title: 'Parañaque district intake bulletin, 2024', url: 'https://paranaquecity.gov.ph/wp-content/uploads/2024/08/August-12-18-Issue.pdf' }, { title: '2026 revised TDP guidelines', url: 'https://unifast.gov.ph/guidelines.html' }],
    verifiedAsOf,
  },
];

export interface LGUScholarshipLocalizedDetails {
  grant: string;
  eligibility: string;
  documents: string;
  applicationPeriod: string;
}

type RegionalLanguage = Exclude<Language, 'en'>;

const localizedDetails: Record<string, Record<RegionalLanguage, LGUScholarshipLocalizedDetails>> = {
  'qc-scholarship-program': {
    taglish: { grant: 'Nag-iiba ang grant ayon sa category. Ayon sa 2026 QC Excel guide, hanggang PHP 110,000 para sa tuition at PHP 50,000 stipend bawat school year.', eligibility: 'Dapat residente ng Quezon City at enrolled o accepted sa institusyong kinikilala ng lungsod. Hindi dapat tumatanggap ng ibang LGU scholarship. May dagdag na grade, income, o sector rules bawat category.', documents: 'Ihanda ang pinakabagong grades o transcript at proof of enrollment o acceptance. Depende sa category ang iba pang dokumento.', applicationPeriod: 'Tingnan ang QC eServices para sa kasalukuyang application call at deadline bawat category.' },
    cebuano: { grant: 'Nagkalahi ang grant depende sa category. Sumala sa 2026 QC Excel guide, hangtod PHP 110,000 para sa tuition ug PHP 50,000 nga stipend matag school year.', eligibility: 'Kinahanglan residente sa Quezon City ug naka-enrol o gidawat sa institusyong giila sa siyudad. Dili angay makadawat og laing LGU scholarship. Adunay dugang nga kondisyon sa grado, kita, o sektor matag category.', documents: 'Iandam ang pinakabag-ong grado o transcript ug pamatuod sa enrollment o pagdawat. Magdepende sa category ang ubang dokumento.', applicationPeriod: 'Susiha ang QC eServices para sa kasamtangang panawagan ug mga deadline sa matag category.' },
    ilocano: { grant: 'Agduduma ti grant babaen iti category. Segun iti 2026 QC Excel guide, agingga PHP 110,000 para iti tuition ken PHP 50,000 stipend iti tunggal school year.', eligibility: 'Masapul a residente ti Quezon City ken naka-enroll wenno naawat iti institusion a bigbigen ti siudad. Saan a mabalin ti sabali a scholarship ti LGU. Adda pay pagalagadan iti grado, kita, wenno sektor iti tunggal category.', documents: 'Isagana dagiti kabaruan a grado wenno transcript ken pammaneknek ti enrollment wenno pannakaawat. Agduduma dagiti dadduma a dokumento iti tunggal category.', applicationPeriod: 'Sukisoken ti QC eServices para iti agdama a panangawis ken deadline iti tunggal category.' },
  },
  'la-union-lueasp': {
    taglish: { grant: 'Nag-iiba ang grant ayon sa category at kasalukuyang provincial call. Kumpirmahin ang halaga sa PYESDO.', eligibility: 'Kasama sa maaaring mag-apply ang college at senior high school students at priority sectors gaya ng PWD, anak ng solo parent, Indigenous Peoples, at student-athletes. May dagdag na patakaran bawat category.', documents: 'Ihanda ang application form, latest grades, good moral certificate, enrollment proof, income documents ng magulang o guardian, residency o voter record, PSA birth certificate, at 2x2 photo. Kumpirmahin sa PYESDO ang dagdag na requirement.', applicationPeriod: 'Tingnan ang PYESDO para sa kasalukuyang cycle. Walang deadline na nakalista sa service page.' },
    cebuano: { grant: 'Magkalahi ang grant depende sa category ug kasamtangang panawagan sa probinsiya. Kumpirmaha ang kantidad sa PYESDO.', eligibility: 'Mahimong moaplay ang college ug senior high school nga mga estudyante ug prayoridad nga sektor sama sa PWD, anak sa solo parent, Indigenous Peoples, ug student-athletes. Adunay dugang nga lagda matag category.', documents: 'Iandam ang application form, pinakabag-ong grado, good moral certificate, pamatuod sa enrollment, mga dokumento sa kita sa ginikanan o guardian, pamatuod sa residency o voter record, PSA birth certificate, ug 2x2 nga litrato. Kumpirmaha sa PYESDO ang dugang nga kinahanglanon.', applicationPeriod: 'Susiha ang PYESDO para sa kasamtangang cycle. Walay deadline nga gilista sa service page.' },
    ilocano: { grant: 'Agduduma ti grant segun iti category ken agdama a panangawis ti probinsia. Pasingkedan iti PYESDO ti gatad.', eligibility: 'Mabalin nga agaplikar dagiti college ken senior high school nga estudyante ken dagiti prayoridad a sektor kas iti PWD, annak ti solo parent, Indigenous Peoples, ken student-athletes. Adda pay pagalagadan iti tunggal category.', documents: 'Isagana ti application form, kabaruan a grado, good moral certificate, pammaneknek ti enrollment, dokumento ti kita ti nagannak wenno guardian, pammaneknek ti residency wenno voter record, PSA birth certificate, ken 2x2 a retrato. Pasingkedan iti PYESDO dagiti sabali a kasapulan.', applicationPeriod: 'Sukisoken ti PYESDO para iti agdama a cycle. Awan ti deadline a nailista iti service page.' },
  },
  'isabela-bro-ed': {
    taglish: { grant: 'Ayon sa provincial office, hanggang PHP 3,000 tuition kada semester sa ISU at partner colleges, at hanggang PHP 3,000 miscellaneous fees para sa agriculture-related courses. Nag-iiba ang ibang category.', eligibility: 'Para sa mga anak ng small farmers ang regular scholarship, isang scholar bawat pamilyang magsasaka. May academic at non-academic college tracks.', documents: 'Magtanong sa BRO-Ed office para sa kasalukuyang application form at kumpletong listahan ng dokumento.', applicationPeriod: 'Magtanong sa BRO Office tungkol sa susunod na schedule at available na category.' },
    cebuano: { grant: 'Sumala sa provincial office, hangtod PHP 3,000 ang tuition matag semester sa ISU ug partner colleges, ug hangtod PHP 3,000 para sa miscellaneous fees sa agriculture-related nga kurso. Lahi-lahi ang ubang category.', eligibility: 'Para kini sa mga anak sa gagmayng mag-uuma, usa ka scholar matag pamilya sa mag-uuma. Adunay academic ug non-academic nga college track.', documents: 'Pangutan-a ang BRO-Ed office alang sa kasamtangang application form ug kompleto nga listahan sa dokumento.', applicationPeriod: 'Pangutan-a ang BRO Office bahin sa sunod nga schedule ug anaa nga category.' },
    ilocano: { grant: 'Segun iti provincial office, agingga PHP 3,000 ti tuition iti tunggal semester iti ISU ken partner colleges, ken agingga PHP 3,000 para kadagiti miscellaneous fees dagiti agriculture-related a kurso. Agduduma dagiti sabali a category.', eligibility: 'Para kadagiti annak dagiti babassit a mannalon ti regular scholarship, maysa a scholar iti tunggal pamilya. Adda academic ken non-academic a college track.', documents: 'Saludsoden ti BRO-Ed office maipapan iti agdama nga application form ken kompleto a listaan dagiti dokumento.', applicationPeriod: 'Saludsoden ti BRO Office maipapan iti sumaruno a schedule ken available a category.' },
  },
  'bulacan-tulong-pang-edukasyon': {
    taglish: { grant: 'Sa February 2026 payout report, PHP 3,000 ang para sa state universities, colleges at public senior high schools, at PHP 3,500 sa private institutions. Kumpirmahin ang halaga sa susunod na call.', eligibility: 'Para ito sa Bulakenyo students at iba pang education-related applicant groups. Iniulat ang payout sa public at private colleges, universities, at senior high schools.', documents: 'Ihanda ang request letter para sa Gobernador, completed application form na may 2x2 photo, enrollment o registration proof, at latest grades. Tingnan ang kasalukuyang citizen charter para sa dagdag na requirement.', applicationPeriod: 'Tapos na ang payout na iniulat noong February 2026. Tingnan ang provincial site para sa susunod na call.' },
    cebuano: { grant: 'Sa taho sa payout niadtong February 2026, PHP 3,000 para sa state universities, colleges ug public senior high schools, ug PHP 3,500 sa private institutions. Kumpirmaha ang kantidad sa sunod nga panawagan.', eligibility: 'Para kini sa mga estudyanteng Bulakenyo ug ubang grupo nga nag-aplay alang sa edukasyon. Gitaho ang payout sa public ug private colleges, universities, ug senior high schools.', documents: 'Iandam ang request letter para sa Gobernador, kompleto nga application form nga adunay 2x2 nga litrato, pamatuod sa enrollment o registration, ug pinakabag-ong grado. Susiha ang kasamtangang citizen charter alang sa dugang nga kinahanglanon.', applicationPeriod: 'Nahuman na ang payout nga gitaho niadtong February 2026. Susiha ang provincial site alang sa sunod nga panawagan.' },
    ilocano: { grant: 'Iti report ti payout idi February 2026, PHP 3,000 para kadagiti state universities, colleges ken public senior high schools, ken PHP 3,500 kadagiti private institutions. Pasingkedan ti gatad iti sumaruno a panangawis.', eligibility: 'Para kadagiti estudyante a Bulakenyo ken dadduma pay a grupo nga agaplikar iti tulong pang-edukasyon. Naipakaammo ti payout kadagiti public ken private colleges, universities, ken senior high schools.', documents: 'Isagana ti request letter para iti Gobernador, napno nga application form nga addaan 2x2 a retrato, pammaneknek ti enrollment wenno registration, ken kabaruan a grado. Kitaen ti agdama a citizen charter para kadagiti sabali a kasapulan.', applicationPeriod: 'Nalpasen ti payout a nailista idi February 2026. Kitaen ti provincial site para iti sumaruno a panangawis.' },
  },
  'laguna-iskolar-ng-laguna': {
    taglish: { grant: 'Kinumpirma ng provincial report na may scholarship allowances, pero walang nakasaad na kasalukuyang halaga. Kumpirmahin ang category at award sa opisina.', eligibility: 'Iniulat ng probinsiya ang mga scholar mula sa iba’t ibang lungsod at bayan ng Laguna. Hindi makita sa public guide ang kasalukuyang applicant criteria.', documents: 'Magtanong sa scholarship portal o Provincial Government of Laguna para sa kasalukuyang listahan ayon sa category.', applicationPeriod: 'Hindi kumpirmado ang mga petsa ng application. Tingnan ang official portal para sa susunod na call.' },
    cebuano: { grant: 'Gikumpirma sa report sa probinsiya nga adunay scholarship allowance, apan wala isulti ang kasamtangang kantidad. Kumpirmaha sa opisina ang category ug award.', eligibility: 'Nagtaho ang probinsiya og mga scholar gikan sa nagkalainlaing siyudad ug lungsod sa Laguna. Wala makita sa public guide ang kasamtangang criteria sa mga aplikante.', documents: 'Pangutan-a ang scholarship portal o Provincial Government of Laguna alang sa kasamtangang listahan sumala sa category.', applicationPeriod: 'Wala makumpirma ang mga petsa sa aplikasyon. Susiha ang official portal alang sa sunod nga panawagan.' },
    ilocano: { grant: 'Pinasingkedan ti report ti probinsia nga adda scholarship allowances, ngem saan a nailawlawag ti agdama a gatad. Pasingkedan iti opisina ti category ken award.', eligibility: 'Imbaga ti probinsia dagiti scholar manipud kadagiti nagduduma a siudad ken ili ti Laguna. Saan a nakita iti public guide dagiti agdama a pagalagadan para kadagiti agaplikar.', documents: 'Saludsoden ti scholarship portal wenno Provincial Government of Laguna maipapan iti agdama a listaan segun iti category.', applicationPeriod: 'Saan a napasingkedan dagiti petsa ti panagaplikar. Kitaen ti official portal para iti sumaruno a panangawis.' },
  },
  'palawan-akbay-sa-mag-aaral': {
    taglish: { grant: 'Nag-iiba ang halaga ayon sa scholarship category at walang nakasaad na halaga sa kasalukuyang public reference. Kumpirmahin sa probinsiya.', eligibility: 'Binanggit ng 2026 provincial plan ang orientation para sa bago at nagpapatuloy na scholars. May kaugnay na track para sa qualified students sa medicine o medical-related courses. Kumpirmahin ang kasalukuyang criteria.', documents: 'Magtanong sa Provincial Government of Palawan para sa application form at listahan ng dokumento.', applicationPeriod: 'Tingnan ang provincial contact directory para sa kasalukuyang intake schedule.' },
    cebuano: { grant: 'Magkalahi ang kantidad depende sa scholarship category ug wala isulti sa kasamtangang public reference. Kumpirmaha sa probinsiya.', eligibility: 'Gihisgotan sa 2026 provincial plan ang orientation para sa bag-o ug nagpadayong scholars. Adunay may kalabotang track para sa kwalipikadong estudyante sa medicine o medical-related nga kurso. Kumpirmaha ang kasamtangang criteria.', documents: 'Pangutan-a ang Provincial Government of Palawan alang sa application form ug listahan sa dokumento.', applicationPeriod: 'Susiha ang provincial contact directory alang sa kasamtangang intake schedule.' },
    ilocano: { grant: 'Agduduma ti gatad segun iti scholarship category ken saan a nailawlawag iti agdama a public reference. Pasingkedan iti probinsia.', eligibility: 'Nailista iti 2026 provincial plan ti orientation para kadagiti baro ken agtultuloy a scholars. Adda met ti nainaig a track para kadagiti kwalipikado nga estudyante iti medicine wenno medical-related a kurso. Pasingkedan dagiti agdama a pagalagadan.', documents: 'Saludsoden ti Provincial Government of Palawan maipapan iti application form ken listaan dagiti dokumento.', applicationPeriod: 'Kitaen ti provincial contact directory para iti agdama a intake schedule.' },
  },
  'albay-provincial-educational-assistance': {
    taglish: { grant: 'Walang standard na halaga sa 2026 Provincial Citizen Charter. Magtanong sa Provincial Education Department tungkol sa kasalukuyang assistance category.', eligibility: 'Kabilang sa mga maaaring mag-apply ang college students, Alternative Learning System learners, solo parents na may college student, PWD, at mga paaralan.', documents: 'Kailangan ang letter of intent para sa Gobernador. Para sa aplikanteng wala pang 18 taong gulang, dapat itong lagdaan ng magulang. Isumite ang certified true copy ng enrollment form, photocopy ng school ID, at original Certificate of Indigency. Maaaring may dagdag na dokumento para sa activities, awards, o school requests. Kumpirmahin sa opisina.', applicationPeriod: 'Nakalista ang serbisyo pero walang deadline. Kumpirmahin sa departamento ang susunod na intake.' },
    cebuano: { grant: 'Walay standard nga kantidad sa 2026 Provincial Citizen Charter. Pangutan-a ang Provincial Education Department bahin sa kasamtangang assistance category.', eligibility: 'Lakip sa mahimong moaplay ang college students, Alternative Learning System learners, solo parents nga adunay anak nga college student, PWD, ug mga eskwelahan.', documents: 'Kinahanglan ang letter of intent para sa Gobernador. Kung ang aplikante ubos sa 18 anyos, pirmahan kini sa ginikanan. Isumite ang certified true copy sa enrollment form, photocopy sa school ID, ug orihinal nga Certificate of Indigency. Mahimong adunay dugang nga dokumento para sa activities, awards, o mga hangyo sa eskwelahan. Kumpirmaha sa opisina.', applicationPeriod: 'Gilista ang serbisyo apan walay deadline. Kumpirmaha sa departamento ang sunod nga intake.' },
    ilocano: { grant: 'Awan ti naituding a gatad iti 2026 Provincial Citizen Charter. Saludsoden ti Provincial Education Department maipanggep iti agdama a assistance category.', eligibility: 'Mabalin nga agaplikar dagiti college students, Alternative Learning System learners, solo parents nga addaan anak a college student, PWD, ken dagiti pagadalan.', documents: 'Masapul ti letter of intent para iti Gobernador. No ti aplikante ket ubos ti 18 anyos, masapul a pirmaan ti nagannak. Isumite ti certified true copy ti enrollment form, photocopy ti school ID, ken orihinal a Certificate of Indigency. Mabalin nga adda sabali pay a dokumento para kadagiti aktibidad, award, wenno kiddaw ti pagadalan. Pasingkedan iti opisina.', applicationPeriod: 'Nailista ti serbisyo ngem awan ti deadline. Pasingkedan iti departamento ti sumaruno a panagawat.' },
  },
  'iloilo-isip': {
    taglish: { grant: 'Sa 2024 provincial report, PHP 3,500 ang monthly stipend, PHP 3,000 learning-resource aid kada semester, at PHP 5,000 thesis o research allowance para sa graduating scholars. Kumpirmahin ang kasalukuyang rates.', eligibility: 'Para sa deserving at underprivileged na senior high graduates na mag-aaral sa state college o university sa Iloilo. Sa 2024 call, kailangan ang bona fide Iloilo residency at hindi bababa sa 90 percent na SHS GWA.', documents: 'Ihanda ang application form, SHS Form 138, proof of income, barangay residency certificate, at valid school ID na may larawan at pirma.', applicationPeriod: 'Nagsara ang linked call noong July 2024. Tingnan ang provincial website para sa susunod na intake.' },
    cebuano: { grant: 'Sa 2024 provincial report, PHP 3,500 ang binulan nga stipend, PHP 3,000 nga learning-resource aid matag semester, ug PHP 5,000 nga thesis o research allowance para sa graduating scholars. Kumpirmaha ang kasamtangang rates.', eligibility: 'Para sa takos ug kabos nga senior high graduates nga mag-college sa state college o university sa Iloilo. Sa 2024 call, gikinahanglan ang tinuod nga residency sa Iloilo ug SHS GWA nga labing menos 90 percent.', documents: 'Iandam ang application form, SHS Form 138, pamatuod sa kita, barangay residency certificate, ug balidong school ID nga adunay litrato ug pirma.', applicationPeriod: 'Sirado na ang linked call niadtong July 2024. Susiha ang provincial website alang sa sunod nga intake.' },
    ilocano: { grant: 'Iti 2024 provincial report, PHP 3,500 ti monthly stipend, PHP 3,000 a learning-resource aid iti tunggal semester, ken PHP 5,000 a thesis wenno research allowance para kadagiti graduating scholars. Pasingkedan dagiti agdama a rates.', eligibility: 'Para kadagiti maikari ken marigrigat a senior high graduates nga agadal iti state college wenno university iti Iloilo. Iti 2024 call, kasapulan ti pudno a panagnaed iti Iloilo ken SHS GWA a saan a bumaba iti 90 percent.', documents: 'Isagana ti application form, SHS Form 138, pammaneknek ti kita, barangay residency certificate, ken balido a school ID nga addaan retrato ken pirma.', applicationPeriod: 'Naserraan ti linked call idi July 2024. Kitaen ti provincial website para iti sumaruno a panagawat.' },
  },
  'cebu-cp-gifts': {
    taglish: { grant: 'Sa 2026 program launch, PHP 10,000 ang nakalistang tulong bawat deserving college student at may 5,900 slots para sa season.', eligibility: 'Para sa pagpapatuloy ng scholarship, kailangan ng hindi bababa sa 85 percent na grade average at apat-na-taong kurso sa public higher education institution. Nag-iiba ang unang pagpili bawat call.', documents: 'Hindi nakalista sa launch article ang unang application documents. Kumpirmahin sa Cebu Provincial School Board ang checklist.', applicationPeriod: 'Inanunsyo ang bagong season noong June 2026. Kumpirmahin kung bukas pa at ang susunod na deadline.' },
    cebuano: { grant: 'Sa paglunsad sa programa sa 2026, PHP 10,000 ang gilista nga tabang matag deserving college student ug adunay 5,900 ka slots alang sa season.', eligibility: 'Para makapadayon, kinahanglan og grado nga labing menos 85 percent ug upat ka tuig nga kurso sa public higher education institution. Magkalahi ang unang pagpili matag call.', documents: 'Wala gilista sa launch article ang unang application documents. Kumpirmaha sa Cebu Provincial School Board ang checklist.', applicationPeriod: 'Gipahibalo ang bag-ong season niadtong June 2026. Kumpirmaha kon bukas pa ug unsa ang sunod nga deadline.' },
    ilocano: { grant: 'Iti pannaka-irugi ti programa idi 2026, nailista ti PHP 10,000 a tulong iti tunggal deserving college student ken adda 5,900 a slots para iti season.', eligibility: 'Tapno agtultuloy, kasapulan ti grado a saan a bumaba iti 85 percent ken uppat a tawen a kurso iti public higher education institution. Agduduma ti umuna a panangpili iti tunggal call.', documents: 'Saan a nailista iti launch article dagiti umuna nga application documents. Pasingkedan iti Cebu Provincial School Board ti checklist.', applicationPeriod: 'Naipakaammo ti baro a season idi June 2026. Pasingkedan no silulukat pay ken ti sumaruno a deadline.' },
  },
  'northern-samar-nursing-scholarship': {
    taglish: { grant: 'Saklaw sa provincial ordinance ang tuition, school fees, clinical needs, lodging, books, uniforms, transport, at iba pang aprubadong gastos. Kumpirmahin ang kasalukuyang limit.', eligibility: 'Para sa kwalipikado at indigent na residente ng Northern Samar na nag-aaral ng nursing, pati graduates na nagre-review. May academic rules at return-of-service obligation.', documents: 'Hindi ibinigay ng ordinance ang kasalukuyang checklist. Magtanong sa Provincial Scholarship Secretariat.', applicationPeriod: 'Walang kasalukuyang call na napatunayan. Tingnan sa provincial government.' },
    cebuano: { grant: 'Lakip sa tabon sa provincial ordinance ang tuition, school fees, clinical needs, lodging, books, uniforms, transport, ug ubang gi-aprobahan nga gasto. Kumpirmaha ang kasamtangang limit.', eligibility: 'Para sa kwalipikado ug indigent nga residente sa Northern Samar nga nag-nursing, apil ang mga graduates nga nag-review. Adunay academic rules ug return-of-service obligation.', documents: 'Wala ihatag sa ordinance ang kasamtangang checklist. Pangutan-a ang Provincial Scholarship Secretariat.', applicationPeriod: 'Walay kasamtangang call nga napamatud-an. Susiha sa provincial government.' },
    ilocano: { grant: 'Saklawen ti provincial ordinance ti tuition, school fees, clinical needs, lodging, libro, uniporme, transport, ken dadduma pay a gastos a napatgan. Pasingkedan ti agdama a limit.', eligibility: 'Para kadagiti kwalipikado ken indigent a residente ti Northern Samar nga agadal iti nursing, pakairaman dagiti graduates nga ag-review. Adda academic rules ken return-of-service obligation.', documents: 'Saan nga inted ti ordinance ti agdama a checklist. Saludsoden ti Provincial Scholarship Secretariat.', applicationPeriod: 'Awan ti napasingkedan nga agdama a call. Kitaen iti provincial government.' },
  },
  'zamboanga-agriculture-scholarship': {
    taglish: { grant: 'Iniulat ng lungsod noong May 2026 ang PHP 40,000 kada academic year o PHP 20,000 kada semester.', eligibility: 'Para sa agriculture, forestry, fisheries, agricultural and biosystems engineering, at veterinary medicine students. Kumpirmahin sa city ordinance ang residency at kasalukuyang course rules.', documents: 'Hindi nakalista sa payout report ang unang requirements. Magtanong sa Office of the City Agriculturist para sa kasalukuyang checklist.', applicationPeriod: 'May payout report noong May 2026. Hindi pa kumpirmado ang susunod na application period.' },
    cebuano: { grant: 'Nagtaho ang siyudad niadtong May 2026 og PHP 40,000 matag academic year o PHP 20,000 matag semester.', eligibility: 'Para sa mga estudyante sa agriculture, forestry, fisheries, agricultural and biosystems engineering, ug veterinary medicine. Kumpirmaha sa city ordinance ang residency ug kasamtangang lagda sa kurso.', documents: 'Wala gilista sa payout report ang unang requirements. Pangutan-a ang Office of the City Agriculturist alang sa kasamtangang checklist.', applicationPeriod: 'Adunay payout report niadtong May 2026. Wala pa makumpirma ang sunod nga application period.' },
    ilocano: { grant: 'Imbaga ti siudad idi May 2026 ti PHP 40,000 iti tunggal academic year wenno PHP 20,000 iti tunggal semester.', eligibility: 'Para kadagiti estudyante iti agriculture, forestry, fisheries, agricultural and biosystems engineering, ken veterinary medicine. Pasingkedan iti city ordinance ti residency ken agdama a pagalagadan ti kurso.', documents: 'Saan a nailista iti payout report dagiti umuna a requirements. Saludsoden ti Office of the City Agriculturist ti agdama a checklist.', applicationPeriod: 'Adda payout report idi May 2026. Saan pay a napasingkedan ti sumaruno nga application period.' },
  },
  'cagayan-de-oro-city-scholarship': {
    taglish: { grant: 'Sa 2025-2026 call, full tuition, matriculation at ibang fees, kasama ang buwanang stipend. Kumpirmahin sa City Scholarships Office ang kasalukuyang limit.', eligibility: 'Sa 2025-2026 call, kailangan ang Filipino citizenship, permanenteng residency sa Cagayan de Oro, full-time first-year undergraduate study, kita ng pamilya na hindi lalampas sa PHP 300,000 bawat taon, at walang kapatid na city scholar. Kumpirmahin ang kasalukuyang rules.', documents: 'Nasa 2025-2026 announcement ang application documents at online process. Maaaring magbago ang listahan; tingnan ang City Scholarships Office.', applicationPeriod: 'Para sa 2025-2026 ang linked call. Magtanong sa opisina tungkol sa susunod na period.' },
    cebuano: { grant: 'Sa 2025-2026 call, sakop ang full tuition, matriculation ug ubang fees, apil ang binulan nga stipend. Kumpirmaha sa City Scholarships Office ang kasamtangang limit.', eligibility: 'Sa 2025-2026 call, kinahanglan ang Filipino citizenship, permanenteng residency sa Cagayan de Oro, full-time first-year undergraduate study, kita sa pamilya nga dili molapas sa PHP 300,000 matag tuig, ug walay igsoon nga city scholar. Kumpirmaha ang kasamtangang lagda.', documents: 'Gilista sa 2025-2026 announcement ang application documents ug online process. Mahimong mausab ang listahan; susiha sa City Scholarships Office.', applicationPeriod: 'Para sa 2025-2026 ang linked call. Pangutan-a ang opisina bahin sa sunod nga period.' },
    ilocano: { grant: 'Iti 2025-2026 call, saklawen ti full tuition, matriculation ken dadduma a fees, ken adda met monthly stipend. Pasingkedan iti City Scholarships Office ti agdama a limit.', eligibility: 'Iti 2025-2026 call, kasapulan ti Filipino citizenship, permanente a residency iti Cagayan de Oro, full-time first-year undergraduate study, kita ti pamilya a saan a lumabes iti PHP 300,000 iti tunggal tawen, ken awan a kabsat a city scholar. Pasingkedan dagiti agdama a pagalagadan.', documents: 'Nailista iti 2025-2026 announcement dagiti application documents ken online process. Mabalin a mabaliwan ti listaan; kitaen iti City Scholarships Office.', applicationPeriod: 'Para iti 2025-2026 ti linked call. Saludsoden ti opisina maipanggep iti sumaruno a period.' },
  },
  'davao-city-step': {
    taglish: { grant: 'Sa 2025-2026 report, PHP 50,000, PHP 40,000, o PHP 15,000 kada semester ayon sa category. Kumpirmahin ang kasalukuyang rates.', eligibility: 'Itinatakda ng city charter ang Davao City residency at academic rules. Ayon sa 2025-2026 report, walang failing grade ang scholars. Kumpirmahin sa EBSU ang kasalukuyang category rules.', documents: 'Nakalista sa 2024 city charter ang report card o transcript, residency at good moral certificates, patunay ng kita o eligibility, income documents ng magulang, at photo. Kumpirmahin ang current checklist.', applicationPeriod: 'Para sa 2025-2026 ang report. Tingnan ang EBSU portal para sa bagong call.' },
    cebuano: { grant: 'Sa report sa 2025-2026, PHP 50,000, PHP 40,000, o PHP 15,000 matag semester depende sa category. Kumpirmaha ang kasamtangang rates.', eligibility: 'Gikinahanglan sa city charter ang residency sa Davao City ug academic rules. Sumala sa report sa 2025-2026, walay failing grade ang mga scholar. Kumpirmaha sa EBSU ang kasamtangang lagda matag category.', documents: 'Gilista sa 2024 city charter ang report card o transcript, residency ug good moral certificates, pamatuod sa kita o eligibility, mga dokumento sa kita sa ginikanan, ug litrato. Kumpirmaha ang kasamtangang checklist.', applicationPeriod: 'Para sa 2025-2026 ang report. Susiha ang EBSU portal alang sa bag-ong panawagan.' },
    ilocano: { grant: 'Iti 2025-2026 report, PHP 50,000, PHP 40,000, wenno PHP 15,000 iti tunggal semester segun iti category. Pasingkedan dagiti agdama a rates.', eligibility: 'Kasapulan iti city charter ti residency iti Davao City ken dagiti academic rules. Segun iti 2025-2026 report, awan ti failing grade dagiti scholar. Pasingkedan iti EBSU dagiti agdama a pagalagadan iti tunggal category.', documents: 'Nailista iti 2024 city charter ti report card wenno transcript, residency ken good moral certificates, pammaneknek ti kita wenno eligibility, dokumento ti kita dagiti nagannak, ken retrato. Pasingkedan ti agdama a checklist.', applicationPeriod: 'Para iti 2025-2026 ti report. Kitaen ti EBSU portal para iti baro a panangawis.' },
  },
  'south-cotabato-kpsgiap': {
    taglish: { grant: 'Sa May 2026 update, hanggang PHP 45,000 kada semester para sa regular scholars, para lamang sa dokumentadong school expenses.', eligibility: 'Nag-anunsyo ang probinsiya ng hindi bababa sa 120 college slots para sa school year 2026-2027. Tingnan ang current call para sa course, residency, income, at grade rules.', documents: 'Gamitin ang kasalukuyang provincial call para sa official application form at checklist.', applicationPeriod: 'Inanunsyo noong May 2026 ang 2026-2027 slots. Kumpirmahin kung bukas pa ang application.' },
    cebuano: { grant: 'Sa update niadtong May 2026, hangtod PHP 45,000 matag semester para sa regular scholars, alang lamang sa dokumentadong gasto sa eskwelahan.', eligibility: 'Nag-anunsyo ang probinsiya og labing menos 120 college slots alang sa school year 2026-2027. Susiha ang current call para sa course, residency, income, ug grade rules.', documents: 'Gamita ang kasamtangang provincial call alang sa official application form ug checklist.', applicationPeriod: 'Gipahibalo niadtong May 2026 ang 2026-2027 slots. Kumpirmaha kon bukas pa ang aplikasyon.' },
    ilocano: { grant: 'Iti update idi May 2026, agingga PHP 45,000 iti tunggal semester para kadagiti regular scholars, para laeng kadagiti napaneknekan a gastos ti pagadalan.', eligibility: 'Imbaga ti probinsia ti saan a bumaba iti 120 college slots para iti school year 2026-2027. Kitaen ti current call para kadagiti course, residency, income, ken grade rules.', documents: 'Usaren ti agdama a provincial call para iti official application form ken checklist.', applicationPeriod: 'Naipakaammo idi May 2026 dagiti 2026-2027 slots. Pasingkedan no silulukat pay ti panagaplikar.' },
  },
  'agusan-del-norte-agnoriskolar': {
    taglish: { grant: 'Nag-iiba ang halaga ayon sa Provincial Special Education, Indigenous Peoples, Medical Scholarship, at ibang category. Walang standard na halaga sa linked notice.', eligibility: 'Sa 2025-2026 soft launch, may grantees ang Provincial Special Education, Provincial Indigenous Peoples, at Provincial Medical Scholarship programs.', documents: 'Magtanong sa provincial scholarship focal office tungkol sa kasalukuyang listahan ayon sa category.', applicationPeriod: 'Walang current call sa soft-launch notice. Kontakin ang probinsiya para sa susunod na cycle.' },
    cebuano: { grant: 'Magkalahi ang kantidad depende sa Provincial Special Education, Indigenous Peoples, Medical Scholarship, ug ubang category. Walay standard nga kantidad sa linked notice.', eligibility: 'Sa soft launch sa 2025-2026, adunay grantees ang Provincial Special Education, Provincial Indigenous Peoples, ug Provincial Medical Scholarship programs.', documents: 'Pangutan-a ang provincial scholarship focal office alang sa kasamtangang listahan sumala sa category.', applicationPeriod: 'Walay current call sa soft-launch notice. Kontaka ang probinsiya para sa sunod nga cycle.' },
    ilocano: { grant: 'Agduduma ti gatad segun kadagiti Provincial Special Education, Indigenous Peoples, Medical Scholarship, ken dadduma pay a category. Awan ti naituding a gatad iti linked notice.', eligibility: 'Iti 2025-2026 soft launch, adda grantees dagiti Provincial Special Education, Provincial Indigenous Peoples, ken Provincial Medical Scholarship programs.', documents: 'Saludsoden ti provincial scholarship focal office maipanggep iti agdama a listaan segun iti category.', applicationPeriod: 'Awan ti current call iti soft-launch notice. Kontaken ti probinsia para iti sumaruno a cycle.' },
  },
  'benguet-college-scholarship': {
    taglish: { grant: 'Kinumpirma ng probinsiya ang scholarship appropriation, pero walang kasalukuyang standard na halaga sa mga sinuring source.', eligibility: 'Itinatag ito sa Provincial Ordinance No. 2019-261. Kumpirmahin sa provincial office ang kasalukuyang residency, grade, income, at course rules.', documents: 'Magtanong sa Provincial Government of Benguet para sa kasalukuyang application form at dokumento.', applicationPeriod: 'Tingnan sa probinsiya ang susunod na call at schedule.' },
    cebuano: { grant: 'Gikumpirma sa probinsiya ang pondo alang sa scholarship, apan walay kasamtangang standard nga kantidad sa mga source nga gisusi.', eligibility: 'Gitukod kini pinaagi sa Provincial Ordinance No. 2019-261. Kumpirmaha sa provincial office ang kasamtangang residency, grado, income, ug course rules.', documents: 'Pangutan-a ang Provincial Government of Benguet alang sa kasamtangang application form ug mga dokumento.', applicationPeriod: 'Susiha sa probinsiya ang sunod nga panawagan ug schedule.' },
    ilocano: { grant: 'Pinasingkedan ti probinsia ti pondo para iti scholarship, ngem awan ti agdama a naituding a gatad kadagiti source a sinukisok.', eligibility: 'Naipasdek daytoy babaen iti Provincial Ordinance No. 2019-261. Pasingkedan iti provincial office dagiti agdama a residency, grado, income, ken course rules.', documents: 'Saludsoden ti Provincial Government of Benguet maipapan iti agdama nga application form ken dokumento.', applicationPeriod: 'Sukisoken iti probinsia ti sumaruno a panangawis ken schedule.' },
  },
  'lanao-del-sur-ranaw-iskolar': {
    taglish: { grant: 'Sa 2026 pilot, nakasaad ang tuition at school fees, buwanang stipend, food allowance, at dormitory. Kumpirmahin sa probinsiya ang kasalukuyang package.', eligibility: 'Priyoridad sa 2026 pilot ang public-school students. Isinasaalang-alang din ang full scholars mula sa private schools, orphans, anak ng solo parent, at vulnerable households na pasok sa academic rules.', documents: 'Walang kasalukuyang checklist sa launch report. Magtanong sa Provincial Government of Lanao del Sur.', applicationPeriod: 'Inanunsyo ang unang pilot cohort para sa 2026-2027. Magtanong tungkol sa susunod na application.' },
    cebuano: { grant: 'Sa 2026 pilot, gilista ang tuition ug school fees, binulan nga stipend, food allowance, ug dormitory. Kumpirmaha sa probinsiya ang kasamtangang package.', eligibility: 'Giprioridad sa 2026 pilot ang mga estudyante sa public schools. Gikonsiderar usab ang full scholars gikan sa private schools, mga ilo, anak sa solo parent, ug vulnerable households nga nakatuman sa academic rules.', documents: 'Walay kasamtangang checklist sa launch report. Pangutan-a ang Provincial Government of Lanao del Sur.', applicationPeriod: 'Gipahibalo ang unang pilot cohort para sa 2026-2027. Pangutan-a bahin sa sunod nga aplikasyon.' },
    ilocano: { grant: 'Iti 2026 pilot, nailista ti tuition ken school fees, monthly stipend, food allowance, ken dormitory. Pasingkedan iti probinsia ti agdama a package.', eligibility: 'Imuna iti 2026 pilot dagiti estudyante manipud public schools. Usaren met a pangikonsiderar dagiti full scholars manipud private schools, ulila, annak ti solo parent, ken vulnerable households a makatungpal kadagiti academic rules.', documents: 'Awan ti agdama a checklist iti launch report. Saludsoden ti Provincial Government of Lanao del Sur.', applicationPeriod: 'Naipakaammo ti umuna a pilot cohort para iti 2026-2027. Saludsoden ti sumaruno a panagaplikar.' },
  },
  'negros-occidental-nosp': {
    taglish: { grant: 'Nag-iiba ayon sa category. Kabilang sa iniulat na tulong ang libreng tuition at miscellaneous fees, book at uniform allowance, at iba pang assistance. Kumpirmahin ang limit sa NOSP.', eligibility: 'Sa 2025-2026 report, kabilang ang District Education, Degree Completion, Indigenous Peoples, medical at nursing, midwifery, PWD, solo-parent-child, at OFW-related categories. May screening, exam, o interview ayon sa category.', documents: 'Magtanong sa NOSP Division para sa kasalukuyang checklist. Maaaring luma na ang nasa dating citizen charter.', applicationPeriod: 'Para sa 2025-2026 ang linked report. Tingnan ang provincial website para sa kasalukuyang call.' },
    cebuano: { grant: 'Magkalahi depende sa category. Lakip sa gitaho nga tabang ang libreng tuition ug miscellaneous fees, book ug uniform allowance, ug ubang assistance. Kumpirmaha ang limit sa NOSP.', eligibility: 'Sa report sa 2025-2026, lakip ang District Education, Degree Completion, Indigenous Peoples, medical ug nursing, midwifery, PWD, solo-parent-child, ug OFW-related categories. Adunay screening, exam, o interview depende sa category.', documents: 'Pangutan-a ang NOSP Division alang sa kasamtangang checklist. Mahimong daan na ang naa sa karaang citizen charter.', applicationPeriod: 'Para sa 2025-2026 ang linked report. Susiha ang provincial website alang sa kasamtangang panawagan.' },
    ilocano: { grant: 'Agduduma segun iti category. Nairaman iti naipadamag a tulong ti libre a tuition ken miscellaneous fees, book ken uniform allowance, ken dadduma pay a tulong. Pasingkedan ti limit iti NOSP.', eligibility: 'Iti 2025-2026 report, nairaman dagiti District Education, Degree Completion, Indigenous Peoples, medical ken nursing, midwifery, PWD, solo-parent-child, ken OFW-related categories. Adda screening, exam, wenno interview segun iti category.', documents: 'Saludsoden ti NOSP Division maipapan iti agdama a checklist. Mabalin a lakayen dagiti adda iti daan a citizen charter.', applicationPeriod: 'Para iti 2025-2026 ti linked report. Kitaen ti provincial website para iti agdama a panangawis.' },
  },
  'paranaque-tulong-dunong-district-referral': {
    taglish: { grant: 'Ayon sa UniFAST guidance, PHP 7,500 kada regular semester, depende sa prioritization at pondo. Kumpirmahin ang revised guidelines at local call.', eligibility: 'Kabilang sa UniFAST rules ang Filipino citizenship, kita ng magulang o guardian na hindi hihigit sa PHP 400,000, unang undergraduate degree, at kawalan ng ibang national scholarship. Para sa 2024 cycle lamang ang Parañaque district intake na nakita.', documents: 'Nakalista sa UniFAST ang TDP-TES form, kasalukuyang registration o enrollment certificate, at barangay Certificate of Indigency. Kumpirmahin sa district o HEI office ang kasalukuyang call at dagdag na dokumento.', applicationPeriod: 'Depende sa opisina. Ang Parañaque bulletin ay para sa 2024 lamang. Kumpirmahin ang current dates sa opisina.' },
    cebuano: { grant: 'Sumala sa UniFAST guidance, PHP 7,500 matag regular semester depende sa prayoridad ug pondo. Kumpirmaha ang giusab nga guidelines ug local call.', eligibility: 'Lakip sa UniFAST rules ang Filipino citizenship, kita sa ginikanan o guardian nga dili molapas sa PHP 400,000, unang undergraduate degree, ug walay laing national scholarship. Para sa 2024 cycle lamang ang Parañaque district intake nga nakita.', documents: 'Gilista sa UniFAST ang TDP-TES form, kasamtangang registration o enrollment certificate, ug barangay Certificate of Indigency. Kumpirmaha sa district o HEI office ang kasamtangang call ug dugang nga dokumento.', applicationPeriod: 'Depende sa opisina. Para sa 2024 lamang ang Parañaque bulletin. Kumpirmaha sa opisina ang kasamtangang petsa.' },
    ilocano: { grant: 'Segun iti UniFAST guidance, PHP 7,500 iti tunggal regular semester depende iti prayoridad ken pondo. Pasingkedan dagiti nabaliwan a guidelines ken local call.', eligibility: 'Nairaman kadagiti UniFAST rules ti Filipino citizenship, kita dagiti nagannak wenno guardian a saan a lumabes iti PHP 400,000, umuna nga undergraduate degree, ken awan ti sabali a national scholarship. Para laeng iti 2024 cycle ti nakita a Parañaque district intake.', documents: 'Nailista iti UniFAST ti TDP-TES form, agdama a registration wenno enrollment certificate, ken barangay Certificate of Indigency. Pasingkedan iti district wenno HEI office ti agdama a call ken dadduma pay a dokumento.', applicationPeriod: 'Agdepende iti opisina. Para laeng iti 2024 ti Parañaque bulletin. Pasingkedan kadagiti opisina dagiti agdama a petsa.' },
  },
};

export function getLGUScholarshipDetails(program: LGUScholarshipProgram, language: Language): LGUScholarshipLocalizedDetails {
  if (language === 'en') {
    return {
      grant: program.grantAmountPerSemOrYear,
      eligibility: program.eligibilityHighlights.join(' '),
      documents: program.requiredDocuments.join(' '),
      applicationPeriod: program.applicationPeriod ?? 'Contact the program office for current application dates.',
    };
  }

  return localizedDetails[program.id]?.[language] ?? getLGUScholarshipDetails(program, 'en');
}

const normalize = (value: string) => value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ');
const normalizeCity = (value: string) => normalize(value).replace(/^city of /, '').replace(/ city$/, '');
const normalizeProvince = (value: string) => normalize(value).replace(/^province of /, '');

const regionAliases: Record<string, string[]> = {
  'National Capital Region (NCR)': ['ncr', 'metro manila', 'national capital region'],
  'Region I (Ilocos Region)': ['region i', 'region 1', 'ilocos region', 'ilocos'],
  'Region II (Cagayan Valley)': ['region ii', 'region 2', 'cagayan valley'],
  'Region III (Central Luzon)': ['region iii', 'region 3', 'central luzon'],
  'Region IV-A (CALABARZON)': ['region iv-a', 'region iva', 'calabarzon'],
  'MIMAROPA Region': ['region iv-b', 'region ivb', 'mimaropa'],
  'Region V (Bicol Region)': ['region v', 'region 5', 'bicol region', 'bicol'],
  'Region VI (Western Visayas)': ['region vi', 'region 6', 'western visayas'],
  'Region VII (Central Visayas)': ['region vii', 'region 7', 'central visayas'],
  'Region VIII (Eastern Visayas)': ['region viii', 'region 8', 'eastern visayas'],
  'Region IX (Zamboanga Peninsula)': ['region ix', 'region 9', 'zamboanga peninsula'],
  'Region X (Northern Mindanao)': ['region x', 'region 10', 'northern mindanao'],
  'Region XI (Davao Region)': ['region xi', 'region 11', 'davao region'],
  'Region XII (SOCCSKSARGEN)': ['region xii', 'region 12', 'soccskargen'],
  'Region XIII (Caraga)': ['region xiii', 'region 13', 'caraga'],
  'Cordillera Administrative Region (CAR)': ['car', 'cordillera', 'cordillera administrative region'],
  'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)': ['barmm', 'bangsamoro'],
  'Negros Island Region (NIR)': ['nir', 'negros island region'],
};

function matchesRegion(programRegion: string, requestedRegion: string): boolean {
  const requested = normalize(requestedRegion);
  const actual = normalize(programRegion);
  return actual === requested || (regionAliases[programRegion] ?? []).some(alias => normalize(alias) === requested);
}

export function filterLGUScholarships(filters: {
  region?: string;
  province?: string;
  cityMunicipality?: string;
  jurisdiction?: 'all' | LGUScholarshipJurisdiction;
  query?: string;
}): LGUScholarshipProgram[] {
  const query = normalize(filters.query ?? '');
  return lguScholarshipPrograms.filter(program => {
    if (filters.region && !matchesRegion(program.region, filters.region)) return false;
    if (filters.province && normalizeProvince(program.province ?? '') !== normalizeProvince(filters.province)) return false;
    if (filters.cityMunicipality && normalizeCity(program.cityMunicipality ?? '') !== normalizeCity(filters.cityMunicipality)) return false;
    if (filters.jurisdiction && filters.jurisdiction !== 'all' && program.jurisdiction !== filters.jurisdiction) return false;
    if (query) {
      const searchable = [program.id, program.name, program.region, program.province, program.cityMunicipality,
        program.congressionalDistrict, program.grantAmountPerSemOrYear, ...program.eligibilityHighlights,
        ...program.requiredDocuments, program.officeName, program.contactOrWebsite, program.applicationPeriod]
        .filter(Boolean).join(' ');
      if (!normalize(searchable).includes(query)) return false;
    }
    return true;
  });
}

export function matchLGUScholarshipsToLocation(location: { province?: string; cityMunicipality?: string }): LGUScholarshipProgram[] {
  const cityMatches = location.cityMunicipality
    ? filterLGUScholarships({ province: location.province, cityMunicipality: location.cityMunicipality, jurisdiction: 'city_municipality' })
    : [];
  const provinceMatches = location.province
    ? filterLGUScholarships({ province: location.province, jurisdiction: 'province' })
    : [];
  const districtMatches = location.province
    ? filterLGUScholarships({ province: location.province, cityMunicipality: location.cityMunicipality, jurisdiction: 'congressional_district' })
      .filter(program => !program.districtMatchNeedsConfirmation)
    : [];
  return [...new Map([...cityMatches, ...provinceMatches, ...districtMatches].map(program => [program.id, program])).values()];
}

type LetterProfile = StudentEducationProfile & { province?: string; barangay?: string; courseName?: string };
const safe = (value?: string) => (value?.trim() || '____________________').replace(/\u2014/g, '-');

export function generateLGUScholarshipLetterDraft(profile: LetterProfile, program: LGUScholarshipProgram, language: Language): string {
  const name = safe(profile.fullName);
  const school = safe(profile.schoolName);
  const course = safe(profile.courseName || profile.degreeProgram);
  const location = [profile.barangay, profile.cityMunicipality, profile.province].filter(Boolean).map(value => safe(value)).join(', ') || '____________________';
  const office = safe(program.officeName);
  const scholarship = safe(program.name);

  const copy: Record<Language, { date: string; recipient: string; subject: string; greeting: string; body: string; close: string }> = {
    taglish: {
      date: 'Petsa',
      recipient: 'Para sa',
      subject: `Paksa: Magalang na pagtatanong tungkol sa ${scholarship}`,
      greeting: `Mahal na ${office},`,
      body: `Ako po si ${name}, isang estudyante ng ${course} sa ${school}, at nakatira sa ${location}. Magalang po akong humihiling ng gabay at assessment kung maaari akong mag-apply sa ${scholarship}. Maaari po bang ibahagi ang kasalukuyang application call, kwalipikasyon, halaga ng grant, panahon ng aplikasyon, at eksaktong documentary requirements? Nauunawaan ko pong ang opisina ang magkukumpirma ng eligibility, available na pondo, at approval.`,
      close: 'Maraming salamat po sa inyong oras at gabay. Lubos na gumagalang,',
    },
    cebuano: {
      date: 'Petsa',
      recipient: 'Alang kang',
      subject: `Tumong: Matinahuron nga pangutana bahin sa ${scholarship}`,
      greeting: `Minahal nga ${office},`,
      body: `Ako si ${name}, estudyante sa ${course} sa ${school}, ug nagpuyo sa ${location}. Matinahuron kong nangayo og giya ug pagtimbang-timbang kon mahimo ba akong mo-aplay sa ${scholarship}. Mahimo ba ninyo ipahibalo ang kasamtangang panawagan, mga kwalipikasyon, kantidad sa tabang, panahon sa pag-aplay, ug tukmang mga dokumento nga kinahanglan? Nasabtan nako nga ang inyong opisina maoy mokumpirma sa kwalipikasyon, pondo nga anaa, ug pag-apruba.`,
      close: 'Daghang salamat sa inyong panahon ug giya. Matinahuron,',
    },
    ilocano: {
      date: 'Petsa',
      recipient: 'Para ken',
      subject: `Panggep: Naayat a saludsod maipanggep iti ${scholarship}`,
      greeting: `Napateg a ${office},`,
      body: `Siak ni ${name}, maysa nga estudyante iti ${course} iti ${school}, ken agnanaed iti ${location}. Naayat a dumawatak iti bagnus ken panangusisa no mabalinko nga agaplikar iti ${scholarship}. Mabalin kadi nga ipakaammonyo ti agdama a panangawis, dagiti kasapulan, gatad ti tulong, tiempo ti panagaplikar, ken dagiti dokumento a masapul? Ammok nga ti opisina ti mangpasingked iti pannakaikari, pondo, ken panangaprobar.`,
      close: 'Agyamanak iti oras ken bagnusyo. Naayat a ramanek,',
    },
    en: {
      date: 'Date',
      recipient: 'To',
      subject: `Subject: Request for guidance about ${scholarship}`,
      greeting: `Dear ${office},`,
      body: `My name is ${name}. I study ${course} at ${school} and live in ${location}. I respectfully request guidance and an assessment of whether I may apply for ${scholarship}. Please share the current application call, eligibility rules, grant amount, application period, and exact documentary requirements. I understand that your office must confirm eligibility, available funding, and approval.`,
      close: 'Thank you for your time and guidance. Respectfully,',
    },
  };

  const letter = copy[language];
  return [
    `${letter.date}: ____________________`,
    `${letter.recipient}: ${office}`,
    letter.subject,
    '',
    letter.greeting,
    '',
    letter.body,
    '',
    letter.close,
    name,
  ].join('\n').replace(/\u2014/g, '-');
}
