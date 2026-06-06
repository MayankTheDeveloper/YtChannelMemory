import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_audience_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0)
    
    comment_insights = state.get("comment_insights", {})
    
    system_prompt = """
    Based on the following comment insights from a YouTube channel, profile the audience.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "interests": ["interest 1", "interest 2"],
      "personas": ["persona 1", "persona 2"],
      "pain_points": ["pain point 1", "pain point 2"],
      "requested_topics": ["topic 1", "topic 2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(comment_insights))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        insights = json.loads(content)
        state["audience_insights"] = insights
    except Exception as e:
        print(f"Error in audience analysis: {e}")
        state["audience_insights"] = {
            "interests": [],
            "personas": [],
            "pain_points": [],
            "requested_topics": []
        }
        
    return state
