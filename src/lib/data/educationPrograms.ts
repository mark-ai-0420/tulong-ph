import type { EducationDirectoryEntry, EducationProgram } from '../../types/education.ts';

export const EDUCATION_AMOUNTS = {
  esc: { NCR: 13_000, HUC: 11_000, other: 9_000 },
  shsPublicCompleter: { NCR: 22_500, HUC: 20_000, other: 17_500 },
  shsPrivateCompleter: { NCR: 18_000, HUC: 16_000, other: 14_000 },
  // Historical transition-period rates, never awarded by the current matcher.
  shsHistoricalSUC: { NCR: 11_250, HUC: 10_000, other: 8_750 },
  tesPublic: 20_000,
  tesPrivate: 27_000,
  tesPWD: 10_000,
  tesLicensure: 8_000,
  tdp: 15_000,
  cmspIncomeCeiling: 500_000,
  cmspFullCash: 80_000,
  cmspHalfCash: 40_000,
  cmspFullPrivateTuition: 40_000,
  cmspHalfPrivateTuition: 20_000,
  coschoCash: 80_000,
  coschoPrivateTuition: 40_000,
  coschoLaptop: 30_000,
  medicineCash: 177_000,
  medicineInternshipCash: 132_000,
  medicineInternshipLicensure: 16_000,
  medicinePrivateTuitionPerSemester: 100_000,
  dostMonthly: 8_000,
  dostAcademicMonths: 10,
  dostBooks: 10_000,
  dostPrivateTuition: 40_000,
  tesdaDaily: 160,
  owwaEDSP: 60_000,
  owwaODSP: 20_000,
  owwaELAPSecondary: 8_000,
  owwaELAPCollege: 10_000,
  taraBasaDays: 20,
  taraBasaParentDaily: 235,
  gsisSTEM: 15_000,
} as const;

const enrollment = 'Certificate of Enrollment / Registration';
const grades = 'Form 138 / certified report card or latest college grades';
const identity = 'PSA birth certificate / proof of Filipino citizenship';
const income = 'Parents or guardian ITR / BIR tax exemption / accepted proof of income';
const unifastSource = 'https://www.unifast.gov.ph/assets/pdf/infgrfx/uaqtea2025-trifold.pdf';

