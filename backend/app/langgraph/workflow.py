from langgraph.graph import StateGraph, END
from app.langgraph.state import ChannelAnalysisState
from app.langgraph.nodes.comment_agent import analyze_comments_node
from app.langgraph.nodes.audience_agent import analyze_audience_node
from app.langgraph.nodes.competitor_agent import analyze_competitors_node
from app.langgraph.nodes.trend_agent import analyze_trends_node
from app.langgraph.nodes.video_agent import analyze_video_node

from app.langgraph.nodes.shorts_analysis_agent import analyze_shorts_node
from app.langgraph.nodes.long_form_analysis_agent import analyze_long_form_node
from app.langgraph.nodes.shorts_recommendation_agent import shorts_recommendation_node
from app.langgraph.nodes.long_form_recommendation_agent import long_form_recommendation_node
from app.langgraph.nodes.memory_node import (
    shorts_memory_recall_node,
    long_form_memory_recall_node,
    shorts_memory_retain_node,
    long_form_memory_retain_node
)

def create_channel_analysis_workflow():
    workflow = StateGraph(ChannelAnalysisState)
    
    workflow.add_node("analyze_comments", analyze_comments_node)
    workflow.add_node("analyze_audience", analyze_audience_node)
    workflow.add_node("analyze_competitors", analyze_competitors_node)
    workflow.add_node("analyze_trends", analyze_trends_node)
    
    # Shorts pipeline nodes
    workflow.add_node("analyze_shorts", analyze_shorts_node)
    workflow.add_node("shorts_memory_recall", shorts_memory_recall_node)
    workflow.add_node("generate_shorts_recommendations", shorts_recommendation_node)
    workflow.add_node("shorts_memory_retain", shorts_memory_retain_node)
    
    # Long Form pipeline nodes
    workflow.add_node("analyze_long_form", analyze_long_form_node)
    workflow.add_node("long_form_memory_recall", long_form_memory_recall_node)
    workflow.add_node("generate_long_form_recommendations", long_form_recommendation_node)
    workflow.add_node("long_form_memory_retain", long_form_memory_retain_node)
    
    workflow.set_entry_point("analyze_comments")
    
    # Wire baseline comments and audience
    workflow.add_edge("analyze_comments", "analyze_audience")
    workflow.add_edge("analyze_audience", "analyze_competitors")
    workflow.add_edge("analyze_competitors", "analyze_trends")
    
    # Move to Shorts pipeline
    workflow.add_edge("analyze_trends", "analyze_shorts")
    workflow.add_edge("analyze_shorts", "shorts_memory_recall")
    workflow.add_edge("shorts_memory_recall", "generate_shorts_recommendations")
    workflow.add_edge("generate_shorts_recommendations", "shorts_memory_retain")
    
    # Move to Long Form pipeline
    workflow.add_edge("shorts_memory_retain", "analyze_long_form")
    workflow.add_edge("analyze_long_form", "long_form_memory_recall")
    workflow.add_edge("long_form_memory_recall", "generate_long_form_recommendations")
    workflow.add_edge("generate_long_form_recommendations", "long_form_memory_retain")
    
    workflow.add_edge("long_form_memory_retain", END)
    
    return workflow.compile()

app_workflow = create_channel_analysis_workflow()
