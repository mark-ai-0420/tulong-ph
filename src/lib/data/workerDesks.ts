export const workerDeskRegions = [
  { id: 'NCR', label: 'National Capital Region (NCR)' },
  { id: 'CAR', label: 'Cordillera Administrative Region (CAR)' },
  { id: 'Region I', label: 'Region I (Ilocos Region)' },
  { id: 'Region II', label: 'Region II (Cagayan Valley)' },
  { id: 'Region III', label: 'Region III (Central Luzon)' },
  { id: 'Region IV-A', label: 'Region IV-A (CALABARZON)' },
  { id: 'Region IV-B', label: 'Region IV-B (MIMAROPA)' },
  { id: 'Region V', label: 'Region V (Bicol Region)' },
  { id: 'Region VI', label: 'Region VI (Western Visayas)' },
  { id: 'NIR', label: 'Negros Island Region (NIR)' },
  { id: 'Region VII', label: 'Region VII (Central Visayas)' },
  { id: 'Region VIII', label: 'Region VIII (Eastern Visayas)' },
  { id: 'Region IX', label: 'Region IX (Zamboanga Peninsula)' },
  { id: 'Region X', label: 'Region X (Northern Mindanao)' },
  { id: 'Region XI', label: 'Region XI (Davao Region)' },
  { id: 'Region XII', label: 'Region XII (SOCCSKSARGEN)' },
  { id: 'Region XIII', label: 'Region XIII (CARAGA)' },
  { id: 'BARMM', label: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)' },
] as const;

export type WorkerDeskRegion = (typeof workerDeskRegions)[number]['id'];
export type WorkerDeskAgency = 'DOLE' | 'NLRC' | 'OWWA' | 'ECC' | 'DMW' | 'SSS' | 'Pag-IBIG' | 'GSIS';

export interface WorkerDesk {
  id: string;
  name: string;
  agency: WorkerDeskAgency;
  region: WorkerDeskRegion;
  cityMunicipality: string;
  address: string;
  hotline: string;
  services: string;
  url: string;
  email?: string;
  servesRegions?: readonly WorkerDeskRegion[];
}

export interface WorkerDeskFilters {
  agency?: WorkerDeskAgency | 'all';
  agencies?: readonly WorkerDeskAgency[];
  region?: string;
  query?: string;
}

const urls = {
  dole: 'https://dole.gov.ph/key-contact/',
  nlrc: 'https://nlrc.dole.gov.ph/site/contact-us',
  owwa: 'https://owwa.gov.ph/key-officials-regional-welfare-offices/',
  ecc: 'https://ecc.gov.ph/directory/',
  dmw: 'https://dmw.gov.ph/contact-us',
  sss: 'https://member.sss.gov.ph/member/sss/branchloc',
  pagibig: 'https://www.pagibigfund.gov.ph/branches.html',
  gsis: 'https://www.gsis.gov.ph/contact-us/',
} as const;

const allWorkerDeskRegions = workerDeskRegions.map(({ id }) => id);

function desk(
  agency: WorkerDeskAgency,
  id: string,
  name: string,
  region: WorkerDeskRegion,
  cityMunicipality: string,
  address: string,
  hotline: string,
  services: string,
  url: string,
  email?: string,
  servesRegions?: readonly WorkerDeskRegion[],
): WorkerDesk {
  return {
    id, name, agency, region, cityMunicipality, address, hotline, services, url,
    ...(email ? { email } : {}),
    ...(servesRegions ? { servesRegions } : {}),
  };
}

