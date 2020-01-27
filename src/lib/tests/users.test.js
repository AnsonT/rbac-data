import knex from './db'
import { createUser } from './../users'

const user1 = {
  userName: 'user1',
  email: 'user1@example.localhost',
  password: 'password'
}

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
    const { userId, userName } = await createUser(knex, user1)
    expect(userId).not.toBeNull()
    expect(userName).toBe(user1.userName)
    done()
  })
  it('duplicate createUser to throw', async (done) => {
    await expect(createUser(knex, user1)).rejects.toThrow()
    done()
  })
})
