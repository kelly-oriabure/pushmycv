"""
Resume Analysis Tools
Tools for analyzing and extracting information from resumes
"""

import re
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from .base import ResumeTool, TextTool, AnalysisTool
from ..models.resume import (
    ResumeData, PersonalDetails, Education, Employment, Skill,
    Language, Reference, ResumeAnalysisResult, AnalysisScores, Suggestion
)
from ..llm.client import llm_chat

logger = logging.getLogger(__name__)


class ExtractResumeDataTool(ResumeTool[ResumeData]):
    """Extract structured resume data from raw text using LLM"""
    
    def __init__(self):
        super().__init__(
            name="extract_resume_data",
            description="Extract structured resume data (personal details, education, experience, skills) from raw text"
        )
        self._definition.parameters = {
            "type": "object",
            "properties": {
                "raw_text": {
                    "type": "string",
                    "description": "Raw text extracted from resume PDF/DOCX"
                }
            },
            "required": ["raw_text"]
        }
    
    async def execute(self, params: Dict[str, Any]) -> ResumeData:
        raw_text = params.get("raw_text", "")
        
        if not raw_text:
            logger.warning("Empty raw text provided to extract_resume_data")
            return ResumeData()
        
        system_prompt = """You are a resume parsing expert. Extract structured information from the provided resume text.
Respond ONLY with valid JSON matching this structure:
{
    "personal_details": {
        "job_title": "",
        "first_name": "",
        "last_name": "",
        "email": "",
        "phone": "",
        "address": "",
        "city_state": "",
        "country": ""
    },
    "professional_summary": "",
    "education": [
        {"school": "", "degree": "", "start_date": "", "end_date": "", "location": "", "description": ""}
    ],
    "employment_history": [
        {"job_title": "", "employer": "", "start_date": "", "end_date": "", "location": "", "description": ""}
    ],
    "skills": [
        {"name": "", "level": 50}
    ],
    "languages": [
        {"name": ""}
    ]
}

Extract as much accurate information as possible. Use empty strings for missing data."""

        try:
            response = await llm_chat(
                prompt=f"Extract resume data from this text:\n\n{raw_text[:8000]}",  # Limit text length
                system_prompt=system_prompt,
                model="gpt-4",
                temperature=0.3,
                max_tokens=2000
            )
            
            import json
            data = json.loads(response)
            return ResumeData(**data)
            
        except Exception as e:
            logger.error(f"Failed to extract resume data: {e}")
            return ResumeData()


class AnalyzeATSScoreTool(AnalysisTool[Dict[str, Any]]):
    """Analyze ATS (Applicant Tracking System) compatibility"""
    
    def __init__(self):
        super().__init__(
            name="analyze_ats_score",
            description="Analyze resume for ATS compatibility and provide score and suggestions"
        )
        self._definition.parameters = {
            "type": "object",
            "properties": {
                "resume_data": {
                    "type": "object",
                    "description": "Structured resume data"
                },
                "job_description": {
                    "type": "string",
                    "description": "Target job description (optional)"
                }
            },
            "required": ["resume_data"]
        }
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        resume_data = params.get("resume_data", {})
        job_description = params.get("job_description", "")
        
        system_prompt = """You are an ATS (Applicant Tracking System) expert. Analyze the resume for ATS compatibility.
Consider:
1. Standard section headers
2. Keyword density and relevance
3. Formatting issues
4. Contact information completeness
5. Skills matching

Respond with JSON:
{
    "score": 0-100,
    "issues": ["list of issues"],
    "suggestions": ["specific improvement suggestions"],
    "keywords_found": ["keywords present"],
    "keywords_missing": ["important missing keywords"],
    "compatible": true/false
}"""

        prompt = f"Resume data: {resume_data}\n"
        if job_description:
            prompt += f"\nTarget job description: {job_description}"
        
        try:
            response = await llm_chat(
                prompt=prompt,
                system_prompt=system_prompt,
                model="gpt-4",
                temperature=0.4,
                max_tokens=1500
            )
            
            import json
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"ATS analysis failed: {e}")
            return {
                "score": 50,
                "issues": ["Analysis failed"],
                "suggestions": ["Please try again"],
                "keywords_found": [],
                "keywords_missing": [],
                "compatible": False
            }


class AnalyzeContentQualityTool(AnalysisTool[Dict[str, Any]]):
    """Analyze resume content quality"""
    
    def __init__(self):
        super().__init__(
            name="analyze_content_quality",
            description="Analyze resume content quality, tone, and effectiveness"
        )
        self._definition.parameters = {
            "type": "object",
            "properties": {
                "resume_data": {
                    "type": "object",
                    "description": "Structured resume data"
                }
            },
            "required": ["resume_data"]
        }
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        resume_data = params.get("resume_data", {})
        
        system_prompt = """Analyze resume content quality. Consider:
1. Use of action verbs
2. Quantifiable achievements
3. Clarity and conciseness
4. Professional tone
5. Relevance of information
6. Grammar and spelling

Respond with JSON:
{
    "content_score": 0-100,
    "tone_score": 0-100,
    "structure_score": 0-100,
    "strengths": ["what's good"],
    "weaknesses": ["what needs improvement"],
    "suggestions": [
        {"section": "section name", "priority": "high/medium/low", "issue": "description", "recommendation": "how to fix"}
    ]
}"""

        try:
            response = await llm_chat(
                prompt=f"Analyze this resume:\n{resume_data}",
                system_prompt=system_prompt,
                model="gpt-4",
                temperature=0.4,
                max_tokens=1500
            )
            
            import json
            return json.loads(response)
            
        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            return {
                "content_score": 50,
                "tone_score": 50,
                "structure_score": 50,
                "strengths": [],
                "weaknesses": ["Analysis failed"],
                "suggestions": []
            }


