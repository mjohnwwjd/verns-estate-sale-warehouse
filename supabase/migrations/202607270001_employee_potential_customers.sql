begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;

create table if not exists public.employee_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 100),
  role text not null default 'employee' check (role in ('employee', 'manager')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employee_profiles enable row level security;

create or replace function private.is_active_employee()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employee_profiles
    where user_id = (select auth.uid())
      and active = true
  );
$$;

create or replace function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employee_profiles
    where user_id = (select auth.uid())
      and active = true
      and role = 'manager'
  );
$$;

revoke all on function private.is_active_employee() from public, anon;
revoke all on function private.is_manager() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_active_employee() to authenticated;
grant execute on function private.is_manager() to authenticated;

drop policy if exists "employee profiles self or manager read" on public.employee_profiles;
create policy "employee profiles self or manager read"
on public.employee_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_manager())
);

drop policy if exists "managers create employee profiles" on public.employee_profiles;
create policy "managers create employee profiles"
on public.employee_profiles
for insert
to authenticated
with check ((select private.is_manager()));

drop policy if exists "managers update employee profiles" on public.employee_profiles;
create policy "managers update employee profiles"
on public.employee_profiles
for update
to authenticated
using ((select private.is_manager()))
with check ((select private.is_manager()));

revoke all on public.employee_profiles from anon;
revoke all on public.employee_profiles from authenticated;
grant select, insert, update on public.employee_profiles to authenticated;

create table if not exists public.potential_customers (
  id uuid primary key default gen_random_uuid(),
  local_record_id text not null unique check (char_length(local_record_id) between 1 and 160),
  first_name text not null check (char_length(trim(first_name)) between 1 and 100),
  last_name text not null check (char_length(trim(last_name)) between 1 and 100),
  phone text not null check (char_length(trim(phone)) between 7 and 40),
  email text,
  sale_site_street text not null check (char_length(trim(sale_site_street)) between 1 and 200),
  sale_site_line_2 text,
  sale_site_city text not null check (char_length(trim(sale_site_city)) between 1 and 100),
  sale_site_state text not null check (sale_site_state ~ '^[A-Z]{2}$'),
  sale_site_zip text not null check (sale_site_zip ~ '^[0-9]{5}(-[0-9]{4})?$'),
  meeting_date date,
  meeting_time time,
  sale_start_date date,
  sale_end_date date,
  notes text,
  special_notes_agreements text,
  check_address_mode text not null default 'same' check (check_address_mode in ('same', 'different')),
  mailing_street text,
  mailing_line_2 text,
  mailing_city text,
  mailing_state text check (mailing_state is null or mailing_state ~ '^[A-Z]{2}$'),
  mailing_zip text check (mailing_zip is null or mailing_zip ~ '^[0-9]{5}(-[0-9]{4})?$'),
  status text not null default 'potential' check (status in ('potential', 'signed', 'archived')),
  customer_code text unique check (customer_code is null or customer_code ~ '^[0-9]{4}$'),
  contract_delivery text check (contract_delivery is null or contract_delivery in ('email', 'text')),
  customer_signed_at timestamptz,
  representative_signed_at timestamptz,
  contract_signed_at timestamptz,
  google_calendar_meeting_event_id text,
  google_calendar_sale_event_id text,
  source_employee_name text,
  local_created_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mailing_address_complete check (
    check_address_mode = 'same'
    or (
      nullif(trim(mailing_street), '') is not null
      and nullif(trim(mailing_city), '') is not null
      and mailing_state is not null
      and mailing_zip is not null
    )
  ),
  constraint code_only_after_signature check (
    customer_code is null
    or (status = 'signed' and contract_signed_at is not null)
  ),
  constraint scheduled_sale_dates_valid check (
    (sale_start_date is null and sale_end_date is null)
    or (
      sale_start_date is not null
      and sale_end_date is not null
      and sale_end_date >= sale_start_date
    )
  )
);

create index if not exists potential_customers_meeting_idx
  on public.potential_customers (meeting_date desc, meeting_time desc);
create index if not exists potential_customers_status_idx
  on public.potential_customers (status);
