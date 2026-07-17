begin;

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  notification_key uuid not null default gen_random_uuid() unique,
  source text not null default 'contact_page'
    check (source = 'contact_page'),
  name text not null
    check (char_length(name) between 1 and 120),
  email text not null
    check (char_length(email) between 3 and 320),
  phone text not null
    check (char_length(phone) between 1 and 60),
  interest text not null
    check (char_length(interest) between 1 and 100),
  message text not null
    check (char_length(message) between 1 and 5000),
  source_path text not null default '/contact'
    check (char_length(source_path) between 1 and 500 and source_path ~ '^/'),
  notification_status text not null default 'pending'
    check (notification_status in (
      'pending',
      'sending',
      'sent',
      'retryable',
      'manual_review'
    )),
  claim_token uuid,
  lease_expires_at timestamptz,
  notification_attempt_count integer not null default 0
    check (notification_attempt_count >= 0),
  first_notification_attempt_at timestamptz,
  last_notification_attempt_at timestamptz,
  next_notification_attempt_at timestamptz not null default clock_timestamp(),
  provider_message_id text
    check (provider_message_id is null or char_length(provider_message_id) <= 500),
  provider_code text
    check (provider_code is null or char_length(provider_code) <= 120),
  sent_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '12 months'),
  constraint contact_inquiries_expiry_check check (expires_at > created_at),
  constraint contact_inquiries_claim_check check (
    (
      notification_status = 'sending'
      and claim_token is not null
      and lease_expires_at is not null
    )
    or (
      notification_status <> 'sending'
      and claim_token is null
      and lease_expires_at is null
    )
  )
);

create index contact_inquiries_notification_queue_idx
on private.contact_inquiries (
  next_notification_attempt_at,
  lease_expires_at,
  created_at
)
where notification_status in ('pending', 'sending', 'retryable');

create index contact_inquiries_expiry_idx
on private.contact_inquiries (expires_at);

create unique index contact_inquiries_provider_message_idx
on private.contact_inquiries (provider_message_id)
where provider_message_id is not null;

create table private.contact_rate_limit_events (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  scope text not null
    check (scope in ('client', 'email')),
  identifier_hash text not null
    check (
      char_length(identifier_hash) = 64
      and identifier_hash ~ '^[0-9a-f]{64}$'
    ),
  created_at timestamptz not null default clock_timestamp(),
  constraint contact_rate_limit_events_request_scope_key
    unique (request_id, scope)
);

create index contact_rate_limit_events_lookup_idx
on private.contact_rate_limit_events (scope, identifier_hash, created_at);

create index contact_rate_limit_events_expiry_idx
on private.contact_rate_limit_events (created_at);

create table private.newsletter_signup_requests (
  email_hash text primary key
    check (
      char_length(email_hash) = 64
      and email_hash ~ '^[0-9a-f]{64}$'
    ),
  source text not null
    check (source = 'newsletter_page'),
  consent_version text not null default 'newsletter_page_v1'
    check (consent_version = 'newsletter_page_v1'),
  provider text not null default 'brevo'
    check (provider = 'brevo'),
  provider_status text not null default 'request_received'
    check (provider_status in (
      'request_received',
      'confirmation_requested',
      'already_registered',
      'provider_error'
    )),
  last_provider_code text
    check (last_provider_code is null or char_length(last_provider_code) <= 100),
  first_consented_at timestamptz not null default clock_timestamp(),
  last_consented_at timestamptz not null default clock_timestamp(),
  last_requested_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 1
    check (request_count > 0),
  last_attempt_id uuid not null,
  last_provider_attempt_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '12 months')
);

create index newsletter_signup_requests_expiry_idx
on private.newsletter_signup_requests (expires_at);

revoke all on all tables in schema private
from public, anon, authenticated, service_role;

revoke all on all sequences in schema private
from public, anon, authenticated, service_role;

comment on table private.contact_inquiries is
'Private contact-form inquiries retained for 12 months with a recoverable Brevo notification outbox.';

comment on table private.contact_rate_limit_events is
'Short-lived HMAC-only contact-form rate-limit events. Raw client IP addresses are never stored.';

comment on table private.newsletter_signup_requests is
'Private, email-HMAC-only audit and cooldown ledger for Brevo double-opt-in requests.';

