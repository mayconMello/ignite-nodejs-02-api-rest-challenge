import fastify from 'fastify'

import cookie from '@fastify/cookie'
import { accountsRoutes } from './routes/users'
import { mealsRoutes } from './routes/meals'

export const app = fastify()

app.addHook('preHandler', async (request) => {
  console.log(`[${request.method}] ${request.url}`)
})

app.register(cookie)

app.register(accountsRoutes, {
  prefix: 'users',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})
