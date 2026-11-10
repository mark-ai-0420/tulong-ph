import type { jsPDF } from 'jspdf';
import type { StoredDocument } from '../../types/assistance.ts';
import type { WorkerProgram, WorkerProfileInput } from '../../types/worker.ts';
import type { WorkerWorksheetFields } from '../storage.ts';
import { calculateWorkerBenefitsAndLoans } from '../workerBenefitsCalculator.ts';
import {
  USABLE_WIDTH,
  PACKET_LINE_HEIGHT,
  PACKET_TEXT_SIZE,
  drawPacketHeader,
  drawPacketMetadata,
  drawPacketSection,
  drawPacketFieldRow,
  drawPacketKeyValueRows,
  drawPacketTable,
  drawPacketParagraph,
  drawPacketChecklist,
  drawPacketReferenceCards,
  drawPacketFooter,
  packetMoney,
  packetLines
} from './pdfPrimitives.ts';

export type WorkerWorksheetSelection = 'all' | 'sena' | 'notice' | 'ecc' | 'livelihood';

const WORKER_SHEETS: Exclude<WorkerWorksheetSelection, 'all'>[] = ['sena', 'notice', 'ecc', 'livelihood'];

function workerBasics(doc: jsPDF, fields: WorkerWorksheetFields, y: number): number {
  return [
    [{ label: 'Worker / proponent', value: fields.worksheetName }],
    [{ label: 'Employer / respondent', value: fields.worksheetEmployer }, { label: 'Employer address / contact', value: fields.worksheetEmployerAddress }],
    [{ label: 'Employment start date', value: fields.worksheetStartDate }, { label: 'Employment end date', value: fields.worksheetEndDate }],
  ].reduce((nextY, row) => drawPacketFieldRow(doc, row, nextY), y);
}

function drawWorkerSignature(doc: jsPDF, y: number): number {
  return drawPacketParagraph(doc, 'Signature and date', 'Worker / proponent signature: ___________________________________________       Date: ____________________', y, false);
}

