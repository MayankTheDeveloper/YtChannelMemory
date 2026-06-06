"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, Music, Image as ImageIcon, Volume2, Cpu, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function AssetsPage() {
  const router = useRouter()
  const [channelId, setChannelId] = useState<string | null>(null)
  const [storyboardId, setStoryboardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<any[]>([])
  const [storyboards, setStoryboards] = useState<any[]>([])
  const [compiling, setCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedChannelId = localStorage.getItem("active_channel_id")
    const storedStoryboardId = localStorage.getItem("active_storyboard_id")
    
    if (storedChannelId) {
      setChannelId(storedChannelId)
      fetchStoryboardsAndAssets(storedStoryboardId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchStoryboardsAndAssets = async (sId: string | null) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch storyboards
      const sbRes = await fetch(`${API_BASE}/creation/storyboards`)
      if (!sbRes.ok) throw new Error("Failed to fetch storyboards list")
      const sbData = await sbRes.json()
      setStoryboards(sbData.data || [])

      let activeId = sId
      if (!activeId && sbData.data && sbData.data.length > 0) {
        activeId = sbData.data[0].id.toString()
      }

      if (activeId) {
        setStoryboardId(activeId)
        localStorage.setItem("active_storyboard_id", activeId)
        await fetchAssets(activeId)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching storyboards")
    } finally {
      setLoading(false)
    }
  }

  const fetchAssets = async (sId: string) => {
    try {
      const res = await fetch(`${API_BASE}/creation/assets/${sId}`)
      if (!res.ok) throw new Error("Failed to fetch generated assets")
      const data = await res.json()
      setAssets(data.data || [])
    } catch (err: any) {
      setError(err.message || "An error occurred fetching assets")
    }
  }

  const handleSelectStoryboard = (sId: string) => {
    setStoryboardId(sId)
    localStorage.setItem("active_storyboard_id", sId)
    fetchAssets(sId)
  }

  const handleCompileVideo = async () => {
    if (!storyboardId) return
    try {
      setCompiling(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/videos/generate?storyboard_id=${storyboardId}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to compile final video")
      
      router.push("/dashboard/generated-videos")
    } catch (err: any) {
      setError(err.message || "Error compiling video")
    } finally {
      setCompiling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading production assets...</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Production Assets</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Review voiceovers and prompt templates before assembling the final video file.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Assets Manager
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storyboard Select sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Select Storyboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2 pt-0">
              {storyboards.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-xs">No storyboards found.</p>
                  <Link href="/dashboard/storyboards" className="text-xs text-indigo-400 hover:text-indigo-300 block mt-2 font-medium">
                    Review Storyboards first
                  </Link>
                </div>
              ) : (
                storyboards.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStoryboard(st.id.toString())}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      storyboardId === st.id.toString()
                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                        : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/80 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">Storyboard #{st.id}</span>
                    <span className="text-[9px] text-zinc-500 block mt-1">Scenes: {st.scenes?.length || 0}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Asset Cards Panel */}
        <div className="lg:col-span-3 space-y-6">
          {storyboardId ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-md">Generated Assets for Storyboard #{storyboardId}</h3>
                  <span className="text-xs text-zinc-400 mt-1 block">Total voiceover files: {assets.filter(a => a.asset_type === "voiceover").length}</span>
                </div>
                <button
                  onClick={handleCompileVideo}
                  disabled={compiling}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  {compiling ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Assembling Video...
                    </>
                  ) : (
                    <>
                      Compile &amp; Assemble Video
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Assets listing */}
              {assets.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center text-zinc-500">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-zinc-650" />
                  <p className="text-sm">No assets generated for this storyboard yet.</p>
                  <p className="text-xs text-zinc-600 mt-1">Try re-generating assets from the Storyboards screen.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <Card key={asset.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
                            {asset.asset_type === "voiceover" ? (
                              <Music className="h-5 w-5" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white capitalize">{asset.asset_type}</span>
                              <Badge variant="outline" className="text-[9px] text-zinc-400 px-1.5 py-0">
                                {asset.provider}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-zinc-500 block mt-1 line-clamp-1">URL: {asset.url}</span>
                          </div>
                        </div>

                        {/* Rendering assets appropriately */}
                        <div className="w-full md:w-auto flex items-center gap-2">
                          {asset.asset_type === "voiceover" ? (
                            <div className="flex items-center gap-2 w-full md:w-auto bg-zinc-950/40 p-2 border border-zinc-850 rounded-xl">
                              <Volume2 className="h-4 w-4 text-zinc-400 shrink-0" />
                              <audio
                                src={asset.url.startsWith("http") ? asset.url : undefined}
                                controls
                                className="h-8 w-full max-w-[240px] text-xs focus:outline-none"
                              >
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-emerald-400 bg-emerald-400/5 border-emerald-400/10 py-1 px-2.5 text-[10px] flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Asset Ready
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <ImageIcon className="h-8 w-8 text-zinc-600" />
              <span>Select a storyboard from the sidebar to review generated files.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
