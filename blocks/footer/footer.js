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

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getCurrentUrl } from '../../scripts/helpers.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 * @see https://github.com/adobe/aem-block-collection/tree/main/blocks/footer
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
  if (cookieLink) {
    cookieLink.setAttribute(
      'onClick',
      'typeof(UC_UI) !== \'undefined\' && UC_UI.showSecondLayer()',
    );
    cookieLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  block.append(footer);
}
