import os
import re
import json
from pathlib import Path
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

def generate_entrepreneur_view(content, model, user_language='en-IN'):
    """Generate entrepreneur-focused view using Gemini API in user's language"""
    
    # Language mapping
    language_names = {
        'en-IN': 'English',
        'hi-IN': 'Hindi',
        'mr-IN': 'Marathi', 
        'gu-IN': 'Gujarati',
        'or-IN': 'Odia'
    }
    
    target_language = language_names.get(user_language, 'English')
    
    # Add language instruction if not English
    language_instruction = ""
    if user_language != 'en-IN':
        language_instruction = f"""
        IMPORTANT: Generate ALL content in {target_language} language.
        Use simple, rural-friendly {target_language} that entrepreneurs from villages and small towns can easily understand.
        Avoid complex business terms and use everyday language.
        """

    prompt = f"""
    Create an entrepreneur-focused business plan analysis from this comprehensive business case with market research.
    Make the language simple and accessible for rural/semi-urban entrepreneurs.
    
    {language_instruction}

    {content}

    Format the output as a JSON object with these sections (translate all field names and content to {target_language} if not English):
    {{
        "business_overview": {{
            "executive_summary": "Simple summary of the business in easy-to-understand {target_language}",
            "value_proposition": "What makes your business special (in simple {target_language})",
            "target_market": "Who will buy from you (in simple {target_language})",
            "market_validation": "What research shows about your business potential in {target_language}"
        }},
        "business_potential": {{
            "market_opportunity": "Market potential explained simply in {target_language}",
            "revenue_potential": "How much money you could make (in {target_language})",
            "key_strengths": ["List your main business advantages in simple {target_language}"],
            "competitive_position": "How you compare to others in simple {target_language}"
        }},
        "action_items": {{
            "immediate_steps": ["Next 3 things you should do right away in {target_language}"],
            "improvement_areas": ["Areas where you can make your business better in {target_language}"],
            "resource_requirements": ["What you need to get started in {target_language}"],
            "market_entry_strategy": ["How to start selling effectively in {target_language}"]
        }},
        "development_plan": {{
            "short_term_goals": ["Goals for next 3-6 months in {target_language}"],
            "key_milestones": ["Important achievements to aim for in {target_language}"],
            "success_metrics": ["How to know you're succeeding in {target_language}"],
            "risk_mitigation": ["Problems to watch out for and how to handle them in {target_language}"]
        }},
        "market_insights": {{
            "industry_trends": ["What's happening in your business area in {target_language}"],
            "opportunities": ["Chances to grow your business in {target_language}"],
            "challenges": ["Difficulties you might face in {target_language}"],
            "success_factors": ["What you need to do to succeed in {target_language}"]
        }},
        "financial_guidance": {{
            "startup_costs_breakdown": "Detailed explanation of money needed to start in {target_language}",
            "revenue_projections": "Expected income in simple {target_language}",
            "profit_expectations": "Expected profit explained clearly in {target_language}",
            "funding_options": ["Ways to get money for your business in {target_language}"]
        }},
        "practical_tips": {{
            "daily_operations": ["Tips for running your business day-to-day in {target_language}"],
            "customer_service": ["How to keep customers happy in {target_language}"],
            "quality_control": ["How to maintain good quality in {target_language}"],
            "growth_strategies": ["Ways to grow your business over time in {target_language}"]
        }},
        "encouragement": {{
            "motivational_message": "Encouraging message for the entrepreneur in {target_language}",
            "community_impact": "How this business can help your community in {target_language}",
            "success_potential": "Why this business can succeed in {target_language}"
        }}
    }}

    Guidelines:
    - Use simple, non-technical language throughout in {target_language}
    - Avoid business jargon and use everyday words
    - Focus on practical, actionable advice that rural/semi-urban entrepreneurs can easily understand
    - Be encouraging and positive while being realistic about challenges
    - Include cultural context appropriate for Indian entrepreneurs
    - Make financial concepts easy to understand
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40
            )
        )
        # Extract JSON from response
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        return json.loads(json_match.group(1) if json_match else response.text)
    except Exception as e:
        return {"error": f"Error generating entrepreneur view: {str(e)}"}

def generate_mentor_view(content, model):
    """Generate mentor-focused view using Gemini API"""
    prompt = f"""
    Create a detailed mentor evaluation guide from this comprehensive business case with market research:

    {content}

    Format the output as a JSON object with these sections:
    {{
        "evaluation_summary": {{
            "business_concept": "Overview of the business idea",
            "market_validation": "Market research validation results",
            "assessment_score": "Current evaluation score with market insights",
            "key_strengths": ["List of strengths"],
            "key_concerns": ["List of concerns"]
        }},
        "market_analysis": {{
            "market_size_validation": "Market size analysis from research",
            "competitive_landscape": "Competition analysis with research data",
            "industry_trends": ["Current industry trends"],
            "market_entry_feasibility": "Assessment of market entry feasibility"
        }},
        "critical_analysis": {{
            "business_model_viability": "Assessment of business model",
            "financial_projections_review": "Review of financials with market context",
            "competitive_positioning": "Analysis of competitive position",
            "risk_factors": ["List of key risks with market context"]
        }},
        "mentorship_focus": {{
            "priority_topics": ["List of discussion topics"],
            "skills_development": ["Areas needing improvement"],
            "resource_needs": ["Required resources"],
            "market_strategy_guidance": ["Market strategy recommendations"]
        }},
        "guidance_framework": {{
            "key_questions": ["Specific questions to ask"],
            "validation_points": ["Areas to validate"],
            "success_metrics": ["Metrics to track"],
            "milestone_checkpoints": ["Key milestones to monitor"]
        }},
        "recommendations": {{
            "short_term_actions": ["Immediate steps"],
            "long_term_goals": ["Development goals"],
            "support_needed": ["Types of support required"],
            "market_strategy": ["Market entry and growth strategies"]
        }}
    }}

    Include market research insights throughout the evaluation.
    Ensure the JSON is properly formatted and all values are strings or arrays of strings.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.3,
                top_p=0.8,
                top_k=40
            )
        )
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        return json.loads(json_match.group(1) if json_match else response.text)
    except Exception as e:
        return {"error": f"Error generating mentor view: {str(e)}"}

