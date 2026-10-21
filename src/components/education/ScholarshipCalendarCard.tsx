import { CalendarDays, ExternalLink } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import { getScholarshipStatus, scholarshipCalendar, type ScholarshipCalendarEntry, type ScholarshipWindowStatus } from '@/lib/data/scholarshipCalendar';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatMonths(months: number[]): string {
  if (!months.length) return 'No fixed nationwide month';
  const names = months.map(month => monthNames[month - 1]);
  return names.length > 1 && months.every((month, index) => index === 0 || month === months[index - 1] + 1)
    ? `${names[0]} to ${names[names.length - 1]}`
    : names.join(', ');
}

function statusLabel(entry: ScholarshipCalendarEntry, status: ScholarshipWindowStatus, tl: boolean): string {
  if (status === 'open_now') return tl ? 'Karaniwang panahon' : 'Typical window';
  if (status === 'upcoming') return tl ? 'Inaasahan' : 'Upcoming';
  if (status === 'enrollment_cycle') return tl ? 'Sa enrollment' : 'At enrollment';
  if (entry.id === 'dswd-tara-basa') return tl ? 'Tingnan ang lokal na call' : 'Check local call';
  return tl ? 'Tingnan ang OWWA call' : 'Check OWWA call';
}

function statusClass(status: ScholarshipWindowStatus): string {
  if (status === 'open_now') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'upcoming') return 'border-blue-200 bg-blue-50 text-blue-900';
  if (status === 'enrollment_cycle') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-slate-200 bg-slate-50 text-slate-800';
}

export function ScholarshipCalendarCard({ language = 'taglish' }: { language?: Language }) {
  const tl = language === 'taglish';

  return <section aria-labelledby="education-calendar-title" className="rounded-2xl border border-[#E2DFD6] bg-white p-4 sm:p-5">
    <header className="flex items-start gap-3 border-b border-[#E2DFD6] pb-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900"><CalendarDays aria-hidden="true" className="h-5 w-5" /></span>
      <div>
        <h2 id="education-calendar-title" className="text-lg font-bold text-slate-900">{tl ? 'Taunang Application Calendar' : 'Annual Application Calendar'}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {tl ? 'Tantiyang buwan lamang ito. Kumpirmahin ang kasalukuyang tawag sa opisyal na portal o regional office.' : 'These are planning months only. Confirm the active call on the official portal or with the regional office.'}
        </p>
      </div>
    </header>
    <ol className="mt-4 space-y-4">
      {scholarshipCalendar.map(entry => {
        const status = getScholarshipStatus(entry);
        const months = formatMonths(entry.typicalMonths);
        const schedule = entry.mode === 'year_round' && entry.typicalMonths.length
          ? `${tl ? 'Recent local cycle' : 'Recent local cycle'}: ${months}`
          : months;
        return <li key={entry.id} className="grid min-w-0 gap-2 border-l-2 border-blue-100 pl-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
          <div className="min-w-0">
            <h3 className="break-words text-sm font-semibold text-slate-900">{entry.name}</h3>
            <p className="mt-1 text-xs text-slate-600">{tl ? 'Karaniwang panahon' : 'Typical timing'}: {schedule}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{entry.guidance}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className={`inline-flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs font-semibold ${statusClass(status)}`}>{statusLabel(entry, status, tl)}</span>
            <a href={entry.portalUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-900 underline focus-ring">
              <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />{tl ? 'Opisyal na portal' : 'Official portal'}
            </a>
          </div>
        </li>;
      })}
    </ol>
  </section>;
}
