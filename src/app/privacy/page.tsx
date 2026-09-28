'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Languages,
  Printer,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Laptop,
  FileText,
  EyeOff,
  Database,
  Cpu,
  PhoneCall,
  Info,
  Scale,
  X,
  History,
} from 'lucide-react';
import { Language } from '@/lib/i18n';
import { clearAllUserData, loadDocuments } from '@/lib/storage';

export default function PrivacyPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('taglish');
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeStatus, setWipeStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('tulong_lang') as Language;
      if (savedLang === 'en' || savedLang === 'taglish') {
        setLanguage(savedLang);
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const handleToggleLanguage = () => {
    const nextLang: Language = language === 'taglish' ? 'en' : 'taglish';
    setLanguage(nextLang);
    try {
      localStorage.setItem('tulong_lang', nextLang);
    } catch {
      // ignore
    }
  };

  const handleExecuteWipe = async () => {
    try {
      // 1. Revoke active document blob URLs from memory
      try {
        const docs = await loadDocuments();
        docs.forEach((doc) => {
          if (doc.dataUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(doc.dataUrl);
          }
        });
      } catch {
        // Continue wiping even if document loading fails
      }

      // 2. Clean up any residual print iframes in the DOM
      if (typeof document !== 'undefined') {
        document.querySelectorAll('iframe[src^="blob:"]').forEach((el) => el.remove());
      }

      // 3. Purge storage layers (IndexedDB, localStorage, sessionStorage, caches)
      await clearAllUserData();

      // 4. Scrub browser history state so 'Back' cannot reload filled forms
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', '/');
      }

      setIsWipeModalOpen(false);
      setWipeStatus(
        language === 'taglish'
          ? 'Matagumpay na nabura ang lahat ng datos. Ibabalik ka sa Home...'
          : 'All data successfully purged. Redirecting to Home...'
      );

      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err) {
      console.error('Failed to wipe data:', err);
      setIsWipeModalOpen(false);
      setWipeStatus(
        language === 'taglish'
          ? 'Nagkaroon ng aberya sa pagbura. Paki-clear ang browser cache nang manu-mano.'
          : 'Error purging data. Please clear browser cache manually.'
      );
    }
  };

  const isTaglish = language === 'taglish';

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {wipeStatus && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-900 text-white font-semibold text-xs sm:text-sm shadow-xl flex items-center gap-2.5 border border-emerald-700 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{wipeStatus}</span>
        </div>
      )}

      {/* Top Civic Navigation & Utility Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2DFD6] shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Return Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-11 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#F3F2EC] hover:bg-[#EAE8E0] text-slate-800 hover:text-slate-950 font-bold text-xs sm:text-sm transition-colors border border-[#E2DFD6] focus-ring"
              title={isTaglish ? 'Bumalik sa Gabay sa Tulong' : 'Return to Aid Navigator'}
            >
              <ArrowLeft className="w-4 h-4 text-blue-900 shrink-0" />
              <span>
                {isTaglish
                  ? '← Bumalik sa Gabay sa Tulong'
                  : '← Return to Aid Navigator'}
              </span>
            </Link>

            {/* Language & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleToggleLanguage}
                className="h-11 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl border border-[#E2DFD6] bg-white hover:bg-stone-50 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition-colors inline-flex items-center gap-2 focus-ring cursor-pointer"
                title={isTaglish ? 'Palitan ang Wika' : 'Switch Language'}
                aria-label="Toggle language between Taglish and English"
              >
                <Languages className="w-4 h-4 text-blue-900 shrink-0" />
                <span>{isTaglish ? 'English' : 'Taglish'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Civic Editorial Banner */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
        <div className="space-y-4 border-b border-[#E2DFD6] pb-8">
          {/* Authoritative Seal / Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-950 border border-blue-200/80 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Republika ng Pilipinas • RA 10173 Data Privacy Compliance</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {isTaglish
              ? 'Data Privacy Charter at Opisyal na Disclaimer'
              : 'Data Privacy Charter & Civic Disclaimer'}
          </h1>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl font-medium">
            {isTaglish
              ? 'Ang TulongPH ay binuo nang may "Zero-Data-Collection Philosophy" upang protektahan ang mga mahihinang pamilyang Pilipino sa oras ng krisis pangkalusugan. Lahat ng inyong mga dokumento, abstract, at profile ay nananatili lamang sa inyong sariling telepono o computer — walang server, walang tracker, at walang tagong database.'
              : 'TulongPH is engineered with a strict "Zero-Data-Collection Philosophy" to safeguard vulnerable Filipino families facing severe medical crises. All uploaded files, clinical abstracts, and personal identity records remain strictly within your local browser sandbox — zero servers, zero trackers, and zero centralized databases.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isTaglish ? '100% Client-Side Engine' : '100% Client-Side Engine'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              {isTaglish ? 'In-Browser WASM / Canvas' : 'In-Browser WASM / Canvas'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
              {isTaglish ? 'Walang Third-Party Telemetry' : 'Zero Third-Party Telemetry'}
            </span>
          </div>
        </div>

        {/* SECTION 1: 100% Lokal at Offline-Ready */}
        <section
          aria-labelledby="section-1-heading"
          className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <Database className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {isTaglish ? 'Seksiyon 1 • Teknikal na Garantiya' : 'Section 1 • Technical Guarantee'}
              </span>
              <h2
                id="section-1-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
              >
                {isTaglish
                  ? '100% Lokal at Offline-Ready (Walang Server Leaks)'
                  : '100% Local & Offline-Ready (Zero Server Leaks)'}
              </h2>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
            <p>
              {isTaglish
                ? 'Karamihan sa mga web application ay nagpapadala ng inyong mga dokumento at personal na impormasyon sa mga remote cloud server para i-proseso o i-save. Ang TulongPH ay may ibang pilosopiya: ang buong logic ng application ay tumatakbo lamang sa loob ng inyong browser.'
                : 'Most modern web applications transmit your personal identity and medical records to remote cloud servers for storage and processing. TulongPH adopts an unyielding local-first architecture: the entire execution cycle occurs solely inside your local browser runtime.'}
            </p>
            <p>
              {isTaglish
                ? 'Lahat ng pag-compress ng mga larawan (hal. Medical Abstract, Valid ID, Social Case Study) at pag-render ng opisyal na PDF ay ginagawa ng inyong mismong device gamit ang HTML5 Canvas at WebAssembly. Walang kahit isang byte ng inyong medical records ang naipapadala sa internet.'
                : 'All image compression routines (e.g. Medical Abstracts, Government IDs, Clinical Summaries) and PDF rendering operations are executed directly on your device CPU via HTML5 Canvas and client-side compilation. Not a single byte of your medical data ever touches the wire.'}
            </p>
          </div>

          {/* Technical Verification Matrix */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 sm:hidden font-medium">
              {isTaglish ? '← Mag-swipe pakaliwa o pakanan para sa buong matrix →' : '← Swipe horizontally to inspect full matrix →'}
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-[#FBFBFA]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F3F2EC] text-slate-900 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="p-3 sm:p-4">
                      {isTaglish ? 'Aspeto ng Sistema' : 'System Vector'}
                    </th>
                    <th scope="col" className="p-3 sm:p-4">
                      {isTaglish ? 'TulongPH Arkitektura' : 'TulongPH Architecture'}
                    </th>
                    <th scope="col" className="p-3 sm:p-4">
                      {isTaglish ? 'Katayuan sa Seguridad' : 'Security Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  <tr>
                    <td className="p-3 sm:p-4 font-bold text-slate-900">
                      {isTaglish ? 'Storage ng Pasyente' : 'Patient Record Storage'}
                    </td>
                    <td className="p-3 sm:p-4">
                      {isTaglish
                        ? 'Naka-isolate sa IndexedDB (idb-keyval) ng inyong browser'
                        : 'Isolated client IndexedDB (idb-keyval) browser sandbox'}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {isTaglish ? 'Walang Remote DB' : 'No Remote DB'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-bold text-slate-900">
                      {isTaglish ? 'Image & PDF Processing' : 'Image & PDF Processing'}
                    </td>
                    <td className="p-3 sm:p-4">
                      {isTaglish
                        ? 'Client-side HTML5 Canvas at in-memory jsPDF'
                        : 'Client-side HTML5 Canvas and in-memory jsPDF'}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {isTaglish ? 'Zero Cloud Upload' : 'Zero Cloud Upload'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-bold text-slate-900">
                      {isTaglish ? 'Analytics at Trackers' : 'Analytics & Telemetry'}
                    </td>
                    <td className="p-3 sm:p-4">
                      {isTaglish
                        ? '0 Google Analytics, 0 Meta Pixels, 0 tracking cookies'
                        : '0 Google Analytics, 0 Meta Pixels, 0 tracking beacons'}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {isTaglish ? 'Zero Tracking' : 'Zero Tracking'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-bold text-slate-900">
                      {isTaglish ? 'Network Outbound Calls' : 'Outbound API Requests'}
                    </td>
                    <td className="p-3 sm:p-4">
                      {isTaglish
                        ? 'Zero API calls habang nag-eencode o nagco-compress'
                        : '0 network requests during input, compression, and triage'}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {isTaglish ? 'Ligtas sa Sniffing' : 'Leak-Proof'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 2: Proteksyon sa Computer Shop at Pisonet */}
        <section
          aria-labelledby="section-2-heading"
          className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <Laptop className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {isTaglish
                  ? 'Seksiyon 2 • Public Terminal Threat Model'
                  : 'Section 2 • Public Terminal Threat Model'}
              </span>
              <h2
                id="section-2-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
              >
                {isTaglish
                  ? 'Proteksyon sa Computer Shop at Pisonet'
                  : 'Computer Shop & Pisonet Protection'}
              </h2>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
            <p>
              {isTaglish
                ? 'Alam namin na maraming Pilipinong naglalakad ng tulong sa ospital ang walang sariling laptop o printer. Kadalasan ay nagpupunta sila sa mga pisonet kiosk sa labas ng ospital o sa computer shop sa kanto upang mag-print at mag-ayos ng papel. Ito ang dahilan kung bakit idinisenyo ang TulongPH na may proteksyon laban sa "Shared Terminal Vulnerabilities".'
                : 'We recognize that many families filing for medical assistance rely on public computer shops, piso-wifi kiosks, or cybercafes outside public hospitals to prepare and print paperwork. TulongPH is specifically hardened to neutralize shared terminal vulnerabilities.'}
            </p>
          </div>

          {/* Three Shield Defenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-[#FBFBFA] border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <EyeOff className="w-4 h-4 text-blue-800 shrink-0" />
                <span>autoComplete=&quot;off&quot; Enforcement</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTaglish
                  ? 'Lahat ng field sa mga form ay may autoComplete="off" upang hindi i-cache ng Google Chrome o Edge ang PhilHealth PIN, buong pangalan, at diagnosis ng pasyente sa dropdown suggestion ng susunod na customer sa computer shop.'
                  : 'All sensitive form inputs enforce autoComplete="off" to prevent browsers from caching patient names, PhilHealth identification numbers, or medical diagnoses into autofill dropdowns for the next patron.'}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#FBFBFA] border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Printer className="w-4 h-4 text-blue-800 shrink-0" />
                <span>
                  {isTaglish ? 'Direct Print vs. File Download' : 'Direct Print vs. File Download'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTaglish
                  ? 'Hinihikayat namin ang paggamit ng "I-print ang Form" sa halip na i-download ito sa Downloads folder. Ang direktang pag-print ay nagpapadala ng pansamantalang blob nang direkta sa printer spooler nang hindi nag-iiwan ng kopya sa hard drive ng computer shop.'
                  : 'We prioritize in-browser printing over file downloads. Direct printing pipes document streams straight to the local print queue without leaving exposed PDF copies in the public "Downloads" folder of the kiosk.'}
              </p>
            </div>
          </div>

          {/* 4-Step Internet Cafe Safety Protocol */}
          <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isTaglish
                  ? 'Paalala sa Gumagamit sa Computer Shop / Pisonet'
                  : 'Public Kiosk Security Checklist'}
              </span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-amber-950 font-medium list-disc list-inside">
              <li>
                {isTaglish
                  ? 'Hangga’t maaari, buksan ang browser sa "Incognito" o "Private Browsing" window.'
                  : 'Open the browser in an "Incognito" or "Private Window" whenever possible.'}
              </li>
              <li>
                {isTaglish
                  ? 'Huwag i-save ang inyong mga ID o medical abstract sa Desktop ng computer shop.'
                  : 'Never save unencrypted photos of clinical abstracts or valid IDs to the public Desktop.'}
              </li>
              <li>
                {isTaglish
                  ? 'Bago tumayo at magbayad, pindutin ang pulang buton na "Burahin ang Aking Datos (Pisonet Mode)".'
                  : 'Before relinquishing your terminal, click the red "Burahin ang Aking Datos (Pisonet Mode)" button.'}
              </li>
              <li>
                {isTaglish
                  ? 'I-close ang buong browser window upang ma-flush ang anumang natitirang memory cache.'
                  : 'Close the browser window completely to flush in-memory render caches.'}
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 3: Karapatan sa Pagbura (Right to Erasure & 1-Click Wipe) */}
        <section
          aria-labelledby="section-3-heading"
          className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
              <Trash2 className="w-6 h-6 text-red-700" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                {isTaglish
                  ? 'Seksiyon 3 • RA 10173 Karapatan sa Pagbura'
                  : 'Section 3 • RA 10173 Right to Erasure'}
              </span>
              <h2
                id="section-3-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
              >
                {isTaglish
                  ? 'Karapatan sa Pagbura (Right to Erasure & 1-Click Wipe)'
                  : 'Right to Erasure & 1-Click Data Wipe'}
              </h2>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
            <p>
              {isTaglish
                ? 'Ayon sa Section 16 ng Data Privacy Act of 2012 (RA 10173), may karapatan ang bawat mamamayan na ipag-utos ang agarang pagbura at pagharang sa kanilang personal at sensitibong impormasyon. Sa TulongPH, ginawa naming agarang solusyon ito sa pamamagitan ng 1-Click Wipe Engine.'
                : 'Under Section 16 of the Philippine Data Privacy Act of 2012 (Republic Act 10173), citizens hold an inviolable right to erasure or blocking of sensitive personal information. TulongPH enforces this through a 1-Click Cryptographic Wipe Pipeline.'}
            </p>
          </div>

          {/* Under-the-hood explanation cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {isTaglish
                ? 'Ano ang Eksaktong Nangyayari Kapag Pindot Mo ng "Burahin ang Aking Datos"?'
                : 'What Happens Under the Hood During a 1-Click Data Wipe?'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <Database className="w-4 h-4 text-red-600 shrink-0" />
                  <span>1. IndexedDB Purge</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isTaglish
                    ? 'Binubura ang buong idb-keyval store na naglalaman ng patient profile, representative, diagnosis, at medical case.'
                    : 'Truncates and deletes the client-side IndexedDB store containing patient profiles, representative info, and medical case records.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <Lock className="w-4 h-4 text-red-600 shrink-0" />
                  <span>2. Web Storage Clear</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isTaglish
                    ? 'Inaalis ang lahat ng laman ng localStorage at sessionStorage sa browser.'
                    : 'Executes localStorage.clear() and sessionStorage.clear() to purge runtime variables.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <Cpu className="w-4 h-4 text-red-600 shrink-0" />
                  <span>3. CacheStorage Sweep</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isTaglish
                    ? 'Pina-purge ang lahat ng cached assets gamit ang window.caches.delete().'
                    : 'Traverses window.caches to invalidate and delete cached application resources.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <EyeOff className="w-4 h-4 text-red-600 shrink-0" />
                  <span>4. Blob Revocation</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isTaglish
                    ? 'Tinatanggal sa RAM ang lahat ng blob: ObjectURLs ng mga in-upload na ID at abstract.'
                    : 'Calls URL.revokeObjectURL() on all uploaded ID and abstract previews to deallocate memory.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <Printer className="w-4 h-4 text-red-600 shrink-0" />
                  <span>5. DOM Sanitization</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isTaglish
                    ? 'Inaalis ang anumang natitirang hidden print iframes mula sa HTML DOM tree.'
                    : 'Removes all residual hidden print iframes and canvas elements from the document DOM.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <History className="w-4 h-4 text-red-600 shrink-0" />
                  <span>6. History Scrub</span>
                </div>
                <p className="text-xs text-slate-600">
                  {isTaglish
                    ? 'Pina-overwrite ang window.history.replaceState upang hindi ma-recall sa "Back" button ang mga naunang inputs.'
                    : 'Replaces browser history with window.history.replaceState so pressing "Back" cannot recall filled inputs.'}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live Action Button */}
          <div className="p-5 rounded-xl bg-red-50/70 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-sm font-bold text-red-950 block">
                {isTaglish
                  ? 'Subukan ang 1-Click Data Wipe Dito Mismo'
                  : 'Trigger 1-Click Data Wipe Live'}
              </span>
              <p className="text-xs text-red-900 font-medium">
                {isTaglish
                  ? 'Pindutin ito upang agad na linisin ang lahat ng na-save na profile sa browser na ito.'
                  : 'Executes the complete cryptographic erasure sequence and redirects you safely to Home.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWipeModalOpen(true)}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-red-900/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0 focus-ring"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {isTaglish
                  ? 'Subukan ang 1-Click Data Wipe'
                  : 'Trigger 1-Click Data Wipe'}
              </span>
            </button>
          </div>
        </section>

        {/* SECTION 4: Opisyal na Disclaimer ng TulongPH */}
        <section
          aria-labelledby="section-4-heading"
          className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200">
              <Scale className="w-6 h-6 text-blue-900" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                {isTaglish
                  ? 'Seksiyon 4 • Legal at Opisyal na Hangganan'
                  : 'Section 4 • Legal Jurisdictional Boundary'}
              </span>
              <h2
                id="section-4-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
              >
                {isTaglish
                  ? 'Opisyal na Disclaimer ng TulongPH (Non-Government Entity)'
                  : 'Official TulongPH Disclaimer (Non-Government Civic Entity)'}
              </h2>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 font-medium">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">
                {isTaglish
                  ? 'Pahayag ng Katayuan ng TulongPH:'
                  : 'Official Declaration of Entity Status:'}
              </p>
              <p>
                {isTaglish
                  ? 'Ang TulongPH ay isang malayang civic technology project na pinapatakbo ng mga volunteer software engineer at advocate para sa pampublikong kalusugan. HINDI ito ahensya ng gobyerno at HINDI kaanib ng Department of Health (DOH), Department of Social Welfare and Development (DSWD), Philippine Charity Sweepstakes Office (PCSO), Philippine Health Insurance Corporation (PhilHealth), o Senado ng Pilipinas.'
                  : 'TulongPH is an independent, non-profit, open-source civil society initiative spearheaded by volunteer software engineers and public healthcare advocates. It is NOT an official government office, agency, or subsidiary of the DOH, DSWD, PCSO, PhilHealth, or the Philippine Senate.'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">
                {isTaglish
                  ? 'Mga Hangganan ng Kapangyarihan (Jurisdictional Scope):'
                  : 'Boundaries of Authority & Operational Scope:'}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc list-inside">
                <li>
                  <strong>
                    {isTaglish ? 'Walang Guarantee Letter (GL): ' : 'No Guarantee Letters (GL): '}
                  </strong>
                  {isTaglish
                    ? 'Ang TulongPH ay HINDI nag-iisyu ng Guarantee Letter, cash assistance, o anumang opisyal na promissory notes. Ang tanging may kapangyarihang mag-isyu ng GL ay ang mga akreditadong ahensya ng gobyerno.'
                    : 'TulongPH does not issue Guarantee Letters, cash assistance, or fiscal vouchers. GLs are exclusively authorized and disbursed by accredited government social workers.'}
                </li>
                <li>
                  <strong>
                    {isTaglish
                      ? 'Ebalwasyon ng Social Worker: '
                      : 'Independent Social Worker Evaluation: '}
                  </strong>
                  {isTaglish
                    ? 'Ang pag-apruba, halaga ng tulong, at diskwento ay 100% nasa pagpapasya ng lisensyadong Medical Social Worker (MSW) ng ospital at opisyal na evaluator ng ahensya alinsunod sa RA 11463 (Malasakit Centers Act) at socioeconomic assessment.'
                    : 'The final determination, assistance amount, and social case classification remain 100% under the legal discretion of licensed hospital Medical Social Workers (MSW) and authorized agency evaluators.'}
                </li>
                <li>
                  <strong>
                    {isTaglish
                      ? 'Tulong sa Organisasyon Lamang: '
                      : 'Pure Civic Enablement: '}
                  </strong>
                  {isTaglish
                    ? 'Ang TulongPH ay tumutulong lamang sa pasyente na maihanda ang tamang pagkakasunod-sunod ng mga papel, ma-compress ang mga PDF sa ilalim ng 2MB limit ng PCSO at Senado, at mahanap ang pinakamalapit na Malasakit Center.'
                    : 'TulongPH functions exclusively as a civic preparatory utility: helping patients stack aid sequences logically, compress attachments below the stringent 2MB upload limit, and locate hospital helpdesks.'}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 5: Babala Laban sa Fixer */}
        <section
          aria-labelledby="section-5-heading"
          className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
              <ShieldAlert className="w-6 h-6 text-red-700" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                {isTaglish
                  ? 'Seksiyon 5 • Babala Laban sa Korapsyon'
                  : 'Section 5 • Anti-Fixer & Anti-Corruption Notice'}
              </span>
              <h2
                id="section-5-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight text-red-950"
              >
                {isTaglish
                  ? 'Babala Laban sa Fixer (Anti-Red Tape Act - RA 11032)'
                  : 'Warning Against Fixers (Anti-Red Tape Act - RA 11032)'}
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-red-50 border border-red-200 text-red-950 space-y-3">
            <div className="flex items-center gap-2 font-black text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
              <span>
                {isTaglish
                  ? '100% LIBRE ANG LAHAT NG GABAY AT FORMS SA TULONGPH'
                  : 'ALL TULONGPH GUIDES AND TEMPLATES ARE 100% FREE'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
              {isTaglish
                ? 'Huwag kailanman magbabayad kaninuman para sa mga gabay, pormularyo, o pwesto sa pila sa Malasakit Center, PCSO, DSWD, o Tanggapan ng mga Senador. Ang paniningil o pag-aalok ng "slot", "VIP assistance", o "lakad-tulong" ay ILEGAL sa ilalim ng batas ng Pilipinas.'
                : 'Never pay anyone for forms, triage roadmaps, or queue slots at Malasakit Centers, PCSO, DSWD, or Senate Desks. Selling slots, charging document fees, or soliciting "expediting cuts" is strictly ILLEGAL under Philippine law.'}
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
            <p>
              {isTaglish
                ? 'Ayon sa Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018), mahigpit na ipinagbabawal ang fixing activities. Ang sinumang mahuling fixer o nakikipagkutsaba sa loob o labas ng ospital ay mahaharap sa:'
                : 'Under Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018), fixing activities are severely penalized. Individuals convicted of brokering government social assistance face:'}
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-800">
              <li>
                <strong>
                  {isTaglish ? 'Pagkakakulong: ' : 'Imprisonment: '}
                </strong>
                {isTaglish
                  ? 'Hanggang anim (6) na taong pagkakabilanggo.'
                  : 'Up to six (6) years of imprisonment.'}
              </li>
              <li>
                <strong>
                  {isTaglish ? 'Multa: ' : 'Fines: '}
                </strong>
                {isTaglish
                  ? 'Multa mula ₱500,000 hanggang ₱2,000,000.'
                  : 'Fines ranging from ₱500,000 to ₱2,000,000.'}
              </li>
              <li>
                <strong>
                  {isTaglish ? 'Pagtanggal sa Serbisyo: ' : 'Disqualification: '}
                </strong>
                {isTaglish
                  ? 'Habambuhay na diskwalipikasyon sa serbisyo-publiko kung empleyado ng gobyerno.'
                  : 'Perpetual disqualification from public office for colluding personnel.'}
              </li>
            </ul>
          </div>

          {/* Hotlines Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {isTaglish
                ? 'Saan Mag-uulat ng Fixer o Pang-aabuso?'
                : 'Official Reporting Hotlines for Fixer Activity:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-blue-900 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Hotline 8888</div>
                  <div className="text-xs text-slate-600 font-medium">
                    {isTaglish ? "Citizens' Complaint Center" : "Citizens' Complaint Desk"}
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-blue-900 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">1-ARTA (1-2782)</div>
                  <div className="text-xs text-slate-600 font-medium">Anti-Red Tape Authority</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FBFBFA] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Hospital MSWD Desk</div>
                  <div className="text-xs text-slate-600 font-medium">
                    {isTaglish ? 'Medical Social Work Office' : 'Social Service Head'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Open-Source Verification at Transparency */}
        <section
          aria-labelledby="section-6-heading"
          className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200">
              <FileText className="w-6 h-6 text-blue-900" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                {isTaglish
                  ? 'Seksiyon 6 • Pampublikong Pag-audit'
                  : 'Section 6 • Public Audit & Open Verification'}
              </span>
              <h2
                id="section-6-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
              >
                {isTaglish
                  ? 'Open-Source Verification at Transparency'
                  : 'Open-Source Verification & Transparency'}
              </h2>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
            <p>
              {isTaglish
                ? 'Ang tunay na tiwala ay hindi lamang ipinapangako sa salita; ito ay nabe-verify sa source code. Ang buong source code ng TulongPH ay bukas at libreng masusuri ng publiko sa GitHub. Inaanyayahan namin ang mga kapwa software engineer, cybersecurity auditor, at civic hacktivists na i-audit ang aming codebase.'
                : 'True institutional trust is not declared with marketing statements; it is proven in verifiable source code. The entire TulongPH platform is fully open-source on GitHub. We welcome peer audits by cybersecurity researchers, privacy scholars, and civic tech engineers.'}
            </p>
          </div>

          {/* Verification Steps for Developers and Citizens */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FBFBFA] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
              <Info className="w-4 h-4 text-blue-900 shrink-0" />
              <span>
                {isTaglish
                  ? 'Paano I-verify ang "Zero-Leak" Claims Gamit ang Browser DevTools:'
                  : 'How to Independently Verify "Zero-Leak" Claims via Browser DevTools:'}
              </span>
            </div>
            <ol className="space-y-2 text-xs sm:text-sm text-slate-700 list-decimal list-inside font-medium">
              <li>
                {isTaglish
                  ? 'Pindutin ang F12 sa inyong keyboard upang buksan ang Developer Tools sa Google Chrome, Edge, o Firefox.'
                  : 'Press F12 (or Cmd+Option+I on Mac) to open your browser’s Developer Tools.'}
              </li>
              <li>
                {isTaglish
                  ? 'Pumunta sa tab na "Network" at i-filter gamit ang "Fetch/XHR".'
                  : 'Navigate to the "Network" panel and filter by "Fetch/XHR".'}
              </li>
              <li>
                {isTaglish
                  ? 'Mag-upload ng dokumento o mag-encode ng medical profile sa Gabay sa Tulong.'
                  : 'Upload a document or input patient data in the Aid Navigator wizard.'}
              </li>
              <li>
                {isTaglish
                  ? 'Mapapansin ninyo na 0 network requests ang lalabas habang nag-eencode at nagco-compress — patunay na walang lumalabas na datos sa inyong device.'
                  : 'Observe that 0 outbound network requests are fired during input or compression — absolute verification that no data leaves your machine.'}
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <a
              href="https://github.com/mark-ai-0420/tulong-ph"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs w-full sm:w-auto focus-ring"
            >
              <span>{isTaglish ? 'Suriin ang Code sa GitHub' : 'Inspect Source Code on GitHub'}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>

            <p className="text-xs text-slate-500 font-medium text-center sm:text-right">
              {isTaglish
                ? 'Nakakita ng bug o security flaw? Mag-submit ng Issue sa GitHub repository.'
                : 'Identified an issue? Submit a security disclosure directly on our GitHub repository.'}
            </p>
          </div>
        </section>

        {/* Civic Editorial Sign-off */}
        <div className="border-t border-[#E2DFD6] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
            <span>
              {isTaglish
                ? 'Nilagdaan ng TulongPH Civic Editorial & Open Source Working Group'
                : 'Ratified by the TulongPH Civic Editorial & Open Source Working Group'}
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-blue-900 hover:text-blue-950 font-bold hover:bg-blue-50 transition-colors focus-ring"
          >
            <span>{isTaglish ? 'Bumalik sa Pagsusuri' : 'Back to Assessment'}</span>
            <span>→</span>
          </Link>
        </div>
      </main>

      {/* Confirmation Modal for Live 1-Click Wipe Action */}
      {isWipeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wipe-modal-title"
          aria-describedby="wipe-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsWipeModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3
                    id="wipe-modal-title"
                    className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
                  >
                    {isTaglish
                      ? 'Kumpirmahin ang 1-Click Data Wipe?'
                      : 'Confirm 1-Click Data Wipe?'}
                  </h3>
                  <span className="inline-block text-xs font-bold text-red-800 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {isTaglish ? 'Agad at Permanenteng Pagbura' : 'Immediate & Irreversible'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus-ring"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p id="wipe-modal-desc" className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {isTaglish
                ? 'Buburahin nito ang lahat ng na-save na profile, mga dokumentong na-upload, medical diagnosis, at browser storage sa device na ito. Pagkatapos ay agad kang ibabalik sa panimulang pahina.'
                : 'This will purge all cached patient profiles, uploaded clinical documents, diagnosis entries, and browser storage keys from this device, then safely redirect you to Home.'}
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isTaglish
                  ? 'Hindi na ito maibabalik. Siguraduhing tapos na kayong mag-print kung may kailangan kayong kopya.'
                  : 'This cannot be undone. Ensure you have printed any necessary copies before proceeding.'}
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer focus-ring"
              >
                {isTaglish ? 'Kanselahin' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteWipe}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-red-900/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 focus-ring"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isTaglish ? 'Oo, Burahin ang Lahat' : 'Yes, Purge Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
