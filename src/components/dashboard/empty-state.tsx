import Link from "next/link"
import { FileStack, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <FileStack className="h-8 w-8 text-primary" />
      </div>

      <h3 className="mt-6 text-xl font-semibold">No comparisons yet</h3>
      <p className="mt-2 max-w-sm text-center text-muted-foreground">
        Upload your first set of subcontractor bids to see them compared
        side-by-side with AI-powered analysis.
      </p>

      <Link href="/compare/new" className="mt-6">
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Comparison
        </Button>
      </Link>
    </div>
  )
}
