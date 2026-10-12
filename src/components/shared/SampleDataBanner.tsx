import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import type { Language } from '@/lib/i18n';

export function SampleDataBanner({ language = 'taglish', children }: { language?: Language; children: ReactNode }) {
  return <section className="print:hidden bg-blue-50/80 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3">
    <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-100 p-2 text-blue-900"><Lightbulb className="w-5 h-5" aria-hidden="true" /></span><div><h2 className="text-sm font-bold text-blue-950">{language === 'taglish' ? 'Subukan ang sample profile' : 'Try a sample profile'}</h2><p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{language === 'taglish' ? 'Halimbawa lamang ang mga datos. Palitan ng inyong impormasyon bago gamitin ang packet.' : 'These are example details. Replace them with your information before using the packet.'}</p></div></div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </section>;
}
