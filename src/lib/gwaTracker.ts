import type { Language } from './i18n';

export type GradingScale = 'percentage' | 'one_to_five' | 'four_point';
export type DisbursementStatus = 'pending' | 'partial' | 'disbursed';
export type RetentionStatus = 'retained' | 'warning' | 'at_risk';
export type ScholarshipProgramId =
  | 'ched-cmsp-full'
  | 'ched-cmsp-half'
  | 'dost-sei'
  | 'pca-coscho'
  | 'ched-tes'
  | 'lgu-iskolar'
  | 'custom';

export interface AcademicTermRecord {
  id: string;
  academicYear: string;
  semester: '1st' | '2nd' | 'summer' | 'midyear';
  rawGWA: number;
  gradingScale: GradingScale;
  normalizedPercentage: number;
  unitsEnrolled: number;
  unitsPassed: number;
  hasFailingGrade: boolean;
  programId: ScholarshipProgramId;
  programName?: string;
  expectedStipend: number;
  receivedStipend: number;
  disbursementStatus: DisbursementStatus;
  dateDisbursed?: string;
  notes?: string;
}

export interface GWATrackerRecord {
  records: AcademicTermRecord[];
  updatedAt: string;
}

const gradeRanges: Record<GradingScale, [number, number]> = {
  percentage: [0, 100],
  one_to_five: [1, 5],
  four_point: [0, 4],
};

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeGWAToPercentage(rawGWA: number, scale: GradingScale): number {
  const range = gradeRanges[scale];
  if (!range || !Number.isFinite(rawGWA) || rawGWA < range[0] || rawGWA > range[1]) {
    throw new RangeError('Grade is outside the selected grading scale.');
  }

  if (scale === 'percentage') return roundPercentage(rawGWA);
  if (scale === 'one_to_five') {
    if (rawGWA <= 2) return roundPercentage(100 - (rawGWA - 1) * 15);
    if (rawGWA <= 3) return roundPercentage(85 - (rawGWA - 2) * 10);
    return roundPercentage(75 - (rawGWA - 3) * 37.5);
  }
  if (rawGWA <= 2) return roundPercentage(rawGWA * 39);
  return roundPercentage(78 + (rawGWA - 2) * 11);
}

const retentionRules: Record<ScholarshipProgramId, { threshold: number; noFailingGrades: boolean }> = {
  'ched-cmsp-full': { threshold: 85, noFailingGrades: false },
  'ched-cmsp-half': { threshold: 80, noFailingGrades: false },
  'dost-sei': { threshold: 85, noFailingGrades: true },
  'pca-coscho': { threshold: 80, noFailingGrades: true },
  'ched-tes': { threshold: 80, noFailingGrades: false },
  'lgu-iskolar': { threshold: 80, noFailingGrades: false },
  custom: { threshold: 80, noFailingGrades: false },
};

const programLabels: Record<ScholarshipProgramId, Record<Language, string>> = {
  'ched-cmsp-full': { taglish: 'CHED CMSP Full', cebuano: 'CHED CMSP Full', ilocano: 'CHED CMSP Full', en: 'CHED CMSP Full' },
  'ched-cmsp-half': { taglish: 'CHED CMSP Half', cebuano: 'CHED CMSP Half', ilocano: 'CHED CMSP Half', en: 'CHED CMSP Half' },
  'dost-sei': { taglish: 'DOST-SEI', cebuano: 'DOST-SEI', ilocano: 'DOST-SEI', en: 'DOST-SEI' },
  'pca-coscho': { taglish: 'PCA CoScho', cebuano: 'PCA CoScho', ilocano: 'PCA CoScho', en: 'PCA CoScho' },
  'ched-tes': { taglish: 'CHED TES', cebuano: 'CHED TES', ilocano: 'CHED TES', en: 'CHED TES' },
  'lgu-iskolar': { taglish: 'LGU Iskolar', cebuano: 'LGU Iskolar', ilocano: 'LGU Iskolar', en: 'LGU Iskolar' },
  custom: { taglish: 'custom program', cebuano: 'custom nga programa', ilocano: 'na-custom a programa', en: 'custom program' },
};

