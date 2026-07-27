# On-site Contract Workflow - Phase 1

## What works now

The employee-only `Potential Customers` tab saves these pre-visit fields in a dedicated IndexedDB browser database:

- first and last name
- phone and optional email
- sale-site street, optional Address Line 2, city, state, and ZIP
- meeting date and time
- employee notes
- optional `Special Notes or Agreements`, shared with contract section 12
- check/report address choice: use the sale-site address or enter a different mailing address

After saving, the intake form shows a prominent confirmation and highlights the newly filed record. The saved-customer area supports search by name, phone, email, address, meeting date, notes, or customer code; it also filters potential versus signed customers and sorts by meeting date, recently saved, name, or customer code. Existing potential customers from the older local-storage format are migrated automatically.

Migration checks the historical `vernsWebsiteStateV1` local-storage record, the dedicated recovery backup, and the IndexedDB customer store. Copies are merged by record ID and customer fingerprint so a recovered legacy record is preserved without duplicate list entries. The saved-customer area displays a recovery status instead of reporting zero while that asynchronous check is still running.

With the default blank Supabase configuration, this remains on-device storage and the UI labels it **Local Preview mode**. `localhost`, `127.0.0.1`, and `estatesbyvern.com` are separate browser origins and cannot read each other's records. Use `Export customer backup` on the source screen and `Import customer backup` on the destination screen to merge records without deleting either copy.

After the user-owned Supabase project, schema, employee authentication, and public browser configuration are ready, the same screen switches to **Connected Shared Workspace mode**. It then loads and saves Potential Customers through authenticated, row-level-security-protected database requests. Historical browser records remain local until an authorized employee explicitly confirms **Review and upload local records**; no background migration occurs. See `docs/supabase-employee-workspace.md` for setup and verification.

Opening a saved record provides three actions:

1. Training video setup. If `settings.customerTrainingVideoUrl` is present in imported site data, the action opens that approved URL. Otherwise it reports that configuration is still needed.
2. Google Calendar review. **Open Vern's calendar** opens the calendar grid so an employee can check availability. **Review & add meeting** opens a prefilled Google Calendar event when secure sync is not configured. After Vern authorizes the documented server-side connection, saving a customer checks free/busy and creates or updates that customer's same calendar event automatically.
3. On-site contract preparation. Client name, phone, sale-site address, required sale start/end dates, check/report address, and optional Special Notes or Agreements are filled from the selected customer record. Employees can update the shared dates, notes, and mailing-address choice, then confirm the values to enable the large `View Onsite Contract` action.

The existing on-site contract PDF remains the source of truth. A byte-for-byte copy is stored at `assets/docs/onsite-contract.pdf`. The browser review screen at `onsite-contract-viewer.html` displays high-resolution renders of both unchanged pages and fills only the existing blanks:

- `Client`
- `Phone`
- `Sale Site Address`
- scheduled sale dates in the existing Section 10 blank
- `Other special notes or agreements`
- `Address to send check & report`

The review is read-only. Signature-service placeholders appear directly on the existing customer and representative signature lines at the end of page 2. They honestly state that signing activates after secure signature integration. No separate working signature capture is claimed.

Each printed signature date blank has a matching provider-ready field. After secure integration, the backend must save the signature provider's verified `customerSignedAt` and `representativeSignedAt` timestamps. The viewer formats those values as `MM/DD/YYYY` in the America/Detroit business timezone and never invents a signing date from the iPad clock. Until verified timestamps exist, the date blanks clearly state that the date is added after verified signature.

Sale-site street, city, state, and ZIP are required; Address Line 2 is optional. The workflow stores these as structured fields and also maintains one formatted address for the calendar and the contract blank. Existing local records with a legacy single-line address are parsed into the structured fields when possible. If a required component cannot be recovered, Contract Prep clearly requires an employee to edit the record before review.

## Customer-code rule

A potential customer has no customer code. After staff checks the signed-contract confirmation and records the contract as signed, the site assigns the next unused sequential four-digit code:

```text
0001
0002
0003
```

In Local Preview mode, the assignment is local to the browser's saved data and must not be treated as a multi-device production sequence. In Connected Shared Workspace mode, only a manager can mark a contract signed, and the database function assigns the next code atomically.

## Provider integration boundary

`prepareOnsiteContractIntegration(record)` in `assets/js/app.js` is the contract-provider handoff. It returns a provider-neutral payload with:

- workflow type
- internal potential-customer record ID
- customer contact and sale-site details
- the exact mapped contract fields
- structured sale-site street, Address Line 2, city, state, ZIP, and formatted address
- the selected check/report address mode, structured mailing fields, and formatted address
- the shared Special Notes or Agreements value
- meeting details and notes
- scheduled sale start/end dates and their Section 10 display value
- signed-PDF delivery choice
- requested signature, PDF, delivery, and Lightspeed actions
- signature-date mappings for the customer's and authorized representative's provider-verified timestamps

When providers are approved, send this payload to an authenticated backend. Do not put API keys or OAuth tokens in `app.js`, imported JSON, local storage, or the public GitHub repository.

The backend should:

1. authenticate the employee with real server-side access control;
2. create a contract from the unchanged approved contract template;
3. return a secure signing session or embedded signing URL;
4. receive and verify the provider's signed webhook;
5. generate or retrieve the signed PDF;
6. deliver the PDF by the customer's selected email or text method;
7. create the Lightspeed customer through an approved API connection;
8. atomically assign the next customer code only after the signature is verified.

Suggested server-side configuration names:

```text
CONTRACT_PROVIDER_API_KEY
CONTRACT_TEMPLATE_ID_ONSITE
CONTRACT_WEBHOOK_SECRET
EMAIL_PROVIDER_API_KEY
SMS_PROVIDER_API_KEY
LIGHTSPEED_CLIENT_ID
LIGHTSPEED_CLIENT_SECRET
GOOGLE_CALENDAR_ID
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
```

These are configuration boundaries only. No secret or token belongs in the public site. See `docs/google-calendar-integration.md` for the Google authorization and endpoint contract.

## Privacy and backup limits

The existing employee passcode is a convenience gate, not the database credential. Local Preview records contain private contact information and live only in that browser's IndexedDB/local recovery storage and JSON exports. Connected Shared Workspace mode separately requires Supabase employee authentication and enforces database access with row-level security.

Before production use across devices, complete and verify the Supabase setup, then define retention, backup, audit-review, employee offboarding, and customer correction/deletion procedures.
