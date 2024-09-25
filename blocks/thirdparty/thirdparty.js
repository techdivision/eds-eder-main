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

import {
  loadThirdPartyScript,
  loadThirdPartyScriptWithoutPartytown,
} from '../../scripts/load-thirdparty-script.js';
import {
  getCurrentUrl,
  isLocal,
  isTest,
  transformRowsToData,
} from '../../scripts/helpers.js';

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
 * Load userlike
 *
 * @param {String} id
 * @returns {Promise}
 */
function loadUserlike(id) {
  // FIXME we already contacted userlike to provide support for partytown
  return loadThirdPartyScriptWithoutPartytown(
    `https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/${id}.js`,
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
    adobeUrls.some((adobeUrl) => {
      if (adobeUrl.includes('development')) {
        if (isLocal()) {
          loadScriptPromise = loadAdobeAnalytics(adobeUrl);
          return true;
        }
      } else if (adobeUrl.includes('staging')) {
        if (isTest()) {
          loadScriptPromise = loadAdobeAnalytics(adobeUrl);
          return true;
        }
      } else if (!isLocal() && !isTest()) {
        loadScriptPromise = loadAdobeAnalytics(adobeUrl);
        return true;
      }
      return false;
    });

    if (loadScriptPromise) {
      return loadScriptPromise;
    }
    // eslint-disable-next-line no-console
    console.error('No valid Adobe Analytics URL found for environment', adobeUrls, currentUrl);
    return Promise.reject();
  }

  // check if URL is valid
  const regex = /^https:\/\/assets\.adobedtm\.com\/[a-f0-9]+\/[a-f0-9]+\/launch-[a-f0-9]+(?:-(staging|development))?\.min\.js$/;
  if (!regex.test(url)) {
    // eslint-disable-next-line no-console
    console.error('URL is not a valid Adobe Analytics URL', url);
    return Promise.reject();
  }

  // load URL
  // FIXME use "loadThirdPartyScript" as soon as Adobe Analytics uses the correct CORS headers
  return loadThirdPartyScriptWithoutPartytown(url);
}

/**
 * Decorate block
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
      case 'userlike':
        loadUserlike(script.config)
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
