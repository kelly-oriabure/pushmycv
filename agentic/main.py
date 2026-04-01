"""
Agentic WAT Framework - Main Entry Point

This module provides the main interface for the WAT (Workflow, Agentic, Tools) framework.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from agentic.core import (
    WorkflowEngine,
    WorkflowState,
    WorkflowStatus,
    WorkflowStep,
    WorkflowDefinition,
    AgentConfig,
    BaseAgent,
    PlanAndSolveAgent,
    ToolRegistry as CoreToolRegistry,
    register_workflow,
    get_workflow,
)

from agentic.tools import (
    ToolRegistry,
    ExtractResumeDataTool,
    AnalyzeATSScoreTool,
    AnalyzeContentQualityTool,
    ExtractSkillsTool,
    GenerateImprovementSuggestionsTool,
    RESUME_TOOLS,
)

from agentic.workflows import (
    ResumeAnalysisWorkflow,
    RESUME_ANALYSIS_WORKFLOW,
)

from agentic.models import (
    ResumeData,
    ResumeAnalysisResult,
    AnalysisScores,
    Suggestion,
    PersonalDetails,
    Education,
    Employment,
    Skill,
)

from agentic.llm import LLMClient, llm_chat

__version__ = "0.1.0"

__all__ = [
    # Core
    "WorkflowEngine",
    "WorkflowState",
    "WorkflowStatus",
    "WorkflowStep",
    "WorkflowDefinition",
    "AgentConfig",
    "BaseAgent",
    "PlanAndSolveAgent",
    "CoreToolRegistry",
    "register_workflow",
    "get_workflow",
    # Tools
    "ToolRegistry",
    "ExtractResumeDataTool",
    "AnalyzeATSScoreTool",
    "AnalyzeContentQualityTool",
    "ExtractSkillsTool",
    "GenerateImprovementSuggestionsTool",
    "RESUME_TOOLS",
    # Workflows
    "ResumeAnalysisWorkflow",
    "RESUME_ANALYSIS_WORKFLOW",
    # Models
    "ResumeData",
    "ResumeAnalysisResult",
    "AnalysisScores",
    "Suggestion",
    "PersonalDetails",
    "Education",
    "Employment",
    "Skill",
    # LLM
    "LLMClient",
    "llm_chat",
]


async def analyze_resume(
    raw_text: str,
    upload_id: str,
    user_id: str,
    job_title: str = None,
    job_description: str = None
) -> ResumeAnalysisResult:
    """
    Convenience function to analyze a resume.
    
    Args:
        raw_text: Extracted text from resume PDF/DOCX
        upload_id: Resume upload record ID
        user_id: User ID
        job_title: Optional target job title
        job_description: Optional target job description
    
    Returns:
        ResumeAnalysisResult with scores and suggestions
    """
    workflow = ResumeAnalysisWorkflow()
    return await workflow.analyze(
        raw_text=raw_text,
        upload_id=upload_id,
        user_id=user_id,
        job_title=job_title,
        job_description=job_description
    )