export const workerDesks: WorkerDesk[] = [
  desk('DOLE', 'dole-ncr', 'DOLE Regional Office and SEnA Desk, NCR', 'NCR', 'Manila', 'DOLE-NCR Building, 967 Maligaya Street, Malate, Manila', '(02) 8400-6242 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ncr@dole.gov.ph'),
  desk('DOLE', 'dole-car', 'DOLE Regional Office and SEnA Desk, CAR', 'CAR', 'Baguio City', 'DOLE-CAR New Building, Cabinet Hill, Baguio City', '(074) 443-5339 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'car@dole.gov.ph'),
  desk('DOLE', 'dole-r1', 'DOLE Regional Office and SEnA Desk, Region I', 'Region I', 'San Fernando City', 'RSRK Building, Diversion Road, Barangay Biday, San Fernando City, La Union', '(072) 607-9981 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro1@dole.gov.ph'),
  desk('DOLE', 'dole-r2', 'DOLE Regional Office and SEnA Desk, Region II', 'Region II', 'Tuguegarao City', 'Regional Government Center, Carig Sur, Tuguegarao City, Cagayan', '(078) 304-5085 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro2@dole.gov.ph'),
  desk('DOLE', 'dole-r3', 'DOLE Regional Office and SEnA Desk, Region III', 'Region III', 'San Fernando City', 'Diosdado Macapagal Regional Government Center, Barangay Maimpis, San Fernando City, Pampanga', '(045) 455-1613 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro3@dole.gov.ph'),
  desk('DOLE', 'dole-r4a', 'DOLE Regional Office and SEnA Desk, Region IV-A', 'Region IV-A', 'Calamba City', '3rd and 4th Floors, Andenson Building II, Parian, Calamba City, Laguna', '(049) 545-7360 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro4a@dole.gov.ph'),
  desk('DOLE', 'dole-r4b', 'DOLE Regional Office and SEnA Desk, Region IV-B', 'Region IV-B', 'Calapan City', '3rd Floor, Confil Building, Roxas Drive corner Sampaguita Street, Lumangbayan, Calapan City, Oriental Mindoro', '(043) 288-6078 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro4b@dole.gov.ph'),
  desk('DOLE', 'dole-r5', 'DOLE Regional Office and SEnA Desk, Region V', 'Region V', 'Legazpi City', 'Doña Aurora Street, Old Albay, Legazpi City', '(052) 480-3058 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro5@dole.gov.ph'),
  desk('DOLE', 'dole-r6', 'DOLE Regional Office and SEnA Desk, Region VI', 'Region VI', 'Iloilo City', 'Kuang Da Building, De La Rama Street, Barangay Zamora-Melliza, Iloilo City', '(033) 320-6904 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro6@dole.gov.ph'),
  desk('DOLE', 'dole-nir', 'DOLE Regional Office and SEnA Desk, NIR', 'NIR', 'Dumaguete City', 'Ouano Complex, Government Center, Bajumpandan, Dumaguete City, Negros Oriental 6200', '(032) 402-1879 / 1349', 'Interim NIR office, SEnA referrals, wage concerns, TUPAD and livelihood', urls.dole, 'nir@dole.gov.ph'),
  desk('DOLE', 'dole-r7', 'DOLE Regional Office and SEnA Desk, Region VII', 'Region VII', 'Cebu City', '3rd and 4th Floors, DOLE-RO 7 Building, General Maxilom Avenue corner Gorordo Avenue, Cebu City', '(032) 266-2792 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro7@dole.gov.ph'),
  desk('DOLE', 'dole-r8', 'DOLE Regional Office and SEnA Desk, Region VIII', 'Region VIII', 'Tacloban City', 'DOLE Compound, Trece Martires Street, Tacloban City', '(053) 832-0697 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro8@dole.gov.ph'),
  desk('DOLE', 'dole-r9', 'DOLE Regional Office and SEnA Desk, Region IX', 'Region IX', 'Zamboanga City', 'Cortez Building, Evangelista Street, Santa Catalina, Zamboanga City', '(062) 955-0214 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro9@dole.gov.ph'),
  desk('DOLE', 'dole-r10', 'DOLE Regional Office and SEnA Desk, Region X', 'Region X', 'Cagayan de Oro City', 'Trinidad Building, Corrales-Yacapin Street, Cagayan de Oro City', '(088) 858-1658 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro10@dole.gov.ph'),
  desk('DOLE', 'dole-r11', 'DOLE Regional Office and SEnA Desk, Region XI', 'Region XI', 'Davao City', 'Barangay 74-A, Quimpo Boulevard, Matina Crossing, Davao City', '(082) 227-4289 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro11@dole.gov.ph'),
  desk('DOLE', 'dole-r12', 'DOLE Regional Office and SEnA Desk, Region XII', 'Region XII', 'Koronadal City', '102 Acepal Building, Mabini Extension, Koronadal City', '(083) 520-0125 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'ro12@dole.gov.ph'),
  desk('DOLE', 'dole-r13', 'DOLE Regional Office and SEnA Desk, Region XIII', 'Region XIII', 'Butuan City', 'Nimfa Tiu Building, J.P. Rosales Avenue, Butuan City', '(085) 225-3229 / 1349', 'SEnA referrals, wage concerns, TUPAD, livelihood and labor standards', urls.dole, 'caraga@dole.gov.ph'),
  desk('DOLE', 'dole-barmm', 'Ministry of Labor and Employment (MOLE - BARMM)', 'BARMM', 'Cotabato City', 'Regional Government Center, Cotabato City 9600', '(064) 421-3347', 'Labor concerns, employment programs and regional worker assistance', 'https://mole.bangsamoro.gov.ph/', 'mole.barmm@bangsamoro.gov.ph'),

  desk('NLRC', 'nlrc-ncr', 'NLRC NCR Regional Arbitration Branches', 'NCR', 'Quezon City', 'Use the official contact directory to select the NCR branch for the workplace.', '(02) 8781-7870', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-car', 'NLRC CAR Regional Arbitration Branch', 'CAR', 'Baguio City', '3rd Floor, Easter Weaving, 2 Easter Road, Baguio City, Benguet', '(074) 445-8380', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc, 'car@nlrc.dole.gov.ph'),
  desk('NLRC', 'nlrc-r1', 'NLRC Regional Arbitration Branch I', 'Region I', 'San Fernando City', '2nd Floor, GSMA Building, Governor Ortega and General Luna Streets, San Fernando City, La Union', '(072) 607-8362', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r2', 'NLRC Regional Arbitration Branch II', 'Region II', 'Tuguegarao City', 'No. 19 Dalan na Pappabalo, Regional Government Center, Carig Sur, Tuguegarao City, Cagayan', '(078) 377-3379', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r3', 'NLRC Regional Arbitration Branch III', 'Region III', 'San Fernando City', 'Primus Medicus Distributors Corporate Center, MacArthur Highway, San Isidro, San Fernando City, Pampanga', '0998-530-8431', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r4', 'NLRC Regional Arbitration Branch IV', 'Region IV-A', 'Calamba City', '3rd Floor, Hectan Penthouse, Chipeco Avenue, Barangay Halang, Calamba City, Laguna', '0962-668-9811', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc, undefined, ['Region IV-B']),
  desk('NLRC', 'nlrc-r4b-palawan', 'NLRC RAB IV Satellite Office, Palawan', 'Region IV-B', 'Puerto Princesa City', 'DOLE Palawan, Puerto Princesa Government Center, South National Highway corner Rafols Road, Barangay Santa Monica, Puerto Princesa City', 'See the official directory', 'Labor arbitration and workplace dispute referrals for Palawan', urls.nlrc),
  desk('NLRC', 'nlrc-r5', 'NLRC Regional Arbitration Branch V', 'Region V', 'Legazpi City', '3rd Floor, Tyler Building, Rizal Street, Legazpi City', '(052) 742-4874', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r6', 'NLRC Regional Arbitration Branch VI', 'Region VI', 'Iloilo City', '2nd Floor, S.C. Divinagracia Building, Quezon-Delgado Streets, Iloilo City', '(033) 500-4794', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-nir', 'NLRC Negros Island Regional Arbitration Branch', 'NIR', 'Bacolod City', 'Level 2, East Two Corporate Center, Circumferential corner Diola Street, Villamonte, Bacolod City', '(034) 707-1380', 'NIR labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc, 'nirab@nlrc.dole.gov.ph'),
  desk('NLRC', 'nlrc-r7', 'NLRC Regional Arbitration Branch VII', 'Region VII', 'Cebu City', 'See the official contact directory for the current Cebu branch address.', 'See the official directory', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r8', 'NLRC Regional Arbitration Branch VIII', 'Region VIII', 'Tacloban City', 'See the official contact directory for the current Tacloban branch address.', 'See the official directory', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r9', 'NLRC Regional Arbitration Branch IX', 'Region IX', 'Zamboanga City', 'See the official contact directory for the current Zamboanga branch address.', 'See the official directory', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r10', 'NLRC Regional Arbitration Branch X', 'Region X', 'Cagayan de Oro City', 'See the official contact directory for the current Cagayan de Oro branch address.', 'See the official directory', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r11', 'NLRC Regional Arbitration Branch XI', 'Region XI', 'Davao City', '4th Floor, C55 Realty Corporate Building, Matina Aplaya, Davao City', '(082) 238-6100', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-r12', 'NLRC Regional Arbitration Branch XII', 'Region XII', 'Koronadal City', 'Room 200, JYC Building, Arellano and Aldeguer Streets, Zone 3, Koronadal City', '(083) 823-4542', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),
  desk('NLRC', 'nlrc-barmm', 'NLRC RAB XII / Sub-RAB Cotabato City', 'BARMM', 'Cotabato City', 'Regional Government Center, Cotabato City 9600', 'See the official NLRC directory', 'Labor arbitration, illegal dismissal, wage and employment dispute referrals for BARMM', urls.nlrc),
  desk('NLRC', 'nlrc-r13', 'NLRC Regional Arbitration Branch XIII', 'Region XIII', 'Butuan City', '2nd Floor, Veterans Bank Building, J.C. Aquino Avenue, Butuan City', '(085) 816-0118', 'Labor arbitration, illegal dismissal, wage and employment disputes', urls.nlrc),

  desk('OWWA', 'owwa-ncr', 'OWWA Regional Welfare Office NCR', 'NCR', 'Pasay City', 'No. 139 Senator Gil J. Puyat Avenue, Pasay City', '1348', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'ncr@owwa.gov.ph'),
  desk('OWWA', 'owwa-car', 'OWWA Regional Welfare Office CAR', 'CAR', 'Baguio City', '2nd Floor, Gestdan Centrum Building, 80 Bokawkan Road corner Upper P. Burgos, Baguio City', '1348', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'car@owwa.gov.ph'),
  desk('OWWA', 'owwa-r1', 'OWWA Regional Welfare Office I', 'Region I', 'San Fernando City', '2nd Floor, Kenny Plaza, Quezon Avenue, San Fernando City, La Union', '(072) 888-4584 / 1348', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region1@owwa.gov.ph'),
  desk('OWWA', 'owwa-r2', 'OWWA Regional Welfare Office II', 'Region II', 'Tuguegarao City', 'No. 13 Dalan na Pavvulurun, Regional Government Center, Carig Sur, Tuguegarao City', '(078) 396-0200 / (078) 396-0127', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region2@owwa.gov.ph'),
  desk('OWWA', 'owwa-r3', 'OWWA Regional Welfare Office III', 'Region III', 'San Fernando City', 'Matulungin Street corner Mahusay Street, Diosdado Macapagal Government Center, Barangay Maimpis, San Fernando City, Pampanga', '0917-837-6493 / 1348', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region3@owwa.gov.ph'),
  desk('OWWA', 'owwa-r4a', 'OWWA Regional Welfare Office IV-A', 'Region IV-A', 'Calamba City', 'Parian Commerce Center II, National Highway, Barangay Parian, Calamba City, Laguna 4027', '0951-244-1378 / 0967-229-0477', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region4a@owwa.gov.ph'),
  desk('OWWA', 'owwa-r4b', 'OWWA Regional Welfare Office IV-B', 'Region IV-B', 'Manila', 'Unit 8-C, 8th Floor, Marc 2000 Tower, 1973 Taft Avenue corner San Andres Street, Malate, Manila', '0961-457-3685', 'MIMAROPA welfare assistance; use official listing for province satellite desks', urls.owwa, 'region4b@owwa.gov.ph'),
  desk('OWWA', 'owwa-r5', 'OWWA Regional Welfare Office V', 'Region V', 'Legazpi City', '4th Floor, Ayala Malls, Barangay 36, Capantawan, Legazpi City, Albay', '0906-164-2854', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region5@owwa.gov.ph'),
  desk('OWWA', 'owwa-r6', 'OWWA Regional Welfare Office VI', 'Region VI', 'Iloilo City', '2nd Floor, Angeles Arcade, Mabini Street, City Proper, Iloilo City', '0919-575-2060 / 0917-832-7307', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region6@owwa.gov.ph'),
  desk('OWWA', 'owwa-nir', 'OWWA RWO VI Bacolod Satellite Office', 'NIR', 'Bacolod City', 'Check the official directory for the current satellite office address.', '0919-575-2060', 'OWWA satellite office listed under RWO VI', urls.owwa),
  desk('OWWA', 'owwa-nir-negor', 'OWWA RWO VII Negros Oriental Satellite Desk', 'NIR', 'City not stated in directory', 'Check the official directory for the current Negros Oriental satellite desk location.', '0981-056-7217', 'OWWA satellite desk listed under RWO VII for Negros Oriental', urls.owwa),
  desk('OWWA', 'owwa-r7', 'OWWA Regional Welfare Office VII', 'Region VII', 'Cebu City', 'Lower Ground Floor, Machay Building, Camputhaw, Gorordo Avenue, Cebu City 6000', '(032) 231-5291', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region7@owwa.gov.ph'),
  desk('OWWA', 'owwa-r8', 'OWWA Regional Welfare Office VIII', 'Region VIII', 'Tacloban City', 'DOLE Compound, Trece Martires Street, Tacloban City 6500', '0917-118-6404', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region8@owwa.gov.ph'),
  desk('OWWA', 'owwa-r9', 'OWWA Regional Welfare Office IX', 'Region IX', 'Zamboanga City', '3rd Floor, Goodwill Center, Mayor Jaldon Street, Canelar, Zamboanga City', '(062) 991-2785', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region9@owwa.gov.ph'),
  desk('OWWA', 'owwa-r10', 'OWWA Regional Welfare Office X', 'Region X', 'Cagayan de Oro City', '2nd Floor, Trinidad Building, Cagayan de Oro City', '0917-548-0033', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region10@owwa.gov.ph'),
  desk('OWWA', 'owwa-r11', 'OWWA Regional Welfare Office XI', 'Region XI', 'Davao City', 'LynJun Alegre-Sardido BESJC Building, Candelaria Street, Ecoland, Bucana, Davao City', '0963-538-5149', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region11@owwa.gov.ph'),
  desk('OWWA', 'owwa-r12', 'OWWA Regional Welfare Office XII', 'Region XII', 'Koronadal City', 'Prime Regional Government Center, Carpenter Hill, Koronadal City, South Cotabato', '0917-572-1303', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'region12@owwa.gov.ph'),
  desk('OWWA', 'owwa-barmm', 'OWWA Regional Welfare Office BARMM', 'BARMM', 'Cotabato City', '2nd Floor, Mags Audio Accessories Building, 039 Quezon Avenue, Cotabato City 9600', '0917-622-0140', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'barmm@owwa.gov.ph'),
  desk('OWWA', 'owwa-r13', 'OWWA Regional Welfare Office CARAGA', 'Region XIII', 'Butuan City', 'Nimfa Tiu Building II, J.P. Rosales Avenue, Butuan City 8600', '(085) 815-1894', 'OFW welfare assistance, repatriation, reintegration and education services', urls.owwa, 'caraga@owwa.gov.ph'),

  desk('ECC', 'ecc-head-office', 'Employees Compensation Commission Head Office', 'NCR', 'Makati City', 'ECC Building, 355 Senator Gil J. Puyat Avenue, Makati City', '(02) 8899-4251', 'Employees compensation claims, appeals, rehabilitation and KaGabay referrals', 'https://ecc.gov.ph/contact-us/', 'info@ecc.gov.ph'),
  desk('ECC', 'ecc-car', 'ECC Regional Extension Unit CAR', 'CAR', 'Baguio City', 'DOLE-CAR, Cabinet Hill, Baguio City', '(074) 619-0275', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'car@ecc.gov.ph'),
  desk('ECC', 'ecc-r1', 'ECC Regional Extension Unit I', 'Region I', 'San Fernando City', '2nd Floor, Kenny Plaza, Quezon Avenue, San Fernando City, La Union', '(072) 607-0045', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu1@ecc.gov.ph'),
  desk('ECC', 'ecc-r2', 'ECC Regional Extension Unit II', 'Region II', 'Tuguegarao City', '2nd Floor, Malebren Building, Enrile Avenue, Carig Sur, Tuguegarao City, Cagayan', '0926-559-0451', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu2@ecc.gov.ph'),
  desk('ECC', 'ecc-r3', 'ECC Regional Extension Unit III', 'Region III', 'San Fernando City', '2nd Floor, Pinmara Square, MacArthur Highway, Barangay Sindalan, San Fernando City, Pampanga', '(045) 407-6240', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu3@ecc.gov.ph'),
  desk('ECC', 'ecc-r4a', 'ECC Regional Extension Unit IV-A', 'Region IV-A', 'Calamba City', 'Milan Prestige Building, Unit A, Ground Floor, Barangay Halang, Calamba City, Laguna', '(049) 521-7518', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu4a@ecc.gov.ph'),
  desk('ECC', 'ecc-r4b', 'ECC Regional Extension Unit IV-B', 'Region IV-B', 'Calapan City', '2nd Floor, Confil Building, Sampaguita Street, Barangay Lumangbayan, Calapan City, Oriental Mindoro', '0999-569-4627', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu4a@ecc.gov.ph'),
  desk('ECC', 'ecc-r5', 'ECC Regional Extension Unit V', 'Region V', 'Legazpi City', 'Unit 4, CQ Building, 3 Rosal Street, Imperial Court Phase 2, Barangay 24 Rizal, Legazpi City, Albay', '(052) 742-1350', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu5@ecc.gov.ph'),
  desk('ECC', 'ecc-r6', 'ECC Regional Extension Unit VI', 'Region VI', 'Iloilo City', '4th Floor, 7J Corporate Center, corner Jalandoni-Ledesma Street, Iloilo City', '(033) 330-0910', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu6@ecc.gov.ph'),
  desk('ECC', 'ecc-nir-bacolod', 'ECC REU VI Extension Desk, Bacolod City', 'NIR', 'Bacolod City', 'Check the official ECC directory for the current service location.', 'See ECC REU VI directory for current contact details', 'EC claims, appeals, rehabilitation and KaGabay referrals for Negros Occidental', urls.ecc, 'reu6@ecc.gov.ph'),
  desk('ECC', 'ecc-nir-dumaguete', 'ECC REU VI Extension Desk, Dumaguete City', 'NIR', 'Dumaguete City', 'Check the official ECC directory for the current service location.', 'See ECC REU VI directory for current contact details', 'EC claims, appeals, rehabilitation and KaGabay referrals for Negros Oriental', urls.ecc, 'reu6@ecc.gov.ph'),
  desk('ECC', 'ecc-r7', 'ECC Regional Extension Unit VII', 'Region VII', 'Cebu City', 'Room 154, Ground Floor, Leocadia Arcade, General Maxilom Avenue, Cebu City', '(032) 266-7230', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu7@ecc.gov.ph'),
  desk('ECC', 'ecc-r8', 'ECC Regional Extension Unit VIII', 'Region VIII', 'Tacloban City', 'DOLE Compound, Trece Martires Street, Tacloban City', '0920-826-6627', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu8@ecc.gov.ph'),
  desk('ECC', 'ecc-r9', 'ECC Regional Extension Unit IX', 'Region IX', 'Zamboanga City', '2nd Floor, Room 203, Cortez Building, Dr. Evangelista Street, Barangay Santa Catalina, Zamboanga City', '(062) 955-1549', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu9@ecc.gov.ph'),
  desk('ECC', 'ecc-r10', 'ECC Regional Extension Unit X', 'Region X', 'Cagayan de Oro City', 'Ground Floor, Trinidad Building, Corrales-Yacapin Street, Cagayan de Oro City', '(088) 231-2041', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu10@ecc.gov.ph'),
  desk('ECC', 'ecc-r11', 'ECC Regional Extension Unit XI', 'Region XI', 'Davao City', 'Doors 216-217, 2nd Floor, Pink Walters Building, Quimpo Boulevard, Davao City', '(082) 233-6036', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu11@ecc.gov.ph'),
  desk('ECC', 'ecc-r12', 'ECC Regional Extension Unit XII', 'Region XII', 'General Santos City', 'Doors A14 and A15, ECA Building, National Highway, General Santos City', '(083) 823-2334', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu12@ecc.gov.ph'),
  desk('ECC', 'ecc-barmm', 'ECC REU XII / BARMM Extension Desk at MOLE Bangsamoro', 'BARMM', 'Cotabato City', 'Ministry of Labor and Employment Bangsamoro, Regional Government Center, Cotabato City 9600', 'See the official ECC directory for current contact details', 'EC claims, appeals, rehabilitation and KaGabay referrals in BARMM', urls.ecc, 'reu12@ecc.gov.ph'),
  desk('ECC', 'ecc-r13', 'ECC Regional Extension Unit XIII', 'Region XIII', 'Butuan City', 'Cebu CFI Cooperative Building, Ground Floor, New Road, Barangay Limaha, corner Ochoa Avenue, Butuan City', '(085) 815-0468', 'EC claims, appeals, rehabilitation and KaGabay referrals', urls.ecc, 'reu13@ecc.gov.ph'),

  desk('DMW', 'dmw-ncr', 'DMW Regional Office NCR', 'NCR', 'Mandaluyong City', 'BFO Building, Ortigas Avenue corner EDSA, Mandaluyong City 1550', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'ncr@dmw.gov.ph'),
  desk('DMW', 'dmw-car', 'DMW Regional Office CAR', 'CAR', 'Baguio City', 'Ground Floor, Gestdan Centrum, 80 Bokawkan Road corner Upper P. Burgos, Baguio City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'baguio@dmw.gov.ph'),
  desk('DMW', 'dmw-r1', 'DMW Regional Office I', 'Region I', 'San Fernando City', '2nd Floor, Kenny Plaza, Quezon Avenue, San Fernando City, La Union', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'launion@dmw.gov.ph'),
  desk('DMW', 'dmw-r2', 'DMW Regional Office II', 'Region II', 'Tuguegarao City', 'Methodist Church Compound, Bonifacio Street, Tuguegarao City, Cagayan', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),
  desk('DMW', 'dmw-r3', 'DMW Regional Office III', 'Region III', 'San Fernando City', '215 MacArthur Highway, Dolores, San Fernando City, Pampanga', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'pampanga@dmw.gov.ph'),
  desk('DMW', 'dmw-r4a', 'DMW Regional Office IV-A', 'Region IV-A', 'Calamba City', 'Basement, Andenson Building II, Barangay Parian, Calamba City, Laguna', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),
  desk('DMW', 'dmw-r4b', 'DMW Regional Office IV-B', 'Region IV-B', 'Puerto Princesa City', 'MJ Building, Burgos Street, Barangay Princesa, Puerto Princesa City, Palawan', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'region4b@dmw.gov.ph'),
  desk('DMW', 'dmw-r5', 'DMW Regional Office V', 'Region V', 'Legazpi City', '3rd Floor, E. Chan Building, Alternate Road, Legazpi City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'legaspi@dmw.gov.ph'),
  desk('DMW', 'dmw-r6', 'DMW Regional Office VI', 'Region VI', 'Iloilo City', '2nd Floor, Plazuela Dos, Senator Benigno S. Aquino Avenue, Barangay San Rafael, Mandurriao, Iloilo City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'iloilo@dmw.gov.ph', ['NIR']),
  desk('DMW', 'dmw-r7', 'DMW Regional Office VII', 'Region VII', 'Cebu City', 'Ground Floor, DOLE Building, General Maxilom Avenue corner Gorordo Avenue, Cebu City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'cebu@dmw.gov.ph'),
  desk('DMW', 'dmw-r8', 'DMW Regional Office VIII', 'Region VIII', 'Tacloban City', 'DOLE Compound, Trece Martires Street, Tacloban City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),
  desk('DMW', 'dmw-r9', 'DMW Regional Office IX', 'Region IX', 'Zamboanga City', '3rd Floor, Goodwill Center, Mayor Jaldon Street, Canelar, Zamboanga City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),
  desk('DMW', 'dmw-r10', 'DMW Regional Office X', 'Region X', 'Cagayan de Oro City', '2nd Floor, Trinidad Building, Cagayan de Oro City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),
  desk('DMW', 'dmw-r11', 'DMW Regional Office XI', 'Region XI', 'Davao City', '2nd Floor, AMQ Building, Lakandula Street corner Dacudao Avenue, Agdao, Davao City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),
  desk('DMW', 'dmw-r12', 'DMW Regional Satellite Office XII serving BARMM', 'Region XII', 'Koronadal City', '2nd Floor, SANLE Building, corner Benigno Aquino and Lapu-Lapu Streets, Zone III, Koronadal City', '(083) 520-9991', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw, 'koronadal@dmw.gov.ph', ['BARMM']),
  desk('DMW', 'dmw-r13', 'DMW Regional Office XIII', 'Region XIII', 'Butuan City', 'Nimfa Tiu Building, J.P. Rosales Avenue, Butuan City', '1348', 'OFW welfare, contract verification, reintegration and overseas assistance', urls.dmw),

  desk('SSS', 'sss-national', 'Social Security System (SSS) Main Office', 'NCR', 'Quezon City', 'SSS Building, East Avenue, Diliman, Quezon City', '1455', 'SSS benefits, contributions and branch appointment support', urls.sss, undefined, allWorkerDeskRegions),
  desk('Pag-IBIG', 'pagibig-national', 'Pag-IBIG Fund Contact Center', 'NCR', 'Mandaluyong City', 'Use the official branch directory to locate the nearest Pag-IBIG office.', '(02) 8724-4244', 'Membership, savings, housing and short-term loan services', urls.pagibig, undefined, allWorkerDeskRegions),
  desk('GSIS', 'gsis-national', 'GSIS Contact Center', 'NCR', 'Pasay City', 'GSIS Financial Center, Pasay City. Use the official contact page for branch details.', '(02) 8847-4747', 'Government employee benefits, loans, claims and branch referrals', urls.gsis, undefined, allWorkerDeskRegions),
];

const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

export function normalizeWorkerDeskRegion(value: string | undefined): WorkerDeskRegion | undefined {
  if (!value) return undefined;
  const key = normalized(value).replace(/[^a-z0-9]+/g, '');
  const exact = workerDeskRegions.find(({ id, label }) => {
    const normalizedId = normalized(id).replace(/[^a-z0-9]+/g, '');
    const normalizedLabel = normalized(label).replace(/[^a-z0-9]+/g, '');
    return key === normalizedId || key === normalizedLabel;
  });
  if (exact) return exact.id;
  if (key === 'mimaroparegion') return 'Region IV-B';
  return workerDeskRegions.find(({ label }) => {
    const normalizedLabel = normalized(label).replace(/[^a-z0-9]+/g, '');
    return key.length >= 4 && normalizedLabel.includes(key);
  })?.id;
}

export function filterWorkerDesks({ agency = 'all', agencies, region, query = '' }: WorkerDeskFilters = {}): WorkerDesk[] {
  const selectedRegion = region && normalized(region) !== 'all' ? normalizeWorkerDeskRegion(region) : undefined;
  if (region && normalized(region) !== 'all' && !selectedRegion) return [];
  const search = normalized(query);

  return workerDesks.filter((item) => {
    const agencyMatches = (agency === 'all' || item.agency === agency) && (!agencies || agencies.includes(item.agency));
    const regionMatches = !selectedRegion || item.region === selectedRegion || item.servesRegions?.includes(selectedRegion);
    const textMatches = !search || normalized([
      item.name, item.agency, item.region, item.cityMunicipality, item.address, item.hotline, item.services, item.email ?? '',
    ].join(' ')).includes(search);
    return agencyMatches && regionMatches && textMatches;
  });
}

export function getWorkerDesksByRegion(region: string): WorkerDesk[] {
  return filterWorkerDesks({ region });
}
