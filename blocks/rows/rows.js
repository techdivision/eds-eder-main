import { copyAttributes, transformToMetadata } from '../../scripts/helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // transform to metadata
  transformToMetadata(block);

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    copyAttributes(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    const classes = ['image', 'logo', 'content', 'recommendation'];
    classes.forEach((c, i) => {
      const section = li.children[i];
      if (section) section.classList.add(`${c}`);
    });

    const content = li.querySelector('.content');
    const logo = li.querySelector('.logo');
    content.append(logo);

    ul.append(li);
  });

  ul.querySelectorAll('img')
    .forEach((img) => {
      const closestPicture = img.closest('picture');

      if (closestPicture) {
        closestPicture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
      }
    });

  block.textContent = '';
  block.append(ul);
}
