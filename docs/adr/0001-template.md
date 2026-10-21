# ADR-0001: Client-Side Offline Privacy Architecture

- Status: Accepted
- Date: 2026-09-24
- Decision owners: Technical Architect & Core Maintainers

## Context

Filipino families seeking medical assistance are frequently in vulnerable, distressed circumstances. Public hospital intake sheets require sensitive personal identifying information (PhilHealth Identification Numbers, patient diagnoses, family income levels, national ID scans, and representative relationships). 

Citizens often access assistance forms from public internet terminals (pisonet/computer shops) or low-connectivity mobile networks in hospital hallways. Storing citizen medical records in a central database or transmitting them to third-party cloud services poses severe privacy, regulatory (Data Privacy Act of 2012 / RA 10173), and infrastructure risks.

## Decision

All patient data, intake forms, uploaded documents, and billing calculations will run 100% on the client browser. No backend database or external file upload endpoint will be created.

1. **Local Storage Engine**: Form drafts and compressed document uploads are stored in the user's browser `IndexedDB` (`idb-keyval`).
2. **Client PDF Generation**: Printable intake sheets and forms are rendered in-browser using `jsPDF`.
3. **Pisonet Privacy Wipe**: A prominent, single-action privacy wipe clears all local cookies, `localStorage`, and `IndexedDB` stores with confirmation.

## Alternatives considered

| Alternative | Benefits | Costs or risks |
| --- | --- | --- |
| Central Cloud Database (PostgreSQL / Supabase) | Cross-device sync, centralized analytics | Data breach risk, RA 10173 compliance overhead, server maintenance costs |
| Server-Side PDF Rendering (Node/Puppeteer) | High fidelity font rendering | Network latency, bandwidth consumption, requires transmitting patient data to server |
| Client-Side Local Storage & Zero-Knowledge Architecture | Zero data leakage risk, offline capability, zero hosting cost for user data | User cannot sync across separate devices without manual export |

## Consequences

- **Positive**: Complete citizen privacy; eliminates compliance liability; works seamlessly offline or on poor hospital Wi-Fi.
- **Negative**: User must re-enter information or export files if switching devices.
- **Follow-up**: Maintain continuous automated testing for client-side storage isolation and data wipe triggers.
