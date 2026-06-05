import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Scripts</h2>
      <Card>
        <CardHeader>
          <CardTitle>Generated Script Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Hook</label>
              <textarea className="w-full min-h-[100px] p-2 border rounded-md bg-background" defaultValue="Did you know that AI can now generate full YouTube videos?" />
            </div>
            <div>
              <label className="text-sm font-medium">Introduction</label>
              <textarea className="w-full min-h-[150px] p-2 border rounded-md bg-background" defaultValue="Welcome back to the channel. Today we're diving into the new autonomous creation OS..." />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Regenerate</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Approve & Generate Storyboard</button>
        </CardFooter>
      </Card>
    </div>
  )
}
