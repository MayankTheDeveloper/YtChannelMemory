from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.db.models import (
    User, Recommendation, ContentBrief, Script, Storyboard,
    GenerationPrompt, GeneratedAsset, GeneratedVideo, Thumbnail, VideoMetadata, PublishHistory
)
from app.langgraph.nodes.brief_agent import generate_brief
from app.langgraph.nodes.script_agent import generate_script
from app.langgraph.nodes.storyboard_agent import generate_storyboard
from app.langgraph.nodes.prompt_agent import generate_prompts
from app.langgraph.nodes.metadata_agent import generate_metadata, generate_thumbnail_prompts

from app.services.asset_generation import asset_service
from app.services.video_generation import video_agent
from app.services.video_assembly import video_assembly
from app.services.publishing import publisher

router = APIRouter()

@router.post("/content-briefs/generate")
async def create_content_brief(
    recommendation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch recommendation
    result = await db.execute(select(Recommendation).filter(Recommendation.id == recommendation_id))
    rec = result.scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec_data = {
        "title": rec.suggested_title,
        "reasoning": rec.reasoning,
        "evidence": rec.evidence
    }

    # Generate brief
    brief_data = generate_brief(rec_data)
    if not brief_data:
        raise HTTPException(status_code=500, detail="Failed to generate brief")

    # Save to DB
    brief = ContentBrief(
        recommendation_id=rec.id,
        topic=brief_data.get("topic"),
        target_audience=brief_data.get("target_audience"),
        video_goal=brief_data.get("video_goal"),
        key_points=brief_data.get("key_points", []),
        content_angle=brief_data.get("content_angle"),
        competitor_reference=brief_data.get("competitor_reference", []),
        estimated_length=brief_data.get("estimated_length"),
        status="generated"
    )
    db.add(brief)
    await db.commit()
    await db.refresh(brief)
    
    return {"status": "success", "data": brief}

@router.post("/scripts/generate")
async def create_script(
    brief_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ContentBrief).filter(ContentBrief.id == brief_id))
    brief = result.scalars().first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    brief_data = {
        "topic": brief.topic,
        "target_audience": brief.target_audience,
        "key_points": brief.key_points,
        "content_angle": brief.content_angle
    }

    script_data = generate_script(brief_data)
    if not script_data:
        raise HTTPException(status_code=500, detail="Failed to generate script")

    script = Script(
        brief_id=brief.id,
        hook=script_data.get("hook"),
        introduction=script_data.get("introduction"),
        sections=script_data.get("sections", []),
        cta=script_data.get("cta"),
        status="generated"
    )
    db.add(script)
    await db.commit()
    await db.refresh(script)

    return {"status": "success", "data": script}

@router.post("/storyboards/generate")
async def create_storyboard(
    script_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Script).filter(Script.id == script_id))
    script = result.scalars().first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    script_data = {
        "hook": script.hook,
        "introduction": script.introduction,
        "sections": script.sections,
        "cta": script.cta
    }

    storyboard_data = generate_storyboard(script_data)
    if not storyboard_data:
        raise HTTPException(status_code=500, detail="Failed to generate storyboard")

    storyboard = Storyboard(
        script_id=script.id,
        scenes=storyboard_data,
        status="generated"
    )
    db.add(storyboard)
    await db.commit()
    await db.refresh(storyboard)
    
    # Auto-generate prompts
    for scene in storyboard_data:
        prompts = generate_prompts(scene)
        for p in prompts:
            prompt_obj = GenerationPrompt(
                storyboard_id=storyboard.id,
                prompt_type=p.get("prompt_type"),
                prompt_text=p.get("prompt_text"),
                parameters=p.get("parameters", {})
            )
            db.add(prompt_obj)
            
    await db.commit()

    return {"status": "success", "data": storyboard}

@router.post("/assets/generate")
async def create_assets(
    storyboard_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Storyboard).filter(Storyboard.id == storyboard_id))
    storyboard = result.scalars().first()
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")

    # In production, this would be an async Celery task
    # We iterate over scenes and generate voiceover + images/videos
    
    assets = []
    for i, scene in enumerate(storyboard.scenes):
        if scene.get("narration"):
            vo_data = await asset_service.generate_voiceover(scene["narration"], "openai")
            vo_asset = GeneratedAsset(
                storyboard_id=storyboard.id,
                asset_type="voiceover",
                provider=vo_data["metadata"]["provider"],
                url=vo_data["url"],
                metadata_json=vo_data["metadata"]
            )
            db.add(vo_asset)
            assets.append(vo_data["url"])
            
    await db.commit()
    return {"status": "success", "message": "Assets generated"}

