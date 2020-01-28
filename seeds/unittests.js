const faker = require('faker')
const ROOT_TENANT = '00000000-0000-0000-0000-000000000000'

faker.seed(1337)

exports.seed = async (knex) => {
  await knex('users').del()
  await knex('users').insert(
    Array.from({ length: 20 }, (x, i) => ({
      tenantId: ROOT_TENANT,
      userId: faker.random.uuid(),
      userName: faker.internet.userName(),
      email: faker.internet.email()
    })))
}
