import type { EducationLevel, EducationSchoolType } from '../../types/education.ts';
import { getCity, getProvince } from './phLocations.ts';

/**
 * Curated nationwide institution lookup, checked 20 October 2026.
 * Recognition and program availability can change. Confirm them with CHED or TESDA.
 * References: https://heida.ched.gov.ph/hei-directory
 * https://www.pasuc.org.ph/ | https://tesda.gov.ph/Directory/TTI
 */
export type PhilippineSchoolKind = 'SUC' | 'LUC' | 'Private' | 'Public / TVET';

export interface PhilippineSchool {
  name: string;
  aliases: string[];
  kind: PhilippineSchoolKind;
  schoolType: EducationSchoolType;
  province: string;
  cityMunicipality: string;
  region: string;
  levels: EducationLevel[];
}

type SchoolRow = [name: string, province: string, city: string, aliases?: string[], levels?: EducationLevel[]];

const sucs: SchoolRow[] = [
  ['Eulogio Amang Rodriguez Institute of Science and Technology', 'Metro Manila', 'Manila', ['EARIST']],
  ['Marikina Polytechnic College', 'Metro Manila', 'Marikina City', ['MPC']],
  ['Philippine Normal University', 'Metro Manila', 'Manila', ['PNU']],
  ['Philippine State College of Aeronautics', 'Metro Manila', 'Pasay City', ['PhilSCA', 'Philippine State College of Aeronautics (PhilSCA)']],
  ['Polytechnic University of the Philippines', 'Metro Manila', 'Manila', ['PUP']],
  ['Rizal Technological University', 'Metro Manila', 'Mandaluyong City', ['RTU']],
  ['Technological University of the Philippines', 'Metro Manila', 'Manila', ['TUP']],
  ['University of the Philippines Diliman', 'Metro Manila', 'Quezon City', ['UP', 'UPD', 'University of the Philippines System']],
  ['Don Mariano Marcos Memorial State University', 'La Union', 'Bacnotan', ['DMMMSU', 'Mariano Marcos Memorial State University']],
  ['Ilocos Sur Polytechnic State College', 'Ilocos Sur', 'Candon City', ['ISPSC', 'North Luzon Philippines State College']],
  ['Mariano Marcos State University', 'Ilocos Norte', 'Batac City', ['MMSU']],
  ['Pangasinan State University', 'Pangasinan', 'Lingayen', ['PSU']],
  ['University of Northern Philippines', 'Ilocos Sur', 'Vigan City', ['UNP']],
  ['Abra State Institute of Sciences and Technology', 'Abra', 'Bangued', ['ASIST', 'Abra State University']],
  ['Apayao State College', 'Apayao', 'Conner', ['ASC']],
  ['Benguet State University', 'Benguet', 'La Trinidad', ['BSU']],
  ['Ifugao State University', 'Ifugao', 'Lamut', ['IFSU']],
  ['Kalinga State University', 'Kalinga', 'Tabuk City', ['KSU']],
  ['Mountain Province State University', 'Mountain Province', 'Bontoc', ['MPSU', 'Mountain Province State Polytechnic College']],
  ['Batanes State College', 'Batanes', 'Basco', ['BSC']],
  ['Cagayan State University', 'Cagayan', 'Tuguegarao City', ['CSU']],
  ['Isabela State University', 'Isabela', 'Echague', ['ISU']],
  ['Nueva Vizcaya State University', 'Nueva Vizcaya', 'Bayombong', ['NVSU']],
  ['Quirino State University', 'Quirino', 'Diffun', ['QSU']],
  ['Aurora State College of Technology', 'Aurora', 'Baler', ['ASCOT']],
  ['Bataan Peninsula State University', 'Bataan', 'Balanga City', ['BPSU']],
  ['Bulacan Agricultural State College', 'Bulacan', 'San Ildefonso', ['BASC']],
  ['Bulacan State University', 'Bulacan', 'Malolos City', ['BulSU', 'Bulacan State University (BulSU)']],
  ['Central Luzon State University', 'Nueva Ecija', 'Science City of Muñoz', ['CLSU']],
  ['Nueva Ecija University of Science and Technology', 'Nueva Ecija', 'Cabanatuan City', ['NEUST']],
  ['Pampanga State Agricultural University', 'Pampanga', 'Magalang', ['PSAU']],
  ['President Ramon Magsaysay State University', 'Zambales', 'Iba', ['PRMSU', 'Ramon Magsaysay Technological University']],
  ['Tarlac Agricultural University', 'Tarlac', 'Camiling', ['TAU', 'Tarlac College of Agriculture']],
  ['Tarlac State University', 'Tarlac', 'Tarlac City', ['TSU']],
  ['Batangas State University', 'Batangas', 'Batangas City', ['BatStateU', 'BatSU', 'Batangas State University (BatStateU)']],
  ['Cavite State University', 'Cavite', 'Indang', ['CvSU', 'CVSU', 'Cavite State University (CvSU)']],
  ['Laguna State Polytechnic University', 'Laguna', 'Santa Cruz', ['LSPU']],
  ['Southern Luzon State University', 'Quezon', 'Lucban', ['SLSU']],
  ['University of Rizal System', 'Rizal', 'Morong', ['URS']],
  ['Marinduque State University', 'Marinduque', 'Boac', ['MarSU', 'Marinduque State College']],
  ['Mindoro State University', 'Oriental Mindoro', 'Calapan City', ['MinSU', 'Mindoro State College of Agriculture and Technology']],
  ['Occidental Mindoro State College', 'Occidental Mindoro', 'San Jose', ['OMSC']],
  ['Palawan State University', 'Palawan', 'Puerto Princesa City', ['PalSU', 'PSU Palawan']],
  ['Romblon State University', 'Romblon', 'Odiongan', ['RSU']],
  ['Western Philippines University', 'Palawan', 'Aborlan', ['WPU']],
  ['Bicol University', 'Albay', 'Legazpi City', ['BU']],
  ['Camarines Norte State College', 'Camarines Norte', 'Daet', ['CNSC']],
  ['Camarines Sur Polytechnic Colleges', 'Camarines Sur', 'Nabua', ['CSPC']],
  ['Central Bicol State University of Agriculture', 'Camarines Sur', 'Pili', ['CBSUA']],
  ['Catanduanes State University', 'Catanduanes', 'Virac', ['CatSU']],
  ['Dr. Emilio B. Espinosa Sr. Memorial State College of Agriculture and Technology', 'Masbate', 'Mandaon', ['DEBESMSCAT']],
  ['Partido State University', 'Camarines Sur', 'Goa', ['PSU Goa']],
  ['Sorsogon State University', 'Sorsogon', 'Sorsogon City', ['SorSU', 'Sorsogon State College']],
  ['Aklan State University', 'Aklan', 'Banga', ['ASU']],
  ['Capiz State University', 'Capiz', 'Roxas City', ['CAPSU']],
  ['Carlos Hilado Memorial State University', 'Negros Occidental', 'Talisay City', ['CHMSU', 'Carlos Hilado Memorial State College']],
  ['Central Philippines State University', 'Negros Occidental', 'Kabankalan City', ['CPSU']],
  ['Guimaras State University', 'Guimaras', 'Buenavista', ['GSU']],
  ['Iloilo Science and Technology University', 'Iloilo', 'Iloilo City', ['ISAT U', 'ISATU']],
  ['Iloilo State University of Fisheries Science and Technology', 'Iloilo', 'Barotac Nuevo', ['ISUFST', 'Iloilo State College of Fisheries']],
  ['Northern Iloilo State University', 'Iloilo', 'Estancia', ['NISU', 'Northern Iloilo Polytechnic State College']],
  ['University of Antique', 'Antique', 'Sibalom', ['UA']],
  ['West Visayas State University', 'Iloilo', 'Iloilo City', ['WVSU']],
  ['State University of Northern Negros', 'Negros Occidental', 'Sagay City', ['SUNN', 'Northern Negros State College of Science and Technology']],
  ['Bohol Island State University', 'Bohol', 'Tagbilaran City', ['BISU']],
  ['Cebu Normal University', 'Cebu', 'Cebu City', ['CNU']],
  ['Cebu Technological University', 'Cebu', 'Cebu City', ['CTU']],
  ['Negros Oriental State University', 'Negros Oriental', 'Dumaguete City', ['NORSU']],
  ['Siquijor State College', 'Siquijor', 'Larena', ['SSC']],
  ['Biliran Province State University', 'Biliran', 'Naval', ['BiPSU', 'Naval State University']],
  ['Eastern Samar State University', 'Eastern Samar', 'Borongan City', ['ESSU']],
  ['Eastern Visayas State University', 'Leyte', 'Tacloban City', ['EVSU']],
  ['Leyte Normal University', 'Leyte', 'Tacloban City', ['LNU']],
  ['Northwest Samar State University', 'Samar', 'Calbayog City', ['NwSSU']],
  ['Samar State University', 'Samar', 'Catbalogan City', ['SSU']],
  ['Southern Leyte State University', 'Southern Leyte', 'Sogod', ['SLSU']],
  ['University of Eastern Philippines', 'Northern Samar', 'Catarman', ['UEP']],
  ['Visayas State University', 'Leyte', 'Baybay City', ['VSU']],
  ['Palompon Institute of Technology', 'Leyte', 'Palompon', ['PIT']],
  ['Basilan State College', 'Basilan', 'Isabela City', ['BSC']],
  ['J.H. Cerilles State College', 'Zamboanga del Sur', 'Tigbao', ['JHCSC']],
  ['Jose Rizal Memorial State University', 'Zamboanga del Norte', 'Dapitan City', ['JRMSU']],
  ['Sulu State College', 'Sulu', 'Jolo', ['SSC Sulu']],
  ['Western Mindanao State University', 'Zamboanga del Sur', 'Zamboanga City', ['WMSU']],
  ['Zamboanga City State Polytechnic College', 'Zamboanga del Sur', 'Zamboanga City', ['ZCSPC']],
  ['Zamboanga State College of Marine Sciences and Technology', 'Zamboanga del Sur', 'Zamboanga City', ['ZSCMST']],
  ['Bukidnon State University', 'Bukidnon', 'Malaybalay City', ['BukSU']],
  ['Camiguin Polytechnic State College', 'Camiguin', 'Mambajao', ['CPSC']],
  ['Central Mindanao University', 'Bukidnon', 'Maramag', ['CMU', 'Musuan']],
  ['Misamis Oriental State College of Agriculture and Technology', 'Misamis Oriental', 'Claveria', ['MOSCAT']],
  ['Northwestern Mindanao State College of Science and Technology', 'Misamis Occidental', 'Tangub City', ['NMSCST']],
  ['University of Science and Technology of Southern Philippines', 'Misamis Oriental', 'Cagayan de Oro City', ['USTP']],
  ['Davao del Norte State College', 'Davao del Norte', 'Panabo City', ['DNSC']],
  ['Davao de Oro State College', 'Davao de Oro', 'Nabunturan', ['DDOSC', 'Davao de Oro State University']],
  ['Davao del Sur State College', 'Davao del Sur', 'Digos City', ['DSSC']],
  ['Davao Oriental State University', 'Davao Oriental', 'Mati City', ['DOrSU', 'Davao Oriental State College of Science and Technology']],
  ['Southern Philippines Agri-Business and Marine and Aquatic School of Technology', 'Davao del Sur', 'Digos City', ['SPAMAST']],
  ['University of Southeastern Philippines', 'Davao del Sur', 'Davao City', ['USeP', 'USEP']],
  ['Cotabato State University', 'Maguindanao del Norte', 'Cotabato City', ['CotSU', 'Cotabato City State Polytechnic College']],
  ['South Cotabato State College', 'South Cotabato', 'Surallah', ['SCSC']],
  ['Sultan Kudarat State University', 'Sultan Kudarat', 'Tacurong City', ['SKSU']],
  ['University of Southern Mindanao', 'Cotabato', 'Kabacan', ['USM']],
  ['Agusan del Sur State University', 'Agusan del Sur', 'Prosperidad', ['ASSU', 'Agusan del Sur State College of Agriculture and Technology']],
  ['Caraga State University', 'Agusan del Norte', 'Butuan City', ['CSU Caraga']],
  ['Dinagat Islands State University', 'Dinagat Islands', 'San Jose', ['DINSU']],
  ['Surigao del Norte State University', 'Surigao del Norte', 'Surigao City', ['SNSU', 'Surigao State College of Technology']],
  ['Surigao del Sur State University', 'Surigao del Sur', 'Tandag City', ['SDSSU']],
  ['Adiong Memorial State College', 'Lanao del Sur', 'Ditsaan-Ramain', ['AMSC']],
  ['Maguindanao State University', 'Maguindanao del Norte', 'Datu Odin Sinsuat', ['MSU Maguindanao', 'Maguindanao State University (MSU)']],
  ['Mindanao State University', 'Lanao del Sur', 'Marawi City', ['MSU', 'MSU Main']],
  ['Mindanao State University Tawi-Tawi College of Technology and Oceanography', 'Tawi-Tawi', 'Bongao', ['MSU-TCTO', 'MSU Tawi-Tawi']],
  ['Tawi-Tawi Regional Agricultural College', 'Tawi-Tawi', 'Bongao', ['TRAC']],
  ['University of Sulu', 'Sulu', 'Jolo', ['USulu']],
];

