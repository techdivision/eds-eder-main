function getLanguageData(block) {
  const languages = new Map();
  for (let i = 0; i < block.children.length; i++) {
    const child = block.children.item(i);
    const key = child.children.item(0).querySelector('p').innerHTML;
    const name = child.children.item(1).querySelector('p').innerHTML;
    const label = child.children.item(2).querySelector('p').innerHTML;
    const image = child.children.item(3).querySelector('img').src;

    languages.set(key, { name, label, image });
  }
  return languages;
}

function addLanguageItems(ul, languages, languageSites) {
  languages.forEach((language, langKey) => {
    const languageSite = languageSites.find((site) => site.lang === langKey);
    const li = document.createElement('li');
    const a = document.createElement('a');

    const urlKey = langKey === 'de' ? '' : langKey;
    a.href = languageSite ? languageSite.path : `/${urlKey}`;
    const img = document.createElement('img');
    img.src = language.image;

    const textSpan = document.createElement('span');
    textSpan.innerHTML = language.name;

    a.append(img);
    a.append(textSpan);
    li.append(a);
    ul.append(li);
  });
}

export default async function decorate(block) {
  const languages = getLanguageData(block);
  block.innerHTML = '';
  const response = await fetch('/query-index.json');
  if (!response.ok) {
    return null;
  }
  const sites = await response.json();

  const keyMetaObject = document.querySelector('meta[name="key"]');
  const key = keyMetaObject ? keyMetaObject.content : 'index';

  const langMetaObject = document.querySelector('meta[name="lang"]');
  const lang = langMetaObject ? langMetaObject.content : 'en';

  const languageSites = sites.data.filter((site) => site.key === key);

  const languageImage = document.createElement('img');
  languageImage.src = languages.get(lang).image;

  const languageText = document.createElement('p');
  languageText.innerHTML = languages.get(lang).label;

  block.append(languageImage);
  block.append(languageText);
  const ul = document.createElement('ul');
  ul.className = 'language-list hidden';
  block.append(ul);
  addLanguageItems(ul, languages, languageSites);

  block.addEventListener('mouseover', () => {
    ul.className = 'language-list';
  });

  block.addEventListener('mouseleave', () => {
    ul.className = 'language-list hidden';
  });
  return block;
}
