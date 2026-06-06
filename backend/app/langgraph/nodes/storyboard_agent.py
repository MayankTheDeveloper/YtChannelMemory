import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def get_fallback_storyboard(script_data: dict) -> list:
    hook = script_data.get("hook", "Intro scene")
    intro = script_data.get("introduction", "Introducing topic")
    sections = script_data.get("sections", [])
    cta = script_data.get("cta", "Call to action")
    
    scenes = [
        {
            "scene": 1,
            "duration": 5,
            "narration": hook,
            "visual_description": "High-energy introductory footage with fast transitions, matching the hook content.",
            "camera_style": "Fast zoom, dynamic cinematic movement",
            "asset_requirements": ["A-roll of presenter", "Intro transition animation"]
        },
        {
            "scene": 2,
            "duration": 10,
            "narration": intro,
            "visual_description": "Presenter walking or speaking directly to the camera, explaining the value proposition.",
            "camera_style": "Medium shot, stable panning",
            "asset_requirements": ["Main video track", "Subtitles overlay"]
        }
    ]
    
    scene_idx = 3
    for s in sections:
        scenes.append({
            "scene": scene_idx,
            "duration": 15,
            "narration": s.get("content", s.get("body", "")),
            "visual_description": f"Showing close-up visual details of: {s.get('heading', 'Core topic')}.",
            "camera_style": "Extreme close-up or steady detail shot",
            "asset_requirements": ["B-roll footage", "Explaining graphics"]
        })
        scene_idx += 1
        
    scenes.append({
        "scene": scene_idx,
        "duration": 8,
        "narration": cta,
        "visual_description": "Presenter pointing to subscribe button or end-card overlay showing recommended videos.",
        "camera_style": "Wide shot, fading to black",
        "asset_requirements": ["End-screen card template", "Subscribe button animation"]
    })
    
    return scenes

def generate_storyboard(script_data: dict) -> list:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-pro", temperature=0.7)
    
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
            
        res = json.loads(content)
        if not res or not isinstance(res, list):
            return get_fallback_storyboard(script_data)
        return res
    except Exception as e:
        print(f"Error generating storyboard: {e}")
        return get_fallback_storyboard(script_data)
