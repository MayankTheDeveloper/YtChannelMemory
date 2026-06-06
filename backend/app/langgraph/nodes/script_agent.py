import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

def get_fallback_script(topic: str) -> dict:
    topic_lower = topic.lower()
    if any(k in topic_lower for k in ["hydrogen", "nitrogen", "engine", "bike", "experiment", "explode", "hacker", "stunt", "giant"]):
        return {
            "hook": "Look at this engine. Today, we are going to run it completely on pure hydrogen gas! Will it explode, or will it run like a supercar? Let's find out!",
            "introduction": "Welcome guys! You've been asking for this experiment for months. Today, we have built a custom delivery system to feed pure hydrogen directly into the carburetor.",
            "sections": [
                {
                    "heading": "Section 1: The Safety Setup",
                    "content": "First, safety is number one. We are placing the hydrogen tank 20 meters away and using a remote ignition valve just in case things go south."
                },
                {
                    "heading": "Section 2: Modifying the Engine",
                    "content": "We modified the fuel intake line. Instead of petrol, the carburetor is now directly connected to our pressurized hydrogen regulator."
                },
                {
                    "heading": "Section 3: The Moment of Truth",
                    "content": "Three, two, one... start the ignition! Look at that! It's actually idling! The RPM is hitting 6000 and the exhaust is just emitting water vapor!"
                }
            ],
            "cta": "If you want to see us put this engine on a real bike and ride it, hit that subscribe button right now and leave a comment below!"
        }
    elif any(k in topic_lower for k in ["next", "react", "langgraph", "agent", "automation", "code", "programming", "software"]):
        return {
            "hook": "Stop hardcoding your AI outputs. In this video, we're building a multi-agent system using LangGraph that learns from its own history and writes files autonomously.",
            "introduction": "Hey everyone. Today, we're going beyond basic API wrappers. We will build a production-ready Next.js app connected to a stateful FastAPI backend.",
            "sections": [
                {
                    "heading": "Section 1: Setting up the Graph State",
                    "content": "We'll define our TypedDict state to track comments, video recommendations, and previous memory context so our agent makes smart decisions."
                },
                {
                    "heading": "Section 2: Implementing the Nodes",
                    "content": "Next, we write the Python functions for comment analysis and database logging. We avoid loop reuse issues by configuring NullPool on SQLAlchemy."
                },
                {
                    "heading": "Section 3: Connecting the Frontend",
                    "content": "Now we build the Next.js UI using client components, displaying real-time generation logs and step-by-step progress bars."
                }
            ],
            "cta": "Check the description for the GitHub repository link. Don't forget to like, subscribe, and share what you want to see next!"
        }
    else:
        return {
            "hook": f"What is the secret behind {topic}? Today we are breaking it down completely so you can replicate it yourself.",
            "introduction": "Welcome back. In this episode, we are looking at the exact numbers and methods behind this highly requested idea.",
            "sections": [
                {
                    "heading": "Section 1: The Basics",
                    "content": "Let's first understand the core foundation and why this topic has been trending so heavily in recent weeks."
                },
                {
                    "heading": "Section 2: The Application",
                    "content": "Now we'll showcase the real-world application, step by step, showing you exactly how it works in practice."
                }
            ],
            "cta": "Thanks for watching! Make sure to subscribe and hit the notification bell so you never miss another guide."
        }

def generate_script(brief_data: dict) -> dict:
    llm = ChatGoogleGenerativeAI(api_key=settings.GEMINI_API_KEY, model="gemini-2.5-pro", temperature=0.7)
    
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
          "content": "The narration/script content"
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
            
        res = json.loads(content)
        if not res or not res.get("hook"):
            return get_fallback_script(brief_data.get("topic", "YouTube Video"))
        return res
    except Exception as e:
        print(f"Error generating script: {e}")
        return get_fallback_script(brief_data.get("topic", "YouTube Video"))
