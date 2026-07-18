begin;

set local statement_timeout = '20s';

select plan(6);

do $$
begin
  if has_schema_privilege('anon', 'private', 'usage')
    or has_schema_privilege('authenticated', 'private', 'usage')
  then
    raise exception 'A browser role can use the private schema.';
  end if;

  if has_function_privilege(
    'anon',
    'public.is_site_admin()',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.publish_site_page(text,timestamptz)',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.revert_site_page_draft(text,timestamptz)',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.list_contact_inquiries(integer,timestamptz)',
    'execute'
  ) or has_function_privilege(
    'anon',
    'public.list_contact_inquiries(integer,timestamptz,uuid)',
    'execute'
  ) then
    raise exception 'Anonymous visitors can execute a website-editor RPC.';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.is_site_admin()',
    'execute'
  ) or not has_function_privilege(
    'authenticated',
    'public.publish_site_page(text,timestamptz)',
    'execute'
  ) or not has_function_privilege(
    'authenticated',
    'public.revert_site_page_draft(text,timestamptz)',
    'execute'
  ) or not has_function_privilege(
    'authenticated',
    'public.list_contact_inquiries(integer,timestamptz)',
    'execute'
  ) or not has_function_privilege(
    'authenticated',
    'public.list_contact_inquiries(integer,timestamptz,uuid)',
    'execute'
  ) then
    raise exception 'An authenticated administrator cannot execute an editor RPC.';
  end if;

  if not has_column_privilege(
    'anon',
    'public.site_pages',
    'published_content',
    'select'
  ) or has_column_privilege(
    'anon',
    'public.site_pages',
    'draft_content',
    'select'
  ) then
    raise exception 'Anonymous website-page column privileges are unsafe.';
  end if;

  if not has_column_privilege(
    'authenticated',
    'public.site_pages',
    'draft_content',
    'update'
  ) or has_column_privilege(
    'authenticated',
    'public.site_pages',
    'published_content',
    'update'
  ) then
    raise exception 'Authenticated website-page update privileges bypass publishing.';
  end if;

  if not exists (
    select 1
    from storage.buckets as bucket
    where bucket.id = 'site-images'
      and bucket.public
      and bucket.file_size_limit = 10485760
      and bucket.allowed_mime_types @> array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif'
      ]::text[]
  ) then
    raise exception 'The public site image bucket is not configured safely.';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Site admins can read site image metadata',
        'Site admins can upload site images',
        'Site admins can update site images',
        'Site admins can delete site images'
      )
  ) <> 4 then
    raise exception 'One or more site image administrator policies are missing.';
  end if;
end;
$$;

select pass('website editor privileges, storage, and RPC grants are secure');

insert into auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
)
values
  (
    '71000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'website-editor-admin-test@example.invalid',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'website-editor-non-admin-test@example.invalid',
    clock_timestamp(),
    clock_timestamp()
  );

insert into private.site_admins (slot, user_id)
values (1, '71000000-0000-4000-8000-000000000001');

do $$
begin
  begin
    insert into private.site_admins (slot, user_id)
    values (2, '71000000-0000-4000-8000-000000000002');
    raise exception 'The private administrator table accepted a second slot.';
  exception
    when check_violation then null;
  end;

  if (
    select count(*)
    from private.site_admins
  ) <> 1 then
    raise exception 'The private administrator table is not single-slot.';
  end if;
end;
$$;

select pass('website editor membership is limited to one private UUID slot');

insert into public.site_pages (
  page_key,
  draft_content,
  published_content,
  published_at
)
values
  (
    '/',
    '{"headline":"Published home"}'::jsonb,
    '{"headline":"Published home"}'::jsonb,
    clock_timestamp()
  ),
  (
    '/draft-only',
    '{"headline":"Private draft"}'::jsonb,
    '{"headline":"Compiled fallback"}'::jsonb,
    null
  );

