import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThumbsUp, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import type { Recommendation, BidDocument } from "@/types"

interface RecommendationPanelProps {
  recommendation: Recommendation
  documents: BidDocument[]
}

export function RecommendationPanel({
  recommendation,
  documents,
}: RecommendationPanelProps) {
  const confidenceColors = {
    high: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-primary" />
            AI Recommendation
          </CardTitle>
          <Badge className={confidenceColors[recommendation.confidence]}>
            {recommendation.confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Recommendation */}
        <div className="rounded-lg bg-primary/5 p-4">
          <p className="text-lg">
            <span className="text-muted-foreground">Recommended: </span>
            <span className="font-bold text-primary">
              {recommendation.recommended_contractor_name}
            </span>
          </p>
          <p className="mt-2 text-muted-foreground">{recommendation.reasoning}</p>
        </div>

        {/* Key Factors */}
        {recommendation.key_factors.length > 0 && (
          <div>
            <h4 className="mb-3 font-semibold">Key Factors</h4>
            <div className="space-y-2">
              {recommendation.key_factors.map((factor, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <div>
                    <span className="font-medium">{factor.factor}:</span>{" "}
                    <span className="text-muted-foreground">
                      {factor.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {recommendation.warnings.length > 0 && (
          <div>
            <h4 className="mb-3 font-semibold">Warnings</h4>
            <div className="space-y-2">
              {recommendation.warnings.map((warning, index) => (
                <Alert key={index} variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {warning.contractor_id && (
                      <span className="font-medium">
                        {documents.find((d) => d.id === warning.contractor_id)
                          ?.contractor_name || "Unknown"}
                        :{" "}
                      </span>
                    )}
                    {warning.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This recommendation is AI-generated based on the information
            extracted from the bid documents. Always verify critical details
            manually before making final decisions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
