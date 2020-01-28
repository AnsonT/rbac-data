import uuid from 'uuid/v4'
import _ from 'lodash-uuid'
import emailValidator from 'email-validator'
import { InvalidParameterError } from './errors'
import { ROOT_TENANT } from './constants'

export async function createUser (tx, { tenantId, userName, email, emailVerifiedAt, needNewPassword } = {}) {
  if (_.isUuid(userName)) {
    throw new InvalidParameterError({ message: 'Invalid parameter: userName' })
  }
  if (!emailValidator.validate(email)) {
    throw new InvalidParameterError({ message: 'Invalid parameter: email' })
  }
  userName = userName.toLowerCase()
  email = email.toLowerCase()
  const userId = uuid()
  const resp = await tx
    .insert({
      userId,
      userName,
      email,
      emailVerifiedAt,
      needNewPassword
    })
    .into('users')
  if (resp.rowCount === 1) {
    return { userId, userName }
  }
}

export async function listUsers (tx, { tenantId = ROOT_TENANT, offset = 0, limit = 20 }) {}

/**
 * Return a user by userId
 * @param {object} tx - Knex transaction object
 * @param {string} userId - the userId of the user
 */
export async function getUserById (tx, userId) {
  return tx
    .select()
    .from('users')
    .where({ userId })
    .first()
}

/**
 * Return a user based on userName or email (userName or email must be specified)
 * @param {object} tx - Knex transaction object
 * @param {object} where - the query parameters for the user
 * @param {string} where.tenantId - tenant realm of user, defaults to ROOT_TENANT
 * @param {string} where.userName - user name
 * @param {string} where.email - email
 */
export async function getUserByNameOrEmail (tx, { tenantId = ROOT_TENANT, userName, email }) {
  if (!userName && !email) {
    throw new InvalidParameterError({ message: 'userName or email must be specified' })
  }
  userName = userName && userName.toLowerCase()
  email = email && email.toLowerCase()
  tx = tx
    .select()
    .from('users')
    .where({ tenantId })
  if (userName) { tx = tx.where({ userName }) }
  if (email) { tx = tx.where({ email }) }
  return tx.first()
}

export async function removeUser (tx, userId) {}

export async function updateUser (tx, userId, { userName, email, emailVerifiedAt, needNewPassword }) {}
