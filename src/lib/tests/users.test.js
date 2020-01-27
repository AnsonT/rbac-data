import knex from './db'
import { createUser, getUserById, getUserByNameOrEmail } from './../users'

const user1 = {
  userName: 'User1',
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
    expect(userName).toBe(user1.userName.toLowerCase())
    done()
  })
  it('getUser by name successful', async (done) => {
    const { userName, email } = await getUserByNameOrEmail(knex, { userName: user1.userName })
    expect(userName).toBe(user1.userName.toLowerCase())
    expect(email).toBe(user1.email.toLowerCase())
    done()
  })
  it('getUser by email successful', async (done) => {
    const { userName, email } = await getUserByNameOrEmail(knex, { email: user1.email })
    expect(userName).toBe(user1.userName.toLowerCase())
    expect(email).toBe(user1.email.toLowerCase())
    done()
  })
  it('getUser by id successful', async (done) => {
    const { userId } = await getUserByNameOrEmail(knex, { userName: user1.userName })
    const user = await getUserById(knex, userId)
    expect(user.userName).toBe(user1.userName.toLowerCase())
    expect(user.email).toBe(user1.email.toLowerCase())
    done()
  })
  it('duplicate createUser to throw', async (done) => {
    await expect(createUser(knex, user1)).rejects.toThrow()
    done()
  })
  it('fails to create user with uuid formatted userName', async done => {
    await expect(createUser(knex, { userName: '129c4a2f-3c86-4c42-a175-908ee01176c7', email: 'test@test.com' })).rejects.toThrow()
    done()
  })
  it('fails to create user invalid email', async done => {
    await expect(createUser(knex, { userName: 'test2', email: 'invalidemail' })).rejects.toThrow()
    done()
  })
})
