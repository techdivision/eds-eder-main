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
- `import-contacts.js`: Import of contacts from pages like https://www.eder-landtechnik.de/standort-ubersicht/tuntenhausen/?detail=1&no_cache=1

---
## IMPORTANT INFORMATION

In order to optimize the url-structure of the websites the trailing slash from Typo3 should be removed the urls that are provided to EDS import!

### Example

**NOT** https://www.eder-gmbh.de/unternehmen/geschaeftsfuehrung/

**BUT INSTEAD** https://www.eder-gmbh.de/unternehmen/geschaeftsfuehrung

---


# Migration of additional data
"additional data" = data that is not contained in the HTML-markup of the page and thus must be added from an additional data source

## Workflow:
- A dump of the Typo3 database is every night, see Bitwarden for credentials
- The additional data for both news and events is extracted by
  - importing the Typo3 db-dump into a local database
  - executing the below-mentioned SQL-queries
- The result of those SQL-queries is provided to the import by copying the data into two Excel-sheets:
    - News: https://edergmbh3.sharepoint.com/:x:/r/sites/MarketingEDSWebseiten/_layouts/15/Doc.aspx?sourcedoc=%7B62BE7191-6841-49B1-B203-660806DDE6D0%7D&file=news-metadata.xlsx&action=default&mobileredirect=true
    - Events: https://edergmbh3.sharepoint.com/:x:/r/sites/MarketingEDSWebseiten/_layouts/15/Doc.aspx?sourcedoc=%7BC1B2A0B6-6251-402D-B95C-1EA058E2AED0%7D&file=events-metadata.xlsx&action=default&mobileredirect=true
- Do not forget to publish each of those sheets after updating their content

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

