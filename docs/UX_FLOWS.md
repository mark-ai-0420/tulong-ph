# TulongPH UX Flows

## Flow inventory

| Flow | User goal | Entry point | Success state |
| --- | --- | --- | --- |
| Medical Triage & Aid Stacking | Calculate remaining hospital bill after PhilHealth, PCSO, Malasakit, and DSWD | `/` | Actionable aid roadmap with step-by-step instructions and desk locations |
| PDF Intake Packet Generator | Download/print pre-filled official intake sheets | `/forms` | Generated black-and-white PDF packet ready for hospital social service |
| Malasakit Hospital Directory | Locate the nearest public hospital desk and verify contact info | `/directory` | Hospital matched with address, phone numbers, and operating hours |
| Education Aid Wizard | Find scholarship and financial assistance programs (CHED/UNIFAST/TESDA) | `/edukasyon` | Tailored educational grant checklist and application instructions |
| Worker Aid Wizard | Access DOLE emergency employment or livelihood assistance | `/manggagawa` | Matched DOLE program checklist and regional office contact |
| Pisonet Data Wipe | Delete all saved patient records from shared computer | Top Navigation / Modal | Storage wiped, banner confirms session clean |

---

## Flow: Medical Triage & Aid Stacking

### Preconditions

- User has patient admission details, hospital name, and estimated or running hospital bill.

### Steps and system response

1. **User**: Visits `/` and begins Step 1 (Patient & Hospital Intake).
2. **System**: Auto-completes hospital name against 200+ public hospitals and identifies whether it is DOH-retained or LGU-managed.
3. **User**: Enters total hospital bill and indicates PhilHealth coverage in Step 2.
4. **System**: Validates bill amounts, computes statutory PhilHealth deductions, and models PCSO/Malasakit/DSWD contribution bands.
5. **User**: Reviews Step 3 (Aid Stacking Roadmap) showing exact deduction progression.
6. **System**: Displays deduction sequence, remaining balance, required documents checklist, and on-site Malasakit desk instructions.

### Alternate and failure paths

- **Zero Bill / Over-deduction**: If deductions exceed the bill, system displays zero balance with clear confirmation that no further agency visits are required.
- **Offline / Disconnected**: Calculations run entirely in client JavaScript with zero network requests.

### Accessibility and device notes

- Multi-step wizard supports keyboard tab order and screen reader announcements.
- All touch targets strictly $\ge 44 \times 44\text{px}$.
- No text under 12px.

---

## Flow: Pisonet Data Wipe

### Preconditions

- User has entered sensitive patient data on a public internet cafe or hospital computer.

### Steps and system response

1. **User**: Clicks the red "Pisonet / Wipe Data" button in the navigation header.
2. **System**: Displays confirmation modal explaining that all local records, uploads, and drafts will be deleted.
3. **User**: Confirms deletion.
4. **System**: Executes `clearAllUserData()`, purges `IndexedDB` and `localStorage`, resets all form state, and displays a clean session alert.

### Alternate and failure paths

- **User cancels**: Modal closes with no changes to stored draft data.

---

## Open questions

- None at present.
