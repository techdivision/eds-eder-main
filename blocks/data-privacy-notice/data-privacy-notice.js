import { loadScript } from '../../scripts/aem.js';

const dataAlfidclUrl = 'https://app.alfright.eu/hosted/dps/alfidcl.js';

/**
 * Decorate data privacy notice block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const dataAlfidclKey = block.querySelector('p').innerHTML;
  loadScript(dataAlfidclUrl, {}).then(() => {
    const event = new Event('DOMContentLoaded');
    document.head.insertAdjacentHTML(
      'beforeend',
      `<script src="${dataAlfidclUrl}" defer alfidcl-script></script>`,
    );

    block.innerHTML = '<div data-alfidcl-type="dps" '
      + 'data-alfidcl-tenant="intrasys_scan" data-alfidcl-lang="de-de" '
      + `data-alfidcl-key="${dataAlfidclKey}"></div>`;

    document.dispatchEvent(event);
  });
}
