"""
Resume Analysis Workflow
First agentic workflow - analyzes resumes and provides comprehensive feedback
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from ..core.workflow import WorkflowEngine, WorkflowDefinition, WorkflowStep
from ..core.agent import PlanAndSolveAgent, AgentConfig
from ..core.types import WorkflowState
from ..tools.registry import ToolRegistry
from ..tools.resume_tools import RESUME_TOOLS
from ..models.resume import ResumeAnalysisResult, AnalysisScores, Suggestion
from ..llm.client import LLMClient

logger = logging.getLogger(__name__)


async def step_parse_resume(context: Dict[str, Any]) -> Dict[str, Any]:
    """Step 1: Parse raw resume text into structured data"""
    raw_text = context.get("raw_text", "")
    upload_id = context.get("upload_id")
    
    logger.info(f"Parsing resume text for upload {upload_id}")
    
    if not raw_text:
        return {"error": "No resume text provided", "resume_data": None}
    
    # Use LLM to extract structured data
    from ..tools.resume_tools import ExtractResumeDataTool
    tool = ExtractResumeDataTool()
    resume_data = await tool.execute({"raw_text": raw_text})
    
    return {
        "resume_data": resume_data.model_dump(),
        "upload_id": upload_id,
        "parsed_at": datetime.utcnow().isoformat()
    }


async def step_analyze_ats(context: Dict[str, Any]) -> Dict[str, Any]:
    """Step 2: Analyze ATS compatibility"""
    resume_data = context.get("step_parse_resume", {}).get("resume_data")
    job_description = context.get("job_description", "")
    
    if not resume_data:
        return {"error": "No resume data available", "ats_score": 0}
    
    logger.info("Analyzing ATS compatibility")
    
    from ..tools.resume_tools import AnalyzeATSScoreTool
    tool = AnalyzeATSScoreTool()
    result = await tool.execute({
        "resume_data": resume_data,
        "job_description": job_description
    })
    
    return {
        "ats_score": result.get("score", 0),
        "ats_compatible": result.get("compatible", False),
        "keywords_found": result.get("keywords_found", []),
        "keywords_missing": result.get("keywords_missing", []),
        "ats_issues": result.get("issues", []),
        "ats_suggestions": result.get("suggestions", [])
    }


async def step_analyze_content(context: Dict[str, Any]) -> Dict[str, Any]:
    """Step 3: Analyze content quality, tone, and structure"""
    resume_data = context.get("step_parse_resume", {}).get("resume_data")
    
    if not resume_data:
        return {"error": "No resume data available"}
    
    logger.info("Analyzing content quality")
    
    from ..tools.resume_tools import AnalyzeContentQualityTool
    tool = AnalyzeContentQualityTool()
    result = await tool.execute({"resume_data": resume_data})
    
    return {
        "content_score": result.get("content_score", 0),
        "tone_score": result.get("tone_score", 0),
        "structure_score": result.get("structure_score", 0),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "content_suggestions": result.get("suggestions", [])
    }


async def step_extract_skills(context: Dict[str, Any]) -> Dict[str, Any]:
    """Step 4: Extract and analyze skills"""
    raw_text = context.get("raw_text", "")
    
    logger.info("Extracting skills from resume")
    
    from ..tools.resume_tools import ExtractSkillsTool
    tool = ExtractSkillsTool()
    skills = await tool.execute({"raw_text": raw_text})
    
    # Calculate skills score based on number and variety
    skills_score = min(100, len(skills) * 10 + 20) if skills else 30
    
    return {
        "skills": [s.model_dump() for s in skills],
        "skills_count": len(skills),
        "skills_score": skills_score
    }


async def step_agentic_analysis(context: Dict[str, Any]) -> Dict[str, Any]:
    """Step 5: Use agent for comprehensive analysis"""
    resume_data = context.get("step_parse_resume", {}).get("resume_data")
    ats_results = context.get("step_analyze_ats", {})
    content_results = context.get("step_analyze_content", {})
    skills_results = context.get("step_extract_skills", {})
    
    if not resume_data:
        return {"error": "No resume data for agent analysis"}
    
    logger.info("Running agentic analysis")
    
    # Set up agent with resume tools
    tool_registry = ToolRegistry()
    for tool in RESUME_TOOLS:
        tool_registry.register(tool)
    
    config = AgentConfig(
        name="ResumeAnalyzer",
        model="gpt-4",
        temperature=0.5,
        system_prompt="""You are an expert resume reviewer with 15+ years of experience in HR and recruitment.
