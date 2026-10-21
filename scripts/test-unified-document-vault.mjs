import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getStandardizedDocFileName } from '../src/lib/compressor.ts';
import {
  DOCUMENT_SLOTS,
  getAttachableDocuments,
  getChecklistDocumentType,
  getChecklistDocumentStatus,
  getDocumentSlotsForPillar,
  getProgramReadiness,
} from '../src/lib/documentVault.ts';
import { defaultEducationProfile } from '../src/lib/educationEngine.ts';
import { generateEducationPacketPdf, generateWorkerWorksheetPdf } from '../src/lib/pdfGenerator.ts';
import { defaultWorkerProfile } from '../src/lib/workerBenefitsCalculator.ts';

const newTypes = {
  certificate_of_enrollment: 'CertificateOfEnrollment',
  academic_grades: 'AcademicGrades',
  income_tax_return: 'IncomeTaxReturn',
  payslip_payroll: 'PayslipPayroll',
  certificate_of_employment: 'CertificateOfEmployment',
  incident_logbook: 'IncidentLogbook',
};

const storedImage = {
  id: 'academic_grades_1',
  docType: 'academic_grades',
  fileName: 'Santos_AcademicGrades.pdf',
  originalSize: 1200,
  compressedSize: 900,
  mimeType: 'application/pdf',
  dataUrl: 'data:application/pdf;base64,AA==',
  attachmentDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pZcAAAAASUVORK5CYII=',
  uploadedAt: '2026-01-01T00:00:00.000Z',
  isCompliantUnder2MB: true,
};

const workerFields = {
  worksheetName: 'Test Worker',
  worksheetEmployer: 'Test Employer',
  worksheetEmployerAddress: 'Manila',
  worksheetStartDate: '2020-01-01',
  worksheetEndDate: '2025-01-01',
  worksheetUnpaidDetails: 'Unpaid wages',
  worksheetEventDetails: 'Work-related event',
  worksheetProjectTitle: 'Test livelihood project',
  worksheetProposedBudget: 'Tools and supplies',
};

test('all six new document types have stable standardized PDF filenames', () => {
  for (const [type, label] of Object.entries(newTypes)) {
    assert.equal(getStandardizedDocFileName('Santos', type), `Santos_${label}.pdf`);
  }
});

test('document slots include shared and pillar-specific documents', () => {
  assert.equal(DOCUMENT_SLOTS.length, 16);
  const medicalTypes = getDocumentSlotsForPillar('medical').map((slot) => slot.type);
  const educationTypes = getDocumentSlotsForPillar('education').map((slot) => slot.type);
  const workerTypes = getDocumentSlotsForPillar('worker').map((slot) => slot.type);

  assert.ok(medicalTypes.includes('statement_of_account'));
  assert.ok(educationTypes.includes('certificate_of_enrollment'));
  assert.ok(educationTypes.includes('academic_grades'));
  assert.ok(educationTypes.includes('income_tax_return'));
  assert.ok(workerTypes.includes('payslip_payroll'));
  assert.ok(workerTypes.includes('certificate_of_employment'));
  assert.ok(workerTypes.includes('incident_logbook'));
  assert.ok(!medicalTypes.includes('certificate_of_enrollment'));
  assert.ok(!workerTypes.includes('academic_grades'));
  for (const pillar of ['medical', 'education', 'worker']) {
    assert.ok(getDocumentSlotsForPillar(pillar).some((slot) => slot.type === 'patient_valid_id'));
  }
});

test('program readiness and checklist status use compliant vault documents', () => {
  const documents = [storedImage, {
    ...storedImage,
    id: 'certificate_of_enrollment_1',
    docType: 'certificate_of_enrollment',
  }, {
    ...storedImage,
    id: 'patient_valid_id_1',
    docType: 'patient_valid_id',
  }];
  const educationReadiness = getProgramReadiness(documents, 'education');
  assert.deepEqual(educationReadiness.find((entry) => entry.program === 'CHED'), { program: 'CHED', ready: 3, total: 5 });
  assert.deepEqual(getChecklistDocumentStatus('Current certificate of enrollment', documents, 'education'), {
    docType: 'certificate_of_enrollment', status: 'ready',
  });
  assert.deepEqual(getChecklistDocumentStatus('Recent payslip or payroll record', documents, 'worker'), {
    docType: 'payslip_payroll', status: 'missing',
  });
  assert.equal(getAttachableDocuments(documents).length, 3);
  assert.equal(getAttachableDocuments([{ ...storedImage, isCompliantUnder2MB: false }]).length, 0);
});

