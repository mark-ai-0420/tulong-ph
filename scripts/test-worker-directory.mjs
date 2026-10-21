import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterWorkerDesks, getWorkerDesksByRegion, normalizeWorkerDeskRegion, workerDeskRegions, workerDesks } from '../src/lib/data/workerDesks.ts';

const workerDeskAgencies = ['DOLE', 'NLRC', 'OWWA', 'ECC', 'DMW', 'SSS', 'Pag-IBIG', 'GSIS'];

test('worker desk index covers every region and all requested agencies', () => {
  const regionIds = workerDeskRegions.map(region => region.id);
  assert.equal(regionIds.length, 18);
  assert.equal(new Set(regionIds).size, regionIds.length);
  assert.ok(regionIds.includes('NIR'));
  assert.ok(regionIds.includes('BARMM'));
  assert.ok(regionIds.every(region => workerDesks.some(desk => desk.region === region || desk.servesRegions?.includes(region))));
  assert.deepEqual(new Set(workerDesks.map(desk => desk.agency)), new Set(workerDeskAgencies));
  assert.ok(workerDesks.every(desk => desk.id && desk.name && desk.agency && desk.region && desk.cityMunicipality && desk.address && desk.hotline && desk.services && desk.url));
  for (const desk of workerDesks) {
    assert.equal(new URL(desk.url).protocol, 'https:', `${desk.id} has a valid HTTPS URL`);
    assert.ok(Object.values(desk).every(value => typeof value !== 'string' || !value.includes('\u2014')), `${desk.id} contains no em dash`);
  }
  assert.equal(new Set(workerDesks.map(desk => desk.id)).size, workerDesks.length);
});

test('national loan desks are available for all 18 regions', () => {
  for (const { id } of workerDeskRegions) {
    for (const agency of ['SSS', 'Pag-IBIG', 'GSIS']) {
      assert.ok(
        filterWorkerDesks({ agency, region: id }).length >= 1,
        `${id} returns an active desk for ${agency}`
      );
    }
    assert.ok(
      filterWorkerDesks({ agencies: ['SSS', 'Pag-IBIG', 'GSIS'], region: id }).length >= 3,
      `${id} returns all 3 national loan desks together`
    );
  }
});

test('BARMM and NIR each have desks for every worker agency', () => {
  for (const region of ['BARMM', 'NIR']) {
    for (const agency of workerDeskAgencies) {
      assert.ok(filterWorkerDesks({ agency, region }).length > 0, `${region} returns a ${agency} desk`);
    }
  }
});

test('desk filters combine region, agency and quick-need agency lists', () => {
  assert.equal(filterWorkerDesks({ agency: 'DOLE', region: 'NIR' })[0]?.id, 'dole-nir');
  assert.equal(filterWorkerDesks({ agency: 'NLRC', region: 'NIR' })[0]?.id, 'nlrc-nir');
  assert.ok(filterWorkerDesks({ agencies: ['DMW'], region: 'NIR' }).some(desk => desk.id === 'dmw-r6'));
  assert.deepEqual(filterWorkerDesks({ agency: 'OWWA', region: 'NIR' }).map(desk => desk.id), ['owwa-nir', 'owwa-nir-negor']);
  assert.ok(filterWorkerDesks({ agency: 'SSS', region: 'NCR' }).some(desk => desk.id === 'sss-national'));
  assert.deepEqual(filterWorkerDesks({ agency: 'DMW', region: 'not-a-region' }), []);
  assert.ok(getWorkerDesksByRegion('Region IV-A').every(desk => desk.region === 'Region IV-A' || desk.servesRegions?.includes('Region IV-A')));
});

test('search covers office, city, address, service and hotline text', () => {
  assert.ok(filterWorkerDesks({ query: 'Dumaguete' }).some(desk => desk.id === 'dole-nir'));
  assert.ok(filterWorkerDesks({ agency: 'NLRC', query: 'Bacolod' }).some(desk => desk.id === 'nlrc-nir'));
  assert.ok(filterWorkerDesks({ agency: 'ECC', query: 'KaGabay' }).length > 0);
  assert.ok(filterWorkerDesks({ agency: 'DOLE', query: '1349' }).length > 0);
  assert.equal(normalizeWorkerDeskRegion('CALABARZON'), 'Region IV-A');
  assert.equal(normalizeWorkerDeskRegion('MIMAROPA Region'), 'Region IV-B');
  assert.ok(filterWorkerDesks({ region: 'MIMAROPA Region' }).length > 0);
  assert.equal(normalizeWorkerDeskRegion('Negros Island Region'), 'NIR');
});

test('directory source follows accessibility and punctuation constraints', async () => {
  const paths = [
    '../src/components/worker/WorkerDirectoryView.tsx',
    '../src/lib/data/workerDesks.ts',
  ];
  const source = (await Promise.all(paths.map(path => readFile(new URL(path, import.meta.url), 'utf8')))).join('\n');
  assert.equal(source.includes('\u2014'), false, 'directory code and data do not contain em dashes');
  assert.match(source, /autoComplete="off"/);
  assert.match(source, /min-h-\[44px\]/);
  assert.doesNotMatch(source, /text-\[(?:[0-9]|1[01])px\]/);
});
