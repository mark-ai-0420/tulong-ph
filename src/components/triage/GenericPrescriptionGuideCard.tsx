'use client';

import React, { useMemo, useState } from 'react';
import { Check, Clipboard, Pill } from 'lucide-react';
import {
  filterGenericMedicines,
  GENERIC_MEDICINES,
  getDoctorRequestScript,
  getPrescriptionChecklist,
  type TherapeuticCategory,
  type GenericMedicineItem,
} from '@/lib/data/genericPrescriptionGuide';
import type { Language } from '@/lib/i18n';

interface GenericPrescriptionGuideCardProps {
  language: Language;
}

interface GenericPrescriptionChecklistPrintViewProps {
  language: Language;
}

const CATEGORY_ORDER: TherapeuticCategory[] = [
  'antibiotic',
  'cardiovascular',
  'diabetes_endocrine',
  'pain_analgesic',
  'respiratory',
  'gastrointestinal',
  'critical_inpatient',
  'other',
];

const COPY: Record<Language, {
  title: string;
  intro: string;
  searchLabel: string;
  searchPlaceholder: string;
  categoryLabel: string;
  allCategories: string;
  results: string;
  noResults: string;
  brands: string;
  forms: string;
  pnf: string;
  konsulta: string;
  selected: string;
  deselect: string;
  disclaimer: string;
  sources: string;
  checklistTitle: string;
  checklistProgress: (checked: number, total: number) => string;
  lawLabel: string;
  practicalLabel: string;
  checklistNote: string;
  scriptTitle: string;
  scriptPrompt: string;
  copy: string;
  copied: string;
  copyFailed: string;
  categories: Record<TherapeuticCategory, string>;
}> = {
  taglish: {
    title: 'Gabay sa Generic Medicine at Reseta',
    intro: 'Panghanda ito para sa pag-uusap sa doktor at parmasyutiko. Hindi ito payo na magsimula, huminto, o magpalit ng gamot.',
    searchLabel: 'Hanapin ang generic o brand name',
    searchPlaceholder: 'Hal. Biogesic, amlodipine, tablet',
    categoryLabel: 'Kategorya ng gamot',
    allCategories: 'Lahat ng kategorya',
    results: 'gamot na nakita',
    noResults: 'Walang tugma. Subukan ang ibang pangalan o kategorya.',
    brands: 'Mga halimbawang brand',
    forms: 'Karaniwang porma at lakas sa formulary',
    pnf: 'Nasa PNF list',
    konsulta: 'YAKAP / Konsulta 21 list',
    selected: 'Napili para sa script',
    deselect: 'Alisin ang napili',
    disclaimer: 'Mga halimbawa lang ang brand at porma. Ipa-match sa doktor o lisensyadong parmasyutiko ang generic name, lakas, porma, at route. Huwag magpalit ng reseta nang walang pahintulot ng doktor.',
    sources: 'Batayan: DOH Philippine National Formulary EML snapshot at PhilHealth YAKAP 21-medicine list para sa 2026. Nag-iiba ang stock at saklaw ayon sa provider.',
    checklistTitle: '6 na Tanong para sa Kumpletong Reseta',
    checklistProgress: (checked, total) => `${checked} sa ${total} ang namarkahan`,
    lawLabel: 'RA 6675',
    practicalLabel: 'Praktikal na tsek',
    checklistNote: 'Tahasang inaatas ng RA 6675 ang paggamit ng generic name. Ang iba pang item ay praktikal na pag-check sa pagkakakumpleto; maaaring mag-iba ang tuntunin ayon sa gamot at pasilidad.',
    scriptTitle: 'Magalang na hiling sa doktor',
    scriptPrompt: 'Maaari mong kopyahin o basahin ito sa doktor. Ipa-confirm sa parmasyutiko ang anumang katumbas bago bumili o gumamit.',
    copy: 'Kopyahin ang hiling',
    copied: 'Nakopya ang hiling.',
    copyFailed: 'Hindi ma-access ang clipboard. Piliin ang text sa itaas at kopyahin ito.',
    categories: {
      antibiotic: 'Antibiotics',
      cardiovascular: 'Puso at presyon ng dugo',
      diabetes_endocrine: 'Diabetes at hormones',
      pain_analgesic: 'Pampawala ng sakit',
      respiratory: 'Paghinga at allergy',
      gastrointestinal: 'Tiyan at bituka',
      critical_inpatient: 'Critical na gamot sa ospital',
      other: 'Iba pa',
    },
  },
  cebuano: {
    title: 'Giya sa Generic Medicine ug Reseta',
    intro: 'Andam kini alang sa pakig-istorya sa doktor ug pharmacist. Dili kini tambag sa pagsugod, paghunong, o pag-ilis og tambal.',
    searchLabel: 'Pangitaa ang generic o brand name',
    searchPlaceholder: 'Pananglitan: Biogesic, amlodipine, tablet',
    categoryLabel: 'Kategorya sa tambal',
    allCategories: 'Tanang kategorya',
    results: 'tambal nga nakit-an',
    noResults: 'Walay resulta. Sulayi ang laing ngalan o kategorya.',
    brands: 'Mga pananglitan nga brand',
    forms: 'Kasagarang porma ug kusog sa formulary',
    pnf: 'Naa sa PNF list',
    konsulta: 'YAKAP / Konsulta 21 list',
    selected: 'Napili para sa script',
    deselect: 'Tangtanga ang gipili',
    disclaimer: 'Mga pananglitan lang ang brand ug porma. Ipatan-aw sa doktor o lisensyadong pharmacist ang generic name, kusog, porma, ug route. Ayaw pag-ilis sa reseta kon walay pagtugot sa doktor.',
    sources: 'Basehan: DOH Philippine National Formulary EML snapshot ug PhilHealth YAKAP 21-medicine list para sa 2026. Nagkalahi ang stock ug coverage sa matag provider.',
    checklistTitle: '6 ka Pangutana para sa Kompletong Reseta',
    checklistProgress: (checked, total) => `${checked} sa ${total} ang natiman-an`,
    lawLabel: 'RA 6675',
    practicalLabel: 'Praktikal nga tsek',
    checklistNote: 'Ang RA 6675 klarong nagmando sa paggamit sa generic name. Ang ubang butang praktikal nga pagsusi sa pagkakompleto; mahimong magkalahi ang lagda depende sa tambal ug pasilidad.',
    scriptTitle: 'Matinahurong hangyo sa doktor',
    scriptPrompt: 'Mahimo nimo kining kopyahon o basahon sa doktor. Ipakumpirma sa pharmacist ang bisan unsang katumbas sa dili pa mopalit o mogamit.',
    copy: 'Kopyaha ang hangyo',
    copied: 'Nakopya na ang hangyo.',
    copyFailed: 'Dili maablihan ang clipboard. Pilia ang teksto sa ibabaw ug kopyaha kini.',
    categories: {
      antibiotic: 'Antibiotics',
      cardiovascular: 'Kasingkasing ug presyon sa dugo',
      diabetes_endocrine: 'Diabetes ug hormones',
      pain_analgesic: 'Pawala sa kasakit',
      respiratory: 'Pagginhawa ug allergy',
      gastrointestinal: 'Tiyan ug tinai',
      critical_inpatient: 'Critical nga tambal sa ospital',
      other: 'Uban pa',
    },
  },
  ilocano: {
    title: 'Giya iti Generic Medicine ken Reseta',
    intro: 'Pagsagsaganad daytoy para iti pannakisarita iti doktor ken parmasista. Saan daytoy a bilin a mangrugi, mangisardeng, wenno agbaliw iti agas.',
    searchLabel: 'Sapulen ti generic wenno brand name',
    searchPlaceholder: 'Kas pagarigan: Biogesic, amlodipine, tablet',
    categoryLabel: 'Kategoria ti agas',
    allCategories: 'Amin a kategoria',
    results: 'agas a nasarakan',
    noResults: 'Awan ti nagtunos. Padasen ti sabali a nagan wenno kategoria.',
    brands: 'Dagiti pagwadan a brand',
    forms: 'Kadawyan a porma ken pigsa iti formulary',
    pnf: 'Adda iti PNF list',
    konsulta: 'YAKAP / Konsulta 21 list',
    selected: 'Napili para iti script',
    deselect: 'Ikkaten ti napili',
    disclaimer: 'Pagwadan laeng dagitoy a brand ken porma. Ipa-match iti doktor wenno lisensiado a parmasista ti generic name, pigsa, porma, ken route. Saan nga agbaliw iti reseta no awan ti pammalubos ti doktor.',
    sources: 'Pagbatayan: DOH Philippine National Formulary EML snapshot ken PhilHealth YAKAP 21-medicine list para iti 2026. Agbalbaliw ti stock ken coverage iti provider.',
    checklistTitle: '6 a Saludsod para iti Kumpleto a Reseta',
    checklistProgress: (checked, total) => `${checked} iti ${total} ti namarkaan`,
    lawLabel: 'RA 6675',
    practicalLabel: 'Praktikal a panang-check',
    checklistNote: 'Nalawag nga ipagpilitan ti RA 6675 ti panangusar iti generic name. Dagiti sabali ket praktikal a panang-check iti kinakompleto; mabalin a nagduduma dagiti pagalagadan segun iti agas ken pasilidad.',
    scriptTitle: 'Naayat a kiddaw iti doktor',
    scriptPrompt: 'Mabalinmo nga ikopia wenno basaen daytoy iti doktor. Ipa-confirm iti parmasista ti aniaman a kapada sakbay nga gumatang wenno agusar.',
    copy: 'Ikopia ti kiddaw',
    copied: 'Nakopia ti kiddaw.',
    copyFailed: 'Saan a magun-od ti clipboard. Pilien ti teksto iti ngato ken ikopia.',
    categories: {
      antibiotic: 'Antibiotics',
      cardiovascular: 'Puso ken presion ti dara',
      diabetes_endocrine: 'Diabetes ken hormones',
      pain_analgesic: 'Pangpabassit iti ut-ot',
      respiratory: 'Panaganges ken allergy',
      gastrointestinal: 'Tian ken bituka',
      critical_inpatient: 'Critical a agas iti ospital',
      other: 'Dadduma pay',
    },
  },
  en: {
    title: 'Generic Medicine and Prescription Guide',
    intro: 'Use this to prepare questions for a doctor and pharmacist. It does not advise starting, stopping, or changing a medicine.',
    searchLabel: 'Search generic or brand name',
    searchPlaceholder: 'For example: Biogesic, amlodipine, tablet',
    categoryLabel: 'Medicine category',
    allCategories: 'All categories',
    results: 'medicines found',
    noResults: 'No matches. Try another name or category.',
    brands: 'Example brands',
    forms: 'Common formulary forms and strengths',
    pnf: 'PNF listed',
    konsulta: 'YAKAP / Konsulta 21 list',
    selected: 'Selected for script',
    deselect: 'Clear selection',
    disclaimer: 'Brands and forms are examples. Ask a doctor or licensed pharmacist to match the generic name, strength, form, and route. Do not change a prescription without the doctor’s approval.',
    sources: 'References: DOH Philippine National Formulary EML snapshot and PhilHealth YAKAP 21-medicine list for 2026. Stock and coverage vary by provider.',
    checklistTitle: 'Six Checks for a Complete Prescription',
    checklistProgress: (checked, total) => `${checked} of ${total} checked`,
    lawLabel: 'RA 6675',
    practicalLabel: 'Practical check',
    checklistNote: 'RA 6675 specifically requires use of the generic name. The other items are practical completeness checks; requirements may vary by medicine and facility.',
    scriptTitle: 'A polite request for the doctor',
    scriptPrompt: 'Copy this or read it to the doctor. Ask a pharmacist to confirm any equivalent before buying or using it.',
    copy: 'Copy request',
    copied: 'Request copied.',
    copyFailed: 'Clipboard is unavailable. Select the text above and copy it.',
    categories: {
      antibiotic: 'Antibiotics',
      cardiovascular: 'Heart and blood pressure',
      diabetes_endocrine: 'Diabetes and endocrine',
      pain_analgesic: 'Pain relief',
      respiratory: 'Respiratory and allergy',
      gastrointestinal: 'Gastrointestinal',
      critical_inpatient: 'Critical inpatient medicines',
      other: 'Other',
    },
  },
};

