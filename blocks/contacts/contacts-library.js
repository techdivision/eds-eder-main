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

import {
  normalize,
  replaceWhitespaces,
} from '../../scripts/helpers.js';
import { loadFragmentAsync } from '../fragment/fragment.js';

/**
 * Load contact by name
 *
 * @param {string} name
 * @returns {Promise<HTMLElement|null>}
 */
export default async function loadContactByName(name) {
  const contactName = replaceWhitespaces(name.trim(), '-')
    .toLowerCase();

  // load contact as fragment and create structure
  const contactUrl = `/contacts/${normalize(contactName)}`;
  return loadFragmentAsync(contactUrl);
}
