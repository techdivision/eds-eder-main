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

import { hasBodyClass } from '../../scripts/helpers.js';
import { tContent } from '../../scripts/i18n.js';
import loadContactByName from './contacts-library.js';

/**
 * @param {Element} block The contacts block element
 */
export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup contact columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const contact = col.querySelector(':scope > p');

      if (contact) {
        // remove contact name
        contact.parentNode.removeChild(contact);

        // eslint-disable-next-line no-await-in-loop
        loadContactByName(contact.textContent)
          .then((contactFragment) => {
            if (contactFragment) {
              col.append(...contactFragment.childNodes);
            } else {
              col.append(contact);
            }
          });
      }
    });
  });

  // add headline if sidebar contains contacts block
  if (hasBodyClass('has-sidebar')) {
    const contact = document.body.querySelector('.section.sidebar > .contacts-wrapper');

    if (contact && !contact.querySelector(':scope > .contact-headline')) {
      const headline = document.createElement('div');
      headline.classList.add('contact-headline');
      tContent(headline, 'Contact')
        .then();

      contact.prepend(headline);
    }
  }
}
