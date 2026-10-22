-- Da eseguire SOLO nel target autorizzato, dopo la migrazione:
-- psql "$METEO_TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/tests/station_backend.sql
-- La connessione deve appartenere all'amministratore del DB di prova.
-- Fixture sintetiche; nessun dato della stazione. Nessun effetto persistente.
begin;
set local timezone = 'UTC';

-- Privilegi effettivi (distinti dalla sola presenza di RLS).
do $$
declare r text;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.station_measurements'::regclass) then
    raise exception 'RLS non abilitata';
  end if;
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.station_measurements', 'SELECT,INSERT,UPDATE,DELETE')
      or has_function_privilege(r, 'public.ingest_station_measurement(jsonb,jsonb,text)', 'EXECUTE')
      or has_function_privilege(r, 'public.read_station_measurements(text,text,text,text,timestamptz,integer,timestamptz,uuid)', 'EXECUTE') then
      raise exception 'Privilegi pubblici inattesi: %', r;
    end if;
  end loop;
  if has_table_privilege('service_role', 'public.station_measurements', 'UPDATE,DELETE,TRUNCATE') then
    raise exception 'Privilegi server eccessivi sulla tabella';
  end if;
end;
$$;

set local role anon;
do $$ begin
  begin
    perform 1 from public.station_measurements;
    raise exception 'SELECT anon consentita';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.station_measurements default values;
    raise exception 'INSERT anon consentita';
  exception when insufficient_privilege then null; end;
  begin
    update public.station_measurements set temperature_c = 1;
    raise exception 'UPDATE anon consentita';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.station_measurements;
    raise exception 'DELETE anon consentita';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform public.ingest_station_measurement('{}', '[]', '{}');
    raise exception 'RPC autenticata consentita';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;

set local role service_role;
do $$
declare
  fixture jsonb := '{"schema_version":1,"source_id":"fixture-sintetica-be05","ingestion_id":"12345678-1234-4234-8234-123456789abc","arduino_seconds":1,"temperature_c":21,"humidity_pct":120,"pressure_hpa":1013,"acquisition_kind":"live","captured_at":"2026-10-22T08:00:00.000Z","measured_at":null}';
  first_result jsonb;
  result jsonb;
  items jsonb;
begin
  first_result := public.ingest_station_measurement(fixture, '[]', fixture::text);
  if first_result->>'status' <> 'accepted' then raise exception 'Prima accettazione fallita'; end if;
  result := public.ingest_station_measurement(fixture, '[]', fixture::text);
  if result->>'status' <> 'duplicate' or result->>'received_at' <> first_result->>'received_at' then
    raise exception 'Retry non idempotente';
  end if;
  result := public.ingest_station_measurement(fixture || '{"temperature_c":22}', '[]', '{}');
  if result->>'status' <> 'conflict' then raise exception 'Conflitto non rilevato'; end if;
  result := public.ingest_station_measurement(fixture || '{"ingestion_id":"22345678-1234-4234-8234-123456789abc"}', '[]', '{}');
  if result->>'status' <> 'accepted' then raise exception 'Misure uguali con ID diversi perse'; end if;
  result := public.ingest_station_measurement(fixture || '{"ingestion_id":"32345678-1234-4234-8234-123456789abc","acquisition_kind":"historical","captured_at":null}', '[]', '{}');
  items := public.read_station_measurements('fixture-sintetica-be05', 'latest', '24h', 'captured_at', '2026-10-22T09:00:00Z', 100, null, null);
  if jsonb_array_length(items) <> 1 or items->0->>'ingestion_id' <> '22345678-1234-4234-8234-123456789abc' then
    raise exception 'Ultimo evento o spareggio non corretto';
  end if;
  if items->0 ? 'raw_payload' or items->0 ? 'payload' or items->0 ? 'arduino_seconds' then
    raise exception 'Colonna interna esposta';
  end if;
  items := public.read_station_measurements('fixture-sintetica-be05', 'history', '24h', 'captured_at', '2026-10-22T09:00:00Z', 1, null, null);
  if jsonb_array_length(items) <> 2 then raise exception 'Lookahead paginazione non corretto'; end if;
  items := public.read_station_measurements('fixture-sintetica-be05', 'history', '24h', 'captured_at', '2026-10-22T09:00:00Z', 1, '2026-10-22T08:00:00Z', '12345678-1234-4234-8234-123456789abc');
  if jsonb_array_length(items) <> 1 or items->0->>'ingestion_id' <> '22345678-1234-4234-8234-123456789abc' then
    raise exception 'Cursore a parità di ora non corretto';
  end if;
  items := public.read_station_measurements('fixture-sintetica-be05', 'history', '24h', 'measured_at', '2026-10-22T09:00:00Z', 100, null, null);
  if items <> '[]'::jsonb then raise exception 'Date di misura inventate'; end if;
  begin
    perform public.ingest_station_measurement(fixture || '{"ingestion_id":"42345678-1234-4234-8234-123456789abc","captured_at":null}', '[]', '{}');
    raise exception 'Vincolo tempo non applicato';
  exception when check_violation then null; end;
  begin
    perform public.ingest_station_measurement(fixture || '{"ingestion_id":"52345678-1234-4234-8234-123456789abc","pressure_hpa":"NaN"}', '[]', '{}');
    raise exception 'Numero non finito ammesso';
  exception when check_violation then null; end;
end;
$$;
reset role;
rollback;