function drawWorkerSheet(
  doc: jsPDF,
  profile: WorkerProfileInput,
  fields: WorkerWorksheetFields,
  selection: Exclude<WorkerWorksheetSelection, 'all'>,
  result: ReturnType<typeof calculateWorkerBenefitsAndLoans>,
  documents: StoredDocument[]
): void {
  const config = {
    sena: {
      agency: 'DOLE NATIONAL CONCILIATION AND MEDIATION BOARD / SEnA RA 10396',
      title: 'DOLE SEnA Request for Assistance Pre-Filing Worksheet',
      legal: 'RA 10396 / Preparation worksheet, not an official filed request',
    },
    notice: {
      agency: 'EMPLOYER / HR STATUTORY BENEFIT NOTICE',
      title: 'Maternity / Sickness Benefit Notice',
      legal: 'RA 11210 / RA 11199 / Benefit illustrations require agency and payroll verification',
    },
    ecc: {
      agency: "EMPLOYEES' COMPENSATION COMMISSION / PD 626",
      title: 'Work-Related Injury / Sickness Claim Checklist',
      legal: 'Employees Compensation Program / Preparation worksheet',
    },
    livelihood: {
      agency: 'DOLE INTEGRATED LIVELIHOOD PROGRAM / OWWA BPBH',
      title: 'Livelihood Proposal Worksheet',
      legal: 'DILP / Balik Pinas! Balik Hanapbuhay / For assessment by the program office',
    },
  }[selection];
  let y = drawPacketHeader(doc, config.agency, config.title, config.legal);
  y = drawPacketMetadata(doc, `WRK-${selection.toUpperCase()}`, y);

  if (selection === 'sena') {
    y = drawPacketSection(doc, 'PART I: WORKER AND EMPLOYER DETAILS', y);
    y = workerBasics(doc, fields, y);
    y = drawPacketSection(doc, 'PART II: ITEMIZED UNPAID WAGES AND AMOUNTS', y + 1);
    const details = fields.worksheetUnpaidDetails.split('\n').map((line) => line.trim()).filter(Boolean);
    const width = USABLE_WIDTH;
    y = drawPacketTable(doc, ['Claim item / period / evidence', 'Amount due', 'Amount received', 'Balance'], [[details.join('; ') || 'Add dates, amounts due, amounts received, and evidence.', '', '', '']], y, [width * 0.58, width * 0.14, width * 0.14, width * 0.14]);
    y = drawPacketParagraph(doc, 'Requested relief', 'Request a payroll reconciliation, payment of any verified unpaid amounts, and a certificate of employment where applicable.', y, true);
    y = drawPacketParagraph(doc, 'Attached evidence', 'Contract, payslips, time records, bank records, termination notice, and relevant employer correspondence.', y, true);
    drawWorkerSignature(doc, y + 1);
  } else if (selection === 'notice') {
    y = drawPacketSection(doc, 'PART I: WORKER, EMPLOYER, AND CONTINGENCY', y);
    y = workerBasics(doc, fields, y);
    y = drawPacketParagraph(doc, 'Contingency event', fields.worksheetEventDetails, y, true);
    y = drawPacketSection(doc, 'PART II: BENEFIT ILLUSTRATION', y + 1);
    y = drawPacketKeyValueRows(doc, [
      { label: 'SSS maternity benefit estimate', value: packetMoney(result.maternity.sssBenefit) },
      { label: 'Employer salary differential estimate', value: packetMoney(result.maternity.employerSalaryDifferential) },
      { label: 'SSS sickness benefit estimate', value: packetMoney(result.sickness.sssBenefit) },
      { label: 'EC temporary total disability estimate', value: packetMoney(result.sickness.ecBenefit) },
    ], y, USABLE_WIDTH * 0.58);
    y = drawPacketParagraph(doc, 'Employer action', 'Notify HR promptly. Request written confirmation of leave dates, payroll computation, SSS contributions, and any applicable employer salary differential.', y + 1, true);
    y = drawPacketParagraph(doc, 'Estimate advisory', 'Amounts are illustrations only. SSS, the employer, or ECC determines eligibility and payable amounts.', y, false);
    drawWorkerSignature(doc, y);
  } else if (selection === 'ecc') {
    y = drawPacketSection(doc, 'PART I: EVENT AND EMPLOYMENT DETAILS', y);
    y = workerBasics(doc, fields, y);
    y = drawPacketParagraph(doc, 'Event and work connection', fields.worksheetEventDetails, y, true);
    y = drawPacketParagraph(doc, 'Employer EC logbook notice', 'Notify the employer promptly and ask that the injury or sickness be entered in the Employees Compensation logbook. Keep a copy or proof of notice.', y, true);
    y = drawPacketParagraph(doc, 'Dual filing instructions', `File the regular claim with SSS or GSIS, as applicable, and the work-related EC claim through the employer for ECC assessment. Sector on this profile: ${profile.sector}.`, y, true);
    y = drawPacketSection(doc, 'PART II: BENEFIT ILLUSTRATION', y + 1);
    y = drawPacketKeyValueRows(doc, [
      { label: 'Regular funeral benefit illustration', value: packetMoney(result.funeral.regularBenefit) },
      { label: 'Work-related EC funeral illustration', value: packetMoney(result.funeral.ecBenefit) },
      { label: 'Approved EC medical reimbursement entered', value: packetMoney(result.sickness.ecMedicalReimbursement) },
      { label: 'EC carer allowance illustration per month', value: packetMoney(result.sickness.ecCarerMonthly) },
    ], y, USABLE_WIDTH * 0.58);
    y = drawPacketSection(doc, 'REQUIRED PROOFS CHECKLIST', y + 1);
    drawPacketChecklist(doc, ['Accident / incident report and EC logbook entry', 'Medical certificate, clinical abstract, and prescriptions', 'Bills and official receipts for treatment', 'Employment and service record', 'SSS or GSIS claim documents', 'Employer notice and supporting correspondence'], y, documents, 'worker');
  } else {
    y = drawPacketSection(doc, 'PART I: PROPONENT AND PROJECT DETAILS', y);
    y = drawPacketFieldRow(doc, [{ label: 'Proponent', value: fields.worksheetName }], y);
    y = drawPacketFieldRow(doc, [{ label: 'Employer / organization, if applicable', value: fields.worksheetEmployer }], y);
    y = drawPacketFieldRow(doc, [{ label: 'Project title / proposed location / customers', value: fields.worksheetProjectTitle }], y);
    const budgetItems = fields.worksheetProposedBudget.split('\n').map((line) => line.trim()).filter(Boolean);
    const budgetHeaders = ['Item / tool / equipment', 'Supplier', 'Quantity', 'Proposed cost'];
    const budgetRow = budgetItems.join('; ') || 'Add each tool, equipment, and cost.';
    const budgetWidths = [USABLE_WIDTH * 0.48, USABLE_WIDTH * 0.2, USABLE_WIDTH * 0.12, USABLE_WIDTH * 0.2];
    const headerLineCount = Math.max(...budgetHeaders.map((header, index) => packetLines(doc, header, budgetWidths[index] - 4, PACKET_TEXT_SIZE).length));
    const rowLineCount = packetLines(doc, budgetRow, budgetWidths[0] - 4, PACKET_TEXT_SIZE).length;
    const tableHeight = Math.max(8, 4 + headerLineCount * PACKET_LINE_HEIGHT) + Math.max(8, 4 + rowLineCount * PACKET_LINE_HEIGHT);
    y = drawPacketSection(doc, 'PART II: PROPOSED TOOLS AND EQUIPMENT BUDGET', y + 1, tableHeight);
    y = drawPacketTable(doc, budgetHeaders, [[budgetRow, '', '', '']], y, budgetWidths);
    y = drawPacketKeyValueRows(doc, [
      { label: 'Proposed total budget', value: 'See itemized budget above.' },
      { label: 'Potential OWWA BPBH tier illustration', value: packetMoney(result.livelihood.bpbhGrant) },
      { label: 'Potential DOLE DILP assistance', value: 'Subject to assessment and approved livelihood inputs' },
    ], y, USABLE_WIDTH * 0.58);
    y = drawPacketParagraph(doc, 'Non-duplication pledge', 'I will disclose other livelihood assistance and will not claim the same project cost twice. I understand that DILP and BPBH require separate eligibility and program assessment and do not guarantee cash.', y + 1, true);
    drawWorkerSignature(doc, y);
  }
  drawPacketFooter(doc, selection.toUpperCase());
}

