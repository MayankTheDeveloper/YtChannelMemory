import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def generate_brief(recommendation_data: dict) -> dict:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
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
            
        return json.loads(content)
    except Exception as e:
        print(f"Error generating brief: {e}")
        return {}
