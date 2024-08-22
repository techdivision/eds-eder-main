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
 * Add linked data
 *
 * @param {Object} data
 */
function addLinkedData(data) {
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.innerHTML = JSON.stringify(data, null, 4);
  document.head.append(tag);
}

/**
 * Decorate block
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // extract data
  const jsonString = block.textContent;
  block.innerHTML = '';

  try {
    const json = JSON.parse(jsonString);
    addLinkedData(json);
  } catch {
    // eslint-disable-next-line no-console
    console.error('Input is no valid JSON', jsonString);
  }
}
