import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'

describe('User routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  beforeEach(() => {
    execSync('pnpm run knex migrate:rollback --all')
    execSync('pnpm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Jhon Doe',
        email: 'jhondoe@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    expect(cookies).toEqual([expect.stringContaining('sessionId')])
  })

  afterAll(async () => {
    await app.close()
  })
})
