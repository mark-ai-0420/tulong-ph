import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { defaultEducationProfile, normalizeEducationProfile } from '../src/lib/educationEngine.ts';
import { matchDegreeProgram, phDegreePrograms, searchDegreePrograms } from '../src/lib/data/phDegreePrograms.ts';
import { getScholarshipStatus, scholarshipCalendar } from '../src/lib/data/scholarshipCalendar.ts';

const byName = (name) => phDegreePrograms.find((program) => program.name === name);

test('degree index covers 80+ Philippine programs and searches names and aliases', () => {
  assert.ok(phDegreePrograms.length >= 80);
  assert.ok(new Set(phDegreePrograms.map((program) => program.id)).size === phDegreePrograms.length, 'degree ids are unique');
  assert.ok(searchDegreePrograms('computer science').some((program) => program.name === 'BS Computer Science'));
  assert.equal(matchDegreeProgram('BSN')?.name, 'BS Nursing');
  assert.equal(matchDegreeProgram('Agribusiness')?.name, 'BS Agribusiness Management');
  assert.equal(matchDegreeProgram('HRM'), undefined, 'ambiguous abbreviation is not assigned to the wrong business program');
  const normalizedAliases = phDegreePrograms.flatMap((program) => program.aliases.map((alias) => alias.trim().toLowerCase()));
  assert.equal(new Set(normalizedAliases).size, normalizedAliases.length, 'aliases are unambiguous');
  assert.deepEqual(searchDegreePrograms('   '), []);
  assert.ok(phDegreePrograms.every((program) => program.category && typeof program.isChedPriority === 'boolean'
    && typeof program.isDostPriority === 'boolean' && typeof program.isCoconutPriority === 'boolean'));
});

test('degree tags follow current named priority lists rather than generic category guesses', () => {
  assert.equal(byName('BS Agriculture')?.isChedPriority, true);
  assert.equal(byName('BS Agriculture')?.isDostPriority, true);
  assert.equal(byName('BS Agriculture')?.isCoconutPriority, true);
  assert.equal(byName('BS Nursing')?.isDostPriority, false);
  assert.equal(byName('BS Medical Laboratory Science')?.isDostPriority, true);
  assert.equal(byName('BS Pharmacy')?.isDostPriority, true);
  assert.equal(byName('BS Psychology')?.isDostPriority, true);
  assert.equal(byName('BS Library and Information Science')?.isDostPriority, true);
  assert.equal(byName('BS Robotics Engineering')?.isDostPriority, false);
  assert.equal(byName('BS Business Administration')?.isDostPriority, false);
  assert.equal(byName('BA English Language Studies')?.isDostPriority, false);
  assert.equal(byName('BS Applied Mathematics')?.isCoconutPriority, false);
  assert.equal(byName('BS Environmental and Sanitary Engineering')?.isCoconutPriority, true);
  assert.equal(byName('BS Business Administration')?.isCoconutPriority, true);
  assert.equal(byName('BS Medical Laboratory Science')?.isCoconutPriority, false);
});

test('degree profile defaults and safely normalizes the selected program', () => {
  assert.equal(defaultEducationProfile.degreeProgram, '');
  assert.equal(normalizeEducationProfile({ degreeProgram: '  BS Agriculture  ' }).degreeProgram, '  BS Agriculture  ');
  let typedProfile = defaultEducationProfile;
  for (const character of 'BS ') {
    typedProfile = normalizeEducationProfile({ ...typedProfile, degreeProgram: typedProfile.degreeProgram + character });
  }
  assert.equal(typedProfile.degreeProgram, 'BS ');
  assert.equal(normalizeEducationProfile({ degreeProgram: 12 }).degreeProgram, '');
  assert.equal(normalizeEducationProfile({ degreeProgram: 'x'.repeat(200) }).degreeProgram.length, 150);
});

test('selecting a degree program preserves the students DOST school confirmation', async () => {
  const source = await readFile(new URL('../src/components/education/EducationCourseAutocomplete.tsx', import.meta.url), 'utf8');
  const selectionHandler = source.match(/function choose\(program: PhilippineDegreeProgram\) \{([\s\S]*?)\n  \}/)?.[1];

  assert.ok(selectionHandler, 'degree selection handler exists');
  assert.match(selectionHandler, /\.\.\.profile/);
  assert.doesNotMatch(selectionHandler, /dostQualifiedSchool\s*:/);
});

test('calendar status uses deterministic typical months and separates local and enrollment cycles', () => {
  const find = (id) => scholarshipCalendar.find((entry) => entry.id === id);
  assert.equal(scholarshipCalendar.length, 7);
  assert.ok(scholarshipCalendar.every((entry) => entry.portalUrl.startsWith('https://')));
  assert.equal(getScholarshipStatus(find('dost-sei'), new Date(2026, 7, 17)), 'open_now');
  assert.equal(getScholarshipStatus(find('dost-sei'), new Date(2026, 9, 20)), 'upcoming');
  assert.equal(getScholarshipStatus(find('ched-cmsp'), new Date(2026, 5, 1)), 'open_now');
  assert.equal(getScholarshipStatus(find('peac-shs-voucher'), new Date(2026, 7, 1)), 'open_now');
  assert.equal(getScholarshipStatus(find('owwa-edsp-odsp'), new Date(2026, 9, 20)), 'year_round');
  assert.equal(getScholarshipStatus(find('dswd-tara-basa'), new Date(2026, 9, 20)), 'year_round');
  assert.equal(getScholarshipStatus(find('unifast-fhe'), new Date(2026, 9, 20)), 'enrollment_cycle');
});

test('autocomplete and calendar source keep the requested accessibility conventions', async () => {
  const paths = [
    '../src/components/education/EducationCourseAutocomplete.tsx',
    '../src/components/education/ScholarshipCalendarCard.tsx',
    '../src/lib/data/phDegreePrograms.ts',
    '../src/lib/data/scholarshipCalendar.ts',
  ];
  const source = (await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), 'utf8')))).join('\n');
  assert.equal(source.includes('\u2014'), false, 'source does not contain em dashes');
  assert.match(source, /autoComplete="off"/);
  assert.match(source, /min-h-\[44px\]/);
  assert.doesNotMatch(source, /text-\[(?:[0-9]|1[01])px\]/);
});
