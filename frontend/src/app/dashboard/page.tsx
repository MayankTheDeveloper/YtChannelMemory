"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sparkles, RefreshCw, Trash2, ArrowRight, Video, Users, Activity, AlertCircle, CheckCircle2, ExternalLink, Zap, Clock, TrendingUp } from "lucide-react"
import Link from 'next/link'

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
  "Shorts Analysis Agent: Extracting hook & pacing patterns...",
  "Long Form Analysis Agent: Analyzing watch time & topic clusters...",
  "Competitor Agent: Identifying competitor content gaps...",
  "Trend Agent: Computing velocity of emerging topics...",
  "Hindsight Memory: Recalling past strategy iterations...",
  "Shorts Strategy Agent: Formulating reach optimized brief ideas...",
  "Long Form Strategy Agent: Formulating watch-time optimized briefs...",
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
      </div>
    )
  }

  if (analyzing) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-8">
        <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 animate-pulse mb-4">
          <Sparkles className="h-12 w-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">LangGraph Pipeline Active</h1>
          <p className="text-zinc-400 text-base max-w-md mx-auto">
            Autonomous agents are analyzing your Shorts & Long-Form videos, and community comments to synthesize separate content strategies.
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

  const channel = data?.channel
  const videos = data?.videos || []
  const analysisStatus = data?.analysis_status || "not_started"

  // Split videos
  const longFormVideos = videos.filter((v: any) => v.content_type === "LONG_FORM")
  const shortsVideos = videos.filter((v: any) => v.content_type === "SHORT")

  // Split recommendations
  const longFormRecs = data?.long_form_recommendations || []
  const shortsRecs = data?.shorts_recommendations || []

  // Extract insights
  const longFormInsights = data?.long_form_insights || {}
  const shortsInsights = data?.shorts_insights || {}

  return (
    <div className="space-y-6">
      {/* Header */}
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 animate-shimmer"
          >
            <Sparkles className="h-4 w-4" />
            Run Separate AI Analysis
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

      {/* Metrics Row */}
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
            <p className="text-xs text-zinc-500 mt-1">Channel reach status</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Videos (Ingested)</CardTitle>
            <Video className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {longFormVideos.length} Long / {shortsVideos.length} Shorts
            </div>
            <p className="text-xs text-zinc-500 mt-1">Split ecosystems</p>
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
            <p className="text-xs text-zinc-500 mt-1">Weighted engagement</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">AI Intelligence</CardTitle>
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
            <p className="text-xs text-zinc-500 mt-1">Separate analysis state</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Columns: Long Form Insights vs Shorts Insights */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        
        {/* LONG FORM INSIGHTS COLUMN */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Clock className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">Long Form Insights</h2>
          </div>

          {/* Long Form Videos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Ingested Videos ({longFormVideos.length})</CardTitle>
              <CardDescription className="text-zinc-500">Long-form video uploads analyzed.</CardDescription>
            </CardHeader>
            <CardContent>
              {longFormVideos.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">No long-form videos imported.</p>
              ) : (
                <div className="space-y-2">
                  {longFormVideos.slice(0, 4).map((vid: any) => (
                    <div key={vid.id} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate max-w-[240px]">{vid.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 shrink-0">
                        <span>{Number(vid.view_count).toLocaleString()} views</span>
                        <a href={`https://youtube.com/watch?v=${vid.youtube_video_id}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Long Form Patterns */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-indigo-400 text-base">Long-Form Strategy Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Topic Clusters:</h4>
                <div className="flex flex-wrap gap-2">
                  {(longFormInsights.topic_clusters || ["AI Tutorials", "SaaS Case Studies"]).map((c: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Winning Formats:</h4>
                <ul className="list-disc pl-5 text-zinc-400 space-y-1">
                  {(longFormInsights.winning_patterns || ["Case-study based titles", "Thumbnail includes a recognizable brand logo"]).map((p: string, idx: number) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Long Form Recommendations */}
          <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Top Long-Form Recommendations</CardTitle>
                <Link href="/dashboard/recommendations" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {longFormRecs.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">Run analysis to generate recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {longFormRecs.slice(0, 3).map((rec: any, idx: number) => (
                    <div key={rec.id || idx} className="p-3 bg-zinc-950 rounded border border-zinc-850 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white max-w-[80%]">{rec.title}</h4>
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{rec.confidence_score}%</Badge>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SHORTS INSIGHTS COLUMN */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Zap className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Shorts Insights</h2>
          </div>

          {/* Shorts Videos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Ingested Shorts ({shortsVideos.length})</CardTitle>
              <CardDescription className="text-zinc-500">Shorts uploads analyzed.</CardDescription>
            </CardHeader>
            <CardContent>
              {shortsVideos.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">No Shorts imported.</p>
              ) : (
                <div className="space-y-2">
                  {shortsVideos.slice(0, 4).map((vid: any) => (
                    <div key={vid.id} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/40 hover:bg-zinc-800/40 transition-colors">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate max-w-[240px]">{vid.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 shrink-0">
                        <span>{Number(vid.view_count).toLocaleString()} views</span>
                        <a href={`https://youtube.com/watch?v=${vid.youtube_video_id}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shorts Patterns */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-400 text-base">Shorts Strategy Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                  <span className="text-zinc-500 block">Avg Duration:</span>
                  <span className="text-white font-bold text-sm">{shortsInsights.average_duration_seconds || 35}s</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/50">
                  <span className="text-zinc-500 block">Hook Strategy:</span>
                  <span className="text-white font-bold text-sm">Visual Action</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Hook Patterns:</h4>
                <ul className="list-disc pl-5 text-zinc-400 space-y-1">
                  {(shortsInsights.hook_patterns || ["Did you know that...?", "Stop doing this wrong!"]).map((h: string, idx: number) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Shorts Recommendations */}
          <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Top Shorts Recommendations</CardTitle>
                <Link href="/dashboard/recommendations" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {shortsRecs.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">Run analysis to generate recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {shortsRecs.slice(0, 3).map((rec: any, idx: number) => (
                    <div key={rec.id || idx} className="p-3 bg-zinc-950 rounded border border-zinc-850 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white max-w-[80%]">{rec.title}</h4>
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">{rec.confidence_score}%</Badge>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
