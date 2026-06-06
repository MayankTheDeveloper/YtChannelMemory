"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, Play, FileText, CheckCircle, Video } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function GeneratedVideosPage() {
  const router = useRouter()
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<any[]>([])
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null)
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Metadata form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchVideos()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/videos`)
      if (!res.ok) throw new Error("Failed to fetch generated videos")
      const data = await res.json()
      setVideos(data.data || [])

      if (data.data && data.data.length > 0) {
        selectVideo(data.data[0])
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching videos")
    } finally {
      setLoading(false)
    }
  }

  const selectVideo = (video: any) => {
    setSelectedVideo(video)
    setTitle("How I Automated My YouTube Channel with LangGraph Agents") // Dynamic default or fallback
    setDescription("In this video, I walk through the exact architecture and code required to build a fully stateful, database-backed YouTube memory agent using LangGraph, React, and FastAPI.")
  }

  const handleGenerateThumbnails = async () => {
    if (!selectedVideo) return
    try {
      setGeneratingThumbnails(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/thumbnails/generate?video_id=${selectedVideo.id}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate thumbnail variants")
      
      localStorage.setItem("active_video_id", selectedVideo.id.toString())
      router.push("/dashboard/thumbnails")
    } catch (err: any) {
      setError(err.message || "Error generating thumbnails")
    } finally {
      setGeneratingThumbnails(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading compiled video assemblies...</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Compiled Videos</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Review final assembled videos, customize titles/descriptions, and initiate A/B thumbnail renders.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Studio Assembly
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar select */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Video Outputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2 pt-0">
              {videos.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-xs">No compiled videos found.</p>
                  <Link href="/dashboard/assets" className="text-xs text-indigo-400 hover:text-indigo-300 block mt-2 font-medium">
                    Compile Assets first
                  </Link>
                </div>
              ) : (
                videos.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVideo(v)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedVideo?.id === v.id
                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                        : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/80 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">Video #{v.id}</span>
                    <span className="text-[9px] text-zinc-500 block mt-1">Duration: {v.duration}s &bull; Status: {v.status}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Player & Metadata fields */}
        <div className="lg:col-span-3">
          {selectedVideo ? (
            <div className="space-y-6">
              {/* Custom Player mockup */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-zinc-950 relative flex items-center justify-center border-b border-zinc-850">
                    {selectedVideo.url ? (
                      <video
                        src={selectedVideo.url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center space-y-2 text-zinc-500">
                        <Video className="h-10 w-10 mx-auto text-zinc-700 animate-pulse" />
                        <p className="text-sm">Simulated Render Preview</p>
                        <p className="text-xs text-zinc-605">URL: {selectedVideo.url || "mock_assembly.mp4"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="py-3 px-6 bg-zinc-950/40 flex justify-between items-center text-xs text-zinc-400">
                  <span>Compiled: {new Date(selectedVideo.created_at).toLocaleString()}</span>
                  <span>Duration: {selectedVideo.duration}s</span>
                </CardFooter>
              </Card>

              {/* Metadata Details Form */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-md font-bold text-white">Video Details (Metadata)</CardTitle>
                  <CardDescription className="text-zinc-400 text-xs">
                    Write optimal keywords to match recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Video Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Title details..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Video Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full min-h-[120px] p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Add description..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-850 p-4 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500">A/B tests help predict click-through rates.</span>
                  <button
                    onClick={handleGenerateThumbnails}
                    disabled={generatingThumbnails}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                  >
                    {generatingThumbnails ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Thumbnails...
                      </>
                    ) : (
                      <>
                        Approve &amp; Generate Thumbnails
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Play className="h-8 w-8 text-zinc-600" />
              <span>Select a video to verify output layout.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
