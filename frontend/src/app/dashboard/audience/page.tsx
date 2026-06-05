"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, AlertCircle, ArrowRight } from "lucide-react"
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function AudiencePage() {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchAudienceData(storedId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchAudienceData = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
      if (!res.ok) {
        throw new Error("Failed to fetch audience insights")
      }
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (err: any) {
      setError(err.message || "An error occurred fetching audience data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Analyzing viewer comments...</p>
      </div>
    )
  }

  if (!channelId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <Users className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Connected Channel</h2>
        <p className="text-zinc-400 text-sm">
          Please connect your YouTube channel on the Overview tab first to start analyzing audience comments.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const isNotAnalyzed = !data || data.analysis_status === "not_started" || !data.audience_insights || (!data.audience_insights.personas?.length && !data.audience_insights.interests?.length)

  if (isNotAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <RefreshCw className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Analysis Required</h2>
        <p className="text-zinc-400 text-sm">
          A full AI analysis has not been performed on this channel yet. Go to the Overview page and click "Run AI Analysis" to parse comment threads.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const insights = data.audience_insights

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-800">
        <h2 className="text-3xl font-bold tracking-tight text-white">Audience Intelligence</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Insights mined directly from viewer comments across your recent video uploads.
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
            <CardTitle className="text-white">Key Interests</CardTitle>
            <CardDescription className="text-zinc-400">Recurring content pillars your audience engages with most.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {insights.interests && insights.interests.length > 0 ? (
              insights.interests.map((item: string, i: number) => (
                <Badge key={i} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 text-sm">
                  {item}
                </Badge>
              ))
            ) : (
              <span className="text-zinc-500 text-sm">No audience interests identified yet.</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Audience Personas</CardTitle>
            <CardDescription className="text-zinc-400">Core demographic archetypes matching your commenters.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {insights.personas && insights.personas.length > 0 ? (
              insights.personas.map((item: string, i: number) => (
                <Badge key={i} variant="default" className="bg-indigo-600 hover:bg-indigo-550 text-white py-1.5 px-3 text-sm">
                  {item}
                </Badge>
              ))
            ) : (
              <span className="text-zinc-500 text-sm">No personas identified yet.</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-rose-400">Top Pain Points & Friction</CardTitle>
            <CardDescription className="text-zinc-400">Friction points, hurdles, or challenges viewers complain about.</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.pain_points && insights.pain_points.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {insights.pain_points.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-zinc-500 text-sm">No specific pain points identified.</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-amber-400">Requested Topics</CardTitle>
            <CardDescription className="text-zinc-400">Specific video queries and themes requested in comments.</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.requested_topics && insights.requested_topics.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                {insights.requested_topics.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-zinc-500 text-sm">No topic requests identified yet.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