create or replace function public.begin_contact_inquiry(
  p_request_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_interest text,
  p_message text,
  p_source_path text,
  p_email_hash text,
  p_client_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing private.contact_inquiries%rowtype;
  v_inquiry private.contact_inquiries%rowtype;
  v_now timestamptz := clock_timestamp();
  v_client_lock bigint;
  v_email_lock bigint;
  v_client_fifteen_minutes bigint;
  v_client_day bigint;
  v_email_fifteen_minutes bigint;
  v_email_day bigint;
begin
  if p_request_id is null then
    raise exception using errcode = '22023', message = 'A request ID is required.';
  end if;
  if p_name is null or char_length(p_name) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'A valid name is required.';
  end if;
  if p_email is null or char_length(p_email) not between 3 and 320 then
    raise exception using errcode = '22023', message = 'A valid email is required.';
  end if;
  if p_phone is null or char_length(p_phone) not between 1 and 60 then
    raise exception using errcode = '22023', message = 'A valid phone number is required.';
  end if;
  if p_interest is null or char_length(p_interest) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'A valid interest is required.';
  end if;
  if p_message is null or char_length(p_message) not between 1 and 5000 then
    raise exception using errcode = '22023', message = 'A valid message is required.';
  end if;
  if p_source_path is null
    or char_length(p_source_path) not between 1 and 500
    or p_source_path !~ '^/'
  then
    raise exception using errcode = '22023', message = 'A valid source path is required.';
  end if;
  if p_email_hash is null
    or char_length(p_email_hash) <> 64
    or p_email_hash !~ '^[0-9a-f]{64}$'
    or p_client_hash is null
    or char_length(p_client_hash) <> 64
    or p_client_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = '22023', message = 'Valid rate-limit hashes are required.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('contact-request:' || p_request_id::text, 0)
  );

  select *
  into v_existing
  from private.contact_inquiries
  where request_id = p_request_id;

  if found then
    return jsonb_build_object(
      'accepted', true,
      'created', false,
      'inquiryId', v_existing.id,
      'notificationStatus', v_existing.notification_status
    );
  end if;

  v_client_lock := hashtextextended('contact-client:' || p_client_hash, 0);
  v_email_lock := hashtextextended('contact-email:' || p_email_hash, 0);

  perform pg_advisory_xact_lock(least(v_client_lock, v_email_lock));
  if v_client_lock <> v_email_lock then
    perform pg_advisory_xact_lock(greatest(v_client_lock, v_email_lock));
  end if;

  select
    count(*) filter (where created_at > v_now - interval '15 minutes'),
    count(*)
  into v_client_fifteen_minutes, v_client_day
  from private.contact_rate_limit_events
  where scope = 'client'
    and identifier_hash = p_client_hash
    and created_at > v_now - interval '1 day';

  select
    count(*) filter (where created_at > v_now - interval '15 minutes'),
    count(*)
  into v_email_fifteen_minutes, v_email_day
  from private.contact_rate_limit_events
  where scope = 'email'
    and identifier_hash = p_email_hash
    and created_at > v_now - interval '1 day';

  if v_client_fifteen_minutes >= 10
    or v_client_day >= 50
    or v_email_fifteen_minutes >= 3
    or v_email_day >= 10
  then
    return jsonb_build_object('accepted', false, 'reason', 'rate_limited');
  end if;

  insert into private.contact_inquiries (
    request_id,
    name,
    email,
    phone,
    interest,
    message,
    source_path
  )
  values (
    p_request_id,
    p_name,
    p_email,
    p_phone,
    p_interest,
    p_message,
    p_source_path
  )
  returning * into v_inquiry;

  insert into private.contact_rate_limit_events (
    request_id,
    scope,
    identifier_hash,
    created_at
  )
  values
    (p_request_id, 'client', p_client_hash, v_now),
    (p_request_id, 'email', p_email_hash, v_now);

  return jsonb_build_object(
    'accepted', true,
    'created', true,
    'inquiryId', v_inquiry.id,
    'notificationStatus', v_inquiry.notification_status
  );
end;
$$;

revoke all on function public.begin_contact_inquiry(
  uuid, text, text, text, text, text, text, text, text
) from public, anon, authenticated;

grant execute on function public.begin_contact_inquiry(
  uuid, text, text, text, text, text, text, text, text
) to service_role;

