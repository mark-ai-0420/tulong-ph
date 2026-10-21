# TulongPH Product & Engineering Roadmap (`roadmap.md`)

> **Mission**: Guide distressed Filipino families, students, and workers through Philippine government healthcare, education, and labor assistance with 100% free, offline-ready, zero-server-leak civic tools.

---

## 1. Executive Summary & Current Baseline Matrix

**TulongPH** operates across three core civic pillars sharing a unified **Civic Editorial** design system (`src/components/shared/`):
1. **Kalusugan at Ospital (`/`)** - Medical bill stacking, PhilHealth Case Rates, Malasakit Center triage, and Guarantee Letter (GL) packet generation.
2. **Edukasyon at Scholarship (`/edukasyon`)** - JHS/SHS vouchers, Free Higher Education (FHE), CHED/UniFAST (TES, TDP, CMSP, CoScho, MSRS), DOST-SEI, TESDA, OWWA, and DSWD educational assistance.
3. **Manggagawa at Benepisyo (`/manggagawa`)** - SSS, Pag-IBIG, GSIS, Employees' Compensation (ECC), DOLE (SEnA, TUPAD, DILP, SPES), and OWWA/DMW worker benefits, loans, and livelihood programs.

### Cross-Pillar Feature Parity Baseline

| Capability | Medical (`/`) | Education (`/edukasyon`) | Worker (`/manggagawa`) | Shared / Platform |
| :--- | :--- | :--- | :--- | :--- |
| **3-Step Triage & Statutory Engine** | ✅ 5-Layer Stacking (`triageEngine.ts`, `billingCalculator.ts`) | ✅ 13-Program Engine (`educationEngine.ts`) | ✅ 15-Program Calculator (`workerBenefitsCalculator.ts`) + ✅ DOLE SEnA wage / final-pay calculator (Epic 2.2) | ✅ Pure deterministic TypeScript engines |
| **Institution / Location Autocomplete** | ✅ 200+ Hospitals (`malasakitCenters.ts`) | ✅ 113 SUCs, 22 LUCs, 35 private HEIs and 22 TESDA centers (`phSchools.ts`) | ✅ PSGC address and official NWPC wage references (`phLocations.ts`) | ✅ 2025 PSGC hierarchy (`LocationHierarchyFields.tsx`) |
| **Print View Field Persistence** | ✅ Saved to `IndexedDB` (`patient`, `medicalCase`) | ✅ Saved to `IndexedDB` (`educationSession`) | ✅ Worksheet and profile saved in `IndexedDB` (`workerSession`) | ✅ Worker worksheet survives tab changes and is removed by Pisonet wipe |
| **PDF Packet Quality** | ✅ Multi-form structured tables & cover sheets (`pdfGenerator.ts`) | ✅ Structured two-page A4 scholarship packet (`generateEducationPacketPdf`) | ✅ Structured worker worksheets, selectable individually or as a packet (`generateWorkerWorksheetPdf`) | ✅ Shared low-ink table and form primitives in `pdfGenerator.ts` |
| **`<2MB` Document Vault & Compressor** | ✅ 8-slot vault + PDF bundling (`DocumentVault.tsx`) | ✅ Unified vault + PDF packet bundling (`EducationPrintView.tsx`) | ✅ Unified vault + SEnA/worksheet bundling (`WorkerPrintView.tsx`) | ✅ Shared client-side vault in `documentVault.ts` + `compressor.ts`; 1-tap pisonet wipe |
| **1-Tap Native Web Share** | ✅ `navigator.share` in `PrintFormsView.tsx` | ✅ PDF file share with text and clipboard fallbacks | ✅ Selected worksheet PDF share with text and clipboard fallbacks | ✅ Local browser share and clipboard APIs; no applicant-data upload |
| **Application / Claim Status Tracker** | ✅ Local GL and application tracker with live deficit / cooldowns (`GLCooldownTrackerCard.tsx`, Sprint 1.4) | ❌ Missing | ❌ Missing | ⚠️ Medical tracker complete; Education and Worker trackers remain missing |
| **Cross-Pillar Family Context Bridge** | ✅ Context cards for funeral, sickness, OFW, and education pathways | ✅ Shared location and sector prefill; Medical and Worker handoffs | ✅ Shared location and sector prefill; Funeral and sickness routing | ✅ One-tap local context transfer; removed by Pisonet privacy wipe |
| **Language Toggle Persistence** | ✅ Saves `tulong_lang` to `localStorage` (`page.tsx`) | ✅ Loads and saves `tulong_lang` (`edukasyon/page.tsx`) | ✅ Loads and saves `tulong_lang` (`manggagawa/page.tsx`) | ✅ Shared preference across all three routes; reset by Pisonet wipe |
| **Offline PWA Caching** | ✅ Shared app shell and hashed assets | ✅ Shared app shell and hashed assets | ✅ Shared app shell and hashed assets | ✅ Service Worker provides offline routes and clears CacheStorage on Pisonet wipe |

