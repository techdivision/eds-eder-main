/* global WebImporter */

import {
  handleImages,
  handleIcons,
} from './import-util.js';

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
  const result = `/contacts/${name.toLowerCase()}`;

  return result.replace(/[^a-z0-9/]/gm, '-');
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
      const image = contact.querySelector('img');

      const details = contact;

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
