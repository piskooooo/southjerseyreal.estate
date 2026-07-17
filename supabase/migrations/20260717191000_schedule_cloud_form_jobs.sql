begin;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function private.invoke_contact_notifications()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_function_url text;
  v_cron_secret text;
  v_request_id bigint;
begin
  select
    max(decrypted_secret) filter (
      where name = 'sjre_contact_notification_function_url'
    ),
    max(decrypted_secret) filter (
      where name = 'sjre_contact_notification_cron_secret'
    )
  into v_function_url, v_cron_secret
  from vault.decrypted_secrets;

  if v_function_url is null or v_cron_secret is null then
    raise exception 'Contact notification Vault configuration is missing.';
  end if;

  select net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Contact-Notification-Secret', v_cron_secret
    ),
    body := '{"mode":"scheduled"}'::jsonb,
    timeout_milliseconds := 20000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.invoke_contact_notifications()
from public, anon, authenticated, service_role;

do $$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname in (
      'sjre-contact-notifications',
      'sjre-form-data-retention'
    )
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule(
    'sjre-contact-notifications',
    '*/5 * * * *',
    $cron$
      select private.invoke_contact_notifications();
    $cron$
  );

  perform cron.schedule(
    'sjre-form-data-retention',
    '17 3 * * *',
    $cron$
      select private.purge_expired_form_data();
    $cron$
  );
end;
$$;

comment on function private.invoke_contact_notifications() is
'Invokes the protected contact notification worker every five minutes using Supabase Vault configuration.';

commit;
