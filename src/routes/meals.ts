import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  checkSessionIdExists,
  SessionUserRequest,
} from '../middlewares/check-session-id-exists'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: SessionUserRequest, reply) => {
      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        is_within_diet: z.boolean(),
        date: z.string(),
      })

      const {
        name,
        description,
        is_within_diet: isWithinDiet,
        date,
      } = createMealsBodySchema.parse(request.body)

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        is_within_diet: isWithinDiet,
        date,
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    },
  )
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: SessionUserRequest) => {
      const meals = await knex('meals')
        .where({
          user_id: request.user?.id,
        })
        .select()

      return { meals }
    },
  )
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: SessionUserRequest, reply) => {
      const createMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = createMealsParamsSchema.parse(request.params)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({
          error: 'Not Found',
        })
      }

      return { meal }
    },
  )
  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: SessionUserRequest, reply) => {
      const createMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = createMealsParamsSchema.parse(request.params)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({
          error: 'Not Found',
        })
      }

      await knex('meals').where({ id }).del()

      return reply.status(204).send()
    },
  )
  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: SessionUserRequest, reply) => {
      const createMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = createMealsParamsSchema.parse(request.params)

      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        is_within_diet: z.boolean(),
        date: z.string(),
      })

      const {
        name,
        description,
        is_within_diet: isWithinDiet,
        date,
      } = createMealsBodySchema.parse(request.body)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({
          error: 'Not Found',
        })
      }

      await knex('meals').where({ id }).update({
        name,
        description,
        is_within_diet: isWithinDiet,
        date,
      })

      return reply.status(200).send()
    },
  )
  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request: SessionUserRequest, reply) => {
      const totalMealsOnDiet = await knex('meals')
        .where({ user_id: request.user?.id, is_within_diet: true })
        .count('id', { as: 'total' })
        .first()

      const totalMealsOffDiet = await knex('meals')
        .where({ user_id: request.user?.id, is_within_diet: false })
        .count('id', { as: 'total' })
        .first()

      const totalMeals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.is_within_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalMeals.length,
        totalMealsOnDiet: totalMealsOnDiet?.total,
        totalMealsOffDiet: totalMealsOffDiet?.total,
        bestOnDietSequence,
      })
    },
  )
}