Analyze the provided resume data and provide comprehensive feedback.
Be thorough but constructive in your analysis.""",
        max_iterations=5
    )
    
    agent = PlanAndSolveAgent(config=config, tool_registry=tool_registry)
    
    task = f"""Analyze this resume comprehensively:

Resume Data: {resume_data}

Previous Analysis:
- ATS Score: {ats_results.get('ats_score', 'N/A')}
- Content Score: {content_results.get('content_score', 'N/A')}
- Structure Score: {content_results.get('structure_score', 'N/A')}
- Tone Score: {content_results.get('tone_score', 'N/A')}
- Skills Count: {skills_results.get('skills_count', 0)}

Provide:
1. Overall assessment
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Specific, actionable recommendations
5. Final summary"""

    result = await agent.run(task)
    
    return {
        "agent_analysis": result.get("final_answer", ""),
        "plan": result.get("plan", []),
        "agent_iterations": result.get("iterations", 0)
    }


async def step_generate_recommendations(context: Dict[str, Any]) -> Dict[str, Any]:
    """Step 6: Generate final recommendations"""
    resume_data = context.get("step_parse_resume", {}).get("resume_data")
    content_results = context.get("step_analyze_content", {})
    ats_results = context.get("step_analyze_ats", {})
    
    if not resume_data:
        return {"error": "No resume data available"}
    
    logger.info("Generating improvement recommendations")
    
    from ..tools.resume_tools import GenerateImprovementSuggestionsTool
    tool = GenerateImprovementSuggestionsTool()
    
    analysis_results = {
        "content": content_results,
        "ats": ats_results
    }
    
    suggestions = await tool.execute({
        "resume_data": resume_data,
        "analysis_results": analysis_results
    })
    
    return {
        "suggestions": [s.model_dump() for s in suggestions]
    }


async def step_compile_results(context: Dict[str, Any]) -> ResumeAnalysisResult:
    """Step 7: Compile all analysis results into final report"""
    upload_id = context.get("upload_id")
    user_id = context.get("user_id")
    job_title = context.get("job_title")
    
    # Get results from previous steps
    ats_results = context.get("step_analyze_ats", {})
    content_results = context.get("step_analyze_content", {})
    skills_results = context.get("step_extract_skills", {})
    agent_results = context.get("step_agentic_analysis", {})
    recommendations = context.get("step_generate_recommendations", {})
    
    # Calculate overall score (weighted average)
    ats_score = ats_results.get("ats_score", 0)
    content_score = content_results.get("content_score", 0)
    tone_score = content_results.get("tone_score", 0)
    structure_score = content_results.get("structure_score", 0)
    skills_score = skills_results.get("skills_score", 0)
    
    overall_score = int(
        ats_score * 0.25 +
        content_score * 0.25 +
        tone_score * 0.15 +
        structure_score * 0.15 +
        skills_score * 0.10 +
        10  # Base score
    )
    
    scores = AnalysisScores(
        overall_score=min(100, overall_score),
        ats_score=ats_score,
        tone_score=tone_score,
        content_score=content_score,
        structure_score=structure_score,
        skills_score=skills_score,
        email_score=80  # Assume good unless detected otherwise
    )
    
    # Combine all suggestions
    all_suggestions = []
    
    # Add ATS suggestions
    for sugg in ats_results.get("ats_suggestions", []):
        all_suggestions.append(Suggestion(
            section="ATS Compatibility",
            priority="high",
            issue=sugg,
            recommendation="Fix ATS compatibility issue"
        ))
    
    # Add content suggestions
    for sugg in content_results.get("content_suggestions", []):
        if isinstance(sugg, dict):
            all_suggestions.append(Suggestion(
                section=sugg.get("section", "Content"),
                priority=sugg.get("priority", "medium"),
                issue=sugg.get("issue", ""),
                recommendation=sugg.get("recommendation", "")
            ))
    
    # Add generated recommendations
    for sugg_data in recommendations.get("suggestions", []):
        if isinstance(sugg_data, dict):
            all_suggestions.append(Suggestion(**sugg_data))
    
    # Compile strengths and weaknesses
    strengths = content_results.get("strengths", [])
    weaknesses = content_results.get("weaknesses", [])
    
    # Add agent insights if available
    agent_analysis = agent_results.get("agent_analysis", "")
    
    summary = f"""Resume Analysis Summary:
Overall Score: {scores.overall_score}/100

ATS Compatibility: {scores.ats_score}/100
Content Quality: {scores.content_score}/100
Tone & Style: {scores.tone_score}/100
Structure: {scores.structure_score}/100
Skills Match: {scores.skills_score}/100

