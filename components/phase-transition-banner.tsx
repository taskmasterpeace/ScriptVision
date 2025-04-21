"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useProjectStore } from "@/lib/stores/project-store"
import { useScriptCreationStore } from "@/lib/stores/script-creation-store"
import { ArrowRight, Lightbulb, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhaseInfo {
  phase: "creation" | "production"
  title: string
  description: string
  icon: React.ReactNode
  color: string
  nextTab: string
  condition: () => boolean
}

export function PhaseTransitionBanner({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const [showBanner, setShowBanner] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<"creation" | "production">("creation")
  const projectState = useProjectStore()
  const scriptCreationState = useScriptCreationStore()

  const phaseInfo: Record<string, PhaseInfo> = {
    creation: {
      phase: "creation",
      title: "Script Creation Phase",
      description: "Create your story from concept to final script",
      icon: <Lightbulb className="h-6 w-6" />,
      color: "from-purple-600 to-indigo-600",
      nextTab: "story-theme",
      condition: () => true,
    },
    production: {
      phase: "production",
      title: "Production Phase",
      description: "Transform your script into visual prompts",
      icon: <Camera className="h-6 w-6" />,
      color: "from-amber-600 to-orange-600",
      nextTab: "script",
      condition: () => scriptCreationState.enhancedChapters.length > 0,
    },
  }

  // Determine which phase the current tab belongs to
  useEffect(() => {
    const creationTabs = ["story-theme", "research", "outline", "write", "enhance"]
    const productionTabs = ["script", "shotlist", "subjects", "styles", "prompts", "musiclab"]

    if (creationTabs.includes(activeTab)) {
      setCurrentPhase("creation")
    } else if (productionTabs.includes(activeTab)) {
      setCurrentPhase("production")
    }
  }, [activeTab])

  // Show banner when transitioning between phases
  useEffect(() => {
    const creationComplete = scriptCreationState.enhancedChapters.length > 0
    const isLastCreationTab = activeTab === "enhance"
    const isFirstProductionTab = activeTab === "script"

    // Show banner when on the last creation tab and creation is complete
    if (isLastCreationTab && creationComplete) {
      setShowBanner(true)
    }
    // Or when on the first production tab and coming from creation
    else if (isFirstProductionTab && !projectState.script) {
      setShowBanner(true)
    } else {
      setShowBanner(false)
    }
  }, [activeTab, scriptCreationState.enhancedChapters, projectState.script])

  const handleProceed = () => {
    if (currentPhase === "creation" && phaseInfo.production.condition()) {
      onTabChange("script")
    } else if (currentPhase === "production") {
      onTabChange("story-theme")
    }
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div
            className={`bg-gradient-to-r ${phaseInfo[currentPhase === "creation" ? "production" : "creation"].color} text-white rounded-lg p-4 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  {currentPhase === "creation" ? <Camera className="h-6 w-6" /> : <Lightbulb className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {currentPhase === "creation" ? "Ready for Production!" : "Back to Creation"}
                  </h3>
                  <p className="text-white/80">
                    {currentPhase === "creation"
                      ? "Your script is complete! Move to the production phase to create visual prompts."
                      : "Return to the script creation phase to modify your story."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                  onClick={() => setShowBanner(false)}
                >
                  Dismiss
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90 gap-2"
                  onClick={handleProceed}
                >
                  {currentPhase === "creation" ? (
                    <>
                      Proceed to Production <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Return to Creation <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
