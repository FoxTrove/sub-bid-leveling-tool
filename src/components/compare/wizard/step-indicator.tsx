"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  name: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "relative",
              index !== steps.length - 1 ? "flex-1" : ""
            )}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-medium transition-colors",
                  step.id < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.id === currentStep
                      ? "border-primary text-primary"
                      : "border-muted-foreground/25 text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "ml-2 h-0.5 flex-1 transition-colors",
                    step.id < currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/25"
                  )}
                />
              )}
            </div>

            <span
              className={cn(
                "absolute -bottom-6 left-0 w-max text-sm font-medium",
                step.id === currentStep
                  ? "text-foreground"
                  : step.id < currentStep
                    ? "text-primary"
                    : "text-muted-foreground"
              )}
            >
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
