#!/usr/bin/env python3
"""
AIPURE.ai Web Scraper
A comprehensive scraper for extracting AI tools data from AIPURE.ai
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import json
import re
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AIPUREScraper:
    def __init__(self, base_url: str = "https://aipure.ai", delay: float = 2.0):
        self.base_url = base_url
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.tools_data = []
        self.categories_data = []
        
    def _make_request(self, url: str) -> Optional[BeautifulSoup]:
        """Make a request with error handling and rate limiting"""
        try:
            time.sleep(self.delay)  # Rate limiting
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def extract_categories(self) -> List[Dict]:
        """Extract all categories from the main page"""
        logger.info("Extracting categories...")
        soup = self._make_request(self.base_url)
        if not soup:
            return []
        
        categories = []
        
        # Look for category elements (adjust selectors based on actual HTML)
        category_elements = soup.find_all(['a', 'div'], class_=re.compile(r'category|nav|menu'))
        
        for element in category_elements:
            text = element.get_text(strip=True)
            if any(keyword in text.lower() for keyword in ['text', 'writing', 'image', 'voice', 'language', 'video']):
                category_data = {
                    'name': text,
                    'url': urljoin(self.base_url, element.get('href', '')),
                    'icon': self._extract_icon(element)
                }
                categories.append(category_data)
        
        # Add known categories from the website analysis
        known_categories = [
            {'name': 'Text & Writing', 'url': f"{self.base_url}/category/text-writing", 'icon': '✏️'},
            {'name': 'Image', 'url': f"{self.base_url}/category/image", 'icon': '🌄'},
            {'name': 'Voice & Language', 'url': f"{self.base_url}/category/voice-language", 'icon': '🔊'},
            {'name': 'Video', 'url': f"{self.base_url}/category/video", 'icon': '🎬'},
            {'name': 'All Category', 'url': f"{self.base_url}/category/all", 'icon': '🚀'}
        ]
        
        self.categories_data = known_categories
        return known_categories
    
    def _extract_icon(self, element) -> str:
        """Extract icon/emoji from category element"""
        # Look for emoji or icon in the element
        text = element.get_text()
        emoji_pattern = re.compile(r'[^\w\s]')
        emojis = emoji_pattern.findall(text)
        return emojis[0] if emojis else ''
    
    def extract_tools_from_category(self, category: Dict) -> List[Dict]:
        """Extract tools from a specific category page"""
        logger.info(f"Extracting tools from category: {category['name']}")
        soup = self._make_request(category['url'])
        if not soup:
            return []
        
        tools = []
        
        # Look for tool cards/items (adjust selectors based on actual HTML)
        tool_elements = soup.find_all(['div', 'article'], class_=re.compile(r'tool|card|item|product'))
        
        for element in tool_elements:
            tool_data = self._extract_tool_basic_info(element, category)
            if tool_data:
                tools.append(tool_data)
        
        return tools
    
    def _extract_tool_basic_info(self, element, category: Dict) -> Optional[Dict]:
        """Extract basic tool information from a tool element"""
        try:
            # Extract tool name
            name_element = element.find(['h1', 'h2', 'h3', 'h4', 'a'], class_=re.compile(r'title|name|heading'))
            if not name_element:
                return None
            
            tool_name = name_element.get_text(strip=True)
            if not tool_name:
                return None
            
            # Extract description
            desc_element = element.find(['p', 'div'], class_=re.compile(r'desc|summary|content'))
            description = desc_element.get_text(strip=True) if desc_element else ''
            
            # Extract tags
            tags = []
            tag_elements = element.find_all(['span', 'div'], class_=re.compile(r'tag|badge|label'))
            for tag_elem in tag_elements:
                tag_text = tag_elem.get_text(strip=True)
                if tag_text and tag_text not in ['', ' ']:
                    tags.append(tag_text)
            
            # Extract detail page URL
            detail_url = ''
            link_element = element.find('a', href=True)
            if link_element:
                detail_url = urljoin(self.base_url, link_element['href'])
            
            # Check for verification status
            verified = 'Verified by AIPURE' in element.get_text()
            
            # Check for trending status
            trending = any(keyword in element.get_text().lower() for keyword in ['trending', 'popular', 'hot'])
            
            return {
                'name': tool_name,
                'category': category['name'],
                'description': description,
                'tags': ', '.join(tags),
                'verified': verified,
                'trending': trending,
                'detail_url': detail_url,
                'category_url': category['url']
            }
            
        except Exception as e:
            logger.error(f"Error extracting tool info: {e}")
            return None
    
    def extract_tool_details(self, tool: Dict) -> Dict:
        """Extract detailed information from a tool's detail page"""
        if not tool.get('detail_url'):
            return tool
        
        logger.info(f"Extracting details for: {tool['name']}")
        soup = self._make_request(tool['detail_url'])
        if not soup:
            return tool
        
        # Extract full description
        full_desc_element = soup.find(['div', 'section'], class_=re.compile(r'description|content|details'))
        if full_desc_element:
            tool['full_description'] = full_desc_element.get_text(strip=True)
        
        # Extract features
        features = []
        feature_elements = soup.find_all(['li', 'div'], class_=re.compile(r'feature|benefit|capability'))
        for feature_elem in feature_elements:
            feature_text = feature_elem.get_text(strip=True)
            if feature_text and len(feature_text) > 5:  # Filter out very short text
                features.append(feature_text)
        tool['features'] = '; '.join(features)
        
        # Extract pricing information
        pricing_element = soup.find(['div', 'span'], class_=re.compile(r'price|pricing|cost'))
        if pricing_element:
            tool['pricing'] = pricing_element.get_text(strip=True)
        
        # Extract external website link
        external_links = soup.find_all('a', href=True)
        for link in external_links:
            href = link['href']
            if href and not href.startswith(self.base_url) and 'http' in href:
                tool['external_url'] = href
                break
        
        # Extract rating and reviews
        rating_element = soup.find(['div', 'span'], class_=re.compile(r'rating|score|star'))
        if rating_element:
            rating_text = rating_element.get_text(strip=True)
            rating_match = re.search(r'(\d+\.?\d*)', rating_text)
            if rating_match:
                tool['rating'] = float(rating_match.group(1))
        
        return tool
    
    def scrape_all(self) -> Dict:
        """Main method to scrape all data from AIPURE.ai"""
        logger.info("Starting AIPURE.ai scraping...")
        
        # Extract categories
        categories = self.extract_categories()
        logger.info(f"Found {len(categories)} categories")
        
        # Extract tools from each category
        all_tools = []
        for category in categories:
            tools = self.extract_tools_from_category(category)
            logger.info(f"Found {len(tools)} tools in {category['name']}")
            all_tools.extend(tools)
        
        # Extract detailed information for each tool
        detailed_tools = []
        for tool in all_tools:
            detailed_tool = self.extract_tool_details(tool)
            detailed_tools.append(detailed_tool)
        
        self.tools_data = detailed_tools
        
        return {
            'categories': categories,
            'tools': detailed_tools,
            'total_tools': len(detailed_tools),
            'total_categories': len(categories)
        }
    
    def save_to_excel(self, filename: str = 'aipure_data.xlsx'):
        """Save scraped data to Excel file"""
        logger.info(f"Saving data to {filename}...")
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Main tools data
            if self.tools_data:
                tools_df = pd.DataFrame(self.tools_data)
                tools_df.to_excel(writer, sheet_name='AI_Tools_Master', index=False)
            
            # Categories data
            if self.categories_data:
                categories_df = pd.DataFrame(self.categories_data)
                categories_df.to_excel(writer, sheet_name='Categories', index=False)
            
            # Summary statistics
            summary_data = {
                'Metric': ['Total Tools', 'Total Categories', 'Verified Tools', 'Trending Tools'],
                'Value': [
                    len(self.tools_data),
                    len(self.categories_data),
                    len([t for t in self.tools_data if t.get('verified', False)]),
                    len([t for t in self.tools_data if t.get('trending', False)])
                ]
            }
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary_Stats', index=False)
        
        logger.info(f"Data saved to {filename}")
    
    def save_to_csv(self, prefix: str = 'aipure'):
        """Save scraped data to CSV files"""
        logger.info("Saving data to CSV files...")
        
        if self.tools_data:
            tools_df = pd.DataFrame(self.tools_data)
            tools_df.to_csv(f'{prefix}_tools.csv', index=False)
        
        if self.categories_data:
            categories_df = pd.DataFrame(self.categories_data)
            categories_df.to_csv(f'{prefix}_categories.csv', index=False)

def main():
    """Main execution function"""
    scraper = AIPUREScraper(delay=2.0)  # 2 second delay between requests
    
    try:
        # Scrape all data
        results = scraper.scrape_all()
        
        # Print summary
        print(f"\nScraping completed!")
        print(f"Total categories found: {results['total_categories']}")
        print(f"Total tools found: {results['total_tools']}")
        
        # Save to files
        scraper.save_to_excel('aipure_data.xlsx')
        scraper.save_to_csv('aipure')
        
        print(f"\nData saved to:")
        print(f"- aipure_data.xlsx (Excel format)")
        print(f"- aipure_tools.csv")
        print(f"- aipure_categories.csv")
        
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        print(f"Error: {e}")

if __name__ == "__main__":
    main()