create or replace function public.claim_contact_notification(
  p_claim_token uuid,
  p_inquiry_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inquiry private.contact_inquiries%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_claim_token is null then
    raise exception using errcode = '22023', message = 'A claim token is required.';
  end if;

  select *
  into v_inquiry
  from private.contact_inquiries
  where (p_inquiry_id is null or id = p_inquiry_id)
    and expires_at > v_now
    and (
      (
        notification_status in ('pending', 'retryable')
        and next_notification_attempt_at <= v_now
      )
      or (
        notification_status = 'sending'
        and lease_expires_at <= v_now
      )
    )
  order by created_at, id
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update private.contact_inquiries
  set notification_status = 'sending',
      claim_token = p_claim_token,
      lease_expires_at = v_now + interval '2 minutes',
      notification_attempt_count = notification_attempt_count + 1,
      first_notification_attempt_at = coalesce(first_notification_attempt_at, v_now),
      last_notification_attempt_at = v_now,
      next_notification_attempt_at = v_now
  where id = v_inquiry.id
  returning * into v_inquiry;

  return jsonb_build_object(
    'inquiryId', v_inquiry.id,
    'notificationKey', v_inquiry.notification_key,
    'name', v_inquiry.name,
    'email', v_inquiry.email,
    'phone', v_inquiry.phone,
    'interest', v_inquiry.interest,
    'message', v_inquiry.message,
    'sourcePath', v_inquiry.source_path,
    'createdAt', v_inquiry.created_at,
    'firstAttemptAt', v_inquiry.first_notification_attempt_at,
    'attemptCount', v_inquiry.notification_attempt_count
  );
end;
$$;

revoke all on function public.claim_contact_notification(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.claim_contact_notification(uuid, uuid)
to service_role;

create or replace function public.complete_contact_notification(
  p_inquiry_id uuid,
  p_claim_token uuid,
  p_provider_message_id text,
  p_provider_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_inquiry_id is null or p_claim_token is null then
    raise exception using errcode = '22023', message = 'Inquiry and claim IDs are required.';
  end if;
  if p_provider_message_id is not null and char_length(p_provider_message_id) > 500 then
    raise exception using errcode = '22023', message = 'The provider message ID is too long.';
  end if;
  if p_provider_code is not null and char_length(p_provider_code) > 120 then
    raise exception using errcode = '22023', message = 'The provider code is too long.';
  end if;

  update private.contact_inquiries
  set notification_status = 'sent',
      claim_token = null,
      lease_expires_at = null,
      next_notification_attempt_at = clock_timestamp(),
      provider_message_id = p_provider_message_id,
      provider_code = p_provider_code,
      sent_at = clock_timestamp()
  where id = p_inquiry_id
    and notification_status = 'sending'
    and claim_token = p_claim_token
  returning id into v_id;

  return v_id is not null;
end;
$$;

revoke all on function public.complete_contact_notification(
  uuid, uuid, text, text
) from public, anon, authenticated;

grant execute on function public.complete_contact_notification(
  uuid, uuid, text, text
) to service_role;

create or replace function public.defer_contact_notification(
  p_inquiry_id uuid,
  p_claim_token uuid,
  p_status text,
  p_provider_code text,
  p_retry_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_inquiry_id is null or p_claim_token is null then
    raise exception using errcode = '22023', message = 'Inquiry and claim IDs are required.';
  end if;
  if p_status is null or p_status not in ('retryable', 'manual_review') then
    raise exception using errcode = '22023', message = 'Invalid notification deferral status.';
  end if;
  if p_provider_code is not null and char_length(p_provider_code) > 120 then
    raise exception using errcode = '22023', message = 'The provider code is too long.';
  end if;
  if p_retry_seconds is null or p_retry_seconds not between 30 and 3600 then
    raise exception using errcode = '22023', message = 'Invalid notification retry delay.';
  end if;

  update private.contact_inquiries
  set notification_status = p_status,
      claim_token = null,
      lease_expires_at = null,
      next_notification_attempt_at = case
        when p_status = 'retryable'
          then clock_timestamp() + make_interval(secs => p_retry_seconds)
        else clock_timestamp()
      end,
      provider_code = p_provider_code
  where id = p_inquiry_id
    and notification_status = 'sending'
    and claim_token = p_claim_token
  returning id into v_id;

  return v_id is not null;
end;
$$;

revoke all on function public.defer_contact_notification(
  uuid, uuid, text, text, integer
) from public, anon, authenticated;

grant execute on function public.defer_contact_notification(
  uuid, uuid, text, text, integer
) to service_role;

create or replace function public.begin_newsletter_signup_request(
  p_email_hash text,
  p_source text,
  p_attempt_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed_email_hash text;
  v_now timestamptz := clock_timestamp();
begin
  if p_email_hash is null
    or char_length(p_email_hash) <> 64
    or p_email_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = '22023', message = 'A valid email hash is required.';
  end if;
  if p_source is distinct from 'newsletter_page' or p_attempt_id is null then
    raise exception using errcode = '22023', message = 'A valid newsletter request is required.';
  end if;

  insert into private.newsletter_signup_requests (
    email_hash,
    source,
    provider_status,
    first_consented_at,
    last_consented_at,
    last_requested_at,
    request_count,
    last_attempt_id,
    updated_at,
    expires_at
  )
  values (
    p_email_hash,
    p_source,
    'request_received',
    v_now,
    v_now,
    v_now,
    1,
    p_attempt_id,
    v_now,
    v_now + interval '12 months'
  )
  on conflict (email_hash) do update
  set source = excluded.source,
      provider_status = 'request_received',
      last_provider_code = null,
      last_consented_at = v_now,
      last_requested_at = v_now,
      request_count = private.newsletter_signup_requests.request_count + 1,
      last_attempt_id = p_attempt_id,
      updated_at = v_now,
      expires_at = v_now + interval '12 months'
  where private.newsletter_signup_requests.provider_status = 'provider_error'
     or (
       private.newsletter_signup_requests.provider_status = 'request_received'
       and private.newsletter_signup_requests.last_requested_at <= v_now - interval '2 minutes'
     )
     or (
       private.newsletter_signup_requests.provider_status in (
         'confirmation_requested',
         'already_registered'
       )
       and private.newsletter_signup_requests.last_requested_at <= v_now - interval '10 minutes'
     )
  returning email_hash into v_claimed_email_hash;

  return v_claimed_email_hash is not null;
end;
$$;

revoke all on function public.begin_newsletter_signup_request(text, text, uuid)
from public, anon, authenticated;

grant execute on function public.begin_newsletter_signup_request(text, text, uuid)
to service_role;

create or replace function public.complete_newsletter_signup_request(
  p_email_hash text,
  p_attempt_id uuid,
  p_provider_status text,
  p_provider_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email_hash text;
begin
  if p_provider_status not in (
    'confirmation_requested',
    'already_registered',
    'provider_error'
  ) then
    raise exception using errcode = '22023', message = 'Invalid provider status.';
  end if;
  if p_provider_code is not null and char_length(p_provider_code) > 100 then
    raise exception using errcode = '22023', message = 'The provider code is too long.';
  end if;

  update private.newsletter_signup_requests
  set provider_status = p_provider_status,
      last_provider_code = p_provider_code,
      last_provider_attempt_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where email_hash = p_email_hash
    and last_attempt_id = p_attempt_id
  returning email_hash into v_email_hash;

  return v_email_hash is not null;
end;
$$;

revoke all on function public.complete_newsletter_signup_request(
  text, uuid, text, text
) from public, anon, authenticated;

grant execute on function public.complete_newsletter_signup_request(
  text, uuid, text, text
) to service_role;

create or replace function private.purge_expired_form_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inquiries integer;
  v_rate_events integer;
  v_newsletter_requests integer;
begin
  delete from private.contact_rate_limit_events
  where created_at <= clock_timestamp() - interval '48 hours';
  get diagnostics v_rate_events = row_count;

  delete from private.contact_inquiries
  where expires_at <= clock_timestamp();
  get diagnostics v_inquiries = row_count;

  delete from private.newsletter_signup_requests
  where expires_at <= clock_timestamp();
  get diagnostics v_newsletter_requests = row_count;

  return jsonb_build_object(
    'inquiriesDeleted', v_inquiries,
    'rateEventsDeleted', v_rate_events,
    'newsletterRequestsDeleted', v_newsletter_requests
  );
end;
$$;

revoke all on function private.purge_expired_form_data()
from public, anon, authenticated, service_role;

commit;
