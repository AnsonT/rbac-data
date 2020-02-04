const { ROOT_TENANT, GLOBAL_TENANT, SUPERUSER_ROLE, ADMIN_ROLE, USER_ROLE } = require('../src/lib/constants')

exports.seed = async (knex) => {
  await knex('tenants').del()

  await knex('tenants')
    .insert([
      {
        tenantId: ROOT_TENANT,
        tenantName: 'root',
        domain: process.env.ROOT_DOMAIN || 'example.localhost',
        canBeDeleted: false
      },
      {
        tenantId: GLOBAL_TENANT,
        tenantName: 'global',
        domain: 'global',
        canBeDeleted: false
      }
    ])

  await knex('users').del()

  await knex('roles').del()
  await knex('roles')
    .insert([
      {
        roleId: SUPERUSER_ROLE,
        roleName: 'superuser',
        tenantId: ROOT_TENANT,
        description: 'root superuser',
        canBeDeleted: false
      },
      {
        roleId: ADMIN_ROLE,
        roleName: 'admin',
        tenantId: ROOT_TENANT,
        description: 'admin user',
        canBeDeleted: false
      },
      {
        roleId: USER_ROLE,
        roleName: 'user',
        tenantId: ROOT_TENANT,
        description: 'user',
        canBeDeleted: false
      }
    ])
}
