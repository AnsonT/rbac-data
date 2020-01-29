import { ROOT_TENANT } from './constants'

export async function createRole (tx, { tenantId = ROOT_TENANT, roleName, description } = {}) {}

export async function getRoleById (tx, roleId) {}

export async function getRoleByName (tx, roleName, { tenantId = ROOT_TENANT } = {}) {}

export async function listRoles (tx, { tenantId = ROOT_TENANT, offset = 0, limit = 20 }) {}

export async function removeRole (tx, roleId) {}

export async function updateRole (tx, roleId, { roleName, description }) {}

export async function assignUserRole (tx, userId, roleId) {}

export async function removeUserRole (tx, userId, roleId) {}

export async function listUserRoles (tx, userId) {}

export async function listUserPermissions (tx, userId) {}