const lucs: SchoolRow[] = [
  ['Pamantasan ng Lungsod ng Maynila', 'Metro Manila', 'Manila', ['PLM', 'Pamantasan ng Lungsod ng Maynila (PLM)']],
  ['Quezon City University', 'Metro Manila', 'Quezon City', ['QCU', 'Quezon City Polytechnic University']],
  ['Pamantasan ng Lungsod ng Marikina', 'Metro Manila', 'Marikina City', ['PLMar', 'PLM Marikina']],
  ['Taguig City University', 'Metro Manila', 'Taguig City', ['TCU']],
  ['Pamantasan ng Lungsod ng Muntinlupa', 'Metro Manila', 'Muntinlupa City', ['PLMun']],
  ['Valenzuela City Polytechnic College', 'Metro Manila', 'Valenzuela City', ['VCPC']],
  ['Urdaneta City University', 'Pangasinan', 'Urdaneta City', ['UCU']],
  ['University of Eastern Pangasinan', 'Pangasinan', 'Binalonan', ['UEP Pangasinan']],
  ['City College of Angeles', 'Pampanga', 'Angeles City', ['CCA']],
  ['City College of San Fernando, Pampanga', 'Pampanga', 'San Fernando City', ['CCSFP']],
  ['Baliuag Polytechnic College', 'Bulacan', 'Baliwag City', ['BPC']],
  ['Bulacan Polytechnic College', 'Bulacan', 'Malolos City', ['BPC Bulacan']],
  ['City College of Calamba', 'Laguna', 'Calamba City', ['CCC']],
  ['Laguna University', 'Laguna', 'Santa Cruz', ['LU']],
  ['Pamantasan ng Cabuyao', 'Laguna', 'Cabuyao City', ['PNC', 'University of Cabuyao']],
  ['Dalubhasaan ng Lungsod ng San Pablo', 'Laguna', 'San Pablo City', ['DLSP']],
  ['Trece Martires City College', 'Cavite', 'Trece Martires City', ['TMCC']],
  ['City College of Naga', 'Camarines Sur', 'Naga City', ['CCN']],
  ['Iloilo City Community College', 'Iloilo', 'Iloilo City', ['ICCC']],
  ['Zamboanga del Sur Provincial Government College', 'Zamboanga del Sur', 'Aurora', ['ZdSPGC']],
  ['Kapalong College of Agriculture, Sciences and Technology', 'Davao del Norte', 'Kapalong', ['KCAST']],
  ['Pamantasan ng Lungsod ng Pasig', 'Metro Manila', 'Pasig City', ['PLP']],
];

