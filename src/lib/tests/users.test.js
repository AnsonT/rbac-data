import _ from 'lodash'
import { createUser, getUserById, listUsers, removeUser, updateUser, getUsersByEmail, getUserByName } from './../users'
import { UnitTestDb } from './db'

const user1 = {
  userName: 'User1',
  email: 'user1@example.localhost',
  password: 'password'
}

describe('Users Tests', () => {
  const db = new UnitTestDb()
  let knex = null

  beforeAll(async (done) => {
    try {
      await db.initialize('users')
      knex = db.knex
    } catch (e) {
      console.error(e)
    }
    done()
  })
  afterAll(async (done) => {
    await db.cleanup()
    done()
  })

  it('listUsers', async (done) => {
    const omitTimestamps = (users) => _.map(users, user => _.omit(user, ['createdAt', 'modifiedAt', 'emailVerifiedAt']))
    let offset = 0
    const limit = 3
    while (true) {
      const ret = await listUsers(knex, { offset, limit })
      console.log(ret)
      expect(ret.total).toMatchSnapshot()
      expect(ret.offset).toMatchSnapshot()
      expect(ret.limit).toMatchSnapshot()

      const users = omitTimestamps(ret.users)
      expect(users).toMatchSnapshot()
      offset += limit
      if (users.length < limit) {
        break
      }
    }
    done()
  })

  it('createUser without crashing', async (done) => {
    const { userId, userName } = await createUser(knex, user1)
    expect(userId).not.toBeNull()
    expect(userName).toBe(user1.userName.toLowerCase())
    done()
  })
  it('getUser by name successful', async (done) => {
    const { userName, email } = await getUserByName(knex, { userName: user1.userName })
    expect(userName).toBe(user1.userName.toLowerCase())
    expect(email).toBe(user1.email.toLowerCase())
    done()
  })
  it('getUser by email successful', async (done) => {
    const users = await getUsersByEmail(knex, { email: user1.email })
    expect(users.length).toBe(1)
    const { email, userName } = users[0]
    expect(userName).toBe(user1.userName.toLowerCase())
    expect(email).toBe(user1.email.toLowerCase())
    done()
  })
  it('getUser by id successful', async (done) => {
    const { userId } = await getUserByName(knex, { userName: user1.userName })
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
  it('updates user succeeds', async done => {
    const { userId } = await getUserByName(knex, { userName: user1.userName })
    const { count } = await updateUser(knex, userId, { email: 'newuser1@example.localhost' })
    expect(count).toBe(1)
    done()
  })
  it('remove user succeeds', async done => {
    const { userId } = await getUserByName(knex, { userName: user1.userName })
    const { count } = await removeUser(knex, userId)
    expect(count).toBe(1)
    done()
  })
})
