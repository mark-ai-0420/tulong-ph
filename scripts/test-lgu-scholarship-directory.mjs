import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { defaultEducationProfile } from '../src/lib/educationEngine.ts';
import {
  filterLGUScholarships,
  getLGUScholarshipDetails,
  generateLGUScholarshipLetterDraft,
  LGU_SCHOLARSHIP_REGIONS,
  lguScholarshipPrograms,
  matchLGUScholarshipsToLocation,
} from '../src/lib/data/lguScholarships.ts';

test('catalog has unique programs and coverage for all 18 administrative regions', () => {
  assert.equal(new Set(lguScholarshipPrograms.map(program => program.id)).size, lguScholarshipPrograms.length);
  assert.equal(LGU_SCHOLARSHIP_REGIONS.length, 18);
  assert.deepEqual(new Set(lguScholarshipPrograms.map(program => program.region)), new Set(LGU_SCHOLARSHIP_REGIONS));
  assert.ok(lguScholarshipPrograms.every(program => program.sourceUrl.startsWith('https://')));
});

test('filters by region aliases, province, city, jurisdiction, and text', () => {
  assert.ok(filterLGUScholarships({ region: 'NCR' }).some(program => program.id === 'qc-scholarship-program'));
  assert.ok(filterLGUScholarships({ region: 'Region VII', province: 'Cebu' }).some(program => program.id === 'cebu-cp-gifts'));
  assert.ok(filterLGUScholarships({ province: 'Metro Manila (NCR)', cityMunicipality: 'Quezon City' }).some(program => program.id === 'qc-scholarship-program'));
  assert.ok(filterLGUScholarships({ jurisdiction: 'city_municipality' }).every(program => program.jurisdiction === 'city_municipality'));
  assert.ok(filterLGUScholarships({ jurisdiction: 'province' }).every(program => program.jurisdiction === 'province'));
  assert.ok(filterLGUScholarships({ jurisdiction: 'congressional_district' }).some(program => program.congressionalDistrict === '1st District'));
  assert.ok(filterLGUScholarships({ query: 'PHP 40,000' }).some(program => program.id === 'zamboanga-agriculture-scholarship'));
  assert.deepEqual(filterLGUScholarships({ region: 'Region II', cityMunicipality: 'Quezon City' }), []);
});

test('location matching combines city, province, and congressional-district listings', () => {
  const quezonCity = matchLGUScholarshipsToLocation({ province: 'Metro Manila (NCR)', cityMunicipality: 'Quezon City' });
  assert.deepEqual(quezonCity.map(program => program.id), ['qc-scholarship-program']);
  const paranaque = matchLGUScholarshipsToLocation({ province: 'Metro Manila (NCR)', cityMunicipality: 'Parañaque City' });
  assert.ok(!paranaque.some(program => program.id === 'paranaque-tulong-dunong-district-referral'));
  const districtReferral = filterLGUScholarships({ cityMunicipality: 'Parañaque', jurisdiction: 'congressional_district' })[0];
  assert.equal(districtReferral?.districtMatchNeedsConfirmation, true);
  const iloilo = matchLGUScholarshipsToLocation({ province: 'Iloilo', cityMunicipality: 'Miagao' });
  assert.ok(iloilo.some(program => program.id === 'iloilo-isip'));
  assert.deepEqual(matchLGUScholarshipsToLocation({}), []);
});

test('formal letter draft is polite and supported in all four languages', () => {
  const profile = {
    ...defaultEducationProfile,
    fullName: `Ana${String.fromCodePoint(0x2014)}Maria Santos`,
    schoolName: 'Cebu State University',
    degreeProgram: 'BS Nursing',
    cityMunicipality: 'Cebu City',
    province: 'Cebu',
    barangay: 'Lahug',
  };
  const program = lguScholarshipPrograms.find(entry => entry.id === 'cebu-cp-gifts');
  assert.ok(program);
  for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
    const letter = generateLGUScholarshipLetterDraft(profile, program, language);
    assert.match(letter, /CP-GIFTS/);
    assert.match(letter, /Cebu State University/);
    assert.match(letter, /Lahug, Cebu City, Cebu/);
    assert.match(letter, /____________________/);
    assert.equal(letter.includes(String.fromCodePoint(0x2014)), false);
  }
  assert.match(generateLGUScholarshipLetterDraft(profile, program, 'taglish'), /Magalang po akong humihiling/);
  assert.match(generateLGUScholarshipLetterDraft(profile, program, 'cebuano'), /Matinahuron kong nangayo/);
  assert.match(generateLGUScholarshipLetterDraft(profile, program, 'ilocano'), /Naayat a dumawatak/);
  assert.match(generateLGUScholarshipLetterDraft(profile, program, 'en'), /respectfully request guidance/);
});

