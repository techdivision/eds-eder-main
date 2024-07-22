import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getCurrentUrl } from '../../scripts/helpers.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, getCurrentUrl()).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // usercentrics settings button
  footer.querySelector('a[href$="#cookielink"]')
    .addEventListener('click', (event) => {
      event.preventDefault();

      // noinspection JSUnresolvedReference
      if (typeof (window.UC_CI) === 'undefined') {
        // eslint-disable-next-line no-console
        console.error('Usercentrics has not been loaded!');
      } else {
        // noinspection JSUnresolvedReference
        window.UC_UI.showSecondLayer();
      }
    });

  block.append(footer);
}
