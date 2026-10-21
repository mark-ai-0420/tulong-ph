import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultEducationProfile } from '../src/lib/educationEngine.ts';
import { defaultWorkerProfile } from '../src/lib/workerBenefitsCalculator.ts';
import { generateEducationPacketPdf, generateWorkerWorksheetPdf } from '../src/lib/pdfGenerator.ts';

const worksheet = {
  worksheetName: 'Test Worker',
  worksheetEmployer: 'Test Employer',
  worksheetEmployerAddress: 'Manila',
  worksheetStartDate: '2020-01-01',
  worksheetEndDate: '2025-01-01',
  worksheetUnpaidDetails: 'Unpaid wages, PHP 1000 due, PHP 0 received',
  worksheetEventDetails: 'Work-related event at workplace',
  worksheetProjectTitle: 'Test livelihood project, Manila',
  worksheetProposedBudget: 'Tools, PHP 10000',
};

function assertPdfDocument(pdf) {
  assert.equal(typeof pdf.output, 'function');
  assert.equal(typeof pdf.getNumberOfPages, 'function');
  assert.equal(typeof pdf.internal.pageSize.getWidth, 'function');
  assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - 210) < 0.01);
}

function assertPacketPageBounds(pdf) {
  const pageHeightPoints = pdf.internal.pageSize.getHeight() * 72 / 25.4;
  for (const [pageIndex, page] of pdf.internal.pages.slice(1).entries()) {
    const textBlocks = page.join('\n').matchAll(/BT([\s\S]*?)ET/g);
    for (const [, block] of textBlocks) {
      const position = [...block.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td/g)].at(-1);
      if (!position) continue;
      const baseline = Number(position[2]);
      const leading = Number(block.match(/(-?\d+(?:\.\d+)?)\s+TL/)?.[1] ?? 0);
      const textLineCount = [...block.matchAll(/\bTj\b/g)].length;
      const lastBaseline = baseline - leading * Math.max(0, textLineCount - 1);
      assert.ok(baseline >= 0 && baseline <= pageHeightPoints, `text starts outside page ${pageIndex + 1}`);
      assert.ok(lastBaseline >= 0 && lastBaseline <= pageHeightPoints, `text ends outside page ${pageIndex + 1}`);
    }

    for (const [, fontSize] of page.join('\n').matchAll(/([\d.]+)\s+Tf/g)) {
      assert.ok(Number(fontSize) >= 8.5, `packet font size ${fontSize}pt is below 8.5pt on page ${pageIndex + 1}`);
    }
  }
}

function assertPacketContentBounds(pdf) {
  const pageHeightPoints = pdf.internal.pageSize.getHeight() * 72 / 25.4;
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const footerText = [
    'TulongPH is 100% free. Government assistance applications are free. Never pay fixers.',
    'After public computer use, wipe this device data. This worksheet is guidance, not an approval.',
    'SENA', 'LIVELIHOOD', 'CONTINUED',
  ];

  for (const [pageIndex, page] of pdf.internal.pages.slice(1).entries()) {
    const stream = page.join('\n');
    const rectangles = [...stream.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+re\b/g)];
    for (const [, , y, , height] of rectangles) {
      const firstEdgeMm = (pageHeightPoints - Number(y)) * 25.4 / 72;
      const secondEdgeMm = (pageHeightPoints - Number(y) - Number(height)) * 25.4 / 72;
      const rectangleBottomMm = Math.max(firstEdgeMm, secondEdgeMm);
      assert.ok(rectangleBottomMm <= 275.01, `rectangle ends at ${rectangleBottomMm.toFixed(2)}mm on page ${pageIndex + 1}`);
    }

    for (const [, block] of stream.matchAll(/BT([\s\S]*?)ET/g)) {
      const strings = [...block.matchAll(/\(((?:\\.|[^)])*)\)\s*Tj/g)].map(([, value]) => value);
      if (strings.some((value) => footerText.includes(value))) continue;

      const position = [...block.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td/g)].at(-1);
      if (!position) continue;
      const baseline = Number(position[2]);
      const leading = Number(block.match(/(-?\d+(?:\.\d+)?)\s+TL/)?.[1] ?? 0);
      const textLineCount = [...block.matchAll(/\bTj\b/g)].length;
      const lastBaseline = baseline - leading * Math.max(0, textLineCount - 1);
      const fontSize = Math.max(0, ...[...block.matchAll(/([\d.]+)\s+Tf/g)].map(([, size]) => Number(size)));
      const textBottomMm = pageHeightMm - lastBaseline * 25.4 / 72 + fontSize * 25.4 / 72;
      assert.ok(textBottomMm <= 275.01, `text ends at ${textBottomMm.toFixed(2)}mm on page ${pageIndex + 1}`);
    }
  }
}

const maxText = 'W'.repeat(2000);
const maximumWorksheet = {
  worksheetName: 'W'.repeat(200),
  worksheetEmployer: 'W'.repeat(200),
  worksheetEmployerAddress: 'W'.repeat(200),
  worksheetStartDate: 'W'.repeat(10),
  worksheetEndDate: 'W'.repeat(10),
  worksheetUnpaidDetails: maxText,
  worksheetEventDetails: maxText,
  worksheetProjectTitle: 'W'.repeat(200),
  worksheetProposedBudget: maxText,
};

