create type public.app_role as enum ('admin', 'incident_commander', 'analyst', 'legal', 'observer');
create type public.breakout_status as enum ('detected', 'triaged', 'contained', 'eradicated', 'recovered', 'closed');
create type public.document_category as enum ('Legal', 'Company Policy', 'Playbook', 'Journal');
create type public.data_state as enum ('encrypted', 'exfiltrated', 'corrupted', 'exposed', 'suspected', 'secured');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Signed-in members can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role (_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Signed-in members can read roles"
  on public.user_roles for select to authenticated using (true);

create policy "Admins grant roles"
  on public.user_roles for insert to authenticated
  with check (public.has_role (auth.uid(), 'admin'));

create policy "Admins change roles"
  on public.user_roles for update to authenticated
  using (public.has_role (auth.uid(), 'admin'))
  with check (public.has_role (auth.uid(), 'admin'));

create policy "Admins revoke roles"
  on public.user_roles for delete to authenticated
  using (public.has_role (auth.uid(), 'admin'));

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    new.email
  );
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when (select count(*) from public.profiles) = 1 then 'admin'::public.app_role
         else 'observer'::public.app_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

create table public.breakouts (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null,
  system text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  category text not null default '',
  description text not null default '',
  strategy text not null default '',
  source text not null default '',
  owner_name text,
  status public.breakout_status not null default 'detected',
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.breakouts to authenticated;
grant all on public.breakouts to service_role;

alter table public.breakouts enable row level security;

create policy "Signed-in members can read breakouts"
  on public.breakouts for select to authenticated using (true);

create policy "Writers can declare breakouts"
  on public.breakouts for insert to authenticated
  with check (
    public.has_role (auth.uid(), 'admin')
    or public.has_role (auth.uid(), 'incident_commander')
    or public.has_role (auth.uid(), 'analyst')
  );

create policy "Writers can update breakouts"
  on public.breakouts for update to authenticated
  using (
    public.has_role (auth.uid(), 'admin')
    or public.has_role (auth.uid(), 'incident_commander')
    or public.has_role (auth.uid(), 'analyst')
  );

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.document_category not null,
  content text not null default '',
  file_name text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert on public.documents to authenticated;
grant all on public.documents to service_role;

alter table public.documents enable row level security;

create policy "Signed-in members can read documents"
  on public.documents for select to authenticated using (true);

create policy "Everyone except observers can create documents"
  on public.documents for insert to authenticated
  with check (
    public.has_role (auth.uid(), 'admin')
    or public.has_role (auth.uid(), 'incident_commander')
    or public.has_role (auth.uid(), 'analyst')
    or public.has_role (auth.uid(), 'legal')
  );

create table public.scope_items (
  id uuid primary key default gen_random_uuid(),
  breakout_id uuid not null references public.breakouts (id) on delete cascade,
  asset text not null,
  data_type text not null default '',
  records integer not null default 0 check (records >= 0),
  state public.data_state not null,
  classification text not null check (classification in ('PII', 'PHI', 'Financial', 'IP', 'Credentials', 'Internal'))
);

grant select, insert on public.scope_items to authenticated;
grant all on public.scope_items to service_role;

alter table public.scope_items enable row level security;

create policy "Signed-in members can read scope"
  on public.scope_items for select to authenticated using (true);

create policy "Writers can add scope items"
  on public.scope_items for insert to authenticated
  with check (
    public.has_role (auth.uid(), 'admin')
    or public.has_role (auth.uid(), 'incident_commander')
    or public.has_role (auth.uid(), 'analyst')
  );

create table public.auto_runs (
  id uuid primary key default gen_random_uuid(),
  target text not null,
  stage text not null default 'queued' check (stage in ('queued', 'recon', 'fix', 'validate', 'done')),
  findings text[] not null default '{}',
  requested_by uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now()
);

grant select, insert on public.auto_runs to authenticated;
grant all on public.auto_runs to service_role;

alter table public.auto_runs enable row level security;

create policy "Command can read auto runs"
  on public.auto_runs for select to authenticated
  using (
    public.has_role (auth.uid(), 'admin')
    or public.has_role (auth.uid(), 'incident_commander')
  );

create policy "Command can start auto runs"
  on public.auto_runs for insert to authenticated
  with check (
    public.has_role (auth.uid(), 'admin')
    or public.has_role (auth.uid(), 'incident_commander')
  );

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  actor_name text,
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

grant select, insert on public.audit_events to authenticated;
grant all on public.audit_events to service_role;

alter table public.audit_events enable row level security;

create policy "Signed-in members can read the audit log"
  on public.audit_events for select to authenticated using (true);

create policy "Signed-in members append audit events"
  on public.audit_events for insert to authenticated
  with check (actor = auth.uid());

insert into public.breakouts (ref, title, system, severity, category, source, owner_name, status, created_at) values
  ('INC-1042', 'Ransomware activity on Finance endpoints', 'Finance endpoints', 'critical', 'Ransomware', 'CrowdStrike · 8 endpoints', 'Sarah Chen', 'triaged', now() - interval '46 minutes'),
  ('INC-1041', 'Privileged account compromise', 'Microsoft Entra ID', 'high', 'Identity', 'Microsoft Entra ID · 1 identity', 'Alex Morgan', 'contained', now() - interval '1 hour 18 minutes'),
  ('INC-1039', 'Suspicious outbound data transfer', 'api-prod-03', 'high', 'Exfiltration', 'Palo Alto · api-prod-03', 'James Wilson', 'recovered', now() - interval '2 hours 5 minutes'),
  ('INC-1038', 'Credential phishing campaign', 'Email', 'medium', 'Phishing', 'Proofpoint · 14 mailboxes', 'Maya Patel', 'triaged', now() - interval '2 hours 42 minutes'),
  ('INC-1037', 'Unusual service account authentication', 'svc-backup', 'medium', 'Identity', 'Microsoft Entra ID · svc-backup', 'James Wilson', 'detected', now() - interval '3 hours 11 minutes');

insert into public.audit_events (actor, actor_name, action, detail, created_at) values
  (null, 'Alex Morgan', 'account.sessions_revoked', '{"incident": "INC-1041", "identities": 1}', now() - interval '2 minutes'),
  (null, 'Sarah Chen', 'containment.approval_requested', '{"incident": "INC-1042", "endpoints": 2}', now() - interval '4 minutes'),
  (null, 'Maya Patel', 'incident.resolved', '{"incident": "INC-1036", "note": "Malicious inbox rule removed"}', now() - interval '13 minutes'),
  (null, 'James Wilson', 'incident.monitoring', '{"incident": "INC-1039", "note": "No further egress"}', now() - interval '19 minutes');