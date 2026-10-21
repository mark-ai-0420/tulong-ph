import test from 'node:test';
import assert from 'node:assert/strict';
import { getCity, getProvince } from '../src/lib/data/phLocations.ts';
import { PHILIPPINE_SCHOOLS, searchSchools } from '../src/lib/data/phSchools.ts';

test('directory covers SUCs, LUCs, private HEIs, and public TESDA training centers', () => {
  const counts = Object.fromEntries(['SUC', 'LUC', 'Private', 'Public / TVET'].map(kind => [
    kind,
    PHILIPPINE_SCHOOLS.filter(school => school.kind === kind).length,
  ]));
  assert.ok(counts.SUC >= 110, `Expected at least 110 SUCs, found ${counts.SUC}`);
  assert.ok(counts.LUC >= 20, `Expected a nationwide selection of LUCs, found ${counts.LUC}`);
  assert.ok(counts.Private >= 30, `Expected a major private HEI selection, found ${counts.Private}`);
  assert.ok(counts['Public / TVET'] >= 20, `Expected regional TESDA centers, found ${counts['Public / TVET']}`);
  assert.equal(new Set(PHILIPPINE_SCHOOLS.map(school => school.name)).size, PHILIPPINE_SCHOOLS.length);
  for (const school of PHILIPPINE_SCHOOLS) {
    const province = getProvince(school.province);
    assert.ok(province, `${school.name}: known province ${school.province}`);
    assert.ok(getCity(province.name, school.cityMunicipality), `${school.name}: known city ${school.cityMunicipality}`);
    assert.ok(school.region, `${school.name}: region is populated`);
  }
});

test('acronym and alias search returns correctly classified schools first', () => {
  for (const [query, schoolName, kind, schoolType] of [
    ['UP', 'University of the Philippines Diliman', 'SUC', 'suc_luc'],
    ['PUP', 'Polytechnic University of the Philippines', 'SUC', 'suc_luc'],
    ['PLM', 'Pamantasan ng Lungsod ng Maynila', 'LUC', 'suc_luc'],
    ['UST', 'University of Santo Tomas', 'Private', 'private'],
    ['CvSU', 'Cavite State University', 'SUC', 'suc_luc'],
    ['QCU', 'Quezon City University', 'LUC', 'suc_luc'],
  ]) {
    const [school] = searchSchools(query);
    assert.equal(school?.name, schoolName, query);
    assert.equal(school?.kind, kind, query);
    assert.equal(school?.schoolType, schoolType, query);
  }
  assert.equal(searchSchools('RTC Cebu', 'tvet')[0]?.kind, 'Public / TVET');
  assert.deepEqual(searchSchools('RTC Cebu', 'college'), []);
});

test('DEBESMSCAT is listed in Mandaon, Masbate', () => {
  const school = PHILIPPINE_SCHOOLS.find(school => school.aliases.includes('DEBESMSCAT'));
  assert.equal(school?.cityMunicipality, 'Mandaon');
});

test('search matches school locations and applies a bounded result limit', () => {
  const indang = searchSchools('Indang');
  assert.ok(indang.some(school => school.name === 'Cavite State University'));
  const quezonCity = searchSchools('Quezon City', 'college', 3);
  assert.equal(quezonCity.length, 3);
  assert.ok(quezonCity.every(school => school.cityMunicipality === 'Quezon City'));
  assert.deepEqual(searchSchools('PUP', undefined, 0), []);
  assert.deepEqual(searchSchools('', undefined, 8), []);
});
