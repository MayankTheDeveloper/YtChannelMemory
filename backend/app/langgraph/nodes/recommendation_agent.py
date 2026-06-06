import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def recommendation_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
    combined_insights = {
        "comment_insights": state.get("comment_insights"),
        "audience_insights": state.get("audience_insights"),
        "video_insights": state.get("video_insights"),
        "competitor_insights": state.get("competitor_insights"),
        "trend_insights": state.get("trend_insights"),
        "hindsight_memory_context": state.get("memory_context")
    }
    
    system_prompt = """
    You are an expert YouTube content strategist powered by Hindsight Memory. 
    Based on the provided channel insights and the 'hindsight_memory_context' (which contains past audience evolution, successful recommendations, and trends), generate 5 highly confident video recommendations.
    
    You must score each recommendation on a scale of 0-100 in 4 categories:
    - audience_score: How well it meets audience demand/pain points.
    - historical_score: How well it aligns with past winning patterns.
    - trend_score: How well it capitalizes on emerging trends.
    - competition_score: How well it exploits competitor gaps.
    
    The overall_score should be the average of these 4 scores.
    
    Extract the following insights and output ONLY a valid JSON list of objects matching this schema:
    [
      {
        "title": "Proposed Video Title",
        "description": "Brief description of the video concept",
        "confidence_score": 95,
        "overall_score": 91,
        "audience_score": 95,
        "historical_score": 88,
        "trend_score": 90,
        "competition_score": 91,
        "reasoning": ["reason 1", "reason 2"],
        "evidence": ["This topic was requested in 147 comments", "Growing 42% in trend velocity"],
        "memories_used": ["Audience requested automation repeatedly", "Past tutorial succeeded"],
        "related_videos": ["video_id_1"],
        "related_comments": ["comment text snippet"],
        "related_trends": ["AI Agents"],
        "estimated_growth": "High",
        "target_audience": "Specific audience segment"
      }
    ]
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(combined_insights))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        recommendations = json.loads(content)
        state["recommendations"] = recommendations
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        state["recommendations"] = []
        
    return state
