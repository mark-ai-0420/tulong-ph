import Link from 'next/link';
import { ShieldAlert, Trash2 } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import { civicContainer } from './civicStyles';

interface Props { language: Language; onTabChange: (tab: string) => void; onOpenPrivacyModal: () => void; disclaimer: string }
export function CivicFooter({ language, onTabChange, onOpenPrivacyModal, disclaimer }: Props) {
  const tl = language === 'taglish';
  return <footer className="print:hidden bg-white border-t border-[#E2DFD6] mt-6 py-8 text-xs text-slate-600">
    <div className={`${civicContainer} space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 min-w-0"><span className="w-6 h-6 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold" aria-hidden="true">T</span><span className="font-bold text-slate-900">TulongPH</span><span>· Open-Source Philippine Assistance Navigator</span></div>
        <nav aria-label={tl ? 'Mga shortcut sa footer' : 'Footer shortcuts'} className="flex flex-wrap items-center gap-x-4">
          {[
            ['triage', tl ? 'Gabay sa Tulong' : 'Aid Navigator'],
            ['print_forms', tl ? 'I-print ang Forms' : 'Print Forms'],
            ['directory', tl ? 'Direktoryo at Desks' : 'Directory & Desks'],
          ].map(([tab, label]) => <button key={tab} type="button" onClick={() => onTabChange(tab)} className="min-h-[44px] inline-flex items-center text-xs font-semibold text-slate-700 hover:text-blue-900 focus-ring rounded">{label}</button>)}
          <Link href="/privacy" className="min-h-[44px] inline-flex items-center font-semibold text-slate-700 hover:text-blue-900 focus-ring rounded">{tl ? 'Patakaran sa Privacy at Disclaimer' : 'Privacy Policy & Civic Disclaimer'}</Link>
        </nav>
      </div>
      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="flex items-start gap-2.5 text-amber-950 font-medium leading-relaxed"><ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /><span>{tl ? 'Nasa computer shop o pisonet ka ba? Burahin ang inyong profile at mga dokumento bago umalis para sa inyong privacy.' : 'Using a public computer or pisonet? Wipe your profile and documents before leaving for your privacy.'}</span></p>
        <button type="button" onClick={onOpenPrivacyModal} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold inline-flex items-center justify-center gap-2 shrink-0 focus-ring"><Trash2 className="w-4 h-4 text-amber-300" aria-hidden="true" />{tl ? 'Burahin ang Datos (Pisonet)' : 'Wipe Data (Public PC)'}</button>
      </div>
      <p className="leading-relaxed">{disclaimer}{' '}<Link href="/privacy" className="text-blue-900 font-bold underline hover:text-blue-700 inline-flex items-center min-h-[44px] py-1 focus-ring rounded">{tl ? 'Basahin ang buong Data Privacy Charter →' : 'Read the full Data Privacy Charter →'}</Link></p>
    </div>
  </footer>;
}