@router.post("/videos/generate")
async def create_video(
    storyboard_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Storyboard).filter(Storyboard.id == storyboard_id))
    storyboard = result.scalars().first()
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
        
    # Get prompts
    result = await db.execute(select(GenerationPrompt).filter(GenerationPrompt.storyboard_id == storyboard.id))
    prompts = result.scalars().all()
    
    scenes_for_assembly = []
    for p in prompts:
        video_data = await video_agent.generate(prompt=p.prompt_text)
        scenes_for_assembly.append({
            "video_url": video_data["url"],
            "audio_url": "mock_audio_url"
        })
        
    # Assemble
    final_url = video_assembly.assemble_video(scenes_for_assembly)
    
    video = GeneratedVideo(
        storyboard_id=storyboard.id,
        url=final_url,
        duration=5.0,
        status="completed"
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    
    return {"status": "success", "data": video}

@router.post("/publish")
async def publish_video(
    video_id: int,
    status: str = "draft",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GeneratedVideo).filter(GeneratedVideo.id == video_id))
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    yt_id = await publisher.publish_video(video.url, {"title": "Generated Video"}, status)
    
    pub_history = PublishHistory(
        video_id=video.id,
        youtube_video_id=yt_id,
        status=status
    )
    db.add(pub_history)
    await db.commit()
    
    return {"status": "success", "youtube_id": yt_id}

@router.put("/scripts/{script_id}")
async def update_script(
    script_id: int,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Script).filter(Script.id == script_id))
    script = result.scalars().first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    if "hook" in payload:
        script.hook = payload["hook"]
    if "introduction" in payload:
        script.introduction = payload["introduction"]
    if "sections" in payload:
        script.sections = payload["sections"]
    if "cta" in payload:
        script.cta = payload["cta"]
    
    script.status = "edited"
    await db.commit()
    await db.refresh(script)
    return {"status": "success", "data": script}

@router.post("/thumbnails/generate")
async def create_thumbnails(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For now mock fetching the video title and brief.
    title = "Mock Generated Title"
    brief_data = {"topic": "Mock Topic"}
    
    prompts = generate_thumbnail_prompts(brief_data, title)
    
    # Simulate generating actual images from prompts
    import asyncio
    await asyncio.sleep(2)
    
    saved_thumbnails = []
    for i, p in enumerate(prompts):
        thumb = Thumbnail(
            video_id=video_id,
            url=f"https://example.com/assets/images/thumb_{i}.png",
            variant_name=p.get("variant_name", f"Variant {i}")
        )
        db.add(thumb)
        saved_thumbnails.append(thumb)
        
    await db.commit()
    return {"status": "success", "message": "Thumbnails generated"}

@router.post("/schedule")
async def schedule_video(
    video_id: int,
    scheduled_time: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GeneratedVideo).filter(GeneratedVideo.id == video_id))
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    yt_id = await publisher.publish_video(video.url, {"title": "Generated Video"}, "scheduled")
    
    from datetime import datetime
    pub_history = PublishHistory(
        video_id=video.id,
        youtube_video_id=yt_id,
        status="scheduled",
        scheduled_for=datetime.fromisoformat(scheduled_time)
    )
    db.add(pub_history)
    await db.commit()
    
    return {"status": "success", "youtube_id": yt_id}

