begin;
set local statement_timeout = '20s';
set local lock_timeout = '3s';
alter table private.contact_inquiries
  add column outcome text not null default 'unreviewed'
    check (outcome in ('unreviewed','not_qualified','qualified','consultation_booked','test')),
  add column outcome_updated_at timestamptz;

create function public.set_contact_inquiry_outcome(p_inquiry_id uuid, p_outcome text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select public.is_site_admin()) is not true then
    raise exception using errcode = '42501', message = 'Administrator access is required to update contact inquiries.';
  end if;
  if p_outcome is null or p_outcome not in ('unreviewed','not_qualified','qualified','consultation_booked','test') then
    raise exception using errcode = '22023', message = 'Choose a supported enquiry outcome.';
  end if;
  update private.contact_inquiries set outcome = p_outcome, outcome_updated_at = clock_timestamp()
  where id = p_inquiry_id and expires_at > clock_timestamp();
  return found;
end;
$$;
revoke all on function public.set_contact_inquiry_outcome(uuid,text) from public, anon, authenticated;
grant execute on function public.set_contact_inquiry_outcome(uuid,text) to authenticated;

drop function public.list_contact_inquiries(integer,timestamptz,uuid);
create function public.list_contact_inquiries(
  p_limit integer, p_before_created_at timestamptz, p_before_id uuid
)
returns table (
  inquiry_id uuid, inquiry_name text, inquiry_email text, inquiry_phone text,
  inquiry_interest text, inquiry_message text, inquiry_source_path text,
  inquiry_notification_status text, inquiry_created_at timestamptz,
  inquiry_expires_at timestamptz, inquiry_source_origin text, inquiry_outcome text
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
    inquiry.created_at, inquiry.expires_at, inquiry.source_origin, inquiry.outcome
  from private.contact_inquiries as inquiry
  where p_before_created_at is null
    or (inquiry.created_at, inquiry.id) < (p_before_created_at, p_before_id)
  order by inquiry.created_at desc, inquiry.id desc
  limit least(greatest(coalesce(p_limit,50),1),100);
end;
$$;
revoke all on function public.list_contact_inquiries(integer,timestamptz,uuid) from public, anon, authenticated;
grant execute on function public.list_contact_inquiries(integer,timestamptz,uuid) to authenticated;
comment on column private.contact_inquiries.outcome is 'Admin-reviewed business outcome. Test records are excluded from business results; retained history is not a lifetime total.';
commit;
