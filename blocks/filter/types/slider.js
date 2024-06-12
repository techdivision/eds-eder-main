// noinspection JSUnresolvedReference

import { loadCSS } from '../../../scripts/aem.js';
import { getNumericFilterValueForElement } from '../filter-library.js';
import { loadPlaceholders, tSync } from '../../../scripts/i18n.js';

/**
 * PS to KW ratio
 *
 * @type {number}
 */
const psToKwRatio = 0.73549875;

/**
 * Render decoration
 *
 * @param {HTMLElement} container
 * @param {Object} filter
 * @param {Array} values
 */
function renderDecoration(container, filter, values) {
  // noinspection JSUnresolvedReference
  if (filter.decoration.length) {
    [...container.getElementsByClassName('filter-decoration')].forEach((filterDecoration) => {
      filterDecoration.remove();
    });
    const decoration = document.createElement('div');
    decoration.classList.add('filter-decoration');
    container.append(decoration);
    // noinspection JSUnresolvedReference
    filter.decoration.forEach((decorationElement) => {
      const decorationElementClone = decorationElement.cloneNode(true);
      // check if the node contains only text
      if (decorationElementClone.childNodes.length === 1
          && decorationElementClone.childNodes[0].nodeType === Node.TEXT_NODE) {
        // get current slider values
        const minSliderValue = parseInt(values[0], 10);
        const maxSliderValue = parseInt(values[1], 10);
        const minSliderValueKW = Math.floor(minSliderValue * psToKwRatio);
        const maxSliderValueKW = Math.ceil(maxSliderValue * psToKwRatio);

        // replace
        decorationElementClone.textContent = decorationElementClone.textContent
          .replace('%minSliderValue', minSliderValue.toString())
          .replace('%maxSliderValue', maxSliderValue.toString())
          .replace('%minSliderValueKW', minSliderValueKW.toString())
          .replace('%maxSliderValueKW', maxSliderValueKW.toString());
      }
      decoration.append(decorationElementClone);
    });
  }
}

/**
 * Check if element matches
 *
 * @param {Object} filter
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function elementMatches(filter, element) {
  // get element values
  const elementMinValue = getNumericFilterValueForElement(element, filter.filterFields[0]);
  const elementMaxValue = getNumericFilterValueForElement(element, filter.filterFields[1]);

  // show or hide elements that match the filter
  return !Number.isNaN(elementMinValue) && !Number.isNaN(elementMaxValue)
      && ((filter.value[0] <= elementMaxValue) && (filter.value[1] >= elementMinValue));
}

/**
 * Decorate filter
 *
 * @param {HTMLElement} block
 * @param {HTMLElement} container
 * @param {Object} filter
 */
function build(block, container, filter) {
  // set filter function
  filter.elementMatches = elementMatches;

  // get min and max slider option
  const minFilterField = filter.filterFields[0];
  const maxFilterField = filter.filterFields[1];
  const minSliderOption = +filter.options[minFilterField][0];
  const maxSliderOption = +filter.options[maxFilterField].slice(-1)[0];
  if (!minSliderOption && !maxSliderOption) {
    return;
  }

  // define start values
  const startValues = filter.value || [minSliderOption, maxSliderOption];

  // create slider
  const slider = document.createElement('div');
  container.append(slider);
  loadCSS('/styles/vendor/nouislider.css').then();
  import('../../../scripts/vendor/nouislider.js')
    .then(async () => {
      // load placeholders
      await loadPlaceholders();

      // create slider
      window.noUiSlider.create(slider, {
        start: startValues,
        connect: true,
        range: {
          min: minSliderOption,
          max: maxSliderOption,
        },
        handleAttributes: [
          { 'aria-label': tSync('from') },
          { 'aria-label': tSync('to') },
        ],
      });

      // render decoration
      renderDecoration(container, filter, startValues);

      // on slider update
      slider.noUiSlider.on('update', (values) => {
        // render decoration
        renderDecoration(container, filter, values);
      });
      slider.noUiSlider.on('change', (values) => {
        // get current slider values
        const minSliderValue = parseInt(values[0], 10);
        const maxSliderValue = parseInt(values[1], 10);
        filter.value = [minSliderValue, maxSliderValue];

        // re-render filters
        block.dispatchEvent(new Event('change'));
      });
    });
}

export {
  build,
  elementMatches,
};
