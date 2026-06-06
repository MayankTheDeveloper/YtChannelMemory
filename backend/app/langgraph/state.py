from typing import List, Dict, Any, TypedDict, Annotated
from operator import add

class ChannelAnalysisState(TypedDict):
    channel_id: int
    user_id: int
    raw_comments: List[Dict[str, Any]]
    raw_videos: List[Dict[str, Any]]
    raw_shorts: List[Dict[str, Any]]
    raw_long_form: List[Dict[str, Any]]
    raw_competitors: List[Dict[str, Any]]
    raw_trends: List[Dict[str, Any]]
    
    comment_insights: Dict[str, Any]
    audience_insights: Dict[str, Any]
    video_insights: Dict[str, Any]
    shorts_insights: Dict[str, Any]
    long_form_insights: Dict[str, Any]
    competitor_insights: Dict[str, Any]
    trend_insights: Dict[str, Any]
    
    memory_context: str
    shorts_memory_context: str
    long_form_memory_context: str
    retained_memories: List[Dict[str, Any]]
    
    recommendations: List[Dict[str, Any]]
    shorts_recommendations: List[Dict[str, Any]]
    long_form_recommendations: List[Dict[str, Any]]
