"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScriptTab from "@/components/script-tab"
import ShotListTab from "@/components/shot-list-tab"
import SubjectsTab from "@/components/subjects-tab"
import StylesTab from "@/components/styles-tab"
import PromptsTab from "@/components/prompts-tab"
import ImageGenerationTab from "@/components/image-generation-tab"
import MusicLabTab from "@/components/music-lab-tab"
import DeveloperTab from "@/components/developer-tab"
import ProjectManager from "@/components/project-manager"
import { EnhancedWorkflowNavigation } from "@/components/enhanced-workflow-navigation"
import { ProgressJourneyMap } from "@/components/progress-journey-map"
import { Settings } from "lucide-react"
import { ScriptVisionLogo } from "@/components/script-vision-logo"

// Import new script creation components
import StoryThemeTab from "@/components/story-theme-tab"
import ResearchTab from "@/components/research-tab"
import OutlineTab from "@/components/outline-tab"
import WriteTab from "@/components/write-tab"
import EnhanceTab from "@/components/enhance-tab"

export default function Page() {
  const [activeTab, setActiveTab] = useState("story-theme")
  const [showWorkflowNav, setShowWorkflowNav] = useState(true)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
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

      {/* Toggle between navigation styles */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowWorkflowNav(!showWorkflowNav)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Switch to {showWorkflowNav ? "Journey Map" : "Workflow Navigation"}
        </button>
      </div>

      {showWorkflowNav ? (
        <EnhancedWorkflowNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      ) : (
        <ProgressJourneyMap activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex flex-wrap w-full">
          <TabsTrigger id="story-theme-tab-trigger" value="story-theme">
            Story Theme
          </TabsTrigger>
          <TabsTrigger id="research-tab-trigger" value="research">
            Research
          </TabsTrigger>
          <TabsTrigger id="outline-tab-trigger" value="outline">
            Outline
          </TabsTrigger>
          <TabsTrigger id="write-tab-trigger" value="write">
            Write
          </TabsTrigger>
          <TabsTrigger id="enhance-tab-trigger" value="enhance">
            Enhance
          </TabsTrigger>
          <TabsTrigger id="script-tab-trigger" value="script">
            Script
          </TabsTrigger>
          <TabsTrigger id="shotlist-tab-trigger" value="shotlist">
            Shot List
          </TabsTrigger>
          <TabsTrigger id="subjects-tab-trigger" value="subjects">
            Subjects
          </TabsTrigger>
          <TabsTrigger id="styles-tab-trigger" value="styles">
            Styles
          </TabsTrigger>
          <TabsTrigger id="prompts-tab-trigger" value="prompts">
            Prompts
          </TabsTrigger>
          <TabsTrigger id="images-tab-trigger" value="images">
            Images
          </TabsTrigger>
          <TabsTrigger id="musiclab-tab-trigger" value="musiclab">
            Music Lab
          </TabsTrigger>
          <TabsTrigger id="developer-tab-trigger" value="developer" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Developer</span>
          </TabsTrigger>
        </TabsList>

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
        <TabsContent value="images">
          <ImageGenerationTab />
        </TabsContent>
        <TabsContent value="musiclab">
          <MusicLabTab />
        </TabsContent>
        <TabsContent value="developer">
          <DeveloperTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
