# Readme about Import/Migration

## Links to documentation:
- high-level documentation: https://www.aem.live/developer/importer
- more in-depth technical documentation: https://github.com/adobe/helix-importer-ui/blob/main/importer-guidelines.md

## File structure:
- `import-util.js`: provides some generic functionalities that are common to all (or most) of the imports
- `import.js`: Import of main content
- `import-header.js`: Import of header/navigation
- `import-news.js`: Import of news-entries
- `import-events.js`: Import of event-entries
- `import-contacts.js`: Import of contacts (= employees)

---
## IMPORTANT INFORMATION

In order to optimize the url-structure of the websites the trailing slash from Typo3 should be removed the urls that are provided to EDS import!

### Example

**NOT** https://www.eder-gmbh.de/unternehmen/geschaeftsfuehrung/

**BUT INSTEAD** https://www.eder-gmbh.de/unternehmen/geschaeftsfuehrung

---

# General migration process
- Each domain in Typo3 provides an index-sitemap at /sitemap.xml (e.g. https://www.eder-gmbh.de/sitemap.xml)
- That index-sitemap contains a list of (sub-)sitemaps that are separated by their content: pages, news, events (the number of sitemaps depends on the available content of the domain)
- The content of the sub-sitemaps is transferred to a Google Spreadsheet to remove the trailing slashed from original urls, and allows creation for redirects between old and new urls: https://docs.google.com/spreadsheets/d/1Zefr-Y_OJ2Nimv2-1Orgk7kNHA5Vf5NZ-ARNIIZtX3E/edit?gid=1715714500#gid=1715714500
- The import web-ui opens up by executing `aem up` locally in the command-line within the `eder-eds-main` folder
- By using either the `Import - Workbench` or `Import - Bulk` a docx-file (and folder-structure) is generated in the local file-system that must be than transferred to Sharepoint
- Do not forget to preview and publish the .docx

# Migration of news/events: additional data
"additional data" = data that is not contained in the HTML-markup of the page and thus must be added from an additional data source

## Workflow:
- A dump of the Typo3 database is created every night, see Bitwarden for credentials
- The additional data for both news and events is extracted by
  - importing the Typo3 db-dump into a local database
  - executing the below-mentioned SQL-queries
- The result of those SQL-queries is provided to the import by copying the data into two Excel-sheets:
    - News: https://edergmbh3.sharepoint.com/:x:/r/sites/MarketingEDSWebseiten/_layouts/15/Doc.aspx?sourcedoc=%7B62BE7191-6841-49B1-B203-660806DDE6D0%7D&file=news-metadata.xlsx&action=default&mobileredirect=true
    - Events: https://edergmbh3.sharepoint.com/:x:/r/sites/MarketingEDSWebseiten/_layouts/15/Doc.aspx?sourcedoc=%7BC1B2A0B6-6251-402D-B95C-1EA058E2AED0%7D&file=events-metadata.xlsx&action=default&mobileredirect=true
- Do not forget to publish each of those sheets after updating their content

# Migration of Locations/Contacts
- In Typo3 two variations of location/shop-pages exist:
   - the ones contained in the sitemap.xml, e.g. https://www.eder-landtechnik.de/standort-ubersicht/tuntenhausen/ that do not contain any employee-information, and should **not** be used for the migration
   - the ones used on the website, e.g. https://www.eder-landtechnik.de/standort-ubersicht/tuntenhausen/?detail=1&no_cache=1&cHash=e6e59576d1d577131451ac075396abfc that contain the employee-information those are the ones **to be used** for the migration
- The location-pages must be migrated "twice"
   - using `import.js` in order to import the general data of the location and the assignment of employees
   - using `import-contacts.js` in order to import the data about each individual employee - a file for each employee is generated at `contacts/{firstname}-{lastname}.docx`

# Migration of Menu/nav
- Make sure to use either
   - the homepage itself - for all domains that are only available in one language, e.g. `https://www.eder-landtechnik.de` which generated a `nav.docx`
   - the homepage of the desired language, e.g. https://www.feedstar.com/en to allow the generation of an `en/nav.docx` which contains the translated menu-data for the english part of the website

## Collection of scripts

Database-management
```
# drop database, if already exists
mariadb10.6 -e "DROP DATABASE eder_typo3"

# create new database for Typo3-dump
mariadb10.6 -e "CREATE DATABASE eder_typo3 CHARACTER SET utf8 COLLATE utf8_general_ci;"

# import dump into database
mariadb10.6 eder_typo3 < eder_typo3_latest.sql
```

Data-extraction
```
# News
SELECT 
	news_tbl.uid, 
	news_tbl.path_segment, 
	news_tbl.location,
	GROUP_CONCAT(category_tbl.title) AS section 
FROM 
	tx_news_domain_model_news AS news_tbl,
	sys_category AS category_tbl,
	sys_category_record_mm AS category_assignment_tbl

WHERE news_tbl.uid = category_assignment_tbl.uid_foreign
AND category_assignment_tbl.tablenames = 'tx_news_domain_model_news'
AND category_tbl.uid = category_assignment_tbl.uid_local
AND category_tbl.parent IN (8563, 8960)
AND path_segment NOT LIKE '%m-w%' # avoid jobs, and thus reaching the limit of entries in EDS
GROUP BY news_tbl.uid
ORDER BY news_tbl.tstamp DESC;

# Events
SELECT 
	event_tbl.uid, 
	TRIM('/' FROM event_tbl.path_segment) AS path_segment, 
	image_tbl.identifier AS preview_image,
	GROUP_CONCAT(category_tbl.title) AS section
FROM 
	tx_sfeventmgt_domain_model_event AS event_tbl,
	sys_file_reference AS image_assignment_tbl,
	 sys_file AS image_tbl,
	 sys_category AS category_tbl,
	tx_sfeventmgt_event_category_mm AS category_assignment_tbl
WHERE image_assignment_tbl.tablenames = 'tx_sfeventmgt_domain_model_event'
AND event_tbl.uid = image_assignment_tbl.uid_foreign
AND image_assignment_tbl.uid_local = image_tbl.uid
AND image_assignment_tbl.deleted != 1
AND image_assignment_tbl.hidden != 1
AND event_tbl.uid = category_assignment_tbl.uid_local
AND category_tbl.uid = category_assignment_tbl.uid_foreign
AND category_tbl.parent IN (8563, 8960)
GROUP BY event_tbl.uid
ORDER BY event_tbl.startdate DESC;

```

