import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Generated Videos</h2>
      <Card>
        <CardHeader>
          <CardTitle>Final Assembly Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="aspect-video bg-muted flex items-center justify-center rounded-md border">
              {/* In a real app, this would be <video src="..." controls /> */}
              <span className="text-muted-foreground">Video Player Placeholder</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Video Title (Metadata)</label>
              <input type="text" className="w-full p-2 border rounded-md bg-background" defaultValue="How AI is Changing Content Creation in 2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Video Description</label>
              <textarea className="w-full min-h-[100px] p-2 border rounded-md bg-background" defaultValue="This video was generated entirely by AI..." />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <button className="px-4 py-2 border rounded-md hover:bg-muted">Regenerate Assembly</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Approve & Publish to YouTube</button>
        </CardFooter>
      </Card>
    </div>
  )
}
