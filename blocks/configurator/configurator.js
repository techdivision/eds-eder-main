import { loadThirdPartyScriptWithoutPartytown } from '../../scripts/load-thirdparty-script.js';
import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * Load iFrame
 *
 * @param {HTMLElement} block
 * @param {string} url
 * @returns {Promise<Element>}
 */
async function loadIFrame(block, url) {
  const iFrameLink = document.createElement('a');
  iFrameLink.href = url;
  const iFrameBlock = buildBlock('embed', {elems: [iFrameLink]});
  iFrameBlock.classList.add('height-750');
  block.append(iFrameBlock);
  decorateBlock(iFrameBlock);
  return loadBlock(iFrameBlock);
}

/**
 * Decorate block
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // get configurator code
  const configuratorCode = block.textContent.trim() || 'FEEDSTAR';
  const iFrameURL = `https://portal.combeenation.com/Cfgr/EDER/${configuratorCode}`;
  block.innerHTML = '';

  // load script
  loadThirdPartyScriptWithoutPartytown(
    `https://portal.combeenation.com/plugin/EDER/${configuratorCode}`
  )
    .then();

  // add iframe
  loadIFrame(block, iFrameURL)
    .then();
}
