"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const periods = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
]

export function DateRangePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = searchParams.get('period') || '30'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={currentPeriod} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-slate-100">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-700">
        {periods.map((period) => (
          <SelectItem
            key={period.value}
            value={period.value}
            className="text-slate-100"
          >
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
