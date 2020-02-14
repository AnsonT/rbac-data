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

export async function assignUserRoleById (tx, { userId, roleId }) {
  const { tenantId: userTenantId } = await getUserById(tx, userId)
  const { tenantId: roleTenantId } = await getRoleById(tx, roleId)
  if (userTenantId !== roleTenantId) {
    throw new InvalidParameterError({ message: 'Role and User from different tenants' })
  }
  await tx
    .insert({ userId, roleId })
    .into('usersRoles')
  return { userId, roleId }
}

export async function assignUserRoleByName (tx, { tenantId = ROOT_TENANT, userName, roleName } = {}) {
  const { userId } = getUserByName(tx, { tenantId, userName })
  const { roleId } = getRoleByName(tx, { tenantId, roleName })
  await tx
    .insert({ userId, roleId })
    .into('usersRoles')
  return { userId, roleId }
}

export async function removeUserRole (tx, userId, roleId) {
  const count = await tx
    .from('usersRoles')
    .del()
    .where({ userId, roleId })
  return { userId, roleId, count }
}

export async function grantRolePermissionById (tx, roleId, permissionId) {
  await tx
    .insert({ roleId, permissionId, denied: false })
    .into('rolesPermissions')
  return { roleId, permissionId }
}

export async function denyRolePermissionById (tx, roleId, permissionId) {
  await tx
    .insert({ roleId, permissionId, denied: true })
    .into('rolesPermissions')
  return { roleId, permissionId }
}

export async function listUserRoles (tx, userId) {
  const roles = await tx
    .select()
    .from('usersRoles')
    .join('roles', 'usersRoles.roleId', 'roles.roleId')
    .where({ userId })
  return roles
}

export async function setUserRolesByName (tx, { tenantId = ROOT_TENANT, userName, roleNames }) {
  const { userId } = await getUserByName(tx, { tenantId, userName }) || {}
  if (!userId) {
    throw new InvalidParameterError({ message: `Invalid userName: "${userName}"` })
  }
  await tx
    .from('usersRoles')
    .del()
    .where({ userId })
  for (const roleName of roleNames) {
    const { roleId } = await getRoleByName(tx, { tenantId, roleName }) || {}
    if (!roleId) {
      throw new InvalidParameterError({ message: `Invalid roleName: "${roleName}"` })
    }
    await assignUserRoleById(tx, { userId, roleId })
  }
  return true
}

export async function setUserRolesById (tx, userId, roleIds) {
  await tx
    .from('usersRoles')
    .del()
    .where({ userId })
  for (const roleId of roleIds) {
    await assignUserRoleById(tx, { userId, roleId })
  }
  return true
}
