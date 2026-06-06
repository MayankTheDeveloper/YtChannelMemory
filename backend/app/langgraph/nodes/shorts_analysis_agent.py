import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_shorts_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-pro", temperature=0)
    
    shorts = state.get("raw_shorts", [])
    
    if not shorts:
        state["shorts_insights"] = {
            "winning_patterns": [],
            "losing_patterns": [],
            "average_duration_seconds": 0,
            "hook_patterns": [],
            "viral_topics": [],
            "engagement_patterns": []
        }
        return state
        
    shorts_summary = []
    for s in shorts:
        shorts_summary.append({
            "title": s.get("title"),
            "views": s.get("view_count", 0),
            "likes": s.get("like_count", 0),
            "duration": s.get("duration")
        })
        
    system_prompt = """
    Based on the following list of YouTube Shorts and their performance metrics from a creator channel, identify hooks, viral topics, average duration, and engagement patterns.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "winning_patterns": ["winning pattern 1", "winning pattern 2"],
      "losing_patterns": ["losing pattern 1", "losing pattern 2"],
      "average_duration_seconds": 45,
      "hook_patterns": ["hook 1", "hook 2"],
      "viral_topics": ["topic 1", "topic 2"],
      "engagement_patterns": ["pattern 1", "pattern 2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(shorts_summary))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        insights = json.loads(content)
        state["shorts_insights"] = insights
    except Exception as e:
        print(f"Error in Shorts analysis: {e}")
        state["shorts_insights"] = {
            "winning_patterns": [],
            "losing_patterns": [],
            "average_duration_seconds": 30,
            "hook_patterns": [],
            "viral_topics": [],
            "engagement_patterns": []
        }
        
    return state