with cursor_boundary as (
  select clock_timestamp() as created_at
)
insert into private.contact_inquiries (
  id,
  request_id,
  name,
  email,
  phone,
  interest,
  message,
  source_path,
  created_at
)
select
  inquiry.id,
  inquiry.request_id,
  inquiry.name,
  'website-editor-inbox-test@example.invalid',
  '856-555-0100',
  'General question',
  'Testing the private administrator inbox.',
  '/contact?source=website-editor-test',
  cursor_boundary.created_at
from cursor_boundary
cross join (
  values
    (
      '72000000-0000-4000-8000-000000000001'::uuid,
      '73000000-0000-4000-8000-000000000001'::uuid,
      'Website Editor Inbox Test 1'
    ),
    (
      '72000000-0000-4000-8000-000000000002'::uuid,
      '73000000-0000-4000-8000-000000000002'::uuid,
      'Website Editor Inbox Test 2'
    ),
    (
      '72000000-0000-4000-8000-000000000003'::uuid,
      '73000000-0000-4000-8000-000000000003'::uuid,
      'Website Editor Inbox Test 3'
    )
) as inquiry(id, request_id, name);

set local role anon;

do $$
begin
  if (
    select count(page_key)
    from public.site_pages
  ) <> 1 or not exists (
    select 1
    from public.site_pages
    where page_key = '/'
      and published_content ->> 'headline' = 'Published home'
  ) then
    raise exception 'Anonymous visitors do not see exactly the published website pages.';
  end if;

  begin
    insert into public.site_pages (
      page_key,
      draft_content,
      published_content
    )
    values ('/anonymous-write', '{}'::jsonb, '{}'::jsonb);
    raise exception 'An anonymous visitor created a website page.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select pass('anonymous visitors can read published content only');

reset role;

select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-4000-8000-000000000002',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

set local role authenticated;

do $$
begin
  if (select public.is_site_admin()) then
    raise exception 'A non-administrator passed the UUID membership check.';
  end if;

  if exists (select 1 from public.site_pages) then
    raise exception 'A non-administrator can read website editor records.';
  end if;

  begin
    insert into public.site_pages (
      page_key,
      draft_content,
      published_content
    )
    values ('/non-admin-write', '{}'::jsonb, '{}'::jsonb);
    raise exception 'A non-administrator created a website page.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform *
    from public.publish_site_page('/', clock_timestamp());
    raise exception 'A non-administrator published a website page.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform *
    from public.list_contact_inquiries(10, null, null);
    raise exception 'A non-administrator listed private contact inquiries.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select pass('non-admin authenticated users are denied editor data and RPCs');

reset role;

