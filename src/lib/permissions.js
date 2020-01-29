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

export async function createPermissions (tx, { tenantId, permission, description, global }) {
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
