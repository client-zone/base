import TestRunner from 'test-runner'
import ApiClientBase from '@client-zone/base'
import assert from 'assert'
import fetch from 'node-fetch'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })

tom.test('fetchJson', async function () {
  const api = new ApiClientBase({ fetch })
  const result = await api.fetchJson('https://registry.npmjs.org/')
  a.equal(result.db_name, 'registry')
})

tom.test('fetchJson: baseUrl', async function () {
  const api = new ApiClientBase({ fetch, baseUrl: 'https://registry.npmjs.org' })
  const result = await api.fetchJson('/')
  a.equal(result.db_name, 'registry')
})

tom.test('fetchJson fail', async function () {
  const api = new ApiClientBase({ fetch, baseUrl: 'https://registry.npmjs.orgBROKEN' })
  try {
    await api.fetchJson('/')
    throw new Error('should not reach here')
  } catch (err) {
    a.ok(/ENOTFOUND/.test(err.message))
  }
})

tom.test('fetchJson fail, retry', async function () {
  const actuals = []
  const api = new ApiClientBase({
    fetch,
    baseUrl: 'https://registry.npmjs.orgBROKEN',
    log: (type) => actuals.push(type)
  })
  try {
    await api.fetchJson('/', { retryAfter: [200, 500], fetch })
    throw new Error('should not reach here')
  } catch (err) {
    a.ok(/ENOTFOUND/.test(err.message))
    a.deepEqual(actuals, [
      'Request',
      'Retry',
      'Request',
      'Retry',
      'Request'
    ])
  }
})

export default tom
