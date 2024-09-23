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

import { handleTranslate } from '../../scripts/i18n.js';

/**
 * Format phone number
 *
 * @param {string} input
 * @returns {string}
 */
function formatPhoneNumber(input) {
  const cleanedInput = input.replace(/[^+\d]/g, '');
  if (cleanedInput.startsWith('+')) {
    return cleanedInput;
  }
  const internationalCode = '+49';
  return internationalCode + (cleanedInput.startsWith('0') ? cleanedInput.slice(1) : cleanedInput);
}

/**
 * Decorate block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // get number
  const number = block.textContent.trim();
  block.innerHTML = '';

  // build link
  const link = document.createElement('a');
  link.setAttribute('href', `https://wa.me/${formatPhoneNumber(number)}`);
  link.setAttribute('target', '_blank');
  handleTranslate(
    (translation) => {
      link.setAttribute('title', translation);
    },
    'Contact via WhatsApp',
  )
    .then();
  link.setAttribute('title', 'A');
  block.append(link);
}
