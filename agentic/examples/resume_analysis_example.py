"""
Example Usage: Resume Analysis Workflow

This example demonstrates how to use the Agentic WAT Framework
to analyze resumes and generate improvement suggestions.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the agentic framework
from agentic import (
    analyze_resume,
    ResumeAnalysisWorkflow,
    ResumeAnalysisResult,
    RESUME_TOOLS,
    ToolRegistry,
    AgentConfig,
    PlanAndSolveAgent,
)


# Example resume text (simplified)
SAMPLE_RESUME_TEXT = """
JOHN DOE
Software Engineer
john.doe@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development.
Passionate about building scalable web applications and solving complex problems.

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020-Present
- Developed and maintained React-based frontend applications
- Built REST APIs using Node.js and Express
- Managed PostgreSQL databases and optimized queries
- Led team of 3 junior developers

Software Developer | StartupXYZ | 2018-2020
- Created mobile-responsive web applications
- Implemented CI/CD pipelines using GitHub Actions
- Worked with AWS services (EC2, S3, Lambda)

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2018

SKILLS
JavaScript, TypeScript, React, Node.js, Python, SQL, AWS, Docker, Git
"""


async def example_basic_analysis():
    """
    Example 1: Basic resume analysis using the convenience function
    """
    print("=" * 60)
    print("Example 1: Basic Resume Analysis")
    print("=" * 60)
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Please set OPENAI_API_KEY environment variable")
        print("Skipping example...")
        return
    
    try:
        # Analyze the resume
        result = await analyze_resume(
            raw_text=SAMPLE_RESUME_TEXT,
            upload_id="example-upload-123",
            user_id="user-456",
            job_title="Senior Software Engineer",
            job_description="Looking for experienced full-stack developer with React and Node.js expertise"
        )
        
        # Print results
        print(f"\n✅ Analysis Complete!")
        print(f"\nOverall Score: {result.scores.overall_score}/100")
        print(f"ATS Score: {result.scores.ats_score}/100")
        print(f"Content Score: {result.scores.content_score}/100")
        print(f"Tone Score: {result.scores.tone_score}/100")
        print(f"Structure Score: {result.scores.structure_score}/100")
        
        print(f"\n📝 Summary:")
        print(result.summary)
        
        print(f"\n💪 Strengths ({len(result.strengths)}):")
        for strength in result.strengths:
            print(f"  - {strength}")
        
        print(f"\n⚠️  Areas for Improvement ({len(result.weaknesses)}):")
        for weakness in result.weaknesses:
            print(f"  - {weakness}")
        
        print(f"\n🎯 Top Suggestions:")
        for sugg in result.suggestions[:3]:
            print(f"\n  [{sugg.priority.upper()}] {sugg.section}")
            print(f"   Issue: {sugg.issue}")
            print(f"   Recommendation: {sugg.recommendation}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


async def example_workflow_steps():
    """
    Example 2: Using workflow steps individually
    """
    print("\n" + "=" * 60)
    print("Example 2: Workflow with Individual Steps")
    print("=" * 60)
    
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Please set OPENAI_API_KEY environment variable")
        return
    
    try:
        # Create workflow instance
        workflow = ResumeAnalysisWorkflow()
        
        print("\n🔄 Running workflow steps...")
        
        # Run the full workflow
        result = await workflow.analyze(
            raw_text=SAMPLE_RESUME_TEXT,
            upload_id="example-upload-789",
            user_id="user-012"
        )
        
        print(f"\n✅ Workflow completed with status: {result.status}")
        print(f"Overall Score: {result.scores.overall_score}/100")
        
    except Exception as e:
        print(f"❌ Error: {e}")


async def example_custom_agent():
    """
    Example 3: Creating a custom agent with tools
    """
    print("\n" + "=" * 60)
    print("Example 3: Custom Agent with Tools")
    print("=" * 60)
    
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Please set OPENAI_API_KEY environment variable")
        return
    
    try:
        # Create tool registry with resume tools
        tools = ToolRegistry()
        for tool in RESUME_TOOLS:
            tools.register(tool)
        
        print(f"\n🛠️  Registered {len(tools.list_tools())} tools:")
        for tool_name in tools.list_tools():
            print(f"  - {tool_name}")
        
        # Create agent configuration
        config = AgentConfig(
            name="ResumeReviewer",
            model="gpt-4",
            temperature=0.5,
            system_prompt="""You are an expert resume reviewer with 15+ years of HR experience.
Your task is to analyze resumes and provide constructive feedback.
Be thorough, professional, and actionable in your analysis.""",
            max_iterations=5
        )
        
        # Create Plan-and-Solve agent
        agent = PlanAndSolveAgent(config=config, tool_registry=tools)
        
        print("\n🤖 Running custom agent...")
        
        # Run agent on a specific task
        result = await agent.run(
            task=f"""Analyze this resume and identify the top 3 improvements needed:

{SAMPLE_RESUME_TEXT}

Focus on:
1. Impact of achievements
2. Technical skills presentation
3. Overall formatting"""
        )
        
        print(f"\n✅ Agent completed in {result['iterations']} iterations")
        print(f"\n📋 Agent's Plan:")
        for i, step in enumerate(result.get('plan', []), 1):
            print(f"  {i}. {step}")
        
        print(f"\n📝 Final Analysis:")
        print(result['final_answer'][:500] + "...")
        
    except Exception as e:
        print(f"❌ Error: {e}")


async def example_tool_usage():
    """
    Example 4: Using individual tools directly
    """
    print("\n" + "=" * 60)
    print("Example 4: Using Individual Tools")
    print("=" * 60)
    
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Please set OPENAI_API_KEY environment variable")
        return
    
    try:
        from agentic.tools import ExtractSkillsTool, ExtractResumeDataTool
        
        # Use skill extraction tool
        print("\n🔧 Using ExtractSkillsTool...")
        skills_tool = ExtractSkillsTool()
        skills = await skills_tool.execute({"raw_text": SAMPLE_RESUME_TEXT})
        
        print(f"\n✅ Found {len(skills)} skills:")
        for skill in skills:
            print(f"  - {skill.name} (Level: {skill.level}/100)")
        
        # Use resume data extraction tool
        print("\n🔧 Using ExtractResumeDataTool...")
        extract_tool = ExtractResumeDataTool()
        resume_data = await extract_tool.execute({"raw_text": SAMPLE_RESUME_TEXT})
        
        print(f"\n✅ Extracted resume data:")
        print(f"  Name: {resume_data.personal_details.first_name} {resume_data.personal_details.last_name}")
        print(f"  Email: {resume_data.personal_details.email}")
        print(f"  Job Title: {resume_data.personal_details.job_title}")
        print(f"  Experience entries: {len(resume_data.employment_history)}")
        print(f"  Education entries: {len(resume_data.education)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """
    Run all examples
    """
    print("\n" + "🚀" * 30)
    print("Agentic WAT Framework - Resume Analysis Examples")
    print("🚀" * 30 + "\n")
    
    # Check environment
    print("Environment Check:")
    print(f"  OPENAI_API_KEY: {'✅ Set' if os.getenv('OPENAI_API_KEY') else '❌ Not Set'}")
    print(f"  ANTHROPIC_API_KEY: {'✅ Set' if os.getenv('ANTHROPIC_API_KEY') else '⚠️  Not Set (Optional)'}")
    
    # Run examples
    await example_basic_analysis()
    await example_workflow_steps()
    await example_custom_agent()
    await example_tool_usage()
    
    print("\n" + "=" * 60)
    print("All examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
