"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { useLoadingStore } from "@/lib/stores/loading-store"
import { generateAIResponse } from "@/lib/ai-service"
import { v4 as uuidv4 } from "uuid"
import { Loader2, AlertTriangle, Check, X } from "lucide-react"
import type { Shot } from "@/lib/types"

interface SuggestedShot extends Omit<Shot, "id"> {
  reason: string
}

export default function ShotSuggestions() {
  const { toast } = useToast()
  const { script, shotList, addShots } = useProjectStore()
  const { setLoading, isLoading } = useLoadingStore()
  const [suggestedShots, setSuggestedShots] = useState<SuggestedShot[]>([])
  const [selectedShots, setSelectedShots] = useState<Record<number, boolean>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Function to analyze script and suggest missing shots
  const analyzeShotList = async () => {
    if (!script || shotList.length === 0) {
      toast({
        title: "Cannot Analyze",
        description: "Both script and shot list are required for analysis.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setLoading("suggestShots", true)

    try {
      // Create context for AI to analyze
      const existingShotsText = shotList
        .map(
          (shot) =>
            `Scene ${shot.scene}, Shot ${shot.shot}: ${shot.description}\nShot Size: ${shot.shotSize}\nLocation: ${shot.location}`,
        )
        .join("\n\n")

      // Call AI to suggest missing shots using the shot-suggestions template
      const suggestionsResponse = await generateAIResponse(
        "Analyze this script and existing shot list to suggest additional shots",
        JSON.stringify({
          script,
          existingShots: existingShotsText,
        }),
      )

      console.log("Raw AI suggestions response:", suggestionsResponse)

      // Parse the suggestions
      const parsedSuggestions = parseShotSuggestions(suggestionsResponse)
      console.log("Parsed suggestions:", parsedSuggestions)

      if (parsedSuggestions.length === 0) {
        toast({
          title: "No Suggestions",
          description: "No additional shots were suggested. Your shot list appears to be comprehensive.",
        })
      } else {
        setSuggestedShots(parsedSuggestions)
        // Initialize all suggestions as selected
        const initialSelected = parsedSuggestions.reduce(
          (acc, _, index) => {
            acc[index] = true
            return acc
          },
          {} as Record<number, boolean>,
        )
        setSelectedShots(initialSelected)

        toast({
          title: "Suggestions Ready",
          description: `${parsedSuggestions.length} additional shots have been suggested.`,
        })
      }
    } catch (error) {
      console.error("Failed to analyze shot list:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze shot list.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setLoading("suggestShots", false)
    }
  }

  // Function to parse AI response into suggested shots
  const parseShotSuggestions = (response: string): SuggestedShot[] => {
    // This is a simplified parser - in a real implementation, you'd need more robust parsing
    const suggestions: SuggestedShot[] = []

    // Try to find shot suggestions in the format "Scene X, Shot Y: Description"
    const shotRegex = /Scene\s+(\d+),\s+Shot\s+(\d+(?:\.\d+)?):?\s+(.+?)(?:\n|$)/gi
    let match

    while ((match = shotRegex.exec(response)) !== null) {
      const scene = match[1]
      const shot = match[2]
      const description = match[3].trim()

      // Extract shot size if available
      let shotSize = "MS" // Default to Medium Shot
      const sizeMatch = response.substring(match.index + match[0].length).match(/Shot\s+Size:?\s+([A-Z]{2,3})(?:\n|$)/i)
      if (sizeMatch) {
        shotSize = sizeMatch[1].toUpperCase()
      }

      // Extract reason if available
      let reason = "Suggested to improve visual storytelling"
      const reasonMatch = response
        .substring(match.index + match[0].length)
        .match(/Reason:?\s+(.+?)(?:\n\n|\n(?=Scene)|\n$|$)/i)
      if (reasonMatch) {
        reason = reasonMatch[1].trim()
      }

      // Extract people if available
      let people = ""
      const peopleMatch = response.substring(match.index + match[0].length).match(/People:?\s+(.+?)(?:\n|$)/i)
      if (peopleMatch) {
        people = peopleMatch[1].trim()
      }

      // Extract location if available
      let location = ""
      const locationMatch = response.substring(match.index + match[0].length).match(/Location:?\s+(.+?)(?:\n|$)/i)
      if (locationMatch) {
        location = locationMatch[1].trim()
      }

      // Extract action if available
      let action = description // Default to description
      const actionMatch = response.substring(match.index + match[0].length).match(/Action:?\s+(.+?)(?:\n|$)/i)
      if (actionMatch) {
        action = actionMatch[1].trim()
      }

      // Extract dialogue if available
      let dialogue = ""
      const dialogueMatch = response.substring(match.index + match[0].length).match(/Dialogue:?\s+(.+?)(?:\n|$)/i)
      if (dialogueMatch) {
        dialogue = dialogueMatch[1].trim()
      }

      suggestions.push({
        scene,
        shot,
        description,
        shotSize,
        people,
        action,
        dialogue,
        location,
        reason,
      })
    }

    // If no matches found with the regex, try to extract structured data from JSON-like format
    if (suggestions.length === 0 && response.includes("{") && response.includes("}")) {
      try {
        // Try to extract JSON objects from the response
        const jsonMatches = response.match(/\{[^{}]*\}/g)
        if (jsonMatches) {
          jsonMatches.forEach((jsonStr) => {
            try {
              const shotData = JSON.parse(jsonStr)
              if (shotData.scene && shotData.shot && shotData.description) {
                suggestions.push({
                  scene: shotData.scene,
                  shot: shotData.shot,
                  description: shotData.description,
                  shotSize: shotData.shotSize || "MS",
                  people: shotData.people || "",
                  action: shotData.action || shotData.description,
                  dialogue: shotData.dialogue || "",
                  location: shotData.location || "",
                  reason: shotData.reason || "Suggested to improve visual storytelling",
                })
              }
            } catch (e) {
              console.error("Failed to parse JSON shot data:", e)
            }
          })
        }
      } catch (e) {
        console.error("Failed to extract JSON from response:", e)
      }
    }

    // If still no suggestions, try a line-by-line approach
    if (suggestions.length === 0) {
      const lines = response.split("\n")
      let currentShot: Partial<SuggestedShot> = {}

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Check for scene and shot pattern
        const sceneMatch = trimmedLine.match(/Scene\s+(\d+),\s+Shot\s+(\d+(?:\.\d+)?):?\s+(.+)/i)
        if (sceneMatch) {
          // Save previous shot if we have one
          if (currentShot.scene && currentShot.shot && currentShot.description) {
            suggestions.push({
              scene: currentShot.scene,
              shot: currentShot.shot,
              description: currentShot.description,
              shotSize: currentShot.shotSize || "MS",
              people: currentShot.people || "",
              action: currentShot.action || currentShot.description || "",
              dialogue: currentShot.dialogue || "",
              location: currentShot.location || "",
              reason: currentShot.reason || "Suggested to improve visual storytelling",
            })
          }

          // Start new shot
          currentShot = {
            scene: sceneMatch[1],
            shot: sceneMatch[2],
            description: sceneMatch[3].trim(),
          }
          continue
        }

        // Check for shot properties
        if (trimmedLine.match(/Shot\s+Size:?\s+/i)) {
          currentShot.shotSize = trimmedLine.replace(/Shot\s+Size:?\s+/i, "").trim()
        } else if (trimmedLine.match(/People:?\s+/i)) {
          currentShot.people = trimmedLine.replace(/People:?\s+/i, "").trim()
        } else if (trimmedLine.match(/Location:?\s+/i)) {
          currentShot.location = trimmedLine.replace(/Location:?\s+/i, "").trim()
        } else if (trimmedLine.match(/Action:?\s+/i)) {
          currentShot.action = trimmedLine.replace(/Action:?\s+/i, "").trim()
        } else if (trimmedLine.match(/Dialogue:?\s+/i)) {
          currentShot.dialogue = trimmedLine.replace(/Dialogue:?\s+/i, "").trim()
        } else if (trimmedLine.match(/Reason:?\s+/i)) {
          currentShot.reason = trimmedLine.replace(/Reason:?\s+/i, "").trim()
        } else if (trimmedLine.match(/Description:?\s+/i)) {
          currentShot.description = trimmedLine.replace(/Description:?\s+/i, "").trim()
        }
      }

      // Add the last shot if we have one
      if (currentShot.scene && currentShot.shot && currentShot.description) {
        suggestions.push({
          scene: currentShot.scene,
          shot: currentShot.shot,
          description: currentShot.description,
          shotSize: currentShot.shotSize || "MS",
          people: currentShot.people || "",
          action: currentShot.action || currentShot.description || "",
          dialogue: currentShot.dialogue || "",
          location: currentShot.location || "",
          reason: currentShot.reason || "Suggested to improve visual storytelling",
        })
      }
    }

    return suggestions
  }

  // Function to add selected shots to the shot list
  const addSelectedShots = () => {
    const shotsToAdd = suggestedShots.filter((_, index) => selectedShots[index])

    if (shotsToAdd.length === 0) {
      toast({
        title: "No Shots Selected",
        description: "Please select at least one shot to add.",
        variant: "destructive",
      })
      return
    }

    // Add each selected shot to the shot list
    const newShots = shotsToAdd.map((shot) => ({
      ...shot,
      id: uuidv4(),
    }))

    addShots(newShots)

    toast({
      title: "Shots Added",
      description: `${shotsToAdd.length} new shots have been added to your shot list.`,
    })

    // Clear suggestions after adding
    setSuggestedShots([])
    setSelectedShots({})
  }

  // Toggle selection of a suggested shot
  const toggleShotSelection = (index: number) => {
    setSelectedShots((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Select or deselect all shots
  const toggleAllShots = (selected: boolean) => {
    const newSelection = suggestedShots.reduce(
      (acc, _, index) => {
        acc[index] = selected
        return acc
      },
      {} as Record<number, boolean>,
    )

    setSelectedShots(newSelection)
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Shot List Analysis</CardTitle>
        <Button
          onClick={analyzeShotList}
          disabled={isAnalyzing || !script || shotList.length === 0}
          variant="outline"
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze & Suggest Shots"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {suggestedShots.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {Object.values(selectedShots).filter(Boolean).length} of {suggestedShots.length} shots selected
              </p>
              <div className="space-x-2">
                <Button onClick={() => toggleAllShots(true)} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={() => toggleAllShots(false)} variant="outline" size="sm">
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="border rounded-md divide-y">
              {suggestedShots.map((shot, index) => (
                <div key={index} className="p-4 flex items-start gap-3">
                  <Checkbox
                    checked={selectedShots[index] || false}
                    onCheckedChange={() => toggleShotSelection(index)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Scene {shot.scene}</Badge>
                      <Badge variant="outline">Shot {shot.shot}</Badge>
                      {shot.shotSize && <Badge variant="secondary">{shot.shotSize}</Badge>}
                    </div>
                    <p className="font-medium">{shot.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">{shot.reason}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-500"
                      onClick={() => {
                        toggleShotSelection(index)
                        setSelectedShots((prev) => ({ ...prev, [index]: true }))
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => {
                        toggleShotSelection(index)
                        setSelectedShots((prev) => ({ ...prev, [index]: false }))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={addSelectedShots} disabled={Object.values(selectedShots).filter(Boolean).length === 0}>
                Add Selected Shots
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Shot Suggestions Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Click "Analyze & Suggest Shots" to have AI analyze your script and shot list for potential missing shots.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