export const educationPrograms: EducationProgram[] = [
  {
    id: 'fhe', name: 'Free Higher Education', agency: 'CHED / UniFAST', statutoryBasis: 'RA 10931',
    benefits: '100% of covered tuition and other school fees at SUCs and CHED-recognized LUCs.',
    eligibility: ['Filipino student in a first undergraduate degree.', 'Pass admission and retention rules; remain within prescribed program duration plus 1 year.'],
    documents: [enrollment, identity], steps: ['Ask the school registrar to confirm FHE coverage.', 'Check which fees are covered before paying.'],
    stackingRule: 'Covered tuition may coexist with a permitted living scholarship; never claim the same tuition expense twice.', sourceUrl: unifastSource, verifiedAsOf: '2025 brochure',
  },
  {
    id: 'tes', name: 'Tertiary Education Subsidy (TES)', agency: 'CHED / UniFAST', statutoryBasis: 'RA 10931; UniFAST Board Resolution 2024-019',
    benefits: 'PHP20,000/year at SUC/LUC; PHP27,000/year at private HEI. TES-3A: PHP10,000/year for PWD; TES-3B: up to PHP8,000 once for licensure.',
    eligibility: ['CHED-recognized HEI and registered program.', 'New slots prioritize Listahanan, then 4Ps, then other poor students in private HEIs with no SUC/LUC; subject to funds.'],
    documents: [enrollment, 'PWD ID for TES-3A', 'Licensure receipts and proof of graduation for TES-3B'], steps: ['Apply through the HEI UniFAST focal person during an official call.', 'Have the school validate prioritization and award status.'],
    stackingRule: 'Treat TES, TDP and other national living awards as alternatives pending agency confirmation. TES add-ons require a TES award.', sourceUrl: unifastSource, verifiedAsOf: '2025 brochure',
  },
  {
    id: 'tdp', name: 'Tulong Dunong Program (TDP-TES)', agency: 'CHED / UniFAST', statutoryBasis: 'RA 10931; TDP guidelines',
    benefits: 'PHP7,500 per regular semester; PHP15,000 per academic year.',
    eligibility: ['Undergraduate at a participating HEI.', 'Annual family income at most PHP400,000; no TES or other national government scholarship.'],
    documents: [enrollment, income, 'Certificate of no other government scholarship'], steps: ['Ask the school or CHED regional coordinator about the current call.', 'Declare every existing award before accepting TDP.'],
    stackingRule: 'Do not add TDP to TES or another national government scholarship.', sourceUrl: 'https://www.unifast.gov.ph/guidelines.html', verifiedAsOf: '2025 program reference',
  },
  {
    id: 'cmsp', name: 'CHED Merit Scholarship (CMSP)', agency: 'CHED', statutoryBasis: 'RA 7722; CMO 13, s. 2025',
    benefits: 'Full: PHP80,000/year cash and up to PHP40,000 private tuition. Half: PHP40,000/year cash and up to PHP20,000 private tuition.',
    eligibility: ['Incoming freshman; priority degree and recognized HEI.', 'GWA at least 93%; full merit at least 96%. Annual family income at most PHP500,000. Ranked selection and limited slots.'],
    documents: [identity, grades, income, 'Admission to a CHED priority degree'], steps: ['Check the regional CHED call and priority degrees.', 'Submit complete requirements directly to the CHED regional office.'],
    stackingRule: 'Choose one national scholarship. Private totals of PHP120,000/PHP60,000 include tuition and are not all cash.', sourceUrl: 'https://ched.gov.ph/wp-content/uploads/CMO-No.-13-S.-2025-Revised-CMSP-guidelines.pdf', additionalSources: [{ title: 'CHED financial assistance breakdown', url: 'https://legacy.ched.gov.ph/merit-scholarship/' }], verifiedAsOf: 'CMO 13, s. 2025',
  },
  {
    id: 'coscho', name: 'Coconut Farmers Scholarship (CoScho)', agency: 'CHED / PCA', statutoryBasis: 'RA 11524; CHED-PCA JMC 1, s. 2023',
    benefits: 'PHP70,000 stipend plus PHP10,000 books per year; up to PHP40,000 private tuition and PHP30,000 one-time laptop support.',
    eligibility: ['NCFRS-registered farmer or dependent; PCA priority course; 1 scholar per family.', 'GWA at least 80%; family income at most PHP300,000; return service required.'],
    documents: [identity, grades, income, enrollment, 'PCA certification / NCFRS registration', 'Certificate of good moral character'], steps: ['Request PCA certification and confirm the eligible course.', 'Apply to CHED and review the return-service agreement.'],
    stackingRule: 'Not for recipients of another government-funded financial assistance program; declare all awards.', sourceUrl: 'https://legacy.ched.gov.ph/coscho/', verifiedAsOf: '2025-2026 call',
  },
  {
    id: 'msrs', name: 'Doktor Para sa Bayan (MSRS)', agency: 'CHED / DOH', statutoryBasis: 'RA 11509; CAO 2, s. 2022',
    benefits: 'PHP177,000/year allowances during MD study; internship PHP148,000 including one-time licensure support. Actual SUC tuition; private cap PHP100,000/semester with school counterpart.',
    eligibility: ['Admitted to a participating MD school; required NMAT and school admission tests.', 'Mandatory public-health return service: 1 year per scholarship year.'],
    documents: [identity, 'Certificate of good moral character', 'MD admission and NMAT result', 'Affidavit of no existing scholarship', income], steps: ['Check the current CHED list of partner medical schools.', 'Apply through the medical school and read the return-service agreement.'],
    stackingRule: 'A dedicated medical award; not added to an undergraduate national scholarship.', sourceUrl: 'https://legacy.ched.gov.ph/msrs/', verifiedAsOf: 'AY 2025-2026',
  },
  {
    id: 'dost', name: 'DOST-SEI RA 7687 / Merit', agency: 'DOST-SEI', statutoryBasis: 'RA 7687; DOST-SEI Merit Scholarship',
    benefits: 'PHP8,000/month for 10 academic months plus PHP10,000/year learning materials; up to PHP40,000 private tuition. Thesis, uniform and travel have separate conditions.',
    eligibility: ['Incoming freshman in an identified S&T course and qualified school; qualifying examination.', 'STEM graduate or top 5% of non-STEM class. RA 7687 is needs-based; Merit is open irrespective of income.'],
    documents: [identity, grades, income, 'DOST forms for health, good moral character and strand/class rank'], steps: ['Apply at the official DOST-SEI scholarship portal.', 'Pass the exam and review the scholarship and service obligations.'],
    stackingRule: 'FHE remains available in SUCs; declare and obtain approval for any additional scholarship.', sourceUrl: 'https://car.dost.gov.ph/the-2026-dost-science-education-institute-dost-sei-undergraduate-scholarship-examination-was-successfully-held-on-february-21-22-2026/', verifiedAsOf: '2026 announcement',
  },
  {
    id: 'esc', name: 'JHS Educational Service Contracting (ESC)', agency: 'DepEd / PEAC', statutoryBasis: 'RA 8545; E-GASTPE guidelines',
    benefits: 'Annual fee support: NCR PHP13,000; HUC outside NCR PHP11,000; other locations PHP9,000. Payment cannot exceed actual school fees.',
    eligibility: ['Private PEAC-certified JHS; incoming Grade 7 award or continuing ESC grantee in Grades 8 to 10.', 'School selection and available slots; no cash payout to the family.'],
    documents: [identity, grades, income, 'ESC application and school confirmation of grant'], steps: ['Ask the participating school about ESC selection.', 'Check the grant on the school fee assessment.'],
    stackingRule: 'Tuition deduction only; do not count it again as a cash grant.', sourceUrl: 'https://www.deped.gov.ph/wp-content/uploads/DO_s2026_011r.pdf', verifiedAsOf: '2025-2026 program reference',
  },
  {
    id: 'shsvp', name: 'Senior High School Voucher', agency: 'DepEd / PEAC', statutoryBasis: 'RA 10533; RA 8545',
    benefits: 'Private SHS: public/ALS/PEPT completers PHP22,500/20,000/17,500 (NCR/HUC/other). ESC/approved private completers PHP18,000/16,000/14,000.',
    eligibility: ['Participating private SHS; public JHS or ESC completer, or approved voucher application.', 'Grade 12 must have used a voucher in Grade 11. No new SUC/LUC voucher assumed.'],
    documents: [identity, grades, 'ESC certificate or approved qualified voucher recipient certificate'], steps: ['Confirm the voucher category with the school or PEAC.', 'Use OVAP only if your category requires an application.'],
    stackingRule: 'Actual tuition deduction is the lesser of the voucher ceiling and school fees. Historical SUC 50% tiers are not current new-student entitlements.', sourceUrl: 'https://ovap.peac.org.ph/', additionalSources: [{ title: 'DepEd voucher transfer and rate guidance', url: 'https://depedroxi.ph/voucher-program/' }, { title: 'CHED SUC SHS phaseout explanation', url: 'https://pia.gov.ph/news/davao-students-not-affected-by-discontinuation-of-shs-program-in-sucs-ched/' }], verifiedAsOf: '2025-2026; SUC phaseout checked',
  },
  {
    id: 'tesda', name: 'TESDA TWSP / STEP / PESFA / Tulong Trabaho', agency: 'TESDA', statutoryBasis: 'RA 11230; TESDA scholarship guidelines',
    benefits: 'Approved training and assessment costs; PHP160 per eligible training day under applicable scholarship rules. STEP has course-specific starter tools; accident insurance is program-specific.',
    eligibility: ['Registered course, qualified training provider and scholarship slot.', 'Minimum age depends on program: generally 15 for STEP/PESFA, 18 for TWSP/Tulong Trabaho. FTVET is for eligible first post-secondary learners in public TVIs.'],
    documents: [identity, grades, 'TESDA learner profile and scholarship application', income], steps: ['Ask the provincial office for the current funded course list.', 'Confirm age, allowance, toolkit and insurance terms before enrolling.'],
    stackingRule: 'No universal PHP100,000 insurance cash grant or fixed toolkit value; do not add incompatible training scholarships.', sourceUrl: 'https://www.tesda.gov.ph/Media/NewsDetail/20083', verifiedAsOf: '2025 scholarship guidance; course terms vary',
  },
  {
    id: 'owwa', name: 'OWWA EDSP / ODSP / CMWSP / ELAP', agency: 'OWWA', statutoryBasis: 'RA 10801',
    benefits: 'EDSP/CMWSP up to PHP60,000/year; ODSP PHP20,000/year. ELAP: PHP5,000 elementary, PHP8,000 secondary, PHP10,000 college; separate PHP15,000 survivor livelihood support.',
    eligibility: ['EDSP/ODSP: qualified dependent of an active member; EDSP exam/ranking and age limits.', 'ODSP OFW salary at most USD1,000/month. CMWSP: priority S&T and exam. ELAP requires OWWA validation of deceased member and dependent.'],
    documents: [identity, enrollment, grades, 'OWWA membership and OFW relationship proof', 'OFW employment contract / salary certification', 'Death certificate for ELAP'], steps: ['Have the Regional Welfare Office verify membership and dependent status.', 'Choose the appropriate education program and submit its current checklist.'],
    stackingRule: 'Treat OWWA education awards as alternatives; disclose other scholarships. Survivor livelihood support is a separate family benefit.', sourceUrl: 'https://owwa.gov.ph/baccalaureate-courses/', additionalSources: [{ title: 'OWWA charter and ELAP requirements', url: 'https://owwa.gov.ph/wp-content/uploads/2025/03/OWWA_CC_021225-updated.pdf' }, { title: 'PIA ELAP program figures', url: 'https://pia.gov.ph/news/nearly-1600-bicol-ofw-dependents-get-owwa-scholarship/' }], verifiedAsOf: '2025 charter and current program page',
  },
  {
    id: 'dswd', name: 'Tara, Basa! / AICS Educational Assistance', agency: 'DSWD', statutoryBasis: 'EO 76, s. 2024; DSWD AICS guidelines',
    benefits: 'Tara, Basa! tutors: 20 days at the applicable regional daily wage. Nanay-Tatay sessions: PHP235/day, PHP4,700 for 20 sessions. AICS amount follows social-worker assessment.',
    eligibility: ['Tara, Basa!: financially challenged college students at partner schools and participating sites.', 'AICS: individual or family in crisis; requirements and assistance approved after assessment.'],
    documents: [enrollment, 'School ID and parent/guardian valid ID', 'Statement of Account for tertiary education', 'Evidence of the family crisis if requested'], steps: ['Ask DSWD Field Office about participating Tara, Basa! sites.', 'For AICS, bring enrollment and IDs to the Crisis Intervention Unit.'],
    stackingRule: 'Work-study or crisis aid requires separate assessment and disclosure; never assume automatic stacking or a fixed AICS payout.', sourceUrl: 'https://aics.dswd.gov.ph/wp-content/uploads/2025/04/V2-PSB-CC-2025-2nd-Edition.docx.pdf', additionalSources: [{ title: 'DSWD tutor wages and parent-session grants', url: 'https://fo9.dswd.gov.ph/2025/08/mga-benepisyaryo-ng-dswd-tara-basa-tutoring-program-sa-rehiyon-ix-nakatanggap-na-ng-cash-for-work-grants/' }, { title: 'DSWD EO 76 program basis', url: 'https://fo5.dswd.gov.ph/tbtplearners2026/' }], verifiedAsOf: '2025 charter',
  },
  {
    id: 'iskolar_gsis', name: 'Iskolar ng Bayan / GSIS Education Programs', agency: 'SUC / GSIS', statutoryBasis: 'RA 10648; RA 8291; GSIS MC 070-2025',
    benefits: 'Iskolar ng Bayan: freshman tuition and fee scholarship subject to SUC admission rules. GSSP STEM 2026-2027: PHP15,000/year. Legacy GSP had up to PHP40,000 tuition plus PHP3,000/month; ask GSIS about active cohorts.',
    eligibility: ['Iskolar: Top 10 graduate of a public high school applying to a regional SUC; admission and slots still apply.', 'GSSP: incoming STEM freshman, GWA at least 90%, dependent of active GSIS member or qualified disability pensioner; SG15 and below is priority.'],
    documents: [identity, grades, enrollment, 'Certified Top 10 public-school ranking for Iskolar', 'GSIS nomination, membership and salary-grade proof for GSSP'], steps: ['Ask the regional SUC admissions office about Iskolar requirements.', 'GSIS dependents: verify the current GSSP call and priority ranking.'],
    stackingRule: 'FHE and Iskolar cannot reimburse the same fees twice; GSSP is separately assessed, not added automatically to another scholarship.', sourceUrl: 'https://www.gsis.gov.ph/2026/01/06/gsis-to-launch-stem-scholarship-this-year/', additionalSources: [{ title: 'Iskolar ng Bayan statute', url: 'https://issuances-library.senate.gov.ph/legislative%2Bissuances/Republic%20Act%20No.%2010648' }], verifiedAsOf: '2026-2027 GSSP launch',
  },
];

