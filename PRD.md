# TulongPH Product Requirements Document (PRD)

## Summary

TulongPH is an open-source, offline-ready civic web application that empowers distressed Filipino families to navigate Philippine government medical and crisis assistance programs (PhilHealth, Malasakit Centers / MAIP, PCSO MAP, DSWD AICS, DOLE, CHED/UNIFAST). It provides transparent aid-stacking calculations, a nationwide public hospital and desk directory, and low-ink printable official intake packets.

## Users and context

- **Primary users**:
  - Families and caregivers managing acute hospitalizations or medical crises under heavy stress.
  - Medical Social Workers (MSWD) assessing indigent patients in public hospitals.
  - Citizens using public internet cafes (pisonet/computer shops) without private devices.
- **Current workflow**:
  - Citizens endure manual queueing across multiple disconnected government desks without knowing which program applies first or what documents are required.
  - Frequent rejection or delays caused by missing documents or applying to programs out of sequence.
- **Constraints**:
  - Low or intermittent cellular connectivity in hospital wards and remote provinces.
  - Strict data privacy: no citizen medical or identifying information may be uploaded to central servers or third-party tracking services.
  - Printable documents must use minimal ink for economical printing at budget computer shops.

## Goals

- Provide accurate deduction order and stacking estimates for medical hospital bills:
  $$\text{Total Bill} \rightarrow \text{PhilHealth Case Rate} \rightarrow \text{PCSO MAP} \rightarrow \text{Malasakit (MAIP)} \rightarrow \text{DSWD AICS}$$
- Generate pixel-accurate, pre-filled printable intake sheets (Malasakit Unified Intake Sheet, DSWD AICS Sheet, Requirements Checklist).
- Maintain 100% client-side privacy with one-click data wipe for shared/public machines.
- Support offline usage with PWA capabilities.

## Non-goals

- TulongPH does **not** process, disburse, or guarantee government funds or eligibility approvals (assistance is provided solely by authorized government agencies).
- No server-side applicant database, login accounts, or cloud document vault.
- No commercial monetization, paywalls, or third-party advertising.

## Requirements and acceptance criteria

| ID | Requirement | Acceptance criteria | Priority |
| --- | --- | --- | --- |
| R1 | Triage & Aid-Stacking Engine | Computes accurate deduction sequence and remaining out-of-pocket costs across PhilHealth, PCSO, Malasakit, and DSWD. Zero and partial-bill edge cases handled cleanly. | Must |
| R2 | Printable Intake Packet | Generates low-ink, black-and-white PDF intake documents client-side using `jsPDF`. Meets standard hospital social service format. | Must |
| R3 | Malasakit Hospital Directory | Searchable directory of 200+ public hospitals across all 17 Philippine regions with desk hours, contact numbers, and classifications (DOH vs. LGU). | Must |
| R4 | Pisonet / Privacy Wipe | 1-click total privacy wipe (`clearAllUserData()`) clearing `IndexedDB` and `localStorage` with explicit confirmation modal. | Must |
| R5 | Education & Worker Pillars | Guidance wizards for CHED/TESDA education assistance and DOLE emergency employment/livelihood programs. | Should |
| R6 | Offline / PWA Support | Functional offline access to triage guides, checklists, and cached directory data via Service Worker / PWA manifest. | Should |

## Risks and trust boundaries

- **Zero Data Leakage**: All medical diagnoses, PhilHealth PINs, and personal records must reside solely in browser storage (`IndexedDB`). No analytics or telemetry on patient identity.
- **Legal & Agency Clarity**: Clear disclaimers stating that TulongPH is an independent civic utility and that public assistance is free from government agencies. Never facilitate fixer transactions.

## Open questions

| Question | Owner | Needed by |
| --- | --- | --- |
| Annual PhilHealth benefit ceiling updates for specific case rates | Product Owner | Q1 2027 |
| Integration of additional LGU-specific financial assistance guidelines | Community Maintainers | Ongoing |
