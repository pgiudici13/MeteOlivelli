-- Cronologia completa: i campioni senza captured_at usano received_at solo per ordinamento.
begin;
create or replace function public.read_station_measurements(
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
    or p_period not in ('24h', '7g', '30g', 'all') or p_period is null
    or (p_period = 'all' and (p_view <> 'history' or p_basis <> 'captured_at'))
    or p_limit is null or p_limit < 1 or p_limit > 500
    or p_until is null or not isfinite(p_until)
    or ((p_after_time is null) <> (p_after_id is null)) then
    raise exception 'Parametri non validi' using errcode = '22023';
  end if;
  start_at := case p_period when '24h' then p_until - interval '24 hours'
    when '7g' then p_until - interval '168 hours'
    when '30g' then p_until - interval '720 hours' else null end;
  select coalesce(jsonb_agg(to_jsonb(selected) - 'sort_time' order by sort_time, ingestion_id), '[]'::jsonb)
    into result from (
      select ingestion_id, temperature_c, humidity_pct, pressure_hpa,
        captured_at, measured_at, received_at, quality_flags, acquisition_kind,
        case when p_period = 'all' then coalesce(captured_at, received_at)
          when p_view = 'latest' or p_basis = 'captured_at' then captured_at
          else measured_at end as sort_time
      from public.station_measurements
      where source_id = p_source_id and (
        (p_view = 'latest' and acquisition_kind in ('live', 'synthetic')) or
        (p_view = 'history' and (
          (p_period = 'all' and coalesce(captured_at, received_at) <= p_until
            and (p_after_time is null or (coalesce(captured_at, received_at), ingestion_id) > (p_after_time, p_after_id))) or
          (p_period <> 'all' and p_basis = 'captured_at' and acquisition_kind in ('live', 'synthetic')
            and captured_at between start_at and p_until
            and (p_after_time is null or (captured_at, ingestion_id) > (p_after_time, p_after_id))) or
          (p_period <> 'all' and p_basis = 'measured_at' and measured_at between start_at and p_until
            and (p_after_time is null or (measured_at, ingestion_id) > (p_after_time, p_after_id)))
        ))
      )
      order by
        case when p_view = 'latest' then acquisition_kind = 'live' end desc,
        case when p_view = 'latest' then captured_at end desc,
        case when p_view = 'latest' then ingestion_id end desc,
        case when p_period = 'all' then coalesce(captured_at, received_at)
          when p_basis = 'captured_at' then captured_at else measured_at end,
        ingestion_id
      limit case when p_view = 'latest' then 1 else p_limit + 1 end
    ) selected;
  return result;
end;
$$;
commit;
