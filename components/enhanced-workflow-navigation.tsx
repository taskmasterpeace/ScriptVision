"use client"

import type React from "react"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Circle,
  Settings,
  BookOpen,
  Youtube,
  FileText,
  List,
  Sparkles,
  Camera,
  Users,
  Palette,
  Wand2,
} from "lucide-react"
import { useProjectStore } from "@/lib/stores/project-store"
import { useScriptCreationStore } from "@/lib/stores/script-creation-store"
import { Badge } from "@/components/ui/badge"

interface WorkflowStep {
  id: string
  label: string
  description: string
  tabValue: string
  isCompleted: (state: any) => boolean
  icon?: React.ReactNode
  phase: "creation" | "production"
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
      phase: "creation",
    },
    {
      id: "research",
      label: "2. Research",
      description: "Find inspiration from YouTube",
      tabValue: "research",
      isCompleted: (state) => scriptCreationState.selectedTranscripts.length > 0,
      icon: <Youtube className="h-4 w-4" />,
      phase: "creation",
    },
    {
      id: "outline",
      label: "3. Outline",
      description: "Create your story structure",
      tabValue: "outline",
      isCompleted: (state) => scriptCreationState.chapters.length > 0,
      icon: <List className="h-4 w-4" />,
      phase: "creation",
    },
    {
      id: "write",
      label: "4. Write",
      description: "Develop your story chapters",
      tabValue: "write",
      isCompleted: (state) => scriptCreationState.generatedChapters.length > 0,
      icon: <FileText className="h-4 w-4" />,
      phase: "creation",
    },
    {
      id: "enhance",
      label: "5. Enhance",
      description: "Optimize emotional impact",
      tabValue: "enhance",
      isCompleted: (state) => scriptCreationState.enhancedChapters.length > 0,
      icon: <Sparkles className="h-4 w-4" />,
      phase: "creation",
    },
    {
      id: "script",
      label: "6. Script",
      description: "Review final script",
      tabValue: "script",
      isCompleted: (state) => Boolean(projectState.script && projectState.script.length > 0),
      icon: <FileText className="h-4 w-4" />,
      phase: "production",
    },
    {
      id: "shotlist",
      label: "7. Shot List",
      description: "Generate and refine shot list",
      tabValue: "shotlist",
      isCompleted: (state) => projectState.shotList.length > 0,
      icon: <Camera className="h-4 w-4" />,
      phase: "production",
    },
    {
      id: "subjects",
      label: "8. Subjects",
      description: "Manage characters, locations, props",
      tabValue: "subjects",
      isCompleted: (state) => projectState.subjects.length > 0,
      icon: <Users className="h-4 w-4" />,
      phase: "production",
    },
    {
      id: "styles",
      label: "9. Styles",
      description: "Select visual and director styles",
      tabValue: "styles",
      isCompleted: (state) => Boolean(projectState.selectedStyle),
      icon: <Palette className="h-4 w-4" />,
      phase: "production",
    },
    {
      id: "prompts",
      label: "10. Prompts",
      description: "Generate visual prompts",
      tabValue: "prompts",
      isCompleted: (state) => projectState.generatedPrompts.length > 0,
      icon: <Wand2 className="h-4 w-4" />,
      phase: "production",
    },
    {
      id: "developer",
      label: "Developer",
      description: "Advanced template editing",
      tabValue: "developer",
      isCompleted: () => true,
      icon: <Settings className="h-4 w-4" />,
      phase: "production",
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
  const scriptCreationSteps = workflowSteps.filter((step) => step.phase === "creation")
  const productionSteps = workflowSteps.filter((step) => step.phase === "production" && step.id !== "developer")
  const utilitySteps = workflowSteps.filter((step) => step.id === "developer")

  return (
    <div className="mb-6 bg-card border rounded-lg p-4 shadow-md">
      <div className="text-sm text-muted-foreground mb-4">
        Follow these steps to create your script and visual prompts:
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg -m-2 p-2 blur-sm"></div>
          <div className="relative border-b pb-4 rounded-t-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50"
              >
                Phase 1
              </Badge>
              <h3 className="text-base font-semibold text-purple-800 dark:text-purple-300">Script Creation</h3>
            </div>
            <div className="flex flex-wrap gap-2">{scriptCreationSteps.map((step) => renderWorkflowStep(step))}</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg -m-2 p-2 blur-sm"></div>
          <div className="relative border-b pb-4 rounded-t-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50"
              >
                Phase 2
              </Badge>
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300">Production</h3>
            </div>
            <div className="flex flex-wrap gap-2">{productionSteps.map((step) => renderWorkflowStep(step))}</div>
          </div>
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

    // Different styling based on the phase
    const phaseColors = {
      creation: {
        active: "bg-purple-600 text-white hover:bg-purple-700",
        completed:
          "text-purple-700 bg-purple-100 hover:bg-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-800/40",
        default: "text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/20",
      },
      production: {
        active: "bg-amber-600 text-white hover:bg-amber-700",
        completed:
          "text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:hover:bg-amber-800/40",
        default: "text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/20",
      },
    }

    const colorClass = isActive
      ? phaseColors[step.phase].active
      : isCompleted
        ? phaseColors[step.phase].completed
        : phaseColors[step.phase].default

    return (
      <button
        key={step.id}
        onClick={() => onTabChange(step.tabValue)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative shadow-sm",
          colorClass,
          isActive && "ring-2 ring-offset-1",
          step.phase === "creation" ? "ring-purple-400" : "ring-amber-400",
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
