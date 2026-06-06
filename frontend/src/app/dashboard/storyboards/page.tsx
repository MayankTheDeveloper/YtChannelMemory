"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, Video, Camera, List, Play } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function StoryboardsPage() {
  const router = useRouter()
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [storyboards, setStoryboards] = useState<any[]>([])
  const [selectedStoryboard, setSelectedStoryboard] = useState<any | null>(null)
  const [generatingAssets, setGeneratingAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchStoryboards()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchStoryboards = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/storyboards`)
      if (!res.ok) throw new Error("Failed to fetch storyboards")
      const data = await res.json()
      setStoryboards(data.data || [])

      if (data.data && data.data.length > 0) {
        setSelectedStoryboard(data.data[0])
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching storyboards")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAssets = async () => {
    if (!selectedStoryboard) return
    try {
      setGeneratingAssets(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/assets/generate?storyboard_id=${selectedStoryboard.id}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate assets")
      
      // Save selected storyboard id to localStorage to fetch in assets page
      localStorage.setItem("active_storyboard_id", selectedStoryboard.id.toString())
      router.push("/dashboard/assets")
    } catch (err: any) {
      setError(err.message || "Error generating assets")
    } finally {
      setGeneratingAssets(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading storyboard visualizers...</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Storyboards</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Review the camera angles, visual descriptions, and narration text parsed for each scene.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Director View
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storyboards sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Storyboards Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2 pt-0">
              {storyboards.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-xs">No storyboards found.</p>
                  <Link href="/dashboard/scripts" className="text-xs text-indigo-400 hover:text-indigo-300 block mt-2 font-medium">
                    Generate from Scripts first
                  </Link>
                </div>
              ) : (
                storyboards.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStoryboard(st)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedStoryboard?.id === st.id
                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                        : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/80 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">Storyboard #{st.id}</span>
                    <span className="text-[9px] text-zinc-500 block mt-1">Scenes: {st.scenes?.length || 0} &bull; Status: {st.status}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scene Grid View */}
        <div className="lg:col-span-3">
          {selectedStoryboard ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-md">Reviewing Storyboard #{selectedStoryboard.id}</h3>
                  <span className="text-xs text-zinc-400 mt-1 block">Total scenes to render: {selectedStoryboard.scenes?.length || 0}</span>
                </div>
                <button
                  onClick={handleGenerateAssets}
                  disabled={generatingAssets}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  {generatingAssets ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Generating Assets...
                    </>
                  ) : (
                    <>
                      Approve &amp; Generate Assets
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Scene Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStoryboard.scenes?.map((scene: any, idx: number) => (
                  <Card key={idx} className="bg-zinc-900 border-zinc-800 flex flex-col h-full hover:border-zinc-700 transition-colors">
                    <CardHeader className="pb-3 border-b border-zinc-850 flex flex-row justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {scene.scene || idx + 1}
                        </span>
                        <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Scene Outline</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px]">
                        {scene.duration || 5}s Duration
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 space-y-4">
                      {/* Narration */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Play className="h-3 w-3 text-emerald-400 shrink-0" />
                          Narration / Voiceover
                        </span>
                        <p className="text-xs text-zinc-300 italic bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                          "{scene.narration}"
                        </p>
                      </div>

                      {/* Visual Description */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <Video className="h-3 w-3 text-indigo-400 shrink-0" />
                          Visual Actions
                        </span>
                        <p className="text-xs text-zinc-400">
                          {scene.visual_description}
                        </p>
                      </div>

                      {/* Camera Angle */}
                      {scene.camera_style && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Camera className="h-3 w-3 text-amber-400 shrink-0" />
                            Camera Angle
                          </span>
                          <p className="text-xs text-zinc-400">
                            {scene.camera_style}
                          </p>
                        </div>
                      )}

                      {/* Asset Requirements */}
                      {scene.asset_requirements && scene.asset_requirements.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-850">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <List className="h-3 w-3 text-zinc-400 shrink-0" />
                            Required Assets
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {scene.asset_requirements.map((asset: string, aIdx: number) => (
                              <Badge key={aIdx} variant="secondary" className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400">
                                {asset}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Video className="h-8 w-8 text-zinc-600" />
              <span>Select a storyboard from the queue to review scenes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
