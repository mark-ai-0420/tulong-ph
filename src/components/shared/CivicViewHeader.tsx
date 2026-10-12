import type { ReactNode } from 'react';
import { Building2, type LucideIcon } from 'lucide-react';

interface Props { title: string; description: string; badge: string; icon?: LucideIcon; actions?: ReactNode; children?: ReactNode }
export function CivicViewHeader({ title, description, badge, icon: Icon = Building2, actions, children }: Props) {
  return <section className="print:hidden bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-8 shadow-xs space-y-4">
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900"><Icon className="w-4 h-4" aria-hidden="true" />{badge}</span>
    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1><p className="max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-slate-700">{description}</p>
    {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}{children}
  </section>;
}
