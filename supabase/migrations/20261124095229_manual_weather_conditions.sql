-- Osservazioni compilate manualmente, separate dai sensori.
create table public.manual_weather_conditions (
  id uuid primary key default gen_random_uuid(),
  observed_at timestamptz not null,
  cloud text not null check (cloud in ('sereno', 'poco_nuvoloso', 'nuvoloso', 'coperto')),
  rain text not null check (rain in ('assente', 'debole', 'moderata', 'forte')),
  wind text not null check (wind in ('calmo', 'debole', 'moderato', 'forte')),
  created_at timestamptz not null default now()
);
create index manual_weather_conditions_observed_at_idx on public.manual_weather_conditions (observed_at desc);
alter table public.manual_weather_conditions enable row level security;
revoke all on public.manual_weather_conditions from public, anon, authenticated;
grant select, insert, update on public.manual_weather_conditions to service_role;
