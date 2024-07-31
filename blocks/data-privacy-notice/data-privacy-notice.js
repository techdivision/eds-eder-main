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

import { getCurrentLanguage } from '../../scripts/i18n.js';
import { betterLoadScript } from '../../scripts/load-resource.js';

/**
 * Get language
 *
 * @returns {string}
 */
function getLanguage() {
  const language = getCurrentLanguage();
  if (language === 'fr') {
    return 'fr-fr';
  }
  if (language === 'en') {
    return 'en-en';
  }
  return 'de-de';
}

/**
 * Decorate data privacy notice block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // get key
  const privacyKey = block.querySelector('p').textContent;

  // construct div
  const privacyDiv = document.createElement('div');
  privacyDiv.setAttribute('data-alfidcl-type', 'dps');
  privacyDiv.setAttribute('data-alfidcl-tenant', 'intrasys_scan');
  privacyDiv.setAttribute('data-alfidcl-lang', getLanguage());
  privacyDiv.setAttribute('data-alfidcl-key', privacyKey);
  block.innerHTML = '';
  block.appendChild(privacyDiv);

  // load without partytown, as CORS headers have not been set up correctly:
  /*
    Access to fetch at 'https://app.alfright.eu/ext/dps/intrasys_scan/xxx' from origin 'xxx'
      has been blocked by CORS policy:
    The 'Access-Control-Allow-Origin' header contains multiple values 'frame-ancestors 'self'
      http://www.xxx.de https://www.xxx.de http://*.xxx.de https://*.xxx.de',
      but only one is allowed.
    Have the server send the header with a valid value, or, if an opaque response serves your
      needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
   */
  setTimeout(
    () => {
      betterLoadScript(
        'https://app.alfright.eu/hosted/dps/alfidcl.js',
        {
          defer: '',
          'alfidcl-script': '',
        },
      )
        .then(() => {
          document.dispatchEvent(new Event('InitAlficdl'));
        });
    },
    500,
  );
}
