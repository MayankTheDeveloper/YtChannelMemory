import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_competitors_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0)
    
    competitors = state.get("raw_competitors", [])
    if not competitors:
        state["competitor_insights"] = {
            "content_gaps": [],
            "competitor_winners": []
        }
        return state
        
    system_prompt = """
    Based on the following list of competitor data (recent successful videos), identify content gaps and competitor winning patterns.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "content_gaps": ["gap 1", "gap 2"],
      "competitor_winners": ["winner 1", "winner 2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(competitors))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        insights = json.loads(content)
        state["competitor_insights"] = insights
    except Exception as e:
        print(f"Error in competitor analysis: {e}")
        state["competitor_insights"] = {
            "content_gaps": [],
            "competitor_winners": []
        }
        
    return state
