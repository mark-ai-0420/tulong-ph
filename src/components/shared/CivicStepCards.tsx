import type { ReactNode } from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import { civicPrimary, civicReference } from './civicStyles';

const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);
interface BreakdownProps { title: string; rows: { label: string; amount: number; testId?: string; isResult?: boolean }[]; note?: string }
export function LiveReliefBreakdownBox({ title, rows, note }: BreakdownProps) {
  return <section aria-live="polite" aria-atomic="true" className={civicReference}>
    <h2 className="font-bold text-slate-900">{title}</h2><dl className="space-y-2 text-sm">{rows.map(({ label, amount, testId, isResult }) => <div key={label} className={`flex flex-wrap justify-between gap-2 ${isResult ? 'rounded-xl bg-slate-900 text-white p-4 font-bold' : 'text-slate-700'}`}><dt>{label}</dt><dd data-testid={testId} className={`tabular-nums ${isResult ? 'text-amber-300' : ''}`}>{money(amount)}</dd></div>)}</dl>
    {note && <p className="text-xs leading-relaxed text-slate-600">{note}</p>}
  </section>;
}
interface RoadmapProps { step: 1 | 2 | 3; title: string; amount?: number; children: ReactNode; open?: boolean }
export function ActionRoadmapStepCard({ step, title, amount, children, open = true }: RoadmapProps) {
  return <details open={open} className="rounded-2xl border border-[#E2DFD6] bg-white shadow-xs">
    <summary className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-3 p-6 font-bold text-slate-900 focus-ring rounded-2xl">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white" aria-hidden="true">{step}</span>
      <span className="flex-1 min-w-0"><span className="block text-xs uppercase tracking-wide text-blue-900">{['Unang Hakbang', 'Pangalawang Hakbang', 'Pangatlong Hakbang'][step - 1]}</span>{title}</span>
      {amount !== undefined && <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm tabular-nums text-blue-900">{money(amount)}</span>}
    </summary><div className="space-y-4 border-t border-[#E2DFD6] p-6">{children}</div>
  </details>;
}
export function RoadmapSummaryBox({ title, note, children, language = 'taglish' }: { title: string; note?: string; children: ReactNode; language?: Language }) {
  return <section className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-4"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />{language === 'taglish' ? 'Handa na ang inyong gabay' : 'Your guide is ready'}</span><h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>{note && <p className="text-sm text-slate-600 leading-relaxed">{note}</p>}{children}</section>;
}
export function ReferenceBreakdownCard({ title, children }: { title?: string; children: ReactNode }) {
  return <section className={civicReference}>{title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}{children}</section>;
}
export function PrintablePacketCallout({ title, description, buttonLabel, onPrint, language = 'taglish' }: { title?: string; description?: string; buttonLabel: string; onPrint: () => void; language?: Language }) {
  return <section className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4"><Printer className="w-6 h-6 text-blue-900 shrink-0" aria-hidden="true" /><div className="flex-1 min-w-0"><h3 className="text-lg font-bold">{title ?? (language === 'taglish' ? 'Ihanda ang inyong printable packet' : 'Prepare your printable packet')}</h3><p className="text-sm text-slate-600 leading-relaxed">{description ?? (language === 'taglish' ? 'Suriin ang detalye, i-download o i-print, at dalhin sa kaukulang opisina.' : 'Review the details, download or print, and bring them to the appropriate office.')}</p></div><button type="button" onClick={onPrint} className={civicPrimary}><Printer className="w-4 h-4 shrink-0" aria-hidden="true" />{buttonLabel}</button></section>;
}
