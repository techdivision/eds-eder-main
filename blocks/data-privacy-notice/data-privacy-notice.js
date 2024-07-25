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
  } else if (language === 'en') {
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
  const privacyKey = block.querySelector('p').textContent;

  const privacyDiv = document.createElement('div');
  privacyDiv.setAttribute('data-alfidcl-type', 'dps');
  privacyDiv.setAttribute('data-alfidcl-tenant', 'intrasys_scan');
  privacyDiv.setAttribute('data-alfidcl-lang', getLanguage());
  privacyDiv.setAttribute('data-alfidcl-key', privacyKey);
  block.innerHTML = '';
  block.appendChild(privacyDiv);

  betterLoadScript(
    'https://app.alfright.eu/hosted/dps/alfidcl.js',
    {
      defer: '',
      'alfidcl-script': ''
    }
  )
    .then();
}
