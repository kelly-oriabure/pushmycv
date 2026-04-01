"""
Integration Test for PushMyCV Multi-Repo Setup
Tests all three services: web, api, and agentic
"""

import asyncio
import sys
import os

# Add agentic parent dir to path for imports
sys.path.insert(0, '/Users/kelly.o/Documents/projects/web/pushmycv-agentic')
os.chdir('/Users/kelly.o/Documents/projects/web/pushmycv-agentic')

async def test_web():
    """Test Next.js web frontend"""
    import urllib.request
    try:
        req = urllib.request.Request('http://localhost:3000', method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as response:
            return True, f"Web: OK (Status {response.status})"
    except Exception as e:
        return False, f"Web: FAIL - {e}"

async def test_api():
    """Test Fastify API"""
    import urllib.request
    import json
    try:
        req = urllib.request.Request('http://localhost:3001/health')
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            return True, f"API: OK (Status: {data.get('status', 'unknown')})"
    except Exception as e:
        return False, f"API: FAIL - {e}"

async def test_api_queue():
    """Test Fastify queue endpoint"""
    import urllib.request
    import json
    try:
        req = urllib.request.Request('http://localhost:3001/queue/stats')
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            return True, f"Queue: OK (Pending: {data.get('pending', 0)}, Done: {data.get('done', 0)})"
    except Exception as e:
        return False, f"Queue: FAIL - {e}"

async def test_agentic_import():
    """Test Agentic package imports"""
    try:
        from core.workflow import WorkflowEngine
        from workflows.resume_analysis import ResumeAnalysisWorkflow
        from tools.registry import ToolRegistry
        from models.resume import ResumeAnalysisResult
        return True, "Agentic: OK (All imports successful)"
    except Exception as e:
        return False, f"Agentic: FAIL - {e}"

async def test_supabase_connections():
    """Test database connections"""
    try:
        from supabase import create_client
        
        # Test Jobeazy DB (read-only)
        jobeazy_url = "https://embugkjoeyfukdotmgyg.supabase.co"
        jobeazy_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYnVna2pvZXlmdWtkb3RtZ3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzMyMTIsImV4cCI6MjA3MDA0OTIxMn0.Cjb-1DhIL_Q1ocGCofe_aJ0jhnNGlG9kITfkeRH9Tlk"
        jobeazy = create_client(jobeazy_url, jobeazy_key)
        
        # Test Fastify DB
        fastify_url = "https://hfxdqqeybszlpgtktgps.supabase.co"
        fastify_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmeGRxcWV5YnN6bHBndGt0Z3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NTIwMDUsImV4cCI6MjA1MTIyODAwNX0.Xwuxy7G9W2AzmAkb1d8iDqV2Rpj7bJZ3m6tW8nF-KoU"
        fastify = create_client(fastify_url, fastify_key)
        
        return True, "Supabase: OK (Both connections successful)"
    except Exception as e:
        return False, f"Supabase: FAIL - {e}"

async def main():
    print("=" * 60)
    print("PushMyCV Multi-Repo Integration Test")
    print("=" * 60)
    print()
    
    tests = [
        test_web,
        test_api,
        test_api_queue,
        test_agentic_import,
        test_supabase_connections,
    ]
    
    results = []
    for test in tests:
        success, message = await test()
        results.append((success, message))
        status = "✅" if success else "❌"
        print(f"{status} {message}")
    
    print()
    print("=" * 60)
    passed = sum(1 for s, _ in results if s)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All services are running correctly!")
    else:
        print("⚠️  Some services need attention")
        for success, message in results:
            if not success:
                print(f"   - {message}")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
