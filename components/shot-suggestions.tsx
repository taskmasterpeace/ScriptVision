"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjectStore } from "@/lib/stores/project-store"
import { useLoadingStore } from "@/lib/stores/loading-store"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react"
import { generateAIResponse } from "@/lib/ai-service"
import type { Shot } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

export default function ShotSuggestions() {
  const { toast } = useToast()
  const { shotList, script, addShots } = useProjectStore()
  const { isLoading, setLoading } = useLoadingStore()
  const [suggestedShots, setSuggestedShots] = useState<Shot[]>([])
  const [selectedShots, setSelectedShots] = useState<Set<string>>(new Set())

  const handleGenerateSuggestions = async () => {
    if (shotList.length === 0) {
      toast({
        title: "No Shot List",
        description: "Please generate a shot list first before requesting suggestions.",
        variant: "destructive",
      })
      return
    }

    setLoading("generateShotSuggestions", true)

    try {
      // Prepare context for AI - include both script and existing shots
      const context = {
        script,
        existingShots: shotList.map((shot) => ({
          scene: shot.scene,
          shot: shot.shot,
          shotSize: shot.shotSize,
          description: shot.description,
          people: shot.people,
          action: shot.action,
          dialogue: shot.dialogue,
          location: shot.location,
        })),
      }

      // Call AI service to get suggestions
      const suggestionsText = await generateAIResponse(
        "Suggest additional shots to enhance the shot list",
        JSON.stringify(context),
      )

      // Parse the suggestions into structured data
      const parsedShots = parseShotSuggestions(suggestionsText)

      if (parsedShots.length === 0) {
        throw new Error("No valid shot suggestions were generated. Please try again.")
      }

      // Set the suggested shots
      setSuggestedShots(parsedShots)
      // Clear any previously selected shots
      setSelectedShots(new Set())

      toast({
        title: "Suggestions Generated",
        description: `${parsedShots.length} additional shots have been suggested.`,
      })
    } catch (error) {
      console.error("Failed to generate shot suggestions:", error)
      toast({
        title: "Suggestion Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate shot suggestions.",
        variant: "destructive",
      })
    } finally {
      setLoading("generateShotSuggestions", false)
    }
  }

  const toggleShotSelection = (shotId: string) => {
    const newSelected = new Set(selectedShots)
    if (newSelected.has(shotId)) {
      newSelected.delete(shotId)
    } else {
      newSelected.add(shotId)
    }
    setSelectedShots(newSelected)
  }

  const handleAddSelectedShots = () => {
    if (selectedShots.size === 0) {
      toast({
        title: "No Shots Selected",
        description: "Please select at least one shot to add to your shot list.",
        variant: "destructive",
      })
      return
    }

    // Filter the selected shots
    const shotsToAdd = suggestedShots.filter((shot) => selectedShots.has(shot.id))

    // Add the selected shots to the shot list
    addShots(shotsToAdd)

    // Remove the added shots from suggestions
    setSuggestedShots(suggestedShots.filter((shot) => !selectedShots.has(shot.id)))

    // Clear the selection
    setSelectedShots(new Set())

    toast({
      title: "Shots Added",
      description: `${shotsToAdd.length} shots have been added to your shot list.`,
    })
  }

  // Helper function to parse shot suggestions from AI response
  function parseShotSuggestions(suggestionsText: string): Shot[] {
    const shots: Shot[] = []

    // Try to extract scene and shot information using regex patterns
    const shotPatterns = [
      // Pattern: "Scene X, Shot Y: Description"
      /Scene\s+(\d+),\s+Shot\s+(\d+(?:\.\d+)?)[^:]*:?\s*([^\n]+)/gi,
      // Pattern: "Scene X, Shot Y.Z: Description"
      /Scene\s+(\d+),\s+Shot\s+(\d+\.\d+)[^:]*:?\s*([^\n]+)/gi,
      // Pattern: "Shot Y (Scene X): Description"
      /Shot\s+(\d+(?:\.\d+)?)\s*$$Scene\s+(\d+)$$[^:]*:?\s*([^\n]+)/gi,
      // Pattern: "Shot Y: Description" (assume Scene 1 if not specified)
      /Shot\s+(\d+(?:\.\d+)?)[^:]*:?\s*([^\n]+)/gi,
    ]

    // Process each line to extract shot information
    const lines = suggestionsText.split("\n")
    let currentScene = "1"
    let currentShot = ""
    let currentShotData: Partial<Shot> = {}
    let inShotBlock = false

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Check for scene markers
      const sceneMatch = trimmedLine.match(/Scene\s+(\d+)/i)
      if (sceneMatch) {
        // Save previous shot if we have one
        if (inShotBlock && currentShotData.scene && currentShotData.shot) {
          shots.push({
            id: uuidv4(),
            scene: currentShotData.scene,
            shot: currentShotData.shot,
            shotSize: currentShotData.shotSize || "",
            description: currentShotData.description || "",
            people: currentShotData.people || "",
            action: currentShotData.action || "",
            dialogue: currentShotData.dialogue || "",
            location: currentShotData.location || "",
          })
          currentShotData = {}
          inShotBlock = false
        }

        currentScene = sceneMatch[1]
        continue
      }

      // Check for shot markers
      const shotMatch = trimmedLine.match(/Shot\s+(\d+(?:\.\d+)?)/i)
      if (shotMatch) {
        // Save previous shot if we have one
        if (inShotBlock && currentShotData.scene && currentShotData.shot) {
          shots.push({
            id: uuidv4(),
            scene: currentShotData.scene,
            shot: currentShotData.shot,
            shotSize: currentShotData.shotSize || "",
            description: currentShotData.description || "",
            people: currentShotData.people || "",
            action: currentShotData.action || "",
            dialogue: currentShotData.dialogue || "",
            location: currentShotData.location || "",
          })
        }

        // Start new shot
        currentShot = shotMatch[1]
        currentShotData = { scene: currentScene, shot: currentShot }
        inShotBlock = true

        // Extract description if it's on the same line
        const descMatch = trimmedLine.match(/Shot\s+\d+(?:\.\d+)?[^:]*:?\s*(.+)$/i)
        if (descMatch) {
          currentShotData.description = descMatch[1].trim()
        }

        continue
      }

      // If we're in a shot block, check for shot properties
      if (inShotBlock) {
        if (trimmedLine.match(/Shot\s+Size:/i)) {
          currentShotData.shotSize = trimmedLine.replace(/Shot\s+Size:\s*/i, "").trim()
        } else if (trimmedLine.match(/Description:/i)) {
          currentShotData.description = trimmedLine.replace(/Description:\s*/i, "").trim()
        } else if (trimmedLine.match(/People:/i)) {
          currentShotData.people = trimmedLine.replace(/People:\s*/i, "").trim()
        } else if (trimmedLine.match(/Action:/i)) {
          currentShotData.action = trimmedLine.replace(/Action:\s*/i, "").trim()
        } else if (trimmedLine.match(/Dialogue:/i)) {
          currentShotData.dialogue = trimmedLine.replace(/Dialogue:\s*/i, "").trim()
        } else if (trimmedLine.match(/Location:/i)) {
          currentShotData.location = trimmedLine.replace(/Location:\s*/i, "").trim()
        } else if (trimmedLine.match(/Reason:/i)) {
          // Skip reason lines - they're just for context
          continue
        } else if (!currentShotData.description) {
          // If we don't have a description yet, use this line
          currentShotData.description = trimmedLine
        }
      }
    }

    // Add the last shot if we have one
    if (inShotBlock && currentShotData.scene && currentShotData.shot) {
      shots.push({
        id: uuidv4(),
        scene: currentShotData.scene,
        shot: currentShotData.shot,
        shotSize: currentShotData.shotSize || "",
        description: currentShotData.description || "",
        people: currentShotData.people || "",
        action: currentShotData.action || "",
        dialogue: currentShotData.dialogue || "",
        location: currentShotData.location || "",
      })
    }

    // If we couldn't extract shots with the line-by-line approach, try regex patterns
    if (shots.length === 0) {
      for (const pattern of shotPatterns) {
        let match
        while ((match = pattern.exec(suggestionsText)) !== null) {
          // Extract scene and shot numbers based on the pattern
          let sceneNumber, shotNumber, description

          if (pattern.source.includes("\\(Scene")) {
            // Pattern: "Shot Y (Scene X): Description"
            shotNumber = match[1]
            sceneNumber = match[2]
            description = match[3]
          } else if (pattern.source.includes("Scene\\s+$$\\d+$$")) {
            // Pattern: "Scene X, Shot Y: Description"
            sceneNumber = match[1]
            shotNumber = match[2]
            description = match[3]
          } else if (pattern.source.includes("Shot\\s+$$\\d+(?:\\.\\d+)?$$")) {
            // Pattern: "Shot Y: Description" (assume Scene 1)
            shotNumber = match[1]
            sceneNumber = currentScene
            description = match[2]
          } else {
            // Default fallback
            shotNumber = match[1] || "1"
            sceneNumber = match[2] || currentScene
            description = match[3] || match[2] || ""
          }

          // Create a basic shot object
          const shot: Shot = {
            id: uuidv4(),
            scene: sceneNumber,
            shot: shotNumber,
            description: description.trim(),
            shotSize: "",
            people: "",
            action: "",
            dialogue: "",
            location: "",
          }

          // Try to extract additional details from surrounding text
          const shotIndex = match.index
          const nextShotIndex = suggestionsText.indexOf("Shot", shotIndex + 5)
          const contextText =
            nextShotIndex > shotIndex
              ? suggestionsText.substring(shotIndex, nextShotIndex)
              : suggestionsText.substring(shotIndex, shotIndex + 500)

          // Extract shot size
          const sizeMatch = contextText.match(/(?:Shot\s+Size|Size):\s*([^\n]+)/i)
          if (sizeMatch) shot.shotSize = sizeMatch[1].trim()

          // Extract people
          const peopleMatch = contextText.match(/People(?:\s+in\s+the\s+Shot)?:\s*([^\n]+)/i)
          if (peopleMatch) shot.people = peopleMatch[1].trim()

          // Extract action
          const actionMatch = contextText.match(/Action:\s*([^\n]+)/i)
          if (actionMatch) shot.action = actionMatch[1].trim()

          // Extract dialogue
          const dialogueMatch = contextText.match(/Dialogue:\s*([^\n]+)/i)
          if (dialogueMatch) shot.dialogue = dialogueMatch[1].trim()

          // Extract location
          const locationMatch = contextText.match(/Location:\s*([^\n]+)/i)
          if (locationMatch) shot.location = locationMatch[1].trim()

          shots.push(shot)
        }

        // If we found shots with this pattern, stop trying others
        if (shots.length > 0) break
      }
    }

    return shots
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Shot Suggestions</CardTitle>
          <CardDescription>Get AI suggestions for additional shots</CardDescription>
        </div>
        <Button
          onClick={handleGenerateSuggestions}
          disabled={isLoading("generateShotSuggestions") || shotList.length === 0}
          variant="outline"
        >
          {isLoading("generateShotSuggestions") ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analyze & Suggest
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {suggestedShots.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Select the shots you want to add to your shot list:</p>
            {suggestedShots.map((shot) => (
              <div
                key={shot.id}
                className={`p-4 border rounded-md ${
                  selectedShots.has(shot.id) ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">
                      Scene {shot.scene}, Shot {shot.shot}
                      {shot.shotSize ? ` - ${shot.shotSize}` : ""}
                    </h4>
                    <p className="mt-1">{shot.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {shot.people && (
                        <div className="text-sm">
                          <span className="font-medium">People:</span> {shot.people}
                        </div>
                      )}
                      {shot.location && (
                        <div className="text-sm">
                          <span className="font-medium">Location:</span> {shot.location}
                        </div>
                      )}
                      {shot.action && (
                        <div className="text-sm">
                          <span className="font-medium">Action:</span> {shot.action}
                        </div>
                      )}
                      {shot.dialogue && (
                        <div className="text-sm">
                          <span className="font-medium">Dialogue:</span> {shot.dialogue}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={selectedShots.has(shot.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleShotSelection(shot.id)}
                    className="ml-2"
                  >
                    {selectedShots.has(shot.id) ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md bg-muted/10">
            <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Shot Suggestions Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Click "Analyze & Suggest" to get AI-generated suggestions for additional shots that could enhance your
              shot list.
            </p>
          </div>
        )}
      </CardContent>
      {suggestedShots.length > 0 && (
        <CardFooter>
          <Button onClick={handleAddSelectedShots} disabled={selectedShots.size === 0} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Selected Shots ({selectedShots.size})
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
