begin;

set local statement_timeout = '20s';

select plan(43);

create temporary table cloud_forms_test_state (
  key text primary key,
  value jsonb
) on commit drop;

select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon cannot use the private schema'
);

select ok(
  not has_schema_privilege('authenticated', 'private', 'usage'),
  'authenticated cannot use the private schema'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.begin_contact_inquiry(uuid,text,text,text,text,text,text,text,text)',
    'execute'
  ),
  'anon cannot execute the contact acceptance RPC'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.begin_contact_inquiry(uuid,text,text,text,text,text,text,text,text)',
    'execute'
  ),
  'authenticated cannot execute the contact acceptance RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.begin_newsletter_signup_request(text,text,uuid)',
    'execute'
  ),
  'anon cannot execute the newsletter acceptance RPC'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.begin_newsletter_signup_request(text,text,uuid)',
    'execute'
  ),
  'authenticated cannot execute the newsletter acceptance RPC'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.begin_contact_inquiry(uuid,text,text,text,text,text,text,text,text)',
    'execute'
  ),
  'service_role can execute the contact acceptance RPC'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.begin_newsletter_signup_request(text,text,uuid)',
    'execute'
  ),
  'service_role can execute the newsletter acceptance RPC'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'private'
      and table_name in (
        'contact_inquiries',
        'contact_rate_limit_events',
        'newsletter_signup_requests'
      )
      and column_name in (
        'ip',
        'ip_address',
        'turnstile_token',
        'newsletter_email'
      )
  ),
  'private form tables do not store raw abuse-prevention data'
);

insert into cloud_forms_test_state (key, value)
values (
  'initial-contact',
  public.begin_contact_inquiry(
    '10000000-0000-4000-8000-000000000001',
    'Contact Test Visitor',
    'contact-test@example.com',
    '856-555-0100',
    'General question',
    'Testing the private contact inquiry flow.',
    '/contact?topic=general',
    repeat('a', 64),
    repeat('b', 64)
  )
);

select is(
  (select value ->> 'accepted' from cloud_forms_test_state where key = 'initial-contact'),
  'true',
  'a valid contact inquiry is accepted'
);

select is(
  (select value ->> 'created' from cloud_forms_test_state where key = 'initial-contact'),
  'true',
  'a valid contact inquiry creates a new record'
);

select is(
  (select value ->> 'notificationStatus' from cloud_forms_test_state where key = 'initial-contact'),
  'pending',
  'a new contact inquiry starts with a pending notification'
);

select ok(
  exists (
    select 1
    from private.contact_inquiries
    where id = (
        select (value ->> 'inquiryId')::uuid
        from cloud_forms_test_state
        where key = 'initial-contact'
      )
      and name = 'Contact Test Visitor'
      and expires_at between
        created_at + interval '11 months'
        and created_at + interval '13 months'
  ),
  'the inquiry is stored with approximately twelve months of retention'
);

insert into cloud_forms_test_state (key, value)
values (
  'duplicate-contact',
  public.begin_contact_inquiry(
    '10000000-0000-4000-8000-000000000001',
    'Changed Duplicate Name',
    'changed@example.com',
    '555-555-5555',
    'Selling',
    'This duplicate payload must not replace the original.',
    '/contact',
    repeat('c', 64),
    repeat('d', 64)
  )
);

select is(
  (select value ->> 'accepted' from cloud_forms_test_state where key = 'duplicate-contact'),
  'true',
  'a repeated contact request ID remains accepted'
);

select is(
  (select value ->> 'created' from cloud_forms_test_state where key = 'duplicate-contact'),
  'false',
  'a repeated contact request ID does not create another record'
);

select is(
  (select value ->> 'inquiryId' from cloud_forms_test_state where key = 'duplicate-contact'),
  (select value ->> 'inquiryId' from cloud_forms_test_state where key = 'initial-contact'),
  'a repeated contact request ID returns the original inquiry ID'
);

select ok(
  (
    select count(*) = 1
      and bool_and(
        name = 'Contact Test Visitor'
        and email = 'contact-test@example.com'
      )
    from private.contact_inquiries
    where request_id = '10000000-0000-4000-8000-000000000001'
  ),
  'a repeated contact request ID neither duplicates nor replaces the original inquiry'
);