---

## 2. Priority Tier Definitions

- 🔴 **URGENT (Phase 1)** - High-impact parity gaps, data-persistence fixes, statutory accuracy updates, and true offline reliability required for immediate production readiness across all three routes.
- 🟠 **MUST HAVE (Phase 2)** - Core domain calculators, `<2MB` document vaults for Education and Worker portals, expanded statutory packages, regional directories, and cross-pillar family triage handoffs.
- 🟢 **NICE TO HAVE (Phase 3)** - Multi-month/multi-year trackers, pension/dividend simulators, regional language packs (Cebuano/Bisaya, Ilocano), and encrypted local backups for personal devices.

---

## 3. Pillar 1: Medical (`/` - Kalusugan at Ospital)

### 🔴 URGENT
1. **Guarantee Letter (GL) & Application Cooldown Tracker UI**
   - **Context**: `src/lib/storage.ts` and `src/app/page.tsx` already persist `ApplicationRecord[]` in `IndexedDB` (`status`, `amountGranted`, `glValidUntil`, `canReapplyDate`), but no UI exposes it. Families juggle multiple GLs (PCSO valid for 30–60 days, Senate 90-day cooldown, DSWD AICS) and lose track of remaining hospital balance after each GL is issued.
   - **Scope**: Add an interactive **GL & Application Tracker** card in `src/components/TriageWizard.tsx` (Step 3) and `src/components/PrintFormsView.tsx` where families log submitted applications, record granted GL amounts, view live remaining hospital deficit after granted GLs, and see automatic expiry/reapplication countdowns.
   - **Status**: Complete in Sprint 1.4. Cooldown dates are editable reminders; once a reminder is reached, confirm reapplication with the agency.
2. **LGU (Mayor / Governor / Provincial Capitol) & Congressional District GL Assistant**
   - **Context**: `TriageWizard.tsx` provides dedicated modal assistants for OP-PACe (`PACEAssistant.tsx`), PCSO (`PCSOAssistant.tsx`), and Senate (`SenateAssistant.tsx`), while patients in public LGU and private hospitals heavily rely on **Congressional District / Party-List MAIP endorsements** (routed to DOH hospitals) and **Mayor/Governor CSWDO/PSWDO medical/burial letters**.
   - **Scope**: Create `src/components/LGUAndCongressionalAssistant.tsx` with pre-filled formal request letters (Taglish and English), required attachment checklist, and anti-double-dipping guidance on how Congressional MAIP allocations interact with hospital Malasakit desks.

   - **Status**: Complete in Sprint 1.4. Letters state the live deficit after recorded GLs and disclose prior approved GL coverage; Congressional requests direct families to coordinate through DOH / the hospital assistance desk under current MAIFIP guidance.

### 🟠 MUST HAVE
3. **PhilHealth Z-Benefits, Konsulta/YAKAP Outpatient & Cancer Assistance Fund (CAF - RA 11215) Calculator**
   - **Context**: `src/lib/data/philhealthRates.ts` covers 35+ All Case Rates (ACR) under Circular 2024-0037, whereas catastrophic Z-Benefit packages (breast, prostate, cervical, colon cancer, pediatric ALL, kidney transplant, CABG/heart surgery, peritoneal dialysis) and the **DOH Cancer Assistance Fund (CAF)** under RA 11215 (National Integrated Cancer Control Act) follow distinct package ceilings and designated access sites.
   - **Scope**: Expand `philhealthRates.ts`, `billingCalculator.ts`, and `triageEngine.ts` to model PhilHealth Z-Benefit packages, expanded hemodialysis (`PHP 6,350/session x 156 sessions/year`), and DOH Cancer Assistance Fund (CAF) access sites.
   - **Status**: Complete (Epic 2.4). Upward-adjusted hemodialysis to ₱6,350/session x 156 sessions (₱990,600/yr), modeled official Z-Benefit packages (including Breast Cancer up to ₱1.4M under Circular 2024-0007), modeled DOH Cancer Assistance Fund (RA 11215) with up to ₱150,000 diagnostics/chemo support across 36 regional specialty centers, added PhilHealth Konsulta / YAKAP 13-lab and 21-drug benefit catalogue, and integrated outpatient 3-quotation requirements.
