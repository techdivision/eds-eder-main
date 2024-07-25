// noinspection JSUnusedGlobalSymbols,JSUnresolvedReference

import loadThirdPartyScript from '../../scripts/load-thirdparty-script.js';

/**
 * Load usercentrics
 *
 * @param {String} id
 * @returns {Promise}
 */
function loadUsercentrics(id) {
  return loadThirdPartyScript(
    /*
      FIXME loader.js works for settings button, bundle.js doesn't, but loader.js
      will lead to lighthouse score issues
     */
    'https://app.usercentrics.eu/browser-ui/latest/bundle.js',
    {
      id: 'usercentrics-cmp',
      'data-settings-id': id,
    },
  );
}

/**
 * Decorate slider block
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const usercentricsId = block.children[0].textContent.trim();
  block.innerHTML = '';
  loadUsercentrics(usercentricsId)
    .then();
}
