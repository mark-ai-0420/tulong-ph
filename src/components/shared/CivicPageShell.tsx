import type { ReactNode } from 'react';
import { civicContainer } from './civicStyles';

interface Props { navigation: ReactNode; footer: ReactNode; children: ReactNode; overlays?: ReactNode; mainId?: string; className?: string }
export function CivicPageShell({ navigation, footer, children, overlays, mainId = 'main-content', className = '' }: Props) {
  return <div className={`min-h-[100dvh] flex flex-col w-full bg-[#FAF9F5] text-slate-900 font-sans antialiased ${className}`}>
    {navigation}<main id={mainId} className={`flex-1 min-w-0 py-6 space-y-6 ${civicContainer}`}>{children}</main>{footer}{overlays}
  </div>;
}
