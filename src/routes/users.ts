import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'

export async function accountsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createAccountBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })
    const { name, email } = createAccountBodySchema.parse(request.body)

    const user = await knex('users').where({ email }).first()

    if (user) {
      return reply.status(401).send({
        error: 'User already exists',
      })
    }

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 Days,
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
