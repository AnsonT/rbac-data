import { schemaSync } from '../index'
describe('Migration Tests', () => {
  it('Migration succeeds', async (done) => {
    const dbName = `${new Date().toISOString()}unittest_${name}`
    const dbConfig = {
      knex: {
        ...require('../../../knexfile').test
      },
      dbManager: {
        collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252'],
        superUser: 'postgres',
        superPassword: 'postgres'
      }
    }
    dbConfig.knex.connection.host = 'localhost'
    dbConfig.knex.connection.database = dbName

    const dbManager = require('knex-db-manager')
      .databaseManagerFactory(dbConfig)

    await dbManager.createDb()
    await dbManager.close()
    await dbManager.closeKnex()
    const knex = require('knex')(dbConfig.knex)
    await schemaSync(knex)
    done()
  })
})
