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
  shouldBeImported,
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
  handleContacts,
  handleTextBoxes,
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
    'p.text-muted',
    'div.news-backlink-wrap',
  ]);
};

const initAdditionalData = () => {
  // cache news metadata sheet for news imports
  const request = new XMLHttpRequest();
  request.open(
    'GET',
    'https://main--eds-eder-main--techdivision.hlx.page/migration/news-metadata.json',
    false,
  );
  request.overrideMimeType('text/json; UTF-8');
  request.send(null);

  if (request.status === 200) {
    window.newsList = JSON.parse(request.responseText).data;
  }
};

/**
 * Handles metadata, by migrating the default entries and extracting the news-specific entries.
 * @param main
 * @param document
 * @param news
 * @param html
 */
const handleMetadata = (main, document, news, html) => {
  // get regular metadata as its original done in WebImporter.rules.createMetadata
  const meta = WebImporter.Blocks.getMetadata(document);

  /*
   * Extend metadata with custom entries
   * The original HTML is used here as EDS already cleanup the HTML-markup in 'document'
   */
  const parser = new DOMParser();

  const originalHtmlObject = parser.parseFromString(html, 'text/html');

  const originalStructuredDataSection = originalHtmlObject.querySelector('script[type="application/ld+json"]');

  const structuredDataJson = JSON.parse(originalStructuredDataSection.innerHTML);

  // extract preview-image
  if (structuredDataJson && structuredDataJson.image && structuredDataJson.image.url) {
    // create img-tag in order to allow administration of image, and not only the url
    const image = document.createElement('img');

    const previewImageUrl = new URL(structuredDataJson.image.url);

    image.setAttribute('src', previewImageUrl.pathname);

    meta.preview_image = image;
  }

  // extract publication-date
  if (structuredDataJson && structuredDataJson.datePublished) {
    const publicationDateObject = new Date(structuredDataJson.datePublished);

    const month = (publicationDateObject.getMonth() + 1).toLocaleString(
      'en-US',
      { minimumIntegerDigits: 2, useGrouping: false },
    );
    const day = publicationDateObject.getDate().toLocaleString(
      'en-US',
      { minimumIntegerDigits: 2, useGrouping: false },
    );

    meta.date_published = `${day}.${month}.${publicationDateObject.getFullYear()}`;
  }

  meta.section = news.section || '';

  meta.location = news.location || '';

  // create table for metadata and append it like it's done in WebImporter.rules.createMetadata
  if (Object.keys(meta).length > 0) {
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);
  }
};

/**
 * Returns document-path for given url - copy of EDS-core import-method, as it can not be accessed
 * @param url
 * @returns {string}
 */
const generateDocumentPath = (url) => {
  let p = new URL(url).pathname;
  if (p.endsWith('/')) {
    p = `${p}index`;
  }
  return decodeURIComponent(p)
    .toLowerCase()
    .replace(/\.html$/, '')
    .replace(/[^a-z0-9/]/gm, '-');
};

export default {
  transform: ({
    url,
    document,
    params,
    html,
  }) => {
    // load additional data (the data that is not present in the HTML-markup)
    if (!window.newsList) {
      initAdditionalData();
    }

    // determine whether the current news should be imported
    const originalUrl = new URL(params.originalURL);

    const originalUrlPathname = originalUrl.pathname;

    const originalUrlSections = originalUrlPathname.split('/');

    const pathSegment = originalUrlSections[originalUrlSections.length - 1];

    const news = window.newsList.find((entry) => entry.path_segment === pathSegment);

    // make sure additional data is present
    if (!news) {
      /* eslint-disable no-console */
      console.log(`No import can take place as no additional data was found for the news with path-segment '${pathSegment}'`);
      /* eslint-enable no-console */
      return [];
    }

    // determine whether the news should be imported
    if (!shouldBeImported(news, originalUrl)) {
      return [];
    }

    const baseUrl = determineEdsBaseUrl(params);

    const main = document.body;

    // list of resulting documents in EDS, might be multiple if downloadable PDFs are present
    const results = [];

    // handle possible internal links to PDF-documents
    handlePdfs(main, url, baseUrl, results);

    // handle content of the document itself
    removeGenericContent(main);

    // handle tables first in order to avoid re-adding table-markup to migrated blocks
    handleTable(main, document);

    // handle image-slider before modidying image-urls in general
    handleGallerySlider(main, document, baseUrl);

    handleTopImage(main, document);
    handleLinks(main, document, baseUrl);
    handle3ColumnsGrid(main, document);
    handleSidebar(main, document);
    handleImages(main);
    handleIcons(main);
    handleIframes(main, document);
    handleAccordions(main, document);

    handleTextBoxes(main, document);
    handleContacts(main, document);

    // handle both custom and default metadata
    handleMetadata(main, document, news, html);

    // get target document-path like it is done during the 1:1 import
    const path = generateDocumentPath(url);

    results.push({
      element: main,
      path,
    });

    return results;
  },
};
