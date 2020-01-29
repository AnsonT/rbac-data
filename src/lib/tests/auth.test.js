import { UnitTestDb } from './db'
import { createLogin, verifyLogin, loginAttempt, getLastLoginAttempts } from '../auth'
import { createUser, getUserByNameOrEmail } from '../users'

describe('Aunt Tests', () => {
  const db = new UnitTestDb()
  let knex = null

  beforeAll(async (done) => {
    await db.initialize('auth')
    knex = db.knex
    done()
  })
  afterAll(async (done) => {
    await db.cleanup()
    done()
  })
  it('createLogin without crashing', async (done) => {
    const { userId } = await createUser(knex, { userName: 'testAuth', email: 'testAuth@example.localhost' })
    const { loginId } = await createLogin(knex, userId, 'password')
    expect(loginId).not.toBeNull()
    done()
  })
  it('verifyLogin succeeds', async (done) => {
    const { user, success } = await verifyLogin(knex, 'testAuth', 'password')
    expect(success).toBe(true)
    expect(user.userName).toBe('testauth')
    done()
  })
  it('verifyLogin fails', async (done) => {
    const { user, success } = await verifyLogin(knex, 'testAuth', 'badPassword')
    expect(success).toBe(false)
    expect(user).toBeFalsy()
    done()
  })
  it('loginAttempt succeeds', async (done) => {
    const { userId } = await getUserByNameOrEmail(knex, { userName: 'testAuth' })
    await loginAttempt(knex, userId, true, '127.0.0.1')
    await loginAttempt(knex, userId, false, '127.0.0.2')
    done()
  })
  it('getLoginAttempts succeeds', async (done) => {
    const { userId } = await getUserByNameOrEmail(knex, { userName: 'testAuth' })
    const attempts = await getLastLoginAttempts(knex, userId)
    expect(attempts.lastSuccessIp).toBe('127.0.0.1')
    expect(attempts.lastFailureIp).toBe('127.0.0.2')
    done()
  })
})
