create table if not exists public.password_recovery_attempts (
  id bigint generated always as identity primary key,
  email_hash text not null check (email_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  requested_at timestamptz not null default now()
);

create index if not exists password_recovery_attempts_email_requested_idx
  on public.password_recovery_attempts (email_hash, requested_at desc);

create index if not exists password_recovery_attempts_ip_requested_idx
  on public.password_recovery_attempts (ip_hash, requested_at desc);

alter table public.password_recovery_attempts enable row level security;

revoke all on table public.password_recovery_attempts from anon, authenticated;


create or replace function public.check_password_recovery_rate_limit(
  p_email_hash text,
  p_ip_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_email_attempts integer;
  v_ip_attempts integer;
  v_email_lock bigint;
  v_ip_lock bigint;
begin
  if p_email_hash !~ '^[0-9a-f]{64}$' or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  v_email_lock := hashtextextended(p_email_hash, 0);
  v_ip_lock := hashtextextended(p_ip_hash, 1);
  perform pg_advisory_xact_lock(least(v_email_lock, v_ip_lock));
  if v_email_lock <> v_ip_lock then
    perform pg_advisory_xact_lock(greatest(v_email_lock, v_ip_lock));
  end if;

  delete from public.password_recovery_attempts
  where requested_at < now() - interval '24 hours';

  select count(*)
  into v_email_attempts
  from public.password_recovery_attempts
  where email_hash = p_email_hash
    and requested_at >= now() - interval '15 minutes';

  select count(*)
  into v_ip_attempts
  from public.password_recovery_attempts
  where ip_hash = p_ip_hash
    and requested_at >= now() - interval '15 minutes';

  if v_email_attempts >= 3 or v_ip_attempts >= 10 then
    return false;
  end if;

  insert into public.password_recovery_attempts (email_hash, ip_hash)
  values (p_email_hash, p_ip_hash);

  return true;
end;
$$;

revoke all on function public.check_password_recovery_rate_limit(text, text)
  from public, anon, authenticated;

grant execute on function public.check_password_recovery_rate_limit(text, text)
  to service_role;
