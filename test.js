import ApiClientBase from '@client-zone/base'
import { strict as a } from 'assert'

const [test, only, skip] = [new Map(), new Map(), new Map()]

test.set('fetchJson', async function () {
  const api = new ApiClientBase()
  const result = await api.fetchJson('https://jsonplaceholder.typicode.com/todos/1')
  a.equal(result.id, 1)
})

test.set('fetchJson: baseUrl', async function () {
  const api = new ApiClientBase({ baseUrl: 'https://jsonplaceholder.typicode.com' })
  const result = await api.fetchJson('/todos/1')
  a.equal(result.id, 1)
})

test.set('broken fetchJson - domain not found, exception thrown', async function () {
  const api = new ApiClientBase({ baseUrl: 'https://registry.npmjs.orgBROKEN' })
  try {
    await api.fetchJson('/', { signal: AbortSignal.timeout(1000) })
    throw new Error('should not reach here')
  } catch (err) {
    // this.data = err
    a.ok(/Failed to fetch/.test(err.message))
    /* Check the cause is present. The cause content will vary depending whether on node or browser */
    a.ok(err.cause)
    /* Additional debugging info */
    a.ok(err.request)
  }
})

test.set('broken fetchJson - 404, exception thrown', async function () {
  const api = new ApiClientBase({ baseUrl: 'https://jsonplaceholder.typicode.com' })
  try {
    await api.fetchJson('/posts/broken')
    throw new Error('should not reach here')
  } catch (err) {
    // this.data = err
    a.ok(/404/.test(err.message))
    /* Additional debugging info */
    a.ok(err.request)
    a.ok(err.response)
  }
})

export { test, only, skip }
