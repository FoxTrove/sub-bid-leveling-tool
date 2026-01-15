"use client"

import { Check, Coins, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CreditPackCardProps {
  name: string
  price: number
  credits: number
  pricePerCredit: number
  bonus?: string
  isPopular?: boolean
  onPurchase: () => void
  isLoading?: boolean
}

export function CreditPackCard({
  name,
  price,
  credits,
  pricePerCredit,
  bonus,
  isPopular,
  onPurchase,
  isLoading,
}: CreditPackCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col border-2 transition-all hover:shadow-lg",
        isPopular
          ? "border-accent shadow-xl shadow-accent/10 scale-105 z-10"
          : "border-border/50 hover:border-accent/50"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-accent text-accent-foreground shadow-lg">Best Value</Badge>
        </div>
      )}

      {bonus && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {bonus}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-6">
        <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Coins className="h-7 w-7 text-accent" />
        </div>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{credits} comparisons</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">${price}</span>
          <p className="text-sm text-muted-foreground mt-2">
            ${pricePerCredit.toFixed(2)} per comparison
          </p>
        </div>

        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0" />
            <span>Never expires</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0" />
            <span>Full AI analysis</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0" />
            <span>PDF & CSV exports</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0" />
            <span>No commitment</span>
          </li>
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className={cn(
            "w-full",
            isPopular
              ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20"
              : ""
          )}
          variant={isPopular ? "default" : "outline"}
          onClick={onPurchase}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Buy Credits"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
