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
  const cookieLink = footer.querySelector('a[href$="#cookielink"]');
  cookieLink.setAttribute('onClick', 'UC_UI.showSecondLayer();');
  cookieLink.addEventListener('click', (event) => {
    event.preventDefault();
  });

  block.append(footer);
}
