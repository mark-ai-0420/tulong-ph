import { CheckCircle2, X } from 'lucide-react';
import type { Language } from '@/lib/i18n';

export function CivicStatusBanner({ language, onDismiss }: { language: Language; onDismiss: () => void }) {
  return <div role="status" className="print:hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3 text-sm text-emerald-900">
    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" /><p className="flex-1">{language === 'taglish' ? 'Nabura na ang lahat ng datos para sa inyong privacy.' : 'All data has been wiped for your privacy.'}</p>
    <button type="button" onClick={onDismiss} aria-label={language === 'taglish' ? 'Isara ang abiso' : 'Dismiss notice'} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-100 focus-ring"><X className="w-5 h-5" aria-hidden="true" /></button>
  </div>;
}