test('grant, eligibility, document, and application details are localized for all catalog programs', () => {
  for (const program of lguScholarshipPrograms) {
    for (const language of ['taglish', 'cebuano', 'ilocano', 'en']) {
      const details = getLGUScholarshipDetails(program, language);
      assert.ok(details.grant.length > 0);
      assert.ok(details.eligibility.length > 0);
      assert.ok(details.documents.length > 0);
      assert.ok(details.applicationPeriod.length > 0);
      if (language !== 'en') {
        assert.notEqual(details.grant, program.grantAmountPerSemOrYear);
        assert.notEqual(details.eligibility, program.eligibilityHighlights.join(' '));
        assert.notEqual(details.documents, program.requiredDocuments.join(' '));
        assert.notEqual(details.applicationPeriod, program.applicationPeriod);
      }
    }
  }
});

test('Albay document checklist is complete in all regional translations', () => {
  const albay = lguScholarshipPrograms.find(program => program.id === 'albay-provincial-educational-assistance');
  assert.ok(albay);
  const under18ParentSignatureByLanguage = {
    taglish: /(?:wala pang 18|under 18).*lagdaan ng magulang/i,
    cebuano: /(?:ubos sa 18|under 18).*pirmahan.*ginikanan/i,
    ilocano: /(?:ubos ti 18|under 18).*pirmaan ti nagannak/i,
  };
  const documentItemPatterns = [
    /(?:certified true copy (?:ng|sa|ti) enrollment form)/i,
    /(?:photocopy (?:ng|sa|ti) school ID)/i,
    /(?:(?:original|orihinal)(?: nga| a)? Certificate of Indigency)/i,
    /(?:dagdag na|dugang nga|sabali pay a) dokumento/i,
  ];

  for (const [language, under18ParentSignature] of Object.entries(under18ParentSignatureByLanguage)) {
    const documents = getLGUScholarshipDetails(albay, language).documents;
    assert.match(documents, under18ParentSignature, `${language} links the under-18 condition to the parent signature`);
    for (const pattern of documentItemPatterns) assert.match(documents, pattern, `${language} checklist matches ${pattern}`);
  }
});

test('directory accessibility and zero em-dash invariant hold in touched files', async () => {
  const paths = [
    '../src/lib/data/lguScholarships.ts',
    '../src/components/education/LGUScholarshipDirectoryCard.tsx',
    '../src/components/education/EducationWizard.tsx',
    '../src/components/education/EducationPrintView.tsx',
    '../scripts/test-lgu-scholarship-directory.mjs',
    '../package.json',
    '../.agent-handoff.md',
  ];
  const sources = await Promise.all(paths.map(path => readFile(new URL(path, import.meta.url), 'utf8')));
  for (const source of sources) assert.equal(source.includes(String.fromCodePoint(0x2014)), false, 'touched file contains no em dash');
  const component = sources[1];
  assert.match(component, /autoComplete="off"/);
  assert.match(component, /min-h-\[44px\]/);
  assert.match(component, /role="group"/);
  assert.match(component, /aria-pressed=/);
  assert.match(component, /setLocationScope\('all'\)/);
  assert.match(component, /districtNotice/);
  assert.match(sources[2], /<LGUScholarshipDirectoryCard profile=\{profile\} language=\{language\}/);
  assert.match(sources[3], /Tanggapan ng Punong Lungsod \/ Mayor - Scholarship Office/);
  assert.match(sources[3], /Tanggapan ng Gobernador - Provincial Scholarship Office/);
  assert.match(sources[3], /Tanggapan ng Kinatawan \/ District Representative/);
});
