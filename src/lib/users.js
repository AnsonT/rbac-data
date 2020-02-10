import uuid from 'uuid/v4'
import 'lodash'
import _ from 'lodash-uuid'
import emailValidator from 'email-validator'
import { InvalidParameterError } from './errors'
import { ROOT_TENANT } from './constants'

function validateUserName (userName) {
  if (!userName) {
    return undefined
  }
  if (_.isUuid(userName)) {
    throw new InvalidParameterError({ message: 'Invalid parameter: userName' })
  }
  return userName.toLowerCase()
}

function validateEmail (email) {
  if (!email) {
    return undefined
  }
  if (!emailValidator.validate(email)) {
    throw new InvalidParameterError({ message: 'Invalid parameter: email' })
  }
  return email.toLowerCase()
}

/**
 * Create user
 * @param {object} tx - Knex transaction object
 * @param {object} values - values of new user
 * @param {string} values.tenantId - tenant id
 */
export async function createUser (tx, { tenantId = ROOT_TENANT, userName, email, emailVerifiedAt, needNewPassword } = {}) {
  userName = validateUserName(userName)
  email = validateEmail(email)
  const userId = uuid()
  const resp = await tx
    .insert({
      tenantId,
      userId,
      userName,
      email,
      emailVerifiedAt,
      needNewPassword
    })
    .into('users')
  if (resp.rowCount === 1) {
    return { userId, tenantId, userName }
  }
}

/**
 * Returns a list of users
 * @param {object} tx - Knex transaction object
 * @param {object} where - the query parameters for the list
 * @param {string} where.tenantId - tenant id
 * @param {number} where.offset - offset of the list
 * @param {number} where.limit - limit # items returned
 */
export async function listUsers (tx, { tenantId = ROOT_TENANT, offset = 0, limit = 20 }) {
  const query = tx('users').where({ tenantId })
  const users = await query.clone().offset(offset).limit(limit)
  const { count } = await query.clone().count().first()

  return {
    total: parseInt(count),
    offset,
    limit,
    users
  }

  // return tx
  //   .select()
  //   .from('users')
  //   .where({ tenantId })
  //   .offset(offset)
  //   .limit(limit)
}

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

export async function getUserByName (tx, { tenantId = ROOT_TENANT, userName }) {
  userName = userName && userName.toLowerCase()
  return tx
    .select()
    .from('users')
    .where({ tenantId, userName })
    .first()
}

export async function getUsersByEmail (tx, { tenantId = ROOT_TENANT, email }) {
  email = email && email.toLowerCase()
  return tx
    .select()
    .from('users')
    .where({ tenantId, email })
}

/**
 * Deletes a user by Id
 * @param {object} tx - Knex transaction object
 * @param {*} userId - id of user to delete
 */
export async function removeUser (tx, userId) {
  const count = await tx
    .from('users')
    .where({ userId })
    .whereNot({ canBeDeleted: false })
    .del()
  return { userId, count }
}

/**
 * Update user
 * @param {object} tx - Knex transaction object
 * @param {string} userId - id of user to update
 * @param {object} values - new values
 */
export async function updateUser (tx, userId, { userName, email, emailVerifiedAt, needNewPassword }) {
  const modifiedAt = tx.fn.now()
  const values = {
    userName: validateUserName(userName),
    email: validateEmail(email),
    emailVerifiedAt,
    needNewPassword,
    modifiedAt
  }
  const count = await tx
    .where({ userId })
    .update(values)
    .into('users')
  return { count }
}
