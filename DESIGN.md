# TulongPH Civic Editorial Design System (DESIGN.md)

> **Design Archetype**: Civic Editorial & Public Health Utility  
> **Target Audience**: Distressed Filipino families, caregivers in hospital corridors, medical social workers (MSWD), and public internet cafe (pisonet) users.  
> **Frameworks**: Next.js 16 (App Router), Tailwind CSS v4, Lucide Icons, Client-Side IndexedDB / WebAssembly.  
> **Source Audit**: Taste Skill v2 & Impeccable Design Quality Re-Audit (Score: 38/40 — Excellent Civic Utility).

---

## 1. Design Philosophy & The Three Dials

TulongPH is designed as an authoritative, calm, and compassionate public-sector utility. When a family member is in the ICU or facing catastrophic medical bills, interface gimmicks cause cognitive overload. The UI must radiate trustworthiness, institutional dignity (in the spirit of GOV.UK, USWDS, and official DOH desks), and zero-leak client privacy.

```
       DENSITY (5/10)            VARIANCE (4/10)            MOTION (2/10)
    [Balanced Civic Order]    [Structured Continuity]    [Calm & Restrained]
```

- **Density: 5 (Daily App Balanced / Chunked Clarity)**
  - Progressive disclosure: 3 clear steps in triage rather than an overwhelming 50-field wall.
  - Information chunking: Maximum 4 items per group, clear visual dividers.
  - Numbers and currency figures are high-contrast and legible.
- **Variance: 4 (Predictable, Structured Civic Order)**
  - Split-column and asymmetric card layouts on desktop/tablet, strictly single-column stacked on mobile.
  - Zero erratic layout shifts; distressed users must always know where their next button is.
- **Motion: 2 (Rock-Solid, Non-Distracting)**
  - No bouncing animations, no parallax, no perpetual floating orbs.
  - Micro-transitions only: 150ms–200ms `fade-in`, subtle button click scales (`active:scale-95`), respecting `prefers-reduced-motion`.

---

## 2. Color Calibration & Materiality

The palette is anchored in **warm civic paper surfaces**, deep institutional navy, and crisp neutral borders. Glowing purple/indigo AI gradients are strictly banned.

| Semantic Token | Hex Code | Tailwind / Role | Application |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#FAF9F5` | `bg-[#FAF9F5]` | Warm paper background; eliminates sterile hospital glare. |
| **Surface (Card/Modal)** | `#FFFFFF` | `bg-white` | Elevated card surfaces and modal bodies. |
| **Surface Border** | `#E2DFD6` | `border-[#E2DFD6]` | Hairline borders defining card containers and dividers. |
| **Primary Text** | `#0F172A` | `text-slate-900` | High-contrast body, labels, and headlines (WCAG AAA). |
| **Secondary Text** | `#475569` | `text-slate-600` | Explanatory helper text, subtitles, and metadata. |
| **Institutional Accent** | `#1E3A8A` / `#172554` | `bg-blue-900`, `text-blue-900` | Authoritative primary action buttons and civic badges. |
| **Security / Verified** | `#047857` / `#ECFDF5` | `emerald-700`, `bg-emerald-50` | Offline-ready badges, verified seals, checklist completion. |
| **Civic Advisory / Alert**| `#B45309` / `#FFFBEB` | `amber-700`, `bg-amber-50` | Pisonet / public computer privacy advisory and warnings. |
| **Critical / Data Wipe** | `#DC2626` / `#FEF2F2` | `red-600`, `bg-red-50` | Computer shop data wipe actions and error alerts. |

### 🚫 Strictly Banned Color Anti-Patterns:
- No purple or neon indigo glowing buttons (`shadow-[0_0_15px_#8b5cf6]`).
- No dark slate/blue header banners (`bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950`).
- No pure black text (`#000000`) or pure black backgrounds.
- No low-contrast gray text on colored badges (e.g. `text-slate-400` on `bg-blue-50`).

---

## 3. Typographic Architecture

TulongPH utilizes a rock-solid system UI font stack that renders with zero network latency, crucial for hospital corridors with 1-bar cellular reception.