def generate_admin_view(content, model):
    """Generate admin-focused view using Gemini API"""
    prompt = f"""
    Create a concise administrative overview from this comprehensive business case with market research:

    {content}

    Format the output as a JSON object with these sections:
    {{
        "application_summary": {{
            "entrepreneur_profile": {{
                "name": "Entrepreneur name",
                "experience": "Relevant experience",
                "education": "Educational background"
            }},
            "business_concept": "Brief business description",
            "submission_date": "Application submission date",
            "eligibility_status": "Current status",
            "application_id": "Business application ID if available"
        }},
        "enhanced_scoring": {{
            "overall_assessment_score": "Overall score with market insights out of 100",
            "market_validation_score": "Market research validation score out of 100",
            "detailed_scores": {{
                "market_potential": "Score out of 100",
                "business_model_clarity": "Score out of 100",
                "financial_feasibility": "Score out of 100",
                "competitive_advantage": "Score out of 100",
                "implementation_readiness": "Score out of 100",
                "market_research_score": "Market validation score out of 100"
            }},
            "scoring_rationale": {{
                "market_validation": "Brief explanation of market potential assessment",
                "competitive_analysis": "Brief explanation of competitive positioning", 
                "financial_viability": "Brief explanation of financial assessment",
                "implementation_assessment": "Brief explanation of readiness to execute"
            }},
            "eligibility_recommendation": "High Potential - Recommended|Good Potential - Consider|Needs Development|Insufficient Information",
            "risk_assessment": "Low|Medium|High risk level with brief justification"
        }},
        "market_intelligence": {{
            "market_potential_validated": "Market potential from research",
            "competitive_landscape_score": "Competition analysis score",
            "industry_outlook": "Industry trends and outlook",
            "market_entry_barriers": ["List of entry barriers identified"]
        }},
        "resource_requirements": {{
            "funding_needs": "Amount required",
            "support_services": ["List of services needed"],
            "mentor_matching_criteria": ["Key criteria for mentor matching"],
            "market_development_support": ["Market-specific support needed"]
        }},
        "administrative_actions": {{
            "application_status": "Current processing status",
            "next_steps": ["List of required actions"],
            "follow_up_items": ["Items needing follow-up"],
            "market_research_recommendations": ["Market research follow-up needed"],
            "mentor_assignment_priority": "High|Medium|Low priority for mentor assignment"
        }}
    }}

    Focus on administrative decision points and include market research insights.
    Prioritize the enhanced scoring information as this is critical for admin decision-making.
    Ensure the JSON is properly formatted and all values are strings or arrays of strings.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40
            )
        )
        json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
        return json.loads(json_match.group(1) if json_match else response.text)
    except Exception as e:
        return {"error": f"Error generating admin view: {str(e)}"}

def save_stakeholder_views(comprehensive_case_path, model, user_language='en-IN'):
    """Generate and save stakeholder-specific views"""
    try:
        # Read comprehensive business case
        with open(comprehensive_case_path, 'r', encoding='utf-8') as f:
            content = json.load(f)  # Load as JSON instead of text
        
        # Convert JSON to string for model prompt
        content_str = json.dumps(content, indent=2)
        
        # Create output directory if it doesn't exist
        output_dir = Path(comprehensive_case_path).parent / 'outputs'
        output_dir.mkdir(exist_ok=True)
        
        # Generate views using Gemini
        views = {
            'entrepreneur': generate_entrepreneur_view(content_str, model, user_language),
            'mentor': generate_mentor_view(content_str, model),
            'admin': generate_admin_view(content_str, model)
        }
        
        # Save views to files
        saved_files = {}
        for stakeholder, view_content in views.items():
            # Add language suffix for entrepreneur file
            if stakeholder == 'entrepreneur' and user_language != 'en-IN':
                output_path = output_dir / f'business_case_{stakeholder}_{user_language}.json'
            else:
                output_path = output_dir / f'business_case_{stakeholder}.json'
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(view_content, f, indent=2, ensure_ascii=False)
            saved_files[stakeholder] = str(output_path)
        
        return saved_files, views
    
    except Exception as e:
        raise Exception(f"Error generating stakeholder views: {str(e)}")
