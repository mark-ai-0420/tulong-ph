export type OFWEmploymentCategory = 'land_based' | 'sea_based';
export type OFWCaseType = 'repatriation' | 'unpaid_salaries' | 'maltreatment' | 'medical_emergency' | 'seafarer_disability';
export type OFWContractStatus = 'verified_dmw' | 'unverified_direct_hire' | 'tourist_irregular' | 'expired';
export type OFWOwwaStatus = 'active' | 'inactive' | 'undocumented_non_member';
export type OFWOwwaContributions = 'single' | 'multiple';
export type OFWCaseMilestone = 'reported' | 'agency_contacted' | 'mwo_case_opened' | 'assistance_approved' | 'repatriated' | 'settled';

export interface OFWCaseTimelineEvent {
  id: string;
  date: string;
  milestone: OFWCaseMilestone;
  title: string;
  notes?: string;
  agencyOrDesk?: string;
}

export interface OFWChecklist {
  passport: boolean;
  contract: boolean;
  oecOrEreg: boolean;
  incidentReportOrEvidence: boolean;
  localAgencyLetter: boolean;
}

export interface OFWCaseRecord {
  id: string;
  ofwName: string;
  category: OFWEmploymentCategory;
  countryOrVessel: string;
  foreignEmployer: string;
  localAgency: string;
  caseType: OFWCaseType;
  contractStatus: OFWContractStatus;
  owwaStatus: OFWOwwaStatus;
  owwaContributions?: OFWOwwaContributions;
  currentMilestone: OFWCaseMilestone;
  caseNumberDMW?: string;
  caseNumberMWO?: string;
  timeline: OFWCaseTimelineEvent[];
  checklist: OFWChecklist;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OFWEntitlementsResult {
  dmwAksyonFundEligible: boolean;
  owwaBpbhEstimatedAmount: number;
  solidaryLiabilityApplicable: boolean;
  seafarerPoeaSecApplicable: boolean;
  advice: Record<'taglish' | 'cebuano' | 'ilocano' | 'en', { legal: string; financial: string; hotline: string }>;
}

export const OFW_CASE_MILESTONES: OFWCaseMilestone[] = [
  'reported', 'agency_contacted', 'mwo_case_opened', 'assistance_approved', 'repatriated', 'settled',
];

const milestoneTitles: Record<OFWCaseMilestone, string> = {
  reported: 'Case reported',
  agency_contacted: 'Local agency contacted',
  mwo_case_opened: 'MWO case opened',
  assistance_approved: 'Assistance approved',
  repatriated: 'Repatriated',
  settled: 'Case settled',
};

export function createDefaultOFWCaseRecord(category: OFWEmploymentCategory = 'land_based'): OFWCaseRecord {
  const now = new Date().toISOString();
  return {
    id: globalThis.crypto.randomUUID(),
    ofwName: '',
    category,
    countryOrVessel: '',
    foreignEmployer: '',
    localAgency: '',
    caseType: 'repatriation',
    contractStatus: 'unverified_direct_hire',
    owwaStatus: 'undocumented_non_member',
    owwaContributions: 'multiple',
    currentMilestone: 'reported',
    timeline: [],
    checklist: {
      passport: false,
      contract: false,
      oecOrEreg: false,
      incidentReportOrEvidence: false,
      localAgencyLetter: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function calculateOFWEntitlements(record: OFWCaseRecord): OFWEntitlementsResult {
  const inactiveBpbhAmount = record.owwaContributions === 'single' ? 5_000 : 10_000;
  const inactiveContributionCount = record.owwaContributions === 'single' ? 'one' : 'more than one';
  const inactiveContributionPhrase = record.owwaContributions === 'single' ? 'one contribution' : 'more than one contribution';
  const owwaBpbhEstimatedAmount = record.owwaStatus === 'active'
    ? 20_000
    : record.owwaStatus === 'inactive' ? inactiveBpbhAmount : 0;
  const solidaryLiabilityApplicable = Boolean(record.localAgency.trim());
  const seafarerPoeaSecApplicable = record.category === 'sea_based';
  const financialAdvice: Record<'taglish' | 'cebuano' | 'ilocano' | 'en', string> = {
    taglish: record.owwaStatus === 'active'
      ? 'Tinatayang PHP 20,000 na livelihood support sa BPBH para sa kwalipikadong active member. OWWA ang magkukumpirma ng eligibility at kasalukuyang requirements.'
      : record.owwaStatus === 'inactive'
        ? `Tinatayang hanggang PHP ${inactiveBpbhAmount.toLocaleString('en-PH')} na BPBH livelihood support para sa inactive member na may ${inactiveContributionCount === 'one' ? 'isang' : 'higit sa isang'} contribution. OWWA ang magkukumpirma ng eligibility, anyo ng tulong, at requirements.`
        : 'Walang BPBH estimate para sa undocumented non-member. Magtanong pa rin sa DMW/MWO tungkol sa AKSYON Fund at iba pang tulong.',
    cebuano: record.owwaStatus === 'active'
      ? 'Gibanabana nga PHP 20,000 nga livelihood support sa BPBH para sa kwalipikadong aktibong miyembro. OWWA ang mokumpirma sa eligibility ug kasamtangang mga kinahanglanon.'
      : record.owwaStatus === 'inactive'
        ? `Hangtod PHP ${inactiveBpbhAmount.toLocaleString('en-PH')} nga banabana sa BPBH livelihood support para sa inactive nga miyembro nga adunay ${inactiveContributionCount === 'one' ? 'usa ka' : 'labaw sa usa ka'} kontribusyon. Kumpirmahon sa OWWA ang eligibility, matang sa tabang, ug mga kinahanglanon.`
        : 'Walay BPBH estimate para sa undocumented nga dili miyembro. Pangutan-a gihapon ang DMW/MWO bahin sa AKSYON Fund ug uban pang tabang.',
    ilocano: record.owwaStatus === 'active'
      ? 'Pagarup a PHP 20,000 a livelihood support ti BPBH para kadagiti kwalipikado nga aktibo a miembro. Ti OWWA ti mangpasingked iti eligibility ken dagiti agdama a kasapulan.'
      : record.owwaStatus === 'inactive'
        ? `Agingga PHP ${inactiveBpbhAmount.toLocaleString('en-PH')} a pagarup a BPBH livelihood support para iti inactive a miembro nga addaan iti ${inactiveContributionCount === 'one' ? 'maysa a kontribusion' : 'nasurok iti maysa a kontribusion'}. Ti OWWA ti mangpasingked iti eligibility, kita ti tulong, ken kasapulan.`
        : 'Awan ti BPBH estimate para iti undocumented a saan a miembro. Agdamag latta iti DMW/MWO maipanggep iti AKSYON Fund ken dadduma pay a tulong.',
    en: record.owwaStatus === 'active'
      ? 'Estimated PHP 20,000 in BPBH livelihood support for a qualified active member. OWWA confirms eligibility and current requirements.'
      : record.owwaStatus === 'inactive'
        ? `Estimated up to PHP ${inactiveBpbhAmount.toLocaleString('en-PH')} in BPBH livelihood support for an inactive member with ${inactiveContributionPhrase}. OWWA confirms eligibility, the form of support, and current requirements.`
        : 'No BPBH estimate is shown for an undocumented non-member. Still ask DMW/MWO about the AKSYON Fund and other assistance.',
  };
  const legalByLanguage = {
    taglish: 'Sa RA 11641, maaaring humingi ng legal, medical o iba pang tulong ang OFW na nasa distress kahit ano ang immigration status. Hindi ito garantiya ng approval. Para sa qualifying money claims, maaaring joint and solidary liable ang principal/employer at local recruitment agency sa ilalim ng RA 8042/10022; DMW o NLRC ang mag-a-assess ng facts. Sea-based cases should review the signed SEC, CBA, applicable POEA-SEC terms, and RA 12021 with DMW or NLRC.',
    cebuano: 'Ubos sa RA 11641, ang OFW nga naa sa kalisod mahimong mangayo og legal, medikal o uban pang tabang bisan unsa ang immigration status. Dili kini garantiya sa approval. Para sa kwalipikadong money claims, mahimong jointly and severally liable ang principal/employer ug lokal nga recruitment agency ubos sa RA 8042/10022; DMW o NLRC ang motimbang sa mga kamatuoran. Ang sea-based nga kaso angay mosusi sa gipirmahang SEC, CBA, magamit nga POEA-SEC terms, ug RA 12021 uban sa DMW o NLRC.',
    ilocano: 'Iti babaen ti RA 11641, mabalin a dumawat ti legal, medikal wenno sabali pay a tulong ti OFW a marigatan uray aniaman ti immigration status. Saan daytoy a garantiya ti panag-apruba. Para kadagiti kwalipikado a money claims, mabalin a joint and solidary liable ti principal/employer ken lokal a recruitment agency iti babaen ti RA 8042/10022; ti DMW wenno NLRC ti mangamiris kadagiti kinapudno. Para iti sea-based a kaso, kitaen ti napirmaan a SEC, CBA, maipakat a POEA-SEC terms, ken RA 12021 a kaduana ti DMW wenno NLRC.',
    en: 'RA 11641 allows an OFW in distress to seek legal, medical, or other assistance regardless of immigration status. This does not guarantee approval. For qualifying money claims, the principal/employer and local recruitment agency may be jointly and severally liable under RA 8042/10022; DMW or NLRC assesses the facts. Sea-based cases should review the signed SEC, CBA, applicable POEA-SEC terms, and RA 12021 with DMW or NLRC.',
  } satisfies Record<'taglish' | 'cebuano' | 'ilocano' | 'en', string>;
  const hotlineByLanguage = {
    taglish: 'Tumawag sa DMW/OWWA 24/7 Public Assistance Desk sa 1348. I-save ang case o reference number na ibibigay.',
    cebuano: 'Tawag sa DMW/OWWA 24/7 Public Assistance Desk sa 1348. Isulat ang case o reference number nga ihatag.',
    ilocano: 'Tumawag iti DMW/OWWA 24/7 Public Assistance Desk iti 1348. Isurat ti case wenno reference number a maited.',
    en: 'Call the DMW/OWWA 24/7 Public Assistance Desk at 1348. Save the case or reference number they provide.',
  } satisfies Record<'taglish' | 'cebuano' | 'ilocano' | 'en', string>;

  return {
    dmwAksyonFundEligible: true,
    owwaBpbhEstimatedAmount,
    solidaryLiabilityApplicable,
    seafarerPoeaSecApplicable,
    advice: {
      taglish: { legal: legalByLanguage.taglish, financial: financialAdvice.taglish, hotline: hotlineByLanguage.taglish },
      cebuano: { legal: legalByLanguage.cebuano, financial: financialAdvice.cebuano, hotline: hotlineByLanguage.cebuano },
      ilocano: { legal: legalByLanguage.ilocano, financial: financialAdvice.ilocano, hotline: hotlineByLanguage.ilocano },
      en: { legal: legalByLanguage.en, financial: financialAdvice.en, hotline: hotlineByLanguage.en },
    },
  };
}

export function updateCaseMilestone(
  record: OFWCaseRecord,
  nextMilestone: OFWCaseMilestone,
  eventDetails: Partial<OFWCaseTimelineEvent> = {},
): OFWCaseRecord {
  const event: OFWCaseTimelineEvent = {
    id: eventDetails.id ?? globalThis.crypto.randomUUID(),
    date: eventDetails.date ?? new Date().toISOString().slice(0, 10),
    milestone: nextMilestone,
    title: eventDetails.title?.trim() || milestoneTitles[nextMilestone],
    ...(eventDetails.notes === undefined ? {} : { notes: eventDetails.notes }),
    ...(eventDetails.agencyOrDesk === undefined ? {} : { agencyOrDesk: eventDetails.agencyOrDesk }),
  };
  return {
    ...record,
    currentMilestone: nextMilestone,
    timeline: [...record.timeline, event],
    updatedAt: new Date().toISOString(),
  };
}

export function toggleChecklistItem(record: OFWCaseRecord, item: keyof OFWChecklist): OFWCaseRecord {
  return {
    ...record,
    checklist: { ...record.checklist, [item]: !record.checklist[item] },
    updatedAt: new Date().toISOString(),
  };
}
