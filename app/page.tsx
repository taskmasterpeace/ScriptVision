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
import { WorkflowNavigation } from "@/components/workflow-navigation"
import { Settings } from "lucide-react"
import { ScriptVisionLogo } from "@/components/script-vision-logo"

export default function Page() {
  const [activeTab, setActiveTab] = useState("script")

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

      <WorkflowNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
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
          <TabsTrigger id="musiclab-tab-trigger" value="musiclab">
            Music Lab
          </TabsTrigger>
          <TabsTrigger id="developer-tab-trigger" value="developer" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Developer</span>
          </TabsTrigger>
        </TabsList>
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
      </Tabs>
    </div>
  )
}
