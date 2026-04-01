#!/usr/bin/env python3
"""Clear old resume analyses to force fresh AI-powered analysis"""
import asyncio
import os
from supabase._async.client import AsyncClient

async def clear_analyses():
    """Clear all resume_analyses to force fresh analysis with new format"""
    # Jobeazy DB - for resume analyses
    jobeazy_url = os.getenv('SUPABASE_URL')
    jobeazy_key = os.getenv('SUPABASE_KEY')
    
    # Fastify DB - for queue jobs
    fastify_url = os.getenv('FASTIFY_SUPABASE_URL')
    fastify_key = os.getenv('FASTIFY_SUPABASE_KEY')
    
    if not jobeazy_url or not jobeazy_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set")
        return
    
    # Clear analyses from Jobeazy DB
    jobeazy_client = AsyncClient(jobeazy_url, jobeazy_key)
    response = await jobeazy_client.table('resume_analyses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    print(f"✅ Cleared {len(response.data)} analyses from Jobeazy DB")
    
    # Reset queue jobs in Fastify DB if credentials available
    if fastify_url and fastify_key:
        fastify_client = AsyncClient(fastify_url, fastify_key)
        response2 = await fastify_client.table('queue_jobs').update({'status': 'pending'}).eq('type', 'resume_analysis').execute()
        print(f"✅ Reset {len(response2.data)} queue jobs to pending in Fastify DB")
    else:
        print("⚠️  FASTIFY_SUPABASE_URL/KEY not set, skipping queue_jobs reset")
    
    print("\n✅ Old analyses cleared. Run the worker to generate fresh AI-powered analyses.")
    print("   The new analyzer will create detailed 100+ word analysis with citations.")

if __name__ == '__main__':
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    load_dotenv(_env_path)
    asyncio.run(clear_analyses())
