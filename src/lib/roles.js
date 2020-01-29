import { ROOT_TENANT, GLOBAL_TENANT } from './constants'
import uuid from 'uuid/v4'
import _ from 'lodash-uuid'
import { InvalidParameterError } from './errors'
import { getUserById, getUserByName } from './users'

function validateRoleName (roleName) {
  if (!roleName) { return undefined }
  if (_.isUuid(roleName)) {
    throw new InvalidParameterError({ message: 'Invalid parameter: roleName' })
  }
  return roleName
}

export async function createRole (tx, { tenantId = ROOT_TENANT, roleName, description } = {}) {
  const roleId = uuid()
  if (!roleName) {
    throw new InvalidParameterError({ message: 'roleName is required' })
  }
  if (tenantId === GLOBAL_TENANT) {
    throw new InvalidParameterError({ message: 'global roles are supported' })
  }
  roleName = validateRoleName(roleName)
  const values = {
    roleId,
    tenantId,
    roleName,
    description
  }
  await tx
    .insert(values)
    .into('roles')
  return { roleId, tenantId, roleName }
}

export async function getRoleById (tx, roleId) {
  return tx
    .select()
    .where({ roleId })
    .from('roles')
    .first()
}

export async function getRoleByName (tx, { tenantId = ROOT_TENANT, roleName } = {}) {
  if (!roleName) {
    throw new InvalidParameterError({ message: 'roleName is required' })
  }
  return tx
    .select()
    .where({ tenantId, roleName })
    .from('roles')
    .first()
}

export async function listRoles (tx, { tenantId = ROOT_TENANT, offset = 0, limit = 20 } = {}) {
  return tx
    .select()
    .where({ tenantId })
    .offset(offset)
    .limit(limit)
    .from('roles')
}

export async function removeRole (tx, roleId) {
  const count = await tx
    .from('roles')
    .where({ roleId })
    .whereNot({ canBeDeleted: false })
    .del()
  return { roleId, count }
}

export async function updateRole (tx, roleId, { roleName, description }) {
  const modifiedAt = tx.fn.now()
  roleName = validateRoleName(roleName)
  const values = {
    roleName,
    description,
    modifiedAt
  }
  const count = await tx
    .where({ roleId })
    .update(values)
    .into('roles')
  return { count }
}

export async function assignUserRole (tx, userIdOrName, roleIdOrName, { tenantId } = {}) {
  if (!_.isUuid(userIdOrName) || !_.isUuid(roleIdOrName)) {
    throw new InvalidParameterError({ message: 'tenantId required to use user or role name' })
  }
  const { userId, tenantId: userTenantId } = _.isUuid(userIdOrName)
    ? await getUserById(tx, userIdOrName)
    : await getUserByName(tx, { tenantId, userName: userIdOrName })
  const { roleId, tenantId: roleTenantId } = _.isUuid(roleIdOrName)
    ? await getRoleById(tx, roleIdOrName)
    : await getRoleByName(tx, { tenantId, roleName: roleIdOrName })
  if (tenantId !== roleTenantId || tenantId !== userTenantId) {
    throw new InvalidParameterError({ message: 'Role and User from different tenants' })
  }
  if (!userId) {
    throw new InvalidParameterError({ message: `InvalidParameter userNameOrId: '${userIdOrName}'` })
  }
  if (!roleId) {
    throw new InvalidParameterError({ message: `InvalidParameter roleNameOrId: '${roleIdOrName}'` })
  }
  await tx
    .insert({ userId, roleId })
    .into('usersRoles')
  return { userId, roleId }
}

export async function removeUserRole (tx, userId, roleId) {}

export async function listUserRoles (tx, userId) {}

export async function listUserPermissions (tx, userId) {}
