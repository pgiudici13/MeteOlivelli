-- Le osservazioni precedenti restano prive di fenomeno, senza valori inventati.
alter table public.manual_weather_conditions
  add column phenomenon text
    check (phenomenon is null or phenomenon in ('nessuna', 'pioviggine', 'pioggia', 'neve', 'grandine', 'altro')),
  add column phenomenon_detail text,
  add constraint manual_conditions_phenomenon_detail_check check (
    (phenomenon = 'altro' and phenomenon_detail is not null and char_length(trim(phenomenon_detail)) between 1 and 100)
    or (phenomenon is distinct from 'altro' and phenomenon_detail is null)
  ),
  add constraint manual_conditions_no_phenomenon_rain_check check (phenomenon is distinct from 'nessuna' or rain = 'assente');
