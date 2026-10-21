import type { EducationMatch, EducationTriageResult, StudentEducationProfile } from '../types/education.ts';
import { EDUCATION_AMOUNTS as amounts, educationPrograms } from './data/educationPrograms.ts';

export const defaultEducationProfile: StudentEducationProfile = {
  fullName: '', schoolName: '', degreeProgram: '', cityMunicipality: '', educationLevel: 'college', schoolType: 'suc_luc',
  location: 'NCR', annualTuitionAndFees: 0, gwa: 85, yearLevel: 1, age: 18,
  annualHouseholdIncome: 120_000, isFilipino: true, schoolParticipates: false,
  firstDegree: true, withinResidencyLimit: true, isIncomingFreshman: true,
  isExistingEsc: false, hasSHSVoucher: false, previousAnnualGrant: 0, voucherCategory: 'none', noLocalSUC: false,
  priorityCourse: false, dostQualifiedSchool: false, isSTEMGraduateOrTop5: false,
  is4PsOrListahanan: false, isPWD: false, isSoloParentDependent: false,
  isOWWADependent: false, owwaActive: false, ofwMonthlySalaryUSD: 0,
  isDeceasedOFWDependent: false, isCoconutFarmerDependent: false, coconutPriorityCourse: false,
  isGSISDependent: false, gsisSalaryGrade: 15, isTop10PublicHS: false,
  hasFamilyCrisis: false, hasOtherNationalScholarship: false, hasNC3OrHigher: false,
  trainingDays: 20, regionalDailyWage: 0, regionalDailyWageManual: false, willingReturnService: false,
  selectedPrimaryProgram: '', needsLicensureReimbursement: false,
};

const nonnegative = (value: number): number => Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER / 100, Math.max(0, value)) : 0;
const pesos = (value: number): number => Math.round(nonnegative(value) * 100) / 100;

/** Accept only known primitive fields when recovering a local session. */
export function normalizeEducationProfile(value: unknown): StudentEducationProfile {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const normalized: Record<string, unknown> = {};
  for (const [key, fallback] of Object.entries(defaultEducationProfile)) {
    const candidate = record[key];
    normalized[key] = typeof candidate === typeof fallback
      ? typeof candidate === 'number' ? nonnegative(candidate) : candidate
      : fallback;
  }
  const profile = normalized as unknown as StudentEducationProfile;
  if (!['jhs', 'shs', 'college', 'tvet', 'medicine'].includes(profile.educationLevel)) profile.educationLevel = 'college';
  if (!['public', 'suc_luc', 'private'].includes(profile.schoolType)) profile.schoolType = 'suc_luc';
  if (!['NCR', 'HUC', 'other'].includes(profile.location)) profile.location = 'NCR';
  if (!['public_jhs', 'esc', 'approved_private', 'none'].includes(profile.voucherCategory)) profile.voucherCategory = 'none';
  profile.degreeProgram = typeof profile.degreeProgram === 'string' ? profile.degreeProgram.slice(0, 150) : '';
  profile.gwa = Math.min(100, profile.gwa);
  profile.yearLevel = Math.floor(profile.yearLevel);
  profile.age = Math.floor(profile.age);
  profile.trainingDays = Math.floor(profile.trainingDays);
  return profile;
}