4. **Expanded Outpatient Diagnostics, Lab & Prescription Assistance Triage**
   - **Context**: Outpatient laboratory/imaging requests (MRI, CT scan, 2D Echo, biopsy) and high-cost specialty medicines require specific price quotations that differ from inpatient running-bill GLs.
   - **Scope**: Enhance outpatient pathways in `src/lib/triageEngine.ts` with specific quotation checklists (e.g., 3 pharmacy/diagnostic price quotations for DSWD AICS / PCSO outpatient medicine requests).
   - **Status**: Complete (Epic 2.4). High-cost outpatient diagnostic imaging and lab tests (CT, MRI, PET, scans) automatically inject the PCSO/DSWD 3-quotation rule and Konsulta primary-care test alternatives into triage guidance cards and checklists.

### 🟢 NICE TO HAVE
5. **Multi-Session Dialysis & Chemotherapy Cycle Quota Tracker**
   - Track used vs. remaining annual PhilHealth hemodialysis sessions (`156/year`) or chemotherapy cycles locally in `IndexedDB`, alerting families 2 weeks before their GL or session batch expires.
   - **Status**: Complete (Feature 3.4). Dedicated pure engine in `src/lib/treatmentTracker.ts` and interactive card in `TreatmentQuotaTrackerCard.tsx` modeling PhilHealth 156-session statutory hemodialysis quota (Circular 2024-0037), customizable chemotherapy cycles, low-quota threshold warning ($\le 12$ sessions), 14-day GL expiry alert with days countdown, calendar-year session date validation, explicit category precedence over diagnosis text, read-only print summary, IndexedDB persistence with 100% Pisonet privacy wipe purge, and `.tulongph` encrypted backup support. Verified with 13 tracker tests, 151 unit tests, and independent review ACCEPT.
6. **DOH Botika / Hospital Pharmacy Stock & Generic Equivalent Preparation Guide**
   - Add a preparation checklist helping caregivers ask the attending physician for Generic Law (RA 6675) generic names on prescriptions so hospital pharmacies and Malasakit desks can dispense in-stock equivalents.
   - **Status**: Complete (Feature 3.8). Catalog of 31 essential drugs across 7+ therapeutic categories in `src/lib/data/genericPrescriptionGuide.ts` with verified Philippine brand names, PNF status, and PhilHealth 21-medicine YAKAP list flags. Interactive guide in `GenericPrescriptionGuideCard.tsx` mounted on Step 3 of `TriageWizard.tsx` with instant search/filter, 6-point prescription completeness checklist distinguishing RA 6675 Section 6(b) generic name mandates from practical hospital checks, polite doctor request scripts with 1-click clipboard copy in 4 languages (`taglish`, `cebuano`, `ilocano`, `en`), and printable A4 monochrome checklist in `PrintFormsView.tsx`. Zero em dashes (`\u2014`). Verified with 7 focused tests, 186 unit tests, and independent review ACCEPT.

---

## 4. Pillar 2: Education (`/edukasyon` - Edukasyon at Scholarship)

### 🔴 URGENT
1. **Nationwide School, SUC, LUC, Private HEI & TESDA TVI Autocomplete Directory**
   - **Context**: On `/`, typing `"PGH"` or `"East Ave"` auto-fills hospital classification and city. On `/edukasyon`, students must manually classify whether their school is a `public`, `suc_luc`, or `private` institution and whether it is in `NCR`, an `HUC`, or `other`-a common source of error (e.g., confusing a Local University/College like PLM or QCU with a national SUC or private college, or misclassifying an HUC like Cebu, Davao, Baguio, or Iloilo).
   - **Scope**: Create `src/lib/data/phSchools.ts` indexing State Universities and Colleges (SUCs), CHED-recognized Local Universities and Colleges (LUCs), major Private HEIs/SHS, Partner Medical Schools (MSRS), and Regional TESDA Training Centers. Wire an accessible autocomplete input into `src/components/education/EducationWizard.tsx` (Step 1) and `src/components/education/EducationPrintView.tsx` that auto-fills `schoolName`, `schoolType`, `cityMunicipality`, `province`, and `location` tier (`NCR` / `HUC` / `other`).
   - **Status**: Complete in Sprint 1.2. The curated directory includes 113 SUCs, 22 LUCs, 35 private HEIs and 22 public TESDA training centers.
