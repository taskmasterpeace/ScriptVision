"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useProjectStore } from "@/lib/stores/project-store"
import { ChevronDown, ChevronUp, Bug, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function ShotListDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [rawShotList, setRawShotList] = useState("")
  const { shotList, script } = useProjectStore()
  const { toast } = useToast()

  // Function to manually parse the shot list
  const handleManualParse = async () => {
    if (!rawShotList.trim()) {
      toast({
        title: "No Shot List Text",
        description: "Please enter the raw shot list text to parse.",
        variant: "destructive",
      })
      return
    }

    try {
      // We'll use the window object to access the parseAIShotList function
      // This is just for debugging purposes
      const parsedShots = (window as any).parseAIShotList(rawShotList)

      console.log("Manually parsed shots:", parsedShots)
      toast({
        title: "Parsing Complete",
        description: `Parsed ${parsedShots.length} shots. Check the console for details.`,
      })
    } catch (error) {
      console.error("Error parsing shot list:", error)
      toast({
        title: "Parsing Failed",
        description: error instanceof Error ? error.message : "Failed to parse shot list.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="mt-6 border-dashed border-yellow-500">
      <CardHeader className="pb-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-between">
              <CardTitle className="text-md flex items-center">
                <Bug className="h-4 w-4 mr-2" /> Shot List Debug Panel
              </CardTitle>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Shot List State ({shotList.length} shots)</h3>
                  <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
                    <pre className="text-xs">{JSON.stringify(shotList, null, 2)}</pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Manual Shot List Parser</h3>
                  <p className="text-xs text-muted-foreground">
                    Paste the raw shot list text below to test the parser function.
                  </p>
                  <Textarea
                    value={rawShotList}
                    onChange={(e) => setRawShotList(e.target.value)}
                    placeholder="Paste raw shot list text here..."
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Current shot list:", shotList)
                        console.log("Current script:", script)
                      }}
                    >
                      Log State to Console
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleManualParse}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Test Parser
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}
