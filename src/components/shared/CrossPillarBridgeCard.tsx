'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartPulse } from 'lucide-react';
import { saveSharedFamilyContext, type SharedFamilyContext } from '@/lib/storage';
import type { Language } from '@/lib/i18n';

const pillars = {
  medical: { label: 'Kalusugan at Ospital', Icon: HeartPulse },
  education: { label: 'Edukasyon at Scholarship', Icon: GraduationCap },
  worker: { label: 'Manggagawa at Benepisyo', Icon: BriefcaseBusiness },
} as const;

interface Props {
  pillar: keyof typeof pillars;
  title: string;
  description: string;
  benefit: string;
  href: string;
  context: Partial<SharedFamilyContext>;
  language?: Language;
}

export function CrossPillarBridgeCard({ pillar, title, description, benefit, href, context, language = 'taglish' }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { label, Icon } = pillars[pillar];
  const english = language === 'en';

  async function continueWithContext() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await saveSharedFamilyContext(context);
      router.push(href);
    } catch {
      setError(english ? 'Family details could not be saved on this device. Please try again.' : 'Hindi nailipat ang detalye ng pamilya sa device. Subukan muli.');
      setBusy(false);
    }
  }

  return <article aria-label={title} className="min-w-0 rounded-2xl border border-[#E2DFD6] bg-white p-5 shadow-xs sm:p-6">
    <div className="flex min-w-0 flex-col items-start gap-3">
      <span className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-950">
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}
      </span>
      <div className="min-w-0 space-y-2">
        <h3 className="break-words text-base font-bold leading-snug text-slate-900">{title}</h3>
        <p className="break-words text-sm leading-relaxed text-slate-700">{description}</p>
      </div>
      <span className="max-w-full break-words rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold leading-relaxed text-emerald-950">{benefit}</span>
      <button type="button" onClick={continueWithContext} disabled={busy}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70 focus-ring sm:w-auto">
        <span>{busy ? (english ? 'Saving family details...' : 'Sine-save ang detalye...') : (english ? 'Open and transfer family details' : 'Buksan at ilipat ang lokasyon at sektor')}</span>
        <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>
      {error && <p role="alert" className="text-sm leading-relaxed text-red-800">{error}</p>}
    </div>
  </article>;
}
