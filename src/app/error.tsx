'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled TulongPH Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[#FAF9F5] text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Nagkaroon ng Hindi Inaasahang Aberya
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Huwag mag-alala, ligtas ang inyong na-save na mga datos sa browser na ito. Subukang i-refresh ang system.
          </p>
          <p className="text-xs text-slate-500 italic">
            An unexpected error occurred. Your saved local progress remains safely stored in this browser.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-11 min-h-[44px] px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Subukang Muli / Retry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-11 min-h-[44px] px-4 rounded-xl bg-white border border-[#E2DFD6] hover:bg-stone-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Bumalik sa Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
