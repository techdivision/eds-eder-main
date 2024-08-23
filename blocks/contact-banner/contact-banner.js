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

import loadContactByName from '../contacts/contacts-library.js';

/**
 * Build contact card
 *
 * @param {string} name
 * @param {HTMLElement|null} link
 * @returns {Promise<HTMLDivElement|null>}
 */
async function buildContactCard(name, link) {
  return loadContactByName(name)
    .then((contactFragment) => {
      if (!contactFragment) {
        return null;
      }

      const contactCard = document.createElement('div');
      contactCard.append(...contactFragment.childNodes);
      if (link) {
        link.classList.add('contact-link');
        contactCard.querySelector('.columns > div > div:not(.columns-img-col)')
          .append(link);
      }
      return contactCard;
    });
}

/**
 * Decorate block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // get data from block
  const namesArray = Array.from(block.children[0]?.children || []);
  const linksArray = Array.from(block.children[1]?.children || []);

  // reset block HTML
  [...block.children].slice(1)
    .forEach((child) => block.removeChild(child));

  // build cards
  namesArray.forEach((name, index) => {
    buildContactCard(name.textContent, linksArray[index] || null)
      .then((contactCard) => {
        if (contactCard) {
          name.innerHTML = '';
          name.append(contactCard);
        }
      });
  });
}
