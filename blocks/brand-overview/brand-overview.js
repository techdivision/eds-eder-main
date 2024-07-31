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

/**
 * Create div and append element
 *
 * @param {HTMLElement} element
 * @returns {HTMLDivElement}
 */
function createDivAndAppend(element) {
  const div = document.createElement('div');
  div.append(element);
  return div;
}

/**
 * Rebuild brand overview block
 *
 * @param {HTMLElement|Node} container
 * @param {HTMLElement} header
 * @param {HTMLElement} content
 */
function rebuildBlock(container, header, content) {
  const block = document.createElement('div');
  block.classList.add('brand-overview', 'block');
  block.append(createDivAndAppend(header));
  block.append(createDivAndAppend(content));
  container.append(block);
  // eslint-disable-next-line no-use-before-define
  decorate(block);
}

/**
 * Decorate block
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // tear apart multiple headers to multiple brand overview blocks
  const headers = block
    .querySelectorAll(':scope > div:first-child > div');
  if (headers.length > 1) {
    headers.forEach((header, i) => {
      // first header should stay in current block
      if (i < 1) {
        return;
      }

      // rebuild block for other headers
      const content = block
        .querySelector(`:scope > div:nth-child(2) > div:nth-child(${i})`);
      rebuildBlock(block.parentNode, header, content);
    });
  }

  // iterate over all rows
  block.querySelectorAll(':scope > div')
    .forEach(
      (row, i) => {
        // add classes depending on the role
        row.classList.add('row');
        if (i === 0) {
          row.classList.add('header');
        } else {
          row.classList.add('content');
        }

        // iterate over columns
        row.querySelectorAll(':scope > div')
          .forEach((col) => {
            // create button wrapper
            const buttons = document.createElement('div');
            buttons.classList.add('button-wrapper');
            col.append(buttons);
            col.querySelectorAll('.button-container')
              .forEach((btnC) => {
                buttons.append(btnC);
              });
          });
      },
    );
}
