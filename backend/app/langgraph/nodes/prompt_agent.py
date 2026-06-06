import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def generate_prompts(storyboard_scene: dict) -> list:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
    system_prompt = """
    You are an expert Prompt Engineer for AI video and image generation models (like Flux, SDXL, Kling, or Minimax).
    Your goal is to take a scene's visual description and asset requirements, and generate optimized prompts that will yield high-quality, realistic, and highly relevant assets.
    
    Output ONLY valid JSON matching this schema, which is a list of objects representing each required generation prompt for the scene:
    [
      {
        "prompt_type": "image or video",
        "prompt_text": "The highly optimized, descriptive prompt for the AI model",
        "parameters": {
          "aspect_ratio": "16:9",
          "style": "cinematic, 4k, hyper-realistic"
        }
      }
    ]
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(storyboard_scene))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"Error generating prompts: {e}")
        return []
