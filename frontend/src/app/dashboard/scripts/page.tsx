"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Sparkles, AlertCircle, ArrowRight, Save, Film, CheckCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function ScriptsPage() {
  const router = useRouter()
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scripts, setScripts] = useState<any[]>([])
  const [selectedScript, setSelectedScript] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingStoryboard, setGeneratingStoryboard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Edit form states
  const [hook, setHook] = useState("")
  const [introduction, setIntroduction] = useState("")
  const [sections, setSections] = useState<any[]>([])
  const [cta, setCta] = useState("")

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchScripts()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchScripts = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/creation/scripts`)
      if (!res.ok) throw new Error("Failed to fetch scripts")
      const data = await res.json()
      setScripts(data.data || [])

      if (data.data && data.data.length > 0) {
        selectScript(data.data[0])
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching scripts")
    } finally {
      setLoading(false)
    }
  }

  const selectScript = (script: any) => {
    setSelectedScript(script)
    setHook(script.hook || "")
    setIntroduction(script.introduction || "")
    setSections(script.sections || [])
    setCta(script.cta || "")
    setSuccessMsg(null)
  }

  const handleSaveScript = async () => {
    if (!selectedScript) return
    try {
      setSaving(true)
      setError(null)
      setSuccessMsg(null)

      const payload = {
        hook,
        introduction,
        sections,
        cta
      }

      const res = await fetch(`${API_BASE}/creation/scripts/${selectedScript.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save script edits")
      const data = await res.json()
      
      // Update local script item in list
      setScripts(prev => prev.map(s => s.id === selectedScript.id ? data.data : s))
      setSelectedScript(data.data)
      setSuccessMsg("Script changes saved successfully.")
    } catch (err: any) {
      setError(err.message || "Error saving script")
    } finally {
      setSaving(false)
    }
  }

  const handleSectionChange = (index: number, field: string, value: string) => {
    setSections(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleGenerateStoryboard = async () => {
    if (!selectedScript) return
    try {
      setGeneratingStoryboard(true)
      setError(null)
      setSuccessMsg(null)

      // Auto-save first
      await handleSaveScript()

      const res = await fetch(`${API_BASE}/creation/storyboards/generate?script_id=${selectedScript.id}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate storyboard")
      
      router.push("/dashboard/storyboards")
    } catch (err: any) {
      setError(err.message || "Error generating storyboard")
    } finally {
      setGeneratingStoryboard(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading script review editor...</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Video Scripts</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Edit and fine-tune your YouTube script hook, body sections, and calls-to-action.
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 py-1 px-3">
          Script Editor
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
        {/* Scripts sidebar selector */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Scripts Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2 pt-0">
              {scripts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-xs">No scripts found.</p>
                  <Link href="/dashboard/content-briefs" className="text-xs text-indigo-400 hover:text-indigo-300 block mt-2 font-medium">
                    Generate from Briefs first
                  </Link>
                </div>
              ) : (
                scripts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectScript(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedScript?.id === s.id
                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                        : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/80 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-bold text-white line-clamp-2">{s.hook}</span>
                    <span className="text-[9px] text-zinc-500 block mt-1">ID: #{s.id} &bull; Status: {s.status}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Script Editor Panel */}
        <div className="lg:col-span-3">
          {selectedScript ? (
            <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
              <CardHeader className="border-b border-zinc-850 flex flex-row items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 text-indigo-400 border-indigo-400/20 bg-indigo-500/5">
                    Script Writer
                  </Badge>
                  <CardTitle className="text-lg text-white font-bold">Script # {selectedScript.id}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveScript}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-850 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Draft
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 flex-1 max-h-[60vh] overflow-y-auto">
                {/* Hook segment */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hook (First 5s)</label>
                    <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">High Retention Zone</span>
                  </div>
                  <textarea
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    className="w-full min-h-[80px] p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter immediate attention grabber..."
                  />
                </div>

                {/* Introduction segment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Introduction & Value Setup</label>
                  <textarea
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    className="w-full min-h-[100px] p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Introduce the topic and explain what viewers get..."
                  />
                </div>

                {/* Dynamic sections array */}
                {sections.map((section, idx) => (
                  <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-indigo-400/90">Section #{idx + 1}</span>
                      <input
                        type="text"
                        value={section.heading || ""}
                        onChange={(e) => handleSectionChange(idx, "heading", e.target.value)}
                        className="text-xs font-bold text-white bg-transparent border-b border-zinc-800 px-2 py-0.5 focus:outline-none focus:border-indigo-500 w-1/2 text-right"
                        placeholder="Section Heading"
                      />
                    </div>
                    <textarea
                      value={section.content || ""}
                      onChange={(e) => handleSectionChange(idx, "content", e.target.value)}
                      className="w-full min-h-[120px] p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Script text for this section..."
                    />
                  </div>
                ))}

                {/* Call to Action segment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Call to Action (CTA)</label>
                  <textarea
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    className="w-full min-h-[80px] p-3 text-sm border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter end CTA (Subscribe, check links)..."
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-850 p-4 flex justify-between items-center bg-zinc-950/20">
                <span className="text-[10px] text-zinc-500">Approving will generate the storyboard scene layouts.</span>
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={generatingStoryboard}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/10"
                >
                  {generatingStoryboard ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating Storyboard...
                    </>
                  ) : (
                    <>
                      Approve &amp; Storyboard Video
                      <Film className="h-4 w-4" />
                    </>
                  )}
                </button>
              </CardFooter>
            </Card>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl h-[50vh] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <FileText className="h-8 w-8 text-zinc-600" />
              <span>Select a script from the queue to start editing.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
