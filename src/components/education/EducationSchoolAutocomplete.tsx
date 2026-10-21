'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { civicInput, civicLabel } from '@/components/shared/civicStyles';
import { resolveLocationMetadata } from '@/lib/data/phLocations';
import { searchSchools, type PhilippineSchool } from '@/lib/data/phSchools';
import type { Language } from '@/lib/i18n';
import type { StudentEducationProfile } from '@/types/education';

type LocatedEducationProfile = StudentEducationProfile & { province?: string; barangay?: string };

interface Props {
  id: string;
  profile: LocatedEducationProfile;
  onChange: (profile: StudentEducationProfile) => void;
  language: Language;
  onSelect?: () => void;
}

export function EducationSchoolAutocomplete({ id, profile, onChange, language, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const tl = language === 'taglish';
  const resultsId = `${id}-options`;
  const results = searchSchools(profile.schoolName, undefined, 8);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      document.getElementById(`${resultsId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open, resultsId]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  function choose(school: PhilippineSchool) {
    const metadata = resolveLocationMetadata(school.province, school.cityMunicipality);
    const nextProfile: LocatedEducationProfile = {
      ...profile,
      schoolName: school.name,
      schoolType: school.schoolType,
      province: school.province,
      cityMunicipality: school.cityMunicipality,
      barangay: '',
      location: metadata.locationTier,
      regionalDailyWage: metadata.regionalDailyWage,
      regionalDailyWageManual: false,
    };
    onChange(nextProfile);
    setOpen(false);
    setActiveIndex(-1);
    onSelect?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(current => results.length ? Math.min(results.length - 1, current + 1) : -1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(current => results.length ? Math.max(0, current < 0 ? results.length - 1 : current - 1) : -1);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (open && results.length) choose(results[activeIndex] ?? results[0]);
    }
  }

  return <div ref={root} className="relative min-w-0">
    <label htmlFor={id} className={civicLabel}>{tl ? 'Hanapin ang paaralan' : 'Find a school'}</label>
    <input
      autoComplete="off"
      id={id}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={resultsId}
      aria-activedescendant={open && activeIndex >= 0 ? `${resultsId}-${activeIndex}` : undefined}
      aria-describedby={`${id}-hint`}
      className={`${civicInput} min-w-0 max-w-full`}
      value={profile.schoolName}
      maxLength={150}
      placeholder={tl ? 'Hal. UP, PUP, PLM, UST o lungsod' : 'For example, UP, PUP, PLM, UST, or a city'}
      onFocus={() => setOpen(true)}
      onChange={event => { onChange({ ...profile, schoolName: event.target.value }); setOpen(true); setActiveIndex(-1); }}
      onKeyDown={handleKeyDown}
    />
    <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-slate-600">
      {tl ? 'I-type ang pangalan, acronym, lungsod, o probinsya. Pumili ng tugma para punan ang uri at lokasyon. Kumpirmahin sa paaralan ang kasalukuyang pagkilala at programa.' : 'Search by school name, acronym, city, or province. Select a match to fill its type and location. Confirm current recognition and program availability with the school.'}
    </p>
    {open && <div id={resultsId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(20rem,45vh)] min-w-0 max-w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-300 bg-white p-1 shadow-lg">
      {results.length ? results.map((school, index) => <div
        role="option"
        id={`${resultsId}-${index}`}
        aria-selected={index === activeIndex}
        key={`${school.kind}-${school.name}-${school.cityMunicipality}`}
        className={`flex min-h-[64px] w-full min-w-0 cursor-pointer flex-col items-start justify-center gap-1 rounded-lg px-3 py-2 text-left ${index === activeIndex ? 'bg-blue-50' : 'hover:bg-stone-50'}`}
        onPointerDown={event => event.preventDefault()}
        onClick={() => choose(school)}
      >
        <span className="w-full min-w-0 break-words text-sm font-semibold text-slate-900">{school.name}</span>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-900">{school.kind}</span>
        <span className="w-full min-w-0 break-words text-xs text-slate-600">{school.cityMunicipality}, {school.province}</span>
      </div>) : <p role="status" className="px-3 py-2 text-sm text-slate-600">{tl ? 'Walang tugma. Maaari mong ilagay ang pangalan nang mano-mano.' : 'No match found. You can enter the school name manually.'}</p>}
    </div>}
  </div>;
}
