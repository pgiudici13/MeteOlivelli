begin;

-- Le scritture amministrative sono invocate solo dal server con service_role.
grant update, delete on public.station_measurements to service_role;

create table public.station_measurement_admin_audit (
  id bigint generated always as identity primary key,
  source_id text not null,
  ingestion_id uuid not null,
  action text not null check (action in ('updated', 'deleted')),
  changed_at timestamptz not null default clock_timestamp()
);
alter table public.station_measurement_admin_audit enable row level security;
revoke all on public.station_measurement_admin_audit from public, anon, authenticated, service_role;
grant insert on public.station_measurement_admin_audit to service_role;

create function public.admin_update_station_measurement(
  p_measurement jsonb, p_quality_flags jsonb
) returns boolean
language plpgsql volatile security invoker set search_path = '' as $$
declare
  changed integer;
begin
  update public.station_measurements set
    arduino_seconds = (p_measurement->>'arduino_seconds')::double precision,
    temperature_c = (p_measurement->>'temperature_c')::double precision,
    humidity_pct = (p_measurement->>'humidity_pct')::double precision,
    pressure_hpa = (p_measurement->>'pressure_hpa')::double precision,
    captured_at = (p_measurement->>'captured_at')::timestamptz,
    measured_at = (p_measurement->>'measured_at')::timestamptz,
    payload = p_measurement,
    quality_flags = p_quality_flags
  where source_id = p_measurement->>'source_id'
    and ingestion_id = (p_measurement->>'ingestion_id')::uuid;
  get diagnostics changed = row_count;
  if changed = 1 then
    insert into public.station_measurement_admin_audit (source_id, ingestion_id, action)
    values (p_measurement->>'source_id', (p_measurement->>'ingestion_id')::uuid, 'updated');
  end if;
  return changed = 1;
end;
$$;

create function public.admin_delete_station_measurement(p_source_id text, p_ingestion_id uuid)
returns boolean
language plpgsql volatile security invoker set search_path = '' as $$
declare
  removed integer;
begin
  delete from public.station_measurements
  where source_id = p_source_id and ingestion_id = p_ingestion_id;
  get diagnostics removed = row_count;
  if removed = 1 then
    insert into public.station_measurement_admin_audit (source_id, ingestion_id, action)
    values (p_source_id, p_ingestion_id, 'deleted');
  end if;
  return removed = 1;
end;
$$;

revoke all on function public.admin_update_station_measurement(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.admin_delete_station_measurement(text, uuid) from public, anon, authenticated;
grant execute on function public.admin_update_station_measurement(jsonb, jsonb) to service_role;
grant execute on function public.admin_delete_station_measurement(text, uuid) to service_role;

commit;
