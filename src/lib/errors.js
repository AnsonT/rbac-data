export class InvalidParameterError extends Error {
  constructor (args) {
    super(args)
    this.name = 'InvalidParameterError'
    this.message = args.message
  }
}
