'use client';

import { Building2, Search, Copy, ExternalLink, Phone } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicInput, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';
import { filterWorkerDesks, normalizeWorkerDeskRegion, workerDeskRegions, type WorkerDeskAgency } from '@/lib/data/workerDesks';
import { getProvince } from '@/lib/data/phLocations';
import { workerPrograms } from '@/lib/data/workerPrograms';

const agencies: Array<WorkerDeskAgency | 'all'> = ['all', 'DOLE', 'NLRC', 'OWWA', 'ECC', 'DMW', 'SSS', 'Pag-IBIG', 'GSIS'];
const needs = [
  { id: 'loans', label: 'Salary / Calamity Loan', agencies: ['SSS', 'Pag-IBIG', 'GSIS'] as WorkerDeskAgency[], programs: ['sss_salary', 'sss_calamity', 'pagibig_mpl', 'pagibig_calamity', 'gsis_mpl', 'gsis_lite', 'gsis_emergency'] },
  { id: 'benefits', label: 'Maternity / Sickness', agencies: ['SSS', 'ECC'] as WorkerDeskAgency[], programs: ['sss_maternity', 'sss_sickness', 'ecc'] },
  { id: 'wages', label: 'Unpaid Sahod 1349', agencies: ['DOLE', 'NLRC'] as WorkerDeskAgency[], programs: ['sena'] },
  { id: 'livelihood', label: 'TUPAD / Kabuhayan', agencies: ['DOLE', 'OWWA'] as WorkerDeskAgency[], programs: ['tupad', 'dilp'] },
  { id: 'ofw', label: 'OFW 1348', agencies: ['OWWA', 'DMW'] as WorkerDeskAgency[], programs: ['bpbh', 'aksyon'] },
];
const chip = civicPill;
const telephoneNumber = (hotline: string) => {
  const firstNumber = hotline.split(/[;,/]/)[0].trim();
  return /\d/.test(firstNumber) ? firstNumber.replace(/[^\d+]/g, '') : '';
};

