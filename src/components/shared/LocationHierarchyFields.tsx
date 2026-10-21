'use client';

import { civicInput, civicLabel, civicPill, civicSelectedPill } from './civicStyles';
import type { Language } from '@/lib/i18n';
import { PH_LOCATIONS, QUICK_LOCATIONS, getProvince, getCities, getBarangays, normalizeBarangay, resolveLocationMetadata } from '@/lib/data/phLocations';
import type { LocationSelection } from '@/lib/data/phLocations';
export type { LocationSelection } from '@/lib/data/phLocations';

interface Props {
  idPrefix: string;
  value: { province?: string; cityMunicipality?: string; barangay?: string };
  onChange: (value: LocationSelection, updateMetadata: boolean) => void;
  language?: Language;
  cityId?: string;
}

export function LocationHierarchyFields({ idPrefix, value, onChange, language = 'taglish', cityId }: Props) {
  const province = value.province ?? '';
  const cityMunicipality = value.cityMunicipality ?? '';
  const barangay = value.barangay ?? '';
  const tl = language === 'taglish';
  const hintId = `${idPrefix}-location-hint`;
  const wageInfo = resolveLocationMetadata(province, cityMunicipality).wageInfo;
  const wageRange = wageInfo?.minimumNonAgricultureDailyWage === wageInfo?.maximumNonAgricultureDailyWage
    ? `₱${wageInfo?.minimumNonAgricultureDailyWage ?? 0}`
    : `₱${wageInfo?.minimumNonAgricultureDailyWage ?? 0} to ₱${wageInfo?.maximumNonAgricultureDailyWage ?? 0}`;
  function emit(next: { province: string; cityMunicipality: string; barangay: string }, updateMetadata = true) {
    onChange({ ...next, ...resolveLocationMetadata(next.province, next.cityMunicipality) }, updateMetadata);
  }
  const fields = [
    { id: `${idPrefix}-province`, name: 'province', label: tl ? '1. Probinsya / Rehiyon' : '1. Province / Region', value: province, options: PH_LOCATIONS.map(place => place.name), placeholder: 'Cavite / Metro Manila', change: (text: string) => emit({ province: text, cityMunicipality: '', barangay: '' }) },
    { id: cityId ?? `${idPrefix}-city`, name: 'cityMunicipality', label: tl ? '2. Lungsod / Bayan' : '2. City / Municipality', value: cityMunicipality, options: getCities(province), placeholder: tl ? 'Piliin o i-type ang lungsod / bayan' : 'Select or type city / municipality', change: (text: string) => emit({ province, cityMunicipality: text, barangay: '' }) },
    { id: `${idPrefix}-barangay`, name: 'barangay', label: '3. Barangay', value: barangay, options: getBarangays(province, cityMunicipality), placeholder: tl ? 'Piliin o i-type ang barangay' : 'Select or type barangay', change: (text: string) => emit({ province, cityMunicipality, barangay: normalizeBarangay(province, cityMunicipality, text) }, false) },
  ];
  return <fieldset className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-4 sm:p-6 space-y-4">
    <legend className="px-2 font-bold text-slate-900">{tl ? 'Lokasyon' : 'Location'}</legend>
    <div className="grid gap-4 sm:grid-cols-3">{fields.map(field => <div key={field.id} className="min-w-0">
      <label htmlFor={field.id} className={civicLabel}>{field.label}</label>
      <input id={field.id} name={field.name} type="text" autoComplete="off" list={`${field.id}-options`} aria-describedby={hintId} value={field.value} placeholder={field.placeholder} onChange={event => field.change(event.target.value)} className={civicInput} />
      <datalist id={`${field.id}-options`}>{field.options.map(option => <option key={option} value={option} />)}</datalist>
    </div>)}</div>
    <div role="group" aria-label={tl ? 'Mabilis na pili ng lokasyon' : 'Location presets'} className="flex flex-wrap gap-2">{QUICK_LOCATIONS.map(preset => <button key={preset.label} type="button" onClick={() => emit(preset)} aria-pressed={getProvince(province)?.name === preset.province && cityMunicipality === preset.cityMunicipality && barangay === preset.barangay} className={getProvince(province)?.name === preset.province && cityMunicipality === preset.cityMunicipality && barangay === preset.barangay ? civicSelectedPill : civicPill}>{preset.label}</button>)}</div>
    <p id={hintId} className="text-xs leading-relaxed text-slate-600">{tl ? 'Piliin mula sa listahan o i-type ang tamang address. Kapag binago ang probinsya o lungsod, piliin muli ang mga kasunod.' : 'Choose from the list or type your address. After changing province or city, choose the remaining fields again.'}</p>
    {wageInfo && <div className="min-w-0 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950" aria-label="Official regional wage reference">
      <p className="font-bold">{wageInfo.minimumNonAgricultureDailyWage === null ? `NWPC: ${wageInfo.wageOrder}` : `NWPC Wage Order No. ${wageInfo.wageOrder}`}</p>
      {wageInfo.minimumNonAgricultureDailyWage !== null && <p className="mt-1">Non-agriculture daily rates: {wageRange}. Auto-filled value uses the lower regional rate.</p>}
      {wageInfo.effectiveDate && <p className="mt-1">Effective date: {wageInfo.effectiveDate}</p>}
      {wageInfo.note && <p className="mt-1">{wageInfo.note}</p>}
      <p className="mt-1">{tl ? 'Iba ang rate para sa agriculture at maliit na retail/service establishment. Maaari mong palitan ito at kumpirmahin ang tamang lokal na kategorya.' : 'Agriculture and small retail/service establishments use different rates. You can edit the amount and confirm the correct local category.'}</p>
      <a className="mt-1 inline-flex min-h-[44px] items-center text-blue-900 underline focus-ring" href={wageInfo.sourceUrl} target="_blank" rel="noreferrer">View official NWPC rates</a>
    </div>}
  </fieldset>;
}
