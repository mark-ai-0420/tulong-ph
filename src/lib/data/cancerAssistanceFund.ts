export type CAFIslandGroup = 'Luzon' | 'Visayas' | 'Mindanao';

export interface CAFAccessSite {
  id: string;
  hospitalName: string;
  region: string;
  regionCode: string;
  islandGroup: CAFIslandGroup;
  city: string;
  contactDesk: string;
}

export interface CAFRequiredDocument {
  id: string;
  nameEn: string;
  nameTl: string;
}

export const CANCER_ASSISTANCE_FUND = {
  statutoryBasis: 'Republic Act No. 11215, the National Integrated Cancer Control Act',
  statutoryBasisUrl: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/86444',
  annualAssistanceLimitPerPatient: 150000,
  annualAssistanceLimitLabel: 'Up to ₱150,000 per patient per year',
  coveredUses: [
    'Eligible cancer diagnostics and laboratory services',
    'Eligible chemotherapy, immunotherapy, and other cancer treatment services',
    'Eligible supportive cancer medicines and related services',
  ],
  applicationNote:
    'Applications are assessed by a participating access site. Assistance depends on covered services, program rules, and available funds. It is not an automatic cash grant.',
  accessSiteLocatorUrl: 'https://tinyurl.com/CAF-Access-Sites',
  accessSiteSnapshotAsOf: '2026-07-06',
  accessSiteSnapshotSourceUrl: 'https://www.pna.gov.ph/index.php/articles/1278737',
} as const;

const DEFAULT_CAF_CONTACT_DESK =
  'Ask the hospital switchboard or social service desk for the Cancer Assistance Fund / Cancer Control Program coordinator';

function site(
  id: string,
  hospitalName: string,
  region: string,
  regionCode: string,
  islandGroup: CAFIslandGroup,
  city: string
): CAFAccessSite {
  return { id, hospitalName, region, regionCode, islandGroup, city, contactDesk: DEFAULT_CAF_CONTACT_DESK };
}

/**
 * DOH Cancer Assistance Fund access-site snapshot across Luzon, Visayas, and Mindanao.
 * Confirm current participation and the correct desk through the DOH locator before visiting.
 */
