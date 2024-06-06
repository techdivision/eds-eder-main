const removeGenericContent = (main, document) => {
  // remove header, footer and generic elements from content
  WebImporter.DOMUtils.remove(main, [
    'nav',
    '.nav',
    'footer',
    '.footer',
    'noscript',
    '.footer-box',
    '.offcanvas',
    '.breadcrumb',
    '.visible-xs'
  ]);
}

export default {
  transformDOM: ({ document, params }) => {
    const main = document.body;

    removeGenericContent(main, document);

    const table = main.querySelector('table');

    //console.log(table);

    handleSidebar(main, document);


    WebImporter.rules.createMetadata(main, document);

    return main;
  },
};

const handleSidebar = (main, document) => {
  const sidebar = main.querySelector('div.news-sidebar');
  const result = document.createElement('div');
  

  result.append(document.createElement('hr'));
  result.append(sidebarClone.innerHTML);


  sidebar.replaceWith(result);

};