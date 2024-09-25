# EDER Profitechnik - Adobe Edge Delivery Services Project

## Environments

eder-main (library and drafts, no real domain)
- Preview: https://main--eds-eder-main--techdivision.aem.page
- Live: https://main--eds-eder-main--techdivision.aem.live

eder-gmbh
- Preview: https://main--eds-eder-gmbh--techdivision.aem.page
- Live: https://main--eds-eder-gmbh--techdivision.aem.live

eder-landtechnik
- Preview: https://main--eds-eder-landtechnik--techdivision.aem.page
- Live: https://main--eds-eder-landtechnik--techdivision.aem.live

agratec-salching
- Preview: https://main--eds-agratec-salching--techdivision.aem.page
- Live: https://main--eds-agratec-salching--techdivision.aem.live

feedstar
- Preview: https://main--eds-feedstar--techdivision.aem.page
- Live: https://main--eds-feedstar--techdivision.aem.live

eder-baumaschinen
- Preview: https://main--eds-eder-baumaschinen--techdivision.aem.page
- Live: https://main--eds-eder-baumaschinen--techdivision.aem.live

eder-profi
- Preview: https://main--eds-eder-profi--techdivision.aem.page
- Live: https://main--eds-eder-profi--techdivision.aem.live

eder-anhaenger
- Preview: https://main--eds-eder-anhaenger--techdivision.aem.page
- Live: https://main--eds-eder-anhaenger--techdivision.aem.live

eder-stapler
- Preview: https://main--eds-eder-stapler--techdivision.aem.page
- Live: https://main--eds-eder-stapler--techdivision.aem.live

lelycenterinbayern
- Preview: https://main--eds-lelycenterinbayern--techdivision.aem.page
- Live: https://main--eds-lelycenterinbayern--techdivision.aem.live

eder-kommunal
- Preview: https://main--eds-eder-kommunal--techdivision.aem.page
- Live: https://main--eds-eder-kommunal--techdivision.aem.live

eder-stalltechnik
- Preview: https://main--eds-eder-stalltechnik--techdivision.aem.page
- Live: https://main--eds-eder-stalltechnik--techdivision.aem.live


## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `eds-eder-main` directory in your favorite IDE and start coding :)

## Placeholders

To translate something, edit
the [placeholders.xlsx](https://edergmbh3.sharepoint.com/:x:/r/sites/MarketingEDSWebseiten/_layouts/15/Doc.aspx?sourcedoc=%7B63AB8C96-A1E2-42FE-95DC-35D9B607D61D%7D&file=placeholders.xlsx&action=default&mobileredirect=true)
and use asynchronous `await t('Your text here')` or synchronous `ts('Your text here')` if you (can) **ensure**
placeholders have
been loaded with `await loadPlaceholders()` before.
