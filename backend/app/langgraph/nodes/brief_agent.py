import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def get_fallback_brief(title: str) -> dict:
    title_lower = title.lower()
    if any(k in title_lower for k in ["hydrogen", "nitrogen", "engine", "bike", "experiment", "explode", "hacker", "stunt", "giant"]):
        return {
            "topic": title,
            "target_audience": "Adventure seekers, science hobbyists, and youth interested in crazy experiments.",
            "video_goal": "Provide high-energy entertainment while explaining basic chemical/mechanical principles.",
            "key_points": [
                "Safety precautions and custom setup for the stunt.",
                "Step-by-step chemical/mechanical configuration.",
                "The grand reveal: executing the experiment at scale.",
                "Explaining why the reaction occurred and what it means."
            ],
            "content_angle": "High-octane, transparent, and visual-first demonstration of an extreme experiment.",
            "competitor_reference": ["Other stunt channels focus on humor; we will emphasize the scale and the engineering process."],
            "estimated_length": "12-15 minutes"
        }
    elif any(k in title_lower for k in ["next", "react", "langgraph", "agent", "automation", "code", "programming", "software"]):
        return {
            "topic": title,
            "target_audience": "Full-stack developers, AI engineers, and tech-savvy creators.",
            "video_goal": "Teach developers how to build and deploy advanced agentic applications.",
            "key_points": [
                "Understanding LangGraph and stateful agents.",
                "Integrating backend database with null pools.",
                "Connecting frontend views dynamically.",
                "Step-by-step code walkthrough."
            ],
            "content_angle": "Practical, code-heavy, zero-fluff tutorial with a working GitHub repository.",
            "competitor_reference": ["Most tutorials only cover simple hello-world tasks; we show a full production-grade app."],
            "estimated_length": "15-20 minutes"
        }
    else:
        return {
            "topic": title,
            "target_audience": "General viewers and loyal channel subscribers.",
            "video_goal": "Engage the audience with a fresh and highly requested perspective on this topic.",
            "key_points": [
                "Introduction to the core concept.",
                "Addressing common questions or misconceptions.",
                "Case studies or practical demonstrations.",
                "Summary and future outlook."
            ],
            "content_angle": "Informative and engaging overview tailoring specifically to comment requests.",
            "competitor_reference": ["Providing deeper, evidence-backed answers compared to generic videos."],
            "estimated_length": "8-10 minutes"
        }

def generate_brief(recommendation_data: dict) -> dict:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-pro", temperature=0.7)
    
    system_prompt = """
    You are an expert YouTube Content Strategist. Your goal is to convert an AI-generated content recommendation into a detailed, production-ready Content Brief.
    
    Output ONLY valid JSON matching this schema:
    {
      "topic": "The core topic of the video",
      "target_audience": "Detailed description of who this is for",
      "video_goal": "What the viewer should learn or feel",
      "key_points": ["Point 1", "Point 2", "Point 3"],
      "content_angle": "The unique angle or perspective",
      "competitor_reference": ["Competitor A did X, we will do Y"],
      "estimated_length": "e.g., 8-10 minutes"
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(recommendation_data))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        res = json.loads(content)
        if not res or not res.get("topic"):
            return get_fallback_brief(recommendation_data.get("title", "YouTube Video Idea"))
        return res
    except Exception as e:
        print(f"Error generating brief: {e}")
        return get_fallback_brief(recommendation_data.get("title", "YouTube Video Idea"))
