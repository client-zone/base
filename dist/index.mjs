/**
 * A sleep function you can use anywhere.
 *
 * @module sleep-anywhere
 * @example
 * const sleep = require('sleep-anywhere')
 *
 * const result = await sleep(5000, 'later')
 * console.log('5s', result)
 * // 5s later
 */

/**
 * Returns a promise which fulfils after `ms` milliseconds with the supplied `returnValue`.
 * @param {number} ms - How long in milliseconds to sleep for.
 * @param {*} [returnValue] - The value to return.
 * @returns {Promise}
 * @alias module:sleep-anywhere
 */
function sleep (ms, returnValue) {
  return new Promise(resolve => setTimeout(() => resolve(returnValue), ms))
}

/**
≈ Returns a function wrapping the supplied fetch function, adding retry functionality.
• fetch :function - The fetch function to wrap
• [options]
*/
function createRetryableFetch (fetch, options) {
  const defaultOptions = Object.assign({
    retryAfter: [],
    log: function () {}
  }, options)
  return function retryableFetch (url, options) {
    options = Object.assign({}, defaultOptions, options)
    const retryAfter = options.retryAfter.slice()
    return new Promise(async (resolve, reject) => {
      let complete = false
      while (!complete) {
        try {
          options.log(`FETCH: ${url}`)
          const response = await fetch(url, options)
          if (response.ok) {
            options.log(`RES: ${response.url} ${{ status: response.status, statusText: response.statusText }}`)
            resolve(response)
            complete = true
          } else {
            const text = await response.text()
            options.log(`RES: ${response.url}, ${{ status: response.status, statusText: response.statusText, text }}`)
            const err = new Error('fetch failed: ' + response.status + '\n' + text)
            err.status = response.status
            err.responseBody = text
            throw err
          }
        } catch (err) {
          const remainingRetries = retryAfter.length
          if (remainingRetries) {
            const waitPeriod = retryAfter.shift()
            options.log(`RETRY: ${url}, ${remainingRetries} attempts remaining, waiting ${waitPeriod}ms.`)
            await sleep(waitPeriod)
            complete = false
          } else {
            complete = true
            reject(err)
          }
        }
      }
    })
  }
}

class ApiClientBase {
  /**
  • [options.fetch] :object - Defaults to `window.fetch` unless an alternative is passed in.
  • [options.retryAfter] :number[] - Set one or more retry time periods (ms).
  • [options.log] :function - Function to display log messages
  */
  constructor (options = {}) {
    options = Object.assign({
      retryAfter: [],
      fetch: undefined,
      log: undefined
    }, options)

    this.options = options
    this.baseUrl = options.baseUrl || ''
    const _fetch = typeof fetch === 'undefined' ? options.fetch : window.fetch.bind(window)
    this._fetch = createRetryableFetch(_fetch, {
      retryAfter: options.retryAfter,
      log: options.log || function () {}
    })
  }

  /**
  ≈ Called just before the fetch is made. Override to modify the fetchOptions. Used by clients like IG which set bespoke security headers.
   */
  preFetch (url, fetchOptions) {}

  /** ▪︎ api.fetch ⇐ :Response
  The core fetch method. Throws on error, 400 or 500.
  */
  async fetch (path, options = {}) {
    const fetchOptions = Object.assign({}, {
      headers: {}
    }, options)

    const url = `${this.baseUrl}${path}`
    this.preFetch(url, fetchOptions)
    const response = await this._fetch(url, fetchOptions)
    if (response.ok) {
      return response
    } else {
      const err = new Error(`${response.status}: ${response.statusText}`)
      err.name = response.status
      err.response = response
      throw err
    }
  }

  async fetchJson (path, options) {
    const response = await this.fetch(path, options)
    return response.json()
  }

  async fetchText (path, options) {
    const response = await this.fetch(path, options)
    return response.text()
  }

  async graphql (url, query, variables) {
    const json = await this.fetchJson(url, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
      headers: { 'content-type': 'application/json' }
    })
    if (json.errors) {
      const err = new Error('graphql request failed')
      err.responseBody = json
      throw err
    } else {
      return json
    }
  }
}

export default ApiClientBase
