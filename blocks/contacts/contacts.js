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

/* eslint-disable no-restricted-syntax */

import {
  getCurrentUrl,
  replaceWhitespaces,
  normalize,
  hasBodyClass,
} from '../../scripts/helpers.js';
import { loadFragment } from '../fragment/fragment.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadPlaceholders, ts } from '../../scripts/i18n.js';

/**
 * @param {Element} block The contacts block element
 */
export default async function decorate(block) {
  await loadPlaceholders();

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup contact columns
  for (const row of [...block.children]) {
    for (const col of [...row.children]) {
      const contact = col.querySelector(':scope > p');

      if (contact) {
        // create url
        const contactName = replaceWhitespaces(contact.textContent, '-').toLowerCase();

        // load contact as fragment and create structure
        const contactUrl = `/contacts/${normalize(contactName)}`;
        const metadata = getMetadata(contactUrl);
        const contactPath = metadata ? new URL(metadata, getCurrentUrl()).pathname : contactUrl;
        // eslint-disable-next-line no-await-in-loop
        const contactFragment = await loadFragment(contactPath);

        while (contactFragment.firstElementChild) col.append(contactFragment.firstElementChild);

        // remove contact name
        contact.parentNode.removeChild(contact);
      }
    }
  }

  // add headline if sidebar contains contacts block
  if (hasBodyClass('has-sidebar')) {
    const contact = document.body.querySelector('.section.sidebar > .contacts-wrapper');

    if (contact && !contact.querySelector(':scope > .contact-headline')) {
      const headline = document.createElement('div');
      headline.classList.add('contact-headline');
      headline.textContent = ts('Contact');

      contact.prepend(headline);
    }
  }
}