export const DOH_CAF_ACCESS_SITES: CAFAccessSite[] = [
  site('amc', 'Amang Rodriguez Memorial Medical Center', 'National Capital Region', 'NCR', 'Luzon', 'Marikina City'),
  site('eamc', 'East Avenue Medical Center', 'National Capital Region', 'NCR', 'Luzon', 'Quezon City'),
  site('jrrmmc', 'Jose R. Reyes Memorial Medical Center', 'National Capital Region', 'NCR', 'Luzon', 'Manila'),
  site('rmc', 'Rizal Medical Center', 'National Capital Region', 'NCR', 'Luzon', 'Pasig City'),
  site('pgh', 'Philippine General Hospital', 'National Capital Region', 'NCR', 'Luzon', 'Manila'),
  site('nkti', 'National Kidney and Transplant Institute', 'National Capital Region', 'NCR', 'Luzon', 'Quezon City'),
  site('pcmc', 'Philippine Children’s Medical Center', 'National Capital Region', 'NCR', 'Luzon', 'Quezon City'),
  site('nch', 'National Children’s Hospital', 'National Capital Region', 'NCR', 'Luzon', 'Quezon City'),
  site('lcp', 'Lung Center of the Philippines', 'National Capital Region', 'NCR', 'Luzon', 'Quezon City'),
  site('tmc', 'Tondo Medical Center', 'National Capital Region', 'NCR', 'Luzon', 'Manila'),
  site('cvmc', 'Cagayan Valley Medical Center', 'Cagayan Valley', 'II', 'Luzon', 'Tuguegarao City'),
  site('r2tmc', 'Region II Trauma and Medical Center', 'Cagayan Valley', 'II', 'Luzon', 'Bayombong'),
  site('rimc', 'Region I Medical Center', 'Ilocos Region', 'I', 'Luzon', 'Dagupan City'),
  site('mmmhmc', 'Mariano Marcos Memorial Hospital and Medical Center', 'Ilocos Region', 'I', 'Luzon', 'Batac City'),
  site('itrmc', 'Ilocos Training and Regional Medical Center', 'Ilocos Region', 'I', 'Luzon', 'San Fernando City'),
  site('jblmrc', 'Jose B. Lingad Memorial Regional Hospital', 'Central Luzon', 'III', 'Luzon', 'San Fernando City'),
  site('bghmc', 'Bataan General Hospital and Medical Center', 'Central Luzon', 'III', 'Luzon', 'Balanga City'),
  site('dpjg', 'Dr. Paulino J. Garcia Memorial Research and Medical Center', 'Central Luzon', 'III', 'Luzon', 'Cabanatuan City'),
  site('bghmc-car', 'Baguio General Hospital and Medical Center', 'Cordillera Administrative Region', 'CAR', 'Luzon', 'Baguio City'),
  site('batmc', 'Batangas Medical Center', 'CALABARZON', 'IV-A', 'Luzon', 'Batangas City'),
  site('omph', 'Oriental Mindoro Provincial Hospital', 'MIMAROPA', 'IV-B', 'Luzon', 'Calapan City'),
  site('brhmc', 'Bicol Regional Hospital and Medical Center', 'Bicol Region', 'V', 'Luzon', 'Legazpi City'),
  site('bmc', 'Bicol Medical Center', 'Bicol Region', 'V', 'Luzon', 'Naga City'),
  site('wvsmc', 'Western Visayas Medical Center', 'Western Visayas', 'VI', 'Visayas', 'Iloilo City'),
  site('asmgc', 'Angel Salazar Memorial General Hospital', 'Western Visayas', 'VI', 'Visayas', 'San Jose de Buenavista'),
  site('clmmrh', 'Corazon Locsin Montelibano Memorial Regional Hospital', 'Negros Island Region', 'NIR', 'Visayas', 'Bacolod City'),
  site('vsmmc', 'Vicente Sotto Memorial Medical Center', 'Central Visayas', 'VII', 'Visayas', 'Cebu City'),
  site('evmc', 'Eastern Visayas Medical Center', 'Eastern Visayas', 'VIII', 'Visayas', 'Tacloban City'),
  site('zcmc', 'Zamboanga City Medical Center', 'Zamboanga Peninsula', 'IX', 'Mindanao', 'Zamboanga City'),
  site('drmc', 'Davao Regional Medical Center', 'Davao Region', 'XI', 'Mindanao', 'Tagum City'),
  site('spmc', 'Southern Philippines Medical Center', 'Davao Region', 'XI', 'Mindanao', 'Davao City'),
  site('nmmc', 'Northern Mindanao Medical Center', 'Northern Mindanao', 'X', 'Mindanao', 'Cagayan de Oro City'),
  site('apmc', 'Amai Pakpak Medical Center', 'Northern Mindanao', 'X', 'Mindanao', 'Marawi City'),
  site('dopmp', 'Democrito O. Plaza Memorial Provincial Hospital', 'Caraga', 'XIII', 'Mindanao', 'Prosperidad'),
  site('crmc', 'Cotabato Regional and Medical Center', 'SOCCSKSARGEN', 'XII', 'Mindanao', 'Cotabato City'),
  site('cotansan', 'Cotabato Sanitarium and General Hospital', 'SOCCSKSARGEN', 'XII', 'Mindanao', 'Sultan Kudarat'),
];

export const CAF_REQUIRED_DOCUMENTS: CAFRequiredDocument[] = [
  { id: 'clinical_abstract', nameEn: 'Clinical abstract with cancer diagnosis and staging', nameTl: 'Clinical abstract na may diagnosis at stage ng cancer' },
  { id: 'histopathology_report', nameEn: 'Histopathology or biopsy report', nameTl: 'Histopathology o resulta ng biopsy' },
  { id: 'treatment_protocol', nameEn: 'Treatment protocol from the medical oncologist', nameTl: 'Treatment protocol mula sa medical oncologist' },
  { id: 'price_quotation', nameEn: 'Current diagnostic or medicine price quotation', nameTl: 'Kasalukuyang quotation para sa diagnostic test o gamot' },
  { id: 'barangay_indigency', nameEn: 'Barangay Certificate of Indigency, if required by the site', nameTl: 'Barangay Certificate of Indigency, kung hihingin ng site' },
  { id: 'valid_id', nameEn: 'Valid ID of the patient and representative, if applicable', nameTl: 'Valid ID ng pasyente at kinatawan, kung mayroon' },
];

