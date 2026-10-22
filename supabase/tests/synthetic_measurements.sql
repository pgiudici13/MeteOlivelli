-- Test transazionale autorizzato: nessuna fixture persistente.
begin;
do $$
declare items jsonb;
begin
  insert into public.station_measurements
    (source_id, ingestion_id, schema_version, arduino_seconds, temperature_c,
     humidity_pct, pressure_hpa, acquisition_kind, captured_at, measured_at,
     payload, raw_payload, quality_flags)
  select 'synthetic-kind-sql-test', gen_random_uuid(), 1, n*1800, 18+n*0.1,
    65, 1015, 'synthetic', '2026-10-22T10:00:00Z'::timestamptz+n*interval '30 minutes', null,
    '{"_provenance":{"kind":"synthetic"}}'::jsonb, '{}', '[]'::jsonb
  from generate_series(0,4) as n;
  items := public.read_station_measurements('synthetic-kind-sql-test','history','24h','captured_at','2026-10-22T13:00:00Z',100,null,null);
  if jsonb_array_length(items) <> 5 or exists (
    select 1 from jsonb_array_elements(items) as item where item->>'acquisition_kind' <> 'synthetic' or item->>'measured_at' is not null
  ) then raise exception 'Tipo sintetico o storico non corretti'; end if;
  items := public.read_station_measurements('synthetic-kind-sql-test','latest','24h','captured_at','2026-10-22T13:00:00Z',100,null,null);
  if jsonb_array_length(items) <> 1 or (items->0->>'temperature_c')::float8 <> 18.4 then
    raise exception 'Ultimo campione sintetico non corretto'; end if;
  items := public.read_station_measurements('synthetic-kind-sql-test','history','24h','measured_at','2026-10-22T13:00:00Z',100,null,null);
  if items <> '[]'::jsonb then raise exception 'Sintetici esposti come misure fisiche'; end if;
  begin
    insert into public.station_measurements
      (source_id,ingestion_id,schema_version,arduino_seconds,acquisition_kind,captured_at,payload,raw_payload,quality_flags)
    values ('synthetic-kind-sql-test',gen_random_uuid(),1,0,'synthetic',now(),'{}','{}','[]');
    raise exception 'Provenienza mancante accettata';
  exception when check_violation then null; end;
end; $$;
rollback;
