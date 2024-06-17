# Your Project's Title...

Your project's description...

## Environments

- Preview: https://main--eds-eder-main--techdivision.hlx.page/
- Live: https://main--eds-eder-main--techdivision.hlx.live/

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
