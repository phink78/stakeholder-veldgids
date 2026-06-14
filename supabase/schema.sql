-- Stakeholder Mapping Tool — Supabase schema
-- Uitvoeren in Supabase SQL editor

-- Extensies
create extension if not exists "uuid-ossp";

-- Projects
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  naam text not null,
  thema text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organisations
create table public.organisations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  naam text not null,
  type text check (type in ('NGO', 'Overheid', 'Bedrijf', 'Media', 'Academisch', 'Anders')),
  eigen_agenda text,
  positie_x numeric not null default 0.5,
  positie_y numeric not null default 0.5,
  avg_label text not null default 'publiek' check (avg_label in ('publiek', 'intern', 'vertrouwelijk')),
  strategie text check (strategie in ('Remain on strategy', 'Last action', 'Increase action', 'Start engagement')),
  focus boolean not null default false,
  ai_ingevuld boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles (AVG-proof: rolprofiel overleeft de persoon)
create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  titel text not null,
  beschrijving text,
  created_at timestamptz not null default now()
);

-- Persons (AVG-strict: korte retentie, optioneel aan rol gekoppeld)
create table public.persons (
  id uuid primary key default uuid_generate_v4(),
  role_id uuid not null references public.roles(id) on delete cascade,
  naam text not null,
  email text,
  expires_at timestamptz not null default (now() + interval '12 months'),
  created_at timestamptz not null default now()
);

-- Signals (actuele uitspraken per organisatie — Laag 4)
create table public.signals (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  bron text not null,
  inhoud text not null,
  datum date not null,
  created_at timestamptz not null default now()
);

-- updated_at trigger functie
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger organisations_updated_at
  before update on public.organisations
  for each row execute procedure public.handle_updated_at();

-- Row Level Security
alter table public.projects enable row level security;
alter table public.organisations enable row level security;
alter table public.roles enable row level security;
alter table public.persons enable row level security;
alter table public.signals enable row level security;

-- RLS policies: user ziet alleen eigen data
create policy "users own projects" on public.projects
  for all using (auth.uid() = user_id);

create policy "users own organisations" on public.organisations
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "users own roles" on public.roles
  for all using (
    organisation_id in (
      select o.id from public.organisations o
      join public.projects p on p.id = o.project_id
      where p.user_id = auth.uid()
    )
  );

create policy "users own persons" on public.persons
  for all using (
    role_id in (
      select r.id from public.roles r
      join public.organisations o on o.id = r.organisation_id
      join public.projects p on p.id = o.project_id
      where p.user_id = auth.uid()
    )
  );

create policy "users own signals" on public.signals
  for all using (
    organisation_id in (
      select o.id from public.organisations o
      join public.projects p on p.id = o.project_id
      where p.user_id = auth.uid()
    )
  );
