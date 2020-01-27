import knex from './db'
import { createUser } from './../users'

describe('Users Tests', () => {
  beforeAll(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
    // await knex.seed.run()
  })
  afterAll(async done => {
    await knex.destroy()
  })

  it('createUser without crashing', async (done) => {
    const { userId, userName } = await createUser(knex, { userName: 'test', email: 'test@test.com', password: 'password' })
    expect(userId).not.toBeNull()
    expect(userName).toBe('test')
    done()
  })
})
