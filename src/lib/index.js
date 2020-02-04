import { path } from 'path'

export * from './tenants'
export * from './auth'
export * from './users'
export * from './roles'
export * from './permissions'

export default class Rbac {
}

export const migration = {
  up: (knex) => knex.migrate.latest({ directory: './migrations' }),
  down: (knex) => knex.migrate.rollback({ directory: './migrations' }, true),
  seed: (knex) => knex.seed.run()
}

export async function schemaSync (knex) {
  await knex.migrate.latest({
    directory: './migrations'
  })
  await knex.seed.run()
}

export function test () {
}
