import uuid from 'uuid/v4'
import { InvalidParameterError } from './errors'
import { GLOBAL_TENANT } from './constants'

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

export async function listPermissions (tx, { tenantId }) {}

export async function removePermission (tx, permissionId) {}

export async function updatePermission (tx, permissionId, { permission, description }) {}
