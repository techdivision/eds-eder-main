import { betterLoadScript } from './load-resource.js';
import { getCurrentUrl } from './helpers.js';

/**
 * Define partytown config
 */
function definePartytownConfig() {
  window.partytown = {
    debug: getCurrentUrl()
      .includes('localhost'),
    lib: '/scripts/vendor/partytown/',
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
        ...attrs,
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
