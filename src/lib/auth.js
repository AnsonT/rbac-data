import bcrypt from 'bcryptjs'
import uuid from 'uuid/v4'
import { getUserByNameOrEmail } from './users'
import { ROOT_TENANT } from './constants'

export async function createLogin (tx, userId, password) {
  const salt = bcrypt.genSaltSync(10)
  const passwordHash = bcrypt.hashSync(password, salt)
  const loginId = uuid()
  await tx
    .insert({ loginId, userId, passwordHash })
    .into('logins')
  return { loginId, userId }
}

export async function verifyLogin (tx, userName, password, { tenantId = ROOT_TENANT, loginIp } = {}) {
  const user = await getUserByNameOrEmail(tx, { tenantId, userName })
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
    return { user: success ? user : undefined, success }
  }
  return { success: false }
}

export async function loginAttempt (tx, userId, success, loginIp) {
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

export async function requestPasswordReset (tx, { userName, email, requestIp }) {}

export async function resetPassword (tx, requestCode, newPassword, { clientIp }) {}
