import { fetchPlaceholders } from '../../scripts/aem.js';

function searchForm(placeholders) {
  const form = document.createElement('form');
  form.action = `/${placeholders.search || 'search'}`;
  form.method = 'get';

  const input = document.createElement('input');
  input.name = 'q';
  input.className = 'search-input';

  const searchPlaceholder = placeholders.Search || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  form.append(input);
  return form;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  block.innerHTML = '';
  block.append(searchForm(placeholders));
}
