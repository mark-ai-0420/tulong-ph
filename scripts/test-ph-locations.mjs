import test from 'node:test';
import assert from 'node:assert/strict';
import { PH_LOCATIONS, QUICK_LOCATIONS, getCities, getBarangays, getProvince, normalizeBarangay, resolveLocationMetadata } from '../src/lib/data/phLocations.ts';

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

test('location tiers and example wage defaults use region rather than city class', () => {
  for (const [province, city, tier, wage] of [
    ['NCR', 'Quezon City', 'NCR', 645], ['Metro Manila (NCR)', 'Maynila', 'NCR', 645],
    ['Cavite', 'Indang', 'other', 520], ['Laguna', 'Calamba', 'other', 520],
    ['Pampanga', 'Angeles', 'HUC', 520], ['Bulacan', 'Malolos', 'other', 520],
    ['Cebu', 'Cebu City', 'HUC', 500], ['Cebu', 'Bantayan', 'other', 500],
    ['Davao del Sur', 'Davao City', 'HUC', 500], ['Davao del Norte', 'Tagum', 'other', 500],
    ['Benguet', 'Baguio', 'HUC', 450], ['Iloilo', 'Iloilo City', 'HUC', 450],
    ['Custom province', 'Custom city', 'other', 450],
  ]) assert.deepEqual(resolveLocationMetadata(province, city), { locationTier: tier, regionalDailyWage: wage }, `${province}/${city}`);
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
