import retryableFetch from 'retryable-fetch'

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
    this._fetch = retryableFetch(_fetch, {
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
