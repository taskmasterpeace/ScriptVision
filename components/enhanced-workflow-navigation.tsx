"use client"

import type React from "react"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Settings, BookOpen, Youtube, FileText, List, Sparkles } from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"
import { useScriptCreationStore } from "@/lib/stores/script-creation-store"

interface WorkflowStep {
  id: string
  label: string
  description: string
  tabValue: string
  isCompleted: (state: any) => boolean
  icon?: React.ReactNode
}

export function EnhancedWorkflowNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const projectState = useProjectStore()
  const scriptCreationState = useScriptCreationStore()

  // Define the workflow steps including the new script creation steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "story-theme",
      label: "1. Story Theme",
      description: "Define your story concept",
      tabValue: "story-theme",
      isCompleted: (state) => Boolean(scriptCreationState.storyTheme && scriptCreationState.storyTheme.length > 0),
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "research",
      label: "2. Research",
      description: "Find inspiration from YouTube",
      tabValue: "research",
      isCompleted: (state) => scriptCreationState.selectedTranscripts.length > 0,
      icon: <Youtube className="h-4 w-4" />,
    },
    {
      id: "outline",
      label: "3. Outline",
      description: "Create your story structure",
      tabValue: "outline",
      isCompleted: (state) => scriptCreationState.chapters.length > 0,
      icon: <List className="h-4 w-4" />,
    },
    {
      id: "write",
      label: "4. Write",
      description: "Develop your story chapters",
      tabValue: "write",
      isCompleted: (state) => scriptCreationState.generatedChapters.length > 0,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "enhance",
      label: "5. Enhance",
      description: "Optimize emotional impact",
      tabValue: "enhance",
      isCompleted: (state) => scriptCreationState.enhancedChapters.length > 0,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      id: "script",
      label: "6. Script",
      description: "Review final script",
      tabValue: "script",
      isCompleted: (state) => Boolean(projectState.script && projectState.script.length > 0),
    },
    {
      id: "shotlist",
      label: "7. Shot List",
      description: "Generate and refine shot list",
      tabValue: "shotlist",
      isCompleted: (state) => projectState.shotList.length > 0,
    },
    {
      id: "subjects",
      label: "8. Subjects",
      description: "Manage characters, locations, props",
      tabValue: "subjects",
      isCompleted: (state) => projectState.subjects.length > 0,
    },
    {
      id: "styles",
      label: "9. Styles",
      description: "Select visual and director styles",
      tabValue: "styles",
      isCompleted: (state) => Boolean(projectState.selectedStyle),
    },
    {
      id: "prompts",
      label: "10. Prompts",
      description: "Generate visual prompts",
      tabValue: "prompts",
      isCompleted: (state) => projectState.generatedPrompts.length > 0,
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
      if (
        currentStep.isCompleted(currentStep.id.includes("script-creation") ? scriptCreationState : projectState) &&
        currentStepIndex < workflowSteps.length - 1
      ) {
        // Current step is completed, suggest next step with a visual indicator
        // This is just visual - we don't automatically change tabs
      }
    }
  }, [activeTab, projectState, scriptCreationState])

  // Group steps into categories for better UI organization
  const scriptCreationSteps = workflowSteps.slice(0, 5)
  const productionSteps = workflowSteps.slice(5, 10)
  const utilitySteps = workflowSteps.slice(10)

  return (
    <div className="mb-6 bg-card border rounded-lg p-4 shadow-sm">
      <div className="text-sm text-muted-foreground mb-4">
        Follow these steps to create your script and visual prompts:
      </div>

      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-medium mb-2">Script Creation</h3>
          <div className="flex flex-wrap gap-2">{scriptCreationSteps.map((step) => renderWorkflowStep(step))}</div>
        </div>

        <div className="border-b pb-2">
          <h3 className="text-sm font-medium mb-2">Production</h3>
          <div className="flex flex-wrap gap-2">{productionSteps.map((step) => renderWorkflowStep(step))}</div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">{utilitySteps.map((step) => renderWorkflowStep(step))}</div>
        </div>
      </div>
    </div>
  )

  function renderWorkflowStep(step: WorkflowStep) {
    const state = step.id.includes("script-creation") ? scriptCreationState : projectState
    const isActive = activeTab === step.tabValue
    const isCompleted = step.isCompleted(state)

    return (
      <button
        key={step.id}
        onClick={() => onTabChange(step.tabValue)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
          isActive
            ? "bg-primary text-primary-foreground"
            : isCompleted
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground hover:bg-muted",
        )}
      >
        <span className="flex-shrink-0">
          {step.icon || (isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />)}
        </span>
        <span className="whitespace-nowrap">{step.label}</span>
      </button>
    )
  }
}
