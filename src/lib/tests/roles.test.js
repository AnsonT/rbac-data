import _ from 'lodash'
import { UnitTestDb } from './db'
import { createRole, getRoleById, getRoleByName, listRoles, removeRole, updateRole } from '../roles'
import { SUPERUSER_ROLE } from '../constants'
import uuid from 'uuid/v4'

const role1 = {
  roleName: 'role1',
  description: 'role 1'
}

const role2 = {
  roleName: 'role2',
  description: 'role 2'
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
  it('createRole succeeds', async (done) => {
    const { roleId } = await createRole(knex, role1)
    expect(roleId).not.toBeNull()
    const { roleName } = await getRoleById(knex, roleId)
    expect(roleName).toBe(role1.roleName)
    await createRole(knex, role2)
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
})