2. **Formatted Official Education PDF Packet & 1-Tap Native Web Share Parity**
   - **Context**: `src/components/education/EducationPrintView.tsx` currently generates an unformatted ASCII text dump via `pdf.splitTextToSize()` and lacks 1-Tap Native Web Share (`navigator.share`).
   - **Scope**: Upgrade `EducationPrintView.tsx` (using shared helpers in `src/lib/pdfGenerator.ts`) to generate a crisp, low-ink A4 formatted PDF packet (Formal Scholarship Assessment Request Letter + Tuition Relief Summary Table + Interactive Documentary Checklist + Statutory Stacking Reference) and add 1-Tap Web Share / Copy Checklist buttons.
   - **Status**: Complete in Sprint 1.3. The two-page A4 packet includes the request letter, student and school details, tuition summary, documentary checklist, matched program references, and native share / text / clipboard fallbacks.

### 🟠 MUST HAVE
3. **Education `<2MB` Client-Side Document Vault**
   - **Context**: Online scholarship portals (CHED StuFAPs/CMSP, DOST-SEI E-Application, PEAC OVAP, OWWA EDSP/ODSP) strictly reject uploads over `2MB`. Students in pisonets struggle to resize smartphone photos of report cards and tax returns.
   - **Scope**: Extend `src/components/DocumentVault.tsx` and `src/lib/compressor.ts` to support Education document slots (`Form 138 / Certified Report Card`, `Certificate of Registration / Enrollment (COR/COE)`, `Parents' ITR / BIR Tax Exemption / Barangay Indigency`, `PSA Birth Certificate`, `School ID / Valid ID`), with optional attachment bundling into the Education PDF packet and full Pisonet wipe integration.
   - **Status**: Complete in Epic 2.3. Unified client-side vault in `DocumentVault.tsx` and `documentVault.ts` with education document slots, readiness indicators, and optional image bundling in `generateEducationPacketPdf`.
4. **CHED / DOST-SEI / PCA CoScho Priority Degree Course Matcher & Application Calendar**
   - **Context**: `EducationWizard.tsx` currently asks boolean checkboxes for STEM/priority courses, leaving students unsure if their specific degree (e.g., BS Nursing, BS Information Technology, BS Accountancy, BS Agricultural Engineering, BS Education) qualifies for DOST-SEI, CHED CMSP (CMO 13, s. 2025), or PCA CoScho, or when application windows open.
   - **Scope**: Add a degree/course search picker mapping common undergraduate programs to `priorityCourse` (CHED CMSP), `dostSAndTCourse` (DOST-SEI), and `coconutPriorityCourse` (PCA CoScho), plus an **Annual Application Window Timeline** card showing typical opening months (e.g., DOST-SEI Oct–Nov, PEAC SHS Voucher May–July, CHED CMSP May–July).
   - **Status**: Complete (Epic 2.5). 190-program Philippine degree catalog (`phDegreePrograms.ts`), `EducationCourseAutocomplete.tsx` combobox with CHED/DOST/CoScho priority tagging and space preservation, `ScholarshipCalendarCard.tsx` annual cycle timeline card on Step 3, and degree inclusion in formal scholarship request letter and summary.

### 🟢 NICE TO HAVE
5. **LGU, Provincial Capitol & Congressional District Iskolar Directory**
   - Add a guide and customizable letter template for Municipal/City/Provincial Scholarships (which often stack as a local living allowance alongside Free Higher Education at SUCs/LUCs).
   - **Status**: Complete (Feature 3.6). Sourced tertiary scholarship programs across all 18 administrative regions in `src/lib/data/lguScholarships.ts`, interactive filtering and automatic location suggestion in `LGUScholarshipDirectoryCard.tsx` (Step 3 of `EducationWizard.tsx`), district confirmation disclosures, polite formal inquiry letter drafting with 1-click clipboard copy across 4 languages (`taglish`, `cebuano`, `ilocano`, `en`), local government recipient presets in `EducationPrintView.tsx`, and zero em dashes (`\u2014`). Verified with 7 focused tests, 169 unit tests, and independent review acceptance.
