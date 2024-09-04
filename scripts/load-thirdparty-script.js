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

import { betterLoadScript } from './load-resource.js';
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
      window.dispatchEvent(new CustomEvent('ptupdate'));
    });
}

export default loadThirdPartyScript;
