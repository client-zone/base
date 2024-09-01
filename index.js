class ApiClientBase {
  /**
   * @param [options] {object}
   * @param [options.baseUrl] {string} - The base URL for all subsequent paths passed into `fetch()`.
   */
  constructor (options = {}) {
    const validOptions = ['baseUrl', 'fetchOptions', 'logger']
    if (!Object.getOwnPropertyNames(options).every(name => validOptions.includes(name))) {
      throw new Error('Valid options are: ' + validOptions.join(', '))
    }
    this.baseUrl = options.baseUrl || ''
    this.fetchOptions = options.fetchOptions || {}
    this.logger = options.logger || {
      log: function () {}
    }
  }

  /**
   * Called just before the fetch is made. Override to modify the fetchOptions. Used by clients which set bespoke security headers.
   */
  preFetch (url, fetchOptions) {}

  /**
   * @param [options] {object}
   * @param [options.skipPreFetch] {boolean}
   * @param [options.fetchOptions] {object} - The default fetch options for each request. E.g. for passing in a custom dispatcher.
   * @returns {Response}
   */
  async fetch (path, options = {}) {
    const fetchOptions = Object.assign({}, this.fetchOptions, options)

    // TODO: rewrite to use URL instances? They have built-in methods like searchParams.add(). Handle URL instances as input as an alternative to `path`? See ibkr-cpapi for a use case study.
    // TODO: Add retrying
    // TODO: Is there still a case for ClientBase now fetch is isomorphic? Still needed for standardised exception handling, timeout control etc?
    const url = `${this.baseUrl}${path}`
    if (!options.skipPreFetch) {
      this.preFetch(url, fetchOptions)
    }

    const now = Date.now()
    let response
    try {
      this.logger.log('Fetching', url, fetchOptions)
      response = await fetch(url, fetchOptions)
    } catch (err) {
      const baseError = new Error(`Failed to fetch: ${url}`)
      baseError.cause = err
      baseError.request = { url, fetchOptions }
      throw baseError
    }

    this.logger.log(`Fetched: ${url}, Response: ${response.status}, Duration: ${Date.now() - now}ms`)
    if (response.ok) {
      return response
    } else {
      const baseError = new Error(`${response.status}: ${response.statusText}`)
      baseError.request = { url, fetchOptions }
      baseError.response = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers
      }
      throw baseError
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
