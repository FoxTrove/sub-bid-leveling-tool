"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, Gift, ShoppingCart, RotateCcw } from "lucide-react"

interface Transaction {
  id: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'signup'
  amount: number
  balance_after: number
  description: string | null
  created_at: string
}

interface CreditHistoryProps {
  transactions: Transaction[]
}

const typeIcons = {
  purchase: ShoppingCart,
  usage: ArrowDown,
  refund: RotateCcw,
  bonus: Gift,
  signup: Gift,
}

const typeColors = {
  purchase: "text-emerald-400",
  usage: "text-red-400",
  refund: "text-blue-400",
  bonus: "text-amber-400",
  signup: "text-emerald-400",
}

export function CreditHistory({ transactions }: CreditHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Credit History</CardTitle>
          <CardDescription className="text-slate-400">
            Transaction history for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Credit History</CardTitle>
        <CardDescription className="text-slate-400">
          Recent credit transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx) => {
            const Icon = typeIcons[tx.type] || Gift
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-slate-800", typeColors[tx.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-100">
                        {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          tx.amount > 0
                            ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                            : "bg-red-900/20 text-red-400 border-red-800"
                        )}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-300">
                    {tx.balance_after}
                  </p>
                  <p className="text-xs text-slate-500">balance</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
