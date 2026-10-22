export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

export class BodyError extends Error {
  constructor(public code: 'payload_too_large' | 'invalid_encoding' | 'body_timeout') {
    super(code)
  }
}

export async function readBody(request: Request): Promise<string> {
  const limit = 16384
  const declared = request.headers.get('content-length')
  if (declared && Number(declared) > limit) throw new BodyError('payload_too_large')
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let bytes = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new BodyError('body_timeout'))
        void reader.cancel().catch(() => {})
      }, 5000)
    })
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout])
      if (done) break
      bytes += value.byteLength
      if (bytes > limit) throw new BodyError('payload_too_large')
      chunks.push(value)
    }
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) {
      body.set(chunk, offset)
      offset += chunk.byteLength
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(body)
    } catch {
      throw new BodyError('invalid_encoding')
    }
  } finally {
    clearTimeout(timer)
    void reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
