import { UnitTestDb } from './db'
import { createLogin, verifyLogin, loginAttempt, getLastLoginAttempts, requestPasswordReset, getPasswordResetRequests, resetPassword } from '../auth'
import { createUser, getUserByName, listUsers } from '../users'

describe('Auth Tests', () => {
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
    const { userId } = await createUser(knex, {
      userName: 'testAuth',
      email: 'testAuth@example.localhost',
      emailVerifiedAt: new Date()
    })
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
  it('verifyLogin isKnown', async (done) => {
    const { isKnown: isKnownFirst } = await verifyLogin(knex, 'testAuth', 'password', { loginIp: '127.0.1.0' })
    expect(isKnownFirst).toBe(false)
    const { isKnown } = await verifyLogin(knex, 'testAuth', 'password', { loginIp: '127.0.1.0' })
    expect(isKnown).toBe(true)
    done()
  })
  it('loginAttempt succeeds', async (done) => {
    const { userId } = await getUserByName(knex, { userName: 'testAuth' })
    await loginAttempt(knex, userId, true, { loginIp: '127.0.0.1' })
    await loginAttempt(knex, userId, false, { loginIp: '127.0.0.2' })
    done()
  })
  it('getLoginAttempts succeeds', async (done) => {
    const { userId } = await getUserByName(knex, { userName: 'testAuth' })
    const attempts = await getLastLoginAttempts(knex, userId)
    expect(attempts.lastSuccessIp).toBe('127.0.0.1')
    expect(attempts.lastFailureIp).toBe('127.0.0.2')
    done()
  })
  it('requestPasswordReset by userName succeeds', async (done) => {
    const { success } = await requestPasswordReset(knex, { userName: 'testAuth' })
    expect(success).toBe(true)
    done()
  })
  it('requestPasswordReset by userName expires old', async (done) => {
    await requestPasswordReset(knex, { userName: 'testAuth' })
    await requestPasswordReset(knex, { userName: 'testAuth' })
    const requests = await getPasswordResetRequests(knex)
    expect(requests.length).toBe(1)
    done()
  })

  it('getPasswordResetRequests journal succeeds', async (done) => {
    const users = await listUsers(knex, { limit: 10 })
    for (let i = 0; i < users.length; i++) {
      const { success } = await requestPasswordReset(knex, { userName: users[i].userName })
      expect(success).toBe(true)
    }

    const requests = await getPasswordResetRequests(knex)
    const limit = 3
    const r = []
    let since = 0
    let last = null
    while (true) {
      const requests = await getPasswordResetRequests(knex, { since, limit: 3 })
      for (let i = 0; i < requests.length; i++) {
        if (requests[i].requestId !== last?.requestId) {
          r.push(requests[i])
        }
      }
      if (requests.length < limit) {
        break
      }
      last = requests[limit - 1]
      since = last.requestAt
    }
    expect(r.length).toBe(11)
    expect(r).toStrictEqual(requests)
    console.log(r[0])
    done()
  })
  it('resetPassword succeeds', async (done) => {
    const [request] = await getPasswordResetRequests(knex, { limit: 1 })
    const { requestCode } = request
    const resetSuccess = await resetPassword(knex, requestCode, 'password2')
    expect(resetSuccess).toBe(true)
    const { user, success } = await verifyLogin(knex, 'testAuth', 'password2')
    expect(success).toBe(true)
    expect(user.userName).toBe('testauth')

    const { success: success2 } = await verifyLogin(knex, 'testAuth', 'password')
    expect(success2).toBe(false)
    done()
  })
})