6. **Semester-by-Semester GWA Retention & Stipend Disbursement Tracker**
   - Local tracker for scholars to monitor their GWA against retention cutoffs (`85%` for DOST/CMSP Full, `80%` for CoScho) and track semester stipend releases.
   - **Status**: Complete (Feature 3.7). Pure deterministic academic engine in `src/lib/gwaTracker.ts` supporting percentage, 1.0–5.0, and 4.0 grading scale normalization, CHED CMSP Full (85%), Half (80%), DOST-SEI (85% + no failing grades), PCA CoScho (80% + no failing grades), and CHED TES retention evaluation with 2.0-percentage-point warning thresholds. Interactive card in `GWATrackerCard.tsx` on Step 3 of `EducationWizard.tsx` with cumulative GWA banner, stipend progress meter (expected vs received vs deficit), term history, and accessible term editor. Storage concurrency protection against restore-time deletion races (`expectedGeneration` abort guards), sequence-guarded storage reads, `.tulongph` backup support, and low-ink print summary table in `EducationPrintView.tsx`. Localized across 4 languages (`taglish`, `cebuano`, `ilocano`, `en`) with zero em dashes (`\u2014`). Verified with 10 tracker tests, 179 unit tests, and independent review ACCEPT.

---

## 5. Pillar 3: Worker & Benefits (`/manggagawa` - Manggagawa at Benepisyo)

### 🔴 URGENT
1. **Persist `WorkerPrintView` Worksheet Inputs in `IndexedDB` + Pisonet Wipe Integration**
   - **Context**: In `src/components/worker/WorkerPrintView.tsx`, the 9 worksheet inputs (`name`, `employer`, `address`, `start`, `end`, `unpaid`, `event`, `project`, `budget`) live only in component-local `useState`. Switching from `I-print ang Forms` back to `Gabay at Kompyutasyon` or `Direktoryo at Desks` (or refreshing the page) wipes out all typed employer details, dates, and unpaid wage itemizations.
   - **Scope**: Persist worker print worksheet fields inside the validated `workerSession` store in `src/lib/storage.ts` (with strict length caps and schema normalization in `src/app/manggagawa/page.tsx`), ensuring they survive tab switches and are 100% purged by `clearAllUserData()`.
   - **Status**: Complete in Sprint 1.1.
2. **Official NWPC Statutory Regional Daily Minimum Wage Dataset**
   - **Context**: `/manggagawa` and `/edukasyon` use regional daily wage estimates for DOLE TUPAD, SPES and DSWD Tara, Basa!; workers in agriculture and small retail/service establishments may have different applicable rates.
   - **Scope**: Update the regional metadata lookup in `src/lib/data/phLocations.ts` with verified **National Wages and Productivity Commission (NWPC)** non-agricultural daily minimum wage rates across all 17 regions (displaying wage order numbers and effective dates in the helper UI while preserving manual override for agricultural/retail-service establishments).
   - **Status**: Complete in Sprint 1.2. Rates reflect orders in effect on 20 October 2026; NIR provinces follow the existing Region VI or VII wage orders while no separate NIR rate is published.
3. **Formatted Worker PDF Packet, Individual Worksheet Selector & 1-Tap Native Web Share**
   - **Context**: `WorkerPrintView.tsx` outputs unstyled plain text blocks in `jsPDF` and prints all 6 worksheets together even when the worker only needs one (e.g., only the DOLE SEnA RFA worksheet or only the HR Maternity/Sickness Notice).
   - **Scope**: Add a worksheet selector (`All Worksheets`, `DOLE SEnA Unpaid Wage RFA`, `HR Maternity/Sickness Benefit Notice`, `ECC Work-Related Claim Checklist`, `DOLE Kabuhayan / OWWA BPBH Proposal`), upgrade PDF generation to structured low-ink tables, and add 1-Tap Native Web Share.
   - **Status**: Complete in Sprint 1.3. Screen preview, print output, PDF download, and share follow the selected worksheet; the full packet includes all four worksheets, the consolidated checklist, and program references.

### 🟠 MUST HAVE
4. **Interactive DOLE SEnA Unpaid Wages, Pro-Rata 13th Month, Holiday/OT & Final/Separation Pay Calculator**
   - **Context**: When a worker selects `Hindi nabayarang sahod / final pay` on `/manggagawa`, Step 2 and Step 3 show no peso calculation, forcing the worker to calculate unpaid days, pro-rata 13th-month pay (PD 851), unused Service Incentive Leave (SIL - 5 days under Art. 95 Labor Code), and separation pay (1/2 month or 1 month per year of service under Art. 298–299) by hand in a raw textarea.
   - **Scope**: Build a deterministic **Wage & Final Pay Itemizer** in `src/lib/workerBenefitsCalculator.ts` and `src/components/worker/WorkerWizard.tsx` (computing unpaid daily/monthly wages, pro-rata 13th-month pay, monetized SIL, and statutory separation pay) that feeds an itemized peso table directly into the printable DOLE SEnA Request for Assistance (RFA) worksheet.
   - **Status**: Complete (Epic 2.2). The live estimate itemizes unpaid wages, pro-rata 13th-month pay, SIL, separation pay, overtime and regular holiday pay, with a one-click transfer to the local SEnA worksheet.
