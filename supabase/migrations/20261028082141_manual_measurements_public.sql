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

  if p_view = 'latest' then
    select coalesce(jsonb_agg(to_jsonb(latest_row)), '[]'::jsonb)
      into result from (
        select ingestion_id, temperature_c, humidity_pct, pressure_hpa,
          captured_at, measured_at, received_at, quality_flags, acquisition_kind,
          case when payload->>'_entry_method' = 'manual' then 'manual' else null end as entry_method
        from public.station_measurements
        where source_id = p_source_id
          and acquisition_kind in ('live', 'historical')
        order by coalesce(measured_at, captured_at, received_at) desc, ingestion_id desc
        limit 1
      ) latest_row;
    return result;
  end if;

  if p_period = 'all' then
    select coalesce(jsonb_agg(to_jsonb(selected) - 'sort_time' order by sort_time, ingestion_id), '[]'::jsonb)
      into result from (
        select ingestion_id, temperature_c, humidity_pct, pressure_hpa,
          captured_at, measured_at, received_at, quality_flags, acquisition_kind,
          case when payload->>'_entry_method' = 'manual' then 'manual' else null end as entry_method,
          coalesce(captured_at, received_at) as sort_time
        from public.station_measurements
        where source_id = p_source_id
          and coalesce(captured_at, received_at) <= p_until
          and (p_after_time is null or (coalesce(captured_at, received_at), ingestion_id) > (p_after_time, p_after_id))
        order by coalesce(captured_at, received_at), ingestion_id
        limit p_limit + 1
      ) selected;
    return result;
  end if;

  start_at := p_until - case p_period when '24h' then interval '24 hours'
    when '7g' then interval '168 hours' else interval '720 hours' end;

  if p_basis = 'captured_at' then
    select coalesce(jsonb_agg(to_jsonb(selected) - 'sort_time' order by sort_time, ingestion_id), '[]'::jsonb)
      into result from (
        select ingestion_id, temperature_c, humidity_pct, pressure_hpa,
          captured_at, measured_at, received_at, quality_flags, acquisition_kind,
          case when payload->>'_entry_method' = 'manual' then 'manual' else null end as entry_method,
          case when acquisition_kind = 'historical' and payload->>'_entry_method' = 'manual'
            then measured_at else captured_at end as sort_time
        from public.station_measurements
        where source_id = p_source_id
          and (
            (acquisition_kind in ('live', 'synthetic') and captured_at between start_at and p_until)
            or (acquisition_kind = 'historical' and payload->>'_entry_method' = 'manual'
              and measured_at between start_at and p_until)
          )
          and (p_after_time is null or (
            case when acquisition_kind = 'historical' and payload->>'_entry_method' = 'manual'
              then measured_at else captured_at end, ingestion_id
          ) > (p_after_time, p_after_id))
        order by sort_time, ingestion_id
        limit p_limit + 1
      ) selected;
    return result;
  end if;

  select coalesce(jsonb_agg(to_jsonb(selected) - 'sort_time' order by sort_time, ingestion_id), '[]'::jsonb)
    into result from (
      select ingestion_id, temperature_c, humidity_pct, pressure_hpa,
        captured_at, measured_at, received_at, quality_flags, acquisition_kind,
        case when payload->>'_entry_method' = 'manual' then 'manual' else null end as entry_method,
        measured_at as sort_time
      from public.station_measurements
      where source_id = p_source_id and acquisition_kind in ('live', 'historical')
        and measured_at between start_at and p_until
        and (p_after_time is null or (measured_at, ingestion_id) > (p_after_time, p_after_id))
      order by measured_at, ingestion_id
      limit p_limit + 1
    ) selected;
  return result;
end;
$$;

commit;
