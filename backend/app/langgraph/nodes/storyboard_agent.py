import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def generate_storyboard(script_data: dict) -> list:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
    system_prompt = """
    You are an expert YouTube Storyboard Artist and Video Director.
    Your goal is to take a complete video script and break it down into visual scenes.
    
    For each scene, provide the narration, what is happening visually, the camera style/angle, and any specific asset requirements (e.g., 'B-roll of a computer', 'Screen recording of X').
    
    Output ONLY valid JSON matching this schema, which is a list of objects:
    [
      {
        "scene": 1,
        "duration": 5,
        "narration": "The script portion for this scene",
        "visual_description": "What we see on screen",
        "camera_style": "e.g., Fast zoom, static shot, cinematic pan",
        "asset_requirements": ["list", "of", "required", "assets"]
      }
    ]
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(script_data))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"Error generating storyboard: {e}")
        return []