create index if not exists potential_customers_updated_idx
  on public.potential_customers (updated_at desc);
create index if not exists potential_customers_created_by_idx
  on public.potential_customers (created_by);

create or replace function private.set_potential_customer_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
    new.created_at := coalesce(new.created_at, now());
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.protect_potential_customer_code()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if (
    tg_op = 'INSERT'
    and (
      new.customer_code is not null
      or new.customer_signed_at is not null
      or new.representative_signed_at is not null
      or new.contract_signed_at is not null
      or new.status = 'signed'
    )
  ) or (
    tg_op = 'UPDATE'
    and (
      new.customer_code is distinct from old.customer_code
      or new.customer_signed_at is distinct from old.customer_signed_at
      or new.representative_signed_at is distinct from old.representative_signed_at
      or new.contract_signed_at is distinct from old.contract_signed_at
      or (new.status = 'signed' and old.status is distinct from 'signed')
    )
  ) then
    if not private.is_manager() then
      raise exception 'Only an active manager may assign customer codes or signed timestamps';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists potential_customers_audit on public.potential_customers;
create trigger potential_customers_audit
before insert or update on public.potential_customers
for each row execute function private.set_potential_customer_audit_fields();

drop trigger if exists potential_customers_protect_code on public.potential_customers;
create trigger potential_customers_protect_code
before insert or update on public.potential_customers
for each row execute function private.protect_potential_customer_code();

alter table public.potential_customers enable row level security;

drop policy if exists "active employees read shared potential customers" on public.potential_customers;
create policy "active employees read shared potential customers"
on public.potential_customers
for select
to authenticated
using ((select private.is_active_employee()));

drop policy if exists "active employees create shared potential customers" on public.potential_customers;
create policy "active employees create shared potential customers"
on public.potential_customers
for insert
to authenticated
with check (
  (select private.is_active_employee())
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

drop policy if exists "active employees update shared potential customers" on public.potential_customers;
create policy "active employees update shared potential customers"
on public.potential_customers
for update
to authenticated
using ((select private.is_active_employee()))
with check ((select private.is_active_employee()));

drop policy if exists "managers delete shared potential customers" on public.potential_customers;
create policy "managers delete shared potential customers"
on public.potential_customers
for delete
to authenticated
using ((select private.is_manager()));

revoke all on public.potential_customers from anon;
revoke all on public.potential_customers from authenticated;
grant select, insert, update, delete on public.potential_customers to authenticated;

create or replace function public.record_potential_customer_signed(
  target_local_record_id text,
  signed_at_value timestamptz default now()
)
returns setof public.potential_customers
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  next_code integer;
  target_id uuid;
begin
  if not private.is_manager() then
    raise exception 'Only an active manager may record a signed contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('verns-potential-customer-code'));

  select id into target_id
  from public.potential_customers
  where local_record_id = target_local_record_id;

  if target_id is null then
    raise exception 'Potential customer record was not found';
  end if;

  if exists (
    select 1 from public.potential_customers
    where id = target_id and customer_code is not null
  ) then
    return query select * from public.potential_customers where id = target_id;
    return;
  end if;

  select coalesce(max(customer_code::integer), 0) + 1
  into next_code
  from public.potential_customers
  where customer_code ~ '^[0-9]{4}$';

  if next_code > 9999 then
    raise exception 'The four-digit customer code range is full';
  end if;

  return query
  update public.potential_customers
  set status = 'signed',
      customer_code = lpad(next_code::text, 4, '0'),
      contract_signed_at = signed_at_value
  where id = target_id
  returning *;
end;
$$;

revoke all on function public.record_potential_customer_signed(text, timestamptz) from public, anon;
grant execute on function public.record_potential_customer_signed(text, timestamptz) to authenticated;

comment on table public.employee_profiles is
  'Approved Vern employee identities and roles. Create users in Supabase Auth first; do not store passwords here.';
comment on table public.potential_customers is
  'Shared employee-only Potential Customer and on-site contract workflow records.';
comment on column public.potential_customers.local_record_id is
  'Stable browser workflow ID used for idempotent one-time local migration and cross-device upserts.';

commit;