export function WorkerDirectoryView({ language = 'taglish', region, province }: { language?: Language; region?: string; province?: string }) {
  const english = language === 'en';
  const [moving, setMoving] = useState(true);
  const [search, setSearch] = useState('');
  const [agency, setAgency] = useState('all');
  const [need, setNeed] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState(() => normalizeWorkerDeskRegion(region) ?? normalizeWorkerDeskRegion(getProvince(province ?? '')?.region) ?? 'all');
  const [copyStatus, setCopyStatus] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const selectedNeed = needs.find(item => item.id === need);
  const needPrograms = workerPrograms.filter(p => !selectedNeed || selectedNeed.programs.includes(p.id));
  const programs = needPrograms.filter(p => (agency === 'all' || p.agency.includes(agency)) &&
    `${p.name} ${p.agency} ${p.benefit} ${p.eligibility}`.toLocaleLowerCase().includes(query));
  const desks = filterWorkerDesks({
    agency: agency as WorkerDeskAgency | 'all',
    agencies: selectedNeed?.agencies,
    region: selectedRegion,
    query: search,
  });
  async function copyHotline(name: string, hotline: string) {
    try {
      await navigator.clipboard.writeText(hotline);
      setCopyStatus(english ? `Copied ${name} hotline: ${hotline}` : `Nakopya ang hotline ng ${name}: ${hotline}`);
    } catch {
      setCopyStatus(english ? `Could not copy. Select or call ${name}: ${hotline}` : `Hindi nakopya. Piliin o tawagan ang hotline ng ${name}: ${hotline}`);
    }
  }
  return <section className={moving ? "overflow-x-clip motion-reduce:overflow-x-visible" : "overflow-visible"}><div onAnimationEnd={e => { if (e.target === e.currentTarget) setMoving(false); }} className="space-y-6 animate-step-enter step-enter-forward">
    <CivicViewHeader icon={Building2} badge={english ? 'Official worker desks' : 'Mga opisyal na worker desk'} title={english ? 'Worker desk directory' : 'Direktoryo ng manggagawa'} description={english ? 'Office locations vary by agency. Confirm current details in the official directory before travel or sharing personal information.' : 'Nagkakaiba ang lokasyon ng opisina kada ahensya. Kumpirmahin ang detalye sa official directory bago bumiyahe o magbigay ng personal na impormasyon.'} />
    <form autoComplete="off" onSubmit={e => e.preventDefault()} className={`${civicCard} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
      <div><label htmlFor="worker-directory-search" className={civicLabel}>{english ? 'Search desks or services' : 'Hanapin ang desk o serbisyo'}</label><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500" /><input id="worker-directory-search" autoComplete="off" type="search" value={search} onChange={e => setSearch(e.target.value)} className={`${civicInput} pl-10`} /></div></div>
      <div><label htmlFor="worker-directory-region" className={civicLabel}>{english ? 'Region' : 'Rehiyon'}</label><select id="worker-directory-region" autoComplete="off" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} className={civicInput}>
        <option value="all">{english ? 'All regions' : 'Lahat ng rehiyon'}</option>
        {workerDeskRegions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></div>
      <div><label htmlFor="worker-directory-agency" className={civicLabel}>{english ? 'Agency' : 'Ahensya'}</label><select id="worker-directory-agency" autoComplete="off" value={agency} onChange={e => setAgency(e.target.value)} className={civicInput}>
        {agencies.map(a => <option key={a} value={a}>{a === 'all' ? (english ? 'All' : 'Lahat') : a}</option>)}
      </select></div>
    </form>
    <div className="flex flex-wrap gap-2" aria-label="Agency quick filters">
      {agencies.map(a => <button key={a} type="button" aria-pressed={agency === a} onClick={() => setAgency(a)}
        className={agency === a ? civicSelectedPill : chip}>{a === 'all' ? (english ? 'All' : 'Lahat') : a}</button>)}
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Common worker needs">
      <button type="button" aria-pressed={need === 'all'} onClick={() => setNeed('all')} className={`${chip} ${need === 'all' ? 'bg-blue-50 text-blue-900 border-blue-900' : 'bg-white border-[#E2DFD6]'}`}>{english ? 'All needs' : 'Lahat ng pangangailangan'}</button>
      {needs.map(item => <button key={item.id} type="button" aria-pressed={need === item.id} onClick={() => setNeed(item.id)}
        className={`${chip} ${need === item.id ? 'bg-blue-50 text-blue-900 border-blue-900' : 'bg-white border-[#E2DFD6]'}`}>{item.label}</button>)}
    </div>
    <p role="status" aria-live="polite" className="text-sm tabular-nums">{copyStatus}</p>
    <div className="grid sm:grid-cols-2 gap-4">
      {desks.map(d => <article key={d.id} className="min-w-0 bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs animate-cascade-item relief-pillar">
        <h3 className="text-lg font-bold">{d.name}</h3>
        <p className="mt-1 text-sm font-semibold text-blue-900">{workerDeskRegions.find(item => item.id === d.region)?.label} · {d.cityMunicipality}</p>
        {d.servesRegions?.length ? <p className="mt-1 text-sm text-slate-600">{english ? `Also serves ${d.servesRegions.join(', ')}` : `May serbisyo rin sa ${d.servesRegions.join(', ')}`}</p> : null}
        <p className="mt-2 text-sm text-slate-700">{d.address}</p>
        <p className="mt-2 text-sm text-slate-600">{d.services}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {telephoneNumber(d.hotline) ? <a href={`tel:${telephoneNumber(d.hotline)}`} className="inline-flex min-h-[44px] items-center font-bold text-blue-900 tabular-nums underline focus-ring"><Phone aria-hidden="true" className="mr-2 h-4 w-4" />{d.hotline}</a> : <span className="inline-flex min-h-[44px] items-center text-sm">{d.hotline}</span>}
          {telephoneNumber(d.hotline) && <button type="button" className={`${chip} border-[#E2DFD6] bg-white`} onClick={() => void copyHotline(d.name, d.hotline)} aria-label={`${english ? 'Copy hotline' : 'Kopyahin ang hotline'}: ${d.name}`}><Copy aria-hidden="true" className="h-4 w-4" />{english ? 'Copy hotline' : 'Kopyahin ang hotline'}</button>}
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          {d.email && <a href={`mailto:${d.email}`} className="inline-flex min-h-[44px] items-center break-all text-blue-900 underline focus-ring">{d.email}</a>}
          <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-blue-900 underline focus-ring"><ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />{english ? 'Official directory' : 'Official directory'}</a>
        </div>
      </article>)}
    </div>
    {desks.length === 0 && <p className={civicCard}>{english ? 'No desks match. Try another region, agency or search term.' : 'Walang tugmang desk. Pumili ng ibang rehiyon o ahensya, o subukan ang ibang salita.'}</p>}
    <p role="status" className="tabular-nums">{programs.length} {english ? 'matching programs' : 'programang tumutugma'}</p>
    {programs.length === 0 && <p className={civicCard}>{english ? 'No matches. Choose All or try another search term.' : 'Walang tugma. Subukang piliin ang Lahat o ibang search term.'}</p>}
    {programs.map(p => <article key={p.id} className="bg-white border border-[#E2DFD6] rounded-2xl p-5 shadow-xs space-y-3 tabular-nums">
      <h3 className="font-bold text-lg">{p.name}</h3><p className="text-sm font-semibold text-blue-900">{p.agency} • {p.basis}</p><p>{p.benefit}</p><p className="text-sm text-slate-600">{p.eligibility}</p>
      <details><summary className="min-h-[44px] py-3 cursor-pointer focus-ring font-bold">Documentary checklist</summary><ul className="list-disc pl-5 space-y-1">{p.checklist.map(c => <li key={c}>{c}</li>)}</ul></details>
      <a href={p.source} target="_blank" rel="noreferrer" className="min-h-[44px] inline-flex items-center text-blue-900 underline focus-ring">Official source / terms</a>
    </article>)}
  </div></section>;
}
