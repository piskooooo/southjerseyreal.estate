begin;

set local statement_timeout = '20s';

create or replace function public.list_contact_inquiries(
  p_limit integer,
  p_before_created_at timestamptz,
  p_before_id uuid
)
returns table (
  inquiry_id uuid,
  inquiry_name text,
  inquiry_email text,
  inquiry_phone text,
  inquiry_interest text,
  inquiry_message text,
  inquiry_source_path text,
  inquiry_notification_status text,
  inquiry_created_at timestamptz,
  inquiry_expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select public.is_site_admin()) is not true then
    raise exception using
      errcode = '42501',
      message = 'Administrator access is required to view contact inquiries.';
  end if;

  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception using
      errcode = '22023',
      message = 'The contact inquiry cursor is incomplete.';
  end if;

  return query
  select
    inquiry.id,
    inquiry.name,
    inquiry.email,
    inquiry.phone,
    inquiry.interest,
    inquiry.message,
    inquiry.source_path,
    inquiry.notification_status,
    inquiry.created_at,
    inquiry.expires_at
  from private.contact_inquiries as inquiry
  where p_before_created_at is null
    or (inquiry.created_at, inquiry.id) < (p_before_created_at, p_before_id)
  order by inquiry.created_at desc, inquiry.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

revoke all on function public.list_contact_inquiries(
  integer,
  timestamptz,
  uuid
)
from public, anon, authenticated;

grant execute on function public.list_contact_inquiries(
  integer,
  timestamptz,
  uuid
)
to authenticated;

comment on function public.list_contact_inquiries(
  integer,
  timestamptz,
  uuid
) is
'Returns retained private contact inquiries to the website administrator using a stable created-at and UUID cursor.';

commit;
