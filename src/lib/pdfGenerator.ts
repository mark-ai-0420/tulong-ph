import type { jsPDF } from 'jspdf';
import type {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
  StoredDocument,
} from '../types/assistance.ts';
import type { EducationProgram, StudentEducationProfile } from '../types/education.ts';
import type { WorkerProgram, WorkerProfileInput } from '../types/worker.ts';
import type { WorkerWorksheetFields } from './storage.ts';
import { evaluateEducationAssistance } from './educationEngine.ts';
import { calculateWorkerBenefitsAndLoans } from './workerBenefitsCalculator.ts';
import { getChecklistDocumentStatus, getDocumentAttachmentDataUrl, type DocumentPillar } from './documentVault.ts';

/**
 * Standard A4 measurements in millimeters: 210 x 297
 */
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 14;
const MARGIN_RIGHT = 14;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182 mm

/**
 * Draws standard monochrome high-contrast header for official Philippine government forms.
 */
function drawOfficialHeader(
  doc: jsPDF,
  republicText: string,
  departmentText: string,
  formTitle: string,
  legalSubtext: string,
  startY: number = 14
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(republicText.toUpperCase(), PAGE_WIDTH / 2, startY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(departmentText.toUpperCase(), PAGE_WIDTH / 2, startY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formTitle.toUpperCase(), PAGE_WIDTH / 2, startY + 10.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(legalSubtext, PAGE_WIDTH / 2, startY + 15, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_LEFT, startY + 17.5, PAGE_WIDTH - MARGIN_RIGHT, startY + 17.5);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, startY + 18.5, PAGE_WIDTH - MARGIN_RIGHT, startY + 18.5);

  return startY + 22;
}

/**
 * Draws a section banner (black box or double border) with inverted text or bold monochrome label.
 */
function drawSectionBanner(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(235, 235, 235);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(title.toUpperCase(), MARGIN_LEFT + 3, y + 4.2);

  return y + 6;
}

/**
 * Draws a grid cell with label and value.
 */
function drawFieldCell(
  doc: jsPDF,
  label: string,
  value: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  isBoldValue: boolean = true
) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, height);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(label.toUpperCase(), x + 1.5, y + 3.2);

  doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const displayVal = value && value.trim() ? value : '-';
  // Truncate or fit if necessary
  const maxChars = Math.floor(width / 2.1);
  const safeVal = displayVal.length > maxChars ? displayVal.substring(0, maxChars - 2) + '..' : displayVal;
  doc.text(safeVal, x + 1.5, y + 7.5);
}

/**
 * 1. MALASAKIT CENTER UNIFIED APPLICATION FORM (RA 11463)
 */
