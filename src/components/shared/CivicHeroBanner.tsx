import { ArrowRight, Building2, Printer, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import { civicPrimary, civicSecondary } from './civicStyles';

interface Props {
  title: string; accent: string; subtitle: string; language?: Language; badge?: string;
  onStart: () => void; onPrint: () => void; onDirectory?: () => void; startHref?: string;
  startLabel?: string; printLabel?: string; thirdLabel?: string; thirdIcon?: LucideIcon; onThird?: () => void;
}
export function CivicHeroBanner({ title, accent, subtitle, language = 'taglish', badge, onStart, onPrint, onDirectory, startHref, startLabel, printLabel, thirdLabel, thirdIcon: ThirdIcon = Building2, onThird }: Props) {
  const tl = language === 'taglish';
  const start = <><ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" /><span>{startLabel ?? (tl ? 'Simulan ang Pagtutuos' : 'Start Calculator')}</span></>;
  return <section className="bg-white border border-[#E2DFD6] rounded-2xl p-4 sm:p-8 shadow-xs"><div className="max-w-3xl space-y-4">
    <div className="flex flex-wrap items-center gap-2.5"><span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200/80"><ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />{badge ?? (tl ? 'Gabay sa Tulong ng Gobyerno' : 'Government Assistance Guide')}</span><span className="text-xs text-slate-600 font-medium">• {tl ? '100% Libre at Naka-save sa Inyong Device' : '100% Free & Saved on Your Device'}</span></div>
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-slate-900">{title} <span className="text-blue-900">{accent}</span></h1>
    <p className="text-sm sm:text-base leading-relaxed text-slate-700 font-medium">{subtitle}</p>
    <div className="flex flex-wrap gap-2.5 pt-2">{startHref ? <a href={startHref} onClick={event => { event.preventDefault(); onStart(); }} className={civicPrimary}>{start}</a> : <button type="button" onClick={onStart} className={civicPrimary}>{start}</button>}
      <button type="button" onClick={onPrint} className={civicSecondary}><Printer className="w-4 h-4 shrink-0" aria-hidden="true" />{printLabel ?? (tl ? 'I-print ang mga Form' : 'Print Forms')}</button>
      {(onThird || onDirectory) && <button type="button" onClick={onThird ?? onDirectory} className={civicSecondary}><ThirdIcon className="w-4 h-4 shrink-0 text-blue-900" aria-hidden="true" />{thirdLabel ?? (tl ? 'Direktoryo at Desks' : 'Directory & Desks')}</button>}
    </div>
  </div></section>;
}
