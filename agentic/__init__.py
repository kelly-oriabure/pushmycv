"""
Agentic WAT (Workflow, Agentic, Tools) Framework
A Python framework for building AI agent workflows
"""

from .main import (
    # Core
    WorkflowEngine,
    WorkflowState,
    WorkflowStatus,
    WorkflowStep,
    WorkflowDefinition,
    AgentConfig,
    BaseAgent,
    PlanAndSolveAgent,
    CoreToolRegistry,
    register_workflow,
    get_workflow,
    # Tools
    ToolRegistry,
    ExtractResumeDataTool,
    AnalyzeATSScoreTool,
    AnalyzeContentQualityTool,
    ExtractSkillsTool,
    GenerateImprovementSuggestionsTool,
    RESUME_TOOLS,
    # Workflows
    ResumeAnalysisWorkflow,
    RESUME_ANALYSIS_WORKFLOW,
    # Models
    ResumeData,
    ResumeAnalysisResult,
    AnalysisScores,
    Suggestion,
    PersonalDetails,
    Education,
    Employment,
    Skill,
    # LLM
    LLMClient,
    llm_chat,
    # Convenience function
    analyze_resume,
)

__version__ = "0.1.0"

__all__ = [
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
    "ToolRegistry",
    "ExtractResumeDataTool",
    "AnalyzeATSScoreTool",
    "AnalyzeContentQualityTool",
    "ExtractSkillsTool",
    "GenerateImprovementSuggestionsTool",
    "RESUME_TOOLS",
    "ResumeAnalysisWorkflow",
    "RESUME_ANALYSIS_WORKFLOW",
    "ResumeData",
    "ResumeAnalysisResult",
    "AnalysisScores",
    "Suggestion",
    "PersonalDetails",
    "Education",
    "Employment",
    "Skill",
    "LLMClient",
    "llm_chat",
    "analyze_resume",
]
