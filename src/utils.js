import { promisify } from 'bluebird'
import { get } from 'lodash'
import { parseString } from 'xml2js'

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

// test if the parsed xml contains an error
export async function parseOaiPmhXml (xml) {
  // parse xml into js object
  const obj = await promisify(parseString)(xml, {
    explicitArray: false,
    trim: true,
    normalize: true
  })

  const oaiPmh = obj && obj['OAI-PMH']

  if (!oaiPmh) {
    throw new OaiPmhError('Returned data does not conform to OAI-PMH')
  }

  const error = oaiPmh.error
  if (error) {
    throw new OaiPmhError(
      `OAI-PMH provider returned an error: ${error._}`,
      get(error, '$.code')
    )
  }

  return oaiPmh
}

export async function sleep (seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
