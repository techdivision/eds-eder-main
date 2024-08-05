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
  determineEdsBaseUrl,
  handleTable,
  handleTopImage,
  handleLinks,
  handle2ColumnsGrid,
  handle3ColumnsGrid,
  handleSidebar,
  handleImages,
  handleIcons,
  handleIframes,
  handleAccordions,
  handleGallerySlider,
  handleTextBoxes,
  handleFilterAndRows,
  handleImagesInText,
  handleTextPic,
  handleBrs,
  handleContacts,
  handlePdfs,
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

export default {
  transform: ({
    document,
    url,
    params,
  }) => {
    const main = document.body;

    const baseUrl = determineEdsBaseUrl(params);

    // list of resulting documents in EDS, might be multiple if downloadable PDFs are present
    const results = [];

    // handle possible internal links to PDF-documents
    handlePdfs(main, url, baseUrl, results);

    // handle content of the document itself
    removeGenericContent(main);

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    // handle image-slider before modifying image-urls in general
    handleGallerySlider(main, document, baseUrl);

    // handle images for all other imports that follow
    handleImages(main);

    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handle2ColumnsGrid(main, document);
    handle3ColumnsGrid(main, document);
    handleSidebar(main, document);
    handleIcons(main);
    handleIframes(main, document);
    handleAccordions(main, document);
    handleTextBoxes(main, document);
    handleFilterAndRows(main, document);
    handleImagesInText(main, document);
    handleTextPic(main, document);
    handleBrs(main, document);
    handleContacts(main, document);

    WebImporter.rules.createMetadata(main, document);

    results.push({
      element: main,
      path: new URL(url).pathname
    });

    return results;
  },
};
