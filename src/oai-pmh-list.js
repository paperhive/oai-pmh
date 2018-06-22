import { get } from 'lodash'

import { parseOaiPmhXml } from './oai-pmh-xml'

function getResumptionToken (result, listSize) {
  const token = result.resumptionToken
  if (!token) return undefined

  if (typeof token === 'string') return token

  const cursor = get(token, '$.cursor')
  const completeListSize = get(token, '$.completeListSize')
  if (
    cursor &&
    completeListSize &&
    parseInt(cursor, 10) + listSize >= parseInt(completeListSize, 10)
  ) return undefined

  return token._
}

export async function * getOaiListItems (oaiPmh, verb, field, options) {
  const initialResponse = await oaiPmh.request({
    url: oaiPmh.baseUrl,
    qs: {
      ...options,
      verb
    }
  })
  const initialParsedResponse = await parseOaiPmhXml(initialResponse.body)
  const initialResult = initialParsedResponse[verb]
  for (const item of initialResult[field]) {
    yield item
  }

  let result = initialResult
  let resumptionToken
  while ((resumptionToken = getResumptionToken(result, result[field].length))) {
    const response = await oaiPmh.request({
      url: oaiPmh.baseUrl,
      qs: {
        verb,
        resumptionToken
      }
    })
    const parsedResponse = await parseOaiPmhXml(response.body)
    result = parsedResponse[verb]
    for (const item of result[field]) {
      yield item
    }
  }
}
