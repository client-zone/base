class ApiClientBase {
  /**
   * @param [options] {object}
   * @param [options.baseUrl] {string} - The base URL for all subsequent paths passed into `fetch()`.
   * @param [options.fetchOptions] {object}
   * @param [options.console] {object}
   */
  constructor (options = {}) {
    this.baseUrl = options.baseUrl || ''
    this.fetchOptions = options.fetchOptions || {}
    this.console = options.console || {}
    this.console.log ||= function () {}
    this.console.info ||= function () {}
    this.console.warn ||= function () {}
    this.console.error ||= function () {}
    this.console.table ||= function () {}
  }

  async #createNotOKError (url, fetchOptions, response) {
    const err = new Error(`${response.status}: ${response.statusText}`)
    err.request = { url, fetchOptions }
    err.response = {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
      headers: response.headers
    }
    return err
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
    const url = `${this.baseUrl}${path}`
    if (!options.skipPreFetch) {
      this.preFetch(url, fetchOptions)
    }

    const now = Date.now()
    let response
    try {
      this.console.info('Fetching', url, fetchOptions)
      /* Potential fetch exceptions: https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions */
      response = await fetch(url, fetchOptions)
    } catch (err) {
      const baseError = new Error(`Failed to fetch: ${url}`)
      baseError.cause = err
      baseError.request = { url, fetchOptions }
      throw baseError
    }

    this.console.info(`Fetched: ${url}, Response: ${response.status}, Duration: ${Date.now() - now}ms`)
    return response
  }

  async fetchJson (path, options) {
    const response = await this.fetch(path, options)
    if (response.ok) {
      return response.json()
    } else {
      const err = await this.#createNotOKError(path, options, response)
      throw err
    }
  }

  async fetchText (path, options) {
    const response = await this.fetch(path, options)
    if (response.ok) {
      return response.text()
    } else {
      const err = await this.#createNotOKError(path, options, response)
      throw err
    }
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
