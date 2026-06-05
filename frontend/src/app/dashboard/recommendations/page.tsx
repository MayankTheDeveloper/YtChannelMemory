import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function RecommendationsPage() {
  const recommendations = [
    {
      title: "How I Automated My YouTube Channel with LangGraph",
      description: "A deep dive tutorial showing how to build an AI agent that analyzes comments and suggests video ideas, exactly solving the audience's pain point of needing practical LangGraph examples.",
      confidence_score: 95,
      reasoning: [
        "Directly addresses top requested topic: 'LangGraph for beginners'",
        "Leverages winning pattern: 'Case-study based titles'",
        "Matches audience interest in AI Tools and Software Engineering"
      ],
      estimated_growth: "High (Potential for 100k+ views based on trend momentum)",
      target_audience: "Tech Enthusiasts & Aspiring Developers"
    },
    {
      title: "Next.js 15: The Ultimate Crash Course for 2024",
      description: "A comprehensive but fast-paced guide to all the new features in Next.js 15, tailored for intermediate developers.",
      confidence_score: 88,
      reasoning: [
        "Addresses high frequency pain point: 'Keeping up with new tech'",
        "Previous crash courses performed 40% better than average videos"
      ],
      estimated_growth: "Medium-High (Consistent evergreen traffic)",
      target_audience: "React Developers"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Content Recommendations</h2>
        <Badge variant="outline" className="text-primary border-primary">Powered by Channel Intelligence</Badge>
      </div>
      
      <div className="grid gap-6">
        {recommendations.map((rec, i) => (
          <Card key={i} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-1">{rec.title}</CardTitle>
                  <CardDescription className="text-base">{rec.description}</CardDescription>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-primary">{rec.confidence_score}%</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Confidence</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Why this will work:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {rec.reasoning.map((reason, j) => (
                      <li key={j}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Target Audience: </span>
                    <span className="text-muted-foreground">{rec.target_audience}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Estimated Growth: </span>
                    <span className="text-muted-foreground">{rec.estimated_growth}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
