-- 1) Ping target
create table if not exists public.keepalive (
  id int primary key,
  pinged_at timestamptz not null default now()
);
insert into public.keepalive (id) values (1) on conflict do nothing;

-- 2) anon may only read this one table
alter table public.keepalive enable row level security;
drop policy if exists "anon read keepalive" on public.keepalive;
create policy "anon read keepalive" on public.keepalive
  for select to anon using (true);

grant usage on schema public to anon;
grant select on public.keepalive to anon;

-- 3) Auto-enable RLS on every future public table (keeps Django tables off the public REST API)
create or replace function public.rls_auto_enable()
returns event_trigger language plpgsql security definer set search_path = pg_catalog as $$
declare cmd record;
begin
  for cmd in select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and schema_name = 'public'
  loop
    execute format('alter table %s enable row level security', cmd.object_identity);
  end loop;
end $$;

drop event trigger if exists rls_auto_enable;
create event trigger rls_auto_enable on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();