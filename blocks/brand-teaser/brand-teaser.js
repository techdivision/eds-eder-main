export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const innerRows = [...row.children];

    const brandTeaserImageContainer = document.createElement('div');
    brandTeaserImageContainer.classList.add('brand-teaser-image-container');

    const brandTeaserImage = document.createElement('img');
    brandTeaserImage.src = innerRows[0].querySelector('img').src;
    brandTeaserImage.alt = innerRows[0].querySelector('img').alt;
    brandTeaserImage.classList.add('brand-teaser-image');

    const brandTeaserHeader = innerRows[0].querySelector('h2');
    brandTeaserHeader.classList.add('brand-teaser-header');

    const brandsContainer = document.createElement('div');
    brandsContainer.classList.add('brands-container');

    innerRows.slice(1)
      .forEach((brandColumn) => {
        const brand = document.createElement('div');
        brand.classList.add('brand-row');

        const brandImage = brandColumn.querySelector('img');
        const brandText = document.createElement('p');
        brandText.textContent = brandColumn.querySelector('h3').textContent;

        brand.append(brandImage);
        brand.append(brandText);

        const linkContainer = document.createElement('div');
        linkContainer.classList.add('link-container');
        [...brandColumn.querySelectorAll('a')].forEach((link) => {
          link.classList.remove('button');

          if (link.textContent === 'weitere Infos') {
            link.classList.add('info-link');
          }

          linkContainer.append(link);
        });

        brand.append(linkContainer);
        brandsContainer.append(brand);
      });

    brandTeaserImageContainer.append(brandTeaserImage);
    brandTeaserImageContainer.append(brandTeaserHeader);

    li.append(brandTeaserImageContainer);
    li.append(brandsContainer);
    ul.append(li);
  });

  block.innerHTML = '';
  block.append(ul);
}
