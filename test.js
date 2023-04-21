import TestRunner from 'test-runner'
import ApiClientBase from '@client-zone/base'
import { strict as a } from 'assert'

const tom = new TestRunner.Tom({ maxConcurrency: 2 })

tom.test('fetchJson', async function () {
  const api = new ApiClientBase()
  const result = await api.fetchJson('https://registry.npmjs.org/')
  a.equal(result.db_name, 'registry')
})

tom.test('fetchJson: baseUrl', async function () {
  const api = new ApiClientBase({ baseUrl: 'https://registry.npmjs.org' })
  const result = await api.fetchJson('/')
  a.equal(result.db_name, 'registry')
})

tom.test('fetchJson fail', async function () {
  const api = new ApiClientBase({ baseUrl: 'https://registry.npmjs.orgBROKEN' })
  try {
    await api.fetchJson('/')
    throw new Error('should not reach here')
  } catch (err) {
    a.ok(/ENOTFOUND/.test(err.message) || /ENOTFOUND/.test(err.cause.message))
  }
})

export default tom
