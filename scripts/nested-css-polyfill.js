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

// noinspection JSCheckFunctionSignatures

// eslint-disable-next-line import/no-cycle
import { betterLoadScript, cachedHtmlFetch } from './load-resource.js';

/**
 * Check if nesting is supported
 *
 * @returns {boolean}
 */
function cssNestingIsSupported() {
  if (typeof (window.cssNesting) !== 'undefined') {
    return window.cssNesting;
  }

  // create dummy CSS
  const style = document.createElement('style');
  style.textContent = `
    :is(:root) { color: green; }
    :is(:root) & { color: red; }
  `;
  document.head.append(style);

  // check if the browser kept the nested rule
  const { sheet } = style;
  let supportsNesting = false;

  // loop through the CSS rules to find the nested one
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const rule of sheet.cssRules) {
    if (rule.selectorText === ':is(:root) &') {
      supportsNesting = true;
      break;
    }
  }

  // clean up
  document.head.removeChild(style);
  window.cssNesting = supportsNesting;
  return supportsNesting;
}

/**
 * Load all stylesheets
 */
function cssNestingPolyfillLoadStylesheet(link) {
  // add SASS library
  betterLoadScript('https://cdnjs.cloudflare.com/ajax/libs/sass.js/0.11.1/sass.sync.min.js')
    .then(() => {
      // preprocess sheet
      link.setAttribute('status', 'loading');
      cachedHtmlFetch(link.href)
        .then((content) => {
          // fix unsupported width media query and set absolute links
          let fixedContent = content;
          fixedContent = fixedContent.replace(/width >=/g, 'min-width:');
          fixedContent = fixedContent.replace(/url\('/gm, `url('${link.href.replace(/\/[^/]*$/, '/')}`);

          // eslint-disable-next-line no-undef
          Sass.compile(fixedContent, { indentedSyntax: false }, (compiledCss) => {
            if (compiledCss.status !== 0) {
              link.onerror();
            } else {
              const styleElement = document.createElement('style');
              styleElement.innerHTML = compiledCss.text;
              document.head.append(styleElement);
              link.setAttribute('status', 'loaded');
              link.onload();
            }
          });
        })
        .catch(() => {
          link.onerror();
        });
    });
}

/**
 * Preprocess CSS for browsers that do not support CSS nesting
 *
 * @param {HTMLLinkElement} link
 */
function cssNestingPolyfillLink(link) {
  link.type = 'text/scss';
  cssNestingPolyfillLoadStylesheet(link);
}

export {
  cssNestingIsSupported,
  cssNestingPolyfillLink,
};