Key Findings:
- {len(strengths)} strengths identified
- {len(weaknesses)} areas for improvement
- {len(all_suggestions)} actionable suggestions

{agent_analysis[:500] if agent_analysis else ""}"""

    result = ResumeAnalysisResult(
        upload_id=upload_id,
        user_id=user_id,
        job_title=job_title,
        scores=scores,
        suggestions=all_suggestions[:10],  # Limit to top 10
        strengths=strengths[:5],
        weaknesses=weaknesses[:5],
        skill_gaps=ats_results.get("keywords_missing", []),
        keywords_found=ats_results.get("keywords_found", []),
        keywords_missing=ats_results.get("keywords_missing", []),
        ats_compatible=ats_results.get("ats_compatible", False),
        summary=summary,
        status="completed"
    )
    
    logger.info(f"Resume analysis completed for upload {upload_id}")
    
    return result


# Define the complete resume analysis workflow
RESUME_ANALYSIS_WORKFLOW = WorkflowDefinition(
    name="resume_analysis",
    description="Comprehensive resume analysis using AI agents and tools",
    version="1.0.0",
    steps=[
        WorkflowStep(
            name="parse_resume",
            description="Parse raw resume text into structured data",
            executor=step_parse_resume,
            retry_count=2
        ),
        WorkflowStep(
            name="analyze_ats",
            description="Analyze ATS compatibility",
            executor=step_analyze_ats,
            retry_count=2
        ),
        WorkflowStep(
            name="analyze_content",
            description="Analyze content quality, tone, and structure",
            executor=step_analyze_content,
            retry_count=2
        ),
        WorkflowStep(
            name="extract_skills",
            description="Extract and analyze skills",
            executor=step_extract_skills,
            retry_count=2
        ),
        WorkflowStep(
            name="agentic_analysis",
            description="Use AI agent for comprehensive analysis",
            executor=step_agentic_analysis,
            retry_count=1
        ),
        WorkflowStep(
            name="generate_recommendations",
            description="Generate improvement recommendations",
            executor=step_generate_recommendations,
            retry_count=2
        ),
        WorkflowStep(
            name="compile_results",
            description="Compile all results into final report",
            executor=step_compile_results,
            retry_count=1
        )
    ]
)


class ResumeAnalysisWorkflow:
    """Convenience class for running resume analysis workflows"""
    
    def __init__(self, checkpoint_storage=None):
        self.engine = WorkflowEngine(
            workflow_def=RESUME_ANALYSIS_WORKFLOW,
            checkpoint_storage=checkpoint_storage
        )
    
    async def analyze(
        self,
        raw_text: str,
        upload_id: str,
        user_id: str,
        job_title: str = None,
        job_description: str = None
    ) -> ResumeAnalysisResult:
        """
        Run complete resume analysis
        
        Args:
            raw_text: Extracted text from resume
            upload_id: Resume upload ID
            user_id: User ID
            job_title: Optional target job title
            job_description: Optional target job description
        
        Returns:
            ResumeAnalysisResult with all scores and suggestions
        """
        # Create workflow instance
        state = await self.engine.create_workflow(
            initial_context={
                "raw_text": raw_text,
                "upload_id": upload_id,
                "user_id": user_id,
                "job_title": job_title,
                "job_description": job_description
            }
        )
        
        # Run workflow
        final_state = await self.engine.run(state.workflow_id)
        
        # Return compiled results
        if final_state.result and "step_compile_results" in final_state.result:
            return final_state.result["step_compile_results"]
        else:
            # Return error result
            return ResumeAnalysisResult(
                upload_id=upload_id,
                user_id=user_id,
                job_title=job_title,
                scores=AnalysisScores(
                    overall_score=0,
                    ats_score=0,
                    tone_score=0,
                    content_score=0,
                    structure_score=0,
                    skills_score=0,
                    email_score=0
                ),
                suggestions=[Suggestion(
                    section="general",
                    priority="high",
                    issue="Workflow failed to complete",
                    recommendation="Please try again or contact support"
                )],
                strengths=[],
                weaknesses=["Analysis failed"],
                summary="Resume analysis could not be completed.",
                status="failed",
                error_message=final_state.error_message or "Unknown error"
            )
    
    async def get_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get current workflow status"""
        state = self.engine.get_state(workflow_id)
        if state:
            return {
                "workflow_id": state.workflow_id,
                "status": state.status.value,
                "current_step": state.current_step,
                "total_steps": len(RESUME_ANALYSIS_WORKFLOW.steps),
                "error": state.error_message
            }
        return {"error": "Workflow not found"}
