import { loadPlaceholders, ts } from '../../scripts/i18n.js';

/**
 * Build search form
 *
 * @returns {HTMLFormElement}
 */
function getSearchForm() {
  const form = document.createElement('form');
  form.action = `/${ts('search')}`;
  form.method = 'get';

  const input = document.createElement('input');
  input.name = 'q';
  input.className = 'search-input';

  const searchPlaceholder = ts('Search');
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  form.append(input);
  return form;
}

export default async function decorate(block) {
  block.innerHTML = '';
  await loadPlaceholders();
  block.append(getSearchForm());
}
