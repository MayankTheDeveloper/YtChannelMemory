"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, Calendar, Send, CheckCircle, Video, Play, ExternalLink } from "lucide-react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function PublishingPage() {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<any[]>([])
  const [publishing, setPublishing] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Scheduling states
  const [scheduleTime, setScheduleTime] = useState("")

  useEffect(() => {
    const storedChannelId = localStorage.getItem("active_channel_id")
    const storedVideoId = localStorage.getItem("active_video_id")

    if (storedChannelId) {
      setChannelId(storedChannelId)
      fetchVideosAndHistory(storedVideoId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchVideosAndHistory = async (vId: string | null) => {
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
        await fetchHistory(activeId)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching records")
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (vId: string) => {
    try {
      const res = await fetch(`${API_BASE}/creation/publish/history/${vId}`)
      if (!res.ok) throw new Error("Failed to fetch publish history")
      const data = await res.json()
      setHistory(data.data || [])
    } catch (err: any) {
      setError(err.message || "Error loading publish logs")
    }
  }

  const handleSelectVideo = (vId: string) => {
    setVideoId(vId)
    localStorage.setItem("active_video_id", vId)
    fetchHistory(vId)
    setSuccessMsg(null)
  }

  const handlePublish = async (status: string) => {
    if (!videoId) return
    try {
      setPublishing(true)
      setError(null)
      setSuccessMsg(null)

      let res
      if (status === "published") {
        res = await fetch(`${API_BASE}/creation/publish?video_id=${videoId}&status=public`, {
          method: "POST"
        })
      } else {
        if (!scheduleTime) {
          throw new Error("Please select a date and time to schedule publishing.")
        }
        res = await fetch(`${API_BASE}/creation/schedule?video_id=${videoId}&scheduled_time=${new Date(scheduleTime).toISOString()}`, {
          method: "POST"
        })
      }

      if (!res.ok) throw new Error("Failed to submit publishing trigger")
      const data = await res.json()

      setSuccessMsg(status === "published" ? "Video published instantly to YouTube!" : "Video scheduled for publishing successfully.")
      await fetchHistory(videoId)
    } catch (err: any) {
      setError(err.message || "Publishing request failed")
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading publishing console...</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Publishing Console</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Push your content to YouTube instantly or schedule a planned strategic release.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Publisher
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
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
                  <p className="text-zinc-500 text-xs">No videos ready to publish.</p>
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

        {/* Form panel */}
        <div className="lg:col-span-3 space-y-6">
          {videoId ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Release immediately */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-md text-white flex items-center gap-2">
                      <Send className="h-5 w-5 text-indigo-400" />
                      Publish Instantly
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">
                      Push this video public on YouTube right now.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-zinc-500 mb-6">
                      Make sure your approved title, description, and thumbnail variant are locked. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => handlePublish("published")}
                      disabled={publishing}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all"
                    >
                      {publishing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Public Release
                          <ExternalLink className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>

                {/* Schedule for later */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-md text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-400" />
                      Schedule Release
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">
                      Select date and time for scheduled launch.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      onClick={() => handlePublish("scheduled")}
                      disabled={publishing}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-750 disabled:bg-zinc-850 border border-zinc-700 text-white font-bold rounded-xl text-sm transition-all"
                    >
                      {publishing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Schedule Launch
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Publish log */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-md font-bold text-white flex items-center gap-2">
                    <Video className="h-5 w-5 text-zinc-400" />
                    Publishing History &amp; Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {history.length === 0 ? (
                    <p className="text-zinc-500 text-xs text-center py-6">No publish attempts recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((log) => (
                        <div key={log.id} className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-white block">Log ID: #{log.id}</span>
                            <span className="text-[10px] text-zinc-500 block">
                              YouTube Video ID: <span className="font-mono text-zinc-400">{log.youtube_video_id || "MOCK_YT_ID"}</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <Badge className={`capitalize py-0.5 text-[9px] ${
                              log.status === "public" || log.status === "published"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {log.status}
                            </Badge>
                            <span className="text-[9px] text-zinc-550 block mt-1">
                              {log.published_at ? new Date(log.published_at).toLocaleString() : log.scheduled_for ? `Scheduled: ${new Date(log.scheduled_for).toLocaleString()}` : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Calendar className="h-8 w-8 text-zinc-600" />
              <span>Select a video to view publishing options.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