@router.get("/content-briefs")
async def list_content_briefs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ContentBrief).order_by(ContentBrief.created_at.desc()))
    briefs = result.scalars().all()
    data = []
    for b in briefs:
        data.append({
            "id": b.id,
            "recommendation_id": b.recommendation_id,
            "topic": b.topic,
            "target_audience": b.target_audience,
            "video_goal": b.video_goal,
            "key_points": b.key_points,
            "content_angle": b.content_angle,
            "competitor_reference": b.competitor_reference,
            "estimated_length": b.estimated_length,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return {"status": "success", "data": data}

@router.get("/content-briefs/{brief_id}")
async def get_content_brief(
    brief_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ContentBrief).filter(ContentBrief.id == brief_id))
    b = result.scalars().first()
    if not b:
        raise HTTPException(status_code=404, detail="Brief not found")
    return {
        "status": "success",
        "data": {
            "id": b.id,
            "recommendation_id": b.recommendation_id,
            "topic": b.topic,
            "target_audience": b.target_audience,
            "video_goal": b.video_goal,
            "key_points": b.key_points,
            "content_angle": b.content_angle,
            "competitor_reference": b.competitor_reference,
            "estimated_length": b.estimated_length,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
    }

@router.get("/scripts")
async def list_scripts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Script).order_by(Script.created_at.desc()))
    scripts = result.scalars().all()
    data = []
    for s in scripts:
        data.append({
            "id": s.id,
            "brief_id": s.brief_id,
            "hook": s.hook,
            "introduction": s.introduction,
            "sections": s.sections,
            "cta": s.cta,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return {"status": "success", "data": data}

@router.get("/scripts/{script_id}")
async def get_script(
    script_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Script).filter(Script.id == script_id))
    s = result.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Script not found")
    return {
        "status": "success",
        "data": {
            "id": s.id,
            "brief_id": s.brief_id,
            "hook": s.hook,
            "introduction": s.introduction,
            "sections": s.sections,
            "cta": s.cta,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
    }

@router.get("/storyboards")
async def list_storyboards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Storyboard).order_by(Storyboard.created_at.desc()))
    storyboards = result.scalars().all()
    data = []
    for s in storyboards:
        data.append({
            "id": s.id,
            "script_id": s.script_id,
            "scenes": s.scenes,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return {"status": "success", "data": data}

@router.get("/storyboards/{storyboard_id}")
async def get_storyboard(
    storyboard_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Storyboard).filter(Storyboard.id == storyboard_id))
    s = result.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    return {
        "status": "success",
        "data": {
            "id": s.id,
            "script_id": s.script_id,
            "scenes": s.scenes,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
    }

@router.get("/assets/{storyboard_id}")
async def get_storyboard_assets(
    storyboard_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GeneratedAsset).filter(GeneratedAsset.storyboard_id == storyboard_id))
    assets = result.scalars().all()
    data = []
    for a in assets:
        data.append({
            "id": a.id,
            "storyboard_id": a.storyboard_id,
            "asset_type": a.asset_type,
            "provider": a.provider,
            "url": a.url,
            "metadata_json": a.metadata_json,
            "status": a.status
        })
    return {"status": "success", "data": data}

@router.get("/videos")
async def list_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GeneratedVideo).order_by(GeneratedVideo.created_at.desc()))
    videos = result.scalars().all()
    data = []
    for v in videos:
        data.append({
            "id": v.id,
            "storyboard_id": v.storyboard_id,
            "url": v.url,
            "duration": v.duration,
            "status": v.status,
            "created_at": v.created_at.isoformat() if v.created_at else None
        })
    return {"status": "success", "data": data}

@router.get("/videos/{video_id}")
async def get_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GeneratedVideo).filter(GeneratedVideo.id == video_id))
    v = result.scalars().first()
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    return {
        "status": "success",
        "data": {
            "id": v.id,
            "storyboard_id": v.storyboard_id,
            "url": v.url,
            "duration": v.duration,
            "status": v.status,
            "created_at": v.created_at.isoformat() if v.created_at else None
        }
    }

@router.get("/thumbnails/{video_id}")
async def get_video_thumbnails(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Thumbnail).filter(Thumbnail.video_id == video_id))
    thumbs = result.scalars().all()
    data = []
    for t in thumbs:
        data.append({
            "id": t.id,
            "video_id": t.video_id,
            "url": t.url,
            "variant_name": t.variant_name,
            "ab_test_winner": t.ab_test_winner
        })
    return {"status": "success", "data": data}

@router.get("/publish/history/{video_id}")
async def get_publish_history(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(PublishHistory).filter(PublishHistory.video_id == video_id))
    history = result.scalars().all()
    data = []
    for h in history:
        data.append({
            "id": h.id,
            "video_id": h.video_id,
            "youtube_video_id": h.youtube_video_id,
            "status": h.status,
            "scheduled_for": h.scheduled_for.isoformat() if h.scheduled_for else None,
            "published_at": h.published_at.isoformat() if h.published_at else None
        })
    return {"status": "success", "data": data}
