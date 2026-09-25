import React from 'react';
import Link from 'next/link';
import { Compass, HeartHandshake } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[#FAF9F5] text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center mx-auto shadow-2xs">
          <HeartHandshake className="w-7 h-7 text-blue-900" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full inline-block">
            Pahina ay Hindi Nahanap (404)
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Wala Dito ang Inyong Hinahanap
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Maaaring nabago o nailipat ang address. Pumunta sa Aid Navigator upang mag-triage ng hospital bill o mag-print ng forms.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 h-11 min-h-[44px] px-5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <Compass className="w-4 h-4 text-white" />
            <span>Pumunta sa TulongPH Navigator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
