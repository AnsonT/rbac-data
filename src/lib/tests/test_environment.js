const KnexEnvironment = require('jest-environment-knex')
const testConfig = require('../../../knexfile').test
class TestEnvironment extends KnexEnvironment {
  constructor (config) {
    const c = {
      ...config,
      testEnvironmentOptions: testConfig
    }
    super(c)
    console.log('Test Environment Constructor')
  }
}
module.exports = TestEnvironment