5. **Regional Worker Desk Directory Expansion & Worker `<2MB` Document Vault**
   - **Context**: `src/components/worker/WorkerDirectoryView.tsx` currently lists only 6 national contact cards with no regional filtering, and workers have no `<2MB` Document Vault for My.SSS/e-SEnA uploads.
   - **Scope**: Expand `src/lib/data/workerPrograms.ts` and `WorkerDirectoryView.tsx` with regional DOLE / NLRC / SEnA desks, OWWA regional welfare offices, and ECC regional extension units filterable by region, and enable the `<2MB` Document Vault for worker attachments (`Payslips / Payroll Record`, `Certificate of Employment / Termination Notice`, `Medical Certificate / EC Logbook`, `Valid Government IDs`).
   - **Status**: Complete (Epic 2.3 & 2.6). Comprehensive 18-region worker desk directory in `src/lib/data/workerDesks.ts` and `src/components/worker/WorkerDirectoryView.tsx` with location prefill, agency filters, quick-need filters, text search, nationwide SSS/Pag-IBIG/GSIS servicing, and explicit coverage for BARMM (MOLE, NLRC Sub-RAB Cotabato, DMW, ECC) and NIR (DOLE, NLRC, OWWA, ECC). Integrated with the unified 16-slot client-side vault in `src/lib/documentVault.ts` and `src/components/DocumentVault.tsx`.

### 🟢 NICE TO HAVE
6. **SSS / GSIS Disability (Partial vs. Permanent Total) & Retirement Pension Estimator + Pag-IBIG MP2 Simulator**
   - Add statutory calculators for SSS Disability/Retirement monthly pension formulas (RA 11199 three-formula comparison: `PHP 300 + 20% AMSC + 2% CYS beyond 10` vs. `40% AMSC` vs. minimum `PHP 1,200 / PHP 2,400`) and Pag-IBIG MP2 5-year dividend compounding vs. annual payout illustration.
   - **Status**: Complete (Feature 3.2). Pure deterministic pension engine in `src/lib/workerBenefitsCalculator.ts` modeling SSS retirement (3 formulas + ₱1,000 benefit + 13th month + lump-sum fallback for <120 months), SSS disability (PTD with ₱500 allowance vs PPD severity fraction), GSIS Basic Monthly Pension (BMP) with 60-month lump sum vs 18-month cash + lifetime BMP and ineligibility warning, and Pag-IBIG MP2 5-year year-by-year schedule (compounding vs annual payout for monthly and lump-sum savings). Fully integrated with `WorkerWizard.tsx` across all 4 languages (`taglish`, `cebuano`, `ilocano`, `en`) and verified with 89 unit tests.
7. **OFW Contract Verification & DMW / OWWA Repatriation Case Tracker**
   - Dedicated checklist and status log for land-based and sea-based OFWs navigating DMW AKSYON Fund legal/medical/repatriation assistance and standard employment contract claims.
   - **Status**: Complete (Feature 3.5). Pure domain engine in `src/lib/ofwTracker.ts` with DMW AKSYON Fund universal coverage (RA 11641), OWWA BPBH livelihood support tiers (PHP 20,000 active, PHP 5,000 inactive single contribution, PHP 10,000 inactive multiple contributions, PHP 0 undocumented non-member), Joint and Solidary Liability Rule (RA 8042/10022) holding local agencies 100% liable, and POEA-SEC seafarer protections under RA 12021. Interactive UI `OFWCaseTrackerCard.tsx` with milestone progression stepper, evidence checklist, 24/7 hotline 1348 callout, and 1-click local agency demand letter draft. Localized in 4 languages (`taglish`, `cebuano`, `ilocano`, `en`) with uniform neutral livelihood support copy and zero em dashes (`\u2014`). Concurrency-safe IndexedDB persistence and encrypted `.tulongph` backup with strict contribution schema validation. Passed independent high-risk deep review.

---

## 6. Pillar 4: Shared Platform, Offline PWA & Cross-Pillar Architecture

### 🔴 URGENT
1. **True Offline Service Worker (`sw.js`) & App-Shell Route Caching**
   - **Context**: Hospital corridors (PGH, Vicente Sotto, SPMC) and rural barangays frequently have zero cellular reception. While `Navbar.tsx` displays an offline badge and `manifest.ts` enables Add-to-Home-Screen, there is no Service Worker caching `/`, `/edukasyon`, `/manggagawa`, `/privacy`, and static JS/CSS chunks-so refreshing or switching routes while offline fails with a browser network error.
   - **Scope**: Implement a cache-first/network-fallback Service Worker (`public/sw.js` + registration in `src/app/layout.tsx`) that precaches the 4 static routes and assets while strictly never caching or intercepting personal data, and clears caches cleanly on version bump or Pisonet wipe.
   - **Status**: Complete in Sprint 1.1.
