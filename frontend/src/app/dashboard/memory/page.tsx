"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BrainCircuit, AlertCircle, ArrowRight } from "lucide-react";
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function MemoryDashboard() {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState("not_started");

  useEffect(() => {
    const storedId = localStorage.getItem("active_channel_id")
    if (storedId) {
      setChannelId(storedId)
      fetchMemories(storedId)
    } else {
      setLoading(false)
    }
  }, []);

  const fetchMemories = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/import/channel/${id}/dashboard`)
      if (!res.ok) {
        throw new Error("Failed to load hindsight memory logs")
      }
      const data = await res.json()
      setMemories(data.memories || [])
      setAnalysisStatus(data.analysis_status || "not_started")
    } catch (err: any) {
      setError(err.message || "Could not retrieve memory logs")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'audience': return 'bg-blue-500';
      case 'recommendation': return 'bg-green-500';
      case 'trend': return 'bg-purple-500';
      case 'competitor': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-zinc-400 font-medium">Loading memory logs...</p>
      </div>
    )
  }

  if (!channelId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <BrainCircuit className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Connected Channel</h2>
        <p className="text-zinc-400 text-sm">
          Please connect your YouTube channel on the Overview tab first to trace long-term hindsight memory.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold mt-2">
          Go to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const isNotAnalyzed = analysisStatus === "not_started" || memories.length === 0

  if (isNotAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 mb-2">
          <RefreshCw className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Memory Records</h2>
        <p className="text-zinc-400 text-sm">
          Memory logs are generated when the AI agents run content analyses. Go to the Overview page and click "Run AI Analysis".
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
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Hindsight Memory Core</h1>
        <p className="text-zinc-400 text-sm">
          The agent's long-term semantic memory where findings are recorded and recalled across strategy iterations.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-white text-lg">Memory Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Observations Retained</p>
              <p className="text-3xl font-extrabold text-white mt-0.5">{memories.length}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Total Recalls</p>
              <p className="text-3xl font-extrabold text-indigo-400 mt-0.5">
                {memories.reduce((acc, curr) => acc + (curr.recall_count || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Status</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                Compounding
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recent Memory Timeline</CardTitle>
            <CardDescription className="text-zinc-400">Chronological list of compounding channel insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {memories.map((mem) => (
                <div key={mem.id} className="relative pl-6 border-l-2 border-zinc-800 pb-2">
                  <div className={`absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full ${getCategoryColor(mem.category)} ring-4 ring-zinc-900`} />
                  <div className="flex justify-between items-start mb-1 text-xs">
                    <span className="font-semibold text-zinc-300 uppercase tracking-wider">{mem.category}</span>
                    <span className="text-zinc-550">
                      {mem.created_at ? new Date(mem.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-3">
                    {mem.content}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {mem.context_tags && mem.context_tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-zinc-950 text-zinc-400 border border-zinc-800 text-xs py-0.5 px-2 hover:bg-zinc-900">
                        #{tag}
                      </Badge>
                    ))}
                    <span className="text-xs text-zinc-550 ml-auto">Recalled {mem.recall_count || 0} times</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
