'use client';

import { Building2, Search, Copy, ExternalLink, Phone } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicInput, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';
import { workerDirectory, workerPrograms } from '@/lib/data/workerPrograms';

const agencies = ['all', 'SSS', 'Pag-IBIG', 'GSIS', 'ECC', 'DOLE', 'OWWA', 'DMW'];
const needs = [
  { id: 'loans', label: 'Salary / Calamity Loan', programs: ['sss_salary', 'sss_calamity', 'pagibig_mpl', 'pagibig_calamity', 'gsis_mpl', 'gsis_lite', 'gsis_emergency'] },
  { id: 'benefits', label: 'Maternity / Sickness', programs: ['sss_maternity', 'sss_sickness', 'ecc'] },
  { id: 'wages', label: 'Unpaid Sahod 1349', programs: ['sena'] },
  { id: 'livelihood', label: 'TUPAD / Kabuhayan', programs: ['tupad', 'dilp'] },
  { id: 'ofw', label: 'OFW 1348', programs: ['bpbh', 'aksyon'] },
];
const chip = civicPill;

export function WorkerDirectoryView({ language = 'taglish' }: { language?: Language }) {
  const english = language === 'en';
  const [moving, setMoving] = useState(true);
  const [search, setSearch] = useState('');
  const [agency, setAgency] = useState('all');
  const [need, setNeed] = useState('all');
  const [copyStatus, setCopyStatus] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const selectedNeed = needs.find(item => item.id === need);
  const needPrograms = workerPrograms.filter(p => !selectedNeed || selectedNeed.programs.includes(p.id));
  const programs = needPrograms.filter(p => (agency === 'all' || p.agency.includes(agency)) &&
    `${p.name} ${p.agency} ${p.benefit} ${p.eligibility}`.toLocaleLowerCase().includes(query));
  const contacts = workerDirectory.filter(d => {
    const contactAgencies = agencies.filter(a => a !== 'all' &&
      (d.name.includes(a) || (a === 'ECC' && d.name === 'Employees Compensation Commission')));
    return (agency === 'all' || contactAgencies.includes(agency)) &&
      (!selectedNeed || needPrograms.some(p => contactAgencies.some(a => p.agency.includes(a)))) &&
      `${d.name} ${d.services} ${d.hotline}`.toLocaleLowerCase().includes(query);
  });
  async function copyHotline(name: string, hotline: string) {
    try {
      await navigator.clipboard.writeText(hotline);
      setCopyStatus(`Nakopya ang hotline ng ${name}: ${hotline}`);
    } catch {
      setCopyStatus(`Hindi nakopya. Piliin o tawagan ang hotline ng ${name}: ${hotline}`);
    }
  }
  return <section className={moving ? "overflow-x-clip motion-reduce:overflow-x-visible" : "overflow-visible"}><div onAnimationEnd={e => { if (e.target === e.currentTarget) setMoving(false); }} className="space-y-6 animate-step-enter step-enter-forward">
    <CivicViewHeader icon={Building2} badge={english ? 'Official worker desks' : 'Mga opisyal na worker desk'} title={english ? 'Worker desk directory' : 'Direktoryo ng manggagawa'} description={english ? 'Contact the official portal or regional office before giving personal information. Directory links open in another tab.' : 'Makipag-ugnayan sa official portal o regional office bago magbigay ng personal na impormasyon. Ang directory links ay magbubukas sa ibang tab.'} />
    <form autoComplete="off" onSubmit={e => e.preventDefault()} className={`${civicCard} grid sm:grid-cols-2 gap-4`}>
      <div><label htmlFor="worker-directory-search" className={civicLabel}>{english ? 'Find an agency or program' : 'Hanapin ang agency / programa'}</label><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500" /><input id="worker-directory-search" autoComplete="off" type="search" value={search} onChange={e => setSearch(e.target.value)} className={`${civicInput} pl-10`} /></div></div>
      <div><label htmlFor="worker-directory-agency" className={civicLabel}>Agency</label><select id="worker-directory-agency" autoComplete="off" value={agency} onChange={e => setAgency(e.target.value)} className={civicInput}>
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
      {contacts.map(d => <article key={d.name} className="bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs animate-cascade-item relief-pillar">
        <h3 className="text-lg font-bold">{d.name}</h3><p className="text-sm text-slate-600 mt-2">{d.services}</p>
        <div className="flex flex-wrap items-center gap-3 mt-2"><a href={`tel:${d.hotline.replace(/[^\d+]/g, '')}`} className="min-h-[44px] inline-flex items-center font-bold text-blue-900 tabular-nums underline focus-ring"><Phone aria-hidden="true" className="mr-2 h-4 w-4" />{d.hotline}</a>
          <button type="button" className={`${chip} border-[#E2DFD6] bg-white`} onClick={() => void copyHotline(d.name, d.hotline)} aria-label={`Copy Hotline: ${d.name}`}><Copy aria-hidden="true" className="h-4 w-4" />Copy Hotline</button>
        </div>
        <div className="flex flex-wrap gap-4"><a href={d.url} target="_blank" rel="noreferrer" className="min-h-[44px] inline-flex items-center text-blue-900 underline focus-ring"><ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />Official portal</a><a href={d.officeUrl} target="_blank" rel="noreferrer" className="min-h-[44px] inline-flex items-center text-blue-900 underline focus-ring">Office directory</a></div>
      </article>)}
    </div>
    <p role="status" className="tabular-nums">{programs.length} {english ? 'matching programs' : 'programang tumutugma'}</p>
    {programs.length === 0 && <p className={civicCard}>{english ? 'No matches. Choose All or try another search term.' : 'Walang tugma. Subukang piliin ang Lahat o ibang search term.'}</p>}
    {programs.map(p => <article key={p.id} className="bg-white border border-[#E2DFD6] rounded-2xl p-5 shadow-xs space-y-3 tabular-nums">
      <h3 className="font-bold text-lg">{p.name}</h3><p className="text-sm font-semibold text-blue-900">{p.agency} • {p.basis}</p><p>{p.benefit}</p><p className="text-sm text-slate-600">{p.eligibility}</p>
      <details><summary className="min-h-[44px] py-3 cursor-pointer focus-ring font-bold">Documentary checklist</summary><ul className="list-disc pl-5 space-y-1">{p.checklist.map(c => <li key={c}>{c}</li>)}</ul></details>
      <a href={p.source} target="_blank" rel="noreferrer" className="min-h-[44px] inline-flex items-center text-blue-900 underline focus-ring">Official source / terms</a>
    </article>)}
  </div></section>;
}
