import uuid from 'uuid/v4'

export async function createUser (tx, { tenantId, userName, email, password } = {}) {
  console.log('createUser')
  const userId = uuid()
  const resp = await tx
    .insert({
      userId,
      userName: userName.toLowerCase(),
      email
    })
    .into('users')
  if (resp.rowCount === 1) {
    return { userId, userName }
  }
}

export async function listUsers (tx, tenantId, { offset = 0, limit = 20 }) {}

export async function getUserById (tx, userId) {}

export async function getUserByNameOrEmail (tx, tenantId, { userName, email }) {}

export async function removeUser (tx, userId) {}

export async function updateUser (tx, userId, { userName, email }) {}
