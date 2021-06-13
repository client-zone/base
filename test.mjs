import TestRunner from 'test-runner'
import ApiClientBase from 'api-client-base'
import assert from 'assert'
import fetch from 'node-fetch'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })

tom.test('fetchJson', async function () {
  const api = new ApiClientBase('https://registry.npmjs.org', { fetch })
  const result = await api.fetchJson('/')
  a.equal(result.db_name, 'registry')
})

tom.test('fetchJson fail', async function () {
  const api = new ApiClientBase('https://registry.npmjs.orgBROKEN', { fetch })
  try {
    await api.fetchJson('/')
    throw new Error('should not reach here')
  } catch (err) {
    a.ok(/ENOTFOUND/.test(err.message))
  }
})

tom.test('fetchJson fail, retry', async function () {
  const api = new ApiClientBase('https://registry.npmjs.orgBROKEN', { fetch })
  // TODO: test api.log is called as expected by re-fetch
  try {
    await api.fetchJson('/', { retryAfter: [500, 500], fetch })
    throw new Error('should not reach here')
  } catch (err) {
    a.ok(/ENOTFOUND/.test(err.message))
  }
})

export default tom