2. **Cross-Route Language Preference (`tulong_lang`) Synchronization**
   - **Context**: `src/app/page.tsx` reads and writes `localStorage.getItem('tulong_lang')`, whereas `src/app/edukasyon/page.tsx` and `src/app/manggagawa/page.tsx` initialize `language` to `'taglish'` without reading or saving `tulong_lang`. Switching routes resets the user's selected language.
   - **Scope**: Unify `tulong_lang` persistence across `/`, `/edukasyon`, and `/manggagawa` (and ensure `clearAllUserData()` resets it to `'taglish'`).
   - **Status**: Complete in Sprint 1.1.

### 🟠 MUST HAVE
3. **Cross-Pillar Family Triage Bridge ("One-Family Shared Context")**
   - **Context**: Real-world crises span multiple pillars:
     - A hospitalized worker on `/` often qualifies for **SSS Sickness Benefit (up to 120 days) + Employees' Compensation (ECC) Medical Reimbursement** on `/manggagawa`.
     - A deceased patient's family on `/` (`burial_funeral` category) may ask about SSS Funeral Benefit (PHP 12k with 1-35 contributions, or a variable PHP 20k-60k with 36+ contributions), separate GSIS rules, and the PHP 30k ECC funeral benefit for compensable work-related death on `/manggagawa`, plus OWWA ELAP / DSWD educational aid for eligible surviving children on `/edukasyon`.
     - An indigent `4Ps`, `PWD`, or `OFW` household enters the same address, income, and sector flags 3 separate times across the 3 routes.
   - **Scope**: Add contextual **Cross-Pillar Action Cards** on Step 3 of each wizard with a 1-tap **"Ilipat ang lokasyon at sektor"** handoff that pre-populates shared context (`province`, `cityMunicipality`, `barangay`, `is4Ps`, `isPWD`, `isOFW`) across routes.
   - **Status**: Complete (Epic 2.1).
4. **Unified Multi-Pillar `<2MB` Document Vault**
   - **Context**: Common documents like `Valid Government ID`, `Barangay Certificate of Indigency`, `PSA Birth/Marriage Certificate`, and `Medical Abstract` are required across Medical GLs, Education scholarships, and Worker SSS/ECC claims.
   - **Scope**: Upgrade `src/components/DocumentVault.tsx` and `src/lib/storage.ts` so core documents uploaded once can be reused across Medical, Education, and Worker PDF packets without re-uploading or re-compressing, while remaining 100% local and wiped in 1 click by Pisonet Mode.
   - **Status**: Complete (Epic 2.3). Reusable 16-slot client-side vault in `documentVault.ts` and `DocumentVault.tsx` supporting pillar filtering (Medical, Education, Worker, Shared), program readiness meters (Senate, PCSO, CHED/TES, DOST, SEnA, SSS, ECC), compound checklist requirements resolution, ready counts in `Navbar`, and optional attachment bundling in `generateEducationPacketPdf` and `generateWorkerWorksheetPdf`. 100% cleared on Pisonet privacy wipe.

### 🟢 NICE TO HAVE
5. **Regional Philippine Language Packs (Cebuano / Bisaya & Ilocano)**
   - Expand `src/lib/i18n.ts` beyond `taglish` and `en` to include conversational **Cebuano / Bisaya** (for Visayas & Mindanao Malasakit centers) and **Ilocano** (Northern Luzon).
   - **Status**: Complete (Feature 3.1). Added comprehensive, natural conversational translations for `cebuano` and `ilocano` in `src/lib/i18n.ts` covering 100% of application dictionary keys, `supportedLanguages` metadata, 4-way `getNextLanguage` cycle helper, cross-route `tulong_lang` storage synchronization with validation, regional GL cooldown reminders in `src/lib/glTracking.ts`, and full unit verification in `scripts/test-i18n-regional-languages.mjs` (80 tests passing).