const privateHeis: SchoolRow[] = [
  ['University of Santo Tomas', 'Metro Manila', 'Manila', ['UST', 'UST Manila'], ['jhs', 'shs', 'college', 'medicine']],
  ['De La Salle University', 'Metro Manila', 'Manila', ['DLSU', 'La Salle Manila'], ['jhs', 'shs', 'college', 'medicine']],
  ['Ateneo de Manila University', 'Metro Manila', 'Quezon City', ['ADMU', 'Ateneo', 'Ateneo de Manila'], ['jhs', 'shs', 'college', 'medicine']],
  ['Far Eastern University', 'Metro Manila', 'Manila', ['FEU'], ['jhs', 'shs', 'college']],
  ['University of the East', 'Metro Manila', 'Manila', ['UE', 'UE Manila'], ['jhs', 'shs', 'college', 'medicine']],
  ['Mapúa University', 'Metro Manila', 'Manila', ['Mapua', 'MIT', 'Mapúa Institute of Technology'], ['shs', 'college']],
  ['Centro Escolar University', 'Metro Manila', 'Manila', ['CEU'], ['jhs', 'shs', 'college', 'medicine']],
  ['Saint Louis University', 'Benguet', 'Baguio City', ['SLU Baguio', 'SLU'], ['jhs', 'shs', 'college', 'medicine']],
  ['University of San Carlos', 'Cebu', 'Cebu City', ['USC'], ['jhs', 'shs', 'college', 'medicine']],
  ['San Beda University', 'Metro Manila', 'Manila', ['SBU', 'San Beda'], ['jhs', 'shs', 'college', 'medicine']],
  ['Adamson University', 'Metro Manila', 'Manila', ['AdU'], ['jhs', 'shs', 'college']],
  ['National University', 'Metro Manila', 'Manila', ['NU'], ['shs', 'college']],
  ['De La Salle-College of Saint Benilde', 'Metro Manila', 'Manila', ['DLS-CSB', 'Benilde'], ['college']],
  ['Ateneo de Davao University', 'Davao del Sur', 'Davao City', ['AdDU', 'Ateneo Davao'], ['jhs', 'shs', 'college', 'medicine']],
  ['Xavier University - Ateneo de Cagayan', 'Misamis Oriental', 'Cagayan de Oro City', ['XU', 'Ateneo de Cagayan'], ['jhs', 'shs', 'college', 'medicine']],
  ['Silliman University', 'Negros Oriental', 'Dumaguete City', ['SU Dumaguete'], ['jhs', 'shs', 'college', 'medicine']],
  ['Ateneo de Zamboanga University', 'Zamboanga del Sur', 'Zamboanga City', ['ADZU', 'Ateneo Zamboanga'], ['jhs', 'shs', 'college', 'medicine']],
  ['University of Perpetual Help System DALTA', 'Metro Manila', 'Las Piñas City', ['UPHSD', 'Perpetual Help'], ['jhs', 'shs', 'college', 'medicine']],
  ['Angeles University Foundation', 'Pampanga', 'Angeles City', ['AUF'], ['jhs', 'shs', 'college', 'medicine']],
  ['Lyceum of the Philippines University', 'Metro Manila', 'Manila', ['LPU', 'LPU Manila'], ['shs', 'college']],
  ['Manila Central University', 'Metro Manila', 'Caloocan City', ['MCU'], ['jhs', 'shs', 'college', 'medicine']],
  ['Trinity University of Asia', 'Metro Manila', 'Quezon City', ['TUA', 'Trinity University of Asia (TUA)'], ['jhs', 'shs', 'college', 'medicine']],
  ['University of the Cordilleras', 'Benguet', 'Baguio City', ['UC Baguio', 'UC'], ['jhs', 'shs', 'college']],
  ['University of Baguio', 'Benguet', 'Baguio City', ['UB']],
  ["Saint Mary's University", 'Nueva Vizcaya', 'Bayombong', ['SMU']],
  ['Lorma Colleges', 'La Union', 'San Fernando City', ['Lorma']],
  ['University of San Jose-Recoletos', 'Cebu', 'Cebu City', ['USJ-R', 'USJR'], ['jhs', 'shs', 'college', 'medicine']],
  ['University of Mindanao', 'Davao del Sur', 'Davao City', ['UM Davao'], ['jhs', 'shs', 'college', 'medicine']],
  ['University of the Immaculate Conception', 'Davao del Sur', 'Davao City', ['UIC Davao'], ['jhs', 'shs', 'college', 'medicine']],
  ['University of the Assumption', 'Pampanga', 'City of San Fernando', ['UA Pampanga'], ['jhs', 'shs', 'college']],
  ['University of the Visayas', 'Cebu', 'Cebu City', ['UV']],
  ['West Negros University', 'Negros Occidental', 'Bacolod City', ['WNU'], ['jhs', 'shs', 'college']],
  ['University of St. La Salle', 'Negros Occidental', 'Bacolod City', ['USLS', 'La Salle Bacolod'], ['jhs', 'shs', 'college', 'medicine']],
  ['Notre Dame of Dadiangas University', 'South Cotabato', 'General Santos City', ['NDDU']],
  ['Notre Dame of Marbel University', 'South Cotabato', 'Koronadal City', ['NDMU']],
];

