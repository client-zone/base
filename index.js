import a from 'node:assert/strict'

class ApiClientBase {
  /**
   * @param [options] {object}
   * @param [options.baseUrl] {string} - The base URL for all subsequent paths passed into `fetch()`.
   */
  constructor (options = {}) {
    const validOptions = ['baseUrl', 'fetchOptions']
    a.equal(
      Object.getOwnPropertyNames(options).every(name => validOptions.includes(name)),
      true,
      'Valid options are: ' + validOptions.join(', ')
    )
    this.options = options
    this.baseUrl = options.baseUrl || ''
    this.fetchOptions = options.fetchOptions || {}
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
    // TODO: Add error.cause
    // TODO: Add retrying
    const url = `${this.baseUrl}${path}`
    if (!options.skipPreFetch) {
      this.preFetch(url, fetchOptions)
    }
    try {
      const response = await fetch(url, fetchOptions)
    } catch (err) {
      const baseError = new Error(`Failed to fetch: ${url}`)
      baseError.cause = err
      baseError.request = { url, fetchOptions }
      baseError.response = {}
      throw baseError
    }

    if (response.ok) {
      return response
    } else {
      const err = new Error(`${response.status}: ${response.statusText}`)
      err.request = { url, fetchOptions }
      err.response = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        headers: response.headers
      }
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
