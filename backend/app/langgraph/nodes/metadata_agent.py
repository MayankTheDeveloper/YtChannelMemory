import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def generate_metadata(brief_data: dict, script_data: dict) -> dict:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
    system_prompt = """
    You are an expert YouTube SEO and Metadata Specialist.
    Your goal is to generate optimized metadata for a video based on its content brief and script.
    
    Output ONLY valid JSON matching this schema:
    {
      "title": "The highly clickable, CTR-optimized YouTube Title",
      "description": "The SEO-optimized description with timestamps and links placeholders",
      "tags": ["tag1", "tag2", "tag3"],
      "hashtags": ["#Hashtag1", "#Hashtag2"]
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps({"brief": brief_data, "script": script_data}))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"Error generating metadata: {e}")
        return {}

def generate_thumbnail_prompts(brief_data: dict, title: str) -> list:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
    system_prompt = """
    You are an expert YouTube Thumbnail Designer.
    Your goal is to generate 3 variant image generation prompts for A/B testing thumbnails based on the video brief and title.
    
    Output ONLY valid JSON matching this schema, a list of objects:
    [
      {
        "variant_name": "Variant A - High Contrast Shock",
        "prompt_text": "Image generation prompt for a highly clickable YouTube thumbnail",
        "parameters": {"aspect_ratio": "16:9"}
      }
    ]
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps({"brief": brief_data, "title": title}))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"Error generating thumbnail prompts: {e}")
        return []