test('education packet is a readable paginated jsPDF with expected sections', async () => {
  const profile = {
    ...defaultEducationProfile,
    fullName: 'Test Student',
    schoolName: 'Test State University',
    schoolType: 'suc_luc',
    schoolParticipates: true,
    province: 'Metro Manila',
    barangay: 'Barangay Test',
    cityMunicipality: 'Manila',
    annualTuitionAndFees: 80000,
    gwa: 96,
    annualHouseholdIncome: 100000,
    is4PsOrListahanan: true,
    isPWD: true,
    isSoloParentDependent: true,
    isOWWADependent: true,
    owwaActive: true,
    ofwMonthlySalaryUSD: 1000,
    isDeceasedOFWDependent: true,
    isCoconutFarmerDependent: true,
    coconutPriorityCourse: true,
    isGSISDependent: true,
    isTop10PublicHS: true,
    hasFamilyCrisis: true,
    hasNC3OrHigher: true,
    needsLicensureReimbursement: true,
    dostQualifiedSchool: true,
    priorityCourse: true,
    isSTEMGraduateOrTop5: true,
    willingReturnService: true,
    noLocalSUC: true,
  };
  const pdf = await generateEducationPacketPdf(profile, 'CHED Scholarship Coordinator');

  assertPdfDocument(pdf);
  assertPacketPageBounds(pdf);
  assert.ok(pdf.getNumberOfPages() >= 2);
  assert.ok(pdf.getNumberOfPages() > 0);
  const content = pdf.internal.pages.slice(1).flat().join(' ');
  for (const section of ['UNIFIED EDUCATIONAL ASSISTANCE', 'PART I:', 'PART II:', 'PART III:', 'PART IV:', 'DOCUMENTARY CHECKLIST']) {
    assert.ok(content.includes(section), `missing expected PDF section: ${section}`);
  }
  assert.ok(content.includes('Free Higher Education'));
  const secondPage = pdf.internal.pages[2].join(' ');
  const secondPageTextY = [...secondPage.matchAll(/(-?\d+(?:\.\d+)?)\s+Td/g)].map(match => Number(match[1]));
  const secondPageBodyY = secondPageTextY.slice(0, -3);
  assert.ok(Math.min(...secondPageBodyY) > 40, 'references stay above the page footer');
});

for (const selection of ['all', 'sena', 'notice', 'ecc', 'livelihood']) {
  test(`worker packet generates for ${selection}`, async () => {
    const pdf = await generateWorkerWorksheetPdf(defaultWorkerProfile, worksheet, selection);
    assertPdfDocument(pdf);
    assert.ok(pdf.getNumberOfPages() > 0);
    if (selection === 'all') assert.ok(pdf.getNumberOfPages() >= 6);
    assert.ok(pdf.output('arraybuffer').byteLength > 1000);
  });
}

for (const selection of ['sena', 'notice', 'ecc', 'livelihood']) {
  test(`worker ${selection} paginates maximum-length inputs within page bounds`, async () => {
    const pdf = await generateWorkerWorksheetPdf(defaultWorkerProfile, maximumWorksheet, selection);
    assertPdfDocument(pdf);
    assert.ok(pdf.getNumberOfPages() > 1, `${selection} should paginate at the worksheet character limits`);
    assertPacketPageBounds(pdf);

    if (selection === 'livelihood') {
      const budgetWorksheet = { ...worksheet, worksheetProposedBudget: maxText };
      const budgetPdf = await generateWorkerWorksheetPdf(defaultWorkerProfile, budgetWorksheet, 'livelihood');
      const text = budgetPdf.internal.pages.slice(1).flat().join('\n');
      const renderedBudgetLength = [...text.matchAll(/W{10,}/g)].reduce((total, [run]) => total + run.length, 0);
      assert.ok(Math.abs(renderedBudgetLength - budgetWorksheet.worksheetProposedBudget.length) <= 10, 'budget text is rendered once');
      assert.ok(text.includes('See itemized budget above.'), 'total row points to the itemized budget without repeating it');
      assert.ok(budgetPdf.getNumberOfPages() > 1, 'the maximum-length budget paginates');
      assertPacketPageBounds(budgetPdf);
    }
  });
}

for (const [selection, field, length] of [
  ['sena', 'worksheetUnpaidDetails', 1910],
  ['livelihood', 'worksheetProposedBudget', 1520],
]) {
  test(`worker ${selection} table stays above 275mm at ${length} characters`, async () => {
    const input = { ...worksheet, [field]: 'W'.repeat(length) };
    const pdf = await generateWorkerWorksheetPdf(defaultWorkerProfile, input, selection);
    assertPdfDocument(pdf);
    assertPacketPageBounds(pdf);
    assertPacketContentBounds(pdf);

    const rendered = pdf.internal.pages.slice(1).flat().join('\n');
    const renderedLength = [...rendered.matchAll(/W{10,}/g)].reduce((total, [run]) => total + run.length, 0);
    assert.ok(Math.abs(renderedLength - length) <= 10, `${selection} table text is rendered once`);
  });
}
