import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold sm:inline-block">YtChannelMemory</span>
            </Link>
            <nav className="flex items-center space-x-4 text-sm font-medium">
              <span className="text-muted-foreground ml-2">Analytics:</span>
              <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground">
                Overview
              </Link>
              <Link href="/dashboard/audience" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Audience
              </Link>
              <Link href="/dashboard/videos" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Videos
              </Link>
              <Link href="/dashboard/recommendations" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Recommendations
              </Link>
              <Link href="/dashboard/memory" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Memory
              </Link>
              
              <span className="text-muted-foreground ml-4 border-l pl-4">Studio:</span>
              <Link href="/dashboard/content-briefs" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Briefs
              </Link>
              <Link href="/dashboard/scripts" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Scripts
              </Link>
              <Link href="/dashboard/storyboards" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Storyboards
              </Link>
              <Link href="/dashboard/assets" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Assets
              </Link>
              <Link href="/dashboard/generated-videos" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Gen Videos
              </Link>
              <Link href="/dashboard/thumbnails" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Thumbnails
              </Link>
              <Link href="/dashboard/publishing" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Publishing
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-8 pt-6">
        {children}
      </main>
    </div>
  )
}
