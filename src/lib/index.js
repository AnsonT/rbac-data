export * from './tenants'
export * from './auth'
export * from './users'
export * from './roles'
export * from './permissions'

export default class Rbac {
  constructor (options) {
    this.options = options
  }

  async syncDb () {
    console.log('Synchronize DB')
  }
}
