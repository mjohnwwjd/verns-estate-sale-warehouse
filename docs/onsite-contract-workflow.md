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

This remains on-device storage. Employees should use `Export data` for backup. Shared access across multiple iPads and server-managed recovery require the later authenticated backend.

Opening a saved record provides three actions:

1. Training video setup. If `settings.customerTrainingVideoUrl` is present in imported site data, the action opens that approved URL. Otherwise it reports that configuration is still needed.
2. Calendar handoff. The site downloads an `.ics` file containing the meeting details. An employee can open the file in Google Calendar or another calendar. The site does not access a Google account or use OAuth.
3. On-site contract preparation. Client name, phone, sale-site address, check/report address, and optional Special Notes or Agreements are filled from the selected customer record. Employees can update the shared notes and mailing-address choice, then confirm the values to enable the large `View Onsite Contract` action.

The existing on-site contract PDF remains the source of truth. A byte-for-byte copy is stored at `assets/docs/onsite-contract.pdf`. The browser review screen at `onsite-contract-viewer.html` displays high-resolution renders of both unchanged pages and fills only the existing blanks:

- `Client`
- `Phone`
- `Sale Site Address`
- `Other special notes or agreements`
- `Address to send check & report`

The review is read-only. Signature-service placeholders appear directly on the existing customer and representative signature lines at the end of page 2. They honestly state that signing activates after secure signature integration. No separate working signature capture is claimed.

Sale-site street, city, state, and ZIP are required; Address Line 2 is optional. The workflow stores these as structured fields and also maintains one formatted address for the calendar and the contract blank. Existing local records with a legacy single-line address are parsed into the structured fields when possible. If a required component cannot be recovered, Contract Prep clearly requires an employee to edit the record before review.

## Customer-code rule

A potential customer has no customer code. After staff checks the signed-contract confirmation and records the contract as signed, the site assigns the next unused sequential four-digit code:

```text
0001
0002
0003
```

The assignment is local to the browser's saved data. Do not use it as a multi-device production sequence until records and the sequence are moved to one authenticated backend database.

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
- signed-PDF delivery choice
- requested signature, PDF, delivery, and Lightspeed actions

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

These are configuration boundaries only. No external account, credential, or provider call is included in phase 1.

## Privacy and backup limits

The current employee passcode is a convenience gate, not secure authentication. Potential-customer records contain private contact information and currently live only in that browser's local storage and JSON exports.

Before production use across devices, add authenticated server storage, access logs, retention rules, encrypted backups, and a documented process for correcting or deleting customer data.
