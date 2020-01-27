import uuid from 'uuid/v4'
import _ from 'lodash-uuid'
import emailValidator from 'email-validator'
import { InvalidParameterError } from './errors'
import { ROOT_TENANT } from './constants'

export async function createUser (tx, { tenantId, userName, email } = {}) {
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
      email
    })
    .into('users')
  if (resp.rowCount === 1) {
    return { userId, userName }
  }
}

export async function listUsers (tx, { tenantId = ROOT_TENANT, offset = 0, limit = 20 }) {}

export async function getUserById (tx, userId) {
  return tx
    .select()
    .from('users')
    .where({ userId })
    .first()
}

export async function getUserByNameOrEmail (tx, { tenantId = ROOT_TENANT, userName, email }) {
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

export async function updateUser (tx, userId, { userName, email }) {}
