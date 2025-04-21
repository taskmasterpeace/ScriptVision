"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScriptTab from "@/components/script-tab"
import ShotListTab from "@/components/shot-list-tab"
import SubjectsTab from "@/components/subjects-tab"
import StylesTab from "@/components/styles-tab"
import PromptsTab from "@/components/prompts-tab"
import MusicLabTab from "@/components/music-lab-tab"
import DeveloperTab from "@/components/developer-tab"
import ProjectManager from "@/components/project-manager"
import { EnhancedWorkflowNavigation } from "@/components/enhanced-workflow-navigation"
import { Settings } from "lucide-react"
import { ScriptVisionLogo } from "@/components/script-vision-logo"
import { PhaseTransitionBanner } from "@/components/phase-transition-banner"
import { AnimatedTabIndicator } from "@/components/animated-tab-indicator"
import { motion, AnimatePresence } from "framer-motion"

// Import new script creation components
import StoryThemeTab from "@/components/story-theme-tab"
import ResearchTab from "@/components/research-tab"
import OutlineTab from "@/components/outline-tab"
import WriteTab from "@/components/write-tab"
import EnhanceTab from "@/components/enhance-tab"

export default function Page() {
  const [activeTab, setActiveTab] = useState("story-theme")
  const [previousTab, setPreviousTab] = useState("")

  const handleTabChange = (value: string) => {
    setPreviousTab(activeTab)
    setActiveTab(value)
  }

  // Determine if the current tab is in the creation or production phase
  const isCreationPhase = ["story-theme", "research", "outline", "write", "enhance"].includes(activeTab)
  const isProductionPhase = ["script", "shotlist", "subjects", "styles", "prompts", "musiclab"].includes(activeTab)

  // Determine the direction of the animation
  const getAnimationDirection = () => {
    const creationTabs = ["story-theme", "research", "outline", "write", "enhance"]
    const productionTabs = ["script", "shotlist", "subjects", "styles", "prompts", "musiclab"]

    const prevIndex = [...creationTabs, ...productionTabs].indexOf(previousTab)
    const currentIndex = [...creationTabs, ...productionTabs].indexOf(activeTab)

    return prevIndex < currentIndex ? 1 : -1
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="mb-6">
        <ScriptVisionLogo />
        <p className="text-muted-foreground mt-2">
          Transform scripts into detailed visual prompts for AI image generation
        </p>
      </header>

      <ProjectManager />

      <PhaseTransitionBanner activeTab={activeTab} onTabChange={handleTabChange} />

      <EnhancedWorkflowNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="relative">
          <TabsList className="grid grid-cols-12 w-full">
            <TabsTrigger
              id="story-theme-tab-trigger"
              value="story-theme"
              className={isCreationPhase ? "data-[state=active]:text-purple-800 data-[state=active]:font-medium" : ""}
            >
              Story Theme
            </TabsTrigger>
            <TabsTrigger
              id="research-tab-trigger"
              value="research"
              className={isCreationPhase ? "data-[state=active]:text-purple-800 data-[state=active]:font-medium" : ""}
            >
              Research
            </TabsTrigger>
            <TabsTrigger
              id="outline-tab-trigger"
              value="outline"
              className={isCreationPhase ? "data-[state=active]:text-purple-800 data-[state=active]:font-medium" : ""}
            >
              Outline
            </TabsTrigger>
            <TabsTrigger
              id="write-tab-trigger"
              value="write"
              className={isCreationPhase ? "data-[state=active]:text-purple-800 data-[state=active]:font-medium" : ""}
            >
              Write
            </TabsTrigger>
            <TabsTrigger
              id="enhance-tab-trigger"
              value="enhance"
              className={isCreationPhase ? "data-[state=active]:text-purple-800 data-[state=active]:font-medium" : ""}
            >
              Enhance
            </TabsTrigger>
            <TabsTrigger
              id="script-tab-trigger"
              value="script"
              className={isProductionPhase ? "data-[state=active]:text-amber-800 data-[state=active]:font-medium" : ""}
            >
              Script
            </TabsTrigger>
            <TabsTrigger
              id="shotlist-tab-trigger"
              value="shotlist"
              className={isProductionPhase ? "data-[state=active]:text-amber-800 data-[state=active]:font-medium" : ""}
            >
              Shot List
            </TabsTrigger>
            <TabsTrigger
              id="subjects-tab-trigger"
              value="subjects"
              className={isProductionPhase ? "data-[state=active]:text-amber-800 data-[state=active]:font-medium" : ""}
            >
              Subjects
            </TabsTrigger>
            <TabsTrigger
              id="styles-tab-trigger"
              value="styles"
              className={isProductionPhase ? "data-[state=active]:text-amber-800 data-[state=active]:font-medium" : ""}
            >
              Styles
            </TabsTrigger>
            <TabsTrigger
              id="prompts-tab-trigger"
              value="prompts"
              className={isProductionPhase ? "data-[state=active]:text-amber-800 data-[state=active]:font-medium" : ""}
            >
              Prompts
            </TabsTrigger>
            <TabsTrigger
              id="musiclab-tab-trigger"
              value="musiclab"
              className={isProductionPhase ? "data-[state=active]:text-amber-800 data-[state=active]:font-medium" : ""}
            >
              Music Lab
            </TabsTrigger>
            <TabsTrigger
              id="developer-tab-trigger"
              value="developer"
              className="flex items-center gap-1 data-[state=active]:text-gray-800 data-[state=active]:font-medium"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Developer</span>
            </TabsTrigger>
          </TabsList>

          <AnimatedTabIndicator activeTab={activeTab} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 * getAnimationDirection() }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 * getAnimationDirection() }}
            transition={{ duration: 0.2 }}
          >
            {/* Script Creation Tabs */}
            <TabsContent value="story-theme">
              <StoryThemeTab />
            </TabsContent>
            <TabsContent value="research">
              <ResearchTab />
            </TabsContent>
            <TabsContent value="outline">
              <OutlineTab />
            </TabsContent>
            <TabsContent value="write">
              <WriteTab />
            </TabsContent>
            <TabsContent value="enhance">
              <EnhanceTab />
            </TabsContent>

            {/* Original Tabs */}
            <TabsContent value="script">
              <ScriptTab />
            </TabsContent>
            <TabsContent value="shotlist">
              <ShotListTab />
            </TabsContent>
            <TabsContent value="subjects">
              <SubjectsTab />
            </TabsContent>
            <TabsContent value="styles">
              <StylesTab />
            </TabsContent>
            <TabsContent value="prompts">
              <PromptsTab />
            </TabsContent>
            <TabsContent value="musiclab">
              <MusicLabTab />
            </TabsContent>
            <TabsContent value="developer">
              <DeveloperTab />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
