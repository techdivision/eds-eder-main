/* global WebImporter */

/**
 * Determines the EDS base-url based on static mapping
 * @param params
 * @returns {*}
 */
export const determineEdsBaseUrl = (params) => {
  const urlMapping = {
    'https://www.eder-gmbh.de': 'https://main--eds-eder-gmbh--techdivision.hlx.page',
    'https://www.eder-landtechnik.de': 'https://main--eds-eder-landtechnik--techdivision.hlx.page',
  };

  const originalUrl = new URL(params.originalURL);

  const urlToCheck = `${originalUrl.protocol}//${originalUrl.host}`;

  if (urlMapping[urlToCheck]) {
    return urlMapping[urlToCheck];
  }

  throw new Error(`There is no mapping for the base-url ${urlToCheck}`);
};

/**
 * Returns whether the given link from Typo3 should be a link in EDS
 * @param link
 * @returns {boolean}
 */
export const isButton = (link) => {
  // check for buttons that are defined at link level
  if (link.className.includes('btn-gray-ghost')) {
    return true;
  }

  const parent = link.parentElement;

  // no need to continue if there is no parent
  if (!parent) {
    return false;
  }

  if (parent.className.includes('coa-button') || parent.className.includes('offer-btn-wrapper')) {
    return true;
  }

  // return false in all other cases
  return false;
};

/**
 * Handle HTML-Table by adding the respective headline in order to mark them as an EDS table block
 * @param main
 * @param document
 */
export const handleTable = (main, document) => {
  const table = main.querySelector('table');

  if (table) {
    // determine proper EDS table-type
    let tableHeadline = 'Table (no header, no border)';

    // tables with class table in Typo3 are the ones with borders
    if (table.className.includes('table')) {
      tableHeadline = 'Table (no header)';
    }

    // add one row to table, before the tables original content
    const headlineRow = document.createElement('tr');

    const headlineData = document.createElement('td');
    headlineData.setAttribute('colspan', 2);
    headlineData.append(tableHeadline);

    headlineRow.append(headlineData);

    table.prepend(headlineRow);
  }
};

/**
 * Handle sidebar by converting its HTML-Markup to the EDS section-structure
 * @param main
 * @param document
 */
export const handleSidebar = (main, document) => {
  const sidebar = main.querySelector('div.news-sidebar');

  if (sidebar) {
    // add separator before the sidebar-content
    sidebar.prepend(document.createElement('hr'));

    // add metadata-table after sidebar-content
    const cells = [
      ['Section Metadata'],
      ['Style', 'sidebar'],
    ];

    const table = WebImporter.DOMUtils.createTable(cells, document);

    sidebar.append(table);

    sidebar.append(document.createElement('hr'));
  }
};

/**
 * Handle icons by replacing their HTML-markup by the EDS-notation :iconname:
 */
export const handleIcons = (main) => {
  const iconMapping = {
    'flaticon flaticon-phone': ':telephone:',
    'flaticon flaticon-fax': ':fax:',
    'flaticon flaticon-email': ':email:',
  };

  const originalIcons = main.querySelectorAll('span.flaticon');

  originalIcons.forEach((originalIcon) => {
    const originalClassName = originalIcon.className;

    if (iconMapping[originalClassName]) {
      originalIcon.replaceWith(iconMapping[originalClassName]);
    }
  });
};

/**
 * Handle images by using their data-regular-attribute (if there is any)
 * @param main
 */
export const handleImages = (main) => {
  const images = main.querySelectorAll('img');

  images.forEach((image) => {
    const srcRegular = image.getAttribute('data-regular');

    if (srcRegular) {
      image.src = srcRegular;
    }
  });
};

/**
 * Handle links by making them absolute instead of relative, also converts buttons to EDS-markup
 * @param main
 * @param document
 * @param baseUrl
 */
export const handleLinks = (main, document, baseUrl) => {
  const links = main.querySelectorAll('a');

  if (links) {
    links.forEach((link) => {
      // make link absolute
      let href = link.getAttribute('href');

      // replace relative urls
      if (href.charAt(0) === '/') {
        link.setAttribute('href', baseUrl + href);
      }

      // replace http- by https-urls
      if (href.startsWith('http://')) {
        href = `https://${href.slice('7')}`;

        link.setAttribute('href', href);
      }

      // remove link from collapse links as they cause an error in Sharepoint
      if (href.startsWith('#collapse')) {
        link.outerHTML = link.innerText;
      }

      if (isButton(link)) {
        const linkText = link.innerText;

        // create a bold element to assign the original text to
        const boldElement = document.createElement('strong');

        boldElement.append(linkText);

        link.innerHTML = boldElement.outerHTML;
      }
    });
  }
};

