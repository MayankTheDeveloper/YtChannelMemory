from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    youtube_credentials = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    channels = relationship("Channel", back_populates="owner")

class Channel(Base):
    __tablename__ = "channels"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    youtube_channel_id = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(String)
    subscriber_count = Column(Integer, default=0)
    video_count = Column(Integer, default=0)
    health_score = Column(Float, default=0.0)
    growth_score = Column(Float, default=0.0)

    owner = relationship("User", back_populates="channels")
    videos = relationship("Video", back_populates="channel")
    audience_insights = relationship("AudienceInsight", back_populates="channel", uselist=False)
    recommendations = relationship("Recommendation", back_populates="channel")
    roadmaps = relationship("ContentRoadmap", back_populates="channel")

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    youtube_video_id = Column(String, unique=True, index=True)
    title = Column(String)
    published_at = Column(DateTime(timezone=True))
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    retention_metric = Column(Float, default=0.0)
    thumbnail_url = Column(String)

    channel = relationship("Channel", back_populates="videos")
    comments = relationship("Comment", back_populates="video")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    youtube_comment_id = Column(String, unique=True, index=True)
    author = Column(String)
    text = Column(String)
    sentiment_score = Column(Float, default=0.0)
    published_at = Column(DateTime(timezone=True))

    video = relationship("Video", back_populates="comments")

class AudienceInsight(Base):
    __tablename__ = "audience_insights"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"), unique=True)
    personas = Column(JSON, default=list)
    interests = Column(JSON, default=list)
    pain_points = Column(JSON, default=list)

    channel = relationship("Channel", back_populates="audience_insights")

class Competitor(Base):
    __tablename__ = "competitors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    competitor_channel_id = Column(String)
    title = Column(String)
    url = Column(String)

class Trend(Base):
    __tablename__ = "trends"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    search_volume = Column(Integer, default=0)
    momentum_score = Column(Float, default=0.0)
    discovered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    suggested_title = Column(String)
    confidence_score = Column(Float)
    reasoning = Column(String)
    audience_match_score = Column(Float)
    status = Column(String, default="pending")  # pending, accepted, rejected
    
    # Phase 1.5 Additions
    audience_score = Column(Float, default=0.0)
    historical_score = Column(Float, default=0.0)
    trend_score = Column(Float, default=0.0)
    competition_score = Column(Float, default=0.0)
    evidence = Column(JSON, default=list) # List of evidence strings
    related_videos = Column(JSON, default=list)
    related_comments = Column(JSON, default=list)
    related_trends = Column(JSON, default=list)

    # Phase 3: Hindsight Pivot
    memories_used = Column(JSON, default=list)

    channel = relationship("Channel", back_populates="recommendations")

class Memory(Base):
    __tablename__ = "memories"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    category = Column(String) # Audience, Recommendation, Trend, Competitor, Preference
    content = Column(String)
    context_tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_recalled_at = Column(DateTime(timezone=True), nullable=True)
    recall_count = Column(Integer, default=0)

class ContentRoadmap(Base):
    __tablename__ = "content_roadmaps"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    timeframe = Column(String) # 30, 60, 90 days
    calendar_data = Column(JSON, default=dict)

    channel = relationship("Channel", back_populates="roadmaps")

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    agent_type = Column(String)
    status = Column(String, default="running")
    output = Column(JSON, default=dict)

class TrendSnapshot(Base):
    __tablename__ = "trend_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    snapshot_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AudienceSnapshot(Base):
    __tablename__ = "audience_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    snapshot_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"))
    snapshot_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

# Phase 2 Models

class ContentBrief(Base):
    __tablename__ = "content_briefs"
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"))
    topic = Column(String)
    target_audience = Column(String)
    video_goal = Column(String)
    key_points = Column(JSON, default=list)
    content_angle = Column(String)
    competitor_reference = Column(JSON, default=list)
    estimated_length = Column(String)
    status = Column(String, default="draft") # draft, generated, approved
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Script(Base):
    __tablename__ = "scripts"
    id = Column(Integer, primary_key=True, index=True)
    brief_id = Column(Integer, ForeignKey("content_briefs.id"))
    hook = Column(String)
    introduction = Column(String)
    sections = Column(JSON, default=list) # List of dicts with content and narration
    cta = Column(String)
    status = Column(String, default="draft")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Storyboard(Base):
    __tablename__ = "storyboards"
    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("scripts.id"))
    scenes = Column(JSON, default=list) # List of scene dicts
    status = Column(String, default="draft")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class GenerationPrompt(Base):
    __tablename__ = "generation_prompts"
    id = Column(Integer, primary_key=True, index=True)
    storyboard_id = Column(Integer, ForeignKey("storyboards.id"), nullable=True)
    prompt_type = Column(String) # image, video, b-roll
    prompt_text = Column(String)
    parameters = Column(JSON, default=dict)

class GeneratedAsset(Base):
    __tablename__ = "generated_assets"
    id = Column(Integer, primary_key=True, index=True)
    storyboard_id = Column(Integer, ForeignKey("storyboards.id"))
    asset_type = Column(String) # image, generic
    provider = Column(String)
    url = Column(String)
    metadata_json = Column(JSON, default=dict)
    status = Column(String, default="completed")

class Voiceover(Base):
    __tablename__ = "voiceovers"
    id = Column(Integer, primary_key=True, index=True)
    storyboard_id = Column(Integer, ForeignKey("storyboards.id"))
    provider = Column(String) # elevenlabs, openai
    url = Column(String)
    duration = Column(Float, default=0.0)
    metadata_json = Column(JSON, default=dict)

class Subtitle(Base):
    __tablename__ = "subtitles"
    id = Column(Integer, primary_key=True, index=True)
    storyboard_id = Column(Integer, ForeignKey("storyboards.id"))
    provider = Column(String)
    url = Column(String) # vtt or srt url
    metadata_json = Column(JSON, default=dict)

class GeneratedVideo(Base):
    __tablename__ = "generated_videos"
    id = Column(Integer, primary_key=True, index=True)
    storyboard_id = Column(Integer, ForeignKey("storyboards.id"))
    url = Column(String)
    duration = Column(Float, default=0.0)
    status = Column(String, default="processing")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Thumbnail(Base):
    __tablename__ = "thumbnails"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("generated_videos.id"))
    url = Column(String)
    variant_name = Column(String)
    ab_test_winner = Column(String, nullable=True)

class VideoMetadata(Base):
    __tablename__ = "video_metadata"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("generated_videos.id"))
    title = Column(String)
    description = Column(String)
    tags = Column(JSON, default=list)
    hashtags = Column(JSON, default=list)

class PublishHistory(Base):
    __tablename__ = "publish_history"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("generated_videos.id"))
    youtube_video_id = Column(String, nullable=True)
    status = Column(String) # draft, scheduled, published
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

class PredictionAccuracy(Base):
    __tablename__ = "prediction_accuracy"
    id = Column(Integer, primary_key=True, index=True)
    publish_id = Column(Integer, ForeignKey("publish_history.id"))
    predicted_views = Column(Integer, nullable=True)
    actual_views = Column(Integer, nullable=True)
    accuracy_score = Column(Float, nullable=True)

