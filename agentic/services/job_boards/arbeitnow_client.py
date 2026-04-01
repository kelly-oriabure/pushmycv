"""
Job Board API Client for Arbeitnow
"""
import logging
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ArbeitnowJob:
    """Normalized job posting from Arbeitnow"""
    source: str = "arbeitnow"
    external_id: str = ""
    title: str = ""
    company: str = ""
    description: str = ""
    location: str = ""
    is_remote: bool = False
    apply_url: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    tags: List[str] = None
    job_types: List[str] = None
    posted_at: Optional[datetime] = None
    raw_data: dict = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.job_types is None:
            self.job_types = []


class ArbeitnowClient:
    """Client for fetching jobs from Arbeitnow API"""
    
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def fetch_jobs(
        self, 
        search: str = "", 
        page: int = 1, 
        per_page: int = 100
    ) -> tuple[List[ArbeitnowJob], bool]:
        """
        Fetch jobs from Arbeitnow API
        
        Args:
            search: Search query (optional)
            page: Page number (1-indexed)
            per_page: Jobs per page (max 100)
            
        Returns:
            Tuple of (list of jobs, has_more_pages)
        """
        import httpx
        
        try:
            self.logger.info(f"Fetching jobs from Arbeitnow API (page: {page}, search: {search})")
            
            params = {"page": page, "per_page": per_page}
            if search:
                params["search"] = search
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.BASE_URL, 
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                
                data = response.json()
                jobs_data = data.get("data", [])
                links = data.get("links", {})
                
                jobs = []
                for job_data in jobs_data:
                    try:
                        job = self._normalize_job(job_data)
                        if job:
                            jobs.append(job)
                    except Exception as e:
                        self.logger.error(f"Error normalizing job: {e}")
                        continue
                
                # Check if there are more pages
                has_more = links.get("next") is not None
                
                self.logger.info(f"Successfully fetched {len(jobs)} jobs from Arbeitnow (has_more: {has_more})")
                return jobs, has_more
                
        except Exception as e:
            self.logger.error(f"Error fetching from Arbeitnow: {e}")
            raise
    
    async def fetch_all_jobs(
        self, 
        search: str = "", 
        max_pages: int = 5
    ) -> List[ArbeitnowJob]:
        """Fetch all jobs across multiple pages"""
        all_jobs = []
        page = 1
        
        while page <= max_pages:
            jobs, has_more = await self.fetch_jobs(search=search, page=page)
            all_jobs.extend(jobs)
            
            if not has_more or len(jobs) == 0:
                break
                
            page += 1
        
        self.logger.info(f"Total jobs fetched from Arbeitnow: {len(all_jobs)}")
        return all_jobs
    
    def _normalize_job(self, job_data: dict) -> Optional[ArbeitnowJob]:
        """Normalize Arbeitnow job data"""
        try:
            external_id = job_data.get("slug", "")
            title = job_data.get("title", "")
            company = job_data.get("company_name", "")
            
            if not external_id or not title:
                return None
            
            # Parse timestamp
            posted_at = None
            timestamp = job_data.get("created_at")
            if timestamp:
                try:
                    posted_at = datetime.fromtimestamp(timestamp)
                except:
                    pass
            
            # Extract remote status
            is_remote = job_data.get("remote", False)
            tags = job_data.get("tags", [])
            
            # If "Remote" is in tags, mark as remote
            if "Remote" in tags:
                is_remote = True
            
            return ArbeitnowJob(
                external_id=external_id,
                title=title.strip(),
                company=company.strip(),
                description=job_data.get("description", ""),
                location=job_data.get("location", ""),
                is_remote=is_remote,
                apply_url=job_data.get("url", ""),
                salary_min=None,  # Arbeitnow doesn't provide salary
                salary_max=None,
                tags=tags,
                job_types=job_data.get("job_types", []),
                posted_at=posted_at,
                raw_data=job_data
            )
            
        except Exception as e:
            self.logger.error(f"Error normalizing job data: {e}")
            return None


async def fetch_arbeitnow_jobs(search: str = "", max_pages: int = 5) -> List[ArbeitnowJob]:
    """Fetch jobs from Arbeitnow API"""
    client = ArbeitnowClient()
    return await client.fetch_all_jobs(search=search, max_pages=max_pages)