function retentionExplanation(
  status: RetentionStatus,
  record: AcademicTermRecord,
  thresholdPercentage: number,
  requiresNoFailingGrades: boolean,
): Record<Language, string> {
  const result = record.normalizedPercentage.toFixed(1);
  const threshold = thresholdPercentage.toFixed(0);
  const program = Object.fromEntries((['taglish', 'cebuano', 'ilocano', 'en'] as const).map(language => [
    language,
    record.programName?.trim() || programLabels[record.programId]?.[language] || programLabels.custom[language],
  ])) as Record<Language, string>;

  if (requiresNoFailingGrades && record.hasFailingGrade) {
    return {
      taglish: `${program.taglish}: may failing grade na naitala. Ayon sa tracker rule, kailangan ng zero failing grades at ${threshold}% na GWA. Kumpirmahin ang kondisyon sa award notice.`,
      cebuano: `${program.cebuano}: adunay failing grade nga natala. Sumala sa tracker, kinahanglan walay failing grade ug ${threshold}% nga GWA. Kumpirmaha ang kondisyon sa award notice.`,
      ilocano: `${program.ilocano}: adda naisurat a bagsak a grado. Segun iti tracker, masapul ti awan ti bagsak a grado ken ${threshold}% a GWA. Pasingkedan iti award notice.`,
      en: `${program.en}: a failing grade is recorded. This tracker rule requires no failing grades and a ${threshold}% GWA. Confirm the condition in the award notice.`,
    };
  }

  if (status === 'retained') {
    return {
      taglish: `${program.taglish}: ${result}% ang normalized GWA, at ${threshold}% ang tracker cutoff. Pasok sa cutoff na ito; kumpirmahin pa rin sa award notice.`,
      cebuano: `${program.cebuano}: ${result}% ang normalized GWA, ug ${threshold}% ang tracker cutoff. Nakaabot sa cutoff; kumpirmaha gihapon sa award notice.`,
      ilocano: `${program.ilocano}: ${result}% ti normalized GWA, ken ${threshold}% ti tracker cutoff. Natungpal daytoy a cutoff; pasingkedan pay iti award notice.`,
      en: `${program.en}: the normalized GWA is ${result}% and this tracker cutoff is ${threshold}%. This cutoff is met; confirm it in the award notice.`,
    };
  }

  if (status === 'warning') {
    return {
      taglish: `${program.taglish}: ${result}% ang normalized GWA, ${threshold}% ang cutoff. Nasa loob ito ng 2 percentage point warning range. Kumpirmahin ang kondisyon sa award notice.`,
      cebuano: `${program.cebuano}: ${result}% ang normalized GWA, ${threshold}% ang cutoff. Sulod kini sa 2 percentage point nga warning range. Kumpirmaha ang kondisyon sa award notice.`,
      ilocano: `${program.ilocano}: ${result}% ti normalized GWA, ${threshold}% ti cutoff. Adda daytoy iti uneg ti 2 percentage point a warning range. Pasingkedan iti award notice.`,
      en: `${program.en}: the normalized GWA is ${result}% and the cutoff is ${threshold}%. This is within the 2 percentage point warning range. Confirm the condition in the award notice.`,
    };
  }

  return {
    taglish: `${program.taglish}: ${result}% ang normalized GWA, ${threshold}% ang cutoff. Nasa ibaba ito ng warning range. Kumpirmahin ang kondisyon sa award notice.`,
    cebuano: `${program.cebuano}: ${result}% ang normalized GWA, ${threshold}% ang cutoff. Ubos kini sa warning range. Kumpirmaha ang kondisyon sa award notice.`,
    ilocano: `${program.ilocano}: ${result}% ti normalized GWA, ${threshold}% ti cutoff. Nababa daytoy iti warning range. Pasingkedan iti award notice.`,
    en: `${program.en}: the normalized GWA is ${result}% and the cutoff is ${threshold}%. This is below the warning range. Confirm the condition in the award notice.`,
  };
}

export function evaluateRetentionStatus(record: AcademicTermRecord): {
  status: RetentionStatus;
  thresholdPercentage: number;
  explanation: Record<Language, string>;
} {
  const rule = retentionRules[record.programId] ?? retentionRules.custom;
  const status: RetentionStatus = rule.noFailingGrades && record.hasFailingGrade
    ? 'at_risk'
    : record.normalizedPercentage >= rule.threshold
      ? 'retained'
      : record.normalizedPercentage >= rule.threshold - 2
        ? 'warning'
        : 'at_risk';

  return {
    status,
    thresholdPercentage: rule.threshold,
    explanation: retentionExplanation(status, record, rule.threshold, rule.noFailingGrades),
  };
}

