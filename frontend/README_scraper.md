# AIPURE.ai Web Scraper

A comprehensive Python scraper for extracting AI tools data from AIPURE.ai and organizing it into structured spreadsheets.

## Features

- **Complete Data Extraction**: Scrapes categories, tool listings, and detailed information
- **Multiple Output Formats**: Excel (.xlsx) and CSV files
- **Rate Limiting**: Respectful scraping with configurable delays
- **Error Handling**: Robust error handling and retry logic
- **Data Validation**: Ensures data quality and completeness
- **Configurable**: Easy to customize via JSON configuration

## Installation

1. **Clone or download the scraper files**
2. **Install required dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Quick Start

### Basic Usage

```python
from aipure_scraper import AIPUREScraper

# Create scraper instance
scraper = AIPUREScraper(delay=2.0)  # 2 second delay between requests

# Scrape all data
results = scraper.scrape_all()

# Save to files
scraper.save_to_excel('aipure_data.xlsx')
scraper.save_to_csv('aipure')
```

### Command Line Usage

```bash
python aipure_scraper.py
```

## Output Files

### Excel File (aipure_data.xlsx)
- **AI_Tools_Master**: Main tools data with all details
- **Categories**: Category information
- **Summary_Stats**: Statistics and metrics

### CSV Files
- **aipure_tools.csv**: Main tools data
- **aipure_categories.csv**: Category data

## Data Structure

### Tool Data Fields

| Field | Type | Description |
|-------|------|-------------|
| name | String | Tool name |
| category | String | Primary category |
| description | String | Brief description |
| full_description | String | Detailed description |
| tags | String | Comma-separated tags |
| verified | Boolean | AIPURE verification status |
| trending | Boolean | Trending status |
| pricing | String | Pricing information |
| features | String | Semicolon-separated features |
| rating | Float | User rating (if available) |
| external_url | String | Official website URL |
| detail_url | String | AIPURE detail page URL |

### Category Data Fields

| Field | Type | Description |
|-------|------|-------------|
| name | String | Category name |
| url | String | Category page URL |
| icon | String | Category icon/emoji |

## Configuration

Edit `scraper_config.json` to customize:

- **Scraping settings**: Delays, timeouts, retries
- **Output settings**: Filenames, formats
- **Data fields**: Required and optional fields
- **Categories**: Category definitions

## Advanced Usage

### Custom Scraping

```python
# Extract only specific categories
scraper = AIPUREScraper()
categories = scraper.extract_categories()
specific_category = [c for c in categories if c['name'] == 'Text & Writing'][0]
tools = scraper.extract_tools_from_category(specific_category)
```

### Data Processing

```python
# Access scraped data
results = scraper.scrape_all()
tools_data = results['tools']
categories_data = results['categories']

# Filter tools
verified_tools = [t for t in tools_data if t.get('verified', False)]
trending_tools = [t for t in tools_data if t.get('trending', False)]
```

## Rate Limiting & Ethics

- **Default delay**: 2 seconds between requests
- **Respectful scraping**: Follows robots.txt guidelines
- **Error handling**: Graceful handling of failed requests
- **User agent**: Identifies as legitimate browser

## Troubleshooting

### Common Issues

1. **Connection errors**: Check internet connection and website availability
2. **Empty results**: Website structure may have changed - update selectors
3. **Rate limiting**: Increase delay between requests
4. **Missing data**: Some tools may not have complete information

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Legal Considerations

- **Terms of Service**: Review AIPURE.ai's terms before scraping
- **Rate Limiting**: Respect server resources
- **Data Usage**: Use scraped data responsibly
- **Attribution**: Credit AIPURE.ai as data source

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This scraper is for educational and research purposes. Please respect AIPURE.ai's terms of service and use the data responsibly.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the configuration options
3. Check AIPURE.ai's website for structural changes
4. Open an issue with detailed error information

## Changelog

### Version 1.0.0
- Initial release
- Basic scraping functionality
- Excel and CSV output
- Rate limiting and error handling
- Configuration support


