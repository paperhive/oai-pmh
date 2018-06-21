// error class for OAI-PMH errors
export class OaiPmhError extends Error {
  constructor (message, code) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    this.code = code
    Error.captureStackTrace(this, this.constructor.name)
  }
}

export async function sleep (seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
