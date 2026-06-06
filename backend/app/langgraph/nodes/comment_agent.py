import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.langgraph.state import ChannelAnalysisState
from app.core.config import settings

def analyze_comments_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0)
    
    comments = state.get("raw_comments", [])
    if not comments:
        state["comment_insights"] = {
            "top_requests": [],
            "top_questions": [],
            "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
            "common_themes": []
        }
        return state
        
    # sample comments if too large to fit context
    sampled_comments = comments[:200]
    comment_texts = [c["text"] for c in sampled_comments]
    
    system_prompt = """
    Analyze the following list of YouTube comments.
    Extract the following insights and output ONLY a valid JSON object matching this schema:
    {
      "top_requests": ["list", "of", "requests"],
      "top_questions": ["list", "of", "questions"],
      "sentiment_distribution": {"positive": 0.0, "neutral": 0.0, "negative": 0.0},
      "common_themes": ["theme 1", "theme 2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(comment_texts))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        insights = json.loads(content)
        state["comment_insights"] = insights
    except Exception as e:
        print(f"Error in comment analysis: {e}")
        state["comment_insights"] = {
            "top_requests": [],
            "top_questions": [],
            "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
            "common_themes": []
        }
        
    return state
