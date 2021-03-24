(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ApiClientBase = factory());
}(this, (function () { 'use strict';

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

  function createRetryableFetch (fetch, defaultOptions) {
    defaultOptions = Object.assign({
      retryAfter: [],
      log: function () {}
    }, defaultOptions);
    return function retryableFetch (url, options) {
      options = Object.assign({}, defaultOptions, options);
      const retryAfter = options.retryAfter.slice();
      return new Promise(async (resolve, reject) => {
        let complete = false;
        while (!complete) {
          try {
            options.log('FETCH:', url);
            const response = await fetch(url, options);
            if (response.ok) {
              options.log('RES:', response.url, { status: response.status, statusText: response.statusText });
              resolve(response);
              complete = true;
            } else {
              const text = await response.text();
              options.log('RES:', response.url, { status: response.status, statusText: response.statusText, text });
              const err = new Error('fetch failed: ' + response.status + '\n' + text);
              err.status = response.status;
              err.responseBody = text;
              throw err
            }
          } catch (err) {
            const remainingRetries = retryAfter.length;
            if (remainingRetries) {
              const waitPeriod = retryAfter.shift();
              options.log(`RETRY: ${url}, ${remainingRetries} attempts remaining, waiting ${waitPeriod}ms.`);
              await sleep(waitPeriod);
              complete = false;
            } else {
              complete = true;
              reject(err);
            }
          }
        }
      })
    }
  }

  class ApiClientBase {
    constructor (baseUrl, options = {}) {
      options = Object.assign({
        retryAfter: [],
        fetch: undefined
      }, options);

      this.baseUrl = baseUrl;
      const _fetch = typeof fetch === 'undefined' ? options.fetch : window.fetch.bind(window);
      this._fetch = createRetryableFetch(_fetch, {
        retryAfter: options.retryAfter
      });
    }

    validateFetch () {}

    async authorise (accessToken) {
      if (accessToken) {
        this.accessToken = accessToken;
      }
    }

    async fetch (path, options = {}) {
      this.validateFetch();
      const fetchOptions = Object.assign({}, {
        headers: {}
      }, options);
      if (this.accessToken) {
        fetchOptions.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      // console.log(`${this.baseUrl}${path}`, fetchOptions)
      const response = await this._fetch(`${this.baseUrl}${path}`, fetchOptions);
      if (response.ok) {
        return response
      } else {
        const err = new Error(`${response.status}: ${response.statusText}`);
        err.name = response.status;
        err.response = response;
      }
    }

    async fetchJson (path, options) {
      const response = await this.fetch(path, options);
      return response.json()
    }

    async fetchText (path, options) {
      const response = await this.fetch(path, options);
      return response.text()
    }
  }

  return ApiClientBase;

})));
