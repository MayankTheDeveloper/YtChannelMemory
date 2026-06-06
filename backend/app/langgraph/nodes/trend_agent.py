import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_trends_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0)
    
    trends = state.get("raw_trends", [])
    if not trends:
        state["trend_insights"] = {
            "emerging_topics": [],
            "saturated_topics": []
        }
        return state
        
    system_prompt = """
    Based on the following list of recent trend data and momentum scores, categorize them into emerging topics and saturated topics.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "emerging_topics": ["topic 1", "topic 2"],
      "saturated_topics": ["topic 1", "topic 2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(trends))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        insights = json.loads(content)
        state["trend_insights"] = insights
    except Exception as e:
        print(f"Error in trend analysis: {e}")
        state["trend_insights"] = {
            "emerging_topics": [],
            "saturated_topics": []
        }
        
    return state
