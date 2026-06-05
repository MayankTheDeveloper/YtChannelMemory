import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VideosPage() {
  const insights = {
    winning_patterns: ["High-energy intros (< 5s)", "Case-study based titles", "Thumbnail includes a recognizable brand logo"],
    losing_patterns: ["Overly technical jargon in the first minute", "Long unbroken talking head segments", "Vague titles"],
    best_videos: ["I Built an AI SaaS in 24 Hours", "Next.js 15 Full Course 2024"],
    worst_videos: ["Devlog #4 - Refactoring the Database", "My Setup Tour"]
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Video Intelligence</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Winning Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {insights.winning_patterns.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Losing Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {insights.losing_patterns.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {insights.best_videos.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lowest Performing Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {insights.worst_videos.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
