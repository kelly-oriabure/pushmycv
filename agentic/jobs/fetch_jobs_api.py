"""
Job Board Integration Module
Handles fetching jobs from RemoteOK and Arbeitnow APIs
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from integrations.supabase import get_supabase_client

logger = logging.getLogger(__name__)


async def fetch_jobs_from_boards(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch jobs from configured job board APIs
    
    Args:
        payload: Dict with optional 'sources' list and 'limit' per source
        
    Returns:
        Dict with sync results
    """
    sources = payload.get('sources', ['remoteok', 'arbeitnow'])
    limit = payload.get('limit', 100)
    
    results = {
        'synced_at': datetime.utcnow().isoformat(),
        'sources': {}
    }
    
    try:
        supabase = get_supabase_client()
        
        for source in sources:
            try:
                if source == 'remoteok':
                    sync_result = await _sync_remoteok(supabase, limit)
                elif source == 'arbeitnow':
                    sync_result = await _sync_arbeitnow(supabase, limit)
                else:
                    logger.warning(f"Unknown job source: {source}")
                    continue
                
                results['sources'][source] = sync_result
                
            except Exception as e:
                logger.error(f"Error syncing {source}: {e}")
                results['sources'][source] = {'error': str(e)}
        
        return results
        
    except Exception as e:
        logger.error(f"Error in fetch_jobs_from_boards: {e}")
        raise


async def _sync_remoteok(supabase, limit: int) -> Dict[str, Any]:
    """Sync jobs from RemoteOK API"""
    from services.job_boards.remoteok_client import RemoteOKClient
    
    client = RemoteOKClient()
    jobs = await client.fetch_jobs(limit=limit)
    
    inserted = 0
    updated = 0
    
    for job in jobs:
        try:
            result = _upsert_job(supabase, {
                'source': 'remoteok',
                'source_job_id': job.external_id,
                'title': job.title,
                'company': job.company,
                'description': job.description,
                'location': job.location,
                'is_remote': job.is_remote,
                'application_url': job.apply_url,
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'job_type': job.job_types[0] if job.job_types else 'remote',
                'status': 'active',
                'embedding_status': 'pending',
                'posted_date': job.posted_at.isoformat() if job.posted_at else None,
                'requirements': job.tags
            })
            
            if result == 'inserted':
                inserted += 1
            elif result == 'updated':
                updated += 1
                
        except Exception as e:
            logger.error(f"Error upserting job {job.external_id}: {e}")
    
    # Update sync tracking
    _update_sync_tracking(supabase, 'remoteok', len(jobs), inserted, updated)
    
    return {
        'fetched': len(jobs),
        'inserted': inserted,
        'updated': updated
    }


async def _sync_arbeitnow(supabase, limit: int) -> Dict[str, Any]:
    """Sync jobs from Arbeitnow API"""
    from services.job_boards.arbeitnow_client import ArbeitnowClient
    
    client = ArbeitnowClient()
    max_pages = (limit // 100) + 1
    jobs = await client.fetch_all_jobs(max_pages=max_pages)
    
    # Limit to requested amount
    jobs = jobs[:limit]
    
    inserted = 0
    updated = 0
    
    for job in jobs:
        try:
            result = _upsert_job(supabase, {
                'source': 'arbeitnow',
                'source_job_id': job.external_id,
                'title': job.title,
                'company': job.company,
                'description': job.description,
                'location': job.location,
                'is_remote': job.is_remote,
                'application_url': job.apply_url,
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'job_type': ', '.join(job.job_types) if job.job_types else 'full-time',
                'status': 'active',
                'embedding_status': 'pending',
                'posted_date': job.posted_at.isoformat() if job.posted_at else None,
                'requirements': job.tags
            })
            
            if result == 'inserted':
                inserted += 1
            elif result == 'updated':
                updated += 1
                
        except Exception as e:
            logger.error(f"Error upserting job {job.external_id}: {e}")
    
    # Update sync tracking
    _update_sync_tracking(supabase, 'arbeitnow', len(jobs), inserted, updated)
    
    return {
        'fetched': len(jobs),
        'inserted': inserted,
        'updated': updated
    }


def _upsert_job(supabase, job_data: Dict[str, Any]) -> str:
    """
    Upsert a job into the database
    
    Returns:
        'inserted', 'updated', or 'skipped'
    """
    source = job_data.get('source')
    source_job_id = job_data.get('source_job_id')
    
    # Check if job already exists
    existing = supabase.table('jobs').select('id').eq('source', source).eq('source_job_id', source_job_id).execute()
    
    if existing.data:
        # Update existing job
        job_id = existing.data[0]['id']
        supabase.table('jobs').update({
            'title': job_data.get('title'),
            'company': job_data.get('company'),
            'description': job_data.get('description'),
            'location': job_data.get('location'),
            'is_remote': job_data.get('is_remote'),
            'application_url': job_data.get('application_url'),
            'salary_min': job_data.get('salary_min'),
            'salary_max': job_data.get('salary_max'),
            'job_type': job_data.get('job_type'),
            'requirements': job_data.get('requirements'),
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', job_id).execute()
        
        return 'updated'
    else:
        # Insert new job
        supabase.table('jobs').insert(job_data).execute()
        return 'inserted'


def _update_sync_tracking(supabase, source: str, fetched: int, inserted: int, updated: int):
    """Update job board sync tracking"""
    try:
        # Check if tracking record exists
        existing = supabase.table('job_board_syncs').select('*').eq('source', source).execute()
        
        sync_data = {
            'source': source,
            'last_sync_at': datetime.utcnow().isoformat(),
            'jobs_fetched': fetched,
            'jobs_inserted': inserted,
            'jobs_updated': updated,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if existing.data:
            supabase.table('job_board_syncs').update(sync_data).eq('source', source).execute()
        else:
            supabase.table('job_board_syncs').insert(sync_data).execute()
            
    except Exception as e:
        logger.error(f"Error updating sync tracking for {source}: {e}")