class ExtractSkillsTool(ResumeTool[List[Skill]]):
    """Extract and normalize skills from resume text"""
    
    def __init__(self):
        super().__init__(
            name="extract_skills",
            description="Extract technical and soft skills from resume with proficiency levels"
        )
        self._definition.parameters = {
            "type": "object",
            "properties": {
                "raw_text": {
                    "type": "string",
                    "description": "Raw resume text"
                },
                "existing_skills": {
                    "type": "array",
                    "description": "Already extracted skills"
                }
            },
            "required": ["raw_text"]
        }
    
    async def execute(self, params: Dict[str, Any]) -> List[Skill]:
        raw_text = params.get("raw_text", "")
        
        # Common technical skills pattern
        tech_skills = [
            "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby",
            "React", "Vue", "Angular", "Node.js", "Express", "Django", "Flask", "FastAPI",
            "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
            "Git", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
            "Machine Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
            "REST API", "GraphQL", "gRPC", "WebSocket",
            "Linux", "Bash", "PowerShell",
            "Agile", "Scrum", "Kanban", "Jira", "Confluence"
        ]
        
        found_skills = []
        text_lower = raw_text.lower()
        
        for skill in tech_skills:
            # Check for skill mentions
            patterns = [
                rf'\b{re.escape(skill.lower())}\b',
                rf'\b{re.escape(skill.lower().replace(".", ""))}\b',
            ]
            
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    # Determine proficiency level based on context
                    level = self._estimate_proficiency(raw_text, skill)
                    found_skills.append(Skill(name=skill, level=level))
                    break
        
        return found_skills
    
    def _estimate_proficiency(self, text: str, skill: str) -> int:
        """Estimate skill proficiency level based on context"""
        text_lower = text.lower()
        skill_lower = skill.lower()
        
        # Advanced indicators
        advanced = ["expert", "advanced", "senior", "5+ years", "6+ years", "7+ years", "extensive"]
        # Intermediate indicators
        intermediate = ["intermediate", "3+ years", "4+ years", "proficient", "experienced"]
        # Beginner indicators
        beginner = ["beginner", "basic", "familiar", "1+ years", "2+ years", "some experience"]
        
        # Find context around skill mention
        skill_pos = text_lower.find(skill_lower)
        if skill_pos == -1:
            return 50
        
        # Get surrounding text (100 chars before and after)
        start = max(0, skill_pos - 100)
        end = min(len(text_lower), skill_pos + len(skill_lower) + 100)
        context = text_lower[start:end]
        
        if any(ind in context for ind in advanced):
            return 90
        elif any(ind in context for ind in intermediate):
            return 70
        elif any(ind in context for ind in beginner):
            return 40
        
        return 50


class GenerateImprovementSuggestionsTool(TextTool[List[Suggestion]]):
    """Generate specific improvement suggestions for a resume"""
    
    def __init__(self):
        super().__init__(
            name="generate_improvements",
            description="Generate specific, actionable suggestions to improve a resume"
        )
        self._definition.parameters = {
            "type": "object",
            "properties": {
                "resume_data": {
                    "type": "object",
                    "description": "Structured resume data"
                },
                "analysis_results": {
                    "type": "object",
                    "description": "Previous analysis results"
                }
            },
            "required": ["resume_data"]
        }
    
    async def execute(self, params: Dict[str, Any]) -> List[Suggestion]:
        resume_data = params.get("resume_data", {})
        analysis_results = params.get("analysis_results", {})
        
        system_prompt = """Generate specific, actionable resume improvement suggestions.
Each suggestion should include:
- section: Which part of the resume
- priority: high/medium/low
- issue: What's wrong
- recommendation: How to fix it (with specific example if possible)

Respond with JSON array of suggestions."""

        try:
            response = await llm_chat(
                prompt=f"Generate improvements for this resume:\n{resume_data}\n\nAnalysis: {analysis_results}",
                system_prompt=system_prompt,
                model="gpt-4",
                temperature=0.5,
                max_tokens=1500
            )
            
            import json
            suggestions_data = json.loads(response)
            
            suggestions = []
            for sugg in suggestions_data:
                suggestions.append(Suggestion(
                    section=sugg.get("section", "general"),
                    priority=sugg.get("priority", "medium"),
                    issue=sugg.get("issue", ""),
                    recommendation=sugg.get("recommendation", ""),
                    example=sugg.get("example")
                ))
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            return [Suggestion(
                section="general",
                priority="medium",
                issue="Could not generate detailed suggestions",
                recommendation="Please review your resume manually"
            )]


# Tool registry for resume tools
RESUME_TOOLS = [
    ExtractResumeDataTool(),
    AnalyzeATSScoreTool(),
    AnalyzeContentQualityTool(),
    ExtractSkillsTool(),
    GenerateImprovementSuggestionsTool()
]
