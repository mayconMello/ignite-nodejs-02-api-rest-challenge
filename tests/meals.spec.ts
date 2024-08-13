import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'

async function createUser() {
  const createUserResponse = await request(app.server).post('/users').send({
    name: 'Jhon Doe',
    email: 'jhondoe@example.com',
  })
  const cookies = createUserResponse.headers['set-cookie']
  return cookies
}

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  }, 20000)

  beforeEach(() => {
    execSync('pnpm run knex migrate:rollback --all')
    execSync('pnpm run knex migrate:latest')
  }, 20000)

  it('should be able to create a new meal', async () => {
    const sessionCookies = await createUser()
    await request(app.server)
      .post('/meals')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: true,
        date: new Date().toISOString(),
      })
      .expect(201)
  })
  it('should be able to list all meals', async () => {
    const sessionCookies = await createUser()
    await request(app.server)
      .post('/meals')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: true,
        date: new Date().toISOString(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', sessionCookies)
      .expect(200)
    expect(listMealsResponse.body).toEqual({
      meals: [
        expect.objectContaining({
          name: 'Bread',
          description: 'Breakfast',
          is_within_diet: 1,
        }),
      ],
    })
  })
  it('should be able to get a specific meal', async () => {
    const sessionCookies = await createUser()
    await request(app.server)
      .post('/meals')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: true,
        date: new Date().toISOString(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', sessionCookies)
      .expect(200)
    const mealId = listMealsResponse.body.meals[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', sessionCookies)
      .expect(200)

    expect(getTransactionResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: 1,
      }),
    })
  })
  it('should be able to delete a specific transaction', async () => {
    const sessionCookies = await createUser()
    await request(app.server)
      .post('/meals')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: true,
        date: new Date().toISOString(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', sessionCookies)
      .expect(200)
    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', sessionCookies)
      .expect(204)
  })
  it('should be able to update a specific transaction', async () => {
    const sessionCookies = await createUser()
    await request(app.server)
      .post('/meals')
      .set('Cookie', sessionCookies)
      .send({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: true,
        date: new Date().toISOString(),
      })
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', sessionCookies)
      .expect(200)
    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', sessionCookies)
      .send({
        name: 'Bread',
        description: 'Breakfast',
        is_within_diet: false,
        date: new Date().toISOString(),
      })
      .expect(200)
  })
  afterAll(async () => {
    await app.close()
  }, 20000)
})
