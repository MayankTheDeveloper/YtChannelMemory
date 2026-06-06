"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, BrainCircuit, PlusCircle, CheckCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function ContentBriefsPage() {
  const router = useRouter()
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [briefs, setBriefs] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [selectedBrief, setSelectedBrief] = useState<any | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchData(storedId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchData = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch existing briefs
      const briefsRes = await fetch(`${API_BASE}/creation/content-briefs`)
      if (!briefsRes.ok) throw new Error("Failed to fetch content briefs")
      const briefsData = await briefsRes.json()
      setBriefs(briefsData.data || [])

      // Fetch dashboard to get recommendations
      const dashboardRes = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
      if (!dashboardRes.ok) throw new Error("Failed to fetch dashboard recommendations")
      const dashboardData = await dashboardRes.json()
      setRecommendations(dashboardData.recommendations || [])

      // Auto-select first brief if exists
      if (briefsData.data && briefsData.data.length > 0) {
        setSelectedBrief(briefsData.data[0])
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching briefs data")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBrief = async (recId: number) => {
    try {
      setGeneratingId(recId)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/content-briefs/generate?recommendation_id=${recId}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate content brief")
      const data = await res.json()
      
      // Refresh list
      if (channelId) {
        await fetchData(channelId)
      }
      setSelectedBrief(data.data)
    } catch (err: any) {
      setError(err.message || "Error generating brief")
    } finally {
      setGeneratingId(null)
    }
  }

  const handleGenerateScript = async (briefId: number) => {
    try {
      setGeneratingId(briefId)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/scripts/generate?brief_id=${briefId}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate script")
      
      router.push("/dashboard/scripts")
    } catch (err: any) {
      setError(err.message || "Error generating script")
    } finally {
      setGeneratingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading studio briefs...</p>
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
        <p className="text-zinc-400 text-sm">Please connect your YouTube channel on the Overview tab first.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // Filter recommendations that don't have a brief yet
  const unbriefedRecs = recommendations.filter(
    (rec) => !briefs.some((b) => b.recommendation_id === rec.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Content Briefs</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Review and approve your AI generated content structure before scripting.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Studio Mode
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Briefs List & Recommendations */}
        <div className="space-y-6 lg:col-span-1">
          {/* Unbriefed recommendations */}
          {unbriefedRecs.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-md text-white flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-400" />
                  Ideas Ready for Briefing
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Generate content briefs for your latest strategy recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                {unbriefedRecs.map((rec) => (
                  <div key={rec.id} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-white line-clamp-2">{rec.title}</span>
                    <button
                      onClick={() => handleGenerateBrief(rec.id)}
                      disabled={generatingId !== null}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors mt-1"
                    >
                      {generatingId === rec.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Briefing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate Brief
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* List of existing briefs */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-md text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-400" />
                Generated Briefs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {briefs.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-6">No briefs generated yet.</p>
              ) : (
                briefs.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrief(b)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                      selectedBrief?.id === b.id
                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                        : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/80 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-bold text-white line-clamp-1">{b.topic}</span>
                    <div className="flex items-center justify-between text-[10px] mt-1 w-full">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">{b.status}</span>
                      <span>{b.estimated_length}</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Brief Detail View */}
        <div className="lg:col-span-2">
          {selectedBrief ? (
            <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
              <CardHeader className="border-b border-zinc-850">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2 text-indigo-400 border-indigo-400/20 bg-indigo-500/5">
                      Content Brief
                    </Badge>
                    <CardTitle className="text-xl text-white font-bold font-sans">{selectedBrief.topic}</CardTitle>
                  </div>
                  <span className="text-xs font-semibold capitalize bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1 px-3 rounded-full shrink-0">
                    {selectedBrief.status}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Audience</h4>
                    <p className="text-sm text-zinc-300 mt-1">{selectedBrief.target_audience}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estimated Length</h4>
                    <p className="text-sm text-zinc-300 mt-1">{selectedBrief.estimated_length}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Video Goal</h4>
                  <p className="text-sm text-zinc-300 mt-1">{selectedBrief.video_goal}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Content Angle</h4>
                  <p className="text-sm text-zinc-300 mt-1">{selectedBrief.content_angle}</p>
                </div>

                {selectedBrief.key_points && selectedBrief.key_points.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Key Outline Points</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-300">
                      {selectedBrief.key_points.map((pt: string, j: number) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedBrief.competitor_reference && selectedBrief.competitor_reference.length > 0 && (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BrainCircuit className="h-4 w-4" />
                      Competitor Strategy
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
                      {selectedBrief.competitor_reference.map((ref: string, j: number) => (
                        <li key={j}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-zinc-850 p-4 flex justify-end">
                <button
                  onClick={() => handleGenerateScript(selectedBrief.id)}
                  disabled={generatingId !== null}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/10"
                >
                  {generatingId === selectedBrief.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Scripting Video...
                    </>
                  ) : (
                    <>
                      Approve &amp; Generate Script
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </CardFooter>
            </Card>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Sparkles className="h-8 w-8 text-zinc-600" />
              <span>Select or generate a brief to view details.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