export function calculateStipendSummary(records: AcademicTermRecord[]): {
  totalExpected: number;
  totalReceived: number;
  totalDeficit: number;
  pendingCount: number;
  disbursedCount: number;
  partialCount: number;
  cumulativeGWA: number;
} {
  const totalExpected = roundPercentage(records.reduce((sum, record) => sum + record.expectedStipend, 0));
  const totalReceived = roundPercentage(records.reduce((sum, record) => sum + record.receivedStipend, 0));
  const totalUnits = records.reduce((sum, record) => sum + record.unitsEnrolled, 0);
  const cumulativeGWA = records.length === 0 ? 0 : roundPercentage(
    records.reduce((sum, record) => sum + record.normalizedPercentage * (totalUnits ? record.unitsEnrolled : 1), 0)
      / (totalUnits || records.length),
  );

  return {
    totalExpected,
    totalReceived,
    totalDeficit: roundPercentage(Math.max(0, totalExpected - totalReceived)),
    pendingCount: records.filter(record => record.disbursementStatus === 'pending').length,
    disbursedCount: records.filter(record => record.disbursementStatus === 'disbursed').length,
    partialCount: records.filter(record => record.disbursementStatus === 'partial').length,
    cumulativeGWA,
  };
}

export function formatGradeDisplay(rawGWA: number, scale: GradingScale): string {
  normalizeGWAToPercentage(rawGWA, scale);
  if (scale === 'percentage') return `${rawGWA.toFixed(1)}%`;
  if (scale === 'one_to_five') return `${rawGWA.toFixed(2)} / 5.00`;
  return `${rawGWA.toFixed(2)} / 4.00`;
}

const allowedRecordKeys = new Set([
  'id', 'academicYear', 'semester', 'rawGWA', 'gradingScale', 'normalizedPercentage',
  'unitsEnrolled', 'unitsPassed', 'hasFailingGrade', 'programId', 'programName',
  'expectedStipend', 'receivedStipend', 'disbursementStatus', 'dateDisbursed', 'notes',
]);

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function getDisbursementStatus(expected: number, received: number): DisbursementStatus {
  if (received <= 0) return 'pending';
  if (expected <= 0 || received >= expected) return 'disbursed';
  return 'partial';
}

export function isGWATrackerRecord(value: unknown): value is GWATrackerRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => key !== 'records' && key !== 'updatedAt')
    || typeof record.updatedAt !== 'string' || !Number.isFinite(Date.parse(record.updatedAt))
    || !Array.isArray(record.records) || record.records.length > 1_000) return false;

  const ids = new Set<string>();
  return record.records.every((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return false;
    const term = entry as Record<string, unknown>;
    if (Object.keys(term).some(key => !allowedRecordKeys.has(key))
      || typeof term.id !== 'string' || term.id.length === 0 || term.id.length > 120 || ids.has(term.id)
      || typeof term.academicYear !== 'string' || term.academicYear.trim().length === 0 || term.academicYear.length > 40
      || !['1st', '2nd', 'summer', 'midyear'].includes(String(term.semester))
      || typeof term.gradingScale !== 'string' || !Object.hasOwn(gradeRanges, term.gradingScale)
      || typeof term.rawGWA !== 'number' || !Number.isFinite(term.rawGWA)
      || typeof term.normalizedPercentage !== 'number' || !Number.isFinite(term.normalizedPercentage)
      || typeof term.unitsEnrolled !== 'number' || !Number.isInteger(term.unitsEnrolled) || term.unitsEnrolled < 0 || term.unitsEnrolled > 500
      || typeof term.unitsPassed !== 'number' || !Number.isInteger(term.unitsPassed) || term.unitsPassed < 0 || term.unitsPassed > term.unitsEnrolled
      || typeof term.hasFailingGrade !== 'boolean'
      || !['ched-cmsp-full', 'ched-cmsp-half', 'dost-sei', 'pca-coscho', 'ched-tes', 'lgu-iskolar', 'custom'].includes(String(term.programId))
      || !(term.programName === undefined || (typeof term.programName === 'string' && term.programName.length <= 160))
      || typeof term.expectedStipend !== 'number' || !Number.isFinite(term.expectedStipend) || term.expectedStipend < 0 || term.expectedStipend > 1_000_000_000
      || typeof term.receivedStipend !== 'number' || !Number.isFinite(term.receivedStipend) || term.receivedStipend < 0 || term.receivedStipend > 1_000_000_000
      || !['pending', 'partial', 'disbursed'].includes(String(term.disbursementStatus))
      || !(term.dateDisbursed === undefined || isValidDate(term.dateDisbursed))
      || !(term.notes === undefined || (typeof term.notes === 'string' && term.notes.length <= 2_000))) return false;

    let normalized: number;
    try {
      normalized = normalizeGWAToPercentage(term.rawGWA, term.gradingScale as GradingScale);
    } catch {
      return false;
    }
    if (term.normalizedPercentage < 0 || term.normalizedPercentage > 100
      || Math.abs(term.normalizedPercentage - normalized) > 0.01
      || term.disbursementStatus !== getDisbursementStatus(term.expectedStipend, term.receivedStipend)) return false;

    ids.add(term.id);
    return true;
  });
}
