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

import { createOptimizedPicture } from '../../scripts/aem.js';
import { copyAttributes, transformToMetadata } from '../../scripts/helpers.js';

export default function decorate(block) {
  // transform to metadata when class filterable is set
  if (block.classList.contains('filterable')) {
    transformToMetadata(block);
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    const li = document.createElement('li');
    copyAttributes(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if ((div.children.length === 1 && div.querySelector('picture')) || (div.children.length === 2 && div.querySelector(':scope > p > picture'))) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';

        const images = div.querySelectorAll('picture');
        if (images.length > 0) {
          const imgWrapper = document.createElement('div');
          imgWrapper.className = 'image-wrapper';

          images.forEach((img) => {
            const parent = img.closest('p');
            if (parent) {
              imgWrapper.append(parent);
            }
          });

          div.append(imgWrapper);
        }
      }
    });

    if (li.querySelectorAll('a').length === 1) {
      li.addEventListener('click', () => {
        window.open(link.href, '_self');
      });

      li.className = 'clickable';
    }

    ul.append(li);
  });
  ul.querySelectorAll('img')
    .forEach((img) => {
      const closestPicture = img.closest('picture');

      if (closestPicture) {
        closestPicture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
      }
    });
  block.textContent = '';
  block.append(ul);
}
