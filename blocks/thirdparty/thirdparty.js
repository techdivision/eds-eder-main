// noinspection JSUnusedGlobalSymbols,JSUnresolvedReference

import loadThirdPartyScript from '../../scripts/load-thirdparty-script.js';
import { getCurrentUrl, transformRowsToData } from '../../scripts/helpers.js';
import { betterLoadScript } from '../../scripts/load-resource.js';

/**
 * Load usercentrics
 *
 * @param {String} id
 * @returns {Promise}
 */
function loadUsercentrics(id) {
  /*
    FIXME loader.js works for settings button, bundle.js doesn't, but loader.js
    will lead to lighthouse score issues
   */
  return loadThirdPartyScript(
    'https://app.usercentrics.eu/browser-ui/latest/bundle.js',
    {
      id: 'usercentrics-cmp',
      'data-settings-id': id,
    },
  );
}

/**
 * Load Google Analytics
 *
 * @param {String} id
 * @returns {Promise}
 */
function loadGoogleAnalytics(id) {
  window.dataLayer = window.dataLayer || [];

  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }

  gtag('js', new Date());
  gtag('config', id);

  return loadThirdPartyScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
}

/**
 * Load Adobe Analytics
 *
 * @param {String} url
 * @returns {Promise}
 */
function loadAdobeAnalytics(url) {
  // check for multiple URLs
  if (url.includes(',') || url.includes('\n')) {
    const adobeUrls = url.split(url.includes(',') ? ',' : '\n')
      .map((str) => str.replace(/\s+/g, ''));
    const currentUrl = getCurrentUrl();
    let loadScriptPromise = null;

    // find current URL for environment
    adobeUrls.forEach((adobeUrl) => {
      if (adobeUrl.includes('development')) {
        if (currentUrl.includes('localhost')) {
          loadScriptPromise = loadAdobeAnalytics(adobeUrl);
        }
      } else if (adobeUrl.includes('staging')) {
        if (currentUrl.includes('hlx.page')) {
          loadScriptPromise = loadAdobeAnalytics(adobeUrl);
        }
      } else if (!currentUrl.includes('localhost')
        && !currentUrl.includes('hlx.page')) {
        loadScriptPromise = loadAdobeAnalytics(adobeUrl);
      }
    });

    if (loadScriptPromise) {
      return loadScriptPromise;
    }
    // eslint-disable-next-line no-console
    console.error('No valid Adobe Analytics URL found for environment', adobeUrls, currentUrl);
    return Promise.resolve();
  }

  // check if URL is valid
  const regex = /^https:\/\/assets\.adobedtm\.com\/[a-f0-9]+\/[a-f0-9]+\/launch-[a-f0-9]+(?:-(staging|development))?\.min\.js$/;
  if (!regex.test(url)) {
    // eslint-disable-next-line no-console
    console.error('URL is not a valid Adobe Analytics URL', url);
    return Promise.resolve();
  }

  // load URL
  // FIXME use "loadThirdPartyScript" as soon as Adobe Analytics uses the correct CORS headers
  return betterLoadScript(url);
}

/**
 * Decorate slider block
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // extract config
  const config = transformRowsToData(
    {
      platform: 'text',
      config: 'text',
    },
    block,
  );
  block.innerHTML = '';

  // load scripts
  [...config].forEach((script) => {
    switch (script.platform.toLowerCase()) {
      case 'usercentrics':
        loadUsercentrics(script.config)
          .then();
        break;
      case 'google analytics':
        loadGoogleAnalytics(script.config)
          .then();
        break;
      case 'adobe analytics':
        loadAdobeAnalytics(script.config)
          .then();
        break;
      default:
        // eslint-disable-next-line no-console
        console.error('Script type is not supported', script);
        break;
    }
  });
}
