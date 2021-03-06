import _ from 'lodash'
import { UnitTestDb } from './db'
import { createPermission, getPermissionById, getPermissionByName, listPermissions, removePermission, updatePermission, checkPermissions } from '../permissions'
import { ROOT_TENANT, GLOBAL_TENANT } from '../constants'

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

const acme_Perm1 = { // eslint-disable-line camelcase
  permission: '_perm1',
  description: 'acme permission 1',
  tenantId: ACME_TENANT
}

const globalPerm2 = {
  permission: '_perm2',
  description: 'global permission 2',
  global: true
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
  it('createPermission local succeeds', async (done) => {
    const { permissionId } = await createPermission(knex, rootPerm1)
    expect(permissionId).not.toBeNull()
    const { permission } = await getPermissionById(knex, permissionId)
    expect(permission).toBe(rootPerm1.permission)
    done()
  })
  it('createPermission _ local permission fails', async (done) => {
    await expect(createPermission(knex, acme_Perm1)).rejects.toThrow()
    done()
  })

  it('createPermission duplicate fails', async (done) => {
    await expect(createPermission(knex, rootPerm1)).rejects.toThrow()
    done()
  })

  it('createPermission global succeeds', async (done) => {
    const { permissionId } = await createPermission(knex, globalPerm2)
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
  it('createPermission conflicted name in second tenant succeeds', async (done) => {
    const { permissionId } = await createPermission(knex, acmePerm1)
    expect(permissionId).not.toBeNull()

    const { description } = await getPermissionById(knex, permissionId)
    expect(description).toBe(acmePerm1.description)
    done()
  })
  it('listPermissions succeeds', async (done) => {
    const omitMutableFields = (users) => _.map(users, user => _.omit(user, ['permissionId', 'createdAt', 'modifiedAt']))

    const rootPermissions = await listPermissions(knex)
    expect(omitMutableFields(rootPermissions)).toMatchSnapshot()
    const acmePermissions = await listPermissions(knex, { tenantId: ACME_TENANT })
    expect(omitMutableFields(acmePermissions)).toMatchSnapshot()
    const globalPermissions = await listPermissions(knex, { tenantId: GLOBAL_TENANT })
    expect(omitMutableFields(globalPermissions)).toMatchSnapshot()
    done()
  })
  it('updatePermissions succeeds', async (done) => {
    const { permissionId } = await getPermissionByName(knex, rootPerm1)
    const { count } = await updatePermission(knex, permissionId, { permission: 'newPerm1' })
    expect(count).toBe(1)
    const permission = await getPermissionById(knex, permissionId)
    expect(permission.permission).toBe('newPerm1')
    done()
  })

  it('removePermission succeeds', async (done) => {
    const { permissionId } = await getPermissionByName(knex, acmePerm1)
    const { count } = await removePermission(knex, permissionId)
    expect(count).toBe(1)
    const acmePermissions = await listPermissions(knex, { tenantId: ACME_TENANT })
    expect(acmePermissions.length).toMatchSnapshot()
    done()
  })
  it('checkPermissions succeeds', async (done) => {
    expect(checkPermissions('a', ['a', 'b'])).toBe(true)
    expect(checkPermissions(['a'], ['a', 'b'])).toBe(true)
    expect(checkPermissions(['a'], [])).toBe(false)
    expect(checkPermissions(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(checkPermissions(['a', 'b', 'c'], ['a', 'b'])).toBe(false)

    expect(checkPermissions({ all: ['a'] }, ['a', 'b'])).toBe(true)
    expect(checkPermissions({ all: ['a', 'b'] }, ['a', 'b'])).toBe(true)
    expect(checkPermissions({ all: ['a', 'b', 'c'] }, ['a', 'b'])).toBe(false)

    expect(checkPermissions({ any: ['a', 'b'] }, ['a'])).toBe(true)
    expect(checkPermissions({ any: ['a', 'b'] }, ['a', 'b'])).toBe(true)
    expect(checkPermissions({ any: ['a', 'b'] }, ['c'])).toBe(false)

    expect(checkPermissions([{ all: ['a', 'b'] }, { any: ['c', 'd'] }], ['a', 'b', 'c'])).toBe(true)
    expect(checkPermissions([{ all: ['a', 'b'] }, { any: ['c', 'd'] }], ['a', 'b'])).toBe(false)

    expect(checkPermissions({ any: [{ all: ['a', 'b'] }, { any: ['c', 'd'] }] }, ['a', 'b'])).toBe(true)
    expect(checkPermissions({ any: [{ all: ['a', 'b'] }, { any: ['c', 'd'] }] }, ['c'])).toBe(true)

    done()
  })
})
