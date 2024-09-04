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

import { tContent } from '../../scripts/i18n.js';

/**
 * Create efficiency graph
 *
 * @param {HTMLElement} element
 */
function createEfficiencyGraph(element) {
  // get efficiency
  const efficiency = parseInt(element.textContent.trim()
    .replace('%', ''), 10) || 0;

  // reset content
  element.innerHTML = '';
  if (!efficiency) {
    return;
  }

  // add graph
  const graph = document.createElement('div');
  graph.classList.add('graph');
  const graphProgress = document.createElement('div');
  graphProgress.classList.add('progress');
  graphProgress.style.width = `${efficiency}%`;
  graph.append(graphProgress);
  element.append(graph);

  // add label
  const label = document.createElement('p');
  tContent(label, 'Level of automation')
    .then();
  element.append(label);
}

export default async function decorate(block) {
  // build variant elements
  const numCols = block.children[0].children.length;
  const variants = Array.from(
    { length: numCols },
    () => {
      const variant = document.createElement('div');
      variant.classList.add('variant');
      return variant;
    },
  );

  // define row mapping
  const rowMapping = [
    'title',
    'subtitle',
    'efficiency',
    'list included',
    'list additional',
    'button-container',
  ];

  // change layout
  [...block.children].forEach((row, rowIndex) => {
    [...row.children].forEach((col, colIndex) => {
      const content = col.cloneNode(true);
      content.classList.add(...rowMapping[rowIndex].split(' '));
      variants[colIndex].appendChild(content);
    });
  });

  // set new layout
  block.innerHTML = '';
  variants.forEach((variant) => {
    block.appendChild(variant);
    if (!variant.querySelector('.button')) {
      variant.classList.add('no-button');
    }
  });

  // transform efficiency
  block.querySelectorAll('.efficiency')
    .forEach((element) => {
      createEfficiencyGraph(element);
    });
}
