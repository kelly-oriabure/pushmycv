import asyncio
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict

from dotenv import load_dotenv
load_dotenv('/Users/kelly.o/Documents/projects/web/agentic-job-automation/agentic/.env')

sys.path.insert(0, '/Users/kelly.o/Documents/projects/web/agentic-job-automation/agentic')

from supabase._async.client import AsyncClient
from simple_analyzer import SimpleResumeAnalyzer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_supabase_clients():
    """Create async Supabase clients"""
    fastify_client = AsyncClient(
        os.getenv('FASTIFY_SUPABASE_URL'),
        os.getenv('FASTIFY_SUPABASE_KEY')
    )
    
    jobeazy_client = AsyncClient(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_KEY')
    )
    
    return fastify_client, jobeazy_client

async def process_resume_analysis_job(job: Dict[str, Any], jobeazy_supabase, analyzer) -> bool:
    payload = job.get('payload', {})
    
    upload_id = payload.get('resume_upload_id')
    user_id = payload.get('user_id')
    raw_text = payload.get('raw_text', '')
    job_title = payload.get('job_title')
    
    logger.info(f"Processing resume analysis for upload {upload_id}")
    
    if not raw_text:
        logger.error(f"No text provided for upload {upload_id}")
        return False
    
    try:
        result = await analyzer.analyze_resume(
            raw_text=raw_text,
            upload_id=upload_id,
            user_id=user_id,
            jobeazy_supabase=jobeazy_supabase,
            job_title=job_title
        )
        
        logger.info(f"✅ Analysis completed: Score {result['overall_score']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing job: {e}")
        import traceback
        traceback.print_exc()
        return False

async def process_fetch_jobs_api_job(job: Dict[str, Any], fastify_supabase) -> bool:
    """Process job to fetch jobs from external APIs"""
    payload = job.get('payload', {})
    
    logger.info("Processing fetch_jobs_api job")
    
    try:
        # Import here to avoid circular imports
        sys.path.insert(0, '/Users/kelly.o/Documents/projects/web/agentic-job-automation/agentic')
        from jobs.fetch_jobs_api import fetch_jobs_from_boards
        
        result = await fetch_jobs_from_boards(payload)
        
        # Log results
        for source, stats in result.get('sources', {}).items():
            if 'error' in stats:
                logger.error(f"❌ {source}: {stats['error']}")
            else:
                logger.info(f"✅ {source}: {stats.get('fetched', 0)} fetched, {stats.get('inserted', 0)} new, {stats.get('updated', 0)} updated")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing fetch_jobs_api job: {e}")
        import traceback
        traceback.print_exc()
        return False

async def poll_queue(fastify_supabase, jobeazy_supabase, analyzer):
    logger.info("=" * 60)
    logger.info("PushMyCV Agentic Worker Started")
    logger.info("=" * 60)
    logger.info("Waiting for jobs...")
    
    while True:
        try:
            # Fetch pending jobs of supported types
            response = await fastify_supabase.table('queue_jobs')\
                .select('*')\
                .eq('status', 'pending')\
                .in_('type', ['resume_analysis', 'fetch_jobs_api'])\
                .order('created_at')\
                .limit(1)\
                .execute()
            
            jobs = response.data if hasattr(response, 'data') else response.get('data', [])
            
            if not jobs:
                await asyncio.sleep(5)
                continue
            
            job = jobs[0]
            job_id = job['id']
            job_type = job.get('type', 'unknown')
            
            logger.info(f"Processing job {job_id} (type: {job_type})")
            
            # Mark as processing
            await fastify_supabase.table('queue_jobs')\
                .update({'status': 'processing', 'updated_at': datetime.utcnow().isoformat()})\
                .eq('id', job_id)\
                .execute()
            
            # Process job based on type
            if job_type == 'resume_analysis':
                success = await process_resume_analysis_job(job, jobeazy_supabase, analyzer)
            elif job_type == 'fetch_jobs_api':
                success = await process_fetch_jobs_api_job(job, fastify_supabase)
            else:
                logger.warning(f"Unknown job type: {job_type}")
                success = False
            
            # Update job status
            if success:
                await fastify_supabase.table('queue_jobs')\
                    .update({'status': 'completed', 'updated_at': datetime.utcnow().isoformat()})\
                    .eq('id', job_id)\
                    .execute()
                logger.info(f"✅ Job {job_id} completed")
            else:
                await fastify_supabase.table('queue_jobs')\
                    .update({'status': 'failed', 'updated_at': datetime.utcnow().isoformat()})\
                    .eq('id', job_id)\
                    .execute()
                logger.error(f"❌ Job {job_id} failed")
            
        except Exception as e:
            logger.error(f"Worker error: {e}")
            import traceback
            traceback.print_exc()
            await asyncio.sleep(5)

async def main():
    fastify_supabase, jobeazy_supabase = await create_supabase_clients()
    analyzer = SimpleResumeAnalyzer()
    await poll_queue(fastify_supabase, jobeazy_supabase, analyzer)

if __name__ == '__main__':
    asyncio.run(main())
