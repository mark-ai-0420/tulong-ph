# TulongPH Architecture

## System purpose

TulongPH is an offline-first civic application built on Next.js 16 App Router, React 19, and Tailwind CSS v4. It runs entirely on client devices to evaluate public assistance eligibility, calculate medical billing deductions, and produce printable application forms without transmitting citizen data over the network.

## Components and responsibilities

| Component | Responsibility | Owns data or state |
| --- | --- | --- |
| `TriageWizard` (`src/components/triage/`) | Guides multi-step intake, diagnosis capture, and hospital matching | Active intake form state |
| `BillingCalculator` (`src/lib/triage-engine.ts`) | Computes PhilHealth case rates, PCSO MAP, Malasakit MAIP, and DSWD deductions | Ephemeral calculation state |
| `DocumentVault` (`src/lib/storage.ts`) | Client-side compression and persistence of uploaded intake files | `IndexedDB` (`idb-keyval`) |
| `PDFPacketGenerator` (`src/lib/pdf-generator.ts`) | Generates printable black-and-white official intake forms via `jsPDF` | In-memory canvas / blob |
| `HospitalDirectory` (`src/components/directory/`) | Client-side search and filtering across 200+ Malasakit Center hospitals | Static bundled dataset |
| `PisonetManager` (`src/components/pisonet/`) | Manages emergency data wipe and public computer session state | Local cache purge |

## Data flow

```
[User Input: Case & Bill]
         │
         ▼
[Billing & Triage Engine] ──(Deduction Hierarchy)──► [Results & Stacking Breakdown]
         │                                                        │
         ▼                                                        ▼
[Local Document Vault (IndexedDB)] ───────────────► [Client-side PDF Generator]
         │                                                        │
         ▼                                                        ▼
[Pisonet Wipe (1-click wipe)]                            [Printable Packet (Low-Ink)]
```

1. **Intake & Triage**: User enters patient demographic, hospital, and billing data in client-side React state.
2. **Calculation**: `triage-engine.ts` processes deductions deterministically in statutory sequence.
3. **Local Persistence**: User saves draft to browser `IndexedDB`. No network requests are made with applicant data.
4. **Document Generation**: `jsPDF` compiles vector-sharp printable pages in the client thread.
5. **Session Purge**: On public/pisonet machines, user clicks `Pisonet Wipe` to completely clear IndexedDB and localStorage caches.

## External dependencies

| Dependency | Purpose | Failure behavior |
| --- | --- | --- |
| `jspdf` | Client-side PDF generation | In-browser error banner; fallback to HTML print preview |
| `browser-image-compression` | Client-side file size reduction (<2MB) | Direct file fallback if compression fails |
| `idb-keyval` | Local storage wrapper for IndexedDB | Graceful fallback to sessionStorage/memory if storage is restricted |
| `lucide-react` | Civic iconography | Bundled statically at build time |

## Security and trust boundaries

- **Zero-Telemetry Policy**: Intake data, names, diagnosis text, hospital details, and uploaded scans never leave the client browser.
- **Client Sanitization**: All form inputs are sanitized in React component state prior to PDF embedding.
- **No Remote Credentials**: The application requires no API keys or third-party authentication tokens.
- **Pisonet Hardening**: Dedicated session cleanup modal to protect users on shared internet cafe terminals.

## Operational constraints

- **Static / Edge Delivery**: Deployed as static assets and Edge-rendered Next.js routes (Vercel Edge Network).
- **Bundle Budget**: Optimized for low-bandwidth cellular environments (1-bar LTE/3G) common in Philippine public hospitals.
- **Printer Compatibility**: Generated PDFs and print views target standard monochrome laser and inkjet printers (Letter and A4 dimensions).

## Open questions

- None at present.