const tesdaTtis: SchoolRow[] = [
  ["TESDA Women's Center", 'Metro Manila', 'Taguig City', ['TWC', 'TESDA Women Center']],
  ['TESDA Regional Training Center - NCR', 'Metro Manila', 'Taguig City', ['RTC NCR', 'RTC-NCR']],
  ['Regional Training Center - Guiguinto Bulacan', 'Bulacan', 'Guiguinto', ['RTC Guiguinto', 'TESDA RTC Bulacan']],
  ['Regional Training Center - La Union', 'La Union', 'San Fernando City', ['RTC La Union', 'TESDA RTC Region I']],
  ['Regional Training Center - Tuguegarao', 'Cagayan', 'Tuguegarao City', ['RTC Tuguegarao', 'TESDA RTC Region II']],
  ['Regional Training Center - Mariveles', 'Bataan', 'Mariveles', ['RTC Mariveles', 'TESDA RTC Region III']],
  ['Regional Training Center - CALABARZON', 'Batangas', 'Batangas City', ['RTC CALABARZON', 'RTC Batangas']],
  ['Cordillera State Institute of Technical Education', 'Benguet', 'Baguio City', ['CSITE', 'TESDA CSITE']],
  ['Regional Training Center - Pili', 'Camarines Sur', 'Pili', ['RTC Pili', 'TESDA RTC Region V']],
  ['Regional Training Center - Iloilo', 'Iloilo', 'Iloilo City', ['RTC Iloilo', 'TESDA RTC Region VI']],
  ['Regional Training Center - Cebu', 'Cebu', 'Cebu City', ['RTC Cebu', 'TESDA RTC Region VII']],
  ['Regional Training Center - Tacloban', 'Leyte', 'Tacloban City', ['RTC Tacloban', 'TESDA RTC Region VIII']],
  ['Regional Training Center - Iligan', 'Lanao del Norte', 'Iligan City', ['RTC Iligan', 'TESDA RTC Region X']],
  ['Regional Training Center - Zamboanga City', 'Zamboanga del Sur', 'Zamboanga City', ['RTC Zamboanga', 'TESDA RTC Region IX']],
  ['Regional Training Center - Davao City / KorPhil', 'Davao del Sur', 'Davao City', ['RTC Davao', 'KorPhil Davao', 'Korea-Philippines Vocational Training Center']],
  ['Regional Training Center - Tagoloan', 'Misamis Oriental', 'Tagoloan', ['RTC Tagoloan', 'TESDA RTC Region X']],
  ['Regional Training Center - Talisay', 'Negros Occidental', 'Talisay City', ['RTC Talisay', 'TESDA RTC NIR']],
  ['Regional Training Center - Butuan', 'Agusan del Norte', 'Butuan City', ['RTC Butuan', 'TESDA RTC Caraga']],
  ['Regional Manpower Development Center', 'Maguindanao del Norte', 'Datu Odin Sinsuat', ['RMDC', 'TESDA RMDC BARMM']],
  ['Cotabato City Manpower Development Center', 'Maguindanao del Norte', 'Cotabato City', ['CCMDC', 'TESDA CCMDC']],
  ['Provincial Training Center - Agusan del Norte', 'Agusan del Norte', 'Cabadbaran City', ['PTC Agusan del Norte', 'TESDA PTC ADN']],
  ['TESDA Training Center Taguig Campus Enterprise', 'Metro Manila', 'Taguig City', ['TTCTCE', 'TESDA Taguig Campus Enterprise']],
];

