import Fastify from 'fastify'
import { getLastXHeartbeats, getLatestHeartbeat, init, setHeartbeat } from './db'
import { Key, Port } from './env'
import { tryPostUpdate } from './rtc'

const fastify = Fastify({
  logger: true
})

const validOrigins = [
  "nobu.sh",
  "localhost",
]

function hasValidOrigin(hostname: string): boolean {
  return validOrigins.some((origin) => hostname.endsWith(origin))
}

fastify.addHook('preHandler', (request, reply, done) => {
  const _origin = request.headers.origin
  const origin = _origin ? new URL(_origin) : null

  if (origin && hasValidOrigin(origin.hostname)) {
    reply.header("Access-Control-Allow-Origin", _origin!)
    reply.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
    reply.header("Access-Control-Allow-Headers", "Content-Type")
  }

  done()
})

fastify.get('/', async () => {
  return await getLatestHeartbeat()
})

fastify.get<{ Params: { x: string } }>('/:x', {
  schema: {
    params: {
      type: 'object',
      properties: {
        x: { type: 'string' }
      }
    }
  }
}, async (request) => {
  const x = parseInt(request.params.x)

  if (isNaN(x)) {
    return { "error": "Invalid number!" }
  }

  if (x < 1) {
    return { "error": "Must be more than 0!" }
  }

  if (x > 101) {
    return { "error": "Must be 100 or less!" }
  }

  return {
    data: await getLastXHeartbeats(x)
  }
})

fastify.post<{ Body: { bpm: number } }>(`/${Key}`, {
  schema: {
    body: {
      type: 'object',
      properties: {
        bpm: { type: 'number' }
      }
    }
  }
}, async (request) => {
  const bpm = request.body.bpm
  
  if (isNaN(bpm)) {
    return { "error": "Invalid number!" }
  }

  const timestamp = Date.now()
  await setHeartbeat(bpm, timestamp)
  await tryPostUpdate(bpm, timestamp)
  
  return { bpm, timestamp }
})

async function main() {
  await init()
  await fastify.listen({ port: Port })
}

main().catch(err => {
  fastify.log.error(err)
  process.exit(1)
})