insert into cloud_forms_test_state (key, value)
values
  (
    'rate-contact-2',
    public.begin_contact_inquiry(
      '10000000-0000-4000-8000-000000000002',
      'Rate Limit Test',
      'contact-test@example.com',
      '856-555-0100',
      'General question',
      'Testing the contact rate limit.',
      '/contact',
      repeat('a', 64),
      lpad(to_hex(2), 64, '0')
    )
  ),
  (
    'rate-contact-3',
    public.begin_contact_inquiry(
      '10000000-0000-4000-8000-000000000003',
      'Rate Limit Test',
      'contact-test@example.com',
      '856-555-0100',
      'General question',
      'Testing the contact rate limit.',
      '/contact',
      repeat('a', 64),
      lpad(to_hex(3), 64, '0')
    )
  );

select is(
  (select value ->> 'accepted' from cloud_forms_test_state where key = 'rate-contact-2'),
  'true',
  'the second same-email inquiry is accepted before the rate limit'
);

select is(
  (select value ->> 'accepted' from cloud_forms_test_state where key = 'rate-contact-3'),
  'true',
  'the third same-email inquiry is accepted before the rate limit'
);

insert into cloud_forms_test_state (key, value)
values (
  'rate-contact-4',
  public.begin_contact_inquiry(
    '10000000-0000-4000-8000-000000000004',
    'Rate Limit Test',
    'contact-test@example.com',
    '856-555-0100',
    'General question',
    'This fourth email attempt must be rate limited.',
    '/contact',
    repeat('a', 64),
    repeat('e', 64)
  )
);

select is(
  (select value ->> 'accepted' from cloud_forms_test_state where key = 'rate-contact-4'),
  'false',
  'the fourth same-email inquiry is rejected by the rate limit'
);

select is(
  (select value ->> 'reason' from cloud_forms_test_state where key = 'rate-contact-4'),
  'rate_limited',
  'a rate-limited contact inquiry returns the expected reason'
);

select ok(
  not exists (
    select 1
    from private.contact_inquiries
    where request_id = '10000000-0000-4000-8000-000000000004'
  ),
  'a rate-limited contact inquiry is not stored'
);

insert into cloud_forms_test_state (key, value)
values (
  'first-notification-claim',
  public.claim_contact_notification(
    '20000000-0000-4000-8000-000000000001',
    (
      select (value ->> 'inquiryId')::uuid
      from cloud_forms_test_state
      where key = 'initial-contact'
    )
  )
);

select is(
  (select value ->> 'inquiryId' from cloud_forms_test_state where key = 'first-notification-claim'),
  (select value ->> 'inquiryId' from cloud_forms_test_state where key = 'initial-contact'),
  'the pending contact notification is claimed for the requested inquiry'
);

select is(
  (select (value ->> 'attemptCount')::integer from cloud_forms_test_state where key = 'first-notification-claim'),
  1,
  'the first notification claim records attempt one'
);

select is(
  public.complete_contact_notification(
    (
      select (value ->> 'inquiryId')::uuid
      from cloud_forms_test_state
      where key = 'initial-contact'
    ),
    '20000000-0000-4000-8000-000000000099',
    '<wrong-claim@example.com>',
    'accepted'
  ),
  false,
  'a wrong claim token cannot complete a contact notification'
);

select is(
  public.defer_contact_notification(
    (
      select (value ->> 'inquiryId')::uuid
      from cloud_forms_test_state
      where key = 'initial-contact'
    ),
    '20000000-0000-4000-8000-000000000001',
    'retryable',
    'network_error',
    300
  ),
  true,
  'a claimed contact notification can be deferred for retry'
);

update private.contact_inquiries
set next_notification_attempt_at = clock_timestamp() - interval '1 second'
where id = (
  select (value ->> 'inquiryId')::uuid
  from cloud_forms_test_state
  where key = 'initial-contact'
);

insert into cloud_forms_test_state (key, value)
values (
  'second-notification-claim',
  public.claim_contact_notification(
    '20000000-0000-4000-8000-000000000002',
    (
      select (value ->> 'inquiryId')::uuid
      from cloud_forms_test_state
      where key = 'initial-contact'
    )
  )
);

select is(
  (select (value ->> 'attemptCount')::integer from cloud_forms_test_state where key = 'second-notification-claim'),
  2,
  'a retryable notification can be reclaimed as attempt two'
);

select is(
  public.complete_contact_notification(
    (
      select (value ->> 'inquiryId')::uuid
      from cloud_forms_test_state
      where key = 'initial-contact'
    ),
    '20000000-0000-4000-8000-000000000002',
    '<contact-test-message@example.com>',
    'accepted'
  ),
  true,
  'the retried contact notification can be completed'
);

