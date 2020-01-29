const { ROOT_TENANT, GLOBAL_TENANT } = require('../src/lib/constants')

exports.seed = async (knex) => {
  await knex('tenants').del()

  await knex('tenants')
    .insert([
      {
        tenantId: ROOT_TENANT,
        tenantName: 'root',
        domain: process.env.ROOT_DOMAIN || 'example.localhost'
      },
      {
        tenantId: GLOBAL_TENANT,
        tenantName: 'global',
        domain: 'global'
      }
    ])

  await knex('users').del()
}