/** Local planning estimates only. Agencies validate every award and its coexistence rules. */
export function evaluateEducationAssistance(profile: StudentEducationProfile): EducationTriageResult {
  profile = normalizeEducationProfile(profile);
  const tuition = pesos(profile.annualTuitionAndFees);
  const income = nonnegative(profile.annualHouseholdIncome);
  const gwa = Math.min(100, nonnegative(profile.gwa));
  const primaryPrograms: EducationMatch[] = [];
  const supplementalPrograms: EducationMatch[] = [];
  let directTuitionRelief = 0;
  let tuitionProgram = null;
  const advisories = [
    'Mga posibleng aplikasyon ito, hindi approved scholarship o pangako ng payout. Kumpirmahin ang kasalukuyang call, school, slots at requirements sa ahensya.',
    'Pumili ng isang primary national scholarship. Hindi pinagsasama ang TES, TDP, CMSP, CoScho, DOST at OWWA amounts; ipaalam ang lahat ng kasalukuyang award.',
    'Ang tuition relief ay para sa covered fees lamang. Ang cash stipend ay hindi awtomatikong ibinabawas sa tuition.',
  ];
  const program = (id: string) => educationPrograms.find((entry) => entry.id === id)!;
  const add = (
    list: EducationMatch[], id: string, annualCashAmount: number | null, reason: string,
    condition: string, tuitionAmount = 0, oneTimeAmount = 0, requiresPrimaryProgram?: string, matchId = id,
  ) => list.push({ id: matchId, program: program(id), annualCashAmount, tuitionAmount: pesos(tuitionAmount), oneTimeAmount, reason, condition, requiresPrimaryProgram });
  const cover = (id: string, ceiling: number) => {
    directTuitionRelief = pesos(Math.min(tuition, ceiling));
    tuitionProgram = program(id);
  };

  if (!profile.isFilipino) {
    return { directTuitionRelief: 0, netRemainingTuitionBalance: tuition, netRemainingTuition: tuition, tuitionProgram: null, primaryPrograms, primaryStipendPrograms: primaryPrograms, supplementalPrograms, stackableSupplementalPrograms: supplementalPrograms, bestPrimaryAnnualStipend: 0, selectedPrimary: null, documentaryChecklist: [], consolidatedChecklist: [], advisories: ['Kailangan ng Filipino citizenship sa mga programang sakop ng matcher. Magtanong sa registrar tungkol sa ibang scholarship.'] };
  }

  if (profile.educationLevel === 'jhs' && profile.schoolType === 'private' && profile.schoolParticipates &&
      ((profile.yearLevel === 7) || (profile.yearLevel >= 8 && profile.yearLevel <= 10 && profile.isExistingEsc))) {
    cover('esc', profile.yearLevel === 7 ? amounts.esc[profile.location] : Math.min(amounts.esc[profile.location], profile.previousAnnualGrant));
  }
  if (profile.educationLevel === 'shs' && profile.schoolType === 'private' && profile.schoolParticipates &&
      (profile.yearLevel === 11 || (profile.yearLevel === 12 && profile.hasSHSVoucher)) && profile.voucherCategory !== 'none') {
    const ceiling = profile.voucherCategory === 'public_jhs' ? amounts.shsPublicCompleter[profile.location] : amounts.shsPrivateCompleter[profile.location];
    cover('shsvp', profile.yearLevel === 11 ? ceiling : Math.min(ceiling, profile.previousAnnualGrant));
  }
  if (profile.educationLevel === 'shs' && profile.schoolType === 'suc_luc') {
    advisories.push('Hindi ginagamit ang lumang 50% SUC/LUC SHS voucher sa bagong aplikasyon. Kumpirmahin sa DepEd ang kasalukuyang coverage.');
  }
  if (!profile.schoolParticipates) {
    advisories.push('Walang tuition relief na ibinawas habang hindi kumpirmado ang school participation. Tanungin ang registrar o program desk.');
  }

  if (profile.educationLevel === 'college') {
    if (profile.schoolType === 'suc_luc' && profile.schoolParticipates && profile.firstDegree && profile.withinResidencyLimit) {
      cover('fhe', tuition);
    }
    if (profile.isTop10PublicHS && profile.isIncomingFreshman && profile.schoolType === 'suc_luc') {
      add(supplementalPrograms, 'iskolar_gsis', null, 'Top 10 public high school graduate: Iskolar ng Bayan admission pathway.', 'Admission standards, regional SUC rules and slots apply. Fee coverage overlaps FHE and is never added twice.');
    }
    if (!profile.hasOtherNationalScholarship) {
      if (profile.schoolParticipates && (profile.is4PsOrListahanan || (profile.schoolType === 'private' && profile.noLocalSUC && income <= 400_000))) {
        add(primaryPrograms, 'tes', profile.schoolType === 'private' ? amounts.tesPrivate : amounts.tesPublic,
          'Nasa TES priority group ang iyong profile.', 'UniFAST must validate priority status, recognized course and available slots.');
      }
      if (profile.schoolParticipates && income <= 400_000) {
        add(primaryPrograms, 'tdp', amounts.tdp, 'Family income is within the TDP ceiling.', 'HEI participation, current call and no other government scholarship must be confirmed.');
      }
      if (profile.isIncomingFreshman && profile.priorityCourse && profile.schoolParticipates && gwa >= 93 && income <= amounts.cmspIncomeCeiling) {
        const full = gwa >= 96;
        add(primaryPrograms, 'cmsp', full ? amounts.cmspFullCash : amounts.cmspHalfCash,
          full ? 'Full merit academic threshold.' : 'Half merit academic threshold.',
          'Ranked CHED selection, recognized priority degree and no other national scholarship. This is a possible award ceiling.',
          profile.schoolType === 'private' ? Math.min(tuition, full ? amounts.cmspFullPrivateTuition : amounts.cmspHalfPrivateTuition) : 0);
      }
      if (profile.isIncomingFreshman && profile.priorityCourse && profile.dostQualifiedSchool && profile.isSTEMGraduateOrTop5 && profile.willingReturnService) {
        add(primaryPrograms, 'dost', amounts.dostMonthly * amounts.dostAcademicMonths + amounts.dostBooks,
          'S&T course, eligible strand/rank and qualified school.', 'Pass the DOST-SEI exam, meet citizenship/residency and health requirements, and sign the scholarship agreement.',
          profile.schoolType === 'private' ? Math.min(tuition, amounts.dostPrivateTuition) : 0);
      }
      if (profile.isCoconutFarmerDependent && profile.coconutPriorityCourse && profile.willingReturnService && gwa >= 80 && income <= 300_000) {
        add(primaryPrograms, 'coscho', amounts.coschoCash, 'NCFRS family and PCA priority-course pathway.', 'PCA registration, 1 scholar per family, CHED selection and return-service agreement must be confirmed.',
          profile.schoolType === 'private' ? Math.min(tuition, amounts.coschoPrivateTuition) : 0,
          profile.isIncomingFreshman ? amounts.coschoLaptop : 0);
      }
      if (profile.isOWWADependent && profile.owwaActive) {
        add(primaryPrograms, 'owwa', amounts.owwaEDSP, 'EDSP application pathway for an active-member dependent.', 'Age, relationship, exam/ranking or continuing-college slots must be validated by OWWA. EDSP is not automatically awarded.', 0, 0, undefined, 'owwa_edsp');
        if (profile.ofwMonthlySalaryUSD > 0 && profile.ofwMonthlySalaryUSD <= 1_000) {
          add(primaryPrograms, 'owwa', amounts.owwaODSP, 'ODSP: reported OFW salary is within USD1,000/month.', 'OWWA verifies age, relationship, salary, school and no incompatible scholarship.', 0, 0, undefined, 'owwa_odsp');
        }
        if (profile.priorityCourse && profile.willingReturnService) {
          add(primaryPrograms, 'owwa', amounts.owwaEDSP, 'CMWSP S&T application pathway.', 'OWWA validates the qualifying examination and CMWSP-specific eligibility.', 0, 0, undefined, 'owwa_cmwsp');
        }
      }
      if (profile.isGSISDependent && profile.isIncomingFreshman && profile.priorityCourse && gwa >= 90) {
        add(primaryPrograms, 'iskolar_gsis', amounts.gsisSTEM, 'GSSP STEM incoming-freshman pathway for AY 2026-2027.',
          profile.gsisSalaryGrade <= 15 ? 'SG15 or below receives priority; GSIS still validates membership, STEM admission and ranking.' : 'SG above 15: lower priority; GSIS validates membership, STEM admission and available slots.');
      }
    } else {
      advisories.push('May existing national scholarship: walang bagong primary amount na idinagdag. Humingi muna ng written coexistence approval sa mga ahensya.');
    }
    if (primaryPrograms.some((match) => match.program.id === 'tes')) {
      if (profile.isPWD) add(supplementalPrograms, 'tes', amounts.tesPWD, 'TES-3A PWD add-on.', 'May TES award at validated PWD ID lamang; hindi idadagdag sa DOST/CMSP/ibang primary award.', 0, 0, 'tes');
      if (profile.needsLicensureReimbursement) add(supplementalPrograms, 'tes', null, 'TES-3B licensure reimbursement.', 'For qualified TES graduates, actual receipted costs up to PHP8,000 once; agency validation required.', 0, amounts.tesLicensure, 'tes');
    }
    if (profile.yearLevel >= 2 && profile.yearLevel <= 4 && income <= 400_000) {
      const wage = nonnegative(profile.regionalDailyWage);
      add(supplementalPrograms, 'dswd', wage > 0 ? pesos(wage * amounts.taraBasaDays) : null,
        'Tara, Basa! tutor work-study inquiry.', 'Partner college/site selection and actual 20-day work are required. Wage is your entered local rate, not an inferred nationwide rate.');
    }
  }
  if (profile.educationLevel === 'tvet' && profile.age >= 15) {
    if (profile.schoolType === 'public' && profile.schoolParticipates && profile.firstDegree && !profile.hasNC3OrHigher) cover('tesda', tuition);
    add(primaryPrograms, 'tesda', null, 'TWSP, STEP, PESFA or Tulong Trabaho training inquiry.', 'TWSP/Tulong Trabaho generally require age 18; provider, course and funded slots determine actual tuition and allowance.', 0);
    add(supplementalPrograms, 'tesda', pesos(Math.floor(nonnegative(profile.trainingDays)) * amounts.tesdaDaily), 'Training support at PHP160 per eligible training day.', 'Only if the selected scholarship expressly provides this allowance. Actual attended/approved days apply.', 0, 0, 'tesda');
  }
  if (profile.educationLevel === 'medicine' && profile.schoolParticipates && profile.willingReturnService && !profile.hasOtherNationalScholarship) {
    add(primaryPrograms, 'msrs', profile.yearLevel >= 5 ? amounts.medicineInternshipCash : amounts.medicineCash,
      'Participating MD school and willingness to undertake public-health return service.', 'School admission, NMAT, CHED selection and signed return-service agreement required.',
      profile.schoolType === 'private' ? Math.min(tuition, amounts.medicinePrivateTuitionPerSemester * 2) : tuition,
      profile.yearLevel >= 5 ? amounts.medicineInternshipLicensure : 0);
  }
  if (profile.isOWWADependent && profile.isDeceasedOFWDependent && ['jhs', 'shs', 'college'].includes(profile.educationLevel)) {
    add(supplementalPrograms, 'owwa', profile.educationLevel === 'college' ? amounts.owwaELAPCollege : amounts.owwaELAPSecondary,
      'ELAP education inquiry for a deceased-member dependent.', 'OWWA must validate membership at death, qualified dependent and compatibility with existing awards.');
  }
  if (profile.hasFamilyCrisis) {
    add(supplementalPrograms, 'dswd', null, 'AICS education assistance inquiry for a family in crisis.', 'Social-worker assessment determines the amount and compatibility. No fixed peso payout is assumed.');
  }
  primaryPrograms.sort((left, right) => (right.annualCashAmount ?? 0) - (left.annualCashAmount ?? 0) || left.program.id.localeCompare(right.program.id));
  const selectedPrimary = primaryPrograms.find((match) => match.id === profile.selectedPrimaryProgram) ?? null;
  const matchedPrograms = [tuitionProgram, ...primaryPrograms.map((match) => match.program), ...supplementalPrograms.map((match) => match.program)].filter((entry) => entry !== null);
  const documentaryChecklist = [...new Set(matchedPrograms.flatMap((entry) => entry.documents))].filter((document) => {
    if (document.includes('TES-3A')) return profile.isPWD;
    if (document.includes('TES-3B')) return profile.needsLicensureReimbursement;
    if (document.includes('Death certificate')) return profile.isDeceasedOFWDependent;
    if (document.includes('GSIS nomination')) return profile.isGSISDependent;
    if (document.includes('Top 10')) return profile.isTop10PublicHS;
    return true;
  });
  if (profile.isPWD) documentaryChecklist.push('PWD ID if claiming priority or PWD support');
  if (profile.isSoloParentDependent) documentaryChecklist.push('Solo Parent ID if claiming priority');
  if (profile.is4PsOrListahanan) documentaryChecklist.push('4Ps / Listahanan validation if claiming TES priority');
  const checklist = [...new Set(documentaryChecklist)];
  const remainingTuition = pesos(tuition - directTuitionRelief);
  return {
    directTuitionRelief, netRemainingTuitionBalance: pesos(tuition - directTuitionRelief), tuitionProgram,
    primaryPrograms, supplementalPrograms, bestPrimaryAnnualStipend: primaryPrograms[0]?.annualCashAmount ?? 0,
    selectedPrimary, documentaryChecklist: checklist, advisories,
    netRemainingTuition: remainingTuition, primaryStipendPrograms: primaryPrograms,
    stackableSupplementalPrograms: supplementalPrograms, consolidatedChecklist: checklist,
  };
}
