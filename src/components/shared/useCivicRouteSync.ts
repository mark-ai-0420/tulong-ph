'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { isLanguage, type Language } from '@/lib/i18n';

export function useCivicRouteSync(setLanguage: Dispatch<SetStateAction<Language>>) {
  const [privacyToast, setPrivacyToast] = useState(false);
  useEffect(() => {
    if (window.location.hash !== '#privacy-cleared') return;
    const timer = setTimeout(() => {
      setPrivacyToast(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }, 0);
    const dismiss = setTimeout(() => setPrivacyToast(false), 5000);
    return () => { clearTimeout(timer); clearTimeout(dismiss); };
  }, []);

  useEffect(() => {
    const syncLanguage = () => {
      try {
        const savedLanguage = localStorage.getItem('tulong_lang');
        setLanguage(isLanguage(savedLanguage) ? savedLanguage : 'taglish');
      }
      catch { setLanguage('taglish'); }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'tulong_lang' || event.key === null) syncLanguage();
    };
    syncLanguage();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setLanguage]);

  return { privacyToast, setPrivacyToast };
}
