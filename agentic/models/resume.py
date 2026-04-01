"""
Resume Pydantic Models - Matching TypeScript ResumeData structure
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PersonalDetails(BaseModel):
    """Personal details section"""
    job_title: str = ""
    photo_url: Optional[str] = None
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    city_state: str = ""
    country: str = ""


class Education(BaseModel):
    """Education entry"""
    id: Optional[str] = None
    db_id: Optional[str] = None
    school: str = ""
    degree: str = ""
    start_date: str = ""  # YYYY-MM
    end_date: str = ""    # YYYY-MM
    location: Optional[str] = None
    description: str = ""
    display_order: int = 0


class Employment(BaseModel):
    """Employment history entry"""
    id: Optional[str] = None
    db_id: Optional[str] = None
    job_title: str = ""
    employer: str = ""
    start_date: str = ""
    end_date: str = ""
    location: str = ""
    description: str = ""
    display_order: int = 0


class Skill(BaseModel):
    """Skill entry"""
    id: Optional[str] = None
    db_id: Optional[str] = None
    name: str = ""
    level: int = Field(default=50, ge=0, le=100)
    display_order: int = 0


class Language(BaseModel):
    """Language entry"""
    id: Optional[str] = None
    db_id: Optional[str] = None
    name: str = ""
    display_order: int = 0


class Reference(BaseModel):
    """Reference entry"""
    id: Optional[str] = None
    db_id: Optional[str] = None
    name: str = ""
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    display_order: int = 0


class Course(BaseModel):
    """Course entry"""
    id: Optional[str] = None
    db_id: Optional[str] = None
    course: str = ""
    institution: str = ""
    start_date: str = ""
    end_date: str = ""
    display_order: int = 0


class ReferencesSettings(BaseModel):
    """References settings"""
    hide_references: bool = True
    references: List[Reference] = Field(default_factory=list)


class ResumeData(BaseModel):
    """Complete resume data structure - mirrors TypeScript ResumeData"""
    personal_details: PersonalDetails = Field(default_factory=PersonalDetails)
    professional_summary: str = ""
    education: List[Education] = Field(default_factory=list)
    employment_history: List[Employment] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    languages: List[Language] = Field(default_factory=list)
    references: ReferencesSettings = Field(default_factory=ReferencesSettings)
    courses: List[Course] = Field(default_factory=list)
    internships: List[Any] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True


class ResumeUpload(BaseModel):
    """Resume upload record from database"""
    id: str
    user_id: str
    resume_id: Optional[str] = None
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    resume_url: str
    pdf_url: str
    extracted_text: str = ""
    extracted_email: Optional[str] = None
    extracted_phone: Optional[str] = None
    content_hash: Optional[str] = None
    email_hash: Optional[str] = None
    phone_hash: Optional[str] = None
    composite_hash: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AnalysisScores(BaseModel):
    """Individual scoring breakdown"""
    overall_score: int = Field(ge=0, le=100)
    ats_score: int = Field(ge=0, le=100)
    tone_score: int = Field(ge=0, le=100)
    content_score: int = Field(ge=0, le=100)
    structure_score: int = Field(ge=0, le=100)
    skills_score: int = Field(ge=0, le=100)
    email_score: int = Field(ge=0, le=100)


class Suggestion(BaseModel):
    """Individual suggestion"""
    section: str
    priority: str = Field(pattern="^(high|medium|low)$")
    issue: str
    recommendation: str
    example: Optional[str] = None


class ResumeAnalysisResult(BaseModel):
    """Complete resume analysis result"""
    upload_id: str
    user_id: str
    job_title: Optional[str] = None
    scores: AnalysisScores
    suggestions: List[Suggestion]
    strengths: List[str]
    weaknesses: List[str]
    skill_gaps: List[str] = Field(default_factory=list)
    keywords_found: List[str] = Field(default_factory=list)
    keywords_missing: List[str] = Field(default_factory=list)
    ats_compatible: bool = True
    summary: str = ""
    status: str = "completed"
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ResumeEnhancement(BaseModel):
    """Resume enhancement suggestions"""
    original_section: str
    enhanced_version: str
    changes_made: List[str]
    reasoning: str


class JobMatch(BaseModel):
    """Job matching result"""
    job_id: str
    resume_id: str
    match_score: int = Field(ge=0, le=100)
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    ai_analysis: str = ""
    recommendation: str = ""
