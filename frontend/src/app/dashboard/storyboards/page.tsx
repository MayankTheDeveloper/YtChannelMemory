import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Storyboards</h2>
      <Card>
        <CardHeader>
          <CardTitle>Scene Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 border rounded-md">
              <h3 className="font-bold mb-2">Scene 1</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Narration</label>
                  <textarea className="w-full text-sm p-2 border rounded-md bg-background" defaultValue="Did you know that AI can now generate full YouTube videos?" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Visual Description</label>
                  <textarea className="w-full text-sm p-2 border rounded-md bg-background" defaultValue="A futuristic robot typing on a keyboard." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Camera Angle</label>
                  <input type="text" className="w-full text-sm p-2 border rounded-md bg-background" defaultValue="Close up, cinematic lighting" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Regenerate Scenes</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Approve & Generate Assets</button>
        </CardFooter>
      </Card>
    </div>
  )
}