export const GenericPrescriptionChecklistPrintView: React.FC<GenericPrescriptionChecklistPrintViewProps> = ({ language }) => {
  const copy = COPY[language];
  const checklist = getPrescriptionChecklist(language);

  return (
    <div className="min-w-0 space-y-3 text-slate-900">
      <p className="break-words text-xs leading-relaxed">{copy.checklistNote}</p>
      <ol className="min-w-0 space-y-2">
        {checklist.map((item, index) => (
          <li key={item.id} className="flex min-w-0 break-inside-avoid gap-3 border-b border-slate-300 py-2">
            <span aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 border border-slate-700" />
            <span className="min-w-0 flex-1 break-words">
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xs font-bold">{index + 1}. {item.title}</span>
                <span className="text-xs font-semibold">{item.mandatory ? copy.lawLabel : copy.practicalLabel}</span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed">{item.description}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="break-words border-t border-slate-400 pt-2 text-xs leading-relaxed">{copy.disclaimer}</p>
    </div>
  );
};

export const GenericPrescriptionGuideCard: React.FC<GenericPrescriptionGuideCardProps> = ({ language }) => {
  const copy = COPY[language];
  const checklist = getPrescriptionChecklist(language);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TherapeuticCategory | 'all'>('all');
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const medicines = useMemo(
    () => filterGenericMedicines(query, category),
    [query, category],
  );
  const selectedMedicine = GENERIC_MEDICINES.find((medicine) => medicine.id === selectedMedicineId);
  const script = getDoctorRequestScript(language, selectedMedicine);
  const checkedCount = checklist.filter((item) => checkedItems[item.id]).length;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(script);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const toggleChecklistItem = (id: string) => {
    setCheckedItems((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <section aria-labelledby="generic-prescription-guide-title" className="min-w-0 space-y-5 rounded-2xl border border-[#E2DFD6] bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-900">
          <Pill aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 id="generic-prescription-guide-title" className="break-words text-base font-bold text-slate-900">{copy.title}</h2>
          <p className="break-words text-xs leading-relaxed text-slate-600">{copy.intro}</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
        <div className="min-w-0">
          <label htmlFor="generic-medicine-search" className="mb-1 block text-xs font-bold text-slate-800">{copy.searchLabel}</label>
          <input
            autoComplete="off"
            id="generic-medicine-search"
            name="genericMedicineSearch"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="generic-medicine-category" className="mb-1 block text-xs font-bold text-slate-800">{copy.categoryLabel}</label>
          <select
            id="generic-medicine-category"
            name="genericMedicineCategory"
            value={category}
            onChange={(event) => setCategory(event.target.value as TherapeuticCategory | 'all')}
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          >
            <option value="all">{copy.allCategories}</option>
            {CATEGORY_ORDER.map((item) => (
              <option key={item} value={item}>{copy.categories[item]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <p aria-live="polite" className="text-xs font-semibold text-slate-600">{medicines.length} {copy.results}</p>
        {medicines.length ? (
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            {medicines.map((medicine: GenericMedicineItem) => {
              const isSelected = selectedMedicineId === medicine.id;
              return (
                <button
                  key={medicine.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedMedicineId(isSelected ? null : medicine.id)}
                  className={`min-h-[44px] min-w-0 rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 ${isSelected ? 'border-blue-900 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <span className="block break-words text-sm font-bold text-slate-900">{medicine.genericName}</span>
                  <span className="mt-1 block break-words text-xs leading-relaxed text-slate-700"><strong>{copy.brands}:</strong> {medicine.brandExamples.join(', ')}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-600">{copy.forms}:</span>
                  <span className="mt-1 flex min-w-0 flex-wrap gap-1">
                    {medicine.commonDosageForms.map((form) => (
                      <span key={form} className="max-w-full break-words rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700">{form}</span>
                    ))}
                  </span>
                  <span className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                    {medicine.pnfListed && <span className="max-w-full break-words rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800">{copy.pnf}</span>}
                    {medicine.konsultaCovered && <span className="max-w-full break-words rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800">{copy.konsulta}</span>}
                    {isSelected && <span className="max-w-full break-words rounded-full border border-blue-400 px-2 py-1 text-xs font-semibold text-blue-950">{copy.selected}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{copy.noResults}</p>
        )}
        <p className="break-words text-xs leading-relaxed text-slate-600">{copy.disclaimer}</p>
        <p className="break-words text-xs leading-relaxed text-slate-500">{copy.sources}</p>
      </div>

      <div className="min-w-0 border-t border-slate-200 pt-4">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
          <h3 className="break-words text-sm font-bold text-slate-900">{copy.checklistTitle}</h3>
          <p aria-live="polite" className="text-xs font-semibold text-slate-600">{copy.checklistProgress(checkedCount, checklist.length)}</p>
        </div>
        <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{copy.checklistNote}</p>
        <ul className="mt-3 min-w-0 space-y-2">
          {checklist.map((item) => (
            <li key={item.id} className="min-w-0">
              <label htmlFor={`prescription-check-${item.id}`} className="flex min-h-[56px] min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <input
                  autoComplete="off"
                  id={`prescription-check-${item.id}`}
                  name={`prescription-check-${item.id}`}
                  type="checkbox"
                  checked={Boolean(checkedItems[item.id])}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                />
                <span className="min-w-0 flex-1 break-words">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="break-words text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="rounded-full border border-slate-300 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{item.mandatory ? copy.lawLabel : copy.practicalLabel}</span>
                  </span>
                  <span className="mt-1 block break-words text-xs leading-relaxed text-slate-600">{item.description}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 space-y-2 border-t border-slate-200 pt-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{copy.scriptTitle}</h3>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{copy.scriptPrompt}</p>
        </div>
        <label htmlFor="doctor-request-script" className="sr-only">{copy.scriptTitle}</label>
        <textarea
          autoComplete="off"
          id="doctor-request-script"
          name="doctorRequestScript"
          readOnly
          rows={5}
          value={script}
          className="min-h-[120px] w-full min-w-0 resize-y rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex min-h-[44px] max-w-full items-center justify-center gap-2 rounded-xl border border-blue-900 bg-white px-4 py-2 text-xs font-bold text-blue-950 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          >
            {copyStatus === 'copied' ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : <Clipboard aria-hidden="true" className="h-4 w-4 shrink-0" />}
            <span className="break-words">{copyStatus === 'copied' ? copy.copied : copy.copy}</span>
          </button>
          <p aria-live="polite" className="min-w-0 break-words text-xs text-slate-600">
            {copyStatus === 'failed' ? copy.copyFailed : copyStatus === 'copied' ? copy.copied : ''}
          </p>
        </div>
      </div>
    </section>
  );
};