test('specialized ID checklist items are not satisfied by the applicant valid ID slot', () => {
  const patientId = { ...storedImage, id: 'patient_valid_id_1', docType: 'patient_valid_id' };
  for (const item of ['Solo parent ID if applicable', 'PWD ID', 'Solo parent valid ID if applicable', 'PWD valid ID']) {
    assert.equal(getChecklistDocumentType(item, 'education'), undefined);
    assert.equal(getChecklistDocumentStatus(item, [patientId], 'education'), undefined);
  }

  assert.equal(getChecklistDocumentType('Current valid ID', 'education'), 'patient_valid_id');
  assert.deepEqual(getChecklistDocumentStatus('Current valid ID', [patientId], 'education'), {
    docType: 'patient_valid_id', status: 'ready',
  });
});

test('compound medical checklist items require compliant clinical abstracts and prescriptions', () => {
  const item = 'Medical certificate, clinical abstract, and prescriptions';
  const clinicalAbstract = { ...storedImage, id: 'clinical_abstract_1', docType: 'clinical_abstract' };
  const prescription = { ...storedImage, id: 'doctor_prescription_1', docType: 'doctor_prescription' };

  assert.deepEqual(getChecklistDocumentStatus(item, [clinicalAbstract], 'worker'), {
    docType: 'clinical_abstract', status: 'missing',
  });
  assert.deepEqual(getChecklistDocumentStatus(item, [prescription], 'worker'), {
    docType: 'clinical_abstract', status: 'missing',
  });
  assert.deepEqual(getChecklistDocumentStatus(item, [clinicalAbstract, prescription], 'worker'), {
    docType: 'clinical_abstract', status: 'ready',
  });
  assert.deepEqual(getChecklistDocumentStatus(item, [{ ...clinicalAbstract, isCompliantUnder2MB: false }, prescription], 'worker'), {
    docType: 'clinical_abstract', status: 'over-limit',
  });
  assert.deepEqual(getChecklistDocumentStatus(item, [clinicalAbstract, { ...prescription, isCompliantUnder2MB: false }], 'worker'), {
    docType: 'clinical_abstract', status: 'over-limit',
  });
});

test('medical abstract and prescriptions checklist items require both documents', () => {
  const item = 'Medical abstract and prescriptions';
  const clinicalAbstract = { ...storedImage, id: 'clinical_abstract_1', docType: 'clinical_abstract' };
  const prescription = { ...storedImage, id: 'doctor_prescription_1', docType: 'doctor_prescription' };

  assert.deepEqual(getChecklistDocumentStatus(item, [prescription], 'worker'), {
    docType: 'clinical_abstract', status: 'missing',
  });
  assert.deepEqual(getChecklistDocumentStatus(item, [clinicalAbstract], 'worker'), {
    docType: 'clinical_abstract', status: 'missing',
  });
  assert.deepEqual(getChecklistDocumentStatus(item, [clinicalAbstract, prescription], 'worker'), {
    docType: 'clinical_abstract', status: 'ready',
  });
});

test('education and worker PDFs append compliant vault images only when enabled', async () => {
  const originalImage = globalThis.Image;
  globalThis.Image = class {
    complete = true;
    width = 1;
    height = 1;
    set src(value) { this.source = value; }
  };

  try {
    const educationBase = await generateEducationPacketPdf(defaultEducationProfile, 'CHED');
    const educationWithoutAttachments = await generateEducationPacketPdf(defaultEducationProfile, 'CHED', [storedImage], false);
    const educationWithAttachments = await generateEducationPacketPdf(defaultEducationProfile, 'CHED', [storedImage], true);
    assert.equal(educationWithoutAttachments.getNumberOfPages(), educationBase.getNumberOfPages());
    assert.equal(educationWithAttachments.getNumberOfPages(), educationBase.getNumberOfPages() + 1);

    const workerBase = await generateWorkerWorksheetPdf(defaultWorkerProfile, workerFields, 'all');
    const workerWithoutAttachments = await generateWorkerWorksheetPdf(defaultWorkerProfile, workerFields, 'all', [storedImage], false);
    const workerWithAttachments = await generateWorkerWorksheetPdf(defaultWorkerProfile, workerFields, 'all', [storedImage], true);
    assert.equal(workerWithoutAttachments.getNumberOfPages(), workerBase.getNumberOfPages());
    assert.equal(workerWithAttachments.getNumberOfPages(), workerBase.getNumberOfPages() + 1);
  } finally {
    if (originalImage) globalThis.Image = originalImage;
    else delete globalThis.Image;
  }
});

test('vault component keeps the requested accessible upload affordances', async () => {
  const component = await readFile(new URL('../src/components/DocumentVault.tsx', import.meta.url), 'utf8');
  const pdfGenerator = await readFile(new URL('../src/lib/pdfGenerator.ts', import.meta.url), 'utf8');
  assert.ok(!component.includes('\u2014'), 'DocumentVault.tsx must not contain em dashes');
  assert.match(component, /autoComplete="off"/);
  assert.match(component, /min-h-\[44px\]/);
  assert.match(pdfGenerator, /if \(includeVaultAttachments\) await appendVaultAttachments\(doc, documents\)/);
});
