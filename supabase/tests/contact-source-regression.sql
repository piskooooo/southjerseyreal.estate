-- Self-contained, rollback-only SQL regression checks (not a pgTAP suite).
-- Never sends notifications. Run through the authorised SQL connection.
begin;
set local statement_timeout = '10s';
do $$
declare
  result jsonb;
  duplicate jsonb;
  work jsonb;
  request uuid := gen_random_uuid();
  inquiry uuid;
begin
  result := public.begin_contact_inquiry_from_site(request, 'LOCAL TEST', 'test@example.invalid', '555-0100', 'Test', 'Rollback-only test', '/', repeat('a',64), repeat('b',64), 'https://arthurpisko.realtor');
  assert (result->>'created')::boolean, 'First request must create one record';
  inquiry := (result->>'inquiryId')::uuid;
  duplicate := public.begin_contact_inquiry_from_site(request, 'LOCAL TEST', 'test@example.invalid', '555-0100', 'Test', 'Rollback-only test', '/', repeat('a',64), repeat('b',64), 'https://southjerseyreal.estate');
  assert not (duplicate->>'created')::boolean, 'Retry must not create a record';
  assert (select count(*)=1 from private.contact_inquiries where request_id=request), 'Retry must remain unique';
  assert (select source_origin='https://arthurpisko.realtor' from private.contact_inquiries where id=inquiry), 'Retry must retain original source';
  work := public.claim_contact_notification(gen_random_uuid(), inquiry);
  assert work->>'sourceOrigin'='https://arthurpisko.realtor', 'Notification must retain source';
  assert not has_function_privilege('anon','public.begin_contact_inquiry_from_site(uuid,text,text,text,text,text,text,text,text,text)','execute'), 'Anonymous writes forbidden';
  assert not has_function_privilege('authenticated','public.begin_contact_inquiry_from_site(uuid,text,text,text,text,text,text,text,text,text)','execute'), 'Authenticated writes forbidden';
  assert not has_function_privilege('anon','public.list_contact_inquiries(integer,timestamp with time zone,uuid)','execute'), 'Anonymous inbox reads forbidden';
  assert has_function_privilege('authenticated','public.list_contact_inquiries(integer,timestamp with time zone,uuid)','execute'), 'Admin access entrypoint retained';
  begin
    perform public.list_contact_inquiries(1,null,null);
    raise exception 'Non-admin read was permitted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
