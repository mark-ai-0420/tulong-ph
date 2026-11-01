'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Languages,
  Share2,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { CivicPageShell } from '@/components/shared/CivicPageShell';
import { subscribeToInstallPrompt, takeInstallPrompt } from '@/components/shared/ServiceWorkerRegistration';
import type { BeforeInstallPromptEvent } from '@/components/shared/ServiceWorkerRegistration';
import { getNextLanguage, isLanguage, supportedLanguages } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

const INSTALL_URL = 'https://tulongph.vercel.app';

type InstallPlatform = 'all' | 'android' | 'ios';

const copy: Record<Language, {
  returnLabel: string;
  title: string;
  intro: string;
  benefitsTitle: string;
  benefits: { title: string; body: string }[];
  installed: string;
  installNow: string;
  installAccepted: string;
  installDismissed: string;
  browserWarningTitle: string;
  browserWarningBody: string;
  browserTip: string;
  platformSelector: string;
  allPlatforms: string;
  androidTab: string;
  iosTab: string;
  androidTitle: string;
  androidDescription: string;
  androidOpenPrefix: string;
  androidOpenSuffix: string;
  androidSteps: string[];
  iosTitle: string;
  iosDescription: string;
  iosSafariNotice: string;
  iosOpenPrefix: string;
  iosOpenSuffix: string;
  iosSteps: string[];
  publicComputerTitle: string;
  publicComputerBody: string;
  privacyLink: string;
  footerHome: string;
}> = {
  taglish: {
    returnLabel: '← Bumalik sa Gabay sa Tulong',
    title: 'I-install ang TulongPH sa telepono',
    intro: 'Ilagay ang TulongPH sa Home Screen para mabilis buksan ang gabay kahit mahina ang signal sa ospital.',
    benefitsTitle: 'Bakit i-install ang TulongPH?',
    benefits: [
      { title: 'Gabay kahit mahina ang signal', body: 'Buksan ang calculator, checklist, at direktoryo kapag mahina o walang signal pagkatapos ma-load ang app.' },
      { title: 'Walang app store o account', body: 'Hindi kailangang mag-download sa Google Play o App Store, gumawa ng account, o mag-login.' },
      { title: 'Nasa device mo ang mga tala', body: 'Nananatili sa iyong device ang mga inilagay mong impormasyon at dokumento.' },
    ],
    installed: 'Naka-install na ang TulongPH sa device na ito.',
    installNow: 'I-install Ngayon',
    installAccepted: 'Sinimulan ang pag-install ng TulongPH.',
    installDismissed: 'Hindi natuloy ang pag-install. Sundin ang mga hakbang sa ibaba anumang oras.',
    browserWarningTitle: 'Nasa Facebook, Messenger, o Instagram browser ka?',
    browserWarningBody: 'Buksan muna ang menu (⋮ o ⋯), piliin ang “Open in browser,” “Open in Chrome,” o “Open in Safari,” at sundan ang gabay doon.',
    browserTip: 'Kung hindi lumabas ang install option, buksan ang pahinang ito sa Chrome o Safari.',
    platformSelector: 'Piliin ang gabay para sa iyong device',
    allPlatforms: 'Lahat ng gabay',
    androidTab: 'Android',
    iosTab: 'iPhone / iPad',
    androidTitle: 'Android · Google Chrome',
    androidDescription: 'Sundin ang mga hakbang sa Chrome sa iyong Android phone o tablet.',
    androidOpenPrefix: 'Buksan ang ',
    androidOpenSuffix: ' sa Google Chrome.',
    androidSteps: [
      'Pindutin ang ⋮ menu sa tabi ng address bar.',
      'Piliin ang “Install app” o “Add to Home screen.”',
      'Pindutin ang “Install” para idagdag ang TulongPH sa Home Screen.',
    ],
    iosTitle: 'iPhone / iPad · Apple Safari',
    iosDescription: 'Gamitin ang Safari para idagdag ang TulongPH sa Home Screen.',
    iosSafariNotice: 'Kailangan ang Apple Safari. Buksan muna sa Safari kung galing ka sa Facebook, Messenger, Instagram, o ibang browser.',
    iosOpenPrefix: 'Buksan ang ',
    iosOpenSuffix: ' gamit ang Apple Safari.',
    iosSteps: [
      'Pindutin ang Share button (kahon na may arrow pataas, ⎋).',
      'Mag-scroll sa menu at pindutin ang “Add to Home Screen” (＋).',
      'Pindutin ang “Add” sa kanang itaas. Lalabas ang TulongPH sa Home Screen.',
    ],
    publicComputerTitle: 'Gumagamit ng pisonet o public computer?',
    publicComputerBody: 'Huwag i-install ang TulongPH sa shared terminal. Burahin ang profile at mga dokumento bago umalis.',
    privacyLink: 'Basahin ang Data Privacy Charter',
    footerHome: 'Gabay sa Tulong',
  },
  cebuano: {
    returnLabel: '← Balik sa Giya sa Tabang',
    title: 'I-install ang TulongPH sa imong telepono',
    intro: 'Idugang ang TulongPH sa Home Screen aron dali kining maablihan bisan huyang ang signal sa ospital.',
    benefitsTitle: 'Nganong i-install ang TulongPH?',
    benefits: [
      { title: 'Giya bisan huyang ang signal', body: 'Ablihi ang calculator, checklist, ug direktoryo bisan huyang o walay signal human ma-load ang app.' },
      { title: 'Walay app store o account', body: 'Dili kinahanglan mag-download sa Google Play o App Store, maghimo og account, o mo-login.' },
      { title: 'Sa imong device ra ang mga rekord', body: 'Magpabilin sa imong device ang imong gisulod nga impormasyon ug mga dokumento.' },
    ],
    installed: 'Na-install na ang TulongPH niini nga device.',
    installNow: 'I-install Karon',
    installAccepted: 'Gisugdan ang pag-install sa TulongPH.',
    installDismissed: 'Wala madayon ang pag-install. Sunda ang mga lakang sa ubos bisan kanus-a.',
    browserWarningTitle: 'Naa ka sa Facebook, Messenger, o Instagram browser?',
    browserWarningBody: 'Ablihi una ang menu (⋮ o ⋯), pilia ang “Open in browser,” “Open in Chrome,” o “Open in Safari,” ug sunda ang giya didto.',
    browserTip: 'Kung wala makita ang opsyon sa pag-install, ablihi kini nga panid sa Chrome o Safari.',
    platformSelector: 'Pilia ang giya para sa imong device',
    allPlatforms: 'Tanang giya',
    androidTab: 'Android',
    iosTab: 'iPhone / iPad',
    androidTitle: 'Android · Google Chrome',
    androidDescription: 'Sunda ang mga lakang sa Chrome sa imong Android phone o tablet.',
    androidOpenPrefix: 'Ablihi ang ',
    androidOpenSuffix: ' sa Google Chrome.',
    androidSteps: [
      'Pilia ang ⋮ menu tapad sa address bar.',
      'Pilia ang “Install app” o “Add to Home screen.”',
      'Pilia ang “Install” aron idugang ang TulongPH sa Home Screen.',
    ],
    iosTitle: 'iPhone / iPad · Apple Safari',
    iosDescription: 'Gamita ang Safari aron idugang ang TulongPH sa Home Screen.',
    iosSafariNotice: 'Kinahanglan ang Apple Safari. Ablihi una sa Safari kon gikan ka sa Facebook, Messenger, Instagram, o laing browser.',
    iosOpenPrefix: 'Ablihi ang ',
    iosOpenSuffix: ' gamit ang Apple Safari.',
    iosSteps: [
      'Pilia ang Share button (kahon nga naay pana pataas, ⎋).',
      'I-scroll ang menu ug pilia ang “Add to Home Screen” (＋).',
      'Pilia ang “Add” sa taas nga tuo. Makita na ang TulongPH sa Home Screen.',
    ],
    publicComputerTitle: 'Naggamit ka og pisonet o pampublikong computer?',
    publicComputerBody: 'Ayaw i-install ang TulongPH sa shared terminal. Papasa ang profile ug mga dokumento sa dili pa mobiya.',
    privacyLink: 'Basaha ang Data Privacy Charter',
    footerHome: 'Giya sa Tabang',
  },
  ilocano: {
    returnLabel: '← Agsubli iti TulongPH',
    title: 'I-install ti TulongPH iti teleponom',
    intro: 'Iyakar ti TulongPH iti Home Screen tapno nalaka a luktan uray nakapsut ti signal iti ospital.',
    benefitsTitle: 'Apay nga i-install ti TulongPH?',
    benefits: [
      { title: 'Giya uray nakapsut ti signal', body: 'Luktam ti calculator, checklist, ken direktoryo uray nakapsut wenno awan ti signal kalpasan a na-load ti app.' },
      { title: 'Awan ti app store wenno account', body: 'Saan a kasapulan ti Google Play wenno App Store, panagaramid iti account, wenno login.' },
      { title: 'Adda laeng dagiti rekord iti device mo', body: 'Agtaeng laeng iti device mo dagiti impormasion ken dokumento a insuratmo.' },
    ],
    installed: 'Na-install metten ti TulongPH iti daytoy a device.',
    installNow: 'I-install Itatta',
    installAccepted: 'Inrugi ti panag-install ti TulongPH.',
    installDismissed: 'Saan a naituloy ti panag-install. Mabalinmo a suroten dagiti addang iti baba.',
    browserWarningTitle: 'Adda ka iti browser ti Facebook, Messenger, wenno Instagram?',
    browserWarningBody: 'Luktam nga umuna ti menu (⋮ wenno ⋯), pilien ti “Open in browser,” “Open in Chrome,” wenno “Open in Safari,” ket suroten ti giya idiay.',
    browserTip: 'No saan a makita ti install option, luktam daytoy a panid iti Chrome wenno Safari.',
    platformSelector: 'Pilien ti giya para iti device mo',
    allPlatforms: 'Amin a giya',
    androidTab: 'Android',
    iosTab: 'iPhone / iPad',
    androidTitle: 'Android · Google Chrome',
    androidDescription: 'Suroten dagiti addang iti Chrome iti Android phone wenno tablet mo.',
    androidOpenPrefix: 'Luktam ti ',
    androidOpenSuffix: ' iti Google Chrome.',
    androidSteps: [
      'Pinduten ti ⋮ menu iti abay ti address bar.',
      'Pilien ti “Install app” wenno “Add to Home screen.”',
      'Pinduten ti “Install” tapno maikabil ti TulongPH iti Home Screen.',
    ],
    iosTitle: 'iPhone / iPad · Apple Safari',
    iosDescription: 'Usaren ti Safari tapno maikabil ti TulongPH iti Home Screen.',
    iosSafariNotice: 'Kasapulan ti Apple Safari. Luktam nga umuna iti Safari no naggapu ka iti Facebook, Messenger, Instagram, wenno sabali a browser.',
    iosOpenPrefix: 'Luktam ti ',
    iosOpenSuffix: ' babaen ti Apple Safari.',
    iosSteps: [
      'Pinduten ti Share button (kahon nga addaan iti pana nga agpangato, ⎋).',
      'I-scroll ti menu ket pinduten ti “Add to Home Screen” (＋).',
      'Pinduten ti “Add” iti ngato a kannawan. Agparang ti TulongPH iti Home Screen.',
    ],
    publicComputerTitle: 'Agar-aramatka iti pisonet wenno publiko a computer?',
    publicComputerBody: 'Saan nga i-install ti TulongPH iti shared terminal. Punasen ti profile ken dokumento sakbay ti panagawid.',
    privacyLink: 'Basaen ti Data Privacy Charter',
    footerHome: 'Giya ti Tulong',
  },
  en: {
    returnLabel: '← Return to Aid Navigator',
    title: 'Install TulongPH on your phone',
    intro: 'Add TulongPH to your Home Screen so you can open the guide quickly, even when signal is weak in a hospital.',
    benefitsTitle: 'Why install TulongPH?',
    benefits: [
      { title: 'Guidance when signal is weak', body: 'Open the calculator, checklist, and directory when signal is weak or unavailable after the app has loaded.' },
      { title: 'No app store or account', body: 'You do not need Google Play or the App Store, an account, or a login.' },
      { title: 'Your records stay on your device', body: 'Information and documents you enter remain on your device.' },
    ],
    installed: 'TulongPH is already installed on this device.',
    installNow: 'Install Now',
    installAccepted: 'TulongPH installation started.',
    installDismissed: 'Installation was not completed. You can follow the steps below at any time.',
    browserWarningTitle: 'Are you using Facebook, Messenger, or Instagram’s browser?',
    browserWarningBody: 'Open the menu (⋮ or ⋯), choose “Open in browser,” “Open in Chrome,” or “Open in Safari,” then follow the guide there.',
    browserTip: 'If you do not see an install option, open this page in Chrome or Safari.',
    platformSelector: 'Choose the guide for your device',
    allPlatforms: 'All guides',
    androidTab: 'Android',
    iosTab: 'iPhone / iPad',
    androidTitle: 'Android · Google Chrome',
    androidDescription: 'Follow these steps in Chrome on your Android phone or tablet.',
    androidOpenPrefix: 'Open ',
    androidOpenSuffix: ' in Google Chrome.',
    androidSteps: [
      'Tap the ⋮ menu beside the address bar.',
      'Choose “Install app” or “Add to Home screen.”',
      'Tap “Install” to add TulongPH to your Home Screen.',
    ],
    iosTitle: 'iPhone / iPad · Apple Safari',
    iosDescription: 'Use Safari to add TulongPH to your Home Screen.',
    iosSafariNotice: 'Apple Safari is required. Open this page in Safari first if you came from Facebook, Messenger, Instagram, or another browser.',
    iosOpenPrefix: 'Open ',
    iosOpenSuffix: ' in Apple Safari.',
    iosSteps: [
      'Tap the Share button (a box with an up arrow, ⎋).',
      'Scroll the menu and tap “Add to Home Screen” (＋).',
      'Tap “Add” in the top-right corner. TulongPH will appear on your Home Screen.',
    ],
    publicComputerTitle: 'Using a pisonet or public computer?',
    publicComputerBody: 'Do not install TulongPH on a shared terminal. Clear your profile and documents before you leave.',
    privacyLink: 'Read the Data Privacy Charter',
    footerHome: 'Aid Navigator',
  },
};

