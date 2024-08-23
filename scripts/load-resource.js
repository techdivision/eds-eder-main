/*
 * Copyright (c) 2024 TechDivision GmbH
 * All rights reserved
 *
 * This product includes proprietary software developed at TechDivision GmbH, Germany
 * For more information see https://www.techdivision.com/
 *
 * To obtain a valid license for using this software please contact us at
 * license@techdivision.com
 */

import ffetch from './vendor/ffetch.js';

// fetch cache is valid for the current day only to ensure current content is being loaded
const currentDate = new Date().toISOString()
  .split('T')[0];
const fetchCacheKeyPrefix = 'fetch-cache';
const fetchCacheKey = `${fetchCacheKeyPrefix}-${currentDate}`;
const loadedStorage = {};
const onLoadStorage = {};

/**
 * Resolve loaded resource
 *
 * @param {String} href
 */
function resolveLoad(href) {
  loadedStorage[href] = true;
  if (onLoadStorage[href]) {
    onLoadStorage[href].forEach((resolve) => resolve());
    delete onLoadStorage[href];
  }
}

/**
 * Add resolver
 *
 * @param {String} href
 * @param {Function} resolve
 */
function addResolver(href, resolve) {
  if (loadedStorage[href]) {
    resolve();
  } else {
    onLoadStorage[href] = (onLoadStorage[href] || []);
    onLoadStorage[href].push(resolve);
  }
}

/**
 * Loads a CSS file.
 * @param {string} href URL to the CSS file
 */
async function betterLoadCSS(href) {
  return new Promise((resolve, reject) => {
    addResolver(href, resolve);
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolveLoad(href);
      link.onerror = reject;
      document.head.append(link);
    }
  });
}

/**
 * Loads a non module JS file.
 * @param {string} href URL to the JS file
 * @param {Object} [attrs] additional optional attributes
 */
async function betterLoadScript(href, attrs) {
  return new Promise((resolve, reject) => {
    addResolver(href, resolve);
    if (!document.querySelector(`head > script[src="${href}"]`)) {
      const script = document.createElement('script');
      script.src = href;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = () => resolveLoad(href);
      script.onerror = reject;
      document.head.append(script);
    }
  });
}

/**
 * Load third party module
 *
 * @param {String} name
 * @param {Function} callback
 */
function loadThirdPartyModule(name, callback) {
  Promise.all(
    [
      betterLoadCSS(`/styles/vendor/${name}.css`),
      import(`/scripts/vendor/${name}.js`),
    ],
  )
    .then(callback);
}

/**
 * Load third party bundle
 *
 * @param {String} name
 * @param {Function} callback
 */
function loadThirdPartyBundle(name, callback) {
  Promise.all(
    [
      betterLoadCSS(`/styles/vendor/${name}.css`),
      betterLoadScript(`/scripts/vendor/${name}.js`),
    ],
  )
    .then(callback);
}

/**
 * Tidy old cache entries
 *
 * @returns {Promise}
 */
async function tidyOldCacheEntries() {
  return caches.keys()
    .then((cacheKeys) => {
      cacheKeys.forEach((key) => {
        if (key.startsWith(fetchCacheKeyPrefix)
          && key !== fetchCacheKey) {
          caches.delete(key)
            .then();
        }
      });
    });
}

/**
 * Cache wrapper
 *
 * @param {string} url
 * @param {Function} handler
 * @returns {Promise}
 */
async function cacheWrapper(url, handler) {
  // remove old cache entries
  tidyOldCacheEntries()
    .then();

  // open cache
  const cache = await caches.open(fetchCacheKey);

  // check if response is cached
  const cachedResponse = await cache.match(url);
  if (cachedResponse) {
    return Promise.resolve(await cachedResponse.json());
  }

  // return given handler with save handler
  return handler(async (data) => {
    // noinspection JSCheckFunctionSignatures
    await cache.put(url, new Response(JSON.stringify(data)));
    return data;
  });
}

/**
 * Cached fetch request
 *
 * @param {string} url
 * @returns {Promise}
 */
async function cachedFetch(url) {
  return cacheWrapper(url, (save) => ffetch(url)
    .all()
    .then(save));
}

/**
 * Cached HTML fetch request
 *
 * @param {string} url
 * @returns {Promise}
 */
async function cachedHtmlFetch(url) {
  return cacheWrapper(url, (save) => fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      return null;
    })
    .then(save));
}

/**
 * Clear fetch cache
 *
 * @returns {Promise}
 */
async function clearFetchCache() {
  tidyOldCacheEntries()
    .then();
  return caches.delete(fetchCacheKey)
    .then();
}

export {
  betterLoadScript,
  betterLoadCSS,
  loadThirdPartyBundle,
  loadThirdPartyModule,
  cachedFetch,
  cachedHtmlFetch,
  clearFetchCache,
};
