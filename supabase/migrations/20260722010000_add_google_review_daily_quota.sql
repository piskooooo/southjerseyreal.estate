begin;

create table private.google_review_daily_usage (
  usage_date date primary key,
  request_count integer not null default 0
    check (request_count between 0 and 30),
  updated_at timestamptz not null default clock_timestamp()
);

revoke all on private.google_review_daily_usage
from public, anon, authenticated, service_role;

comment on table private.google_review_daily_usage is
'Private UTC-daily counter that caps Google Places review requests at 30.';

create or replace function public.claim_google_review_daily_request(
  p_limit integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usage_date date := (clock_timestamp() at time zone 'UTC')::date;
  v_request_count integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 30 then
    raise exception using errcode = '22023', message = 'The daily limit must be between 1 and 30.';
  end if;

  insert into private.google_review_daily_usage (
    usage_date,
    request_count,
    updated_at
  ) values (
    v_usage_date,
    1,
    clock_timestamp()
  )
  on conflict (usage_date) do update
  set request_count = private.google_review_daily_usage.request_count + 1,
      updated_at = clock_timestamp()
  where private.google_review_daily_usage.request_count < p_limit
  returning request_count into v_request_count;

  if v_request_count is null then
    select request_count
    into v_request_count
    from private.google_review_daily_usage
    where usage_date = v_usage_date;

    return jsonb_build_object(
      'accepted', false,
      'requestCount', coalesce(v_request_count, p_limit),
      'limit', p_limit
    );
  end if;

  return jsonb_build_object(
    'accepted', true,
    'requestCount', v_request_count,
    'limit', p_limit
  );
end;
$$;

revoke all on function public.claim_google_review_daily_request(integer)
from public, anon, authenticated;

grant execute on function public.claim_google_review_daily_request(integer)
to service_role;

commit;
