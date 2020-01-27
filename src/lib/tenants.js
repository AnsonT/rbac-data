export async function createTenant (tx, { tenantName, domain }) {}

export async function listTenants (tx, { offset = 0, limit = 20 }) {}

export async function getTenantById (tx, tenantId) {}

export async function getTenantByNameOrDomain ( tx, { tenantName, domain }) {}

export async function removeTenant (tx, { tenantId }) {}

export async function updateTenant ( tx, { tenantId, tenantName, domain }) {}
