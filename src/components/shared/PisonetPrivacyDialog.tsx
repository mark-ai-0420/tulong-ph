'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import { civicSecondary } from './civicStyles';

interface Props { open: boolean; busy: boolean; error?: string; onCancel: () => void; onConfirm: () => void; language: Language; titleId: string; descriptionId: string; confirmAriaLabel?: string; cancelDisabled?: boolean }
export function PisonetPrivacyDialog({ open, busy, error, onCancel, onConfirm, language, titleId, descriptionId, confirmAriaLabel, cancelDisabled = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const tl = language === 'taglish';
  const cannotClose = busy || cancelDisabled;
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      node.showModal();
      cancel.current?.focus();
    } else if (!open && node.open) {
      node.close();
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    }
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!cannotClose) onCancel(); }}
    className="fixed inset-0 m-auto w-[calc(100%_-_24px)] max-w-md max-h-[calc(100dvh_-_24px)] overflow-y-auto rounded-2xl border border-[#E2DFD6] bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60">
    <div className="space-y-4">
      <div className="flex items-start gap-3.5"><span className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200"><Trash2 className="w-6 h-6" aria-hidden="true" /></span><div className="space-y-1"><h2 id={titleId} className="text-base sm:text-lg font-bold leading-snug">{tl ? 'Burahin ang Lahat ng Datos sa Computer na Ito?' : 'Clear All Data from this Device?'}</h2><span className="inline-block text-xs font-bold text-red-800 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-200">{tl ? 'Pisonet / Shop Mode' : 'Computer Shop Mode'}</span></div></div>
      <p id={descriptionId} className="text-xs sm:text-sm text-slate-600 leading-relaxed">{tl ? 'Nasa computer shop o pisonet ka ba? Buburahin nito ang inyong medical, education at worker profiles, PhilHealth PIN, at na-upload na mga dokumento mula sa browser na ito upang hindi makita ng susunod na gagamit ng computer.' : 'Using a public computer or internet cafe? This clears medical, education and worker profiles, PhilHealth PINs and uploaded documents from this browser so the next user cannot access your records.'}</p>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" /><p>{tl ? 'Hindi na maibabalik ang datos kapag nabura na. Siguraduhing na-download o na-print na ang inyong mga form.' : 'This cannot be undone. Ensure you have downloaded or printed your forms before proceeding.'}</p></div>
      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /><div className="leading-relaxed"><p>{tl ? 'Nais malaman kung paano pinoprotektahan ang iyong datos?' : 'Want to know how your data is protected?'}</p>{cannotClose ? <span className="inline-flex min-h-[44px] items-center font-bold">Data Privacy Charter</span> : <Link href="/privacy" onClick={onCancel} className="font-bold underline hover:text-blue-700 inline-flex items-center min-h-[44px] py-1 focus-ring rounded">{tl ? 'Basahin ang aming Data Privacy Charter →' : 'Read our Data Privacy Charter →'}</Link>}</div></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2"><button ref={cancel} type="button" disabled={cannotClose} onClick={onCancel} className={civicSecondary}>{tl ? 'Kanselahin' : 'Cancel'}</button><button type="button" disabled={busy} aria-label={busy ? undefined : confirmAriaLabel} onClick={onConfirm} className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 focus-ring disabled:opacity-50"><Trash2 className="w-4 h-4" aria-hidden="true" />{busy ? (tl ? 'Binubura...' : 'Clearing...') : (tl ? 'Oo, Burahin ang Lahat' : 'Yes, Wipe All Data')}</button></div>
    </div>
  </dialog>;
}