function drawWorkerProgramReferences(doc: jsPDF, programs: WorkerProgram[], y: number): void {
  const references = programs.map((program) => ({
    name: program.name,
    details: [
      `Statutory basis: ${program.basis}`,
      `Benefit: ${program.benefit}`,
      `Eligibility: ${program.eligibility}`,
      `Official reference: ${program.source}`,
    ],
  }));
  drawPacketReferenceCards(doc, references.length ? references : [{ name: 'No matched program yet', details: ['Ask the appropriate agency about current requirements and application channels.'] }], y);
}

export function buildWorkerWorksheetPages(
  doc: jsPDF,
  profile: WorkerProfileInput,
  fields: WorkerWorksheetFields,
  selectedWorksheet: WorkerWorksheetSelection,
  documents: StoredDocument[]
): void {
  const result = calculateWorkerBenefitsAndLoans(profile);
  const selectedSheets = selectedWorksheet === 'all' ? WORKER_SHEETS : [selectedWorksheet];
  selectedSheets.forEach((selection, index) => {
    if (index > 0) doc.addPage();
    drawWorkerSheet(doc, profile, fields, selection, result, documents);
  });
  if (selectedWorksheet === 'all') {
    doc.addPage();
    let y = drawPacketHeader(doc, 'DOLE / SSS / GSIS / ECC / OWWA', 'Consolidated Worker Documentary Checklist', 'Confirm requirements with the relevant agency before filing');
    y = drawPacketMetadata(doc, 'WRK-CHECK', y);
    y = drawPacketSection(doc, 'DOCUMENTARY CHECKLIST', y);
    drawPacketChecklist(doc, result.consolidatedChecklist, y, documents, 'worker');
    drawPacketFooter(doc, 'CHECKLIST');

    doc.addPage();
    y = drawPacketHeader(doc, 'DOLE / SSS / GSIS / ECC / OWWA', 'Worker Program References', 'Official links and benefit details for matched programs');
    y = drawPacketMetadata(doc, 'WRK-REF', y);
    y = drawPacketSection(doc, 'STATUTORY AND PROGRAM REFERENCES', y);
    drawWorkerProgramReferences(doc, result.matchedPrograms, y);
    drawPacketFooter(doc, 'REFERENCES');
  }
}