const regionalEmails: [string, string][] = [
  ['Region I', 'unifastro1@ched.gov.ph'], ['Region II', 'unifastro2@ched.gov.ph'],
  ['Region III', 'unifastro3@ched.gov.ph'], ['CALABARZON', 'unifast.calabarzon@ched.gov.ph'],
  ['MIMAROPA', 'unifast.mimaropa@ched.gov.ph'], ['Region V', 'unifastro5@ched.gov.ph'],
  ['Region VI', 'unifastro6@ched.gov.ph'], ['Region VII', 'unifastro7@ched.gov.ph'],
  ['Region VIII', 'unifastro8@ched.gov.ph'], ['Region IX', 'unifastro9@ched.gov.ph'],
  ['Region X', 'unifastro10@ched.gov.ph'], ['Region XI', 'unifastro11@ched.gov.ph'],
  ['Region XII', 'unifastro12@ched.gov.ph'], ['Caraga', 'unifast.caraga@ched.gov.ph'],
  ['NCR', 'unifast.ncr@ched.gov.ph'], ['CAR', 'unifast.car@ched.gov.ph'],
  ['NIR', 'unifast.nir@ched.gov.ph'], ['BARMM', 'unifast.barmm@ched.gov.ph'],
];

export const educationDirectory: EducationDirectoryEntry[] = [
  ...regionalEmails.map(([region, email], index) => ({
    id: `unifast-${index}`, agency: 'CHED / UniFAST', name: `UniFAST focal desk: ${region}`,
    region, services: 'TES, TDP, FHE; coordinate scholarship submissions through your school.',
    url: 'https://www.unifast.gov.ph/ro.html', email, sourceUrl: unifastSource,
  })),
  { id: 'dost', agency: 'DOST-SEI', name: 'DOST-SEI scholarship helpdesk and regional referrals', region: 'Nationwide', services: 'RA 7687, Merit and JLSS scholarship inquiries.', url: 'https://helpdesk.sei.dost.gov.ph/', sourceUrl: 'https://helpdesk.sei.dost.gov.ph/' },
  { id: 'peac', agency: 'DepEd / PEAC', name: 'PEAC national and regional secretariats', region: 'Nationwide', services: 'ESC schools, SHS vouchers and OVAP applications.', url: 'https://peac.org.ph/contact-us/', sourceUrl: 'https://peac.org.ph/contact-us/' },
  { id: 'tesda', agency: 'TESDA', name: 'TESDA regional and provincial office directory', region: 'Nationwide', services: 'TWSP, STEP, PESFA and Tulong Trabaho funded course referrals.', url: 'https://www.tesda.gov.ph/Directory', sourceUrl: 'https://www.tesda.gov.ph/Directory' },
  { id: 'owwa', agency: 'OWWA', name: 'OWWA Regional Welfare Offices', region: 'Nationwide', services: 'EDSP, ODSP, CMWSP, ELAP and membership validation.', url: 'https://owwa.gov.ph/contact-us/', phone: '1348', sourceUrl: 'https://owwa.gov.ph/wp-content/uploads/2025/03/OWWA_CC_021225-updated.pdf' },
  { id: 'dswd', agency: 'DSWD', name: 'DSWD Field Offices and Crisis Intervention Units', region: 'Nationwide', services: 'AICS education crisis aid and Tara, Basa! participating sites.', url: 'https://www.dswd.gov.ph/directory-of-officials-field-office/', sourceUrl: 'https://aics.dswd.gov.ph/wp-content/uploads/2025/04/V2-PSB-CC-2025-2nd-Edition.docx.pdf' },
  { id: 'gsis', agency: 'GSIS', name: 'GSIS education subsidy desk', region: 'Nationwide', services: '2026 GSSP STEM nomination and legacy education award inquiries.', url: 'https://www.gsis.gov.ph/2026/01/06/gsis-to-launch-stem-scholarship-this-year/', phone: '0288474747', email: 'gsiscares@gsis.gov.ph', sourceUrl: 'https://www.gsis.gov.ph/2026/01/06/gsis-to-launch-stem-scholarship-this-year/' },
];