/**
 * Handle 3-column grids by converting them to EDS thord-width Card Blocks
 * @param main
 * @param document
 */
export const handle3ColumnsGrid = (main, document) => {
  // get the column-element from Typo3 that matches the third-width card EDS-Block
  const thirdWidthCards = main.querySelectorAll('div.col-md-4');

  if (thirdWidthCards.length > 0) {
    const cells = [
      ['Cards (third-width)'],
    ];

    let parent;

    thirdWidthCards.forEach((thirdWidthCard) => {
      parent = thirdWidthCard.parentElement;

      const imageDiv = document.createElement('div');

      // copy image to its own entry
      const image = thirdWidthCard.querySelector('img').cloneNode(true);

      const heroText = thirdWidthCard.querySelector('div.category-heroimage');

      imageDiv.append(image);

      if (heroText) {
        imageDiv.append(heroText);
      }

      // remove the image from the other content
      thirdWidthCard.querySelector('img').remove();

      cells.push(
        [imageDiv, thirdWidthCard],
      );
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    parent.replaceWith(resultTable);
  }
};

/**
 * Handle top-image by converting Typo3 hero-image into a regular image within the docx,
 * and putting the headline thereafter
 * @param main
 * @param document
 */
export const handleTopImage = (main, document) => {
  const contentHeader = main.querySelector('div.content-header');

  if (contentHeader) {
    let dataBg = contentHeader.getAttribute('data-bg');

    // handle data-bg="url(/...)"
    if (dataBg.startsWith('url(')) {
      dataBg = dataBg.slice(4, -1);
    }

    // create an img-tag for the former background
    const imageElement = document.createElement('img');
    imageElement.src = dataBg;

    const h1 = contentHeader.querySelector('h1');

    // build-up new structure
    const result = document.createElement('div');

    // add image first
    result.append(imageElement);

    // add headline thereafter
    result.append(h1);

    contentHeader.replaceWith(result);
  }
};

/**
 * Handle iframes by converting them according to their url,
 * either into an EDS Video-Block (YouTube) or an EDS Embed-Block (Yumpu)
 * @param main
 * @param document
 */
export const handleIframes = (main, document) => {
  const iframes = main.querySelectorAll('iframe');

  if (iframes) {
    iframes.forEach((iframe) => {
      let src = iframe.getAttribute('src');

      // if there is no src check for data-src
      if (!src) {
        src = iframe.getAttribute('data-src');
      }

      // return if there was still no src found
      if (!src) {
        return;
      }

      let cells;

      // check for Youtube-urls
      if (src.startsWith('https://www.youtube.com/')) {
        const videoId = src.substring(30, 41);

        const url = `https://www.youtube.com/watch?v=${videoId}`;

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.innerText = url;

        cells = [
          ['Video'],
          [link],
        ];
        // check for yumpu-url
      } else if (src.startsWith('https://www.yumpu.com/')) {
        const link = document.createElement('a');
        link.innerText = src;
        link.setAttribute('href', src);

        cells = [
          ['Embed'],
          [link],
        ];
      }

      if (cells) {
        const resultTable = WebImporter.DOMUtils.createTable(cells, document);

        iframe.replaceWith(resultTable);
      }
    });
  }
};

export const handleAccordions = (main, document) => {
  const accordions = main.querySelectorAll('div.panel-group');

  if (accordions) {
    accordions.forEach((accordion) => {
      const cells = [
        ['Accordion'],
      ];

      const sections = accordion.querySelectorAll('div.panel');

      sections.forEach((section) => {
        const headline = section.querySelector('.panel-title');
        const content = section.querySelector('div.panel-body');

        // use innerHTML here to exclude the original headline-markup
        cells.push(
          [headline.innerHTML, content],
        );
      });

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      accordion.replaceWith(resultTable);
    });
  }
};

export const handleGallerySlider = (main, document, baseUrl) => {
  const gallerySlider = main.querySelector('div.flexslider');

  if (gallerySlider) {
    const cells = [
      ['Slider'],
    ];
    const slides = gallerySlider.querySelectorAll('li.item');

    slides.forEach((slide) => {
      let imageSrc = slide.querySelector('a').getAttribute('href');

      // make image-url relative in order to allow proper usage in EDS
      imageSrc = imageSrc.replace(baseUrl, '');

      const image = document.createElement('img');

      image.setAttribute('src', imageSrc);

      // use innerHTML here to exclude the original headline-markup
      cells.push(
        [image],
      );
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    gallerySlider.replaceWith(resultTable);
  }
};
