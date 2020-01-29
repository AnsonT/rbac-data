import { UnitTestDb } from './db'
import { createTenant, listTenants, getTenantById, getTenantByNameOrDomain, removeTenant, updateTenant } from '../tenants'
import { ROOT_TENANT } from '../constants'

const tenant1 = {
  tenantName: 'tenant1',
  domain: 'tenant1.example.localhost'

}
describe('Users Tests', () => {
  const db = new UnitTestDb()
  let knex = null

  beforeAll(async (done) => {
    await db.initialize('tenants')
    knex = db.knex
    done()
  })
  afterAll(async (done) => {
    await db.cleanup()
    done()
  })
  it('createTenant without crashing', async (done) => {
    const { tenantId } = await createTenant(knex, tenant1)
    expect(tenantId).not.toBeNull()
    done()
  })
  it('listTenants succeed', async (done) => {
    const tenants = await listTenants(knex)
    expect(tenants.length).toBe(4)
    done()
  })
  it('getTenantById succeed', async (done) => {
    const { tenantName } = await getTenantById(knex, ROOT_TENANT)
    expect(tenantName).toBe('root')
    done()
  })
  it('getTenant by name succeeds', async (done) => {
    const { domain } = await getTenantByNameOrDomain(knex, { tenantName: tenant1.tenantName })
    expect(domain).toBe(tenant1.domain)
    done()
  })
  it('getTenant by domain succeeds', async (done) => {
    const { tenantName } = await getTenantByNameOrDomain(knex, { domain: tenant1.domain })
    expect(tenantName).toBe(tenant1.tenantName)
    done()
  })
  it('updateTenant succeeds', async (done) => {
    const { tenantId } = await getTenantByNameOrDomain(knex, { tenantName: tenant1.tenantName })
    const { count } = await updateTenant(knex, tenantId, { domain: 'test' })
    expect(count).toBe(1)
    const { domain } = await getTenantById(knex, tenantId)
    expect(domain).toBe('test')
    done()
  })
  it('removeTenant succeeds', async (done) => {
    const { tenantId } = await getTenantByNameOrDomain(knex, { tenantName: tenant1.tenantName })
    const { count } = await removeTenant(knex, tenantId)
    expect(count).toBe(1)
    done()
  })
})