export function buildMalasakitUnifiedForm(
  doc: jsPDF,
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase
): void {
  let y = drawOfficialHeader(
    doc,
    'Republika ng Pilipinas • Department of Health',
    'Malasakit Center Operations Unit',
    'Unified Intake Sheet / Application Form',
    'In compliance with Republic Act No. 11463 (Malasakit Centers Act) & Joint Admin Order 2020-0001'
  );

  // Subheader Reference
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  const dateStr = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Petsa ng Aplikasyon (Date): ${dateStr}`, MARGIN_LEFT, y - 1);
  doc.text(
    `Control No.: MC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    PAGE_WIDTH - MARGIN_RIGHT,
    y - 1,
    { align: 'right' }
  );

  // --- SECTION I: PATIENT INFORMATION ---
  y = drawSectionBanner(doc, 'Part I. Impormasyon ng Pasyente (Patient Information)', y);

  const col4 = USABLE_WIDTH / 4;
  const col3 = USABLE_WIDTH / 3;
  const col2 = USABLE_WIDTH / 2;

  // Row 1: Name
  const hasName = Boolean(patient.lastName?.trim() || patient.firstName?.trim());
  const fullName = hasName
    ? `${patient.lastName || ''}, ${patient.firstName || ''} ${patient.middleName || ''}`.trim().replace(/^,\s*/, '')
    : 'DELA CRUZ, JUAN';
  drawFieldCell(doc, 'Buong Pangalan (Last, First, Middle)', fullName, MARGIN_LEFT, y, col2, 9);
  drawFieldCell(doc, 'Petsa ng Kapanganakan (DoB)', patient.dateOfBirth || 'N/A', MARGIN_LEFT + col2, y, col4, 9);
  drawFieldCell(doc, 'Kasarian (Sex)', (patient.gender || 'N/A').toUpperCase(), MARGIN_LEFT + col2 + col4, y, col4, 9);
  y += 9;

  // Row 2: Status, PhilHealth, Contact
  drawFieldCell(doc, 'Katayuang Sibil (Civil Status)', (patient.civilStatus || 'N/A').toUpperCase(), MARGIN_LEFT, y, col4, 9);
  drawFieldCell(doc, 'PhilHealth Identification PIN', patient.philhealthNumber || 'Unregistered / Indigent', MARGIN_LEFT + col4, y, col4, 9);
  drawFieldCell(doc, 'Mobile / Contact No.', patient.contactNumber || 'N/A', MARGIN_LEFT + col2, y, col4, 9);
  drawFieldCell(doc, 'Email Address', patient.email || 'N/A', MARGIN_LEFT + col2 + col4, y, col4, 9);
  y += 9;

  // Row 3: Address
  const fullAddress = `${patient.address.street}, Brgy. ${patient.address.barangay}, ${patient.address.cityMunicipality}, ${patient.address.province}`.replace(/^,\s*/, '');
  drawFieldCell(doc, 'Permanenteng Tirahan (Complete Address)', fullAddress, MARGIN_LEFT, y, USABLE_WIDTH - col4, 9);
  drawFieldCell(doc, 'Rehiyon (Region)', patient.address.region || 'NCR', MARGIN_LEFT + USABLE_WIDTH - col4, y, col4, 9);
  y += 9;

  // Row 4: Vulnerability Indicators
  const flags = [
    patient.isSeniorCitizen ? '[X] Senior Citizen (60+)' : '[ ] Senior Citizen',
    patient.isPWD ? '[X] PWD' : '[ ] PWD',
    patient.is4PsBeneficiary ? '[X] 4Ps Household' : '[ ] 4Ps',
    patient.isOFWOrDependent ? '[X] OFW / Dependent' : '[ ] OFW',
  ].join('    ');
  drawFieldCell(doc, 'Kategorya ng Pasyente (Special Categories)', flags, MARGIN_LEFT, y, USABLE_WIDTH, 8, false);
  y += 9;

  // --- SECTION II: INFORMANT / REPRESENTATIVE ---
  y = drawSectionBanner(doc, 'Part II. Kinatawan o Nag-aaplay (Informant / Representative Details)', y);

  if (representative.isPatientHimself) {
    drawFieldCell(doc, 'Katayuan ng Naglalakad', 'ANG PASYENTE MISMO ANG NAG-AAPLAY (Self-Application)', MARGIN_LEFT, y, USABLE_WIDTH, 8);
    y += 8;
  } else {
    drawFieldCell(doc, 'Pangalan ng Kinatawan', representative.fullName || 'N/A', MARGIN_LEFT, y, col3 * 1.3, 9);
    drawFieldCell(doc, 'Relasyon sa Pasyente', representative.relationshipToPatient || 'N/A', MARGIN_LEFT + col3 * 1.3, y, col3 * 0.8, 9);
    drawFieldCell(doc, 'Numero ng Telepono', representative.contactNumber || 'N/A', MARGIN_LEFT + col3 * 2.1, y, USABLE_WIDTH - col3 * 2.1, 9);
    y += 9;

    drawFieldCell(doc, 'Uri ng Valid ID na Ipinakita', representative.validIdType || 'Government ID', MARGIN_LEFT, y, col2, 8);
    drawFieldCell(doc, 'ID Card Number', representative.validIdNumber || 'N/A', MARGIN_LEFT + col2, y, col2, 8);
    y += 8;
  }

  // --- SECTION III: MEDICAL & HOSPITAL DATA ---
  y = drawSectionBanner(doc, 'Part III. Datos sa Ospital at Medikal (Clinical & Hospital Details)', y);

  drawFieldCell(doc, 'Pangalan ng Ospital (Facility Name)', medCase.hospitalName || 'N/A', MARGIN_LEFT, y, col2, 9);
  const hospTypeLabel = medCase.hospitalType === 'public_doh' ? 'DOH Retained / Specialty' : medCase.hospitalType === 'public_lgu' ? 'LGU / District Hospital' : 'Private Hospital';
  drawFieldCell(doc, 'Klasipikasyon ng Pasilidad', hospTypeLabel, MARGIN_LEFT + col2, y, col4, 9);
  drawFieldCell(doc, 'May Malasakit Desk?', medCase.hasMalasakitCenter ? 'OO (Active Center)' : 'WALA', MARGIN_LEFT + col2 + col4, y, col4, 9);
  y += 9;

  drawFieldCell(doc, 'Opisyal na Diagnosis (Clinical Diagnosis)', medCase.diagnosis || 'N/A', MARGIN_LEFT, y, USABLE_WIDTH - col4, 9);
  drawFieldCell(doc, 'Petsa Na-admit', medCase.dateAdmitted || 'Current Confinement', MARGIN_LEFT + USABLE_WIDTH - col4, y, col4, 9);
  y += 9;

  drawFieldCell(doc, 'Attending Physician (Doktor)', medCase.attendingPhysician || 'Attending Medical Officer', MARGIN_LEFT, y, col2, 8);
  drawFieldCell(doc, 'Physician PRC License No.', medCase.physicianLicenseNo || 'PRC / S2 Verified on Abstract', MARGIN_LEFT + col2, y, col2, 8);
  y += 8;

  // --- SECTION IV: FINANCIAL & BILLING STATEMENT ---
  y = drawSectionBanner(doc, 'Part IV. Kuwenta ng Bayarin at Tulong na Hinihiling (Financial Breakdown)', y);

  const formatPhp = (val: number) => `PHP ${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  drawFieldCell(doc, '1. Kabuuang Bill (Gross Hospital Charges)', formatPhp(medCase.totalHospitalBill), MARGIN_LEFT, y, col4, 9);
  drawFieldCell(doc, '2. PhilHealth Case Rate Bawas', formatPhp(medCase.philhealthDeduction), MARGIN_LEFT + col4, y, col4, 9);
  drawFieldCell(doc, '3. Senior/PWD 20% Discount', formatPhp(medCase.seniorPwdDiscount), MARGIN_LEFT + col2, y, col4, 9);
  drawFieldCell(doc, '4. Netong Balanse na Kailangan ng Tulong', formatPhp(medCase.netRemainingBalance), MARGIN_LEFT + col2 + col4, y, col4, 9);
  y += 9;

  // Recommendation stack summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(200, 200, 200);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 11, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('HINIHILING NA TULONG SA MALASAKIT CENTER DESK (Target Partner Agencies):', MARGIN_LEFT + 2, y + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    '[X] DOH Medical Assistance for Indigent Patients (MAIP)   [X] PCSO Medical Access Program (MAP)   [X] DSWD AICS Food/Meds Guarantee',
    MARGIN_LEFT + 2,
    y + 8.2
  );
  y += 12;

  // --- SECTION V: DECLARATION, APPLICANT SIGNATURE & MSW CERTIFICATION ---
  y = drawSectionBanner(doc, 'Part V. Deklarasyon, Lagda at Social Worker Assessment (Official Certification)', y);

  // Legal text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  const declarationText =
    'Ako ay nagpapatunay sa ilalim ng parusa ng batas (Perjury & RA 11463) na ang lahat ng impormasyong nakatala rito ay totoo at tama sa abot ng aking kaalaman. Pinapayagan ko ang Malasakit Center at DOH/DSWD/PCSO na i-verify ang aking mga rekord alinsunod sa Data Privacy Act of 2012.';
  const splitDec = doc.splitTextToSize(declarationText, USABLE_WIDTH - 4);
  doc.text(splitDec, MARGIN_LEFT + 2, y + 3.5);
  y += 9;

  // Signature and Thumbmark Box
  const sigBoxW = (USABLE_WIDTH - 6) / 3;
  const sigBoxH = 26;

  // Box 1: Applicant Signature
  doc.setDrawColor(120);
  doc.rect(MARGIN_LEFT, y, sigBoxW, sigBoxH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('LAGDA NG NAG-AAPLAY / PETSA', MARGIN_LEFT + 2, y + 3.5);
  doc.line(MARGIN_LEFT + 4, y + 19, MARGIN_LEFT + sigBoxW - 4, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(representative.isPatientHimself ? fullName : representative.fullName || 'Pangalan ng Kinatawan', MARGIN_LEFT + sigBoxW / 2, y + 22.5, { align: 'center' });

  // Box 2: Right Thumbmark
  doc.rect(MARGIN_LEFT + sigBoxW + 3, y, sigBoxW * 0.7, sigBoxH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('KANANG HINLALAKI', MARGIN_LEFT + sigBoxW + 5, y + 3.5);
  doc.setFontSize(6);
  doc.setTextColor(140);
  doc.text('(Right Thumbmark)', MARGIN_LEFT + sigBoxW + 5, y + 6.5);
  doc.setTextColor(0);

  // Box 3: Medical Social Worker Assessment Block
  const mswX = MARGIN_LEFT + sigBoxW + 3 + sigBoxW * 0.7 + 3;
  const mswW = PAGE_WIDTH - MARGIN_RIGHT - mswX;
  doc.rect(mswX, y, mswW, sigBoxH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('PARA SA MEDICAL SOCIAL WORKER (MSW ONLY):', mswX + 2, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Assessment: [  ] Indigent / In Crisis    [  ] Low Income / Financially Incapable', mswX + 2, y + 7.5);
  doc.text('Approved MAIP Assistance: PHP _______________________', mswX + 2, y + 12);
  doc.line(mswX + 4, y + 21, mswX + mswW - 4, y + 21);
  doc.text('Pangalan at Lagda ng Social Worker / License No.', mswX + mswW / 2, y + 24, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100);
  doc.text(
    'TulongPH • Libreng Gabay sa Ayuda ng Gobyerno (RA 11463 Compliant Form) • WALANG BAYAD ANG PAGLALAKAD NG AYUDA',
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 6,
    { align: 'center' }
  );
}

/**
 * 2. DSWD GENERAL INTAKE SHEET / AICS ASSESSMENT FORM
 */
export function buildDSWDIntakeSheet(
  doc: jsPDF,
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase
): void {
  let y = drawOfficialHeader(
    doc,
    'Republika ng Pilipinas • Kagawaran ng Kagalingang Panlipunan at Pagpapaunlad',
    'Department of Social Welfare and Development (DSWD)',
    'General Intake Sheet - Assistance to Individuals in Crisis Situation (AICS)',
    'Crisis Intervention Division / Hospital Satellite Social Service Unit • AO No. 15 Series of 2022'
  );

  const col4 = USABLE_WIDTH / 4;
  const col3 = USABLE_WIDTH / 3;
  const col2 = USABLE_WIDTH / 2;

  // Date and Intake Officer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90);
  doc.text(`Petsa ng Intake: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN_LEFT, y - 1);
  doc.text('Form DSWD-AICS-GIS-Rev2024', PAGE_WIDTH - MARGIN_RIGHT, y - 1, { align: 'right' });

  // --- SECTION I: CLIENT / INFORMANT INFO ---
  y = drawSectionBanner(doc, 'I. Impormasyon ng Kliyente (Client / Claimant Information)', y);

  const clientName = representative.isPatientHimself
    ? `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim()
    : representative.fullName;
  const relationship = representative.isPatientHimself ? 'ANG PASYENTE MISMO (Self)' : representative.relationshipToPatient;

  drawFieldCell(doc, 'Pangalan ng Kliyente (Last, First, Middle)', clientName, MARGIN_LEFT, y, col2, 9);
  drawFieldCell(doc, 'Relasyon sa Benepisyaryo', relationship, MARGIN_LEFT + col2, y, col4, 9);
  drawFieldCell(doc, 'Contact No.', representative.contactNumber || patient.contactNumber || 'N/A', MARGIN_LEFT + col2 + col4, y, col4, 9);
  y += 9;

  const clientAddress = `${patient.address.street}, Brgy. ${patient.address.barangay}, ${patient.address.cityMunicipality}, ${patient.address.province}`;
  drawFieldCell(doc, 'Tirahan ng Kliyente', clientAddress, MARGIN_LEFT, y, col3 * 2, 9);
  drawFieldCell(doc, 'Ipinakitang Valid ID & No.', `${representative.validIdType || 'Gov ID'} - ${representative.validIdNumber || 'N/A'}`, MARGIN_LEFT + col3 * 2, y, col3, 9);
  y += 9;

  // --- SECTION II: BENEFICIARY INFO ---
  y = drawSectionBanner(doc, 'II. Impormasyon ng Benepisyaryo / Pasyente (Beneficiary Information)', y);

  const patientFullName = `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim();
  drawFieldCell(doc, 'Buong Pangalan ng Benepisyaryo', patientFullName, MARGIN_LEFT, y, col2, 9);
  drawFieldCell(doc, 'Kapanganakan (DoB)', patient.dateOfBirth || 'N/A', MARGIN_LEFT + col2, y, col4, 9);
  drawFieldCell(doc, 'Kasarian / Sibil Status', `${(patient.gender || '').toUpperCase()} / ${(patient.civilStatus || '').toUpperCase()}`, MARGIN_LEFT + col2 + col4, y, col4, 9);
  y += 9;

  drawFieldCell(doc, 'PhilHealth PIN', patient.philhealthNumber || 'Indigent / None', MARGIN_LEFT, y, col4, 8);
  drawFieldCell(doc, 'Socioeconomic Status', patient.socioeconomicClass.toUpperCase(), MARGIN_LEFT + col4, y, col4, 8);
  drawFieldCell(doc, 'Tinatayang Buwanang Kita (Monthly Income)', patient.monthlyHouseholdIncome ? `PHP ${patient.monthlyHouseholdIncome.toLocaleString()}` : 'Walang regular na kita', MARGIN_LEFT + col2, y, col2, 8);
  y += 8;

  // --- SECTION III: PROBLEM PRESENTED / EMERGENCY CONTEXT ---
  y = drawSectionBanner(doc, 'III. Sitwasyon at Dahilan ng Paglapit (Problem Presented & Medical Emergency)', y);

  drawFieldCell(doc, 'Pangalan ng Ospital / Health Facility', medCase.hospitalName, MARGIN_LEFT, y, col2, 9);
  drawFieldCell(doc, 'Medikal na Diagnosis', medCase.diagnosis, MARGIN_LEFT + col2, y, col2, 9);
  y += 9;

  const problemNarrative = `Ang benepisyaryo ay kasalukuyang nakikipaglaban sa karamdamang ${medCase.diagnosis} sa ${medCase.hospitalName}. Sa kasalukuyan, may kabuuang bayarin na PHP ${medCase.totalHospitalBill.toLocaleString()} kung saan may natitirang balanse na PHP ${medCase.netRemainingBalance.toLocaleString()} matapos ibawas ang PhilHealth/Senior discounts. Humihiling ng agarang tulong pinansyal / Guarantee Letter sa DSWD AICS para sa gamot, operasyon, o laboratoryo.`;
  doc.setDrawColor(180);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80);
  doc.text('SALAYSAY NG SITWASYON (NARRATIVE OF CRISIS):', MARGIN_LEFT + 2, y + 3.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(0);
  const narrativeLines = doc.splitTextToSize(problemNarrative, USABLE_WIDTH - 4);
  doc.text(narrativeLines, MARGIN_LEFT + 2, y + 6.8);
  y += 14;

  // --- SECTION IV: TYPE OF ASSISTANCE REQUESTED ---
  y = drawSectionBanner(doc, 'IV. Uri ng Tulong na Hinihiling (Assistance Category)', y);

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(180);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 12, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20);
  doc.text(
    '[X] Tulong Medikal / Hospitalization Bill (Guarantee Letter)      [X] Pambili ng Gamot / Prescriptions',
    MARGIN_LEFT + 3,
    y + 4.5
  );
  doc.text(
    '[  ] Laboratory Diagnostics / Dialysis Injections               [  ] Pamasahe Pauwi ng Probinsya / Transportation',
    MARGIN_LEFT + 3,
    y + 9
  );
  y += 12;

  // --- SECTION V: SOCIAL WORKER EVALUATION & SIGNATURES ---
  y = drawSectionBanner(doc, 'V. Rekomendasyon ng Social Worker at Lagda (Social Case Assessment & Approvals)', y);

  const halfW = (USABLE_WIDTH - 4) / 2;
  const boxH = 32;

  // Left: Client Signature
  doc.rect(MARGIN_LEFT, y, halfW, boxH);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(80);
  doc.text('Ako ay sumusumpa na totoo ang lahat ng aking ibinigay na impormasyon.', MARGIN_LEFT + 2, y + 3.5);
  doc.line(MARGIN_LEFT + 6, y + 21, MARGIN_LEFT + halfW - 6, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0);
  doc.text(clientName, MARGIN_LEFT + halfW / 2, y + 24.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Lagda / Kanang Hinlalaki ng Kliyente', MARGIN_LEFT + halfW / 2, y + 28, { align: 'center' });

  // Right: DSWD Social Worker Block
  doc.rect(MARGIN_LEFT + halfW + 4, y, halfW, boxH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SOCIAL WORKER ASSESSMENT & RECOMMENDATION:', MARGIN_LEFT + halfW + 6, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Status: [  ] Eligible for GL / Cash Assistance   [  ] Non-Eligible', MARGIN_LEFT + halfW + 6, y + 7.5);
  doc.text('Recommended Amount: PHP _______________________________', MARGIN_LEFT + halfW + 6, y + 12);
  doc.line(MARGIN_LEFT + halfW + 10, y + 21, MARGIN_LEFT + USABLE_WIDTH - 6, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Social Welfare Officer / Case Worker', MARGIN_LEFT + halfW + 4 + halfW / 2, y + 24.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('License No. / Badge No.', MARGIN_LEFT + halfW + 4 + halfW / 2, y + 28, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100);
  doc.text(
    'TulongPH • DSWD AICS Intake Assistant • Libre ang serbisyo ng pamahalaan. Mag-ingat sa Fixer!',
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 6,
    { align: 'center' }
  );
}

/**
 * 3. HOSPITAL DESK SUBMISSION ROADMAP & CHECKLIST COVER SHEET
 */
export function buildChecklistCoverSheet(
  doc: jsPDF,
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase,
  documents: StoredDocument[]
): void {
  let y = drawOfficialHeader(
    doc,
    'TulongPH Bayanihan Initiative • Hospital Assistance Navigator',
    'Talaan ng mga Dokumento at Gabay sa Pagsusumite',
    'Hospital Filing Packet & Verification Cover Sheet',
    'Ihanda at i-staple ang checklist na ito sa ibabaw ng iyong application forms bago lumapit sa Social Worker Desk'
  );

  const hasName = Boolean(patient.lastName?.trim() || patient.firstName?.trim());
  const fullName = hasName
    ? `${patient.lastName || ''}, ${patient.firstName || ''} ${patient.middleName || ''}`.trim().replace(/^,\s*/, '')
    : 'DELA CRUZ, JUAN';
  const applicantName = representative.isPatientHimself ? fullName : representative.fullName || 'DELA CRUZ, JUAN';

  // Applicant & Patient Box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 17, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PASYENTE: ${fullName.toUpperCase()}`, MARGIN_LEFT + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Ospital: ${medCase.hospitalName} (${medCase.hospitalType.toUpperCase()})`, MARGIN_LEFT + 3, y + 9);
  doc.text(`Diagnosis: ${medCase.diagnosis}`, MARGIN_LEFT + 3, y + 13.5);

  doc.text(`Naglalakad: ${applicantName} (${representative.isPatientHimself ? 'Pasyente' : representative.relationshipToPatient})`, MARGIN_LEFT + USABLE_WIDTH / 2, y + 4.5);
  doc.text(`Netong Balanse: PHP ${medCase.netRemainingBalance.toLocaleString()}`, MARGIN_LEFT + USABLE_WIDTH / 2, y + 9);
  doc.text(`Petsa: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN_LEFT + USABLE_WIDTH / 2, y + 13.5);
  y += 20;

  // --- SECTION: STEP-BY-STEP DESK SEQUENCE ---
  y = drawSectionBanner(doc, 'Tamang Pagkakasunod-sunod ng Paglapit sa Ospital (Submission Sequence)', y);

  const steps = [
    {
      title: 'HAKBANG 1: Billing Section (PhilHealth Bawas)',
      desc: 'Humingi ng Updated Statement of Account (SOA) na may bawas na ng PhilHealth Case Rate at Senior/PWD 20% discount.',
    },
    {
      title: 'HAKBANG 2: Malasakit Center Desk (DOH MAIP)',
      desc: 'Isumite ang Malasakit Unified Application Form kalakip ang Clinical Abstract at SOA para ma-charge sa DOH MAIP pondo.',
    },
    {
      title: 'HAKBANG 3: PCSO & DSWD Satellite Desks',
      desc: 'Para sa nalalabing balanse o pambili ng gamot na wala sa pharmacy ng ospital, ipasa ang DSWD AICS form at PCSO endorsement.',
    },
  ];

  steps.forEach((step, idx) => {
    doc.setDrawColor(210);
    const shade = idx % 2 === 0 ? 255 : 250;
    doc.setFillColor(shade, shade, shade);
    doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 10, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(step.title, MARGIN_LEFT + 2.5, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(70, 70, 70);
    doc.text(step.desc, MARGIN_LEFT + 2.5, y + 7.8);

    y += 10;
  });

  y += 3;

  // --- SECTION: ATTACHED DOCUMENTS CHECKLIST ---
  y = drawSectionBanner(doc, 'Talaan ng mga Kalakip na Dokumento (Required Physical Attachments)', y);

  const requiredDocs = [
    {
      type: 'clinical_abstract',
      title: 'Original Clinical Abstract / Medical Certificate',
      sub: 'May pirma ng doktor at PRC License Number (hindi lalampas sa 3 buwan).',
    },
    {
      type: 'statement_of_account',
      title: 'Certified True Copy ng Hospital SOA / Final Bill',
      sub: 'May opisyal na pirma ng Billing Officer at nakasaad ang bawas ng PhilHealth.',
    },
    {
      type: 'barangay_indigency',
      title: 'Barangay Certificate of Indigency',
      sub: 'Nagsasaad na residente at para sa layunin ng Medical Assistance (Malasakit/DSWD).',
    },
    {
      type: 'patient_valid_id',
      title: 'Photocopy ng Valid Government ID ng Pasyente',
      sub: 'May 3 pirma o specimen signature sa tabi ng photocopy.',
    },
    {
      type: 'representative_valid_id',
      title: 'Photocopy ng Valid Government ID ng Naglalakad / Kinatawan',
      sub: 'May 3 specimen signature at Authorization Letter kung hindi ang pasyente.',
    },
    {
      type: 'social_case_study',
      title: 'Social Case Study Report (SCSR) / CSWD Endorsement',
      sub: 'Kinakailangan kung ang natitirang bill ay lampas PHP 50,000 sa PCSO o Senado.',
    },
  ];

  requiredDocs.forEach((docItem) => {
    const isUploadedInVault = documents.some((d) => d.docType === docItem.type);

    doc.setDrawColor(200);
    doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 9);

    // Checkbox box
    doc.rect(MARGIN_LEFT + 2, y + 2, 5, 5);
    if (isUploadedInVault) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('X', MARGIN_LEFT + 3.2, y + 5.8);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(docItem.title, MARGIN_LEFT + 9, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text(docItem.sub, MARGIN_LEFT + 9, y + 7.5);

    // Status pill on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (isUploadedInVault) {
      doc.setTextColor(22, 101, 52); // green
      doc.text('ATTACHED IN VAULT', PAGE_WIDTH - MARGIN_RIGHT - 2, y + 5.5, { align: 'right' });
    } else {
      doc.setTextColor(153, 27, 27); // red
      doc.text('DALHIN ANG PHOTOCOPY', PAGE_WIDTH - MARGIN_RIGHT - 2, y + 5.5, { align: 'right' });
    }

    y += 9;
  });

  y += 4;

  // Anti-Fixer Warning Callout Box
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 0, 0);
  doc.text('PAALALA LABAN SA MGA FIXER (ANTI-SCAM ADVISORY):', MARGIN_LEFT + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(20, 20, 20);
  doc.text(
    'Ang lahat ng tulong mula sa Malasakit Centers, DOH, PCSO, at DSWD ay 100% LIBRE. Walang bayad ang mga form. Huwag makipag-ugnayan sa sinumang humihingi ng porsyento (10%-30%) o lagay para mapabilis ang Guarantee Letter. I-report ang mga fixer sa 8888 Citizen Complaint Hotline.',
    MARGIN_LEFT + 3,
    y + 8.5,
    { maxWidth: USABLE_WIDTH - 6 }
  );

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100);
  doc.text(
    'TulongPH • Libreng Gabay sa Ayuda ng Gobyerno • www.tulongph.gov.ph (Mock Reference)',
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 6,
    { align: 'center' }
  );
}

/**
 * Appends uploaded image/pdf documents from Vault as supplementary pages.
 */
async function appendVaultAttachments(doc: jsPDF, documents: StoredDocument[]): Promise<void> {
  const attachableDocs = documents.filter((document) => getDocumentAttachmentDataUrl(document));

  for (const docItem of attachableDocs) {
    const attachmentDataUrl = getDocumentAttachmentDataUrl(docItem);
    if (!attachmentDataUrl) continue;

    try {
      doc.addPage();

      // Top label banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0);
      doc.text(`KALAKIP NA DOKUMENTO: ${docItem.fileName.toUpperCase()}`, MARGIN_LEFT, 12);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(90);
      doc.text(
        `Original file size: ${(docItem.originalSize / 1024).toFixed(0)} KB | Verified under 2MB Client-Side`,
        PAGE_WIDTH - MARGIN_RIGHT,
        12,
        { align: 'right' }
      );

      doc.setDrawColor(200);
      doc.line(MARGIN_LEFT, 14, PAGE_WIDTH - MARGIN_RIGHT, 14);

      // Load image to determine aspect ratio
      const img = new Image();
      img.src = attachmentDataUrl;
      await new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => reject();
        }
      });

      // Fit within available page area (210 - 28 = 182mm wide, 297 - 35 = 262mm tall)
      const maxAreaW = USABLE_WIDTH;
      const maxAreaH = PAGE_HEIGHT - 28;

      let drawW = maxAreaW;
      let drawH = (img.height * drawW) / img.width;

      if (drawH > maxAreaH) {
        drawH = maxAreaH;
        drawW = (img.width * drawH) / img.height;
      }

      const drawX = MARGIN_LEFT + (maxAreaW - drawW) / 2;
      const drawY = 18 + (maxAreaH - drawH) / 2;

      doc.addImage(attachmentDataUrl, attachmentDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    } catch {
      // Continue gracefully if a single image fails
    }
  }
}

/**
 * EXPORT 1: Generates standalone Malasakit Center Unified Application Form PDF
 */
export async function generateMalasakitFormPdf(
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  buildMalasakitUnifiedForm(doc, patient, representative, medCase);
  return doc;
}

/**
 * EXPORT 2: Generates standalone DSWD AICS General Intake Sheet PDF
 */
export async function generateDSWDIntakePdf(
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  buildDSWDIntakeSheet(doc, patient, representative, medCase);
  return doc;
}

/**
 * EXPORT 3: Generates standalone Checklist & Cover Sheet PDF
 */
export async function generateChecklistCoverSheetPdf(
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase,
  documents: StoredDocument[]
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  buildChecklistCoverSheet(doc, patient, representative, medCase, documents);
  return doc;
}

/**
 * EXPORT 4: Generates Complete Hospital Desk Packet (Cover Sheet + Malasakit Form + DSWD Form + Optional Vault attachments)
 */
export async function generateCompleteHospitalPacketPdf(
  patient: PatientProfile,
  representative: RepresentativeProfile,
  medCase: MedicalCase,
  documents: StoredDocument[],
  includeVaultAttachments: boolean = true
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page 1: Cover Sheet & Submission Checklist
  buildChecklistCoverSheet(doc, patient, representative, medCase, documents);

  // Page 2: Malasakit Center Unified Intake Form
  doc.addPage();
  buildMalasakitUnifiedForm(doc, patient, representative, medCase);

  // Page 3: DSWD AICS General Intake Sheet
  doc.addPage();
  buildDSWDIntakeSheet(doc, patient, representative, medCase);

  // Subsequent Pages: Vault Attachments (if toggled)
  if (includeVaultAttachments && documents.length > 0) {
    await appendVaultAttachments(doc, documents);
  }

  return doc;
}

/**
 * Helper: Triggers native browser print dialog for a generated jsPDF instance
 */
export function printPdfDocument(doc: jsPDF): void {
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      iframe.focus();
      iframe.contentWindow?.print();
      // Clean up after print dialog is closed or launched
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    }, 500);
  };
}

const PACKET_FOOTER_Y = PAGE_HEIGHT - 8;
const PACKET_CONTENT_BOTTOM = PACKET_FOOTER_Y - 14;
const PACKET_LINE_HEIGHT = 4.2;
const PACKET_TEXT_SIZE = 9;

interface PacketLayoutContext { section: string }
const packetLayoutContexts = new WeakMap<jsPDF, PacketLayoutContext>();

function packetLayoutContext(doc: jsPDF): PacketLayoutContext {
  let context = packetLayoutContexts.get(doc);
  if (!context) {
    context = { section: 'WORKSHEET' };
    packetLayoutContexts.set(doc, context);
  }
  return context;
}

function startPacketContinuationPage(doc: jsPDF): number {
  const context = packetLayoutContext(doc);
  drawPacketFooter(doc, 'CONTINUED');
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PACKET_TEXT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text('TULONGPH WORKSHEET - CONTINUED', MARGIN_LEFT, 13);
  const sectionLines = packetLines(doc, context.section, USABLE_WIDTH, PACKET_TEXT_SIZE);
  doc.text(sectionLines, MARGIN_LEFT, 18);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  const ruleY = 21 + (sectionLines.length - 1) * PACKET_LINE_HEIGHT;
  doc.line(MARGIN_LEFT, ruleY, PAGE_WIDTH - MARGIN_RIGHT, ruleY);
  return ruleY + 5;
}

function ensurePacketSpace(doc: jsPDF, y: number, height: number): number {
  if (y + height <= PACKET_CONTENT_BOTTOM || y <= 24) return y;
  return startPacketContinuationPage(doc);
}

function packetAscii(value: unknown): string {
  return String(value ?? '')
    .replace(/₱/g, 'PHP ')
    .replace(/[•·]/g, '/')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

function packetMoney(value: number): string {
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function packetLines(doc: jsPDF, text: string, width: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(packetAscii(text) || ' ', width);
  return Array.isArray(lines) ? lines : [lines];
}

function drawPacketHeader(doc: jsPDF, agency: string, title: string, legal: string): number {
  packetLayoutContexts.set(doc, { section: title });
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('REPUBLIKA NG PILIPINAS', PAGE_WIDTH / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(packetAscii(agency).toUpperCase(), PAGE_WIDTH / 2, 17, { align: 'center' });
  doc.setFontSize(12);
  const titleLines = packetLines(doc, title.toUpperCase(), USABLE_WIDTH, 12);
  doc.text(titleLines, PAGE_WIDTH / 2, 24, { align: 'center' });
  const titleEnd = 24 + (titleLines.length - 1) * 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(PACKET_TEXT_SIZE);
  const legalLines = packetLines(doc, legal, USABLE_WIDTH, PACKET_TEXT_SIZE);
  doc.text(legalLines, PAGE_WIDTH / 2, titleEnd + 5, { align: 'center' });
  const ruleY = titleEnd + 9 + (legalLines.length - 1) * 3.5;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, ruleY, PAGE_WIDTH - MARGIN_RIGHT, ruleY);
  doc.setLineWidth(0.2);
  return ruleY + 5;
}

function drawPacketMetadata(doc: jsPDF, prefix: string, y: number): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PACKET_TEXT_SIZE);
  doc.setTextColor(40, 40, 40);
  const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Date: ${date}`, MARGIN_LEFT, y);
  doc.text(`${prefix}-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
  return y + 5;
}

function drawPacketSection(doc: jsPDF, title: string, y: number, followingHeight = 24): number {
  packetLayoutContext(doc).section = title;
  y = ensurePacketSpace(doc, y, 8 + followingHeight);
  return drawSectionBanner(doc, title, y) + 2;
}

interface PacketField { label: string; value: string }

function drawPacketFieldRow(doc: jsPDF, fields: PacketField[], y: number): number {
  const gap = 2;
  const width = (USABLE_WIDTH - gap * (fields.length - 1)) / fields.length;
  const heights = fields.map((field) => {
    const lines = packetLines(doc, field.value || '____________________', width - 4, PACKET_TEXT_SIZE);
    return Math.max(12, 7 + lines.length * PACKET_LINE_HEIGHT);
  });
  const height = Math.max(...heights);
  y = ensurePacketSpace(doc, y, height);
  fields.forEach((field, index) => {
    const x = MARGIN_LEFT + index * (width + gap);
    doc.setDrawColor(165, 165, 165);
    doc.setLineWidth(0.2);
    doc.rect(x, y, width, height);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(packetAscii(field.label).toUpperCase(), x + 2, y + 3.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(0, 0, 0);
    const lines = packetLines(doc, field.value || '____________________', width - 4, PACKET_TEXT_SIZE);
    doc.text(lines, x + 2, y + 7.2);
  });
  return y + height + 1;
}

function drawPacketKeyValueRows(doc: jsPDF, rows: PacketField[], y: number, valueWidth = USABLE_WIDTH * 0.58): number {
  const labelWidth = USABLE_WIDTH - valueWidth;
  rows.forEach(({ label, value }) => {
    const labelLines = packetLines(doc, label, labelWidth - 4, PACKET_TEXT_SIZE);
    const valueLines = packetLines(doc, value || '____________________', valueWidth - 5, PACKET_TEXT_SIZE);
    const height = Math.max(9, 4.5 + Math.max(labelLines.length, valueLines.length) * PACKET_LINE_HEIGHT);
    y = ensurePacketSpace(doc, y, height);
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.2);
    doc.setFillColor(249, 249, 249);
    doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, height, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(30, 30, 30);
    doc.text(labelLines, MARGIN_LEFT + 2, y + 4.4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.text(valueLines, MARGIN_LEFT + labelWidth + 2, y + 4.4);
    y += height;
  });
  return y;
}

function drawPacketTable(doc: jsPDF, headers: string[], rows: string[][], y: number, widths: number[]): number {
  const drawRow = (cells: string[][], isHeader: boolean, height: number, rowY: number) => {
    let x = MARGIN_LEFT;
    cells.forEach((lines, index) => {
      doc.setDrawColor(155, 155, 155);
      doc.setLineWidth(0.2);
      if (isHeader) doc.setFillColor(232, 232, 232);
      else doc.setFillColor(255, 255, 255);
      doc.rect(x, rowY, widths[index], height, 'FD');
      doc.setFont('helvetica', isHeader || index === 0 ? 'bold' : 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      if (lines.length) doc.text(lines, x + 2, rowY + 4.3);
      x += widths[index];
    });
  };
  const headerLines = headers.map((cell, index) => packetLines(doc, cell, widths[index] - 4, PACKET_TEXT_SIZE));
  const headerHeight = Math.max(8, 4 + Math.max(...headerLines.map((lines) => lines.length)) * PACKET_LINE_HEIGHT);
  const drawHeader = () => {
    drawRow(headerLines, true, headerHeight, y);
    y += headerHeight;
  };
  let headerDrawn = false;

  rows.forEach((row) => {
    const rowLines = row.map((cell, index) => packetLines(doc, cell, widths[index] - 4, PACKET_TEXT_SIZE));
    const lineCount = Math.max(...rowLines.map((lines) => lines.length));
    const fullHeight = Math.max(8, 4 + lineCount * PACKET_LINE_HEIGHT);
    const maxLinesPerPage = Math.floor((PACKET_CONTENT_BOTTOM - 28 - headerHeight - 4) / PACKET_LINE_HEIGHT);

    if (lineCount <= maxLinesPerPage) {
      const required = fullHeight + (headerDrawn ? 0 : headerHeight);
      if (y + required > PACKET_CONTENT_BOTTOM) {
        y = startPacketContinuationPage(doc);
        headerDrawn = false;
      }
      if (!headerDrawn) {
        drawHeader();
        headerDrawn = true;
      }
      if (y + fullHeight > PACKET_CONTENT_BOTTOM) {
        y = startPacketContinuationPage(doc);
        drawHeader();
      }
      drawRow(rowLines, false, fullHeight, y);
      y += fullHeight;
      return;
    }

    if (!headerDrawn) {
      y = ensurePacketSpace(doc, y, headerHeight + PACKET_LINE_HEIGHT + 4);
      drawHeader();
      headerDrawn = true;
    }
    let offset = 0;
    while (offset < lineCount) {
      let availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - 4) / PACKET_LINE_HEIGHT);
      if (availableLines < 1) {
        y = startPacketContinuationPage(doc);
        drawHeader();
        availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - 4) / PACKET_LINE_HEIGHT);
      }
      const count = Math.min(availableLines, lineCount - offset);
      const chunk = rowLines.map((lines) => lines.slice(offset, offset + count));
      const height = Math.max(8, 4 + count * PACKET_LINE_HEIGHT);
      drawRow(chunk, false, height, y);
      y += height;
      offset += count;
      if (offset < lineCount) {
        y = startPacketContinuationPage(doc);
        drawHeader();
      }
    }
    headerDrawn = true;
  });
  return ensurePacketSpace(doc, y, 2) + 2;
}

function drawPacketParagraph(doc: jsPDF, label: string, text: string, y: number, box = true): number {
  const lines = packetLines(doc, text, USABLE_WIDTH - 6, PACKET_TEXT_SIZE);
  const labelLines = packetLines(doc, label.toUpperCase(), USABLE_WIDTH - 4, PACKET_TEXT_SIZE);
  const labelHeight = Math.max(4.2, labelLines.length * PACKET_LINE_HEIGHT) + 3;
  const maxSinglePageLines = Math.floor((PACKET_CONTENT_BOTTOM - 28 - labelHeight - 2) / PACKET_LINE_HEIGHT);
  if (lines.length <= maxSinglePageLines) {
    y = ensurePacketSpace(doc, y, labelHeight + lines.length * PACKET_LINE_HEIGHT + 2);
    const height = Math.max(10, labelHeight + lines.length * PACKET_LINE_HEIGHT + 1);
    if (box) {
      doc.setDrawColor(175, 175, 175);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, height);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(30, 30, 30);
    doc.text(labelLines, MARGIN_LEFT + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(0, 0, 0);
    doc.text(lines, MARGIN_LEFT + 2, y + labelHeight);
    return y + height + 2;
  }

  let offset = 0;
  while (offset < lines.length) {
    const continuationLabel = packetLines(doc, `${label.toUpperCase()}${offset ? ' (CONTINUED)' : ''}`, USABLE_WIDTH - 4, PACKET_TEXT_SIZE);
    const continuationLabelHeight = Math.max(4.2, continuationLabel.length * PACKET_LINE_HEIGHT) + 3;
    const availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - continuationLabelHeight - 2) / PACKET_LINE_HEIGHT);
    if (availableLines < 1) {
      y = startPacketContinuationPage(doc);
      continue;
    }
    const count = Math.min(availableLines, lines.length - offset);
    const height = Math.max(10, continuationLabelHeight + count * PACKET_LINE_HEIGHT + 1);
    if (box) {
      doc.setDrawColor(175, 175, 175);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, height);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(30, 30, 30);
    doc.text(continuationLabel, MARGIN_LEFT + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(0, 0, 0);
    doc.text(lines.slice(offset, offset + count), MARGIN_LEFT + 2, y + continuationLabelHeight);
    y += height + 2;
    offset += count;
    if (offset < lines.length) y = startPacketContinuationPage(doc);
  }
  return y;
}

function drawPacketChecklist(doc: jsPDF, items: string[], y: number, documents: StoredDocument[] = [], pillar?: DocumentPillar): number {
  const list = items.length ? items : ['Ask the school or agency to confirm the current documentary requirements.'];
  const gap = 5;
  const columnWidth = (USABLE_WIDTH - gap) / 2;
  for (let index = 0; index < list.length; index += 2) {
    const pair = list.slice(index, index + 2);
    const lines = pair.map((item) => {
      const status = pillar ? getChecklistDocumentStatus(item, documents, pillar) : undefined;
      const marker = status?.status === 'ready' ? '[x]' : '[ ]';
      const attachmentState = status?.status === 'over-limit' ? ' (over 2 MB)'
        : status?.status === 'download-only' ? ' (download separately)'
          : '';
      return packetLines(doc, `${marker} ${item}${attachmentState}`, columnWidth - 2, PACKET_TEXT_SIZE);
    });
    const rowHeight = Math.max(6, Math.max(...lines.map((itemLines) => itemLines.length)) * PACKET_LINE_HEIGHT + 0.6);
    y = ensurePacketSpace(doc, y, rowHeight);
    pair.forEach((item, column) => {
      const x = MARGIN_LEFT + column * (columnWidth + gap);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      doc.text(lines[column], x, y + 4);
    });
    y += rowHeight;
  }
  return y + 2;
}

interface PacketReference { name: string; details: string[] }

function drawPacketReferenceCards(doc: jsPDF, references: PacketReference[], y: number): number {
  const width = USABLE_WIDTH;
  packetLayoutContext(doc).section = 'STATUTORY AND PROGRAM REFERENCES';
  references.forEach((reference) => {
    const title = packetLines(doc, reference.name, width - 6, PACKET_TEXT_SIZE);
    const details = packetLines(doc, reference.details.join(' | '), width - 6, PACKET_TEXT_SIZE);
    const height = Math.max(12, 4 + (title.length + details.length) * PACKET_LINE_HEIGHT);
    const maxCardHeight = PACKET_CONTENT_BOTTOM - 28;
    if (height <= maxCardHeight) {
      y = ensurePacketSpace(doc, y, height);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, width, height);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      doc.text(title, MARGIN_LEFT + 3, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.text(details, MARGIN_LEFT + 3, y + 3.5 + title.length * PACKET_LINE_HEIGHT);
      y += height + 0.5;
      return;
    }

    let offset = 0;
    while (offset < details.length) {
      const cardTitle = packetLines(doc, `${reference.name}${offset ? ' (CONTINUED)' : ''}`, width - 6, PACKET_TEXT_SIZE);
      const availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - 4 - cardTitle.length * PACKET_LINE_HEIGHT) / PACKET_LINE_HEIGHT);
      if (availableLines < 1) {
        y = startPacketContinuationPage(doc);
        continue;
      }
      const count = Math.min(availableLines, details.length - offset);
      const cardHeight = Math.max(12, 4 + (cardTitle.length + count) * PACKET_LINE_HEIGHT);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, width, cardHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      doc.text(cardTitle, MARGIN_LEFT + 3, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.text(details.slice(offset, offset + count), MARGIN_LEFT + 3, y + 3.5 + cardTitle.length * PACKET_LINE_HEIGHT);
      y += cardHeight + 0.5;
      offset += count;
      if (offset < details.length) y = startPacketContinuationPage(doc);
    }
  });
  return y;
}

function drawPacketFooter(doc: jsPDF, pageLabel: string): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 55, 55);
  doc.text('TulongPH is 100% free. Government assistance applications are free. Never pay fixers.', PAGE_WIDTH / 2, PACKET_FOOTER_Y - 4, { align: 'center' });
  doc.text('After public computer use, wipe this device data. This worksheet is guidance, not an approval.', PAGE_WIDTH / 2, PACKET_FOOTER_Y, { align: 'center' });
  doc.text(pageLabel, MARGIN_LEFT, PACKET_FOOTER_Y);
}

function educationReferences(profile: StudentEducationProfile): { programs: EducationProgram[]; result: ReturnType<typeof evaluateEducationAssistance> } {
  const result = evaluateEducationAssistance(profile);
  const programs = [...new Map([
    ...(result.tuitionProgram ? [result.tuitionProgram] : []),
    ...result.primaryPrograms.filter((match) => !result.selectedPrimary || match === result.selectedPrimary).map((match) => match.program),
    ...result.supplementalPrograms.filter((match) => !match.requiresPrimaryProgram || match.requiresPrimaryProgram === result.selectedPrimary?.program.id).map((match) => match.program),
  ].map((program) => [program.id, program])).values()];
  return { programs, result };
}

export async function generateEducationPacketPdf(
  profile: StudentEducationProfile,
  recipient: string,
  documents: StoredDocument[] = [],
  includeVaultAttachments = false
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
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
  if (includeVaultAttachments) await appendVaultAttachments(doc, documents);
  return doc;
}

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

export async function generateWorkerWorksheetPdf(
  profile: WorkerProfileInput,
  fields: WorkerWorksheetFields,
  selectedWorksheet: WorkerWorksheetSelection,
  documents: StoredDocument[] = [],
  includeVaultAttachments = false
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
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
  if (includeVaultAttachments) await appendVaultAttachments(doc, documents);
  return doc;
}