function makeSchool(kind: PhilippineSchoolKind, [name, provinceName, cityName, aliases = [], levels]: SchoolRow): PhilippineSchool {
  const province = getProvince(provinceName);
  const city = getCity(province?.name ?? provinceName, cityName);
  const schoolType: EducationSchoolType = kind === 'SUC' || kind === 'LUC' ? 'suc_luc' : kind === 'Private' ? 'private' : 'public';
  const defaultLevels: EducationLevel[] = kind === 'Public / TVET' ? ['tvet'] : kind === 'SUC' || kind === 'LUC' ? ['college', 'medicine'] : ['shs', 'college'];
  return {
    name,
    aliases: [...new Set(aliases)],
    kind,
    schoolType,
    province: province?.name ?? provinceName,
    cityMunicipality: city?.name ?? cityName,
    region: province?.region ?? '',
    levels: levels ?? defaultLevels,
  };
}

export const PHILIPPINE_SCHOOLS: PhilippineSchool[] = [
  ...sucs.map(row => makeSchool('SUC', row)),
  ...lucs.map(row => makeSchool('LUC', row)),
  ...privateHeis.map(row => makeSchool('Private', row)),
  ...tesdaTtis.map(row => makeSchool('Public / TVET', row)),
];

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Search institution names, aliases, acronyms, cities, and provinces. */
export function searchSchools(query: string, level?: EducationLevel, limit = 8): PhilippineSchool[] {
  const normalizedQuery = normalizeSearch(query);
  const resultLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 8;
  if (!normalizedQuery || !resultLimit) return [];

  return PHILIPPINE_SCHOOLS
    .filter(school => !level || school.levels.includes(level))
    .map(school => {
      const name = normalizeSearch(school.name);
      const aliases = school.aliases.map(normalizeSearch);
      const location = normalizeSearch(`${school.cityMunicipality} ${school.province} ${school.region}`);
      const searchable = `${name} ${aliases.join(' ')} ${location}`;
      const matches = searchable.includes(normalizedQuery) || normalizedQuery.split(' ').every(part => searchable.includes(part));
      const rank = name === normalizedQuery ? 0
        : aliases.includes(normalizedQuery) ? 1
        : name.startsWith(normalizedQuery) ? 2
        : aliases.some(alias => alias.startsWith(normalizedQuery)) ? 3
        : location.includes(normalizedQuery) ? 4
        : 5;
      return { school, matches, rank };
    })
    .filter(result => result.matches)
    .sort((left, right) => left.rank - right.rank || left.school.name.localeCompare(right.school.name))
    .slice(0, resultLimit)
    .map(result => result.school);
}
