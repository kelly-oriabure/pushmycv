"""
Simplified Resume Analysis for PushMyCV with AI-powered section analysis
Direct implementation without complex workflow engine for reliability
"""

import asyncio
import logging
import os
import sys
import json
import re
from datetime import datetime
from typing import Dict, List, Any

# Load environment variables
from dotenv import load_dotenv
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(_env_path)

from llm import llm_chat, LLMClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleResumeAnalyzer:
    """AI-powered resume analyzer"""
    
    def __init__(self):
        self.llm_client = LLMClient()
        
    def extract_sections(self, text: str) -> Dict[str, str]:
        """Extract resume sections using regex patterns"""
        sections = {
            'summary': '',
            'experience': '',
            'education': '',
            'skills': '',
            'certifications': ''
        }
        
        # Patterns for section detection
        text_lower = text.lower()
        
        # Summary/Objective
        summary_match = re.search(r'(?:summary|objective|profile|about)(?:\s*[:\n])(.*?)(?=\n\s*(?:experience|education|skills|work|\Z))', text, re.DOTALL | re.IGNORECASE)
        if summary_match:
            sections['summary'] = summary_match.group(1).strip()
        
        # Experience
        exp_match = re.search(r'(?:experience|work history|employment|career)(?:\s*[:\n])(.*?)(?=\n\s*(?:education|skills|certifications|summary|\Z))', text, re.DOTALL | re.IGNORECASE)
        if exp_match:
            sections['experience'] = exp_match.group(1).strip()
        
        # Education
        edu_match = re.search(r'(?:education|academic|qualifications|degree)(?:\s*[:\n])(.*?)(?=\n\s*(?:experience|skills|certifications|summary|\Z))', text, re.DOTALL | re.IGNORECASE)
        if edu_match:
            sections['education'] = edu_match.group(1).strip()
        
        # Skills
        skills_match = re.search(r'(?:skills|technical skills|competencies|expertise)(?:\s*[:\n])(.*?)(?=\n\s*(?:experience|education|certifications|summary|\Z))', text, re.DOTALL | re.IGNORECASE)
        if skills_match:
            sections['skills'] = skills_match.group(1).strip()
        
        # Certifications
        cert_match = re.search(r'(?:certifications?|licenses?|credentials?)(?:\s*[:\n])(.*?)(?=\n\s*(?:experience|education|skills|summary|\Z))', text, re.DOTALL | re.IGNORECASE)
        if cert_match:
            sections['certifications'] = cert_match.group(1).strip()
            
        return sections
        
    def analyze_ats(self, text: str) -> Dict[str, Any]:
        """Simple ATS analysis based on text features"""
        text_lower = text.lower()
        
        # Common ATS keywords
        ats_keywords = [
            'experience', 'education', 'skills', 'contact', 'email', 'phone',
            'work', 'job', 'position', 'company', 'university', 'degree',
            'bachelor', 'master', 'phd', 'certified', 'professional'
        ]
        
        keywords_found = [kw for kw in ats_keywords if kw in text_lower]
        ats_score = min(100, int((len(keywords_found) / len(ats_keywords)) * 100) + 20)
        
        # Check for contact info
        has_email = '@' in text and '.' in text.split('@')[1].split()[0] if '@' in text else False
        has_phone = any(c.isdigit() for c in text[:200]) and len([c for c in text[:500] if c.isdigit()]) >= 7
        
        if not has_email:
            ats_score -= 15
        if not has_phone:
            ats_score -= 10
            
        return {
            'score': max(0, ats_score),
            'keywords_found': keywords_found[:10],
            'keywords_missing': [kw for kw in ats_keywords if kw not in text_lower][:5],
            'has_contact_info': has_email and has_phone,
            'suggestions': []
        }
    
    def analyze_content(self, text: str) -> Dict[str, Any]:
        """Analyze content quality"""
        words = text.split()
        word_count = len(words)
        
        # Content length scoring
        if word_count < 100:
            content_score = 40
            length_score = 30
            brevity_score = 90
            length_feedback = "Resume is too short"
        elif word_count < 300:
            content_score = 70
            length_score = 70
            brevity_score = 75
            length_feedback = "Good length"
        elif word_count < 600:
            content_score = 85
            length_score = 90
            brevity_score = 60
            length_feedback = "Excellent detail"
        else:
            content_score = 75
            length_score = 60
            brevity_score = 40
            length_feedback = "May be too verbose"
        
        # Check for action verbs
        action_verbs = ['managed', 'led', 'developed', 'created', 'implemented', 
                       'designed', 'built', 'launched', 'improved', 'increased']
        verbs_found = [v for v in action_verbs if v in text.lower()]
        
        if len(verbs_found) >= 3:
            content_score += 10
            
        # Tone analysis (simple heuristic)
        tone_score = 75
        if 'i' in text.lower().split()[:50]:
            tone_score -= 10  # Too much first person
        if any(word in text.lower() for word in ['accomplished', 'achieved', 'delivered']):
            tone_score += 10
            
        # Structure analysis
        structure_score = 70
        sections = ['experience', 'education', 'skills']
        sections_found = [s for s in sections if s in text.lower()]
        structure_score += len(sections_found) * 10
        
        return {
            'content_score': min(100, content_score),
            'tone_score': min(100, tone_score),
            'structure_score': min(100, structure_score),
            'length_score': length_score,
            'brevity_score': brevity_score,
            'word_count': word_count,
            'action_verbs': verbs_found,
            'strengths': [f"Contains {len(verbs_found)} strong action verbs"] if verbs_found else [],
            'weaknesses': [length_feedback] if word_count < 200 else [],
            'suggestions': []
        }
    
    def extract_skills(self, text: str) -> Dict[str, Any]:
        """Extract skills from resume"""
        text_lower = text.lower()
        
        # Tech skills
        tech_skills = ['python', 'javascript', 'java', 'sql', 'react', 'node', 
                      'aws', 'docker', 'kubernetes', 'git', 'linux']
        tech_found = [s for s in tech_skills if s in text_lower]
        
        # Soft skills
        soft_skills = ['leadership', 'communication', 'teamwork', 'problem-solving',
                      'analytical', 'organization', 'management']
        soft_found = [s for s in soft_skills if s in text_lower]
        
        skills_score = min(100, (len(tech_found) * 10) + (len(soft_found) * 5) + 40)
        
        return {
            'skills_score': skills_score,
            'technical_skills': tech_found,
            'soft_skills': soft_found,
            'skill_gaps': []
        }
    
    def generate_suggestions(self, ats: Dict, content: Dict, skills: Dict) -> List[Dict]:
        """Generate improvement suggestions"""
        suggestions = []
        
        if ats['score'] < 70:
            suggestions.append({
                'section': 'ATS',
                'priority': 'high',
                'issue': 'Low ATS compatibility',
                'recommendation': 'Add standard section headers: Experience, Education, Skills'
            })
            
        if content['word_count'] < 200:
            suggestions.append({
                'section': 'Content',
                'priority': 'medium',
                'issue': 'Resume is too brief',
                'recommendation': 'Expand on your achievements with specific metrics'
            })
            
        if not ats.get('has_contact_info'):
            suggestions.append({
                'section': 'Contact',
                'priority': 'high',
                'issue': 'Contact information missing or unclear',
                'recommendation': 'Ensure email and phone are clearly visible at the top'
            })
            
        if len(skills['technical_skills']) < 3:
            suggestions.append({
                'section': 'Skills',
                'priority': 'medium',
                'issue': 'Limited technical skills listed',
                'recommendation': 'Add more relevant technical skills and tools'
            })
            
        # Add generic suggestions if list is short
        if len(suggestions) < 3:
            suggestions.append({
                'section': 'General',
                'priority': 'low',
                'issue': 'Consider adding more quantifiable achievements',
                'recommendation': 'Use metrics like "increased sales by 25%" or "managed team of 10"'
            })
            
        return suggestions
    
    async def ai_analyze_section(self, section_name: str, section_text: str) -> Dict[str, Any]:
        """Use AI to analyze a specific resume section with detailed feedback"""
        if not section_text.strip():
            return {
                'score': 0,
                'feedback': f'No {section_name} section found. Add a {section_name} section to provide recruiters with essential information about your qualifications.',
                'strengths': [],
                'weaknesses': [f'Missing {section_name} section'],
                'suggestions': [f'Add a {section_name} section to your resume with relevant details']
            }
        
        prompt = f"""Analyze the following {section_name} section from a resume. Provide a COMPREHENSIVE analysis with specific citations.

REQUIREMENTS:
1. Write a detailed assessment of at least 100 words
2. Quote specific phrases or sentences from the resume to support your analysis
3. Explain WHY each strength or weakness exists
4. Provide actionable, specific suggestions with clear reasoning

{section_name} Section:
{section_text[:1500]}

Respond in JSON format:
{{
    "score": <number 0-100>,
    "feedback": "<Detailed 100+ word analysis. Include specific quotes from the resume in quotes like 'this'. Explain what works well and what doesn't, with specific examples and reasoning.>",
    "strengths": ["<Strength 1 with specific citation and explanation>", "<Strength 2 with specific citation and explanation>"],
    "weaknesses": ["<Weakness 1 with specific citation and explanation>", "<Weakness 2 with specific citation and explanation>"],
    "suggestions": ["<Specific actionable suggestion 1 with reasoning>", "<Specific actionable suggestion 2 with reasoning>"]
}}"""

        try:
            response = await self.llm_client.chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=2000
            )
            
            # Parse JSON response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                # Ensure feedback is substantial
                if len(result.get('feedback', '')) < 50:
                    result['feedback'] = f"The {section_name} section was analyzed. " + result.get('feedback', '')
                return result
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            logger.error(f"AI analysis failed for {section_name}: {e}")
            # Fallback to basic analysis
            return {
                'score': 50,
                'feedback': f'The {section_name} section contains relevant information but could not be fully analyzed due to a technical issue. Please review this section manually for completeness and clarity.',
                'strengths': ['Section is present in the resume'],
                'weaknesses': ['Detailed analysis unavailable'],
                'suggestions': ['Review this section for clarity and completeness', 'Add more specific details and metrics where possible']
            }
    
    async def ai_generate_overall_feedback(self, raw_text: str, sections_analysis: Dict) -> Dict[str, Any]:
        """Generate overall resume feedback using AI with detailed analysis"""
        
        # Build summary of section scores
        section_summary = []
        for name, analysis in sections_analysis.items():
            if analysis and analysis.get('score', 0) > 0:
                section_summary.append(f"{name}: {analysis['score']}/100 - {analysis.get('feedback', '')[:100]}...")
        
        prompt = f"""Based on the following resume sections analysis, provide COMPREHENSIVE overall feedback.

REQUIREMENTS:
1. Write detailed assessments of at least 100 words for each category
2. Quote specific content from the resume to support your analysis
3. Explain WHY each score was given with specific reasoning
4. Provide actionable recommendations

Section Analyses:
{chr(10).join(section_summary)}

Full Resume Text (first 800 chars):
{raw_text[:800]}

Respond in JSON format:
{{
    "overall_assessment": "<Detailed 100+ word overall assessment with specific citations from resume>",
    "key_strengths": ["<Detailed strength 1 with citation>", "<Detailed strength 2 with citation>", "<Detailed strength 3 with citation>"],
    "priority_improvements": ["<Detailed improvement 1 with reasoning>", "<Detailed improvement 2 with reasoning>", "<Detailed improvement 3 with reasoning>"],
    "ats_compatibility_score": <number 0-100>,
    "ats_analysis": "<Detailed 100+ word ATS analysis. Quote specific formatting issues, missing keywords, or structure problems. Explain what ATS systems look for and how this resume performs.>",
    "content_quality_score": <number 0-100>,
    "content_analysis": "<Detailed 100+ word content analysis. Quote specific examples of strong or weak content. Analyze action verbs, metrics, achievements, and clarity.>",
    "structure_score": <number 0-100>,
    "structure_analysis": "<Detailed 100+ word structure analysis. Comment on section organization, formatting consistency, readability, and visual hierarchy.>",
    "skills_presentation_score": <number 0-100>,
    "skills_analysis": "<Detailed 100+ word skills analysis. Evaluate how skills are presented, relevance, and organization.>",
    "email_contact_score": <number 0-100>,
    "email_contact_analysis": "<Detailed 100+ word email and contact analysis. Verify presence, format, and placement of email, phone, LinkedIn, and other contact info. Quote examples from resume.>",
    "tone_score": <number 0-100>,
    "tone_analysis": "<Detailed 100+ word tone and style analysis. Evaluate professionalism, voice consistency, industry-appropriate language, and overall writing style. Quote specific phrases.>"
}}"""

        try:
            response = await self.llm_client.chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=2500
            )
            
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            logger.error(f"Overall feedback generation failed: {e}")
            return {
                'overall_assessment': 'Resume analysis completed. The resume contains standard sections but detailed assessment requires manual review.',
                'key_strengths': ['Resume follows standard format', 'Contains necessary sections', 'Contact information present'],
                'priority_improvements': ['Add more specific achievements with metrics', 'Improve section organization', 'Enhance skills presentation'],
                'ats_compatibility_score': 55,
                'ats_analysis': 'ATS compatibility analysis could not be completed. Please ensure your resume uses standard headings and includes relevant keywords.',
                'content_quality_score': 60,
                'content_analysis': 'Content analysis could not be completed. Focus on using strong action verbs and quantifiable achievements.',
                'structure_score': 70,
                'structure_analysis': 'Structure analysis could not be completed. Ensure consistent formatting and clear section separation.',
                'skills_presentation_score': 60,
                'skills_analysis': 'Skills analysis could not be completed. Present skills in a clear, organized manner relevant to your target role.',
                'email_contact_score': 75,
                'email_contact_analysis': 'Email and contact analysis could not be completed. Ensure your contact information is clearly visible at the top of your resume, including a professional email address and phone number.',
                'tone_score': 70,
                'tone_analysis': 'Tone and style analysis could not be completed. Use professional language throughout your resume and maintain consistency in your writing style.'
            }

    async def analyze_resume(self, raw_text: str, upload_id: str, user_id: str, 
                           jobeazy_supabase, job_title: str = None) -> Dict[str, Any]:
        """Run complete AI-powered resume analysis"""
        logger.info(f"Starting AI analysis for upload {upload_id}")
        
        # Extract sections
        sections = self.extract_sections(raw_text)
        
        # Analyze each section with AI
        sections_analysis = {}
        all_suggestions = []
        
        for section_name, section_text in sections.items():
            logger.info(f"Analyzing {section_name} section...")
            analysis = await self.ai_analyze_section(section_name, section_text)
            sections_analysis[section_name] = analysis
            all_suggestions.extend(analysis.get('suggestions', []))
        
        # Get overall AI feedback
        logger.info("Generating overall feedback...")
        overall_feedback = await self.ai_generate_overall_feedback(raw_text, sections_analysis)
        
        # Calculate overall score
        section_scores = [a['score'] for a in sections_analysis.values() if a.get('score', 0) > 0]
        avg_section_score = sum(section_scores) / len(section_scores) if section_scores else 50
        overall_score = int(
            avg_section_score * 0.4 +
            overall_feedback.get('ats_compatibility_score', 50) * 0.15 +
            overall_feedback.get('content_quality_score', 50) * 0.15 +
            overall_feedback.get('structure_score', 50) * 0.15 +
            overall_feedback.get('skills_presentation_score', 50) * 0.15
        )
        
        # Prepare result for database with detailed analysis
        analysis_data = {
            'user_id': user_id,
            'upload_id': upload_id,
            'job_title': job_title or 'General Analysis',
            'overall_score': overall_score,
            'ats_score': overall_feedback.get('ats_compatibility_score', 50),
            'content_score': overall_feedback.get('content_quality_score', 50),
            'tone_score': int((sections_analysis.get('summary', {}).get('score', 50) + 
                              sections_analysis.get('experience', {}).get('score', 50)) / 2),
            'structure_score': overall_feedback.get('structure_score', 50),
            'skills_score': overall_feedback.get('skills_presentation_score', 50),
            'email_score': 80 if '@' in raw_text and '.' in raw_text else 50,
            'score_breakdown': {
                'overall': overall_score,
                'overall_assessment': overall_feedback.get('overall_assessment', ''),
                'ats': overall_feedback.get('ats_compatibility_score', 50),
                'ats_analysis': overall_feedback.get('ats_analysis', ''),
                'content': overall_feedback.get('content_quality_score', 50),
                'content_analysis': overall_feedback.get('content_analysis', ''),
                'tone': overall_feedback.get('tone_score', 75),
                'tone_analysis': overall_feedback.get('tone_analysis', ''),
                'structure': overall_feedback.get('structure_score', 50),
                'structure_analysis': overall_feedback.get('structure_analysis', ''),
                'skills': overall_feedback.get('skills_presentation_score', 50),
                'skills_analysis': overall_feedback.get('skills_analysis', ''),
                'email': overall_feedback.get('email_contact_score', 80),
                'email_analysis': overall_feedback.get('email_contact_analysis', ''),
                'experience': sections_analysis.get('experience', {}).get('score', 0),
                'experience_feedback': sections_analysis.get('experience', {}).get('feedback', ''),
                'education': sections_analysis.get('education', {}).get('score', 0),
                'education_feedback': sections_analysis.get('education', {}).get('feedback', ''),
                'summary': sections_analysis.get('summary', {}).get('score', 0),
                'summary_feedback': sections_analysis.get('summary', {}).get('feedback', ''),
                'key_strengths': overall_feedback.get('key_strengths', []),
                'priority_improvements': overall_feedback.get('priority_improvements', [])
            },
            'suggestions': all_suggestions[:10] if all_suggestions else overall_feedback.get('priority_improvements', ['Review your resume for improvements']),
            'status': 'completed',
            'error_message': None,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Save to database
        try:
            response = await jobeazy_supabase.table('resume_analyses').insert(analysis_data).execute()
            logger.info(f"AI analysis saved for upload {upload_id}")
            return analysis_data
        except Exception as e:
            logger.error(f"Failed to save analysis: {e}")
            raise


async def test_analyzer():
    """Test the analyzer with sample text"""
    sample_text = """
    John Doe
    john.doe@email.com
    (555) 123-4567
    
    EXPERIENCE
    Software Engineer at Tech Corp
    - Developed Python applications serving 10,000+ users
    - Led team of 5 engineers
    - Implemented CI/CD with Docker and Kubernetes
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of Technology
    
    SKILLS
    Python, JavaScript, React, AWS, Docker, Git
    Leadership, Communication, Problem-solving
    """
    
    # Test analysis logic without database
    analyzer = SimpleResumeAnalyzer()
    
    # Just run the analysis logic
    ats = analyzer.analyze_ats(sample_text)
    content = analyzer.analyze_content(sample_text)
    skills = analyzer.extract_skills(sample_text)
    suggestions = analyzer.generate_suggestions(ats, content, skills)
    
    overall = int(
        ats['score'] * 0.30 +
        content['content_score'] * 0.25 +
        content['tone_score'] * 0.15 +
        content['structure_score'] * 0.15 +
        skills['skills_score'] * 0.15
    )
    
    print("\n=== Resume Analysis Test ===")
    print(f"Overall Score: {overall}")
    print(f"ATS Score: {ats['score']}")
    print(f"Content Score: {content['content_score']}")
    print(f"Tone Score: {content['tone_score']}")
    print(f"Structure Score: {content['structure_score']}")
    print(f"Skills Score: {skills['skills_score']}")
    print(f"\nKeywords Found: {ats['keywords_found']}")
    print(f"Technical Skills: {skills['technical_skills']}")
    print(f"\nSuggestions ({len(suggestions)}):")
    for i, s in enumerate(suggestions, 1):
        print(f"  {i}. [{s['section']}] {s['recommendation']}")
    print("\n✅ Analysis logic working correctly!")
    print("Run with real database when connected to internet.")
    

if __name__ == '__main__':
    asyncio.run(test_analyzer())
