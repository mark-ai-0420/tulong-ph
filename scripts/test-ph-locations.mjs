import test from 'node:test';
import assert from 'node:assert/strict';
import { PH_LOCATIONS, QUICK_LOCATIONS, REGIONAL_WAGE_INFO, getCities, getBarangays, getProvince, getRegionalWageInfo, normalizeBarangay, resolveLocationMetadata } from '../src/lib/data/phLocations.ts';

test('nationwide offline hierarchy covers 82 provinces, NCR and all barangays in snapshot', () => {
  assert.equal(PH_LOCATIONS.length, 84, '82 provinces plus NCR and the BARMM Special Geographic Area');
  assert.equal(new Set(PH_LOCATIONS.map(p => p.name)).size, 84);
  assert.equal(PH_LOCATIONS.reduce((sum, p) => sum + p.cities.reduce((count, c) => count + c.barangays.length, 0), 0), 42011);
  for (const province of PH_LOCATIONS) {
    assert.ok(province.cities.length > 0, province.name);
    assert.equal(new Set(province.cities.map(c => c.name)).size, province.cities.length, province.name);
    for (const city of province.cities) assert.ok(city.barangays.length > 0, `${province.name}/${city.name}`);
  }
  for (const name of ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon', 'Bulacan', 'Pampanga', 'Cebu', 'Davao del Sur', 'Iloilo', 'Benguet', 'Maguindanao del Norte', 'Maguindanao del Sur']) assert.ok(getProvince(name), name);
  assert.equal(getCities('NCR').length, 17);
  assert.ok(getBarangays('Metro Manila', 'Manila').length > 800, 'Manila districts flattened into city barangay options');
});

test('Cavite has every city/municipality and Indang has all 36 official barangays', () => {
  assert.deepEqual(getCities('Cavite').sort(), ['Alfonso', 'Amadeo', 'Bacoor', 'Carmona', 'Cavite City', 'Dasmariñas', 'General Emilio Aguinaldo', 'General Mariano Alvarez', 'General Trias', 'Imus', 'Indang', 'Kawit', 'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Noveleta', 'Rosario', 'Silang', 'Tagaytay', 'Tanza', 'Ternate', 'Trece Martires City'].sort());
  assert.deepEqual(getBarangays('Cavite', 'Indang').slice().sort(), ['Agus-us', 'Alulod', 'Banaba Cerca', 'Banaba Lejos', 'Bancod', 'Buna Cerca', 'Buna Lejos I', 'Buna Lejos II', 'Calumpang Cerca', 'Calumpang Lejos I', 'Carasuchi', 'Daine I', 'Daine II', 'Guyam Malaki', 'Guyam Munti', 'Harasan', 'Kayquit I', 'Kayquit II', 'Kayquit III', 'Kaytambog', 'Kaytapos', 'Limbon', 'Lumampong Balagbag', 'Lumampong Halayhay', 'Mahabangkahoy Cerca', 'Mahabangkahoy Lejos', 'Mataas na Lupa', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Pulo', 'Tambo Balagbag', 'Tambo Ilaya', 'Tambo Kulit', 'Tambo Malaki'].sort());
  assert.equal(normalizeBarangay('Cavite', 'Indang', 'Daine 1'), 'Daine I');
  assert.equal(normalizeBarangay('Cavite', 'Indang', 'daine 2'), 'Daine II');
  assert.equal(normalizeBarangay('Cavite', 'Indang', 'Agus-os'), 'Agus-us');
  assert.equal(normalizeBarangay('Cavite', 'Indang', 'Poblacion 4'), 'Barangay 4');
  assert.equal(normalizeBarangay('Cavite', 'Indang', 'Mataas na Lupa (Checkpoint)'), 'Mataas na Lupa');
});

test('location tiers and statutory wage defaults use the applicable regional order', () => {
  for (const [province, city, tier, wage] of [
    ['NCR', 'Quezon City', 'NCR', 755], ['Metro Manila (NCR)', 'Maynila', 'NCR', 755],
    ['Cavite', 'Indang', 'other', 525], ['Laguna', 'Calamba', 'other', 525],
    ['Pampanga', 'Angeles', 'HUC', 560], ['Bulacan', 'Malolos', 'other', 560],
    ['Cebu', 'Cebu City', 'HUC', 542], ['Cebu', 'Bantayan', 'other', 542],
    ['Negros Occidental', 'Bacolod City', 'HUC', 525], ['Negros Oriental', 'Dumaguete City', 'other', 542],
    ['Siquijor', 'Siquijor', 'other', 542], ['Davao del Sur', 'Davao City', 'HUC', 540],
    ['Davao del Norte', 'Tagum', 'other', 540], ['Sultan Kudarat', 'Tacurong City', 'other', 460],
    ['Benguet', 'Baguio', 'HUC', 505],
    ['Iloilo', 'Iloilo City', 'HUC', 525], ['Custom province', 'Custom city', 'other', 0],
  ]) {
    const metadata = resolveLocationMetadata(province, city);
    assert.equal(metadata.locationTier, tier, `${province}/${city} tier`);
    assert.equal(metadata.regionalDailyWage, wage, `${province}/${city} wage`);
    assert.equal(metadata.wageInfo?.minimumNonAgricultureDailyWage ?? null, wage || null, `${province}/${city} wage info`);
  }
  assert.equal(REGIONAL_WAGE_INFO.length, 18, '17 wage board regions plus NIR');
  const nir = REGIONAL_WAGE_INFO.find(info => info.region.includes('Negros Island'));
  assert.ok(nir);
  assert.equal(nir.minimumNonAgricultureDailyWage, null, 'NIR does not publish a separate rate');
  assert.equal(getRegionalWageInfo('NIR', 'Negros Occidental')?.wageOrder, 'RBVI-29');
  assert.equal(getRegionalWageInfo('NIR', 'Negros Oriental')?.wageOrder, 'ROVII-27');
  assert.equal(getRegionalWageInfo('NIR', 'Siquijor')?.wageOrder, 'ROVII-27');
  assert.equal(getRegionalWageInfo('NCR')?.wageOrder, 'NCR-28');
  assert.equal(getRegionalWageInfo('MIMAROPA')?.wageOrder, 'RB-MIMAROPA-13');
  assert.ok(REGIONAL_WAGE_INFO.filter(info => info.minimumNonAgricultureDailyWage !== null).every(info =>
    info.maximumNonAgricultureDailyWage !== null && info.effectiveDate !== null && info.sourceUrl.startsWith('https://'),
  ));
  assert.equal(REGIONAL_WAGE_INFO.find(info => info.wageOrder === 'NCR-28')?.minimumNonAgricultureDailyWage, 755);
  assert.equal(REGIONAL_WAGE_INFO.find(info => info.wageOrder === 'RBIII-26')?.minimumNonAgricultureDailyWage, 560);
  assert.equal(REGIONAL_WAGE_INFO.find(info => info.wageOrder === 'RBIII-26')?.maximumNonAgricultureDailyWage, 600);
  assert.equal(REGIONAL_WAGE_INFO.find(info => info.wageOrder === 'IVA-22')?.minimumNonAgricultureDailyWage, 525);
  assert.equal(REGIONAL_WAGE_INFO.find(info => info.wageOrder === 'ROVII-27')?.maximumNonAgricultureDailyWage, 582);
  assert.deepEqual(getCities('Custom province'), []);
  assert.deepEqual(getBarangays('Cavite', 'Custom city'), []);
  assert.deepEqual(getBarangays('Laguna', 'Indang'), [], 'No child list from another province');
  assert.equal(normalizeBarangay('Custom province', 'Custom city', 'Custom barangay'), 'Custom barangay');
  for (const preset of QUICK_LOCATIONS) {
    assert.ok(getCities(preset.province).length, preset.label);
    assert.ok(getBarangays(preset.province, preset.cityMunicipality).length, preset.label);
    if (preset.barangay) assert.ok(getBarangays(preset.province, preset.cityMunicipality).includes(preset.barangay));
  }
});
