"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { Loader2, FileText, List } from "lucide-react"
import { useLoadingStore } from "@/lib/stores/loading-store"

export default function ScriptTab() {
  const { toast } = useToast()
  const { script, setScript, generateShotList } = useProjectStore()
  const { isLoading } = useLoadingStore()
  const [localScript, setLocalScript] = useState(script)

  const handleSaveScript = () => {
    setScript(localScript)
    toast({
      title: "Script Saved",
      description: "Your script has been saved.",
    })
  }

  const handleGenerateShotList = async () => {
    if (!localScript.trim()) {
      toast({
        title: "Script is Empty",
        description: "Please enter a script before generating a shot list.",
        variant: "destructive",
      })
      return
    }

    // Save the script first
    setScript(localScript)

    try {
      await generateShotList()
      toast({
        title: "Shot List Generated",
        description: "Your shot list has been generated successfully.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate shot list.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ScriptVision</CardTitle>
        <CardDescription>Enter your script or screenplay to generate a shot list</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter your script here..."
          className="min-h-[300px] font-mono text-sm"
          value={localScript}
          onChange={(e) => setLocalScript(e.target.value)}
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row w-full gap-4">
          <Button onClick={handleSaveScript} className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            Save Script
          </Button>
          <Button
            onClick={handleGenerateShotList}
            className="w-full sm:w-auto"
            disabled={isLoading("generateShotList")}
          >
            {isLoading("generateShotList") ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <List className="mr-2 h-4 w-4" />
                Generate Shot List
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
