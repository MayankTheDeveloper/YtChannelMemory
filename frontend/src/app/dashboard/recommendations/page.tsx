"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, BrainCircuit, Activity } from "lucide-react"
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function RecommendationsPage() {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchRecommendations(storedId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchRecommendations = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
      if (!res.ok) {
        throw new Error("Failed to fetch content recommendations")
      }
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (err: any) {
      setError(err.message || "An error occurred fetching recommendations data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Synthesizing strategy recommendations...</p>
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
        <p className="text-zinc-400 text-sm">
          Please connect your YouTube channel on the Overview tab first to start generating recommendations.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const recommendations = data?.recommendations || []
  const isNotAnalyzed = !data || data.analysis_status === "not_started" || recommendations.length === 0

  if (isNotAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <RefreshCw className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Analysis Required</h2>
        <p className="text-zinc-400 text-sm">
          A full AI analysis has not been performed on this channel yet. Go to the Overview page and click "Run AI Analysis" to generate strategy tips.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">AI Content Recommendations</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Compounding growth opportunities based on historical wins and current comment signals.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3 hidden sm:inline-flex">
          Powered by Hindsight Memory
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6">
        {recommendations.map((rec: any, i: number) => {
          let reasoningList: string[] = []
          try {
            if (rec.reasoning) {
              if (rec.reasoning.trim().startsWith("[")) {
                reasoningList = JSON.parse(rec.reasoning)
              } else {
                reasoningList = [rec.reasoning]
              }
            }
          } catch (e) {
            reasoningList = [rec.reasoning]
          }

          return (
            <Card key={rec.id || i} className="bg-zinc-900 border-zinc-800 border-l-4 border-l-indigo-500 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-white font-bold">{rec.title}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Recommendation #{i + 1} &bull; Confidence Match
                    </CardDescription>
                  </div>
                  
                  {/* Scores Grid */}
                  <div className="flex items-center gap-6 self-start">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <div className="flex items-center justify-between gap-2">
                        <span>Audience Match:</span>
                        <span className="font-semibold text-zinc-200">{Math.round(rec.audience_score || rec.confidence_score)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Historical Win:</span>
                        <span className="font-semibold text-zinc-200">{Math.round(rec.historical_score || rec.confidence_score)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Trend Velocity:</span>
                        <span className="font-semibold text-zinc-200">{Math.round(rec.trend_score || rec.confidence_score)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Competitor Gap:</span>
                        <span className="font-semibold text-zinc-200">{Math.round(rec.competition_score || rec.confidence_score)}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 text-center shrink-0">
                      <span className="text-3xl font-extrabold text-indigo-400">{Math.round(rec.confidence_score)}%</span>
                      <span className="text-[10px] text-indigo-300/80 uppercase font-bold tracking-wider">Overall</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 text-sm">
                {/* Reasoning */}
                {reasoningList.length > 0 && (
                  <div>
                    <h4 className="font-bold text-zinc-300 flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Strategic Rationale
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                      {reasoningList.map((reason: string, j: number) => (
                        <li key={j}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence Mined */}
                {rec.evidence && rec.evidence.length > 0 && (
                  <div>
                    <h4 className="font-bold text-zinc-300 flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      Supporting Evidence
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                      {rec.evidence.map((ev: string, j: number) => (
                        <li key={j}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Explainability / Memories Used */}
                {rec.memories_used && rec.memories_used.length > 0 && (
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    <h4 className="font-bold text-zinc-300 flex items-center gap-2 mb-2 text-xs uppercase tracking-wider text-indigo-400">
                      <BrainCircuit className="h-4 w-4 text-indigo-400" />
                      Memories Recalled by Hindsight Core
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
                      {rec.memories_used.map((mem: string, j: number) => (
                        <li key={j}>{mem}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-zinc-950/40 border-t border-zinc-850 py-3 px-6 flex justify-between items-center">
                <span className="text-xs text-zinc-500">Suggested Action: Create Brief &amp; Script</span>
                <Link 
                  href="/dashboard/content-briefs" 
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                >
                  Draft Video Script
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