const REGION_ALIASES: Array<{ code: string; aliases: string[] }> = [
  { code: 'NCR', aliases: ['NCR', 'National Capital Region', 'Metro Manila', 'Metropolitan Manila'] },
  { code: 'CAR', aliases: ['CAR', 'Cordillera', 'Cordillera Administrative Region'] },
  { code: 'I', aliases: ['Region I', 'Region 1', 'Ilocos', 'Ilocos Region'] },
  { code: 'II', aliases: ['Region II', 'Region 2', 'Cagayan Valley'] },
  { code: 'III', aliases: ['Region III', 'Region 3', 'Central Luzon'] },
  { code: 'IV-A', aliases: ['Region IV-A', 'Region IV A', 'Region 4A', 'Region 4-A', 'CALABARZON'] },
  { code: 'IV-B', aliases: ['Region IV-B', 'Region IV B', 'Region 4B', 'Region 4-B', 'MIMAROPA'] },
  { code: 'V', aliases: ['Region V', 'Region 5', 'Bicol', 'Bicol Region'] },
  { code: 'VI', aliases: ['Region VI', 'Region 6', 'Western Visayas'] },
  { code: 'NIR', aliases: ['NIR', 'Negros Island Region'] },
  { code: 'VII', aliases: ['Region VII', 'Region 7', 'Central Visayas'] },
  { code: 'VIII', aliases: ['Region VIII', 'Region 8', 'Eastern Visayas'] },
  { code: 'IX', aliases: ['Region IX', 'Region 9', 'Zamboanga Peninsula'] },
  { code: 'X', aliases: ['Region X', 'Region 10', 'Northern Mindanao'] },
  { code: 'XI', aliases: ['Region XI', 'Region 11', 'Davao', 'Davao Region'] },
  { code: 'XII', aliases: ['Region XII', 'Region 12', 'SOCCSKSARGEN', 'Soccsksargen Region'] },
  { code: 'XIII', aliases: ['Region XIII', 'Region 13', 'Caraga'] },
];

const PROVINCE_REGION_ALIASES: Record<string, string> = {
  'metro manila': 'NCR',
  'abra': 'CAR', 'apayao': 'CAR', 'benguet': 'CAR', 'ifugao': 'CAR', 'kalinga': 'CAR', 'mountain province': 'CAR',
  'ilocos norte': 'I', 'ilocos sur': 'I', 'la union': 'I', 'pangasinan': 'I',
  'batanes': 'II', 'cagayan': 'II', 'isabela': 'II', 'nueva vizcaya': 'II', 'quirino': 'II',
  'aurora': 'III', 'bataan': 'III', 'bulacan': 'III', 'nueva ecija': 'III', 'pampanga': 'III', 'tarlac': 'III', 'zambales': 'III',
  'batangas': 'IV-A', 'cavite': 'IV-A', 'laguna': 'IV-A', 'quezon': 'IV-A', 'rizal': 'IV-A',
  'marinduque': 'IV-B', 'occidental mindoro': 'IV-B', 'oriental mindoro': 'IV-B', 'palawan': 'IV-B', 'romblon': 'IV-B',
  'albay': 'V', 'camarines norte': 'V', 'camarines sur': 'V', 'catanduanes': 'V', 'masbate': 'V', 'sorsogon': 'V',
  'aklan': 'VI', 'antique': 'VI', 'capiz': 'VI', 'guimaras': 'VI', 'iloilo': 'VI',
  'negros occidental': 'NIR', 'negros oriental': 'NIR', 'siquijor': 'NIR',
  'bohol': 'VII', 'cebu': 'VII',
  'biliran': 'VIII', 'eastern samar': 'VIII', 'leyte': 'VIII', 'northern samar': 'VIII', 'samar': 'VIII', 'southern leyte': 'VIII',
  'zamboanga del norte': 'IX', 'zamboanga del sur': 'IX', 'zamboanga sibugay': 'IX',
  'bukidnon': 'X', 'camiguin': 'X', 'lanao del norte': 'X', 'misamis occidental': 'X', 'misamis oriental': 'X',
  'davao de oro': 'XI', 'davao del norte': 'XI', 'davao del sur': 'XI', 'davao occidental': 'XI', 'davao oriental': 'XI',
  'cotabato': 'XII', 'sarangani': 'XII', 'south cotabato': 'XII', 'sultan kudarat': 'XII',
  'agusan del norte': 'XIII', 'agusan del sur': 'XIII', 'dinagat islands': 'XIII', 'surigao del norte': 'XIII', 'surigao del sur': 'XIII',
};

function normalizeLocation(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function resolveRegionCode(regionOrProvince?: string): string | undefined {
  if (!regionOrProvince) return undefined;
  const normalized = normalizeLocation(regionOrProvince);
  const directRegion = REGION_ALIASES.find(({ aliases }) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeLocation(alias);
      return normalized === normalizedAlias || normalized.startsWith(`${normalizedAlias} `);
    })
  );
  if (directRegion) return directRegion.code;
  return PROVINCE_REGION_ALIASES[normalized];
}

export function getCancerAssistanceFundSitesByRegion(
  region?: string,
  province?: string
): CAFAccessSite[] {
  const regionCode = resolveRegionCode(region) || resolveRegionCode(province);
  if (!regionCode) return [];
  return DOH_CAF_ACCESS_SITES.filter((accessSite) => accessSite.regionCode === regionCode);
}

export function getCancerAssistanceFundSitesForLocation(
  location: { region?: string; province?: string }
): CAFAccessSite[] {
  return getCancerAssistanceFundSitesByRegion(location.region, location.province);
}
