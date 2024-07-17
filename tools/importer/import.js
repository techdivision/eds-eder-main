/* global WebImporter */

import {
  determineEdsBaseUrl,
  handleTable,
  handleTopImage,
  handleLinks,
  handle3ColumnsGrid,
  handleSidebar,
  handleImages,
  handleIcons,
  handleIframes,
  handleAccordions,
  handleGallerySlider,
  handleTextBoxes,
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
  transformDOM: ({
    document,
    params,
  }) => {
    const main = document.body;

    removeGenericContent(main);

    const baseUrl = determineEdsBaseUrl(params);

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handle3ColumnsGrid(main, document);
    handleSidebar(main, document);
    handleImages(main);
    handleIcons(main);
    handleIframes(main, document);
    handleAccordions(main, document);
    handleGallerySlider(main, document, baseUrl);
    handleTextBoxes(main, document);

    WebImporter.rules.createMetadata(main, document);

    return main;
  },
};
