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

    channel = relationship("Channel", back_populates="recommendations")

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
