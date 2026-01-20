"use client"

import { useState } from "react"
import { Calculator, Clock, DollarSign, TrendingUp } from "lucide-react"
import { Slider } from "@/components/ui/slider"

export function ROICalculator() {
  const [comparisonsPerMonth, setComparisonsPerMonth] = useState(8)
  const [hoursPerComparison, setHoursPerComparison] = useState(3)
  const [hourlyRate, setHourlyRate] = useState(75)

  // Calculations
  const hoursWithBidVet = 0.1 // ~6 minutes per comparison
  const hoursSavedPerComparison = hoursPerComparison - hoursWithBidVet
  const totalHoursSavedPerMonth = hoursSavedPerComparison * comparisonsPerMonth
  const totalHoursSavedPerYear = totalHoursSavedPerMonth * 12
  const moneySavedPerMonth = totalHoursSavedPerMonth * hourlyRate
  const moneySavedPerYear = moneySavedPerMonth * 12

  // Pro subscription cost
  const proMonthly = 79
  const roi = ((moneySavedPerMonth - proMonthly) / proMonthly) * 100

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-600 mb-4">
            <Calculator className="h-4 w-4" />
            ROI Calculator
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            Calculate Your Time Savings
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            See how much time and money you could save with BidVet
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Input Section */}
            <div className="space-y-8 p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-700">Bid comparisons per month</label>
                  <span className="text-2xl font-bold text-blue-600">{comparisonsPerMonth}</span>
                </div>
                <Slider
                  value={[comparisonsPerMonth]}
                  onValueChange={([v]) => setComparisonsPerMonth(v)}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1</span>
                  <span>30</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-700">Hours spent per comparison (currently)</label>
                  <span className="text-2xl font-bold text-blue-600">{hoursPerComparison}h</span>
                </div>
                <Slider
                  value={[hoursPerComparison]}
                  onValueChange={([v]) => setHoursPerComparison(v)}
                  min={1}
                  max={8}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1 hour</span>
                  <span>8 hours</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-700">Your hourly rate (or value of time)</label>
                  <span className="text-2xl font-bold text-blue-600">${hourlyRate}</span>
                </div>
                <Slider
                  value={[hourlyRate]}
                  onValueChange={([v]) => setHourlyRate(v)}
                  min={25}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>$25/hr</span>
                  <span>$200/hr</span>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {/* Main Savings Card */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <h3 className="text-lg font-medium text-slate-600 mb-6">Your Potential Savings</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Hours saved/month</span>
                    </div>
                    <p className="text-4xl font-bold text-blue-600">
                      {totalHoursSavedPerMonth.toFixed(0)}
                      <span className="text-lg font-normal text-slate-400 ml-1">hrs</span>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Hours saved/year</span>
                    </div>
                    <p className="text-4xl font-bold text-blue-600">
                      {totalHoursSavedPerYear.toFixed(0)}
                      <span className="text-lg font-normal text-slate-400 ml-1">hrs</span>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Value saved/month</span>
                    </div>
                    <p className="text-4xl font-bold text-emerald-600">
                      ${moneySavedPerMonth.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Value saved/year</span>
                    </div>
                    <p className="text-4xl font-bold text-emerald-600">
                      ${moneySavedPerYear.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* ROI Card */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Return on Investment</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">
                      {roi > 0 ? "+" : ""}{roi.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>Pro plan: $79/mo</p>
                    <p>Your savings: ${moneySavedPerMonth.toLocaleString()}/mo</p>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-4">Time per comparison</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Manual spreadsheet</span>
                      <span className="font-medium text-slate-700">{hoursPerComparison} hours</span>
                    </div>
                    <div className="h-3 rounded-full bg-red-100 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">With BidVet</span>
                      <span className="font-medium text-emerald-600">~6 minutes</span>
                    </div>
                    <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(hoursWithBidVet / hoursPerComparison) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
