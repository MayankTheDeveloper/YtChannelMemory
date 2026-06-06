import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def generate_script(brief_data: dict) -> dict:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-flash", temperature=0.7)
    
    system_prompt = """
    You are an expert YouTube Scriptwriter. Your goal is to expand a Content Brief into a complete, highly engaging YouTube video script.
    
    The script should follow modern YouTube pacing:
    - An immediate, high-retention hook (first 5 seconds).
    - An engaging introduction outlining the value proposition.
    - Clear, fast-paced sections delivering the core content.
    - A strong Call to Action (CTA) at the end.
    
    Output ONLY valid JSON matching this schema:
    {
      "hook": "The first 5 seconds script",
      "introduction": "The intro script",
      "sections": [
        {
          "heading": "Section 1",
          "content": "The actual narration/script for this section"
        }
      ],
      "cta": "The call to action script"
    }
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(brief_data))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"Error generating script: {e}")
        return {}
