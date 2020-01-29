import { UnitTestDb } from './db'
import { createPermissions, getPermissionById, getPermissionByName } from '../permissions'
import { ROOT_TENANT } from '../constants'

const ACME_TENANT = '19443f78-47f2-4ed7-89eb-5707105ee51e'

const rootPerm1 = {
  permission: 'perm1',
  description: 'root permission 1',
  tenantId: ROOT_TENANT
}

const acmePerm1 = {
  permission: 'perm1',
  description: 'acme permission 1',
  tenantId: ACME_TENANT
}

const globalPerm2 = {
  permission: 'perm2',
  description: 'global permission 2',
  global: true
}

const globalPerm3 = {
  permission: 'perm3',
  description: 'global permission 3',
  global: true
}

const acmePerm3 = {
  permission: 'perm3',
  description: 'acme permission 3',
  tenantId: ACME_TENANT
}

describe('Permissions Tests', () => {
  const db = new UnitTestDb()
  let knex = null

  beforeAll(async (done) => {
    await db.initialize('permissions')
    knex = db.knex
    done()
  })
  afterAll(async (done) => {
    await db.cleanup()
    done()
  })
  it('createPermissions local succeeds', async (done) => {
    const { permissionId } = await createPermissions(knex, rootPerm1)
    expect(permissionId).not.toBeNull()
    const { permission } = await getPermissionById(knex, permissionId)
    expect(permission).toBe(rootPerm1.permission)
    done()
  })
  it('createPermissions global succeeds', async (done) => {
    const { permissionId } = await createPermissions(knex, globalPerm2)
    expect(permissionId).not.toBeNull()
    const { permission } = await getPermissionById(knex, permissionId)
    expect(permission).toBe(globalPerm2.permission)
    done()
  })
  it('getPermissionByName global succeeds', async (done) => {
    const permission = await getPermissionByName(knex, { permission: globalPerm2.permission })
    expect(permission.permission).toBe(globalPerm2.permission)
    expect(permission.description).toBe(globalPerm2.description)
    expect(permission.global).toBe(globalPerm2.global)
    done()
  })
  it('getPermissionByName global with tentantId succeeds', async (done) => {
    const permission = await getPermissionByName(knex, { tenantId: ACME_TENANT, permission: globalPerm2.permission })
    expect(permission.permission).toBe(globalPerm2.permission)
    expect(permission.description).toBe(globalPerm2.description)
    expect(permission.global).toBe(globalPerm2.global)
    done()
  })

  it('getPermissionByName local fails without tenantId', async (done) => {
    const permission = await getPermissionByName(knex, { permission: rootPerm1.permission })
    expect(permission).toBeFalsy()
    done()
  })
  it('getPermissionByName local permissions succeeds', async (done) => {
    const permission = await getPermissionByName(knex, { tenantId: ROOT_TENANT, permission: rootPerm1.permission })
    expect(permission.permission).toBe(rootPerm1.permission)
    expect(permission.description).toBe(rootPerm1.description)
    expect(permission.global).toBe(false)
    done()
  })
  it('getPermissionByName global permissions with tenantId succeeds', async (done) => {
    const permission = await getPermissionByName(knex, { tenantId: ROOT_TENANT, permission: globalPerm2.permission })
    expect(permission.permission).toBe(globalPerm2.permission)
    expect(permission.description).toBe(globalPerm2.description)
    expect(permission.global).toBe(true)
    done()
  })
  it('createPermissions conflicted name in second tenant succeeds', async (done) => {
    const { permissionId } = await createPermissions(knex, acmePerm1)
    expect(permissionId).not.toBeNull()

    const { description } = await getPermissionById(knex, permissionId)
    expect(description).toBe(acmePerm1.description)
    done()
  })
  it('getPermissionByName local permissions override global with tenantId succeeds', async (done) => {
    await createPermissions(knex, globalPerm3)
    await createPermissions(knex, acmePerm3)
    const rootPermission = await getPermissionByName(knex, { tenantId: ROOT_TENANT, permission: globalPerm3.permission })
    expect(rootPermission.description).toBe(globalPerm3.description)
    const acmePermission = await getPermissionByName(knex, { tenantId: ACME_TENANT, permission: globalPerm3.permission })
    expect(acmePermission.description).toBe(acmePerm3.description)
    done()
  })
})
