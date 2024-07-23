import { betterLoadScript } from '../../scripts/load-resource.js';

const dataAlfidclUrl = 'https://app.alfright.eu/hosted/dps/alfidcl.js';

/**
 * Decorate data privacy notice block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const dataAlfidclKey = block.querySelector('p').textContent;
  betterLoadScript(dataAlfidclUrl, { defer: true, 'alfidcl-script': true }).then(() => {
    const event = new Event('DOMContentLoaded');
    block.innerHTML = '<div data-alfidcl-type="dps" '
      + 'data-alfidcl-tenant="intrasys_scan" data-alfidcl-lang="de-de" '
      + `data-alfidcl-key="${dataAlfidclKey}"></div>`;

    document.dispatchEvent(event);
  });
}