6. **Encrypted Local Case Backup (`.tulongph` Export / Import for Personal Devices)**
   - Optional password-encrypted local JSON/ZIP export and restore for caregivers on personal smartphones managing multi-month chemotherapy/dialysis or multi-year scholarships, explicitly hidden/warned against on Pisonet/shared computers.
   - **Status**: Complete (Feature 3.3). Client-side AES-GCM 256-bit + PBKDF2 (100,000 iterations SHA-256) encrypted file format (`TULONGPH_BACKUP_V1`), zero server leaks, high-contrast Pisonet privacy warnings in 4 languages (`taglish`, `cebuano`, `ilocano`, `en`), 15-second leased persistent lock with auto-reclamation of expired leases, `beforeunload` cleanup, durable IndexedDB pre-restore snapshot journaling (`saveRestoreJournal`, `recoverAbandonedRestore`) with session isolation (`${RESTORE_JOURNAL_KEY}_${sessionId}`), and foreign-lease readiness gating (`ensureReadyForStorage()`) preventing partial-read leakage across reloads and multi-tab sessions. Verified with 48 automated backup tests and 137 unit tests.

---

## 7. Phased Execution Horizons & Verification Gates

| Horizon | Priority Tier | Key Deliverables | Required Verification Gates |
| :--- | :--- | :--- | :--- |
| **Phase 1 (Complete & Accepted)** | 🔴 **URGENT** | • **Platform (Sprint 1.1 Complete)**: Offline Service Worker (`sw.js`) + `tulong_lang` sync across all 3 routes<br>• **Worker**: Persist `WorkerPrintView` fields in `IndexedDB` *(Sprint 1.1 Complete)* + Official NWPC Regional Wages *(Sprint 1.2 Complete)* + Structured PDF, worksheet selector & 1-Tap Share *(Sprint 1.3 Complete)*<br>• **Education**: School/SUC/LUC/TESDA Autocomplete *(Sprint 1.2 Complete)* + Structured PDF & 1-Tap Share *(Sprint 1.3 Complete)*<br>• **Medical (Sprint 1.4 Complete)**: GL & Application Cooldown Tracker UI + LGU/Congressional Assistant | Verified: `pnpm run lint`, `npx tsc --noEmit`, `pnpm run test:unit` (38/38), `node scripts/test-gl-cooldown-tracker.mjs` (7/7), `node scripts/test-pdf-packets.mjs` (12/12), Turbopack production build (8/8 routes), and fresh independent Codex reviews for all 4 sprints passed with 0 findings. |
| **Phase 2 (Complete & Accepted)** | 🟠 **MUST HAVE** | • **Platform**: Epic 2.1 Cross-Pillar Family Triage Bridge + Epic 2.3 Unified Multi-Pillar `<2MB` Document Vault<br>• **Worker**: Epic 2.2 DOLE SEnA wage / final-pay calculator + Epic 2.6 Regional Worker Desk Directory (18 regions, nationwide SSS/Pag-IBIG/GSIS, BARMM/NIR)<br>• **Education**: Epic 2.3 Education Document Vault + Epic 2.5 CHED/DOST/PCA Priority Degree Matcher & Application Calendar<br>• **Medical**: Epic 2.4 PhilHealth Z-Benefits, Konsulta/YAKAP & Cancer Assistance Fund (RA 11215) + Outpatient Diagnostics Quoting Guide | Verified: `pnpm run test:unit` (74/74 tests passing across all suites), `npx tsc --noEmit` (0 errors), `pnpm run lint` (0 errors), Next.js 16 Turbopack production build (8/8 routes generated), and fresh independent Codex reviews completed for all epics with 0 blockers. |
| **Phase 3 (Complete & Accepted)** | 🟢 **NICE TO HAVE** | • **Platform**: Feature 3.1 Cebuano/Bisaya & Ilocano Language Packs *(Complete & Accepted)* + Feature 3.3 Encrypted `.tulongph` Local Backup *(Complete & Accepted)*<br>• **Worker**: Feature 3.2 SSS/GSIS Disability & Retirement Pension Estimator + Pag-IBIG MP2 Simulator *(Complete & Accepted)* + Feature 3.5 OFW Contract & Repatriation Case Tracker *(Complete & Accepted)*<br>• **Education**: Feature 3.6 LGU/Provincial Scholarship Directory *(Complete & Accepted)* + Feature 3.7 Semester GWA Retention & Stipend Tracker *(Complete & Accepted)*<br>• **Medical**: Feature 3.4 Multi-Session Dialysis/Chemo Quota Tracker *(Complete & Accepted)* + Feature 3.8 DOH Botika Generic Guide *(Complete & Accepted)* | Verified: `pnpm run lint`, `npx tsc --noEmit`, `pnpm run test:unit` (186/186 passing), Turbopack production build (8/8 routes generated), 0 em dashes, and fresh independent Codex reviews completed with 0 blockers. |
