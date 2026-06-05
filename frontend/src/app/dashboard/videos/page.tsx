"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RefreshCw, Video, AlertCircle, ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
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

  const isNotAnalyzed = !data || data.analysis_status === "not_started" || !data.video_insights || (!data.video_insights.winning_patterns?.length && !data.video_insights.losing_patterns?.length)

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

  const insights = data.video_insights
  const videos = data.videos || []
  
  // Sort videos by views descending for best performing
  const bestVideos = [...videos].sort((a: any, b: any) => b.view_count - a.view_count).slice(0, 4)
  // Sort videos by views ascending for lowest performing
  const worstVideos = [...videos].sort((a: any, b: any) => a.view_count - b.view_count).slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-800">
        <h2 className="text-3xl font-bold tracking-tight text-white">Video Intelligence</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Historical analysis of your channel's best and worst performing videos.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Winning Patterns
            </CardTitle>
            <CardDescription className="text-zinc-400">Content and editing style elements common in your viral videos.</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.winning_patterns && insights.winning_patterns.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {insights.winning_patterns.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-zinc-500 text-sm">No winning patterns identified yet.</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-rose-400 flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-rose-400" />
              Losing Patterns
            </CardTitle>
            <CardDescription className="text-zinc-400">Content structures that cause viewers to drop off early.</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.losing_patterns && insights.losing_patterns.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {insights.losing_patterns.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-zinc-500 text-sm">No losing patterns identified yet.</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Top Performing Videos</CardTitle>
            <CardDescription className="text-zinc-400">Your uploads with the highest public view counts.</CardDescription>
          </CardHeader>
          <CardContent>
            {bestVideos.length > 0 ? (
              <div className="space-y-3">
                {bestVideos.map((vid: any, i: number) => (
                  <div key={vid.id || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    {vid.thumbnail_url && (
                      <img src={vid.thumbnail_url} alt="" className="w-16 h-10 rounded object-cover border border-zinc-850 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate" title={vid.title}>{vid.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{Number(vid.view_count).toLocaleString()} views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-zinc-500 text-sm">No videos ingested yet.</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Lowest Performing Videos</CardTitle>
            <CardDescription className="text-zinc-400">Uploads with the lowest public views (potential strategy updates needed).</CardDescription>
          </CardHeader>
          <CardContent>
            {worstVideos.length > 0 ? (
              <div className="space-y-3">
                {worstVideos.map((vid: any, i: number) => (
                  <div key={vid.id || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    {vid.thumbnail_url && (
                      <img src={vid.thumbnail_url} alt="" className="w-16 h-10 rounded object-cover border border-zinc-850 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate" title={vid.title}>{vid.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{Number(vid.view_count).toLocaleString()} views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-zinc-500 text-sm">No videos ingested yet.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
