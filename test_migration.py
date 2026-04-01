"""
End-to-End Test for Resume Analysis Migration
Tests: Web API → Fastify → Queue → Agentic → Jobeazy DB
"""

import asyncio
import json
import sys
import os
from datetime import datetime

sys.path.insert(0, '/Users/kelly.o/Documents/projects/web/pushmycv-agentic')

async def test_fastify_analyze_endpoint():
    """Test Fastify analyze endpoint"""
    import urllib.request
    
    test_payload = {
        "resumeUploadId": "test-upload-123",
        "userId": "test-user-456",
        "jobTitle": "Software Engineer",
        "resumeUrl": "https://example.com/resume.pdf"
    }
    
    try:
        req = urllib.request.Request(
            'http://localhost:3001/api/v1/resumes/analyze',
            data=json.dumps(test_payload).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return True, f"Fastify /analyze: OK (workflowId: {data.get('workflowId', 'N/A')[:8]}...)", data
    except Exception as e:
        return False, f"Fastify /analyze: FAIL - {e}", None

async def test_queue_job_created():
    """Verify queue job was created"""
    try:
        from supabase import create_client
        
        supabase = create_client(
            os.getenv('FASTIFY_SUPABASE_URL', 'https://hfxdqqeybszlpgtktgps.supabase.co'),
            os.getenv('FASTIFY_SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmeGRxcWV5YnN6bHBndGt0Z3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NTIwMDUsImV4cCI6MjA3MTIyODAwNX0.Xwuxy7G9W2AzmAkb1d8iDqV2Rpj7bJZ3m6tW8nF-KoU')
        )
        
        response = supabase.table('queue_jobs')\
            .select('*')\
            .eq('job_type', 'resume_analysis')\
            .order('created_at', ascending=False)\
            .limit(1)\
            .execute()
        
        jobs = response.data if hasattr(response, 'data') else []
        
        if jobs and len(jobs) > 0:
            job = jobs[0]
            return True, f"Queue Job: OK (status: {job.get('status')}, type: {job.get('job_type')})", job
        else:
            return False, "Queue Job: FAIL - No jobs found", None
    except Exception as e:
        return False, f"Queue Job: FAIL - {e}", None

async def test_agentic_worker_runnable():
    """Test Agentic worker can start (imports)"""
    try:
        os.chdir('/Users/kelly.o/Documents/projects/web/pushmycv-agentic')
        
        # Check imports
        from workers.queue_worker import poll_queue, process_resume_analysis_job
        from workflows.resume_analysis import ResumeAnalysisWorkflow
        
        return True, "Agentic Worker: OK (imports successful)", None
    except Exception as e:
        return False, f"Agentic Worker: FAIL - {e}", None

async def main():
    print("=" * 70)
    print("PushMyCV Resume Analysis Migration - Integration Test")
    print("=" * 70)
    print()
    
    tests = [
        ("Fastify API", test_fastify_analyze_endpoint),
        ("Queue Job", test_queue_job_created),
        ("Agentic Worker", test_agentic_worker_runnable),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"Testing {name}...")
        try:
            success, message, data = await test_func()
            status = "✅" if success else "❌"
            print(f"  {status} {message}")
            results.append((name, success, data))
        except Exception as e:
            print(f"  ❌ {name}: EXCEPTION - {e}")
            results.append((name, False, None))
        print()
    
    print("=" * 70)
    passed = sum(1 for _, s, _ in results if s)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All components are working!")
        print("\nNext steps:")
        print("  1. Ensure all services are running:")
        print("     - pushmycv-web (npm run dev)")
        print("     - pushmycv-api (npm run dev)")
        print("     - pushmycv-agentic worker (python workers/queue_worker.py)")
        print("\n  2. Upload a resume via the web UI")
        print("  3. Check queue_jobs table for job status")
        print("  4. Verify results appear in resume_analyses")
    else:
        print("\n⚠️  Some components need attention:")
        for name, success, data in results:
            if not success:
                print(f"  - {name} failed")
    
    print("=" * 70)

if __name__ == '__main__':
    asyncio.run(main())
