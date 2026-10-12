'use client';

import { Building2, Search, Copy, ExternalLink, Phone } from 'lucide-react';
import { CivicViewHeader } from '@/components/shared/CivicViewHeader';
import { civicCard, civicLabel, civicInput, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';
import { educationDirectory } from '@/lib/data/educationPrograms';

export function EducationDirectoryView({ language = 'taglish' }: { language?: Language }) {
  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState('all');
  const [region, setRegion] = useState('all');
  const [need, setNeed] = useState('');
  const [copyFeedback, setCopyFeedback] = useState({ id: '', message: '' });
  const agencyPresets = [['all', 'Lahat'], ['CHED / UniFAST', 'CHED / UniFAST'], ['DOST-SEI', 'DOST-SEI'], ['DepEd / PEAC', 'PEAC'], ['TESDA', 'TESDA'], ['OWWA', 'OWWA'], ['DSWD', 'DSWD'], ['GSIS', 'GSIS']];
  const needPresets = [['Libreng Tuition', 'CHED / UniFAST'], ['TES / TDP Allowance', 'CHED / UniFAST'], ['SHS Voucher', 'DepEd / PEAC'], ['Tech-Voc', 'TESDA']];
  const chipClass = civicPill;
  const tl = language === 'taglish';
  const entries = educationDirectory.filter((entry) =>
    (agency === 'all' || entry.agency === agency) &&
    (region === 'all' || entry.region === region || entry.region === 'Nationwide') &&
    `${entry.name} ${entry.region} ${entry.services} ${entry.agency}`.toLowerCase().includes(query.toLowerCase().trim()));
  async function copyContact(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ id, message: tl ? 'Nakopya na.' : 'Copied.' });
    } catch {
      setCopyFeedback({ id, message: tl ? 'Hindi makopya; piliin at kopyahin ang contact sa itaas.' : 'Could not copy; select and copy the contact above.' });
    }
  }
  const control = civicInput;
  return <section className="space-y-6">
    <CivicViewHeader icon={Building2} badge={tl ? 'Mga opisyal na education desk' : 'Official education desks'} title={tl ? 'Direktoryo ng education desks' : 'Education desk directory'} description={tl ? 'Mga verified UniFAST regional email at opisyal na office locators. Kumpirmahin ang oras at application call bago pumunta. Walang form data na kasama sa external links.' : 'Verified UniFAST regional emails and official office locators. Confirm hours and application calls before visiting. External links contain no form data.'} />
    <form autoComplete="off" onSubmit={(event) => event.preventDefault()} className={`${civicCard} grid gap-4 sm:grid-cols-3`}><div><label htmlFor="edu-directory-search" className={civicLabel}>{tl ? 'Hanapin ang programa o desk' : 'Find a program or desk'}</label><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500" /><input autoComplete="off" id="edu-directory-search" type="search" className={`${control} pl-10`} value={query} onChange={(event) => { setQuery(event.target.value); setNeed(''); }} /></div></div><div><label htmlFor="edu-directory-agency" className={civicLabel}>{tl ? 'Ahensya' : 'Agency'}</label><select autoComplete="off" id="edu-directory-agency" className={control} value={agency} onChange={(event) => { setAgency(event.target.value); setNeed(''); }}><option value="all">{tl ? 'Lahat ng ahensya' : 'All agencies'}</option>{[...new Set(educationDirectory.map((entry) => entry.agency))].map((item) => <option key={item}>{item}</option>)}</select></div><div><label htmlFor="edu-directory-region" className={civicLabel}>{tl ? 'Rehiyon' : 'Region'}</label><select autoComplete="off" id="edu-directory-region" className={control} value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">{tl ? 'Lahat ng rehiyon' : 'All regions'}</option>{[...new Set(educationDirectory.map((entry) => entry.region))].map((item) => <option key={item}>{item}</option>)}</select></div></form>
    <div className="space-y-3">
      <div role="group" aria-label={tl ? 'Piliin ang ahensya' : 'Agency presets'} className="flex flex-wrap gap-2">{agencyPresets.map(([value, label]) => <button key={value} type="button" className={!need && agency === value ? civicSelectedPill : chipClass} aria-pressed={!need && agency === value} onClick={() => { setAgency(value); setQuery(''); setNeed(''); }}>{value === 'all' && !tl ? 'All' : label}</button>)}</div>
      <div role="group" aria-label={tl ? 'Ano ang kailangan mo?' : 'Common needs'} className="flex flex-wrap gap-2">{needPresets.map(([label, value]) => <button key={label} type="button" className={need === label ? civicSelectedPill : chipClass} aria-pressed={need === label} onClick={() => { setAgency(need === label ? 'all' : value); setQuery(''); setNeed(need === label ? '' : label); }}>{label}</button>)}</div>
    </div>
    <p aria-live="polite" className="text-sm tabular-nums text-slate-600">{entries.length} {tl ? 'desk o official locator' : 'desks or official locators'}</p>
    {entries.length === 0 && <p className="rounded-xl border border-[#E2DFD6] bg-white p-5 text-sm">{tl ? 'Walang tumugma. Subukan ang pangalan ng ahensya o ibang rehiyon.' : 'No matches. Try an agency name or a different region.'}</p>}
    <div className="grid gap-4 sm:grid-cols-2">{entries.map((entry) => <article key={entry.id} className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-5 shadow-xs animate-relief-pillar animate-cascade-item relief-pillar"><p className="text-xs font-semibold text-blue-900">{entry.agency} • {entry.region}</p><h2 className="mt-2 text-lg font-bold text-slate-900">{entry.name}</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">{entry.services}</p>{entry.address && <p className="mt-2 text-sm">{entry.address}</p>}<div className="mt-3 flex flex-col items-start gap-2"><a className="inline-flex min-h-[44px] max-w-full items-center rounded-lg border border-[#E2DFD6] px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-stone-50 focus-ring" href={entry.url} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="mr-2 h-4 w-4 shrink-0" />{tl ? 'Buksan ang opisyal na directory / portal' : 'Open official directory / portal'}</a>{entry.email && <a className="inline-flex min-h-[44px] max-w-full items-center break-all py-2 text-sm text-blue-900 underline focus-ring" href={`mailto:${entry.email}`}>{entry.email}</a>}{entry.phone && <a className="inline-flex min-h-[44px] items-center py-2 text-sm tabular-nums text-blue-900 underline focus-ring" href={`tel:${entry.phone}`}><Phone aria-hidden="true" className="mr-2 h-4 w-4 shrink-0" />{tl ? 'Tumawag' : 'Call'}: {entry.phone}</a>}{entry.email && <button type="button" className={chipClass} onClick={() => copyContact(`${entry.id}-email`, entry.email!)}><Copy aria-hidden="true" className="h-4 w-4" />Copy Email</button>}{entry.phone && <button type="button" className={chipClass} onClick={() => copyContact(`${entry.id}-phone`, entry.phone!)}><Copy aria-hidden="true" className="h-4 w-4" />Copy Phone</button>}{copyFeedback.id.startsWith(`${entry.id}-`) && <p role="status" className="text-sm text-slate-700">{copyFeedback.message}</p>}</div></article>)}</div>
  </section>;
}
