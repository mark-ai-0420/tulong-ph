'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Landmark, Search } from 'lucide-react';
import { civicCard, civicInput, civicLabel, civicPill, civicSelectedPill } from '@/components/shared/civicStyles';
import {
  getLGUScholarshipDetails,
  filterLGUScholarships,
  generateLGUScholarshipLetterDraft,
  lguScholarshipPrograms,
  matchLGUScholarshipsToLocation,
  type LGUScholarshipJurisdiction,
} from '@/lib/data/lguScholarships';
import type { Language } from '@/lib/i18n';
import type { StudentEducationProfile } from '@/types/education';

type LocatedProfile = StudentEducationProfile & { province?: string; barangay?: string };
type Copy = {
  heading: string;
  intro: string;
  location: string;
  localMatch: string;
  locationScope: string;
  matchedOnly: string;
  allPrograms: string;
  districtNotice: string;
  all: string;
  city: string;
  province: string;
  district: string;
  search: string;
  results: string;
  grant: string;
  eligibility: string;
  documents: string;
  office: string;
  period: string;
  officialSource: string;
  letter: string;
  copyLetter: string;
  copied: string;
  copyFailed: string;
  noResults: string;
  verify: string;
};

const copy: Record<Language, Copy> = {
  taglish: {
    heading: 'Local Iskolar Directory',
    intro: 'Mga local scholarship listing at inquiry office. Nagbabago ang grant at schedule. Kumpirmahin ang bukas na application call at eksaktong requirements sa opisina.',
    location: 'Ilagay ang city o province sa Step 1 para makita ang local matches.',
    localMatch: 'Itinugma sa lokasyon mula Step 1',
    locationScope: 'Saklaw ng resulta',
    matchedOnly: 'Lokasyon ko lang',
    allPrograms: 'Lahat ng lugar',
    districtNotice: 'Para sa kinatawan ng congressional district ang referral na ito. Kumpirmahin sa opisina kung sakop ng district ang barangay mo at kung sila ang tumatanggap ng kasalukuyang application.',
    all: 'Lahat',
    city: 'City / Municipality',
    province: 'Provincial Capitol',
    district: 'Congressional District',
    search: 'Maghanap ng programa, lokasyon, o requirement',
    results: 'local scholarship listing',
    grant: 'Grant',
    eligibility: 'Mga pangunahing kwalipikasyon',
    documents: 'Mga dokumento',
    office: 'Opisina at contact',
    period: 'Application period',
    officialSource: 'Opisyal na detalye at pinagmulan',
    letter: 'Pormal na liham sa opisina',
    copyLetter: 'Kopyahin ang liham',
    copied: 'Nakopya ang liham.',
    copyFailed: 'Hindi available ang clipboard. Piliin ang draft at kopyahin ito.',
    noResults: 'Walang tugma. Baguhin ang search o piliin ang ibang jurisdiction.',
    verify: 'Ang opisina ang nagkukumpirma ng eligibility, pondo, at approval.',
  },
  cebuano: {
    heading: 'Direktoryo sa Lokal nga Iskolar',
    intro: 'Mga lokal nga scholarship ug opisina nga mahimong pangutan-on. Mahimong mausab ang grant ug iskedyul. Kumpirmaha sa opisina ang kasamtangang panawagan ug tukmang mga kinahanglanon.',
    location: 'Ibutang ang siyudad o probinsiya sa Step 1 aron makita ang lokal nga mga resulta.',
    localMatch: 'Gipares sa lokasyon gikan sa Step 1',
    locationScope: 'Sakop sa mga resulta',
    matchedOnly: 'Lokasyon nako lamang',
    allPrograms: 'Tanang lugar',
    districtNotice: 'Kini nga referral para sa usa ka distrito sa kongreso. Kumpirmaha sa opisina kon apil ang imong barangay sa district ug kon sila ang modawat sa kasamtangang aplikasyon.',
    all: 'Tanan',
    city: 'Siyudad / Munisipyo',
    province: 'Kapitolyo sa Probinsiya',
    district: 'Distrito sa Kongreso',
    search: 'Pangitaa ang programa, lokasyon, o kinahanglanon',
    results: 'lokal nga scholarship',
    grant: 'Grant',
    eligibility: 'Pangunang mga kwalipikasyon',
    documents: 'Mga dokumento',
    office: 'Opisina ug kontak',
    period: 'Panahon sa pag-aplay',
    officialSource: 'Opisyal nga detalye ug tinubdan',
    letter: 'Pormal nga sulat sa opisina',
    copyLetter: 'Kopyaha ang sulat',
    copied: 'Nakopya ang sulat.',
    copyFailed: 'Dili magamit ang clipboard. Pilia ang draft ug kopyaha kini.',
    noResults: 'Walay resulta. Usba ang pagpangita o pilia ang laing hurisdiksyon.',
    verify: 'Ang opisina maoy mokumpirma sa kwalipikasyon, pondo, ug pag-apruba.',
  },
  ilocano: {
    heading: 'Listaan ti Lokal nga Iskolar',
    intro: 'Dagiti lokal a scholarship ken opisina a mabalin a saludsoden. Mabalin a mabaliwan ti grant ken oras. Pasingkedan iti opisina ti agdama a panangawis ken dagiti kasapulan.',
    location: 'Iserrek ti siudad wenno probinsia iti Step 1 tapno makita dagiti lokal a katupag.',
    localMatch: 'Naiparis iti lokasion manipud Step 1',
    locationScope: 'Lawlaw ti resulta',
    matchedOnly: 'Naiparis a lokasion laeng',
    allPrograms: 'Amin a lokasion',
    districtNotice: 'Daytoy a referral ket para iti maysa a congressional district. Pasingkedan iti opisina no sakupen ti district ti barangaymo ken no isu ti mangawat iti agdama a panagaplikar.',
    all: 'Amin',
    city: 'Siudad / Munisipalidad',
    province: 'Kapitolio ti Probinsia',
    district: 'Distrito ti Kongreso',
    search: 'Agbiruk iti programa, lokasion, wenno kasapulan',
    results: 'lokal a scholarship',
    grant: 'Grant',
    eligibility: 'Dagiti kangrunaan a kasapulan',
    documents: 'Dagiti dokumento',
    office: 'Opisina ken kontak',
    period: 'Panawen ti panagaplikar',
    officialSource: 'Opisial a detalye ken pagtaudan',
    letter: 'Pormal a surat iti opisina',
    copyLetter: 'Kopiaen ti surat',
    copied: 'Nakopia ti surat.',
    copyFailed: 'Saan a magun-od ti clipboard. Piliem ti draft ken kopiaen.',
    noResults: 'Awan ti katupag. Baliwam ti panagbiruk wenno pilien ti sabali a hurisdiksion.',
    verify: 'Ti opisina ti mangpasingked iti pannakaikari, pondo, ken panangaprobar.',
  },
  en: {
    heading: 'Local Scholarship Directory',
    intro: 'Local scholarship listings and inquiry offices. Grants and schedules can change. Confirm the current application call and exact requirements with the office.',
    location: 'Enter your city or province in Step 1 to see local matches.',
    localMatch: 'Matched to the location from Step 1',
    locationScope: 'Result scope',
    matchedOnly: 'My matched location',
    allPrograms: 'All locations',
    districtNotice: 'This referral is for a congressional district. Confirm with the office that your barangay is in this district and that the office handles the current application.',
    all: 'All',
    city: 'City / Municipality',
    province: 'Provincial Capitol',
    district: 'Congressional District',
    search: 'Search programs, locations, or requirements',
    results: 'local scholarship listings',
    grant: 'Grant',
    eligibility: 'Eligibility highlights',
    documents: 'Documents',
    office: 'Office and contact',
    period: 'Application period',
    officialSource: 'Official details and source',
    letter: 'Formal letter to the office',
    copyLetter: 'Copy letter',
    copied: 'Letter copied.',
    copyFailed: 'Clipboard is unavailable. Select the draft and copy it.',
    noResults: 'No matches. Change the search or choose another jurisdiction.',
    verify: 'The office confirms eligibility, funding, and approval.',
  },
};

