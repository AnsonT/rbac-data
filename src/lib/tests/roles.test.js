import _ from 'lodash'
import { UnitTestDb } from './db'
import { createRole, getRoleById, getRoleByName, listRoles, removeRole, updateRole, assignUserRoleById, listUserRoles, listUserPermissions, allowPermissionInRoleById, denyPermissionInRoleById } from '../roles'
import { SUPERUSER_ROLE, ROOT_TENANT } from '../constants'
import uuid from 'uuid/v4'
import { createUser, getUserByName } from '../users'
import { createPermission } from '../permissions'

const user1 = {
  userName: 'User1',
  email: 'user1@example.localhost',
  password: 'password'
}
const role1 = {
  roleName: 'role1',
  description: 'role 1'
}

const role2 = {
  roleName: 'role2',
  description: 'role 2'
}

const role3 = {
  roleName: 'role3',
  description: 'role 3'
}

const permission1 = {
  permission: 'perm1',
  description: 'root permission 1',
  tenantId: ROOT_TENANT
}

const permission2 = {
  permission: 'perm2',
  description: 'root permission 2',
  tenantId: ROOT_TENANT
}

const permission3 = {
  permission: '_perm3',
  description: 'root permission 3',
  global: true
}

describe('Roles Tests', () => {
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
  it('createRole succeeds', async (done) => {
    const { roleId } = await createRole(knex, role1)
    expect(roleId).not.toBeNull()
    const { roleName } = await getRoleById(knex, roleId)
    expect(roleName).toBe(role1.roleName)
    await createRole(knex, role2)
    await createRole(knex, role3)
    done()
  })
  it('getRoleByName succeeds', async (done) => {
    const { roleName } = await getRoleByName(knex, { roleName: role1.roleName })
    expect(roleName).toBe(role1.roleName)
    done()
  })
  it('listRoles succeeds', async (done) => {
    const omitMutableFields = (users) => _.map(users, user => _.omit(user, ['roleId', 'createdAt', 'modifiedAt']))
    const roles = await listRoles(knex)
    expect(omitMutableFields(roles)).toMatchSnapshot()
    done()
  })
  it('removeRole succeeds', async (done) => {
    const { roleId } = await getRoleByName(knex, { roleName: role2.roleName })
    const { count } = await removeRole(knex, roleId)
    expect(count).toBe(1)
    const roles = await listRoles(knex)
    expect(roles.length).toMatchSnapshot()
    done()
  })
  it('removeRole superuser fails', async (done) => {
    const { count } = await removeRole(knex, SUPERUSER_ROLE)
    expect(count).toBe(0)
    done()
  })
  it('updateRole succeeds', async (done) => {
    const { roleId } = await getRoleByName(knex, { roleName: role1.roleName })
    const { count } = await updateRole(knex, roleId, { description: 'changed description' })
    expect(count).toBe(1)
    const { description } = await getRoleById(knex, roleId)
    expect(description).toBe('changed description')
    done()
  })
  it('updateRole invalid roleName fails', async (done) => {
    const { roleId } = await getRoleByName(knex, { roleName: role1.roleName })
    await expect(updateRole(knex, roleId, { roleName: uuid() })).rejects.toThrow()
    done()
  })
  it('addUserRole by Id succeeds', async (done) => {
    const { userId } = await createUser(knex, user1)
    const { roleId: role1Id } = await getRoleByName(knex, { roleName: role1.roleName })
    const { roleId: role3Id } = await getRoleByName(knex, { roleName: role3.roleName })
    await assignUserRoleById(knex, {
      userId,
      roleId: role1Id
    })
    await assignUserRoleById(knex, {
      userId,
      roleId: role3Id
    })
    const omitMutableFields = (users) =>
      _.map(users, user => _.omit(user,
        ['roleId', 'userId', 'createdAt', 'modifiedAt']))
    const roles = await listUserRoles(knex, userId)
    expect(omitMutableFields(roles)).toMatchSnapshot()
    done()
  })
  it('addRolePermissions succeeds', async (done) => {
    const { roleId } = await getRoleByName(knex, { roleName: role1.roleName })
    const { permissionId: permission1Id } = await createPermission(knex, permission1)
    const { permissionId: permission2Id } = await createPermission(knex, permission2)
    const { permissionId: permission3Id } = await createPermission(knex, permission3)

    await allowPermissionInRoleById(knex, roleId, permission1Id)
    await allowPermissionInRoleById(knex, roleId, permission2Id)
    await denyPermissionInRoleById(knex, roleId, permission3Id)
    done()
  })
  it('listUserPermissions succeeds', async (done) => {
    const omitMutableFields = (users) =>
      _.map(users, user => _.omit(user,
        ['permissionId']))

    const { userId } = await getUserByName(knex, user1)
    const { allowed, denied } = await listUserPermissions(knex, userId)
    expect(omitMutableFields(allowed)).toMatchSnapshot()
    expect(omitMutableFields(denied)).toMatchSnapshot()
    done()
  })
})
