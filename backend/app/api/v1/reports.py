import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.api.deps import get_db, get_current_user
from app.db.models import User, Channel, AudienceInsight, Recommendation
from fpdf import FPDF

router = APIRouter()

class PDFReport(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Channel Intelligence Report', 0, 1, 'C')

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

@router.get("/channel/{channel_id}")
async def get_channel_report(
    channel_id: int,
    format: Optional[str] = Query("json", description="json or pdf"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Channel).filter(Channel.id == channel_id, Channel.user_id == current_user.id))
    channel = result.scalars().first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    aud_result = await db.execute(select(AudienceInsight).filter(AudienceInsight.channel_id == channel_id))
    aud_insight = aud_result.scalars().first()

    rec_result = await db.execute(select(Recommendation).filter(Recommendation.channel_id == channel_id))
    recommendations = rec_result.scalars().all()

    report_data = {
        "channel_title": channel.title,
        "health_score": channel.health_score,
        "audience": {
            "personas": aud_insight.personas if aud_insight else [],
            "interests": aud_insight.interests if aud_insight else [],
        },
        "opportunities": [
            {
                "title": r.suggested_title,
                "confidence": r.confidence_score,
                "overall_score": (r.audience_score + r.historical_score + r.trend_score + r.competition_score) / 4 if (r.audience_score) else 0
            }
            for r in recommendations
        ]
    }

    if format == "pdf":
        pdf = PDFReport()
        pdf.add_page()
        
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, f"Channel: {report_data['channel_title']}", 0, 1)
        pdf.cell(0, 10, f"Health Score: {report_data['health_score']}/100", 0, 1)
        
        pdf.ln(5)
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, "Audience Personas", 0, 1)
        pdf.set_font("helvetica", "", 10)
        for p in report_data["audience"]["personas"]:
            pdf.cell(0, 8, f"- {p}", 0, 1)
            
        pdf.ln(5)
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, "Top Opportunities", 0, 1)
        pdf.set_font("helvetica", "", 10)
        for o in report_data["opportunities"]:
            pdf.cell(0, 8, f"- {o['title']} (Score: {o['overall_score']})", 0, 1)
            
        filename = f"/tmp/report_{channel_id}.pdf"
        pdf.output(filename)
        return FileResponse(filename, media_type="application/pdf", filename=f"{channel.title}_Report.pdf")

    return JSONResponse(content=report_data)