- **Font Family**: System UI Sans-Serif (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- **Scale Invariant**: **No text rendered under 12px** anywhere in the application. Micro-text causes fatal errors for elderly citizens and distressed caregivers.
- **Headings**:
  - `h1`: `text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900`
  - `h2`: `text-xl sm:text-2xl font-bold tracking-tight text-slate-900`
  - `h3`: `text-lg sm:text-xl font-bold text-slate-900`
  - `h4`: `text-sm sm:text-base font-bold text-slate-900`
- **Body & Labels**:
  - Regular body: `text-xs sm:text-sm text-slate-700 font-medium leading-relaxed`
  - Form labels: `text-xs sm:text-sm font-bold text-slate-800 block mb-1.5`
  - Currency figures: `font-mono text-sm sm:text-base font-bold text-slate-900`

---

## 4. Touch Targets & Responsive Ergonomics

All interactive controls strictly enforce the **$\ge 44\times 44\text{px}$ touch target invariant** (Apple Human Interface Guidelines & WCAG 2.5.5 Level AAA):

1. **Form Inputs & Selects**:
   - Class: `h-11 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm`
   - Explicit `<label htmlFor="...">` and `id` pairing on 100% of fields.
2. **Buttons & Links**:
   - Primary: `min-h-[44px] h-11 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm`
   - Icon-only buttons: `min-h-[44px] min-w-[44px] p-2.5 flex items-center justify-center`
3. **Mobile Viewport Invariant**:
   - Tested on **320px, 375px, 390px, and 414px**.
   - `document.documentElement.scrollWidth <= window.innerWidth` at all times (**Zero Horizontal Overflow**).
   - Container padding: `px-3 sm:px-4 md:px-6`.

---

## 5. Component Patterns & Behaviors

### A. Navigation Shell (`Navbar.tsx`)
- Desktop: Left brand seal (`TulongPH`), center 3 primary tabs (`Gabay sa Tulong`, `I-print ang Forms`, `Direktoryo at Desks`), right utility cluster (`Pisonet Wipe`, `Language Toggle`).
- Mobile: Segmented horizontal rail below brand header with smooth overflow scroll and dedicated `Shop` wipe button.
- Offline Status Indicator: Calm, non-intrusive status pill (*"● Naka-save sa device"*).

### B. Triage Wizard (`TriageWizard.tsx`)
- **Step 1: Patient & Claimant Intake**:
  - Standardized 12-relation dropdown (Spouse, Child, Parent, Sibling, etc.) with conditional "Other" write-in.
  - Required field validation with non-destructive inline error borders (`border-red-500`) and empathetic guidance.
- **Step 2: Hospital & Medical Case Intake**:
  - Live autocomplete search matching the 200+ verified Malasakit Centers directory by hospital name, alias (e.g. "PGH", "Heart Center"), and city.
  - Auto-fills classification (`public_doh`, `public_lgu`, `private`) and city.
- **Step 3: Aid Stacking Roadmap**:
  - 5-Pillar aid breakdown (PhilHealth $\rightarrow$ Senior/PWD $\rightarrow$ Malasakit $\rightarrow$ PCSO/PACe/Senate $\rightarrow$ DSWD).
  - In-situ Malasakit Hospital Desk card showing exact desk location, operating hours, and direct dial buttons.
  - Dedicated launch card for PACe Malacañang Assistant for catastrophic bills $\ge ₱50\text{k}$.

### C. PACe Assistant Toolkit (`PACEAssistant.tsx`)
- Automatic formal letter generator addressed to *"His Excellency, The President of the Republic of the Philippines"*.
- Pre-filled with patient diagnosis, hospital, and remaining balance.
- 1-Click Copy and direct `mailto:pace@op.gov.ph` integration.
- 6-Point documentary requirements checklist.

### D. 5-Hakbang Aid Stacking Infographic (`StackingInfographic.tsx`)
- Visual 5-layer hierarchy explaining the statutory sequence:
  1. PhilHealth Case Rates
  2. Senior Citizen (RA 9994) / PWD (RA 10754) 20% + 12% VAT Exemption
  3. Malasakit Centers (RA 11463 / DOH MAIP)
  4. PCSO MAP + PACe (Malacañang) / Senate GL
  5. DSWD AICS & LGU Outright Cash
- Anti-Double-Dipping comparison matrix (PACe vs. Senate Assist vs. Direct DSWD AICS).

### E. Public Computer Shop Privacy Mode
- Invariant: Zero patient records or diagnosis data are sent to any remote server.
- 1-Click "Burahin ang Aking Datos" modal purges:
  - IndexedDB stores (`patient`, `representative`, `case`, `documents`, `applications`)
  - LocalStorage & SessionStorage
  - ObjectURL memory blobs
- Resets user session back to Step 1 with a reassuring confirmation toast.

### F. Public vs. Private Hospital Pathway Specifications
- **Legal Constraints (RA 11463)**:
  - Republic Act No. 11463 (Malasakit Centers Act) restricts Malasakit Center desks and DOH-MAIP hospital allocations exclusively to DOH-retained and participating public LGU hospitals.
  - Private hospitals **cannot** host Malasakit desks, and in-hospital DOH Medical Assistance to Indigent Patients (MAIP) funds cannot be drawn at private cashiers.
- **Private Hospital GL Stacking Protocol**:
  - Patients confined in private facilities can still stack external financial assistance through PCSO Individual Medical Assistance Program (IMAP/MAP), Office of the President (PACe), and Senate/Congressional Medical Assistance.
  - **Credit & Collection Department Protocol**: Patients' representatives must formally request a Certified Interim Statement of Account (Running Bill) from the hospital's Credit & Collection office and confirm which government GLs the hospital accepts for billing offset.
  - **RA 9439 Promissory Note Protection**: Under Republic Act No. 9439 (Anti-Hospital Detention Law), patients in ward accommodations who cannot settle their hospital bill cannot be detained or denied discharge summaries and death certificates. Families are legally entitled to execute a Promissory Note secured by mortgage or personal guarantee.
- **Private-to-Public Transfer Protocol**:
  - Recommended for critical deficits (e.g., ICU confinement running ₱50k–₱100k/day, high-cost chemotherapy, or multi-organ failure).
  - **National Patient Navigation and Referral Center (NPNRC)**: Direct coordination via Hotline `1555` (or `0919-977-3333` / `0915-777-7777`) for inter-facility bed hunting across DOH Level 3 Specialty Centers (PGH, Philippine Heart Center, NKTI, LCP, EMMC, RMC).
  - **Physician-to-Physician Endorsement**: Confinement transfer requires hemodynamic stability, physician sign-off, receiving hospital bed confirmation, and equipped ambulance transit.

### G. 3-Tier Button Token System
Standardized interactive tokens ensuring unified tactile hierarchy, instant civic recognition, and strict WCAG AAA / Apple HIG touch target compliance ($\ge 44\text{px}$):
1. **Tier 1: Institutional Navy** (`bg-blue-900 hover:bg-blue-800 text-white min-h-[44px] h-11 px-5 rounded-xl font-bold`)
   - Canonical primary action across all views: advancing triage steps, triggering direct paper print, or submitting official dispatch requests.
2. **Tier 2: Neutral Paper** (`bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] min-h-[44px] h-11 px-4 rounded-xl font-semibold`)
   - Secondary utilities, file downloads, drawer toggles, and clipboard copy operations.
3. **Tier 3: Verified Emerald** (`bg-emerald-700 hover:bg-emerald-800 text-white min-h-[44px] h-11 px-5 rounded-xl font-bold`)
   - High-trust outreach, Viber/Messenger family sharing, and government portal external handoffs.

---

## 6. Cultural & Linguistic Authenticity

- Bilingual architecture: **Taglish (Default)** and **English**.
- The Taglish translation is conversational, compassionate, and respectful of the Filipino family dynamic (e.g., using terms like *"kamag-anak"*, *"pasyente"*, *"ayuda"*, *"pisonet"* rather than stiff bureaucratic jargon).
- Official documents (letters to the President and Senate) maintain high diplomatic and administrative protocol.

---

## 7. Anti-Pattern Checklist (Never Do in TulongPH)

1. ❌ **No AI Slop**: No floating purple/indigo gradients, pulsing glowing neon dots, or futuristic tech orbs.
2. ❌ **No Sub-12px Typography**: Never use text smaller than 12px (`text-xs`).
3. ❌ **No Untracked Horizontal Overflow**: Never allow elements to break 320px/375px mobile viewports.
4. ❌ **No Sub-44px Tap Targets**: Never make a button, link, or input shorter than 44px on touch screens.
5. ❌ **No Server Telemetry on Patient PII**: Never upload patient names, PhilHealth PINs, or medical abstracts to cloud databases or analytics tracking scripts.
6. ❌ **No Duplicate Links**: Never stack identical destination buttons within the same visual card.
