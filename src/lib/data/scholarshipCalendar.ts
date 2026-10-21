export type ScholarshipWindowStatus = 'open_now' | 'upcoming' | 'enrollment_cycle' | 'year_round';
export type ScholarshipCalendarMode = 'annual' | 'year_round' | 'enrollment_cycle';

export interface ScholarshipCalendarEntry {
  id: string;
  name: string;
  typicalMonths: number[];
  mode: ScholarshipCalendarMode;
  portalUrl: string;
  guidance: string;
}

// Months are planning hints from recent agency calls. They are not confirmation that an application is open.
export const scholarshipCalendar: ScholarshipCalendarEntry[] = [
  {
    id: 'dost-sei',
    name: 'DOST-SEI Undergraduate Scholarship',
    typicalMonths: [8, 9],
    mode: 'annual',
    portalUrl: 'https://ugs.science-scholarships.ph/pages/home.html',
    guidance: 'Recent calls opened around August to September. Check the current DOST-SEI announcement for exact dates and eligible schools.',
  },
  {
    id: 'ched-cmsp',
    name: 'CHED Merit Scholarship Program (CMSP)',
    typicalMonths: [6, 7],
    mode: 'annual',
    portalUrl: 'https://legacy.ched.gov.ph/merit-scholarship/',
    guidance: 'CHED Regional Offices set their own call dates and application channels.',
  },
  {
    id: 'peac-shs-voucher',
    name: 'PEAC Senior High School Voucher',
    typicalMonths: [4, 5, 6, 7, 8],
    mode: 'annual',
    portalUrl: 'https://ovap.peac.org.ph/',
    guidance: 'Dates have shifted from April through August in recent years. Some applicant categories apply through a participating school instead of OVAP.',
  },
  {
    id: 'pca-coscho',
    name: 'PCA Coconut Farmers and their Families Scholarship (CoScho)',
    typicalMonths: [7, 8],
    mode: 'annual',
    portalUrl: 'https://legacy.ched.gov.ph/coscho/',
    guidance: 'CHED Regional Offices publish region-specific calls and application links.',
  },
  {
    id: 'owwa-edsp-odsp',
    name: 'OWWA EDSP / ODSP',
    typicalMonths: [],
    mode: 'year_round',
    portalUrl: 'https://scholarship.owwa.gov.ph/',
    guidance: 'OWWA sets the application period by call. No fixed nationwide opening month was verified.',
  },
  {
    id: 'dswd-tara-basa',
    name: 'DSWD Tara, Basa! Tutoring Program',
    typicalMonths: [4, 5, 6],
    mode: 'year_round',
    portalUrl: 'https://tbtp.dswd.gov.ph/',
    guidance: 'This is a regional, partner-school program, not a nationwide scholarship. Recruitment and schedules vary by DSWD Field Office and university.',
  },
  {
    id: 'unifast-fhe',
    name: 'UniFAST Free Higher Education (FHE)',
    typicalMonths: [],
    mode: 'enrollment_cycle',
    portalUrl: 'https://unifast.gov.ph/fhe.html',
    guidance: 'Eligible students at participating SUCs and CHED-recognized LUCs are assessed through enrollment; there is no separate annual application window.',
  },
];

export function getScholarshipStatus(entry: ScholarshipCalendarEntry, now: Date = new Date()): ScholarshipWindowStatus {
  if (entry.mode === 'enrollment_cycle') return 'enrollment_cycle';
  if (entry.mode === 'year_round') return 'year_round';
  return entry.typicalMonths.includes(now.getMonth() + 1) ? 'open_now' : 'upcoming';
}
