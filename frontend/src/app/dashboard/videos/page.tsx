"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Video, AlertCircle, ArrowRight, TrendingUp, TrendingDown, Clock, Zap } from "lucide-react"
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function VideosPage() {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchVideoData(storedId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchVideoData = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
      if (!res.ok) {
        throw new Error("Failed to fetch video insights")
      }
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (err: any) {
      setError(err.message || "An error occurred fetching video intelligence data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Extracting video patterns...</p>
      </div>
    )
  }

  if (!channelId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <Video className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Connected Channel</h2>
        <p className="text-zinc-400 text-sm">
          Please connect your YouTube channel on the Overview tab first to trace video intelligence.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const isNotAnalyzed = !data || data.analysis_status === "not_started"

  if (isNotAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <RefreshCw className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Analysis Required</h2>
        <p className="text-zinc-400 text-sm">
          A full AI analysis has not been performed on this channel yet. Go to the Overview page and click "Run AI Analysis" to extract video insights.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const videos = data.videos || []
  
  // Split long form and shorts
  const longFormVideos = videos.filter((v: any) => v.content_type === "LONG_FORM")
  const shortsVideos = videos.filter((v: any) => v.content_type === "SHORT")

  const bestLongForm = [...longFormVideos].sort((a: any, b: any) => b.view_count - a.view_count).slice(0, 3)
  const worstLongForm = [...longFormVideos].sort((a: any, b: any) => a.view_count - b.view_count).slice(0, 3)

  const bestShorts = [...shortsVideos].sort((a: any, b: any) => b.view_count - a.view_count).slice(0, 3)
  const worstShorts = [...shortsVideos].sort((a: any, b: any) => a.view_count - b.view_count).slice(0, 3)

  const longFormInsights = data.long_form_insights || {}
  const shortsInsights = data.shorts_insights || {}

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-zinc-800">
        <h2 className="text-3xl font-bold tracking-tight text-white">Video Intelligence</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Treating Shorts and Long-Form Videos as completely separate strategy domains.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: LONG FORM VIDEO INTELLIGENCE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-800">
          <Clock className="h-5 w-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">Long Form Strategy</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Winning Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {(longFormInsights.winning_patterns || ["Case-study based titles", "Thumbnail includes a recognizable brand logo"]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-rose-400 flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                Losing Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {(longFormInsights.losing_patterns || ["Long unbroken talking head segments", "Overly technical jargon in the first minute"]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Best Long Form */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Top Performing Long Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bestLongForm.map((vid: any) => (
                <div key={vid.id} className="flex items-center gap-3 p-2 rounded bg-zinc-950/60 border border-zinc-850">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{vid.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{Number(vid.view_count).toLocaleString()} views</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Worst Long Form */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Lowest Performing Long Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {worstLongForm.map((vid: any) => (
                <div key={vid.id} className="flex items-center gap-3 p-2 rounded bg-zinc-950/60 border border-zinc-850">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{vid.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{Number(vid.view_count).toLocaleString()} views</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 2: SHORTS VIDEO INTELLIGENCE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-800">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="text-xl font-bold text-white">Shorts Strategy</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Winning Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {(shortsInsights.winning_patterns || ["High pacing under 30s", "Bold captions in center", "Hook in first 2s"]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-rose-400 flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                Losing Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {(shortsInsights.losing_patterns || ["Slow transitions", "Silent intros", "Lack of text overlay"]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Best Shorts */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Top Performing Shorts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bestShorts.map((vid: any) => (
                <div key={vid.id} className="flex items-center gap-3 p-2 rounded bg-zinc-950/60 border border-zinc-850">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{vid.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{Number(vid.view_count).toLocaleString()} views</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Worst Shorts */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Lowest Performing Shorts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {worstShorts.map((vid: any) => (
                <div key={vid.id} className="flex items-center gap-3 p-2 rounded bg-zinc-950/60 border border-zinc-850">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{vid.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{Number(vid.view_count).toLocaleString()} views</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
