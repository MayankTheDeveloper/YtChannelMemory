"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sparkles, RefreshCw, Trash2, ArrowRight, Video, Users, Activity, AlertCircle, FileText, CheckCircle2 } from "lucide-react"

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const AGENT_STEPS = [
  "Ingesting YouTube comments & audience signals...",
  "Audience Agent: Profiling viewer segments & pain points...",
  "Video Agent: Extracting winning & losing content patterns...",
  "Competitor Agent: Identifying competitor content gaps...",
  "Trend Agent: Computing velocity of emerging topics...",
  "Hindsight Memory: Recalling past strategy iterations...",
  "Strategy Agent: Formulating high-confidence content briefs...",
  "Memory Retain: Storing predictions for outcome tracking..."
]

export default function DashboardPage() {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [channelUrl, setChannelUrl] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [agentStep, setAgentStep] = useState(0)
  const [progressVal, setProgressVal] = useState(0)

  const pollIntervalRef = useRef<any>(null)
  const stepIntervalRef = useRef<any>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchDashboard(storedId)
    } else {
      setLoading(false)
    }

    return () => {
      clearInterval(pollIntervalRef.current)
      clearInterval(stepIntervalRef.current)
    }
  }, [])

  const fetchDashboard = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
      if (!res.ok) {
        if (res.status === 404) {
          // Channel not found in db, reset local storage
          localStorage.removeItem("active_channel_id")
          setChannelId(null)
          setData(null)
        } else {
          throw new Error("Failed to load channel dashboard data")
        }
        return
      }
      const dashboardData = await res.json()
      setData(dashboardData)

      if (dashboardData.analysis_status === "running") {
        setAnalyzing(true)
        startPolling(id)
      } else {
        setAnalyzing(false)
        clearInterval(pollIntervalRef.current)
        clearInterval(stepIntervalRef.current)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (id: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current)

    // Dynamic fake progress
    setProgressVal(10)
    setAgentStep(0)

    stepIntervalRef.current = setInterval(() => {
      setAgentStep((prev) => {
        const next = prev + 1
        if (next < AGENT_STEPS.length) {
          setProgressVal((next + 1) * (100 / AGENT_STEPS.length))
          return next
        }
        return prev
      })
    }, 2500)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
        if (res.ok) {
          const dashboardData = await res.json()
          if (dashboardData.analysis_status !== "running") {
            setData(dashboardData)
            setAnalyzing(false)
            setProgressVal(100)
            clearInterval(pollIntervalRef.current)
            clearInterval(stepIntervalRef.current)
          }
        }
      } catch (e) {
        console.error("Error polling status", e)
      }
    }, 3000)
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelUrl.trim()) return

    setConnecting(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/import/channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_url: channelUrl })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to import YouTube channel")
      }

      const imported = await res.json()
      localStorage.setItem("active_channel_id", String(imported.channel_id))
      setChannelId(String(imported.channel_id))
      
      // Auto trigger analysis on first import to make UX smooth
      await triggerAnalysis(String(imported.channel_id))
    } catch (err: any) {
      setError(err.message || "Could not connect to YouTube channel")
      setConnecting(false)
    }
  }

  const triggerAnalysis = async (id: string) => {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/import/channel/${id}/analyze`, {
        method: "POST"
      })
      if (!res.ok) {
        throw new Error("Failed to start AI analysis pipeline")
      }
      startPolling(id)
    } catch (err: any) {
      setError(err.message || "Error running analysis")
      setAnalyzing(false)
    }
  }

  const handleDisconnect = () => {
    if (confirm("Disconnect this channel? You can reconnect it or another channel anytime.")) {
      localStorage.removeItem("active_channel_id")
      setChannelId(null)
      setData(null)
      setError(null)
      setChannelUrl('')
      clearInterval(pollIntervalRef.current)
      clearInterval(stepIntervalRef.current)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Recalling Hindsight State...</p>
      </div>
    )
  }

  // CONNECTION VIEW
  if (!channelId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
            <Youtube className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Connect YouTube Channel</h1>
          <p className="text-zinc-400 text-lg">
            Import your channel data using public URL or handle. The AI will ingest your videos, comments, and build long-term memory.
          </p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Channel Link or Handle</CardTitle>
            <CardDescription className="text-zinc-400">
              Paste a full channel URL (e.g. `https://youtube.com/@mkbhd`) or enter handle (e.g. `@fireship`)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="https://youtube.com/@handle"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  disabled={connecting}
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 disabled:opacity-50"
                />
                <Button 
                  type="submit" 
                  disabled={connecting} 
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Connect
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-zinc-900/30 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Hindsight Memory System
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400 leading-relaxed">
              Every content suggestion uses memory loops. The platform remembers previous ideas, audience feedback, and compounding strategy refinements.
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/30 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
                <Users className="h-4 w-4 text-blue-500" />
                Audience Demands
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400 leading-relaxed">
              Reads the comments to trace user interests, friction, and burning questions, ensuring that proposed scripts target actual demand.
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ANALYZING STATE
  if (analyzing) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-8">
        <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 animate-pulse mb-4">
          <Sparkles className="h-12 w-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">LangGraph Pipeline Active</h1>
          <p className="text-zinc-400 text-base max-w-md mx-auto">
            Autonomous agents are analyzing your YouTube video performance and community feedback comments to synthesize channel intelligence.
          </p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-md p-6 space-y-6">
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400 font-semibold">Pipeline Progress</span>
              <span className="text-indigo-400 font-semibold">{Math.round(progressVal)}%</span>
            </div>
            <Progress value={progressVal} className="h-2 bg-zinc-950" />
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-zinc-950 rounded-xl border border-zinc-850">
            <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
            <span className="text-white text-sm font-medium">{AGENT_STEPS[agentStep]}</span>
          </div>
        </Card>
      </div>
    )
  }

  // FULL DASHBOARD OVERVIEW VIEW
  const channel = data?.channel
  const videos = data?.videos || []
  const analysisStatus = data?.analysis_status || "not_started"

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{channel?.title || "My Channel"}</h1>
            <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5 gap-1 py-0.5">
              <Youtube className="h-3 w-3" />
              Connected
            </Badge>
          </div>
          <p className="text-zinc-400 mt-1 max-w-2xl text-sm truncate">
            {channel?.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => triggerAnalysis(channelId)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Run AI Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {channel?.subscriber_count ? Number(channel.subscriber_count).toLocaleString() : "0"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Live from YouTube API</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Videos Ingested</CardTitle>
            <Video className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {videos.length || channel?.video_count || "0"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Recent uploads analyzed</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Channel Health Score</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {channel?.health_score ? `${Math.round(channel.health_score)}/100` : "N/A"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Based on engagement signals</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Analysis Status</CardTitle>
            {analysisStatus === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white capitalize">
              {analysisStatus.replace("_", " ")}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {analysisStatus === "completed" ? "Insights updated" : "Run analysis to generate tips"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Videos List Grid */}
      <div className="grid gap-6 grid-cols-1">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Videos Ingested</CardTitle>
            <CardDescription className="text-zinc-400">
              Videos fetched from the public uploads feed of your channel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">No videos imported yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-950 text-xs text-zinc-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">Video</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Likes</th>
                      <th className="px-4 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {videos.slice(0, 8).map((vid: any) => (
                      <tr key={vid.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                          {vid.thumbnail_url ? (
                            <img 
                              src={vid.thumbnail_url} 
                              alt="" 
                              className="w-16 h-9 rounded object-cover border border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              <Video className="h-4 w-4 text-zinc-500" />
                            </div>
                          )}
                          <span className="truncate max-w-md" title={vid.title}>
                            {vid.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {Number(vid.view_count).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-400">
                          {Number(vid.like_count).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <a 
                            href={`https://youtube.com/watch?v=${vid.youtube_video_id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            Watch
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
