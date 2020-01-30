import _ from 'lodash'
import uuid from 'uuid/v4'
import { InvalidParameterError } from './errors'
import { GLOBAL_TENANT, ROOT_TENANT } from './constants'

function validatePermission (permission, global) {
  if (!permission) {
    return undefined
  }
  if (global && permission[0] !== '_') {
    throw new InvalidParameterError({ message: 'Global permissions must start with _' })
  }
  if (!global && permission[0] === '_') {
    throw new InvalidParameterError({ message: 'Local permissions cannot start with _' })
  }
  return permission
}

export async function createPermission (tx, { tenantId, permission, description, global }) {
  const permissionId = uuid()
  if (tenantId && global) {
    throw new InvalidParameterError({ message: 'Cannot specify both tenantId and global: true' })
  }
  if (!global && !tenantId) {
    throw new InvalidParameterError({ message: 'Must specify tenantId, or set global: true' })
  }
  global = !tenantId
  tenantId = global ? GLOBAL_TENANT : tenantId
  permission = validatePermission(permission, global)
  const values = {
    permissionId,
    tenantId,
    permission,
    description,
    global
  }
  await tx
    .insert(values)
    .into('permissions')
  return { permissionId, tenantId, permission, global }
}

export async function getPermissionById (tx, permissionId) {
  return tx
    .select()
    .where({ permissionId })
    .from('permissions')
    .first()
}

export async function getPermissionByName (tx, { tenantId, permission }) {
  if (tenantId) {
    return tx
      .select()
      .where({ permission })
      .where((builder) => builder.where({ tenantId }).orWhere({ tenantId: GLOBAL_TENANT }))
      .orderBy('global', 'asc')
      .from('permissions')
      .first()
  } else {
    return tx
      .select()
      .where({ permission })
      .where({ global: true })
      .from('permissions')
      .first()
  }
}

export async function listPermissions (tx, { tenantId = ROOT_TENANT } = {}) {
  return tx
    .select()
    .where({ tenantId })
    .orWhere({ tenantId: GLOBAL_TENANT })
    .orderBy('global', 'asc')
    .from('permissions')
}

export async function removePermission (tx, permissionId) {
  const count = await tx
    .from('permissions')
    .where({ permissionId })
    .whereNot({ canBeDeleted: false })
    .del()
  return { permissionId, count }
}

export async function updatePermission (tx, permissionId, { permission, description }) {
  const { global } = await getPermissionById(tx, permissionId)
  permission = validatePermission(permission, global)
  const modifiedAt = tx.fn.now()
  const values = {
    permission,
    description,
    modifiedAt
  }
  const count = await tx
    .where({ permissionId })
    .update(values)
    .into('permissions')
  return { count }
}

export async function listUserPermissions (tx, userId) {
  const permissions = await tx
    .select(['p.permissionId', 'p.permission', 'p.description', 'p.global', 'rp.denied'])
    .from('permissions as p')
    .join('rolesPermissions as rp', 'rp.permissionId', 'p.permissionId')
    .join('roles as r', 'r.roleId', 'rp.roleId')

  const allow = _.map(_.filter(permissions, { denied: false }), p => p.permission)
  const deny = _.map(_.filter(permissions, { denied: true }), p => p.permission)
  return {
    allow,
    deny,
    grants: _.filter(allow, a => !_.includes(deny, a)),
    permissions
  }
}

export function checkPermissions (requiredPermissions, { grants, any = false }) {
  if (_.isString(requiredPermissions)) {
    return _.includes(grants, requiredPermissions)
  }
  if (_.isArray(requiredPermissions)) {
    if (any) {
      for (const p of requiredPermissions) {
        if (checkPermissions(p, { grants })) {
          return true
        }
      }
      return false
    } else {
      for (const p of requiredPermissions) {
        if (!checkPermissions(p, { grants })) {
          return false
        }
      }
      return true
    }
  }
  const allRequired = _.get(requiredPermissions, 'all')
  const anyRequired = _.get(requiredPermissions, 'any')
  if (allRequired && anyRequired) {
    throw new InvalidParameterError({ message: 'requirePermissions cannot have all and any in the same condition' })
  }
  if (allRequired) {
    return checkPermissions(allRequired, { grants })
  }
  if (anyRequired) {
    return checkPermissions(anyRequired, { grants, any: true })
  }
  return false
}
