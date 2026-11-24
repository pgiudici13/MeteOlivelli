import { createHandler } from './handler.ts'

Deno.serve(createHandler((name) => Deno.env.get(name)))
