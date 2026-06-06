import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_video_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0)
    
    videos = state.get("raw_videos", [])
    
    if not videos:
        state["video_insights"] = {
            "winning_patterns": [],
            "losing_patterns": [],
            "best_videos": [],
            "worst_videos": []
        }
        return state
        
    # Simplify video data for LLM
    video_summary = []
    for v in videos:
        video_summary.append({
            "title": v.get("title"),
            "views": v.get("view_count", 0),
            "likes": v.get("like_count", 0),
            "duration": v.get("duration")
        })
        
    system_prompt = """
    Based on the following list of videos and their performance metrics from a YouTube channel, identify patterns in the highest and lowest performing videos.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "winning_patterns": ["pattern 1", "pattern 2"],
      "losing_patterns": ["pattern 1", "pattern 2"],
      "best_videos": ["title 1", "title 2"],
      "worst_videos": ["title 1", "title 2"]
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
        state["video_insights"] = insights
    except Exception as e:
        print(f"Error in video analysis: {e}")
        state["video_insights"] = {
            "winning_patterns": [],
            "losing_patterns": [],
            "best_videos": [],
            "worst_videos": []
        }
        
    return state