const jurisdictions: { id: 'all' | LGUScholarshipJurisdiction; label: (labels: Copy) => string }[] = [
  { id: 'all', label: labels => labels.all },
  { id: 'city_municipality', label: labels => labels.city },
  { id: 'province', label: labels => labels.province },
  { id: 'congressional_district', label: labels => labels.district },
];

export function LGUScholarshipDirectoryCard({ profile, language = 'taglish' }: { profile: LocatedProfile; language?: Language }) {
  const [jurisdiction, setJurisdiction] = useState<'all' | LGUScholarshipJurisdiction>('all');
  const [locationScope, setLocationScope] = useState<'matched' | 'all'>('matched');
  const [query, setQuery] = useState('');
  const [letterProgramId, setLetterProgramId] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const labels = copy[language];
  const matches = matchLGUScholarshipsToLocation(profile);
  const matchIds = new Set(matches.map(program => program.id));
  const filtered = filterLGUScholarships({ jurisdiction, query }).filter(program => locationScope === 'all' || matches.length === 0 || matchIds.has(program.id));
  const letterProgram = lguScholarshipPrograms.find(program => program.id === letterProgramId);
  const letterDraft = letterProgram ? generateLGUScholarshipLetterDraft(profile, letterProgram, language) : '';

  async function copyLetter() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(letterDraft);
      setCopyStatus(labels.copied);
    } catch {
      setCopyStatus(labels.copyFailed);
    }
  }

  return <section className={`${civicCard} min-w-0 space-y-4`} aria-labelledby="lgu-scholarship-heading">
    <div>
      <h2 id="lgu-scholarship-heading" className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <Landmark aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-900" />{labels.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{labels.intro}</p>
    </div>
    {matches.length > 0
      ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900" role="status">{labels.localMatch}: {profile.cityMunicipality}{profile.province ? `, ${profile.province}` : ''}</p>
      : <p className="text-sm text-slate-600">{labels.location}</p>}
    {matches.length > 0 && <div className="space-y-2">
      <p className={civicLabel} id="lgu-scholarship-location-scope-label">{labels.locationScope}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="lgu-scholarship-location-scope-label">
        <button type="button" aria-pressed={locationScope === 'matched'} className={`min-h-[44px] ${locationScope === 'matched' ? civicSelectedPill : civicPill}`} onClick={() => setLocationScope('matched')}>{labels.matchedOnly}</button>
        <button type="button" aria-pressed={locationScope === 'all'} className={`min-h-[44px] ${locationScope === 'all' ? civicSelectedPill : civicPill}`} onClick={() => setLocationScope('all')}>{labels.allPrograms}</button>
      </div>
    </div>}
    <div className="space-y-2">
      <p className={civicLabel} id="lgu-scholarship-jurisdiction-label">{language === 'en' ? 'Filter by jurisdiction' : language === 'cebuano' ? 'Pagsala sumala sa hurisdiksyon' : language === 'ilocano' ? 'Salain babaen iti hurisdiksion' : 'Piliin ayon sa jurisdiction'}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="lgu-scholarship-jurisdiction-label">
        {jurisdictions.map(item => <button
          key={item.id}
          type="button"
          aria-pressed={jurisdiction === item.id}
          className={`min-h-[44px] ${jurisdiction === item.id ? civicSelectedPill : civicPill}`}
          onClick={() => setJurisdiction(item.id)}
        >{item.label(labels)}</button>)}
      </div>
    </div>
    <div>
      <label htmlFor="lgu-scholarship-search" className={civicLabel}>{labels.search}</label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500" />
        <input autoComplete="off" id="lgu-scholarship-search" type="search" className={`${civicInput} min-h-[44px] pl-10`} value={query} onChange={event => setQuery(event.target.value)} />
      </div>
    </div>
    <p className="text-sm tabular-nums text-slate-600" role="status" aria-live="polite">{filtered.length} {labels.results}</p>
    {filtered.length === 0 && <p className="rounded-lg border border-[#E2DFD6] bg-white p-4 text-sm text-slate-700">{labels.noResults}</p>}
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      {filtered.map(program => {
        const isLetterOpen = letterProgramId === program.id;
        const draft = isLetterOpen ? letterDraft : '';
        const details = getLGUScholarshipDetails(program, language);
        const contactUrl = program.contactOrWebsite?.startsWith('https://') ? program.contactOrWebsite : undefined;
        return <article key={program.id} className="min-w-0 space-y-3 rounded-xl border border-[#E2DFD6] bg-white p-4">
          <header>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-900">{jurisdictions.find(item => item.id === program.jurisdiction)?.label(labels)}</p>
            <h3 className="mt-1 break-words text-lg font-bold leading-snug text-slate-900">{program.name}</h3>
            <p className="mt-1 break-words text-sm text-slate-600">{[program.cityMunicipality, program.province, program.congressionalDistrict, program.region].filter(Boolean).join(' · ')}</p>
          </header>
          {program.districtMatchNeedsConfirmation && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">{labels.districtNotice}</p>}
          <div className="space-y-3 text-sm leading-relaxed">
            <div><h4 className="font-bold text-slate-900">{labels.grant}</h4><p className="break-words text-slate-700">{details.grant}</p></div>
            <div><h4 className="font-bold text-slate-900">{labels.eligibility}</h4><p className="break-words text-slate-700">{details.eligibility}</p></div>
            <div><h4 className="font-bold text-slate-900">{labels.documents}</h4><p className="break-words text-slate-700">{details.documents}</p></div>
            <div><h4 className="font-bold text-slate-900">{labels.office}</h4><p className="break-words text-slate-700">{program.officeName}</p>
              {contactUrl ? <a className="inline-flex min-h-[44px] items-center break-all font-semibold text-blue-900 underline focus-ring" href={contactUrl} target="_blank" rel="noreferrer">{program.contactOrWebsite}<ExternalLink aria-hidden="true" className="ml-1 h-4 w-4 shrink-0" /></a>
                : program.contactOrWebsite && <p className="break-words text-slate-700">{program.contactOrWebsite}</p>}
            </div>
            {program.applicationPeriod && <div><h4 className="font-bold text-slate-900">{labels.period}</h4><p className="text-slate-700">{details.applicationPeriod}</p></div>}
          </div>
          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">{labels.verify}</p>
          <div className="flex flex-wrap gap-2">
            <a className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-blue-900 underline focus-ring" href={program.sourceUrl} target="_blank" rel="noreferrer">{labels.officialSource}<ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" /></a>
            {program.additionalSources?.map(source => <a key={source.url} className="inline-flex min-h-[44px] items-center font-semibold text-blue-900 underline focus-ring" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}
          </div>
          <button type="button" className="min-h-[44px] rounded-xl border border-blue-900 px-4 py-2 text-sm font-semibold text-blue-900 focus-ring" aria-expanded={isLetterOpen} aria-controls={`lgu-letter-${program.id}`} onClick={() => { setLetterProgramId(isLetterOpen ? '' : program.id); setCopyStatus(''); }}>
            {labels.letter}
          </button>
          {isLetterOpen && <div id={`lgu-letter-${program.id}`} className="space-y-2 rounded-lg border border-[#E2DFD6] bg-stone-50 p-3">
            <label htmlFor={`lgu-letter-draft-${program.id}`} className={civicLabel}>{labels.letter}</label>
            <textarea id={`lgu-letter-draft-${program.id}`} autoComplete="off" readOnly rows={12} className={`${civicInput} min-h-[44px] resize-y whitespace-pre-wrap`} value={draft} />
            <button type="button" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white focus-ring" onClick={copyLetter}><Copy aria-hidden="true" className="h-4 w-4" />{labels.copyLetter}</button>
            {copyStatus && <p role="status" aria-live="polite" className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700">{copyStatus === labels.copied && <Check aria-hidden="true" className="h-4 w-4 text-emerald-700" />}{copyStatus}</p>}
          </div>}
        </article>;
      })}
    </div>
  </section>;
}
