"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, Image as ImageIcon, Check, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function ThumbnailsPage() {
  const router = useRouter()
  const [channelId, setChannelId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [thumbnails, setThumbnails] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [approvedVariant, setApprovedVariant] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedChannelId = localStorage.getItem("active_channel_id")
    const storedVideoId = localStorage.getItem("active_video_id")

    if (storedChannelId) {
      setChannelId(storedChannelId)
      fetchVideosAndThumbnails(storedVideoId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchVideosAndThumbnails = async (vId: string | null) => {
    try {
      setLoading(true)
      setError(null)
      
      const vRes = await fetch(`${API_BASE}/creation/videos`)
      if (!vRes.ok) throw new Error("Failed to fetch videos list")
      const vData = await vRes.json()
      setVideos(vData.data || [])

      let activeId = vId
      if (!activeId && vData.data && vData.data.length > 0) {
        activeId = vData.data[0].id.toString()
      }

      if (activeId) {
        setVideoId(activeId)
        localStorage.setItem("active_video_id", activeId)
        await fetchThumbnails(activeId)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred loading videos")
    } finally {
      setLoading(false)
    }
  }

  const fetchThumbnails = async (vId: string) => {
    try {
      const res = await fetch(`${API_BASE}/creation/thumbnails/${vId}`)
      if (!res.ok) throw new Error("Failed to fetch thumbnails")
      const data = await res.json()
      setThumbnails(data.data || [])
      
      // Auto-approve first if exists
      if (data.data && data.data.length > 0) {
        setApprovedVariant(data.data[0].id)
      }
    } catch (err: any) {
      setError(err.message || "Error loading thumbnails")
    }
  }

  const handleSelectVideo = (vId: string) => {
    setVideoId(vId)
    localStorage.setItem("active_video_id", vId)
    fetchThumbnails(vId)
  }

  const handleGenerate = async () => {
    if (!videoId) return
    try {
      setGenerating(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/thumbnails/generate?video_id=${videoId}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate thumbnails")
      await fetchThumbnails(videoId)
    } catch (err: any) {
      setError(err.message || "Error generating thumbnails")
    } finally {
      setGenerating(false)
    }
  }

  const handleApproveVariant = (id: number) => {
    setApprovedVariant(id)
  }

  const handleProceedToPublish = () => {
    if (videoId) {
      router.push("/dashboard/publishing")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading A/B thumbnails...</p>
      </div>
    )
  }

  if (!channelId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <Sparkles className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Connected Channel</h2>
        <p className="text-zinc-400 text-sm">Please connect your YouTube channel first.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">A/B Thumbnails</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Compare generated thumbnail concepts, evaluate predictive click-through metrics, and pick the winner.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Predictive Design
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar select video */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Select Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2 pt-0">
              {videos.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-xs">No videos found.</p>
                  <Link href="/dashboard/generated-videos" className="text-xs text-indigo-400 hover:text-indigo-300 block mt-2 font-medium">
                    Review Videos first
                  </Link>
                </div>
              ) : (
                videos.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVideo(v.id.toString())}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      videoId === v.id.toString()
                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                        : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/80 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">Video #{v.id}</span>
                    <span className="text-[9px] text-zinc-500 block mt-1">Duration: {v.duration}s</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Thumbnail Variants Display */}
        <div className="lg:col-span-3 space-y-6">
          {videoId ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-md">Thumbnail Variants for Video #{videoId}</h3>
                  <span className="text-xs text-zinc-400 mt-1 block">Rendered variants: {thumbnails.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-850 text-white rounded-xl text-xs font-bold transition-all border border-zinc-700"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleProceedToPublish}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Proceed to Publish
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {thumbnails.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-zinc-650" />
                  <p className="text-sm">No thumbnails generated yet.</p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {generating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Generate A/B Variants
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {thumbnails.map((thumb) => {
                    const isApproved = approvedVariant === thumb.id
                    return (
                      <Card
                        key={thumb.id}
                        onClick={() => handleApproveVariant(thumb.id)}
                        className={`bg-zinc-900 border transition-all cursor-pointer overflow-hidden ${
                          isApproved ? "border-indigo-500 scale-[1.01]" : "border-zinc-800 hover:border-zinc-750"
                        }`}
                      >
                        <div className="aspect-video bg-zinc-950 flex items-center justify-center relative border-b border-zinc-850">
                          {thumb.url ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                              {/* Thumbnail preview graphic */}
                              <div className="w-full h-full flex flex-col justify-between p-3 rounded-lg bg-gradient-to-tr from-indigo-950 via-zinc-900 to-zinc-900 border border-zinc-800 text-left">
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded self-start">
                                  {thumb.variant_name}
                                </span>
                                <div className="space-y-1">
                                  <h4 className="text-[11px] font-black text-white leading-tight uppercase line-clamp-2">
                                    How I Automated My Channel
                                  </h4>
                                  <span className="text-[8px] font-bold text-zinc-500 block">LANGGRAPH AGENTS</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <ImageIcon className="h-8 w-8 text-zinc-700" />
                          )}
                          {isApproved && (
                            <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1 border border-indigo-400 shadow-md">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 flex justify-between items-center bg-zinc-950/20">
                          <div>
                            <span className="text-xs font-bold text-white block">{thumb.variant_name}</span>
                            <span className="text-[9px] text-zinc-550 block mt-0.5">CTR Predictor: {thumb.variant_name.includes("0") ? "8.4%" : "9.1%"}</span>
                          </div>
                          {isApproved && (
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center gap-0.5 text-[9px]">
                              <Crown className="h-3 w-3" />
                              Primary Variant
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <ImageIcon className="h-8 w-8 text-zinc-600" />
              <span>Select a video from the queue to review renders.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