export default function InstallPage() {
  const [language, setLanguage] = useState<Language>('taglish');
  const [platform, setPlatform] = useState<InstallPlatform>('all');
  const [standalone, setStandalone] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    const syncLanguage = () => {
      try {
        const saved = localStorage.getItem('tulong_lang');
        setLanguage(isLanguage(saved) ? saved : 'taglish');
      } catch {
        setLanguage('taglish');
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'tulong_lang' || event.key === null) syncLanguage();
    };
    const onDataCleared = () => window.location.replace('/install');

    queueMicrotask(syncLanguage);
    window.addEventListener('storage', onStorage);
    window.addEventListener('tulongph-data-cleared', onDataCleared);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('tulongph-data-cleared', onDataCleared);
    };
  }, []);

  useEffect(() => subscribeToInstallPrompt(setInstallPrompt), []);

  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 767px)');
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      setStandalone(
        window.matchMedia('(display-mode: standalone)').matches
        || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
      setInAppBrowser(/FBAN|FBAV|Instagram|Messenger/i.test(userAgent));
      if (!mobileViewport.matches) setPlatform('all');
      else if (/Android/i.test(userAgent)) setPlatform('android');
      else if (/iPhone|iPad|iPod/i.test(userAgent)) setPlatform('ios');
      else setPlatform('all');
    };
    const onAppInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
    };

    detectDevice();
    mobileViewport.addEventListener('change', detectDevice);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      mobileViewport.removeEventListener('change', detectDevice);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const languageInfo = supportedLanguages.find(({ id }) => id === language) ?? supportedLanguages[0];
  const nextLanguageInfo = supportedLanguages.find(({ id }) => id === getNextLanguage(language)) ?? supportedLanguages[0];
  const text = copy[language];

  const changeLanguage = () => {
    const nextLanguage = getNextLanguage(language);
    setLanguage(nextLanguage);
    try {
      localStorage.setItem('tulong_lang', nextLanguage);
    } catch {
      // The page remains usable when browser storage is unavailable.
    }
  };

  const runInstallPrompt = async () => {
    const prompt = takeInstallPrompt();
    if (!prompt) return;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setInstallStatus(choice.outcome === 'accepted' ? text.installAccepted : text.installDismissed);
    } catch {
      setInstallStatus(text.browserTip);
    } finally {
      setInstallPrompt(null);
    }
  };

  const platformTabs: { id: InstallPlatform; label: string; elementId: string }[] = [
    { id: 'all', label: text.allPlatforms, elementId: 'install-tab-all' },
    { id: 'android', label: text.androidTab, elementId: 'install-tab-android' },
    { id: 'ios', label: text.iosTab, elementId: 'install-tab-ios' },
  ];

  return (
    <CivicPageShell
      className="install-page"
      navigation={(
        <header className="sticky top-0 z-40 border-b border-[#E2DFD6] bg-white/95 shadow-2xs backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex min-h-[44px] max-w-full min-w-0 items-center gap-2 rounded-xl border border-[#E2DFD6] bg-[#F3F2EC] px-3.5 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-[#EAE8E0] focus-ring sm:text-sm"
              title={text.returnLabel.replace('← ', '')}
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-blue-900" aria-hidden="true" />
              <span className="min-w-0">{text.returnLabel.replace('← ', '')}</span>
            </Link>
            <button
              type="button"
              onClick={changeLanguage}
              className="inline-flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#E2DFD6] bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-stone-50 focus-ring"
              aria-label={`Current language: ${languageInfo.label}. Switch to ${nextLanguageInfo.label}`}
              title={`Current language: ${languageInfo.label}. Switch to ${nextLanguageInfo.label}`}
            >
              <Languages className="h-4 w-4 shrink-0 text-blue-900" aria-hidden="true" />
              <span className="font-bold">{languageInfo.shortLabel}</span>
            </button>
          </div>
        </header>
      )}
      footer={(
        <footer className="border-t border-[#E2DFD6] bg-white py-5 text-xs text-slate-600">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6 lg:px-8">
            <span className="font-semibold text-slate-800">TulongPH · {text.footerHome}</span>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center rounded font-semibold text-blue-900 underline focus-ring">
              {text.privacyLink}
            </Link>
          </div>
        </footer>
      )}
    >
      <section className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-5 shadow-xs sm:p-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F2EC] text-blue-900">
            <Smartphone className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{text.title}</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">{text.intro}</p>
          <Link
            href={INSTALL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] max-w-full items-center justify-center break-all rounded-lg px-2 text-sm font-semibold text-blue-900 underline focus-ring"
          >
            {INSTALL_URL}
          </Link>
          {standalone ? (
            <p role="status" className="mx-auto inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{text.installed}
            </p>
          ) : installPrompt ? (
            <button type="button" onClick={() => void runInstallPrompt()} className="mx-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-800 focus-ring">
              <Download className="h-4 w-4" aria-hidden="true" />{text.installNow}
            </button>
          ) : null}
          {installStatus && <p role="status" aria-live="polite" className="text-sm font-medium text-slate-700">{installStatus}</p>}
        </div>
      </section>

      <section aria-labelledby="install-benefits-title" className="space-y-3">
        <h2 id="install-benefits-title" className="text-lg font-bold text-slate-900">{text.benefitsTitle}</h2>
        <div className="grid min-w-0 gap-3 md:grid-cols-3">
          {text.benefits.map((benefit, index) => {
            const Icon = [WifiOff, Download, ShieldCheck][index];
            return (
              <article key={benefit.title} className="min-w-0 rounded-xl border border-[#E2DFD6] bg-white p-4">
                <Icon className="mb-3 h-5 w-5 text-blue-900" aria-hidden="true" />
                <h3 className="mb-1 font-bold text-slate-900">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-slate-700">{benefit.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <aside className={`rounded-xl border border-[#E2DFD6] border-l-4 bg-[#F3F2EC] p-4 text-slate-800 ${inAppBrowser ? 'border-l-amber-700' : 'border-l-blue-900'}`}>
        <h2 className="font-bold">{text.browserWarningTitle}</h2>
        <p className="mt-1 text-sm leading-relaxed">{text.browserWarningBody}</p>
        {!inAppBrowser && <p className="mt-2 text-sm font-semibold text-slate-700">{text.browserTip}</p>}
      </aside>

      <section aria-labelledby="install-guides-title" className="space-y-4">
        <div>
          <h2 id="install-guides-title" className="text-xl font-bold text-slate-900">{language === 'en' ? 'Choose your device' : text.platformSelector}</h2>
          <p className="mt-1 text-sm text-slate-600">{text.browserTip}</p>
        </div>
        <div role="group" aria-label={text.platformSelector} className="flex flex-wrap gap-2">
          {platformTabs.map((tab) => (
            <button
              key={tab.id}
              id={tab.elementId}
              type="button"
              aria-pressed={platform === tab.id}
              aria-controls="install-guide-panels"
              onClick={() => setPlatform(tab.id)}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-ring ${platform === tab.id ? 'border-blue-900 bg-blue-900 text-white' : 'border-[#E2DFD6] bg-white text-slate-700 hover:bg-stone-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div id="install-guide-panels" className="grid min-w-0 gap-4 xl:grid-cols-2">
          {(platform === 'all' || platform === 'android') && (
            <section id="install-panel-android" className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-4 shadow-xs sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F2EC] text-blue-900"><Smartphone className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">{text.androidTitle}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text.androidDescription}</p>
                </div>
              </div>
              <ol className="space-y-3">
                <li className="flex min-w-0 gap-3 text-sm leading-relaxed text-slate-800">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EC] text-xs font-bold text-blue-900">1</span>
                  <p className="min-w-0 break-words">{text.androidOpenPrefix}<a href={INSTALL_URL} target="_blank" rel="noreferrer" className="break-all font-semibold text-blue-900 underline focus-ring">{INSTALL_URL}</a>{text.androidOpenSuffix}</p>
                </li>
                {text.androidSteps.map((step, index) => (
                  <li key={step} className="flex min-w-0 gap-3 text-sm leading-relaxed text-slate-800">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EC] text-xs font-bold text-blue-900">{index + 2}</span>
                    <p className="min-w-0">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(platform === 'all' || platform === 'ios') && (
            <section id="install-panel-ios" className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-4 shadow-xs sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F2EC] text-blue-900"><Share2 className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">{text.iosTitle}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text.iosDescription}</p>
                </div>
              </div>
              <p className="mb-4 rounded-lg border border-[#E2DFD6] bg-[#F3F2EC] p-3 text-sm leading-relaxed text-slate-800">{text.iosSafariNotice}</p>
              <ol className="space-y-3">
                <li className="flex min-w-0 gap-3 text-sm leading-relaxed text-slate-800">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EC] text-xs font-bold text-blue-900">1</span>
                  <p className="min-w-0 break-words">{text.iosOpenPrefix}<a href={INSTALL_URL} target="_blank" rel="noreferrer" className="break-all font-semibold text-blue-900 underline focus-ring">{INSTALL_URL}</a>{text.iosOpenSuffix}</p>
                </li>
                {text.iosSteps.map((step, index) => (
                  <li key={step} className="flex min-w-0 gap-3 text-sm leading-relaxed text-slate-800">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EC] text-xs font-bold text-blue-900">{index + 2}</span>
                    <p className="min-w-0">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </section>

      <aside className="rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] p-4 text-slate-800">
        <h2 className="font-bold">{text.publicComputerTitle}</h2>
        <p className="mt-1 text-sm leading-relaxed">{text.publicComputerBody}</p>
        <Link href="/privacy" className="mt-2 inline-flex min-h-[44px] items-center gap-1 font-semibold text-blue-900 underline focus-ring">
          {text.privacyLink}<span aria-hidden="true">↗</span>
        </Link>
      </aside>
    </CivicPageShell>
  );
}
