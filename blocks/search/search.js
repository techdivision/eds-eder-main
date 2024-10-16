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

import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { loadPlaceholders, tContent, ts } from '../../scripts/i18n.js';
import { getUrlParam, setUrlParam } from '../../scripts/helpers.js';
import { cachedFetch } from '../../scripts/load-resource.js';
import { queryParamSearch } from '../../scripts/defaults.js';

/**
 * @see https://github.com/adobe/aem-block-collection/tree/main/blocks/search
 */

function findNextHeading(el) {
  // noinspection JSUnresolvedReference
  let precedingEl = el.parentElement.previousElement || el.parentElement.parentElement;
  let h = 'H2';
  while (precedingEl) {
    const lastHeading = [...precedingEl.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      h = level < 6 ? `H${level + 1}` : 'H6';
      precedingEl = false;
    } else {
      // noinspection JSUnresolvedReference
      precedingEl = precedingEl.previousElement || precedingEl.parentElement;
    }
  }
  return h;
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase()
        .indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({
          offset,
          term: textContent.substring(offset, offset + term.length),
        });
        start = offset + term.length;
        offset = textContent.toLowerCase()
          .indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, {
      offset,
      term,
    }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

function renderResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = result.path;
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    wrapper.append(pic);
    a.append(wrapper);
  }
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    a.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    a.append(description);
  }
  li.append(a);
  return li;
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';
}

function clearSearch(block) {
  clearSearchResults(block);
  setUrlParam(queryParamSearch, null);
}

async function renderResults(block, config, filteredData, searchTerms) {
  clearSearchResults(block);
  const searchResults = block.querySelector('.search-results');
  const headingTag = searchResults.dataset.h;

  if (filteredData.length) {
    searchResults.classList.remove('no-results');
    filteredData.forEach((result) => {
      const li = renderResult(result, searchTerms, headingTag);
      searchResults.append(li);
    });
  } else {
    const noResultsMessage = document.createElement('li');
    searchResults.classList.add('no-results');
    tContent(noResultsMessage, 'No results found.')
      .then();
    searchResults.append(noResultsMessage);
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    searchTerms.forEach((term) => {
      // noinspection JSUnresolvedReference
      const idx = (result.header || result.title).toLowerCase()
        .indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({
        minIdx,
        result,
      });
      return;
    }

    const metaContents = `${result.content} ${result.title} ${result.description} ${result.path.split('/')
      .pop()}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({
        minIdx,
        result,
      });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

async function handleSearch(e, block, config) {
  const searchValue = e.target.value;
  setUrlParam(queryParamSearch, searchValue);

  if (searchValue.length < 3) {
    clearSearch(block);
    return;
  }
  const searchTerms = searchValue.toLowerCase()
    .split(/\s+/)
    .filter((term) => !!term);

  const data = await cachedFetch(config.source);
  const filteredData = filterData(searchTerms, data || []);
  await renderResults(block, config, filteredData, searchTerms);
}

function searchResultsContainer(block) {
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = findNextHeading(block);
  return results;
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = ts('Enter search term');
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('input', async (e) => {
    await handleSearch(e, block, config);
  });

  input.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      clearSearch(block);
    }
  });

  return input;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchIcon(),
    searchInput(block, config),
  );

  const searchResultText = document.createElement('p');
  tContent(searchResultText, 'Search results')
    .then();
  box.append(searchResultText);

  return box;
}

export default async function decorate(block) {
  await loadPlaceholders();
  const source = block.querySelector('a[href]')
    ? block.querySelector('a[href]').href
    : '/query-index-search.json';
  block.innerHTML = '';
  block.append(
    searchBox(block, { source }),
    searchResultsContainer(block),
  );

  const searchValue = getUrlParam(queryParamSearch);
  if (searchValue) {
    const input = block.querySelector('input');
    input.value = searchValue;
    input.dispatchEvent(new Event('input'));
  }

  decorateIcons(block);
}
