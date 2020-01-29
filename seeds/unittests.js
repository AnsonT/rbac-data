const faker = require('faker')
const { seed: baseSeed } = require('./000base')
const { ROOT_TENANT } = require('../src/lib/constants')

faker.seed(1337)

exports.seed = async (knex) => {
  await baseSeed(knex)
  await knex('tenants')
    .insert([
      {
        tenantId: '19443f78-47f2-4ed7-89eb-5707105ee51e',
        tenantName: 'acme',
        domain: 'acme.com'
      }
    ])

  await knex('users').insert(
    Array.from({ length: 20 }, (x, i) => {
      return ({
        tenantId: ROOT_TENANT,
        userId: faker.random.uuid(),
        userName: faker.internet.userName().toLowerCase(),
        email: faker.internet.email().toLowerCase(),
        emailVerifiedAt: faker.date.past()
      })
    }))
}
