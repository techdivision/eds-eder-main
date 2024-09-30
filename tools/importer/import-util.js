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

/**
 * Determines the EDS base-url based on static mapping
 * @param params
 * @returns {*}
 */
export const determineEdsBaseUrl = (params) => {
  const urlMapping = {
    'https://www.eder-gmbh.de': 'https://main--eds-eder-gmbh--techdivision.aem.page',
    'https://www.eder-landtechnik.de': 'https://main--eds-eder-landtechnik--techdivision.aem.page',
    'https://www.agratec-salching.de': 'https://main--eds-agratec-salching--techdivision.aem.page',
    'https://www.eder-baumaschinen.de': 'https://main--eds-eder-baumaschinen--techdivision.aem.page',
    'https://www.feedstar.com': 'https://main--eds-feedstar--techdivision.aem.page',
    'https://www.eder-profi.de': 'https://main--eds-eder-profi--techdivision.aem.page',
    'https://www.eder-anhaenger.de': 'https://main--eds-eder-anhaenger--techdivision.aem.page',
    'https://www.eder-stapler.de': 'https://main--eds-eder-stapler--techdivision.aem.page',
    'https://lelycenterinbayern.de': 'https://main--eds-lelycenterinbayern--techdivision.aem.page',
    'https://www.eder-kommunal.de': 'https://main--eds-eder-kommunal--techdivision.aem.page',
    'https://www.eder-stalltechnik.de': 'https://main--eds-eder-stalltechnik--techdivision.aem.page',
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
  if (link.className.includes('btn-gray-ghost') || link.className.includes('btn-gray') || link.className.includes('btn-ghost')
   || link.className.includes('btn-red')) {
    return true;
  }

  const parent = link.parentElement;

  // no need to continue if there is no parent
  if (!parent) {
    return false;
  }

  if (parent.className.includes('coa-button') || parent.className.includes('offer-btn-wrapper') || parent.className.includes('contact-button')) {
    return true;
  }

  // return false in all other cases
  return false;
};

/**
 * Returns whether the current import takes place for eder-gmbh.de
 * @param params
 * @returns {boolean}
 */
export const isEderGmbh = (params) => {
  const originalUrl = new URL(params.originalURL);

  const originalDomain = originalUrl.host;

  return originalDomain === 'www.eder-gmbh.de';
};

/**
 * Returns whether the current import takes place for eder-stapler.de
 * @param params
 * @returns {boolean}
 */
export const isEderStapler = (params) => {
  const originalUrl = new URL(params.originalURL);

  const originalDomain = originalUrl.host;

  return originalDomain === 'www.eder-stapler.de';
};

/**
 * Determines whether the given news or events entry should be imported for the given domain
 * @param entry
 * @param originalUrl
 * @returns {boolean}
 */
export const shouldBeImported = (entry, originalUrl) => {
  // mapping between the Typo3-urls and the section-names
  const urlMapping = {
    'https://www.eder-gmbh.de': ['Überall', 'Profitechnik'],
    'https://www.eder-landtechnik.de': 'Landtechnik',
    'https://www.agratec-salching.de': 'Agratec',
    'https://www.eder-baumaschinen.de': 'Baumaschinen',
    'https://www.feedstar.com': 'Feedstar',
    'https://www.eder-profi.de': 'Profibaumarkt',
    'https://www.eder-anhaenger.de': 'Anhängercenter',
    'https://www.eder-stapler.de': 'Stapler',
  };

  const urlToCheck = `${originalUrl.protocol}//${originalUrl.host}`;

  const targetSection = urlMapping[urlToCheck];

  // handling multiple assignment - set "Überall"
  const sectionList = entry.section.split(',');

  if (sectionList.length > 1) {
    entry.section = 'Überall';
  }

  // do not import if the section of the news does not match the section of the import
  if (entry.section !== targetSection && !targetSection.includes(entry.section)) {
    // eslint-disable-next-line no-console
    console.log(`This entry will not be imported, as its section '${entry.section}' does not match the section '${targetSection}' of the current import`);
    return false;
  }

  return true;
};

/**
 * This method allows to set the alignment of data-cells of a table
 * @param table
 * @param formats either an array that defines the formatting for each line individually,
 * or a string that defines the formatting for all lines
 */
export const formatTableData = (table, formats) => {
  const tableDataCells = table.querySelectorAll('td');

  let count = 0;

  tableDataCells.forEach((tableCell) => {
    let format;

    // check if formatting is given as array
    if (Array.isArray(formats)) {
      // assign the entry that matches the position
      format = formats[count];
    } else {
      // assign the same formatting to each entry
      format = formats;
    }

    tableCell.setAttribute('align', format);

    count += 1;
  });
};

/**
 * Sanitize pathname by removing leading and trailing dashes from each section of the url
 * @param pathname
 * @returns {string}
 */
export const sanitizePathname = (pathname) => {
  const modifiedPathnameSections = [];

  // handle leading or trailing dashes in url-sections, that are not allowed (anymore) in EDS
  const pathnameSections = pathname.split('/');

  pathnameSections.forEach((pathnameSection) => {
    modifiedPathnameSections.push(pathnameSection.replace(/^-+|-+$/g, ''));
  });

  return modifiedPathnameSections.join('/');
};

/**
 * Preprocess method that extracts the hreflang=x-default value from the original HTML markup
 * @param document
 * @param params
 */
export const preprocessHrefLang = (document, params) => {
  const xDefault = document.querySelector('link[hreflang="x-default"]');

  if (xDefault && xDefault.hasAttribute('href')) {
    const xDefaultValue = xDefault.getAttribute('href');

    const xDefaultSections = xDefaultValue.split('/');

    const lastEntry = xDefaultSections[xDefaultSections.length - 1];
    const secondLastEntry = xDefaultSections[xDefaultSections.length - 2];

    // last entry might be empty, due to a trailing slash
    if (lastEntry !== '') {
      params.hreflangKey = lastEntry;
    } else {
      params.hreflangKey = secondLastEntry;
    }
  }
};

/**
 * Handle HTML-Table by adding the respective headline in order to mark them as an EDS table block
 * @param main
 * @param document
 */
export const handleTable = (main, document) => {
  const tables = main.querySelectorAll('table');

  tables.forEach((table) => {
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
  });
};

/**
 * Handle sidebar by converting its HTML-Markup to the EDS section-structure
 * @param main
 * @param document
 */
export const handleSidebar = (main, document) => {
  const originalSidebar = main.querySelector('div.news-sidebar');

  if (originalSidebar) {
    // create a copy of the original sidebar-block to work with later on
    const sidebar = originalSidebar.cloneNode(true);

    // add separator before the sidebar-content
    sidebar.prepend(document.createElement('hr'));

    // add metadata-table after sidebar-content
    const cells = [
      ['Section Metadata'],
      ['Style', 'sidebar'],
    ];

    const table = WebImporter.DOMUtils.createTable(cells, document);

    sidebar.append(table);

    // remove the original sidebar and add the new one at the very last position
    originalSidebar.remove();
    main.append(sidebar);
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

  let parent;

  images.forEach((image) => {
    // use data-regular (= the original image) instead of src (= converted webp)
    const srcRegular = image.getAttribute('data-regular');

    if (srcRegular) {
      image.src = srcRegular;
    }

    // remove link around the image, as it would link to the Typo3 url-structure
    parent = image.parentElement;

    if (parent.tagName === 'A' && parent.href.startsWith('/')) {
      // eliminate the link's Markup
      parent.outerHTML = image.outerHTML;
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

      // if the link does not have a target: replace it with the text of the link
      if (!href) {
        link.outerHTML = link.innerText;
        return;
      }

      // replace relative urls
      if (href.charAt(0) === '/') {
        href = sanitizePathname(href);

        href = baseUrl + href;

        // remove possible parameters from internal links
        href = href.replace(/\?.*/, '');

        // remove trailing slash from internal links
        href = href.replace(/\/$/, '');

        // check for links to index.php that does not exist anymore in EDS
        if (href.endsWith('index.php')) {
          // remove the link, keep the content
          link.outerHTML = link.innerHTML;
        }
      }

      // replace http- by https-urls
      if (href.startsWith('http://')) {
        href = `https://${href.slice('7')}`;
      }

      // remove trailing slash from internal links
      if (href.includes(baseUrl)) {
        href = href.replace(/\/$/, '');
      }

      link.setAttribute('href', href);

      // remove link from collapse links as they cause an error in Sharepoint
      if (href.startsWith('#collapse')) {
        link.outerHTML = link.innerText;
      }

      // remove links that triggered JS hide/show-logic
      if (href === '#/') {
        link.outerHTML = link.innerText;
      }

      // check for link to images - remove them as EDS does not support them
      if (href.endsWith('.jpg') || href.endsWith('.png')) {
        link.outerHTML = link.innerHTML;
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
 * Handle 2-column grids by converting them to EDS half-width Cards
 * @param main
 * @param document
 */
export const handle2ColumnsGrid = (main, document) => {
  // get parent-element
  const parent = main.querySelector('div.products-new-mainpage');

  if (parent) {
    const result = document.createElement('div');

    // add headline to result, if there is any
    const firstChild = parent.firstElementChild;

    // avoid adding headline from product-entries
    const firstElementIsProductContainer = firstChild.innerHTML.includes('product-container');

    const headline = firstChild.querySelector('h2');

    if (!firstElementIsProductContainer) {
      result.append(headline);
    }

    // handle the product-entries itself
    const originalLinks = parent.querySelectorAll('div.product-container');

    if (originalLinks.length > 0) {
      const cells = [
        ['Cards (half-width)'],
      ];

      originalLinks.forEach((originalLink) => {
        // handle image
        const image = originalLink.querySelector('img');

        // handle content
        const originalContent = originalLink.querySelector('div.attributes');

        const newContent = document.createElement('div');

        const logo = originalContent.querySelector('img');
        const productHeadline = originalContent.querySelector('h3, h2');
        const productDescription = originalContent.querySelector('p.description');

        newContent.append(productHeadline);
        newContent.append(productDescription);

        /*
        In Typo3 the link is on the parents-parent, instead it should go on "price",
        which is displayed as a link in Typo3
        */
        const productPrice = originalContent.querySelector('span.price');

        const parentParent = originalLink.parentElement.parentElement;

        if (parentParent.tagName === 'A') {
          const newLink = document.createElement('a');
          newLink.href = parentParent.href;
          newLink.append(productPrice);

          newContent.append(newLink);
        } else if (productPrice) {
          // case: price it not link - append original content in bold
          const boldElement = document.createElement('strong');
          boldElement.append(productPrice);

          newContent.append(boldElement);
        }

        if (logo) {
          cells.push(
            [image, logo, newContent],
          );
        } else {
          cells.push(
            [image, newContent],
          );
        }
      });

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      result.append(resultTable);
    }
    parent.replaceWith(result);
  }
};

/**
 * Handle 3-column grids by converting them to EDS third-width Card Blocks
 * @param main
 * @param document
 */
export const handle3ColumnsGrid = (main, document) => {
  // get the column-element from Typo3 that matches the third-width card EDS-Block
  const thirdWidthCards = main.querySelectorAll('div.col-md-4');

  if (thirdWidthCards.length > 0) {
    // flag, whether filters are present
    let hasFilter = false;

    // check if there are any filters present
    const select = main.querySelector('select.category-filter-select');

    const optionsMapping = [];

    // extract label next to filter-dropdown and remove it
    const filterLabel = main.querySelector('div.category-filter-text');

    if (filterLabel) {
      filterLabel.remove();
    }

    if (select) {
      const { options } = select;

      if (options.length > 1) {
        // set flag
        hasFilter = true;

        // build mapping between id used by Cards and their label
        for (let i = 0; i < options.length; i += 1) {
          const option = options[i];

          optionsMapping[option.value] = option.text;
        }

        // add Filter Block
        const filterCells = [
          ['Filter'],
          ['Kategorie', 'dropdown', 'category', ''],
        ];

        const filterTable = WebImporter.DOMUtils.createTable(filterCells, document);

        select.replaceWith(filterTable);
      } else if (options.length === 1) {
        // eslint-disable-next-line max-len
        // special case: there is only one option, but that does not have an id assigned -> remove Filter
        select.remove();
      }
    }

    const cells = [];

    if (hasFilter) {
      // use different Block-name if cards are filterable
      cells.push(['Cards (third-width, filterable)']);
      // push headline for category-filter
      cells.push(['', '', 'category']);
    } else {
      cells.push(['Cards (third-width)']);
    }

    let parent;

    thirdWidthCards.forEach((thirdWidthCard) => {
      parent = thirdWidthCard.parentElement;

      const imageDiv = document.createElement('div');

      // copy image to its own entry
      const image = thirdWidthCard.querySelector('img');

      // special handling for some headlines: replace h3-class elements by proper h3
      const h3ClassElement = thirdWidthCard.querySelector('p.h3');

      if (h3ClassElement) {
        const h3 = document.createElement('h3');
        h3.innerText = h3ClassElement.innerText;
        h3ClassElement.replaceWith(h3);
      }

      // check if there is any image present
      if (image) {
        // create a clone of the image-node to work with later-on
        const imageClone = image.cloneNode(true);

        // check whether image is within a link
        const imageParent = image.parentElement;

        if (imageParent.tagName === 'A') {
          // remove the parent, that includes the link
          imageParent.remove();
        } else {
          // remove only the image itself
          image.remove();
        }

        const heroText = thirdWidthCard.querySelector('div.category-heroimage');

        imageDiv.append(imageClone);

        if (heroText) {
          imageDiv.append(heroText);
        }

        // check if there are filters for the Cards-element
        if (hasFilter) {
          const rawCategories = thirdWidthCard.getAttribute('data-categories');

          const categoriesArray = rawCategories.split(',');

          const productCategories = [];

          categoriesArray.forEach((category) => {
            if (optionsMapping[category]) {
              productCategories.push(optionsMapping[category]);
            }
          });

          cells.push(
            [imageDiv, thirdWidthCard, productCategories.join(',')],
          );
        } else {
          cells.push(
            [imageDiv, thirdWidthCard],
          );
        }
      } else {
        // Card with no image
        cells.push(
          [thirdWidthCard],
        );
      }
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    parent.replaceWith(resultTable);
  }
};

/**
 * Handle 4-column grids by converting them to EDS quarter-width Card Blocks
 * @param main
 * @param document
 */
export const handle4ColumnsGrid = (main, document) => {
  const parent = main.querySelector('div.company-sections');

  if (parent) {
    const cells = [
      ['Cards (quarter-width)'],
    ];

    const cards = parent.querySelectorAll('div.small-card');

    cards.forEach((card) => {
      const header = card.querySelector('div.card-header');
      const image = header.querySelector('img');

      const body = card.querySelector('div.card-body-wrapper');

      cells.push(
        [image, body],
      );
    });

    if (cells.length > 1) {
      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      parent.replaceWith(resultTable);
    }
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
      } else if (src.startsWith('https://www.yumpu.com/') || src.startsWith('https://forms.office.com')
        || src.startsWith('https://v2.webmag.io/') || src.startsWith('https://dealersites.technikboerse.com/')) {
        const blockClasses = [];

        // handle height of iframe
        let height = iframe.getAttribute('height');

        if (height && height.includes('px')) {
          height = height.replace('px', '');

          blockClasses.push(`height-${height}`);
        }

        // handle width of iframe
        let width = iframe.getAttribute('width');

        if (width && width.includes('px')) {
          width = width.replace('px', '');
          blockClasses.push(`width-${width}`);
        }

        // build-up block name, including possible headlines
        let blockname = 'Embed';

        if (blockClasses.length > 0) {
          blockname = `${blockname}(${blockClasses.join(', ')})`;
        }

        // build-up link
        const link = document.createElement('a');
        link.innerText = src;
        link.setAttribute('href', src);

        cells = [
          [blockname],
          [link],
        ];
        // handle alfright.eu-urls
      } else if (src.startsWith('https://app.alfright.eu/')) {
        // set static key for hlx.page - must be configured for production-urls manually later on
        cells = [
          ['data-privacy-notice'],
          ['bebc9af8aa47408e85446c482ae3b64a'],
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

export const handleGallerySliders = (main, document, baseUrl) => {
  const gallerySliders = main.querySelectorAll('div.flexslider, div.element-t3sbs_gallery');

  gallerySliders.forEach((gallerySlider) => {
    const cells = [
      ['Slider (Autostart, Desktop-1-Mobile-1)'],
    ];
    const slides = gallerySlider.querySelectorAll('li.item, div.col-md-3');

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
  });
};

export const handleTextBoxes = (main, document) => {
  const redTextBoxes = main.querySelectorAll('div.alert-danger, div.custom-style-865, div.custom-style-46916, div.custom-style-8085, div.custom-style-37473, div.custom-style-37503, div.custom-style-21924, div.custom-style-42828, div.custom-style-39502, div.custom-style-21926, div.custom-style-21927, div.custom-style-21928, div.custom-style-21929, div.custom-style-49293, div.custom-style-55586, div.custom-style-53610, div.custom-style-8175, div.custom-style-39702');

  if (redTextBoxes) {
    redTextBoxes.forEach((redTextBox) => {
      // remove classes text-center from content to avoid collision with centered Columns later-on
      const centeredElements = redTextBox.querySelectorAll('.text-center');

      centeredElements.forEach((centeredElement) => {
        centeredElement.className = '';
      });

      const cells = [
        ['Text-Box (red)'],
        [redTextBox.innerHTML],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      formatTableData(resultTable, ['center']);

      redTextBox.replaceWith(resultTable);
    });
  }

  const blueTextBoxes = main.querySelectorAll('div.alert-warning, div.custom-style-1486');

  if (blueTextBoxes) {
    blueTextBoxes.forEach((blueTextBox) => {
      const cells = [
        ['Text-Box (blue)'],
        [blueTextBox.innerHTML],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      formatTableData(resultTable, ['center']);

      blueTextBox.replaceWith(resultTable);
    });
  }
};

export const handleFilterAndRows = (main, document, params) => {
  // get filter-block and product-rows, ids are used as there is no other possibility
  const filter = main.querySelector('div.element-dce_dceuid14');

  // use id here, as the elements do not have another way to identify them
  const rows = main.querySelectorAll('div.element-dce_dceuid12');

  let hasFilter = false;

  const result = document.createElement('div');

  let blockName = 'Rows';

  if (filter) {
    // handle filter-block
    const images = filter.querySelectorAll('img.filter-img');

    const imagesParagraph = document.createElement('p');

    images.forEach((image) => {
      imagesParagraph.append(image);
    });

    const filterCells = [
      ['Filter'],
      ['PS', 'slider', 'power_min,power_max', '%minSliderValue - %maxSliderValue PS (%minSliderValueKW - %maxSliderValueKW KW)'],
      ['Marke', 'checkbox', 'brand', imagesParagraph],
    ];

    const filterResultTable = WebImporter.DOMUtils.createTable(filterCells, document);

    result.append(filterResultTable);

    // change block-name to be filterable
    blockName = 'Rows (filterable)';

    hasFilter = true;

    // remove original filter content
    filter.remove();
  }

  // handle rows with product data
  if (rows.length > 0) {
    const rowCells = [
      [blockName],
    ];

    let rowsCount = 0;

    rows.forEach((row) => {
      // get the original-data from Typo3
      const originalImageDiv = row.querySelector('div.image');
      const originalContentDiv = row.querySelector('div.content');
      const originalRecommendDiv = row.querySelector('div.recommend');

      // perform modifications to original image-data
      const originalImages = originalImageDiv.querySelectorAll('img');

      // by default the second image should be used, if there is one (= the bigger mobile-image)
      let originalImage = originalImages[originalImages.length - 1];

      // custom handling for eder-stapler
      if (isEderStapler(params)) {
        // use the first image (= the Desktop-one) as the mobile-images are cut down
        [originalImage] = originalImages;
      }

      // create a new image tag in order to use the original jpg-value
      const resultImage = document.createElement('img');

      resultImage.src = originalImage.getAttribute('data-regular');

      // perform modifications to original content data
      const content = originalContentDiv;

      // create own paragraph, add bold element around to text of contact-button
      const contactButton = originalContentDiv.querySelector('a.contact-btn');

      if (contactButton) {
        const boldElement = document.createElement('strong');
        boldElement.append(contactButton.innerHTML);

        const contactButtonParagraph = document.createElement('p');
        contactButtonParagraph.append(boldElement);

        contactButton.innerHTML = contactButtonParagraph.outerHTML;
      }

      // check for different types of rows
      if (originalImageDiv && originalContentDiv && !originalRecommendDiv) {
        // image and content are present, but no recommendations -> Rows with only two columns

        // store modified data
        rowCells.push(
          [resultImage, content],
        );
      } else {
        // recommendations are present -> use Rows with full number of columns
        // only as first line of data: add headlines for filters
        if (hasFilter && rowCells.length === 1) {
          rowCells.push(['', '', '', '', 'power_min', 'power_max', 'brand']);
        }

        // extract logo
        const originalLogo = originalContentDiv.querySelector('img');

        // extract data-value from logo
        const brand = originalLogo.getAttribute('data-value');

        // build-up new logo in order to use 'data-regular' of the image
        const resultLogo = document.createElement('img');

        resultLogo.src = originalLogo.getAttribute('data-regular');
        resultLogo.alt = brand;

        // remove original logo from the content
        originalLogo.remove();

        // extract power-data
        let powerMin = originalContentDiv.querySelector('span[data-value=power-min]');

        if (powerMin) {
          powerMin = parseInt(powerMin.innerText, 10);
        } else {
          powerMin = '';
        }

        let powerMax = originalContentDiv.querySelector('span[data-value=power-max]');

        if (powerMax) {
          powerMax = parseInt(powerMax.innerText, 10);
        } else {
          powerMax = '';
        }

        // create own paragraph, add italic element around text of info-button
        const infoButton = originalContentDiv.querySelector('a.info-btn');

        if (infoButton) {
          const italicElement = document.createElement('em');
          italicElement.append(infoButton.innerHTML);

          const infoButtonParagraph = document.createElement('p');
          infoButtonParagraph.append(italicElement);

          infoButton.innerHTML = infoButtonParagraph.outerHTML;
        }

        // store modified data
        if (hasFilter) {
          rowCells.push(
            [resultImage, resultLogo, content, originalRecommendDiv, powerMin, powerMax, brand],
          );
        } else {
          rowCells.push(
            [resultImage, resultLogo, content, originalRecommendDiv],
          );
        }
        // remove each of the single items, but not the last one
        if (rowsCount < rows.length - 1) {
          row.remove();
        }

        rowsCount += 1;
      }
    });
    const rowResultTable = WebImporter.DOMUtils.createTable(rowCells, document);

    result.append(rowResultTable);

    // get the last row and replace it by result-table
    const lastRow = rows[rows.length - 1];
    lastRow.replaceWith(result);
  }
};

/**
 * Handle inline-images in text by creating the appropriate section-structure
 * @param main
 */
export const handleImagesInText = (main) => {
  // handle images right, text left
  const imageDivs = main.querySelectorAll('div.pull-right, div.pull-left');

  imageDivs.forEach((imageDiv) => {
    const parent = imageDiv.parentElement;

    const textDiv = parent.querySelector('div.intext-text');

    if (imageDiv && textDiv) {
      // convert classname
      const originalClassname = imageDiv.className;

      // EDS-classname - default value
      let edsClassname = 'images-inline-right';

      if (originalClassname && originalClassname.includes('pull-left')) {
        edsClassname = 'images-inline-left';
      }

      const sectionMarkupCells = [
        ['Section Metadata'],
        ['style', edsClassname],
      ];

      // build-up new image div, with only the images
      const resultImageDiv = document.createElement('div');

      const images = imageDiv.querySelectorAll('img');

      images.forEach((image) => {
        resultImageDiv.append(image);
      });

      const sectionMarkupTable = WebImporter.DOMUtils.createTable(sectionMarkupCells, document);

      // build-up new structure
      const result = document.createElement('div');
      result.append(document.createElement('hr'));
      result.append(resultImageDiv);
      result.append(textDiv);
      result.append(sectionMarkupTable);
      result.append(document.createElement('hr'));

      parent.replaceWith(result);
    }
  });
};

/**
 * Handle "textpic"-elements from Typo3, migrate them to EDS Columns-Block
 * @param main
 * @param document
 */
export const handleTextPic = (main, document) => {
  const textPicElements = main.querySelectorAll('div.element-textpic');

  textPicElements.forEach((textPicElement) => {
    const columns = textPicElement.querySelectorAll('div.col-sm-6');

    // avoid cases where there is only one column
    if (columns.length > 1) {
      const resultColumns = [];

      columns.forEach((column) => {
        resultColumns.push(column);
      });

      const resultCells = [
        ['Columns'],
        resultColumns,
      ];

      const resultTable = WebImporter.DOMUtils.createTable(resultCells, document);

      textPicElement.append(resultTable);
    }
  });
};

/**
 * Handle <br>-Tag, required because the EDS-import can not handle them properly out-of-the-box
 * @param main
 * @param document
 */
export const handleBrs = (main, document) => {
  const brs = main.querySelectorAll('br');

  brs.forEach((br) => {
    const pagraph = document.createElement('p');

    // set a non-breaking space as the only content of the paragraph
    pagraph.append('\xa0');

    br.outerHTML = pagraph.outerHTML;
  });
};

/**
 * Handle Contact-data by replacing it by the EDS Contacts-Block
 * @param main
 * @param document
 */
export const handleContacts = (main, document) => {
  // remove "Kontakt"-headline from Sidebar
  const sidebar = main.querySelector('div.news-sidebar');

  // only consider Contacts within the sidebar
  if (sidebar) {
    // unfortunately there are several different Markups, and no unique identification
    const possibleContactHeadlines = sidebar.querySelectorAll('span, strong, h1, h2');

    // flag, whether a Contact-headline was present above the Block
    let containedContactHeadline = false;

    possibleContactHeadlines.forEach((contactHeadline) => {
      const contactHeadlineText = (contactHeadline.innerText).toLowerCase();

      if (contactHeadlineText.includes('kontakt')) {
        contactHeadline.remove();
        containedContactHeadline = true;
      }
    });

    // use regular Contact-Block variant by default
    let blockName = 'Contacts';

    // use variant without a headline if there was non originally
    if (!containedContactHeadline) {
      blockName = 'Contacts (no-headline)';
    }

    // use id here, as there is no other way of identification
    const contactBlocks = sidebar.querySelectorAll('div.element-dce_dceuid2');

    let previousParent;

    if (contactBlocks.length > 0) {
      let contactCells = [
        [blockName],
      ];

      contactBlocks.forEach((contactBlock) => {
        const name = contactBlock.querySelector('p.staff-headline').innerText;

        const currentParent = contactBlock.parentElement;

        // if is not the first entry, and the parent is different
        // -> replace Block and start a new list
        if (previousParent && (currentParent !== previousParent)) {
          const contactsResultTable = WebImporter.DOMUtils.createTable(contactCells, document);

          previousParent.replaceWith(contactsResultTable);

          contactCells = [
            [blockName],
          ];
        }

        // add entry in any case
        contactCells.push([name]);

        // set previous parent for next iteration
        previousParent = currentParent;
      });

      // replace last entry
      const contactsResultTable = WebImporter.DOMUtils.createTable(contactCells, document);

      previousParent.replaceWith(contactsResultTable);
    }
  }
};

/**
 * Handle internal PDF download-links on the page by downloading the target
 * and replacing the download-link
 * Taken from https://github.com/adobe/helix-importer-ui/blob/main/docs/download-pdf.md
 * @param main
 * @param url
 * @param baseUrl
 * @param results
 */
export const handlePdfs = (main, url, baseUrl, results) => {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && href.endsWith('.pdf')) {
      const u = new URL(href, url);
      const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
      results.push({
        path: newPath,
        from: u.toString(),
      });

      // update the link to new path on the target host
      // this is required to be able to follow the links in Word
      a.setAttribute('href', newPath);
    }
  });
};

/**
 * Handle videos that were upload to the Typo3 server by downloading them
 * and replacing the <video>-node by an EDS Video-block
 * File-handling is taken from https://github.com/adobe/helix-importer-ui/blob/main/docs/download-pdf.md
 * @param main
 * @param url
 * @param baseUrl
 * @param results
 */
export const handleMp4s = (main, url, baseUrl, results) => {
  main.querySelectorAll('video').forEach((video) => {
    const source = video.querySelector('source');

    const dataSrc = source.getAttribute('data-src');

    if (dataSrc && dataSrc.startsWith('/') && dataSrc.endsWith('.mp4')) {
      const u = new URL(dataSrc, url);
      const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
      results.push({
        path: newPath,
        from: u.toString(),
      });

      const newUrl = `${baseUrl}${newPath}`;

      const link = document.createElement('a');
      link.setAttribute('href', newUrl);
      link.innerText = newUrl;

      const cells = [
        ['Video (autoplay)'],
        [link],
      ];

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      video.replaceWith(resultTable);
    }
  });
};

/**
 * Handle teaser-rows from Typo3 by converting them to an EDS Row-Block
 * @param main
 * @param document
 */
export const handleTeaserRows = (main, document) => {
  // use id here, as the elements do not have another way to identify them
  const rows = main.querySelectorAll('div.element-dce_dceuid50');

  const cells = [
    ['Rows'],
  ];

  let rowsCount = 0;

  if (rows.length > 0) {
    rows.forEach((row) => {
      const originalLink = row.querySelector('a');
      const href = originalLink.getAttribute('href');

      const imgDiv = row.querySelector('div.img-box');
      const img = imgDiv.querySelector('img');

      const textDiv = row.querySelector('div.text-box');

      // extract last paragraph of the text and add link to
      const paragraphs = textDiv.querySelectorAll('p');

      const lastParagraph = paragraphs[paragraphs.length - 1];

      const link = document.createElement('a');
      link.append(lastParagraph.innerText);
      link.href = href;

      lastParagraph.replaceWith(link);

      cells.push([img, textDiv]);

      // remove each of the single items, but not the last one
      if (rowsCount < rows.length - 1) {
        row.remove();
      }

      rowsCount += 1;
    });

    const resultTable = WebImporter.DOMUtils.createTable(cells, document);

    // get the last row and replace it by result-table
    const lastRow = rows[rows.length - 1];
    lastRow.replaceWith(resultTable);
  }
};

/**
 * Handle teaser-rows from Typo3 by converting them to an EDS Rows-Block
 * @param main
 * @param document
 */
export const handleReferenceRows = (main, document) => {
  const referenceList = main.querySelector('div.element-news_pi1');

  if (referenceList) {
    const rows = referenceList.querySelectorAll('div.row');

    if (rows.length > 0) {
      const cells = [
        ['Rows'],
      ];

      rows.forEach((row) => {
        const imageDiv = row.querySelector('div.news-img-wrap');
        const textDiv = row.querySelector('div.content-wrapper');
        const detailsDiv = row.querySelector('div.details-wrapper');

        if (imageDiv && textDiv && detailsDiv) {
          // extract image itself
          const img = imageDiv.querySelector('img');

          // remove any links from the main text-content
          const links = textDiv.querySelectorAll('a');

          links.forEach((link) => {
            link.outerHTML = link.innerHTML;
          });

          // combine text content
          textDiv.append(detailsDiv);

          cells.push([img, textDiv]);
        }
      });

      const resultTable = WebImporter.DOMUtils.createTable(cells, document);

      referenceList.replaceWith(resultTable);
    }
  }
};

/**
 * Handle exponential numbers - ² and ³
 * @param main
 */
export const handleSup = (main) => {
  const sups = main.querySelectorAll('sup');

  sups.forEach((sup) => {
    const value = Number(sup.innerText);

    // use the original value as a fallback
    let result = value;

    if (value === 2) {
      result = '²';
    } else if (value === 3) {
      result = '³';
    }

    sup.replaceWith(result);
  });
};

/**
 * Handle side-by-side elements by replacing them with either a section-markup or a Columns-Block,
 * depending on the content of the columns
 * @param main
 * @param document
 */
export const handleSideBySide = (main, document) => {
  // use id here, as the elements do not have another way to identify them
  const rows = main.querySelectorAll('div.row.use-maxwidth');

  if (rows.length > 0) {
    rows.forEach((row) => {
      const elements = row.querySelectorAll('div.col-sm-6');

      // only continue if there are at least two elements
      if (elements && elements.length > 1) {
        const firstElement = elements[0];
        const secondElement = elements[1];

        const result = document.createElement('div');

        // check if content contains a table = an EDS Block markup
        if (row.innerHTML.includes('<table')) {
          // section-markup with side-by-side Metadata must be generated
          const sectionMetadata = [
            ['Section Metadata'],
            ['Style', 'side-by-side'],
          ];
          const sectionMetadataTable = WebImporter.DOMUtils.createTable(sectionMetadata, document);

          result.append(document.createElement('hr'));

          // check for 'pull-right', where the second element is displayed first
          if (firstElement.className.includes('pull-right')) {
            result.append(secondElement);
            result.append(firstElement);
          } else {
            result.append(firstElement);
            result.append(secondElement);
          }

          result.append(sectionMetadataTable);
          result.append(document.createElement('hr'));

          row.replaceWith(result);
        } else {
          // no tables found: Columns-Block can be used
          const rowCells = [
            ['Columns'],
          ];

          // check for 'pull-right', where the second element is displayed first
          if (firstElement.className.includes('pull-right')) {
            rowCells.push([secondElement, firstElement]);
          } else {
            rowCells.push([firstElement, secondElement]);
          }

          const resultTable = WebImporter.DOMUtils.createTable(rowCells, document);

          row.replaceWith(resultTable);
        }
      }
    });
  }
};
