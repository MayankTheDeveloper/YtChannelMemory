import asyncio
from abc import ABC, abstractmethod

class VideoProvider(ABC):
    @abstractmethod
    async def generate_video(self, prompt: str, image_url: str = None) -> dict:
        pass

class FalProvider(VideoProvider):
    async def generate_video(self, prompt: str, image_url: str = None) -> dict:
        print(f"Calling fal.ai (Kling/Minimax) with prompt: {prompt[:30]}...")
        await asyncio.sleep(3) # Simulate long generation time
        return {
            "url": f"https://example.com/assets/video/fal_generated_{hash(prompt)}.mp4",
            "metadata": {"duration": 5.0, "provider": "fal"}
        }

class FutureProvider(VideoProvider):
    async def generate_video(self, prompt: str, image_url: str = None) -> dict:
        pass

class VideoGenerationAgent:
    def __init__(self, provider: VideoProvider):
        self.provider = provider
        
    async def generate(self, prompt: str, image_url: str = None) -> dict:
        return await self.provider.generate_video(prompt, image_url)

video_agent = VideoGenerationAgent(provider=FalProvider())
