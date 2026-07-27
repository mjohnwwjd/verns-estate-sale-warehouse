# Supabase Employee Workspace Setup

This integration is opt-in. With blank configuration, Vern's Potential Customers workflow stays in **Local Preview mode** and makes no Supabase request. With a valid project URL and public anon/publishable key, employees must also authenticate before the site reads or writes shared customer records.

## User-owned setup

1. Create the Supabase project in Vern's account. Do not share the database password or `service_role` key with the website.
2. In Supabase SQL Editor, run:
   `supabase/migrations/202607270001_employee_potential_customers.sql`
3. In Authentication settings, disable open public sign-up. Create employee Auth users manually or through an approved invitation process.
4. Create the first manager profile from SQL Editor after that Auth user exists:

   ```sql
   insert into public.employee_profiles (user_id, display_name, role, active)
   values ('AUTH-USER-UUID-HERE', 'APPROVED DISPLAY NAME', 'manager', true);
   ```

   Do not paste a password into this table. Additional profiles can be created by a manager after their authenticated workflow is implemented, or by repeating the SQL with the correct Auth user UUID.
5. Copy only these public browser values from the Supabase project:

   - Project URL
   - anon key or publishable key

6. Put those public values in `assets/js/supabase-config.js`:

   ```js
   window.VERNS_SUPABASE_CONFIG = Object.freeze({
     url: "https://PROJECT-REF.supabase.co",
     anonKey: "PUBLIC-ANON-OR-PUBLISHABLE-KEY",
     customerTable: "potential_customers"
   });
   ```

   Never put a `service_role` key, JWT signing secret, database password, employee password, SMS credential, or email-provider credential in a browser file.

## Security model

- The `anon` database role receives no customer or employee-profile table privileges.
- Shared customer policies apply only to Supabase's `authenticated` role.
- An authenticated user must also have an active row in `employee_profiles`.
- Active employees can read, create, and update shared Potential Customers.
- Only active managers can delete records, mark a contract signed, or assign the sequential four-digit customer code.
- `record_potential_customer_signed` uses a transaction-level advisory lock so two managers cannot receive the same next code.
- Audit triggers set `created_by`, `updated_by`, and timestamps from the authenticated request.
- The client uses the public key plus the employee's Supabase session; authorization remains enforced in PostgreSQL RLS.

The existing website passcode controls access to the employee screen, but it is not the database credential. Supabase Auth and RLS are the authority for shared customer data.

## One-time local migration

Local records are never uploaded automatically.

1. Open Potential Customers in the browser that contains the historical records.
2. Export a customer backup first.
3. Configure Supabase and sign in as an approved employee.
4. Confirm the displayed local-record count.
5. Select **Review and upload local records** and approve the confirmation.
6. The upload uses `local_record_id` as an idempotency key. Repeating it updates matching records instead of creating duplicates.
7. The local recovery copy is retained.

`localhost`, `127.0.0.1`, and `estatesbyvern.com` are separate origins. If the records are on another origin or device, use **Export customer backup** there, then **Import customer backup** in the connected workspace. Imported records remain staged locally until the authorized employee explicitly uploads them.

## Required verification before production use

- Confirm an unauthenticated browser cannot select or mutate either table.
- Confirm an authenticated user without an active profile cannot read customers.
- Confirm an active employee can read/create/update but cannot assign a customer code.
- Confirm a manager can call `record_potential_customer_signed` and receives `0001`, then `0002`.
- Confirm signing the same record again returns its existing code.
- Confirm employee deactivation immediately blocks subsequent data requests after token refresh/sign-in.
- Test backup export and import before migrating the only copy of historical records.

The SQL and UI do not create projects, users, providers, or credentials.