select ok(
  exists (
    select 1
    from private.contact_inquiries
    where id = (
        select (value ->> 'inquiryId')::uuid
        from cloud_forms_test_state
        where key = 'initial-contact'
      )
      and notification_status = 'sent'
      and notification_attempt_count = 2
      and provider_message_id = '<contact-test-message@example.com>'
      and sent_at is not null
      and claim_token is null
      and lease_expires_at is null
  ),
  'the completed contact notification has the expected terminal state'
);

select is(
  public.begin_newsletter_signup_request(
    repeat('c', 64),
    'newsletter_page',
    '30000000-0000-4000-8000-000000000001'
  ),
  true,
  'the first newsletter signup request is claimed'
);

select is(
  public.begin_newsletter_signup_request(
    repeat('c', 64),
    'newsletter_page',
    '30000000-0000-4000-8000-000000000002'
  ),
  false,
  'the newsletter cooldown suppresses an immediate duplicate request'
);

select is(
  public.complete_newsletter_signup_request(
    repeat('c', 64),
    '30000000-0000-4000-8000-000000000002',
    'confirmation_requested',
    null
  ),
  false,
  'a stale newsletter attempt cannot update the ledger'
);

select is(
  public.complete_newsletter_signup_request(
    repeat('c', 64),
    '30000000-0000-4000-8000-000000000001',
    'confirmation_requested',
    null
  ),
  true,
  'the current newsletter attempt records the provider result'
);

update private.newsletter_signup_requests
set last_requested_at = clock_timestamp() - interval '11 minutes'
where email_hash = repeat('c', 64);

select is(
  public.begin_newsletter_signup_request(
    repeat('c', 64),
    'newsletter_page',
    '30000000-0000-4000-8000-000000000003'
  ),
  true,
  'a newsletter signup can be retried after the confirmation cooldown'
);

select is(
  public.complete_newsletter_signup_request(
    repeat('c', 64),
    '30000000-0000-4000-8000-000000000003',
    'provider_error',
    'request_failed'
  ),
  true,
  'the newsletter retry records its provider result'
);

select ok(
  exists (
    select 1
    from private.newsletter_signup_requests
    where email_hash = repeat('c', 64)
      and provider_status = 'provider_error'
      and request_count = 2
      and last_attempt_id = '30000000-0000-4000-8000-000000000003'
      and last_provider_code = 'request_failed'
  ),
  'the newsletter ledger keeps the expected retry state without raw email data'
);

update private.contact_inquiries
set created_at = clock_timestamp() - interval '13 months',
    expires_at = clock_timestamp() - interval '1 month'
where request_id = '10000000-0000-4000-8000-000000000003';

update private.contact_rate_limit_events
set created_at = clock_timestamp() - interval '49 hours'
where request_id = '10000000-0000-4000-8000-000000000003';

update private.newsletter_signup_requests
set expires_at = clock_timestamp() - interval '1 day'
where email_hash = repeat('c', 64);

insert into cloud_forms_test_state (key, value)
values ('purge-result', private.purge_expired_form_data());

select cmp_ok(
  (select coalesce((value ->> 'inquiriesDeleted')::integer, 0) from cloud_forms_test_state where key = 'purge-result'),
  '>=',
  1,
  'retention purges at least one expired contact inquiry'
);

select cmp_ok(
  (select coalesce((value ->> 'rateEventsDeleted')::integer, 0) from cloud_forms_test_state where key = 'purge-result'),
  '>=',
  2,
  'retention purges both expired contact rate-limit events'
);

select cmp_ok(
  (select coalesce((value ->> 'newsletterRequestsDeleted')::integer, 0) from cloud_forms_test_state where key = 'purge-result'),
  '>=',
  1,
  'retention purges at least one expired newsletter request'
);

select ok(
  not exists (
    select 1
    from private.contact_inquiries
    where request_id = '10000000-0000-4000-8000-000000000003'
  ),
  'the expired contact inquiry is absent after retention runs'
);

select ok(
  not exists (
    select 1
    from private.newsletter_signup_requests
    where email_hash = repeat('c', 64)
  ),
  'the expired newsletter request is absent after retention runs'
);

select ok(
  exists (
    select 1
    from cron.job
    where jobname = 'sjre-contact-notifications'
  ),
  'the contact notification cron job is installed'
);

select ok(
  exists (
    select 1
    from cron.job
    where jobname = 'sjre-form-data-retention'
  ),
  'the form-data retention cron job is installed'
);

select * from finish();

rollback;
