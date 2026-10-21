'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { civicInput, civicLabel } from '@/components/shared/civicStyles';
import { searchDegreePrograms, type PhilippineDegreeProgram } from '@/lib/data/phDegreePrograms';
import type { Language } from '@/lib/i18n';
import type { StudentEducationProfile } from '@/types/education';

interface Props {
  id: string;
  profile: StudentEducationProfile;
  onChange: (profile: StudentEducationProfile) => void;
  language: Language;
  onSelect?: () => void;
}

export function EducationCourseAutocomplete({ id, profile, onChange, language, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const tl = language === 'taglish';
  const resultsId = `${id}-options`;
  const results = searchDegreePrograms(profile.degreeProgram).slice(0, 8);

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

  function choose(program: PhilippineDegreeProgram) {
    onChange({
      ...profile,
      degreeProgram: program.name,
      priorityCourse: program.isChedPriority || program.isDostPriority,
      coconutPriorityCourse: program.isCoconutPriority,
    });
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
    <label htmlFor={id} className={civicLabel}>{tl ? 'Hanapin ang degree program' : 'Find a degree program'}</label>
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
      value={profile.degreeProgram}
      maxLength={150}
      placeholder={tl ? 'Hal. BS Agriculture, Nursing, o Computer Science' : 'For example, Agriculture, Nursing, or Computer Science'}
      onFocus={() => setOpen(true)}
      onChange={event => {
        onChange({
          ...profile,
          degreeProgram: event.target.value,
          priorityCourse: false,
          dostQualifiedSchool: false,
          coconutPriorityCourse: false,
        });
        setOpen(true);
        setActiveIndex(-1);
      }}
      onKeyDown={handleKeyDown}
    />
    <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-slate-600">
      {tl
        ? 'Pumili ng tugma para punan ang priority fields. Gabay lang ang listahan. Kumpirmahin sa ahensya kung kinikilala ang paaralan at programa.'
        : 'Select a match to fill the priority fields. This list is guidance only. Confirm school and program recognition with the agency.'}
    </p>
    {open && <div id={resultsId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(20rem,45vh)] min-w-0 max-w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-300 bg-white p-1 shadow-lg">
      {results.length ? results.map((program, index) => <button
        type="button"
        role="option"
        id={`${resultsId}-${index}`}
        aria-selected={index === activeIndex}
        key={program.id}
        className={`flex min-h-[64px] w-full min-w-0 cursor-pointer flex-col items-start justify-center gap-1 rounded-lg px-3 py-2 text-left ${index === activeIndex ? 'bg-blue-50' : 'hover:bg-stone-50'}`}
        onPointerDown={event => event.preventDefault()}
        onClick={() => choose(program)}
      >
        <span className="w-full min-w-0 break-words text-sm font-semibold text-slate-900">{program.name}</span>
        <span className="w-full text-xs text-slate-600">{program.category}</span>
        <span className="flex flex-wrap gap-1.5">
          {program.isChedPriority && <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-900">CHED Priority</span>}
          {program.isDostPriority && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">DOST S&amp;T</span>}
          {program.isCoconutPriority && <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">PCA CoScho</span>}
        </span>
      </button>) : <p role="status" className="px-3 py-3 text-sm text-slate-600">
        {profile.degreeProgram
          ? (tl ? 'Walang tugma. Maaari mong ilagay ang pangalan nang mano-mano.' : 'No match found. You can enter the name manually.')
          : (tl ? 'Mag-type para maghanap ng degree program.' : 'Type to search degree programs.')}
      </p>}
    </div>}
  </div>;
}
