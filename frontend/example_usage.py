#!/usr/bin/env python3
"""
Example usage of the AIPURE.ai scraper
Demonstrates different ways to use the scraper
"""

from aipure_scraper import AIPUREScraper
import json

def example_basic_scraping():
    """Basic scraping example"""
    print("=== Basic Scraping Example ===")
    
    # Create scraper with 2-second delay
    scraper = AIPUREScraper(delay=2.0)
    
    # Scrape all data
    results = scraper.scrape_all()
    
    # Print summary
    print(f"Scraped {results['total_tools']} tools from {results['total_categories']} categories")
    
    # Save to files
    scraper.save_to_excel('example_output.xlsx')
    scraper.save_to_csv('example')
    
    print("Data saved to example_output.xlsx and CSV files")

def example_category_specific():
    """Example of scraping specific categories"""
    print("\n=== Category-Specific Scraping Example ===")
    
    scraper = AIPUREScraper(delay=1.5)
    
    # Get all categories
    categories = scraper.extract_categories()
    print(f"Available categories: {[c['name'] for c in categories]}")
    
    # Scrape only 'Text & Writing' category
    text_category = next((c for c in categories if 'Text' in c['name']), None)
    if text_category:
        tools = scraper.extract_tools_from_category(text_category)
        print(f"Found {len(tools)} tools in {text_category['name']} category")
        
        # Show first few tools
        for i, tool in enumerate(tools[:3]):
            print(f"  {i+1}. {tool['name']} - {tool['description'][:50]}...")

def example_data_analysis():
    """Example of analyzing scraped data"""
    print("\n=== Data Analysis Example ===")
    
    scraper = AIPUREScraper(delay=1.0)
    results = scraper.scrape_all()
    
    tools = results['tools']
    
    # Analyze data
    verified_count = len([t for t in tools if t.get('verified', False)])
    trending_count = len([t for t in tools if t.get('trending', False)])
    
    # Group by category
    category_counts = {}
    for tool in tools:
        category = tool.get('category', 'Unknown')
        category_counts[category] = category_counts.get(category, 0) + 1
    
    print(f"Total tools: {len(tools)}")
    print(f"Verified tools: {verified_count}")
    print(f"Trending tools: {trending_count}")
    print("\nTools by category:")
    for category, count in sorted(category_counts.items()):
        print(f"  {category}: {count}")

def example_custom_configuration():
    """Example with custom configuration"""
    print("\n=== Custom Configuration Example ===")
    
    # Load configuration
    with open('scraper_config.json', 'r') as f:
        config = json.load(f)
    
    # Create scraper with custom settings
    scraper = AIPUREScraper(
        delay=config['scraping_settings']['delay_between_requests']
    )
    
    # Extract only required fields
    categories = scraper.extract_categories()
    print(f"Using custom delay: {scraper.delay} seconds")
    print(f"Found {len(categories)} categories")

def example_error_handling():
    """Example of error handling"""
    print("\n=== Error Handling Example ===")
    
    # Create scraper with very short delay (might cause issues)
    scraper = AIPUREScraper(delay=0.1)
    
    try:
        # This might fail due to rate limiting
        results = scraper.scrape_all()
        print("Scraping completed successfully")
    except Exception as e:
        print(f"Scraping failed: {e}")
        print("Try increasing the delay between requests")

def main():
    """Run all examples"""
    print("AIPURE.ai Scraper Examples")
    print("=" * 50)
    
    try:
        # Run examples
        example_basic_scraping()
        example_category_specific()
        example_data_analysis()
        example_custom_configuration()
        example_error_handling()
        
        print("\n" + "=" * 50)
        print("All examples completed!")
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"\nError running examples: {e}")

if __name__ == "__main__":
    main()


