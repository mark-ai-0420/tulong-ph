import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  filterGenericMedicines,
  GENERIC_MEDICINES,
  getDoctorRequestScript,
  getPrescriptionChecklist,
} from '../src/lib/data/genericPrescriptionGuide.ts';

const languages = ['taglish', 'cebuano', 'ilocano', 'en'];

test('medicine catalog searches generic names, Philippine brand examples, and categories', () => {
  assert.ok(filterGenericMedicines('Biogesic').some(({ genericName }) => genericName === 'Paracetamol'));
  assert.ok(filterGenericMedicines('Norvasc').some(({ genericName }) => genericName === 'Amlodipine'));
  assert.ok(filterGenericMedicines('Ceftriaxone').some(({ id }) => id === 'ceftriaxone'));
  assert.ok(filterGenericMedicines('antibiotic').some(({ id }) => id === 'amoxicillin'));
  assert.ok(filterGenericMedicines('', 'critical_inpatient').some(({ id }) => id === 'meropenem'));
  assert.ok(filterGenericMedicines('Losec', 'gastrointestinal').some(({ id }) => id === 'omeprazole'));
  assert.deepEqual(filterGenericMedicines('Norvasc', 'antibiotic'), []);
});

test('Allerkid searches as cetirizine and chlorphenamine brands remain separate', () => {
  assert.deepEqual(filterGenericMedicines('Allerkid').map(({ id }) => id), ['cetirizine']);
  assert.deepEqual(filterGenericMedicines('Antamin').map(({ id }) => id), ['chlorphenamine']);
});

test('catalog contains seven requested categories and the current 21-medicine YAKAP list', () => {
  const categories = new Set(GENERIC_MEDICINES.map(({ therapeuticCategory }) => therapeuticCategory));
  for (const category of [
    'antibiotic',
    'cardiovascular',
    'diabetes_endocrine',
    'pain_analgesic',
    'respiratory',
    'gastrointestinal',
    'critical_inpatient',
  ]) assert.ok(categories.has(category), `${category} category is present`);

  const covered = GENERIC_MEDICINES.filter(({ konsultaCovered }) => konsultaCovered);
  assert.equal(covered.length, 21);
  assert.ok(covered.every(({ pnfListed }) => pnfListed));
  assert.deepEqual(covered.map(({ id }) => id).sort(), [
    'amoxicillin',
    'amlodipine',
    'aspirin',
    'chlorphenamine',
    'ciprofloxacin',
    'clarithromycin',
    'co-amoxiclav',
    'cotrimoxazole',
    'enalapril',
    'fluticasone-salmeterol',
    'gliclazide',
    'hydrochlorothiazide',
    'losartan',
    'metformin',
    'metoprolol',
    'nitrofurantoin',
    'oral-rehydration-salts',
    'paracetamol',
    'prednisone',
    'salbutamol',
    'simvastatin',
  ].sort());
});

test('prescription checklist has six translated checks and attributes only the generic-name rule to RA 6675', async () => {
  for (const language of languages) {
    const checklist = getPrescriptionChecklist(language);
    assert.equal(checklist.length, 6);
    assert.ok(checklist.every(({ title, description }) => title.trim() && description.trim()));
    assert.deepEqual(checklist.filter(({ mandatory }) => mandatory).map(({ id }) => id), ['generic-name']);
  }

  const genericNameRequirement = getPrescriptionChecklist('en').find(({ id }) => id === 'generic-name');
  assert.ok(genericNameRequirement);
  assert.match(genericNameRequirement.description, /generic name/i);
  assert.match(
    GENERIC_MEDICINES.find(({ id }) => id === 'amoxicillin')?.genericName ?? '',
    /amoxicillin/i,
  );

  const source = await readFile(new URL('../src/lib/data/genericPrescriptionGuide.ts', import.meta.url), 'utf8');
  assert.match(source, /RA No\. 6675, Section 6\(b\), as amended by RA No\. 9502/);
  assert.match(source, /not a specific requirement stated in RA 6675/i);
});

test('doctor request script is polite, asks for generic name, strength, form, quantity, directions, and duration in all languages', () => {
  const medicine = GENERIC_MEDICINES.find(({ id }) => id === 'amlodipine');
  assert.ok(medicine);

  const scripts = languages.map((language) => getDoctorRequestScript(language, medicine));
  assert.equal(new Set(scripts).size, languages.length);
  const requiredPhrases = [
    ['generic name', 'lakas', 'porma', 'dami', 'tagubilin', 'tagal'],
    ['generic name', 'kusog', 'porma', 'gidaghanon', 'direksyon', 'gidugayon'],
    ['generic name', 'pigsa', 'porma', 'bilang', 'bilin', 'kaatiddog'],
    ['generic name', 'strength', 'form', 'quantity', 'directions', 'duration'],
  ];
  scripts.forEach((script, index) => {
    assert.match(script, /Amlodipine/);
    for (const phrase of requiredPhrases[index]) assert.ok(script.toLocaleLowerCase().includes(phrase));
    assert.equal(script.includes('\u2014'), false);
  });
  assert.match(getDoctorRequestScript('en'), /the prescribed medicine/);
});

test('interactive guide uses offline-friendly wrapping, 44px controls, and autocomplete suppression', async () => {
  const source = await readFile(new URL('../src/components/triage/GenericPrescriptionGuideCard.tsx', import.meta.url), 'utf8');
  assert.match(source, /autoComplete="off"/);
  assert.match(source, /min-h-\[44px\]/);
  assert.match(source, /min-w-0/);
  assert.match(source, /break-words/);
  assert.match(source, /grid-cols-1/);
});

test('all files touched by Feature 3.8 contain no em dash', async () => {
  const files = [
    '../src/lib/data/genericPrescriptionGuide.ts',
    '../src/components/triage/GenericPrescriptionGuideCard.tsx',
    '../src/components/TriageWizard.tsx',
    '../src/components/PrintFormsView.tsx',
    '../scripts/test-generic-prescription-guide.mjs',
    '../package.json',
    '../.agent-handoff.md',
  ];

  for (const file of files) {
    const content = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal(content.includes('\u2014'), false, `${file} contains an em dash`);
  }
});
