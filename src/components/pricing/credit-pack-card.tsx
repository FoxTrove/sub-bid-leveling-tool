"use client"

import { Check, Coins, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CreditPackCardProps {
  name: string
  price: number
  estimatedComparisons: number
  bonus?: string
  isPopular?: boolean
  onPurchase: () => void
  isLoading?: boolean
}

export function CreditPackCard({
  name,
  price,
  estimatedComparisons,
  bonus,
  isPopular,
  onPurchase,
  isLoading,
}: CreditPackCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl bg-slate-900/50 border-2 p-6 transition-all hover:shadow-lg",
        isPopular
          ? "border-amber-500/50 shadow-xl shadow-amber-500/10 scale-105 z-10"
          : "border-slate-800 hover:border-amber-500/30"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg">
            Best Value
          </span>
        </div>
      )}

      {bonus && (
        <div className="absolute -top-3 right-4">
          <span className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            {bonus}
          </span>
        </div>
      )}

      <div className="text-center pb-2 pt-4">
        <div className={cn(
          "mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center border",
          isPopular
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-slate-800 border-slate-700"
        )}>
          <Coins className={cn("h-7 w-7", isPopular ? "text-amber-400" : "text-slate-400")} />
        </div>
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="text-sm text-slate-400">~{estimatedComparisons} comparisons*</p>
      </div>

      <div className="flex-1 pt-4">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-white">${price}</span>
        </div>

        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2 text-slate-300">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Never expires</span>
          </li>
          <li className="flex items-center gap-2 text-slate-300">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Full AI analysis</span>
          </li>
          <li className="flex items-center gap-2 text-slate-300">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>PDF & CSV exports</span>
          </li>
          <li className="flex items-center gap-2 text-slate-300">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>No commitment</span>
          </li>
        </ul>
      </div>

      <div className="pt-6">
        <Button
          className={cn(
            "w-full",
            isPopular
              ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/25"
              : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          )}
          onClick={onPurchase}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Buy Credits"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
