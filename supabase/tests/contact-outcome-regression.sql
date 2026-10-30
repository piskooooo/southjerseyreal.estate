-- Rollback-only checks. Creates no retained enquiry and sends no notification.
begin;
set local statement_timeout = '10s';
do $$
declare
  result jsonb;
  inquiry uuid;
  admin_id uuid;
begin
  result := public.begin_contact_inquiry_from_site(gen_random_uuid(), 'ROLLBACK TEST', 'outcome@example.invalid', '555-0100', 'Test', 'Rollback-only test', '/', repeat('c',64), repeat('d',64), 'https://arthurpisko.realtor');
  inquiry := (result->>'inquiryId')::uuid;
  assert inquiry is not null, 'Fixture must be created';
  begin
    perform public.set_contact_inquiry_outcome(inquiry, 'qualified');
    raise exception 'Non-admin update was permitted';
  exception when insufficient_privilege then null;
  end;
  select user_id into admin_id from private.site_admins where slot=1;
  assert admin_id is not null, 'An existing admin is required';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  assert public.set_contact_inquiry_outcome(inquiry, 'qualified'), 'Admin update must succeed';
  assert (select outcome='qualified' and outcome_updated_at is not null and notification_status='pending' and notification_attempt_count=0 from private.contact_inquiries where id=inquiry), 'Outcome must persist without sending';
  assert exists(select 1 from public.list_contact_inquiries(100,null,null) where inquiry_id=inquiry and inquiry_outcome='qualified'), 'Inbox must return saved outcome';
  assert not public.set_contact_inquiry_outcome(gen_random_uuid(), 'test'), 'Missing record must not report success';
  begin
    perform public.set_contact_inquiry_outcome(inquiry, 'invented');
    raise exception 'Invalid outcome was permitted';
  exception when invalid_parameter_value then null;
  end;
  assert not has_function_privilege('anon','public.set_contact_inquiry_outcome(uuid,text)','execute'), 'Anonymous updates forbidden';
end;
$$;
rollback;
