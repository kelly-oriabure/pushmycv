"""
Supabase Integration for WAT Framework
Uses Pushmycv-fastify database for workflow state and queue
"""

import os
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("Supabase package not installed. Database features disabled.")

logger = logging.getLogger(__name__)


class SupabaseStorage:
    """
    Supabase storage backend for workflow state persistence.
    Uses the Pushmycv-fastify database (queue_jobs table).
    """
    
    def __init__(
        self,
        url: Optional[str] = None,
        key: Optional[str] = None
    ):
        self.url = url or os.getenv("FASTIFY_SUPABASE_URL")
        self.key = key or os.getenv("FASTIFY_SUPABASE_KEY")
        self._client: Optional[Any] = None
        
        if not SUPABASE_AVAILABLE:
            logger.error("Supabase package not installed")
            return
        
        if not self.url or not self.key:
            logger.error("Supabase URL or key not provided")
            return
        
        try:
            self._client = create_client(self.url, self.key)
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
    
    @property
    def client(self) -> Optional[Any]:
        """Get Supabase client"""
        return self._client
    
    async def save_workflow_state(
        self,
        workflow_id: str,
        state: Dict[str, Any],
        table: str = "queue_jobs"
    ) -> bool:
        """Save workflow state to Supabase"""
        if not self._client:
            logger.warning("Supabase client not available")
            return False
        
        try:
            # Use queue_jobs table for workflow tracking
            data = {
                "type": f"wat_workflow_{state.get('status', 'unknown')}",
                "payload": {
                    "workflow_id": workflow_id,
                    "state": state,
                    "timestamp": datetime.utcnow().isoformat()
                },
                "status": state.get("status", "pending"),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = self._client.table(table).insert(data).execute()
            logger.debug(f"Saved workflow state for {workflow_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save workflow state: {e}")
            return False
    
    async def load_workflow_state(
        self,
        workflow_id: str,
        table: str = "queue_jobs"
    ) -> Optional[Dict[str, Any]]:
        """Load workflow state from Supabase"""
        if not self._client:
            return None
        
        try:
            result = (
                self._client.table(table)
                .select("*")
                .eq("payload->>workflow_id", workflow_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if result.data:
                return result.data[0]["payload"]["state"]
            return None
            
        except Exception as e:
            logger.error(f"Failed to load workflow state: {e}")
            return None
    
    async def update_workflow_status(
        self,
        workflow_id: str,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        table: str = "queue_jobs"
    ) -> bool:
        """Update workflow status"""
        if not self._client:
            return False
        
        try:
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if result:
                update_data["result"] = result
            
            self._client.table(table).update(update_data).eq(
                "payload->>workflow_id", workflow_id
            ).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update workflow status: {e}")
            return False
    
    async def list_active_workflows(
        self,
        table: str = "queue_jobs"
    ) -> List[Dict[str, Any]]:
        """List all active workflows"""
        if not self._client:
            return []
        
        try:
            result = (
                self._client.table(table)
                .select("*")
                .in_("status", ["pending", "running"])
                .execute()
            )
            return result.data or []
            
        except Exception as e:
            logger.error(f"Failed to list workflows: {e}")
            return []


class DualDatabaseClient:
    """
    Client for accessing both databases:
    - Jobeazy DB: Read resume data
    - Fastify DB: Write workflow results
    """
    
    def __init__(
        self,
        jobeazy_url: Optional[str] = None,
        jobeazy_key: Optional[str] = None,
        fastify_url: Optional[str] = None,
        fastify_key: Optional[str] = None
    ):
        self.jobeazy_url = jobeazy_url or os.getenv("SUPABASE_URL")
        self.jobeazy_key = jobeazy_key or os.getenv("SUPABASE_KEY")
        self.fastify_url = fastify_url or os.getenv("FASTIFY_SUPABASE_URL")
        self.fastify_key = fastify_key or os.getenv("FASTIFY_SUPABASE_KEY")
        
        self._jobeazy: Optional[Any] = None
        self._fastify: Optional[Any] = None
    
    def connect(self) -> bool:
        """Initialize both database connections"""
        if not SUPABASE_AVAILABLE:
            logger.error("Supabase package not installed")
            return False
        
        success = True
        
        # Connect to Jobeazy DB (read-only for resumes)
        if self.jobeazy_url and self.jobeazy_key:
            try:
                self._jobeazy = create_client(self.jobeazy_url, self.jobeazy_key)
                logger.info("Connected to Jobeazy database")
            except Exception as e:
                logger.error(f"Failed to connect to Jobeazy DB: {e}")
                success = False
        
        # Connect to Fastify DB (for workflow state)
        if self.fastify_url and self.fastify_key:
            try:
                self._fastify = create_client(self.fastify_url, self.fastify_key)
                logger.info("Connected to Fastify database")
            except Exception as e:
                logger.error(f"Failed to connect to Fastify DB: {e}")
                success = False
        
        return success
    
    @property
    def jobeazy(self) -> Optional[Any]:
        """Get Jobeazy client (for reading resume data)"""
        return self._jobeazy
    
    @property
    def fastify(self) -> Optional[Any]:
        """Get Fastify client (for workflow state)"""
        return self._fastify
    
    async def fetch_resume_upload(
        self,
        upload_id: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch resume upload from Jobeazy DB"""
        if not self._jobeazy:
            logger.error("Jobeazy client not available")
            return None
        
        try:
            result = (
                self._jobeazy.table("resume_uploads")
                .select("*")
                .eq("id", upload_id)
                .single()
                .execute()
            )
            return result.data
            
        except Exception as e:
            logger.error(f"Failed to fetch resume upload: {e}")
            return None
    
    async def save_analysis_result(
        self,
        analysis: Dict[str, Any],
        table: str = "job_matches"  # Use job_matches for AI analysis
    ) -> bool:
        """Save analysis result to Fastify DB"""
        if not self._fastify:
            logger.error("Fastify client not available")
            return False
        
        try:
            # Map ResumeAnalysisResult to job_matches schema
            data = {
                "user_id": analysis.get("user_id"),
                "match_score": analysis.get("scores", {}).get("overall_score", 0),
                "matching_skills": analysis.get("keywords_found", []),
                "missing_skills": analysis.get("keywords_missing", []),
                "ai_analysis": analysis.get("summary", ""),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self._fastify.table(table).insert(data).execute()
            logger.info(f"Saved analysis result for user {analysis.get('user_id')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save analysis result: {e}")
            return False


# Singleton instances
_supabase_storage: Optional[SupabaseStorage] = None
_dual_client: Optional[DualDatabaseClient] = None


def get_supabase_storage() -> Optional[SupabaseStorage]:
    """Get or create Supabase storage instance"""
    global _supabase_storage
    if _supabase_storage is None:
        _supabase_storage = SupabaseStorage()
    return _supabase_storage


def get_dual_client() -> Optional[DualDatabaseClient]:
    """Get or create dual database client"""
    global _dual_client
    if _dual_client is None:
        _dual_client = DualDatabaseClient()
        _dual_client.connect()
    return _dual_client


def get_supabase_client() -> Optional[Any]:
    """Get Fastify Supabase client for database operations"""
    dual_client = get_dual_client()
    if dual_client:
        return dual_client.fastify
    return None
