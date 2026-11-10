import type { jsPDF } from 'jspdf';
import type { StoredDocument } from '../../types/assistance.ts';
import type { EducationProgram, StudentEducationProfile } from '../../types/education.ts';
import { evaluateEducationAssistance } from '../educationEngine.ts';
import {
  MARGIN_LEFT,
  USABLE_WIDTH,
  drawPacketHeader,
  drawPacketMetadata,
  drawPacketSection,
  drawPacketFieldRow,
  drawPacketKeyValueRows,
  drawPacketParagraph,
  drawPacketChecklist,
  drawPacketReferenceCards,
  drawPacketFooter,
  packetAscii,
  packetMoney
} from './pdfPrimitives.ts';

function educationReferences(profile: StudentEducationProfile): { programs: EducationProgram[]; result: ReturnType<typeof evaluateEducationAssistance> } {
  const result = evaluateEducationAssistance(profile);
  const programs = [...new Map([
    ...(result.tuitionProgram ? [result.tuitionProgram] : []),
    ...result.primaryPrograms.filter((match) => !result.selectedPrimary || match === result.selectedPrimary).map((match) => match.program),
    ...result.supplementalPrograms.filter((match) => !match.requiresPrimaryProgram || match.requiresPrimaryProgram === result.selectedPrimary?.program.id).map((match) => match.program),
  ].map((program) => [program.id, program])).values()];
  return { programs, result };
}

export function buildEducationPacketPages(
  doc: jsPDF,
  profile: StudentEducationProfile,
  recipient: string,
  documents: StoredDocument[]
): void {
  const located = profile as StudentEducationProfile & { province?: string; barangay?: string };
  const { programs, result } = educationReferences(profile);

  let y = drawPacketHeader(
    doc,
    'KOMISYON SA LALONG MATAAS NA EDUKASYON / DSWD',
    'Unified Educational Assistance & Scholarship Worksheet',
    'Under RA 10931 (Universal Access to Quality Tertiary Education) & CHED/DSWD Guidelines'
  );
  y = drawPacketMetadata(doc, 'EDU', y);
  y = drawPacketSection(doc, 'PART I: STUDENT AND SCHOOL INFORMATION', y);
  const schoolType = profile.schoolType === 'suc_luc' ? 'SUC / LUC' : profile.schoolType === 'public' ? 'Public' : 'Private';
  const locationTier = profile.location === 'other' ? 'Other' : profile.location;
  [
    [{ label: 'Full name', value: profile.fullName }],
    [{ label: 'School name', value: profile.schoolName }],
    [{ label: 'Degree program', value: profile.degreeProgram }],
    [{ label: 'School type', value: schoolType }, { label: 'Location tier', value: locationTier }],
    [{ label: 'Province', value: located.province || '' }, { label: 'City / municipality', value: profile.cityMunicipality }],
    [{ label: 'Barangay', value: located.barangay || '' }],
  ].forEach((row) => { y = drawPacketFieldRow(doc, row, y); });

  y = drawPacketSection(doc, 'PART II: TUITION AND FINANCIAL SUMMARY', y + 1);
  const selectedAward = result.selectedPrimary
    ? `${result.selectedPrimary.program.name} / ${packetMoney(result.selectedPrimary.annualCashAmount ?? 0)} possible annual cash`
    : 'No primary award selected. Ask which single primary program is appropriate.';
  y = drawPacketKeyValueRows(doc, [
    { label: 'Covered annual tuition and fees', value: packetMoney(profile.annualTuitionAndFees) },
    { label: 'Possible direct fee relief', value: packetMoney(result.directTuitionRelief) },
    { label: 'Remaining covered tuition balance', value: packetMoney(result.netRemainingTuitionBalance) },
    { label: 'Selected primary scholarship / program and potential cash', value: selectedAward },
  ], y, USABLE_WIDTH * 0.57);

  y = drawPacketSection(doc, 'FORMAL REQUEST LETTER', y + 1);
  y = drawPacketParagraph(doc, 'To', recipient, y, false);
  y = drawPacketParagraph(doc, 'Dear Sir / Madam', 'I respectfully request an assessment for educational assistance or a scholarship. Please advise me about the current application call, eligibility, available funds, and required documents.', y, false);
  y = drawPacketParagraph(doc, 'Requested degree program', profile.degreeProgram || '____________________', y, false);
  y = drawPacketParagraph(doc, 'Non-duplication pledge', 'I will disclose other scholarships and assistance and will not claim the same expense twice. I understand that this worksheet is for guidance and does not guarantee eligibility, funding, or approval.', y, true);
  y = drawPacketParagraph(doc, 'Respectfully,', 'Applicant signature: ___________________________________________       Date: ____________________', y, false);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Printed name: ${packetAscii(profile.fullName || '________________________________')}`, MARGIN_LEFT + 2, y + 1);
  drawPacketFooter(doc, 'EDU 1');

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('EDUCATIONAL ASSISTANCE PACKET: DOCUMENTS AND REFERENCES', MARGIN_LEFT, 15);
  let secondY = 21;
  secondY = drawPacketSection(doc, 'PART III: DOCUMENTARY CHECKLIST', secondY);
  secondY = drawPacketChecklist(doc, result.documentaryChecklist, secondY, documents, 'education');
  secondY = drawPacketSection(doc, 'PART IV: STATUTORY AND PROGRAM REFERENCES', secondY + 1);
  const referenceCards = programs.map((program) => ({
    name: program.name,
    details: [
      `Statutory basis: ${program.statutoryBasis}`,
      `Benefits: ${program.benefits}`,
      `Stacking rules: ${program.stackingRule}`,
      `Official reference: ${program.sourceUrl}`,
    ],
  }));
  if (referenceCards.length === 0) {
    referenceCards.push({ name: 'No matched program yet', details: ['Ask the school or agency about current application calls and official requirements.'] });
  }
  drawPacketReferenceCards(doc, referenceCards, secondY);
  drawPacketFooter(doc, 'EDU REF');
}
