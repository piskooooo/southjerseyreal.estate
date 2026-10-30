begin;
set local statement_timeout = '20s';
set local lock_timeout = '3s';

-- Historical rows remain unknown; do not infer their website from a path.
alter table private.contact_inquiries add column source_origin text
  check (source_origin is null or (char_length(source_origin) <= 255 and source_origin ~ '^https?://[^/[:space:]]+$'));

-- Reuse the existing request lock, rate limits and deduplication transaction.
create function public.begin_contact_inquiry_from_site(
  p_request_id uuid, p_name text, p_email text, p_phone text,
  p_interest text, p_message text, p_source_path text,
  p_email_hash text, p_client_hash text, p_source_origin text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_source_origin is null or char_length(p_source_origin) > 255
    or p_source_origin !~ '^https?://[^/[:space:]]+$' then
    raise exception using errcode = '22023', message = 'A valid source origin is required.';
  end if;
  result := public.begin_contact_inquiry(p_request_id, p_name, p_email, p_phone,
    p_interest, p_message, p_source_path, p_email_hash, p_client_hash);
  if result->>'accepted' = 'true' and result->>'created' = 'true' then
    update private.contact_inquiries set source_origin = p_source_origin
    where id = (result->>'inquiryId')::uuid and request_id = p_request_id;
  end if;
  return result;
end;
$$;
revoke all on function public.begin_contact_inquiry_from_site(uuid,text,text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.begin_contact_inquiry_from_site(uuid,text,text,text,text,text,text,text,text,text) to service_role;

create or replace function public.claim_contact_notification(
  p_claim_token uuid, p_inquiry_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_inquiry private.contact_inquiries%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_claim_token is null then
    raise exception using errcode = '22023', message = 'A claim token is required.';
  end if;
  select * into v_inquiry from private.contact_inquiries
  where (p_inquiry_id is null or id = p_inquiry_id) and expires_at > v_now
    and ((notification_status in ('pending', 'retryable') and next_notification_attempt_at <= v_now)
      or (notification_status = 'sending' and lease_expires_at <= v_now))
  order by created_at, id for update skip locked limit 1;
  if not found then return null; end if;
  update private.contact_inquiries
  set notification_status = 'sending', claim_token = p_claim_token,
      lease_expires_at = v_now + interval '2 minutes',
      notification_attempt_count = notification_attempt_count + 1,
      first_notification_attempt_at = coalesce(first_notification_attempt_at, v_now),
      last_notification_attempt_at = v_now, next_notification_attempt_at = v_now
  where id = v_inquiry.id returning * into v_inquiry;
  return jsonb_build_object(
    'inquiryId', v_inquiry.id, 'notificationKey', v_inquiry.notification_key,
    'name', v_inquiry.name, 'email', v_inquiry.email, 'phone', v_inquiry.phone,
    'interest', v_inquiry.interest, 'message', v_inquiry.message,
    'sourcePath', v_inquiry.source_path, 'sourceOrigin', v_inquiry.source_origin,
    'createdAt', v_inquiry.created_at, 'firstAttemptAt', v_inquiry.first_notification_attempt_at,
    'attemptCount', v_inquiry.notification_attempt_count);
end;
$$;
revoke all on function public.claim_contact_notification(uuid,uuid) from public, anon, authenticated;
grant execute on function public.claim_contact_notification(uuid,uuid) to service_role;

drop function public.list_contact_inquiries(integer,timestamptz,uuid);
create function public.list_contact_inquiries(
  p_limit integer, p_before_created_at timestamptz, p_before_id uuid
)
returns table (
  inquiry_id uuid, inquiry_name text, inquiry_email text, inquiry_phone text,
  inquiry_interest text, inquiry_message text, inquiry_source_path text,
  inquiry_notification_status text, inquiry_created_at timestamptz,
  inquiry_expires_at timestamptz, inquiry_source_origin text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select public.is_site_admin()) is not true then
    raise exception using errcode = '42501', message = 'Administrator access is required to view contact inquiries.';
  end if;
  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception using errcode = '22023', message = 'The contact inquiry cursor is incomplete.';
  end if;
  return query select inquiry.id, inquiry.name, inquiry.email, inquiry.phone,
    inquiry.interest, inquiry.message, inquiry.source_path, inquiry.notification_status,
    inquiry.created_at, inquiry.expires_at, inquiry.source_origin
  from private.contact_inquiries as inquiry
  where p_before_created_at is null
    or (inquiry.created_at, inquiry.id) < (p_before_created_at, p_before_id)
  order by inquiry.created_at desc, inquiry.id desc
  limit least(greatest(coalesce(p_limit,50),1),100);
end;
$$;
revoke all on function public.list_contact_inquiries(integer,timestamptz,uuid) from public, anon, authenticated;
grant execute on function public.list_contact_inquiries(integer,timestamptz,uuid) to authenticated;
comment on column private.contact_inquiries.source_origin is 'Origin validated by the Edge Function and matched to the Turnstile hostname; null for historical unattributed records.';
commit;
