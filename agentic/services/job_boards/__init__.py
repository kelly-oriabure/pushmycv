"""
Unified Job Board Service
"""
import logging
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime

from .remoteok_client import RemoteOKClient, RemoteOKJob
from .arbeitnow_client import ArbeitnowClient, ArbeitnowJob

logger = logging.getLogger(__name__)


@dataclass
class UnifiedJob:
    """Unified job model for all job board sources"""
    source: str
    external_id: str
    title: str
    company: str
    description: str
    location: str
    is_remote: bool
    apply_url: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    tags: List[str]
    job_types: List[str]
    posted_at: Optional[datetime]
    raw_data: dict


class JobBoardService:
    """Unified service for fetching jobs from multiple job boards"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.remoteok_client = RemoteOKClient()
        self.arbeitnow_client = ArbeitnowClient()
    
    async def fetch_remoteok_jobs(self, limit: int = 100) -> List[UnifiedJob]:
        """Fetch and normalize jobs from RemoteOK"""
        jobs = await self.remoteok_client.fetch_jobs(limit)
        return [self._unify_remoteok_job(job) for job in jobs]
    
    async def fetch_arbeitnow_jobs(
        self, 
        search: str = "", 
        max_pages: int = 5
    ) -> List[UnifiedJob]:
        """Fetch and normalize jobs from Arbeitnow"""
        jobs = await self.arbeitnow_client.fetch_all_jobs(search, max_pages)
        return [self._unify_arbeitnow_job(job) for job in jobs]
    
    async def fetch_all_jobs(
        self,
        remoteok_limit: int = 100,
        arbeitnow_search: str = "",
        arbeitnow_max_pages: int = 5
    ) -> List[UnifiedJob]:
        """Fetch jobs from all configured job boards"""
        all_jobs = []
        
        # Fetch from RemoteOK
        try:
            remoteok_jobs = await self.fetch_remoteok_jobs(remoteok_limit)
            all_jobs.extend(remoteok_jobs)
            self.logger.info(f"Fetched {len(remoteok_jobs)} jobs from RemoteOK")
        except Exception as e:
            self.logger.error(f"Failed to fetch from RemoteOK: {e}")
        
        # Fetch from Arbeitnow
        try:
            arbeitnow_jobs = await self.fetch_arbeitnow_jobs(
                arbeitnow_search, 
                arbeitnow_max_pages
            )
            all_jobs.extend(arbeitnow_jobs)
            self.logger.info(f"Fetched {len(arbeitnow_jobs)} jobs from Arbeitnow")
        except Exception as e:
            self.logger.error(f"Failed to fetch from Arbeitnow: {e}")
        
        self.logger.info(f"Total jobs fetched from all sources: {len(all_jobs)}")
        return all_jobs
    
    def _unify_remoteok_job(self, job: RemoteOKJob) -> UnifiedJob:
        """Convert RemoteOKJob to UnifiedJob"""
        return UnifiedJob(
            source=job.source,
            external_id=job.external_id,
            title=job.title,
            company=job.company,
            description=job.description,
            location=job.location,
            is_remote=job.is_remote,
            apply_url=job.apply_url,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            tags=job.tags,
            job_types=job.job_types,
            posted_at=job.posted_at,
            raw_data=job.raw_data
        )
    
    def _unify_arbeitnow_job(self, job: ArbeitnowJob) -> UnifiedJob:
        """Convert ArbeitnowJob to UnifiedJob"""
        return UnifiedJob(
            source=job.source,
            external_id=job.external_id,
            title=job.title,
            company=job.company,
            description=job.description,
            location=job.location,
            is_remote=job.is_remote,
            apply_url=job.apply_url,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            tags=job.tags,
            job_types=job.job_types,
            posted_at=job.posted_at,
            raw_data=job.raw_data
        )


# Convenience function
async def fetch_all_jobs() -> List[UnifiedJob]:
    """Fetch jobs from all configured job boards"""
    service = JobBoardService()
    return await service.fetch_all_jobs()
