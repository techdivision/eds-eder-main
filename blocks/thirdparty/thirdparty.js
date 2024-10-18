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
  createThirdPartyRelatedScriptTag,
  loadThirdPartyScript,
  loadThirdPartyScriptWithoutPartytown,
} from '../../scripts/load-thirdparty-script.js';
import {
  getCurrentUrl, hasUrlParam, isLocal, isTest, transformRowsToData,
} from '../../scripts/helpers.js';
import { betterLoadScript } from '../../scripts/load-resource.js';

/**
 * Load usercentrics
 *
 * @param {String} id
 * @returns {Promise}
 */
function loadUsercentrics(id) {
  /*
    FIXME
      If we use "bundle.js" with "loadThirdPartyScript":
        it works with partytown but settings button in footer doesn't work
      If we use "loader.js" with "betterLoadScript":
        everything works but without partytown loading to a lower lighthouse score
      If we use "loadThirdPartyScriptWithoutPartytown"
        the script will load too late
      So we use "betterLoadScript" for now.
   */
  return betterLoadScript(
    'https://app.usercentrics.eu/browser-ui/latest/loader.js',
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
  // FIXME we already contacted userlike to provide support for partytown, they did not respond yet
  return loadThirdPartyScriptWithoutPartytown(
    `https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/${id}.js`,
  );
}

/**
 * Init data layer
 *
 * @param {string} id
 */
function initDataLayer(id) {
  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', id);
}

/**
 * Load Google Tag Manager
 *
 * @param {String} id
 * @returns {Promise}
 */
function loadGoogleTagManager(id) {
  /*
   * If our marketing consultants report that with partytown no data is tracked
   *   we can switch to serving GTM normally here
   */
  const usePartyTownForGTM = true;
  const gtmUrl = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  if (!usePartyTownForGTM || hasUrlParam('gtm_debug') || sessionStorage.getItem('gtm_debug')) {
    sessionStorage.setItem('gtm_debug', '1');
    initDataLayer(id);
    betterLoadScript(gtmUrl).then();
    return Promise.resolve();
  }
  return Promise.all(
    [
      createThirdPartyRelatedScriptTag(`${initDataLayer.toString()} ${initDataLayer.name}('${id}');`),
      loadThirdPartyScript(gtmUrl),
    ],
  );
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
      case 'google tag manager':
        loadGoogleTagManager(script.config)
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
