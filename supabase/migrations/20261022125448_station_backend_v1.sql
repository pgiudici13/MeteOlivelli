-- Target autorizzato dall’utente per BE-07: MeteOlivelli, pvtzncseisbxaaseqfvo.
-- Nuovi oggetti applicativi; nessuna modifica a dati o altri oggetti preesistenti.
begin;

create table public.station_measurements (
  source_id text not null check (source_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  ingestion_id uuid not null check (ingestion_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  schema_version smallint not null check (schema_version = 1),
  arduino_seconds double precision not null check (arduino_seconds >= 0 and arduino_seconds <= 9007199254740991),
  temperature_c double precision check (temperature_c > '-Infinity'::float8 and temperature_c < 'Infinity'::float8),
  humidity_pct double precision check (humidity_pct > '-Infinity'::float8 and humidity_pct < 'Infinity'::float8),
  pressure_hpa double precision check (pressure_hpa > '-Infinity'::float8 and pressure_hpa < 'Infinity'::float8),
  acquisition_kind text not null check (acquisition_kind in ('live', 'historical')),
  captured_at timestamptz,
  measured_at timestamptz,
  received_at timestamptz not null default clock_timestamp(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  raw_payload text not null check (octet_length(raw_payload) <= 16384),
  quality_flags jsonb not null check (jsonb_typeof(quality_flags) = 'array'),
  quality_version smallint not null default 1 check (quality_version = 1),
  primary key (source_id, ingestion_id),
  check ((acquisition_kind = 'live' and captured_at is not null) or
         (acquisition_kind = 'historical' and captured_at is null)),
  check (captured_at is null or isfinite(captured_at)),
  check (measured_at is null or isfinite(measured_at))
);

create index station_measurements_captured_idx
  on public.station_measurements (source_id, captured_at, ingestion_id)
  where acquisition_kind = 'live';
create index station_measurements_measured_idx
  on public.station_measurements (source_id, measured_at, ingestion_id)
  where measured_at is not null;

alter table public.station_measurements enable row level security;
revoke all on public.station_measurements from public, anon, authenticated, service_role;
grant usage on schema public to service_role;
grant select, insert on public.station_measurements to service_role;

create function public.ingest_station_measurement(
  p_measurement jsonb, p_quality_flags jsonb, p_raw_payload text
) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare
  saved public.station_measurements%rowtype;
  inserted boolean;
begin
  insert into public.station_measurements (
    source_id, ingestion_id, schema_version, arduino_seconds,
    temperature_c, humidity_pct, pressure_hpa, acquisition_kind,
    captured_at, measured_at, payload, raw_payload, quality_flags
  ) values (
    p_measurement->>'source_id', (p_measurement->>'ingestion_id')::uuid,
    (p_measurement->>'schema_version')::smallint,
    (p_measurement->>'arduino_seconds')::double precision,
    (p_measurement->>'temperature_c')::double precision,
    (p_measurement->>'humidity_pct')::double precision,
    (p_measurement->>'pressure_hpa')::double precision,
    p_measurement->>'acquisition_kind',
    (p_measurement->>'captured_at')::timestamptz,
    (p_measurement->>'measured_at')::timestamptz,
    p_measurement, p_raw_payload, p_quality_flags
  ) on conflict (source_id, ingestion_id) do nothing
  returning * into saved;
  inserted := found;
  if not inserted then
    -- Nuovo comando: snapshot aggiornato dopo l'attesa sul vincolo concorrente.
    select * into strict saved from public.station_measurements
      where source_id = p_measurement->>'source_id'
        and ingestion_id = (p_measurement->>'ingestion_id')::uuid;
    if saved.payload <> p_measurement then
      return jsonb_build_object('status', 'conflict');
    end if;
  end if;
  return jsonb_build_object(
    'status', case when inserted then 'accepted' else 'duplicate' end,
    'source_id', saved.source_id, 'ingestion_id', saved.ingestion_id,
    'received_at', saved.received_at, 'quality_flags', saved.quality_flags
  );
end;
$$;

-- Nessun SQL dinamico: solo due basi temporali e tre periodi ammessi.
create function public.read_station_measurements(
  p_source_id text, p_view text, p_period text, p_basis text,
  p_until timestamptz, p_limit integer, p_after_time timestamptz, p_after_id uuid
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  result jsonb;
  start_at timestamptz;
begin
  if p_view not in ('latest', 'history') or p_view is null
    or p_basis not in ('captured_at', 'measured_at') or p_basis is null
    or p_period not in ('24h', '7g', '30g') or p_period is null
    or p_limit is null or p_limit < 1 or p_limit > 500
    or p_until is null or not isfinite(p_until)
    or ((p_after_time is null) <> (p_after_id is null)) then
    raise exception 'Parametri non validi' using errcode = '22023';
  end if;
  start_at := p_until - case p_period when '24h' then interval '24 hours'
    when '7g' then interval '168 hours' else interval '720 hours' end;
  select coalesce(jsonb_agg(to_jsonb(selected) - 'sort_time' order by sort_time, ingestion_id), '[]'::jsonb)
    into result from (
      select ingestion_id, temperature_c, humidity_pct, pressure_hpa,
        captured_at, measured_at, received_at, quality_flags,
        case when p_view = 'latest' or p_basis = 'captured_at'
          then captured_at else measured_at end as sort_time
      from public.station_measurements
      where source_id = p_source_id and (
        (p_view = 'latest' and acquisition_kind = 'live') or
        (p_view = 'history' and (
          (p_basis = 'captured_at' and acquisition_kind = 'live'
            and captured_at between start_at and p_until
            and (p_after_time is null or (captured_at, ingestion_id) > (p_after_time, p_after_id))) or
          (p_basis = 'measured_at' and measured_at between start_at and p_until
            and (p_after_time is null or (measured_at, ingestion_id) > (p_after_time, p_after_id)))
        ))
      )
      order by
        case when p_view = 'latest' then captured_at end desc,
        case when p_view = 'latest' then ingestion_id end desc,
        case when p_basis = 'captured_at' then captured_at else measured_at end,
        ingestion_id
      limit case when p_view = 'latest' then 1 else p_limit + 1 end
    ) selected;
  return result;
end;
$$;

revoke all on function public.ingest_station_measurement(jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.read_station_measurements(text, text, text, text, timestamptz, integer, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.ingest_station_measurement(jsonb, jsonb, text) to service_role;
grant execute on function public.read_station_measurements(text, text, text, text, timestamptz, integer, timestamptz, uuid) to service_role;

commit;
