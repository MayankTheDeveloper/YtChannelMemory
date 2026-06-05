from langgraph.graph import StateGraph, END
from app.langgraph.state import ChannelAnalysisState
from app.langgraph.nodes.comment_agent import analyze_comments_node
from app.langgraph.nodes.audience_agent import analyze_audience_node
from app.langgraph.nodes.video_agent import analyze_video_node
from app.langgraph.nodes.competitor_agent import analyze_competitors_node
from app.langgraph.nodes.trend_agent import analyze_trends_node
from app.langgraph.nodes.recommendation_agent import recommendation_node

from app.langgraph.nodes.memory_node import memory_recall_node, memory_retain_node

def create_channel_analysis_workflow():
    workflow = StateGraph(ChannelAnalysisState)
    
    workflow.add_node("analyze_comments", analyze_comments_node)
    workflow.add_node("analyze_audience", analyze_audience_node)
    workflow.add_node("analyze_video", analyze_video_node)
    workflow.add_node("analyze_competitors", analyze_competitors_node)
    workflow.add_node("analyze_trends", analyze_trends_node)
    workflow.add_node("memory_recall", memory_recall_node)
    workflow.add_node("generate_recommendations", recommendation_node)
    workflow.add_node("memory_retain", memory_retain_node)
    
    workflow.set_entry_point("analyze_comments")
    
    workflow.add_edge("analyze_comments", "analyze_audience")
    workflow.add_edge("analyze_audience", "analyze_video")
    workflow.add_edge("analyze_video", "analyze_competitors")
    workflow.add_edge("analyze_competitors", "analyze_trends")
    workflow.add_edge("analyze_trends", "memory_recall")
    workflow.add_edge("memory_recall", "generate_recommendations")
    workflow.add_edge("generate_recommendations", "memory_retain")
    workflow.add_edge("memory_retain", END)
    
    return workflow.compile()

app_workflow = create_channel_analysis_workflow()
