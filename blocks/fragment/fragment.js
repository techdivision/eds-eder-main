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

/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 * @see https://github.com/adobe/aem-block-collection/tree/main/blocks/fragment
 */

import { decorateMain } from '../../scripts/scripts.js';
import { loadBlocks } from '../../scripts/aem.js';
import { getCurrentUrl } from '../../scripts/helpers.js';
import { cachedHtmlFetch } from '../../scripts/load-resource.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    // BEGIN CHANGE TechDivision
    // cache fragment
    const responseText = await cachedHtmlFetch(`${path}.plain.html`);
    if (responseText) {
      const main = document.createElement('main');
      main.innerHTML = await responseText;
      // END CHANGE TechDivision

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`)
          .forEach((elem) => {
            elem[attr] = new URL(
              elem.getAttribute(attr),
              new URL(path, getCurrentUrl()),
            ).href;
          });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadBlocks(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section')
        .classList
        .add(...fragmentSection.classList);
      block.closest('.fragment')
        .replaceWith(...fragment.childNodes);
    }
  }
}
