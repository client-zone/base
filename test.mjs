import TestRunner from 'test-runner'
import ApiClientBase from 'api-client-base'
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
    log: msg => actuals.push(msg)
  })
  try {
    await api.fetchJson('/', { retryAfter: [200, 500], fetch })
    throw new Error('should not reach here')
  } catch (err) {
    a.ok(/ENOTFOUND/.test(err.message))
    a.deepEqual(actuals, [
      'FETCH: https://registry.npmjs.orgBROKEN/',
      'RETRY: https://registry.npmjs.orgBROKEN/, 2 attempts remaining, waiting 200ms.',
      'FETCH: https://registry.npmjs.orgBROKEN/',
      'RETRY: https://registry.npmjs.orgBROKEN/, 1 attempts remaining, waiting 500ms.',
      'FETCH: https://registry.npmjs.orgBROKEN/'
    ])
  }
})

export default tom
