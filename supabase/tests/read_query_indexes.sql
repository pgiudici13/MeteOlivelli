-- AUD-11: regressione della RPC riscritta e presenza degli indici.
-- Da eseguire SOLO nel target autorizzato, DOPO l'applicazione della migrazione:
-- psql "$METEO_TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/tests/read_query_indexes.sql
-- Fixture sintetiche; nessun dato della stazione. Termina con ROLLBACK.
begin;
set local timezone = 'UTC';

do $$
begin
  if not exists (select 1 from pg_indexes where schemaname = 'public'
                 and indexname = 'station_measurements_latest_idx') then
    raise exception 'Indice latest assente';
  end if;
  if not exists (select 1 from pg_indexes where schemaname = 'public'
                 and indexname = 'station_measurements_all_idx') then
    raise exception 'Indice all assente';
  end if;
end;
$$;

set local role service_role;
do $$
declare
  fixture jsonb := '{"schema_version":1,"source_id":"fixture-sintetica-aud11","ingestion_id":"12345678-1234-4234-8234-123456789abc","arduino_seconds":1,"temperature_c":21,"humidity_pct":55,"pressure_hpa":1013,"acquisition_kind":"live","captured_at":"2026-10-22T08:00:00.000Z","measured_at":null}';
  items jsonb;
  cursor_time text;
  until_now timestamptz;
begin
  -- A live 08:00, B live 09:00, C synthetic 10:00, D storico non datato, E con sola ora di misura.
  if (public.ingest_station_measurement(fixture, '[]', '{}'))->>'status' <> 'accepted' then
    raise exception 'Fixture A non accettata';
  end if;
  perform public.ingest_station_measurement(
    fixture || '{"ingestion_id":"22345678-1234-4234-8234-123456789abc","captured_at":"2026-10-22T09:00:00.000Z"}', '[]', '{}');
  perform public.ingest_station_measurement(
    fixture || '{"ingestion_id":"32345678-1234-4234-8234-123456789abc","acquisition_kind":"synthetic","captured_at":"2026-10-22T10:00:00.000Z"}', '[]', '{}');
  perform public.ingest_station_measurement(
    fixture || '{"ingestion_id":"42345678-1234-4234-8234-123456789abc","acquisition_kind":"historical","captured_at":null}', '[]', '{}');
  perform public.ingest_station_measurement(
    fixture || '{"ingestion_id":"52345678-1234-4234-8234-123456789abc","acquisition_kind":"historical","captured_at":null,"measured_at":"2026-10-22T07:30:00.000Z"}', '[]', '{}');
  -- I record non datati ordinano su received_at: serve un'ancora successiva agli inserimenti.
  until_now := clock_timestamp();

  -- latest: la priorità live prevale sul sintetico più recente.
  items := public.read_station_measurements('fixture-sintetica-aud11', 'latest', '24h', 'captured_at', until_now, 100, null, null);
  if jsonb_array_length(items) <> 1 or items->0->>'ingestion_id' <> '22345678-1234-4234-8234-123456789abc' then
    raise exception 'latest: priorità live o ordinamento non corretti';
  end if;

  -- finestre per captured_at: solo tipi con acquisizione, in ordine crescente.
  items := public.read_station_measurements('fixture-sintetica-aud11', 'history', '24h', 'captured_at', until_now, 100, null, null);
  if jsonb_array_length(items) <> 3
    or items->0->>'ingestion_id' <> '12345678-1234-4234-8234-123456789abc'
    or items->2->>'ingestion_id' <> '32345678-1234-4234-8234-123456789abc' then
    raise exception 'Finestra captured_at: selezione o ordinamento non corretti';
  end if;

  -- finestre per measured_at: solo il campione con ora di misura attestata.
  items := public.read_station_measurements('fixture-sintetica-aud11', 'history', '24h', 'measured_at', until_now, 100, null, null);
  if jsonb_array_length(items) <> 1 or items->0->>'ingestion_id' <> '52345678-1234-4234-8234-123456789abc' then
    raise exception 'Finestra measured_at: selezione non corretta';
  end if;

  -- all: include i non datati, ordinati per coalesce(captured_at, received_at).
  items := public.read_station_measurements('fixture-sintetica-aud11', 'history', 'all', 'captured_at', until_now, 500, null, null);
  if jsonb_array_length(items) <> 5
    or items->0->>'ingestion_id' <> '12345678-1234-4234-8234-123456789abc'
    or items->3->>'ingestion_id' <> '42345678-1234-4234-8234-123456789abc'
    or items->4->>'ingestion_id' <> '52345678-1234-4234-8234-123456789abc' then
    raise exception 'Cronologia all: selezione o ordinamento non corretti';
  end if;

  -- paginazione all con lookahead e cursore (tempo+UUID).
  items := public.read_station_measurements('fixture-sintetica-aud11', 'history', 'all', 'captured_at', until_now, 2, null, null);
  if jsonb_array_length(items) <> 3 then raise exception 'Lookahead paginazione all assente'; end if;
  cursor_time := items->1->>'captured_at';
  if cursor_time is null then cursor_time := items->1->>'received_at'; end if;
  items := public.read_station_measurements('fixture-sintetica-aud11', 'history', 'all', 'captured_at', until_now, 2,
    cursor_time::timestamptz, (items->1->>'ingestion_id')::uuid);
  if jsonb_array_length(items) <> 3 or items->0->>'ingestion_id' <> '32345678-1234-4234-8234-123456789abc' then
    raise exception 'Cursore all non corretto';
  end if;

  -- parametri: invariati rispetto alla versione precedente.
  begin
    perform public.read_station_measurements('fixture-sintetica-aud11', 'history', 'all', 'measured_at', until_now, 100, null, null);
    raise exception 'Combinazione all/measured_at ammessa';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.read_station_measurements('fixture-sintetica-aud11', 'latest', '24h', 'captured_at', until_now, 501, null, null);
    raise exception 'Limite pagina non validato';
  exception when invalid_parameter_value then null; end;
end;
$$;
reset role;
rollback;
