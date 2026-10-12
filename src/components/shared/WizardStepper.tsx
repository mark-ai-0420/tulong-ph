import { Fragment } from 'react';
import { Check } from 'lucide-react';

interface Props { currentStep: number; onStepChange: (step: number) => void; steps: { title: string; subtitle: string; ariaLabel?: string }[]; itemElement?: 'button' | 'div' }
export function WizardStepper({ currentStep, onStepChange, steps, itemElement = 'button' }: Props) {
  return <nav aria-label="Mga hakbang" className="bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs"><div className="max-w-xl mx-auto flex items-center justify-between">
    {steps.map(({ title, subtitle, ariaLabel }, index) => {
      const step = index + 1;
      const completed = step < currentStep;
      const active = step === currentStep;
      const body = <><span className={`flex w-11 h-11 shrink-0 items-center justify-center rounded-full font-bold ${completed ? 'bg-emerald-700 text-white' : active ? 'bg-blue-900 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-500'}`}>{completed ? <Check className="w-5 h-5" aria-hidden="true" /> : step}</span><span className={`text-xs sm:text-sm font-bold ${active ? 'text-blue-900' : completed ? 'text-emerald-800' : 'text-slate-600'}`}>{title}</span><span className="hidden sm:block text-xs text-slate-600">{subtitle}</span></>;
      const props = { 'aria-label': ariaLabel ?? `${step}. ${title}`, 'aria-current': active ? 'step' as const : undefined, onClick: () => onStepChange(step), className: 'min-w-0 flex-1 flex flex-col items-center gap-2 text-center rounded-lg focus-ring cursor-pointer' };
      return <Fragment key={title}>{index > 0 && <span aria-hidden="true" className={`flex-1 max-w-12 min-w-2 h-0.5 mx-2 sm:mx-4 self-start mt-5 ${step <= currentStep ? 'bg-emerald-600' : 'bg-slate-200'}`} />}{itemElement === 'div' ? <div {...props} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onStepChange(step); } }}>{body}</div> : <button {...props} type="button">{body}</button>}</Fragment>;
    })}
  </div></nav>;
}
