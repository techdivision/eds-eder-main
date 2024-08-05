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

import { copyAttributes, transformToMetadata, isFilterable, wrapImages } from '../../scripts/helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * @param scope
 * @param {string} selector
 * @param {string} imgWidth
 */
function optimizeImage(scope, selector, imgWidth) {
  scope.querySelectorAll(selector)
    .forEach((img) => {
      const closestPicture = img.closest('picture');

      if (closestPicture) {
        // eslint-disable-next-line max-len
        closestPicture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: imgWidth }]));
      }
    });
}

export default function decorate(block) {
  // transform to metadata when class filterable is set
  if (isFilterable(block)) {
    transformToMetadata(block);
  }

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    copyAttributes(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    let classes = ['image', 'content'];
    ul.classList.add('two-columns');

    // change list of classes if row block has more than two columns
    if (li.children.length > 2) {
      classes = ['image', 'logo', 'content', 'recommendation'];
      ul.classList.remove('two-columns');
    }

    classes.forEach((c, i) => {
      const section = li.children[i];
      if (section) section.classList.add(`${c}`);
    });

    const content = li.querySelector('.content');
    const logo = li.querySelector('.logo');
    if (content && logo) {
      content.append(logo);
    }

    ul.append(li);
  });

  /* wrap images when two column layout  */
  const twoColumnContent = ul.querySelectorAll(':scope.two-columns .content');
  twoColumnContent.forEach((content) => {
    wrapImages(content);
  });

  optimizeImage(ul, ':scope .image img', '750');
  optimizeImage(ul, ':scope .content img', '150');

  block.textContent = '';
  block.append(ul);
}
