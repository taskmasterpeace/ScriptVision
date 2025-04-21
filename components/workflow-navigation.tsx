"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useProjectStore } from "@/lib/stores/project-store"
import { CheckCircle2 } from "lucide-react"

export default function WorkflowNavigation() {
  const { script, shotList, subjects, generatedPrompts, workflowProgress } = useProjectStore()
  const [activeTab, setActiveTab] = useState("script")

  // Update the active tab based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash) {
        setActiveTab(hash)
      }
    }

    // Set initial tab based on hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    window.location.hash = tabId
    document.getElementById(`${tabId}-tab-trigger`)?.click()
  }

  // Determine if a step is completed
  const isStepCompleted = (step: string) => {
    switch (step) {
      case "script":
        return Boolean(script && script.trim().length > 0)
      case "shotlist":
        return shotList.length > 0
      case "subjects":
        return subjects.length > 0
      case "prompts":
        return generatedPrompts.length > 0
      default:
        return false
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "script" ? "default" : "outline"}
            onClick={() => handleTabClick("script")}
            className="relative"
            id="script-workflow-button"
          >
            1. Script
            {isStepCompleted("script") && <CheckCircle2 className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />}
          </Button>
          <Button
            variant={activeTab === "shotlist" ? "default" : "outline"}
            onClick={() => handleTabClick("shotlist")}
            className="relative"
            id="shotlist-workflow-button"
          >
            2. Shot List
            {isStepCompleted("shotlist") && (
              <CheckCircle2 className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            )}
          </Button>
          <Button
            variant={activeTab === "subjects" ? "default" : "outline"}
            onClick={() => handleTabClick("subjects")}
            className="relative"
            id="subjects-workflow-button"
          >
            3. Subjects
            {isStepCompleted("subjects") && (
              <CheckCircle2 className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            )}
          </Button>
          <Button
            variant={activeTab === "styles" ? "default" : "outline"}
            onClick={() => handleTabClick("styles")}
            className="relative"
            id="styles-workflow-button"
          >
            4. Styles
            {workflowProgress.stylesCompleted && (
              <CheckCircle2 className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            )}
          </Button>
          <Button
            variant={activeTab === "prompts" ? "default" : "outline"}
            onClick={() => handleTabClick("prompts")}
            className="relative"
            id="prompts-workflow-button"
          >
            5. Prompts
            {isStepCompleted("prompts") && <CheckCircle2 className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
