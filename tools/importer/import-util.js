/**
 * Determines the EDS base-url based on static mapping
 * @param params
 * @returns {*}
 */
export const determineEdsBaseUrl = (params) => {
  const urlMapping = {
    'https://www.eder-gmbh.de': 'https://main--eds-eder-gmbh--techdivision.hlx.page',
    'https://www.eder-landtechnik.de': 'https://main--eds-eder-landtechnik--techdivision.hlx.page',
  };

  const originalUrl = new URL(params.originalURL);

  const urlToCheck = `${originalUrl.protocol}//${originalUrl.host}`;

  if (urlMapping[urlToCheck]) {
    return urlMapping[urlToCheck];
  }

  throw new Error(`There is no mapping for the base-url ${urlToCheck}`);
};
