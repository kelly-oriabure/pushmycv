"""
Test script for job board API integration
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.job_boards.remoteok_client import RemoteOKClient
from services.job_boards.arbeitnow_client import ArbeitnowClient

async def test_remoteok():
    """Test RemoteOK API client"""
    print("\n🔄 Testing RemoteOK API...")
    client = RemoteOKClient()
    
    try:
        jobs = await client.fetch_jobs(limit=5)
        print(f"✅ Successfully fetched {len(jobs)} jobs from RemoteOK")
        
        if jobs:
            job = jobs[0]
            print(f"\n📋 Sample job:")
            print(f"   Title: {job.title}")
            print(f"   Company: {job.company}")
            print(f"   Location: {job.location}")
            print(f"   Tags: {', '.join(job.tags[:5])}")
        
        return True
    except Exception as e:
        print(f"❌ RemoteOK test failed: {e}")
        return False

async def test_arbeitnow():
    """Test Arbeitnow API client"""
    print("\n🔄 Testing Arbeitnow API...")
    client = ArbeitnowClient()
    
    try:
        jobs, has_more = await client.fetch_jobs(search="software", page=1, per_page=5)
        print(f"✅ Successfully fetched {len(jobs)} jobs from Arbeitnow")
        print(f"📄 Has more pages: {has_more}")
        
        if jobs:
            job = jobs[0]
            print(f"\n📋 Sample job:")
            print(f"   Title: {job.title}")
            print(f"   Company: {job.company}")
            print(f"   Location: {job.location}")
            print(f"   Remote: {job.is_remote}")
        
        return True
    except Exception as e:
        print(f"❌ Arbeitnow test failed: {e}")
        return False

async def main():
    print("=" * 60)
    print("🧪 Job Board API Integration Tests")
    print("=" * 60)
    
    results = []
    
    # Test RemoteOK
    results.append(("RemoteOK", await test_remoteok()))
    
    # Test Arbeitnow
    results.append(("Arbeitnow", await test_arbeitnow()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    print("=" * 60)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(success for _, success in results)
    
    if all_passed:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️  Some tests failed")
    
    return all_passed

if __name__ == "__main__":
    asyncio.run(main())
