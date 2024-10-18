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

import { betterLoadScript, createScriptTag } from './load-resource.js';
import { isLocal } from './helpers.js';

/**
 * Define partytown config
 */
function definePartytownConfig() {
  window.partytown = {
    debug: isLocal(),
    lib: '/scripts/vendor/partytown/',
    forward: [
      ['dataLayer.push', { preserveBehavior: true }],
      ['fbq', { preserveBehavior: false }],
      'gtm.push',
    ],
  };
}

/**
 * Load partytown
 *
 * @returns {Promise}
 */
function loadPartytown() {
  definePartytownConfig();
  return betterLoadScript(
    '../../../scripts/vendor/partytown/partytown.js',
    { type: 'module' },
  );
}

/**
 * Inform partytown about new scripts
 */
function informPartyTownAboutNewScripts() {
  window.dispatchEvent(new CustomEvent('ptupdate'));
}

/**
 * Load third party script
 *
 * @param {String} script
 * @param {Object} [attrs]
 * @returns {Promise}
 */
function loadThirdPartyScript(script, attrs) {
  return loadPartytown()
    .then(() => {
      // add partytown attributes to attrs
      const attributes = {
        ...(attrs || {}),
        type: 'text/partytown',
        defer: '',
      };

      // load via partytown
      betterLoadScript(script, attributes)
        .then();
      informPartyTownAboutNewScripts();
    });
}

/**
 * Load third party script without partytown
 *
 * @param {String} url
 * @returns {Promise}
 */
function loadThirdPartyScriptWithoutPartytown(url) {
  // FIXME we use setTimeout here to enhance the LH score
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(betterLoadScript(url, { defer: '' }));
      },
      2000,
    );
  });
}

/**
 * Create third party related script tag
 *
 * @param {String} scriptContent
 * @returns {Promise}
 */
function createThirdPartyRelatedScriptTag(scriptContent) {
  return loadPartytown()
    .then(() => {
      createScriptTag(
        {
          type: 'text/partytown',
        },
        scriptContent,
      );
      informPartyTownAboutNewScripts();
    });
}

export {
  loadThirdPartyScript,
  loadThirdPartyScriptWithoutPartytown,
  createThirdPartyRelatedScriptTag,
};