select set_config(
  'request.jwt.claim.sub',
  '71000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

set local role authenticated;

do $$
declare
  v_admin_id constant uuid := '71000000-0000-4000-8000-000000000001';
  v_revision timestamptz;
  v_saved_revision timestamptz;
  v_page public.site_pages%rowtype;
begin
  if (select public.is_site_admin()) is not true then
    raise exception 'The configured administrator failed the UUID membership check.';
  end if;

  insert into public.site_pages (
    page_key,
    draft_content,
    published_content
  )
  values (
    '/editor-test',
    '{"headline":"Initial draft"}'::jsonb,
    '{"headline":"Compiled fallback"}'::jsonb
  )
  returning updated_at into v_revision;

  if not exists (
    select 1
    from public.site_pages
    where page_key = '/editor-test'
      and created_by = v_admin_id
      and updated_by = v_admin_id
      and created_at = updated_at
  ) then
    raise exception 'Website page insert audit fields are incorrect.';
  end if;

  begin
    update public.site_pages
    set published_content = '{"headline":"Bypassed publish"}'::jsonb
    where page_key = '/editor-test';
    raise exception 'The administrator bypassed the publish RPC.';
  exception
    when insufficient_privilege then null;
  end;

  update public.site_pages
  set draft_content = '{"headline":"Saved draft"}'::jsonb
  where page_key = '/editor-test'
    and updated_at = v_revision
  returning updated_at into v_saved_revision;

  if v_saved_revision is null or v_saved_revision = v_revision then
    raise exception 'Saving a draft did not advance its revision.';
  end if;

  begin
    perform *
    from public.publish_site_page(
      '/editor-test',
      v_saved_revision - interval '1 second'
    );
    raise exception 'A stale revision published a website page.';
  exception
    when serialization_failure then null;
  end;

  select published.*
  into v_page
  from public.publish_site_page('/editor-test', v_saved_revision) as published;

  if v_page.published_content <> '{"headline":"Saved draft"}'::jsonb
    or v_page.published_at is null
    or v_page.updated_by <> v_admin_id
  then
    raise exception 'Publishing did not copy and audit the current draft.';
  end if;

  update public.site_pages
  set draft_content = '{"headline":"Discard me"}'::jsonb
  where page_key = '/editor-test'
    and updated_at = v_page.updated_at
  returning updated_at into v_saved_revision;

  select reverted.*
  into v_page
  from public.revert_site_page_draft(
    '/editor-test',
    v_saved_revision
  ) as reverted;

  if v_page.draft_content <> v_page.published_content
    or v_page.draft_content <> '{"headline":"Saved draft"}'::jsonb
    or v_page.updated_by <> v_admin_id
  then
    raise exception 'Discarding a draft did not restore the published revision.';
  end if;

  if not exists (
    select 1
    from public.list_contact_inquiries(10, null, null)
    where inquiry_id = '72000000-0000-4000-8000-000000000001'
      and inquiry_name = 'Website Editor Inbox Test 1'
      and inquiry_source_path = '/contact?source=website-editor-test'
  ) then
    raise exception 'The administrator could not read the private contact inbox.';
  end if;

  delete from public.site_pages
  where page_key = '/editor-test';

  if found is not true then
    raise exception 'The administrator could not delete an editor record.';
  end if;
end;
$$;

select pass('the administrator can draft, publish, revert, audit, delete, and read inquiries');

do $$
declare
  v_cursor_created_at timestamptz;
  v_cursor_id uuid;
  v_first_page uuid[];
  v_second_page uuid[];
begin
  select array_agg(
    inquiry.inquiry_id
    order by inquiry.inquiry_created_at desc, inquiry.inquiry_id desc
  )
  into v_first_page
  from public.list_contact_inquiries(2, null, null) as inquiry;

  if v_first_page <> array[
    '72000000-0000-4000-8000-000000000003'::uuid,
    '72000000-0000-4000-8000-000000000002'::uuid
  ] then
    raise exception 'The first inquiry page was not ordered by the complete cursor.';
  end if;

  select
    inquiry.inquiry_created_at,
    inquiry.inquiry_id
  into v_cursor_created_at, v_cursor_id
  from public.list_contact_inquiries(2, null, null) as inquiry
  order by inquiry.inquiry_created_at desc, inquiry.inquiry_id desc
  offset 1
  limit 1;

  select array_agg(
    inquiry.inquiry_id
    order by inquiry.inquiry_created_at desc, inquiry.inquiry_id desc
  )
  into v_second_page
  from public.list_contact_inquiries(
    2,
    v_cursor_created_at,
    v_cursor_id
  ) as inquiry;

  if v_second_page <> array[
    '72000000-0000-4000-8000-000000000001'::uuid
  ] then
    raise exception 'The composite inquiry cursor skipped or duplicated a boundary row.';
  end if;

  begin
    perform *
    from public.list_contact_inquiries(2, v_cursor_created_at, null);
    raise exception 'The inquiry RPC accepted an incomplete cursor.';
  exception
    when invalid_parameter_value then null;
  end;
end;
$$;

select pass('contact inquiry pagination preserves rows that share a timestamp');

reset role;

select * from finish();

rollback;
