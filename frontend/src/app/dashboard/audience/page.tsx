import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AudiencePage() {
  // Mock data for MVP frontend
  const insights = {
    interests: ["Tech Tutorials", "AI Tools", "Software Engineering"],
    personas: ["Aspiring Developers", "Productivity Seekers", "Tech Enthusiasts"],
    pain_points: ["Getting stuck in tutorial hell", "Keeping up with new tech", "Debugging complex issues"],
    requested_topics: ["Next.js 15 crash course", "LangGraph for beginners", "Full-stack SaaS tutorial"]
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Audience Intelligence</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Interests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {insights.interests.map((item, i) => (
              <Badge key={i} variant="secondary">{item}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audience Personas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {insights.personas.map((item, i) => (
              <Badge key={i} variant="default">{item}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Pain Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {insights.pain_points.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Frequently Requested Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {insights.requested_topics.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
