# TulongPH Design System

> Canonical detailed design specification is maintained in [`DESIGN.md`](../DESIGN.md).

## Product principles

- **Calm Civic Order**: When facing catastrophic medical expenses, flashy animations or glowing AI aesthetics cause cognitive overload. Interface is grounded in institutional trust, high legibility, and dignity.
- **Privacy by Default**: 100% client-side storage (`IndexedDB` / `localStorage`). Zero tracking, zero external telemetry, zero server-side storage of citizen medical records.
- **Low-Ink & Low-Resource Optimization**: Printable forms and PDFs are formatted in high-contrast black & white for inexpensive computer shop (pisonet) thermal/inkjet printers.

## Brand and visual direction

- **Archetype**: Civic Editorial & Public Health Utility.
- **Visual References**: Institutional portals (GOV.UK, USWDS, DOH public desks).
- **Three Dials**: Density 5/10 (Chunked clarity), Variance 4/10 (Predictable grid), Motion 2/10 (Calm, 150–200ms micro-transitions only, respects `prefers-reduced-motion`).

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas Background | `#FAF9F5` (`bg-[#FAF9F5]`) | Warm paper surface; eliminates harsh hospital glare |
| Surface (Card/Modal) | `#FFFFFF` (`bg-white`) | Elevated cards, dialog bodies |
| Surface Border | `#E2DFD6` (`border-[#E2DFD6]`) | Hairline container dividers |
| Primary Text | `#0F172A` (`text-slate-900`) | Headings and primary copy (WCAG AAA) |
| Secondary Text | `#475569` (`text-slate-600`) | Subtitles, helper text, and metadata |
| Institutional Accent | `#1E3A8A` / `#172554` | Primary actions and civic seal badges |
| Verified / Offline | `#047857` / `#ECFDF5` | Offline-ready badge, completed checklist steps |
| Pisonet Advisory | `#B45309` / `#FFFBEB` | Public computer warning banner |
| Critical / Wipe | `#DC2626` / `#FEF2F2` | Privacy wipe actions and error alerts |

## Components and states

| Component | Variants | Interaction and error states |
| --- | --- | --- |
| `Navbar` | Desktop horizontal, Mobile bottom rail | Sticky header, offline badge, pisonet wipe trigger |
| `TriageWizard` | Step 1 (Intake), Step 2 (Bill), Step 3 (Stack) | Form field validations, inline error banners, live recalculation |
| `HospitalDirectory` | Region filter, classification pill, search input | Instant client-side filter, dialable hotlines, copy desk address |
| `PrintableForms` | Malasakit Sheet, DSWD AICS, Requirements Sheet | Live print preview, client-side PDF download (`jsPDF`) |

## Accessibility

- **Touch Targets**: Strictly $\ge 44 \times 44\text{px}$ on all interactive controls (`min-h-[44px]`).
- **Minimum Font Size**: No text rendered under 12px anywhere in the app.
- **Form Controls**: Explicit `<label htmlFor="...">` and matching `id` pairing on all inputs.
- **Color Contrast**: WCAG AAA compliant body text against warm paper background.
- **Motion**: No looping or bouncy animations; `fade-in` 150ms max with reduced-motion support.

## Responsive behavior

- Viewports verified: 320px, 375px, 390px, 414px, 768px, 1024px, 1280px+.
- Zero horizontal overflow invariant (`scrollWidth <= innerWidth`).
- Container padding scales gracefully: `px-3 sm:px-4 md:px-6`.
