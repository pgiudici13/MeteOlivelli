import { requireEnvironmentVariable } from './config.ts'
import { createRestStore } from './database.ts'

/** Chiamare solo all'avvio della funzione server. Mai importare dal frontend. */
export function runtimeConfig() {
  const read = (name: string) => Deno.env.get(name)
  return {
    source: requireEnvironmentVariable(read, 'STATION_SOURCE_ID'),
    store: createRestStore(
      requireEnvironmentVariable(read, 'SUPABASE_URL'),
      requireEnvironmentVariable(read, 'SUPABASE_SERVICE_ROLE_KEY'),
    ),
  }
}
