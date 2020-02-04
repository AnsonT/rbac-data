import _ from 'lodash'
import short from 'short-uuid'
import moment from 'moment'
import bcrypt from 'bcryptjs'
import uuid from 'uuid/v4'
import { getUserByName, getUsersByEmail } from './users'
import { ROOT_TENANT } from './constants'
import { InvalidParameterError } from './errors'

export async function createLogin (tx, userId, password) {
  const salt = bcrypt.genSaltSync(10)
  const passwordHash = bcrypt.hashSync(password, salt)
  const loginId = uuid()
  await tx
    .insert({ loginId, userId, passwordHash })
    .into('logins')
  return { loginId, userId }
}

export async function isKnownLogin (tx, userId, { loginIp = '', cookies }) {
  const { count } = await tx
    .count()
    .where({ userId, success: true, loginIp })
    .from('loginAttempts')
    .first()
  return count > 0
}

export async function verifyLogin (tx, userName, password, { tenantId = ROOT_TENANT, loginIp, cookies } = {}) {
  const user = await getUserByName(tx, { tenantId, userName })
  if (user) {
    const { userId } = user
    const login = await tx
      .select()
      .from('logins')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .first()
    const { passwordHash } = login
    const success = bcrypt.compareSync(password, passwordHash)
    const isKnown = success && await isKnownLogin(tx, userId, { loginIp, cookies })
    await loginAttempt(tx, userId, success, { loginIp, cookies })
    return { user: success ? user : undefined, success, isKnown }
  }
  return { success: false }
}

export async function loginAttempt (tx, userId, success, { loginIp, cookies } = {}) {
  const loginAt = tx.fn.now()
  return tx
    .insert({ userId, success, loginIp, loginAt })
    .into('loginAttempts')
}

export async function getLastLoginAttempts (tx, userId) {
  const lastSuccess = await tx
    .select()
    .from('loginAttempts')
    .where({ userId, success: true })
    .orderBy('loginAt', 'desc')
    .first()
  const lastFailure = await tx
    .select()
    .from('loginAttempts')
    .where({ userId, success: false })
    .orderBy('loginAt', 'desc')
    .first()

  return {
    lastSuccessAt: lastSuccess && new Date(lastSuccess.loginAt),
    lastSuccessIp: lastSuccess?.loginIp || (lastSuccess ? '' : undefined),
    lastFailureAt: lastFailure && new Date(lastFailure.loginAt),
    lastFailureIp: lastFailure?.loginIp || (lastFailure ? '' : undefined)
  }
}

export async function requestPasswordReset (tx, { tenantId = ROOT_TENANT, userName, email, requestIp, requireVerifiedEmail } = {}) {
  if (userName && email) {
    throw new InvalidParameterError({ message: 'Cannot specify both userName and email' })
  }
  if (!userName && !email) {
    throw new InvalidParameterError({ message: 'One of userName or email must be specified' })
  }
  let users = userName && await getUserByName(tx, { tenantId, userName })
  users = !users && email ? await getUsersByEmail(tx, { tenantId, email }) : users
  users = _.castArray(users)
  users = _.compact(users)
  if (!users.length) {
    return { success: false, error: 'user not found' }
  }
  const requests = []
  for (const user of users) {
    const requestId = uuid()
    const requestCode = short().fromUUID(requestId)
    const requestAt = new Date()
    const expireAt = moment(requestAt).add(4, 'h').toDate()
    const { userId, emailVerifiedAt } = user

    if (!emailVerifiedAt) {
      return { success: false, error: 'email not verified' }
    }
    await tx
      .update({ expireAt: new Date() })
      .where({ userId })
      .into('passwordResetRequests')
    await tx
      .insert({ requestId, userId, requestCode, requestAt, expireAt, requestIp })
      .into('passwordResetRequests')
    requests.push({ userId, userName, email, requestCode })
  }
  return { success: true, requests }
}

export async function getPasswordResetRequests (tx, { since = 0, limit = 20, offset = 0 } = {}) {
  return tx
    .select()
    .from('passwordResetRequests')
    .where('requestAt', '>=', new Date(since))
    .where('expireAt', '>', tx.fn.now())
    .limit(limit)
    .offset(offset)
}

export async function resetPassword (tx, requestCode, newPassword, { clientIp, cookies } = {}) {
  const now = tx.fn.now()
  const requested = await tx
    .select()
    .from('passwordResetRequests')
    .where({ requestCode })
    .where('expireAt', '>', tx.fn.now())
    .first()
  if (requested) {
    if (!requested.resetAt) {
      const { userId } = requested
      await createLogin(tx, userId, newPassword)
      const resetAt = now
      await tx
        .where({ requestCode })
        .update({ resetAt })
        .into('passwordResetRequests')
      return true
    }
  }
  return false
}
