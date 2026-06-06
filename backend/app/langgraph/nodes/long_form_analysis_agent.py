import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_long_form_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-pro", temperature=0)
    
    videos = state.get("raw_long_form", [])
    
    if not videos:
        state["long_form_insights"] = {
            "winning_patterns": [],
            "losing_patterns": [],
            "topic_clusters": [],
            "title_patterns": [],
            "thumbnail_patterns": []
        }
        return state
        
    video_summary = []
    for v in videos:
        video_summary.append({
            "title": v.get("title"),
            "views": v.get("view_count", 0),
            "likes": v.get("like_count", 0),
            "duration": v.get("duration")
        })
        
    system_prompt = """
    Based on the following list of YouTube long-form videos and their metrics, analyze retention, topic clusters, title patterns, and thumbnail patterns.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "winning_patterns": ["winning pattern 1", "winning pattern 2"],
      "losing_patterns": ["losing pattern 1", "losing pattern 2"],
      "topic_clusters": ["cluster 1", "cluster 2"],
      "title_patterns": ["pattern 1", "pattern 2"],
      "thumbnail_patterns": ["pattern 1", "pattern 2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(video_summary))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        insights = json.loads(content)
        state["long_form_insights"] = insights
    except Exception as e:
        print(f"Error in Long Form analysis: {e}")
        state["long_form_insights"] = {
            "winning_patterns": [],
            "losing_patterns": [],
            "topic_clusters": [],
            "title_patterns": [],
            "thumbnail_patterns": []
        }
        
    return state
