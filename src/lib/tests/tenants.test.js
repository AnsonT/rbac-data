import { UnitTestDb } from './db'
import { createTenant } from '../tenants'

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
    const { tenantId } = await createTenant(knex,
      {
        tenantName: 'tenant1',
        domain: 'tenant1.example.localhost'
      })
    expect(tenantId).not.toBeNull()
    done()
  })
})
