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

/* global WebImporter */

import {
  handleImages,
  handleIcons,
} from './import-util.js';

/**
 * Replace whitespaces with any other char
 * @param string
 * @param replaceChar
 * @returns {*}
 */
function replaceWhitespaces(string, replaceChar) {
  return string.replace(/\s/g, replaceChar);
}

/**
 * Normalizes string
 *
 * @param str
 * @returns {*}
 */
function normalize(str) {
  const combining = /[\u0300-\u036F]/g;
  return str.normalize('NFKD')
    .replace(combining, '')
    .replace('ß', 'ss');
}

const removeGenericContent = (main) => {
  // remove header, footer and generic elements from content
  WebImporter.DOMUtils.remove(main, [
    'nav',
    '.nav',
    'footer',
    '.footer',
    'noscript',
    '.footer-box',
    '.offcanvas',
    '.breadcrumb',
    '.visible-xs',
    '.visible-ma-button',
  ]);
};

const generateDocumentPathFromName = (name) => {
  const contactName = replaceWhitespaces(name, '-').toLowerCase();

  return `/contacts/${normalize(contactName)}`;
};

export default {
  transform: ({
    document,
  }) => {
    const main = document.body;

    removeGenericContent(main);

    handleImages(main);
    handleIcons(main);

    const contacts = main.querySelectorAll('div.hidden-ma-button');

    const documentList = [];

    contacts.forEach((contact) => {
      const image = contact.querySelector('img') || '';

      const details = contact;

      // remove newline between icon and text
      const detailLines = details.querySelectorAll('div.detail-text');

      detailLines.forEach((detailLine) => {
        const icon = detailLine.querySelector('div.staff-headline');
        const staffText = detailLine.querySelector('div.staff-text');

        const newLine = document.createElement('p');

        newLine.append(`${icon.innerText} ${staffText.innerText}`);

        detailLine.replaceWith(newLine);
      });

      const cells = [
        ['Columns (one-quarter-three-quarter)'],
        [image, details],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      const newDocument = document.createElement('div');

      newDocument.append(resultTable);

      const name = details.querySelector('p.staff-headline').innerText;

      // create path (= the location the document is stored at)
      const path = generateDocumentPathFromName(name);

      documentList.push({
        element: newDocument,
        path,
      });
    });

    return documentList;
  },
};
