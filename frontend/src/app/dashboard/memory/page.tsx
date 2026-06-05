"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MemoryDashboard() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mocking the fetch since we might not have a channel_id easily available in this unauthenticated demo UI
  useEffect(() => {
    // In a real implementation this would fetch from /api/v1/memory?channel_id=1
    setTimeout(() => {
      setMemories([
        {
          id: 1,
          category: "Recommendation",
          content: "Recommendation 'AI Workflow Automation' resulted in 5000 actual views (Accuracy: 90.0%). Learning: Audience responded positively to this topic.",
          context_tags: ["post_publish_feedback", "high_accuracy"],
          created_at: new Date(Date.now() - 86400000).toISOString(),
          recall_count: 3
        },
        {
          id: 2,
          category: "Audience",
          content: "Audience engagement spiked 40% when discussing 'Agentic AI' instead of 'Generative AI'.",
          context_tags: ["engagement_spike", "terminology"],
          created_at: new Date(Date.now() - 172800000).toISOString(),
          recall_count: 5
        },
        {
          id: 3,
          category: "Trend",
          content: "The keyword 'LangGraph' showed a 300% velocity increase over 7 days in the developer niche.",
          context_tags: ["high_velocity", "framework"],
          created_at: new Date(Date.now() - 259200000).toISOString(),
          recall_count: 1
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Audience': return 'bg-blue-500';
      case 'Recommendation': return 'bg-green-500';
      case 'Trend': return 'bg-purple-500';
      case 'Competitor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Hindsight Memory Core</h1>
        <p className="text-gray-400 text-lg">
          The agent's long-term semantic memory. These observations continuously compound to improve future content strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Memory Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Total Memories Retained</p>
              <p className="text-3xl font-bold text-white">342</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Recalls</p>
              <p className="text-3xl font-bold text-white">1,204</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Prediction Accuracy</p>
              <p className="text-3xl font-bold text-green-400">88.4%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-white">Recent Memory Timeline</CardTitle>
            <CardDescription className="text-gray-400">Chronological history of what the agent has learned.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500 py-10">Recalling memories...</div>
            ) : (
              <div className="space-y-6">
                {memories.map((mem) => (
                  <div key={mem.id} className="relative pl-6 border-l-2 border-zinc-700 pb-2">
                    <div className={`absolute -left-2 top-0 w-3.5 h-3.5 rounded-full ${getCategoryColor(mem.category)} ring-4 ring-zinc-900`} />
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-300">{mem.category}</span>
                      <span className="text-xs text-gray-500">{new Date(mem.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-white text-base leading-relaxed mb-3">
                      {mem.content}
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {mem.context_tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-zinc-800 text-xs text-gray-400 hover:bg-zinc-700">
                          #{tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-gray-500 ml-auto">Recalled {mem.recall_count} times</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
