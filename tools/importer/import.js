import determineEdsBaseUrl from './import-util.js';

const removeGenericContent = (main, document) => {
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
    '.offcanvas'
  ]);
}

export default {
  transformDOM: ({ document, params }) => {
    const main = document.body;

    removeGenericContent(main, document);

    const baseUrl = determineEdsBaseUrl(params);

    handleTable(main, document);
    handleLinks(main, document, baseUrl);
    handleSidebar(main, document);
    handleImages(main);
    handleIcons(main);

    WebImporter.rules.createMetadata(main, document);

    return main;
  },
};

/**
 * Handle HTML-Table by adding the respective headline in order to mark them as an EDS table block
 * @param main
 * @param document
 */
const handleTable = (main, document) => {
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
const handleSidebar = (main, document) => {
  const sidebar = main.querySelector('div.news-sidebar');

  if (sidebar) {
    // add separator before the sidebar-content
    sidebar.prepend(document.createElement('hr'));

    // add metadata-table after sidebar-content
    const cells = [
      ['Section Metadata'],
      ['Style', 'sidebar']
    ];

    const table = WebImporter.DOMUtils.createTable(cells, document);

    sidebar.append(table);
  }
};

/**
 * Handle icons by replacing their HTML-markup by the EDS-notation :iconname:
 */
const handleIcons = (main) => {
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
const handleImages = (main) => {
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
const handleLinks = (main, document, baseUrl) => {
  const links = main.querySelectorAll('a');

  if (links) {
    links.forEach((link) => {
      // make link absolute
      const href = link.getAttribute('href');

      if (href.charAt(0) === '/') {
        link.setAttribute('href', baseUrl + href);
      }

      // check if parent has class 'coa-button', thus is button in Typo3
      const parent = link.parentElement;

      if (parent.className.includes('coa-button')) {
        const linkText = link.innerText;

        // create a bold element to assign the original text to
        const boldElement = document.createElement('strong');

        boldElement.append(linkText);

        link.innerHTML = boldElement.outerHTML;
      }
    });
  }
};
