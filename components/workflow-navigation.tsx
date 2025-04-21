"use client"

import type React from "react"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Settings } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"

interface WorkflowStep {
  id: string
  label: string
  description: string
  tabValue: string
  isCompleted: (state: any) => boolean
  icon?: React.ReactNode
}

export function WorkflowNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const state = useProjectStore()

  // Define the workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "script",
      label: "1. Script",
      description: "Enter your script",
      tabValue: "script",
      isCompleted: (state) => Boolean(state.script && state.script.length > 0),
    },
    {
      id: "shotlist",
      label: "2. Shot List",
      description: "Generate and refine shot list",
      tabValue: "shotlist",
      isCompleted: (state) => state.shotList.length > 0,
    },
    {
      id: "subjects",
      label: "3. Subjects",
      description: "Manage characters, locations, props",
      tabValue: "subjects",
      isCompleted: (state) => state.subjects.length > 0,
    },
    {
      id: "styles",
      label: "4. Styles",
      description: "Select visual and director styles",
      tabValue: "styles",
      isCompleted: (state) => Boolean(state.selectedStyle),
    },
    {
      id: "prompts",
      label: "5. Prompts",
      description: "Generate visual prompts",
      tabValue: "prompts",
      isCompleted: (state) => state.generatedPrompts.length > 0,
    },
    {
      id: "developer",
      label: "Developer",
      description: "Advanced template editing",
      tabValue: "developer",
      isCompleted: () => true,
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  // Auto-suggest next step if current step is completed
  useEffect(() => {
    const currentStepIndex = workflowSteps.findIndex((step) => step.tabValue === activeTab)
    if (currentStepIndex >= 0) {
      const currentStep = workflowSteps[currentStepIndex]
      if (currentStep.isCompleted(state) && currentStepIndex < workflowSteps.length - 1) {
        // Current step is completed, suggest next step with a visual indicator
        // This is just visual - we don't automatically change tabs
      }
    }
  }, [activeTab, state])

  return (
    <div className="mb-6 bg-card border rounded-lg p-4 shadow-sm">
      <div className="text-sm text-muted-foreground mb-4">Follow these steps to create your visual prompts:</div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
        {workflowSteps
          .filter((step) => step.id !== "developer")
          .map((step, index) => {
            const isActive = activeTab === step.tabValue
            const isCompleted = step.isCompleted(state)

            return (
              <div key={step.id} className="flex items-center w-full sm:w-auto">
                <button
                  onClick={() => onTabChange(step.tabValue)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative w-full sm:w-auto",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex-shrink-0">
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>

                  {/* Only show description on mobile or when active */}
                  <span
                    className={cn("text-xs sm:hidden", isActive ? "text-primary-foreground" : "text-muted-foreground")}
                  >
                    {step.description}
                  </span>
                </button>

                {/* Connector line between steps */}
                {index < workflowSteps.length - 2 && <div className="hidden sm:block h-px w-8 bg-border mx-1" />}
              </div>
            )
          })}
      </div>

      {/* Step description (desktop) */}
      <div className="hidden sm:block mt-2 text-sm text-muted-foreground">
        {workflowSteps.find((step) => step.tabValue === activeTab)?.description}
      </div>
    </div>
  )
}
