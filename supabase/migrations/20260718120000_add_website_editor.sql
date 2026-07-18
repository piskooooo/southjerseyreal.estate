begin;

set local statement_timeout = '20s';

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.site_admins (
  slot smallint primary key default 1
    check (slot = 1),
  user_id uuid not null unique
    references auth.users (id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table private.site_admins enable row level security;

revoke all on table private.site_admins
from public, anon, authenticated, service_role;

comment on table private.site_admins is
'Private, single-slot membership for the one authorized website editor account. Bind the slot to an Auth user UUID after creating that account.';

create or replace function private.apply_site_admin_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function private.apply_site_admin_audit()
from public, anon, authenticated, service_role;

create trigger set_site_admin_audit
before update on private.site_admins
for each row execute function private.apply_site_admin_audit();

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.site_admins as admin
    where admin.slot = 1
      and admin.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_admin()
from public, anon, authenticated;

grant execute on function public.is_site_admin()
to authenticated;

comment on function public.is_site_admin() is
'Returns true only when the current authenticated user owns the private website-editor slot.';

create table public.site_pages (
  page_key text primary key
    check (
      char_length(page_key) between 1 and 240
      and (
        page_key in ('__sitewide__', '/')
        or page_key ~ '^/[a-z0-9][a-z0-9/-]*$'
      )
    ),
  draft_content jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(draft_content) = 'object'
      and octet_length(draft_content::text) <= 2000000
    ),
  published_content jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(published_content) = 'object'
      and octet_length(published_content::text) <= 2000000
    ),
  published_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index site_pages_created_by_idx
on public.site_pages (created_by);

create index site_pages_updated_by_idx
on public.site_pages (updated_by);

alter table public.site_pages enable row level security;

revoke all on table public.site_pages
from public, anon, authenticated;

grant select (page_key, published_content, published_at)
on table public.site_pages
to anon;

grant select
on table public.site_pages
to authenticated;

grant insert (page_key, draft_content, published_content)
on table public.site_pages
to authenticated;

grant update (draft_content)
on table public.site_pages
to authenticated;

grant delete
on table public.site_pages
to authenticated;

create policy "Published website pages are public"
on public.site_pages
for select
to anon
using (published_at is not null);

create policy "Site admins can view all website pages"
on public.site_pages
for select
to authenticated
using ((select public.is_site_admin()));

create policy "Site admins can add website pages"
on public.site_pages
for insert
to authenticated
with check ((select public.is_site_admin()));

create policy "Site admins can update website page drafts"
on public.site_pages
for update
to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

create policy "Site admins can delete website pages"
on public.site_pages
for delete
to authenticated
using ((select public.is_site_admin()));

create or replace function private.apply_site_page_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.created_at = v_now;
    new.created_by = v_actor;
  end if;

  new.updated_at = v_now;
  new.updated_by = v_actor;
  return new;
end;
$$;

revoke all on function private.apply_site_page_audit()
from public, anon, authenticated, service_role;

create trigger set_site_page_audit
before insert or update on public.site_pages
for each row execute function private.apply_site_page_audit();

create or replace function public.publish_site_page(
  p_page_key text,
  p_expected_updated_at timestamptz
)
returns setof public.site_pages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_page public.site_pages%rowtype;
begin
  if (select public.is_site_admin()) is not true then
    raise exception using
      errcode = '42501',
      message = 'Administrator access is required to publish website pages.';
  end if;

  if p_page_key is null or p_expected_updated_at is null then
    raise exception using
      errcode = '22023',
      message = 'A website page and expected revision are required.';
  end if;

  update public.site_pages as page
  set
    published_content = page.draft_content,
    published_at = clock_timestamp()
  where page.page_key = p_page_key
    and page.updated_at = p_expected_updated_at
  returning page.* into v_page;

  if not found then
    raise exception using
      errcode = '40001',
      message = 'This website page changed in another editor.';
  end if;

  return next v_page;
end;
$$;

revoke all on function public.publish_site_page(text, timestamptz)
from public, anon, authenticated;

grant execute on function public.publish_site_page(text, timestamptz)
to authenticated;

comment on function public.publish_site_page(text, timestamptz) is
'Atomically publishes a saved draft when its expected revision still matches.';

create or replace function public.revert_site_page_draft(
  p_page_key text,
  p_expected_updated_at timestamptz
)
returns setof public.site_pages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_page public.site_pages%rowtype;
begin
  if (select public.is_site_admin()) is not true then
    raise exception using
      errcode = '42501',
      message = 'Administrator access is required to discard website page drafts.';
  end if;

  if p_page_key is null or p_expected_updated_at is null then
    raise exception using
      errcode = '22023',
      message = 'A website page and expected revision are required.';
  end if;

  update public.site_pages as page
  set draft_content = page.published_content
  where page.page_key = p_page_key
    and page.updated_at = p_expected_updated_at
  returning page.* into v_page;

  if not found then
    raise exception using
      errcode = '40001',
      message = 'This website page changed in another editor.';
  end if;

  return next v_page;
end;
$$;

revoke all on function public.revert_site_page_draft(text, timestamptz)
from public, anon, authenticated;

grant execute on function public.revert_site_page_draft(text, timestamptz)
to authenticated;

comment on function public.revert_site_page_draft(text, timestamptz) is
'Atomically resets a saved draft to the published revision when its expected revision still matches.';

create index contact_inquiries_admin_cursor_idx
on private.contact_inquiries (created_at desc, id desc);

create or replace function public.list_contact_inquiries(
  p_limit integer default 50,
  p_before timestamptz default null
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
  where p_before is null or inquiry.created_at < p_before
  order by inquiry.created_at desc, inquiry.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

revoke all on function public.list_contact_inquiries(integer, timestamptz)
from public, anon, authenticated;

grant execute on function public.list_contact_inquiries(integer, timestamptz)
to authenticated;

comment on function public.list_contact_inquiries(integer, timestamptz) is
'Returns retained private contact inquiries only to the authenticated website administrator.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-images',
  'site-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Site admins can read site image metadata"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);

create policy "Site admins can upload site images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);

create policy "Site admins can update site images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
)
with check (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);

create policy "Site admins can delete site images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);

comment on table public.site_pages is
'Draft and published structured content for the public website editor.';

commit;
