"""
Job Board API Client for RemoteOK
"""
import logging
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RemoteOKJob:
    """Normalized job posting from RemoteOK"""
    source: str = "remoteok"
    external_id: str = ""
    title: str = ""
    company: str = ""
    description: str = ""
    location: str = ""
    is_remote: bool = True
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


class RemoteOKClient:
    """Client for fetching jobs from RemoteOK API"""
    
    BASE_URL = "https://remoteok.com/api"
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def fetch_jobs(self, limit: int = 100) -> List[RemoteOKJob]:
        """Fetch jobs from RemoteOK API"""
        import httpx
        
        try:
            self.logger.info(f"Fetching jobs from RemoteOK API (limit: {limit})")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(self.BASE_URL, timeout=30.0)
                response.raise_for_status()
                
                data = response.json()
                
                if not data or len(data) < 2:
                    self.logger.warning("No jobs found in RemoteOK response")
                    return []
                
                jobs_data = data[1:] if isinstance(data, list) else []
                jobs = []
                
                for job_data in jobs_data[:limit]:
                    try:
                        job = self._normalize_job(job_data)
                        if job:
                            jobs.append(job)
                    except Exception as e:
                        self.logger.error(f"Error normalizing job: {e}")
                        continue
                
                self.logger.info(f"Successfully fetched {len(jobs)} jobs from RemoteOK")
                return jobs
                
        except Exception as e:
            self.logger.error(f"Error fetching from RemoteOK: {e}")
            raise
    
    def _normalize_job(self, job_data: dict) -> Optional[RemoteOKJob]:
        """Normalize RemoteOK job data"""
        try:
            external_id = job_data.get("id", "")
            title = job_data.get("position", "")
            company = job_data.get("company", "")
            
            if not external_id or not title or not company:
                return None
            
            posted_at = None
            date_str = job_data.get("date")
            if date_str:
                try:
                    posted_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except:
                    pass
            
            salary_min = job_data.get("salary_min") or None
            salary_max = job_data.get("salary_max") or None
            
            if salary_min == 0:
                salary_min = None
            if salary_max == 0:
                salary_max = None
            
            return RemoteOKJob(
                external_id=str(external_id),
                title=title.strip(),
                company=company.strip(),
                description=job_data.get("description", ""),
                location=job_data.get("location", ""),
                is_remote=True,
                apply_url=job_data.get("apply_url", ""),
                salary_min=salary_min,
                salary_max=salary_max,
                tags=job_data.get("tags", []),
                job_types=["remote"],
                posted_at=posted_at,
                raw_data=job_data
            )
            
        except Exception as e:
            self.logger.error(f"Error normalizing job data: {e}")
            return None


async def fetch_remoteok_jobs(limit: int = 100) -> List[RemoteOKJob]:
    """Fetch jobs from RemoteOK API"""
    client = RemoteOKClient()
    return await client.fetch_jobs(limit)
