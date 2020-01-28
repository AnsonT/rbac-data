const environment = process.env.NODE_ENV || 'development'
const config = require('../../../knexfile')[environment]

export default require('knex')(config)

export class UnitTestDb {
  async initialize (name) {
    this.dbName = `${new Date().toISOString()}unittest_${name}`
    this.dbConfig = {
      knex: {
        ...require('../../../knexfile').test
      },
      dbManager: {
        collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252'],
        superUser: 'postgres',
        superPassword: 'postgres'
      }
    }
    this.dbConfig.knex.connection.host = 'localhost'
    this.dbConfig.knex.connection.database = this.dbName

    this.dbManager = require('knex-db-manager')
      .databaseManagerFactory(this.dbConfig)
    await this.dbManager.createDb()
    await this.dbManager.close()
    await this.dbManager.closeKnex()
    this.knex = require('knex')(this.dbConfig.knex)
    await this.knex.migrate.rollback()
    await this.knex.migrate.latest()
    await this.knex.seed.run({ specific: 'unittests.js' })
  }

  async cleanup () {
    await this.knex.destroy()
    await this.dbManager.close()
    await this.dbManager.closeKnex()

    await this.dbManager.dropDb()
    await this.dbManager.close()
  }
}
