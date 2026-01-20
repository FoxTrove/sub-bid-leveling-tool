import Link from "next/link"
import { FileStack, Plus, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 to-transparent py-20 px-8">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
          <FileStack className="h-10 w-10 text-primary-foreground" />
        </div>
      </div>

      <h3 className="mt-8 text-2xl font-bold">No comparisons yet</h3>
      <p className="mt-3 max-w-md text-center text-muted-foreground">
        Upload your first set of subcontractor bids to see them compared
        side-by-side with AI-powered scope analysis.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link href="/compare/new">
          <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Comparison
          </Button>
        </Link>
      </div>

      <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>AI analyzes scope gaps, exclusions, and recommends the best bid</span>
      </div>
    </div>
  )
}
