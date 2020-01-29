import uuid from 'uuid/v4'
import { InvalidParameterError } from './errors'

/**
 * create tenant
 * @param {object} tx - Knex transaction object
 * @param {object} values - vaues of new tenant
 */
export async function createTenant (tx, { tenantName, domain }) {
  const tenantId = uuid()
  tenantName = tenantName.toLowerCase()
  domain = domain.toLowerCase()
  const resp = await tx
    .insert({
      tenantId,
      tenantName,
      domain
    })
    .into('tenants')
  if (resp.rowCount === 1) {
    return { tenantId, tenantName, domain }
  }
}

/**
 * Returns list of tenants
 * @param {object} tx - Knex transaction object
 * @param {object} where - the query parameters for the list
 * @param {number} where.offset - offset of the list
 * @param {number} where.limit - limit # items returned
 */
export async function listTenants (tx, { offset = 0, limit = 20 } = {}) {
  return tx
    .from('tenants')
    .offset(offset)
    .limit(limit)
}

/**
 * Return a tenant by tenantId
 * @param {object} tx - Knex transaction object
 * @param {string} userId - the tenantId of the tenant
 */
export async function getTenantById (tx, tenantId) {
  return tx
    .from('tenants')
    .where({ tenantId })
    .first()
}

/**
 * Return a tenant based on tenantName or domain (tenantName or domain must be specified)
 * @param {object} tx - Knex transaction object
 * @param {object} where - the query parameters for the tenant
 * @param {string} where.tenantName - tenant name
 * @param {string} where.domain - domain
 */
export async function getTenantByNameOrDomain (tx, { tenantName, domain }) {
  if (!tenantName && !domain) {
    throw new InvalidParameterError({ message: 'tenantName or domain must be specified' })
  }
  tenantName = tenantName?.toLowerCase()
  domain = domain?.toLowerCase()
  tx = tx
    .select()
    .from('tenants')
  if (tenantName) { tx = tx.where({ tenantName }) }
  if (domain) { tx = tx.where({ domain }) }
  return tx.first()
}

/**
 * Deletes a tenant by Id
 * @param {object} tx - Knex transaction object
 * @param {*} userId - id of tenant to delete
 */
export async function removeTenant (tx, tenantId) {
  const count = await tx
    .from('tenants')
    .where({ tenantId })
    .del()
  return { tenantId, count }
}

/**
 * Update tenant
 * @param {object} tx - Knex transaction object
 * @param {string} userId - id of tenant to update
 * @param {object} values - new values
 */
export async function updateTenant (tx, tenantId, { tenantName, domain }) {
  const modifiedAt = tx.fn.now()
  const values = {
    tenantName,
    domain,
    modifiedAt
  }
  const count = await tx
    .where({ tenantId })
    .update(values)
    .into('tenants')
  return { count }
}
