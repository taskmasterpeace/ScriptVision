"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Shot } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Copy, Loader2 } from "lucide-react"

// Import the loading store at the top of the file
import { useLoadingStore } from "@/lib/stores/loading-store"

export default function PromptsTab() {
  const { toast } = useToast()
  const {
    shotList,
    subjects,
    styles,
    directorStyles,
    selectedStyle,
    selectedDirectorStyle,
    generatedPrompts,
    generatePrompt,
    setSelectedStyle,
    setSelectedDirectorStyle,
  } = useProjectStore()

  const [selectedShot, setSelectedShot] = useState<Shot | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [cameraSettings, setCameraSettings] = useState({
    shot: "",
    move: "",
    size: "",
    framing: "",
    depthOfField: "",
    type: "",
    name: "",
    lensType: "",
  })

  // Use the loading store
  const { isLoading } = useLoadingStore()

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)

  const handleGeneratePrompt = async () => {
    if (!selectedShot) {
      toast({
        title: "Shot Required",
        description: "Please select a shot to generate a prompt.",
        variant: "destructive",
      })
      return
    }

    if (!selectedStyle) {
      toast({
        title: "Style Required",
        description: "Please select a visual style from the Styles tab.",
        variant: "destructive",
      })
      return
    }

    try {
      const activeSubjects = subjects.filter((subject) => subject.active && selectedSubjects.includes(subject.id))

      await generatePrompt(selectedShot, activeSubjects, cameraSettings)

      setCurrentPromptIndex(generatedPrompts.length)

      toast({
        title: "Prompt Generated",
        description: "Visual prompt has been successfully generated.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompt.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: `${type} prompt has been copied to clipboard.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Generator</CardTitle>
        <CardDescription>Generate detailed visual prompts for AI image generation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Shot Selection</h3>
              <div className="space-y-2">
                <Label htmlFor="shot-select">Select Shot</Label>
                <Select
                  value={selectedShot?.id || ""}
                  onValueChange={(value) => {
                    const shot = shotList.find((s) => s.id === value)
                    setSelectedShot(shot || null)
                  }}
                >
                  <SelectTrigger id="shot-select">
                    <SelectValue placeholder="Select a shot" />
                  </SelectTrigger>
                  <SelectContent>
                    {shotList.map((shot) => (
                      <SelectItem key={shot.id} value={shot.id}>
                        Scene {shot.scene}, Shot {shot.shot} - {shot.description.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedShot && (
                <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                  <p>
                    <span className="font-medium">Scene:</span> {selectedShot.scene}
                  </p>
                  <p>
                    <span className="font-medium">Shot:</span> {selectedShot.shot}
                  </p>
                  <p>
                    <span className="font-medium">Description:</span> {selectedShot.description}
                  </p>
                  {selectedShot.directorsNotes && (
                    <p>
                      <span className="font-medium">Director's Notes:</span> {selectedShot.directorsNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Subject Selection</h3>
              <div className="h-48 overflow-y-auto border rounded-md p-2">
                {subjects.filter((subject) => subject.active).length > 0 ? (
                  subjects
                    .filter((subject) => subject.active)
                    .map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`subject-${subject.id}`}
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjects([...selectedSubjects, subject.id])
                            } else {
                              setSelectedSubjects(selectedSubjects.filter((id) => id !== subject.id))
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`subject-${subject.id}`} className="text-sm">
                          {subject.name} ({subject.category})
                        </label>
                      </div>
                    ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No active subjects available. Add subjects in the Subjects tab.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Camera Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="camera-shot">Camera Shot</Label>
                  <Select
                    value={cameraSettings.shot}
                    onValueChange={(value) => setCameraSettings({ ...cameraSettings, shot: value })}
                  >
                    <SelectTrigger id="camera-shot">
                      <SelectValue placeholder="Select camera shot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Static">Static</SelectItem>
                      <SelectItem value="Handheld">Handheld</SelectItem>
                      <SelectItem value="Steadicam">Steadicam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camera-move">Camera Movement</Label>
                  <Select
                    value={cameraSettings.move}
                    onValueChange={(value) => setCameraSettings({ ...cameraSettings, move: value })}
                  >
                    <SelectTrigger id="camera-move">
                      <SelectValue placeholder="Select movement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pan">Pan</SelectItem>
                      <SelectItem value="Tilt">Tilt</SelectItem>
                      <SelectItem value="Dolly">Dolly</SelectItem>
                      <SelectItem value="Tracking">Tracking</SelectItem>
                      <SelectItem value="Crane">Crane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camera-size">Shot Size</Label>
                  <Select
                    value={cameraSettings.size}
                    onValueChange={(value) => setCameraSettings({ ...cameraSettings, size: value })}
                  >
                    <SelectTrigger id="camera-size">
                      <SelectValue placeholder="Select shot size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECU">Extreme Close-Up (ECU)</SelectItem>
                      <SelectItem value="CU">Close-Up (CU)</SelectItem>
                      <SelectItem value="MCU">Medium Close-Up (MCU)</SelectItem>
                      <SelectItem value="MS">Medium Shot (MS)</SelectItem>
                      <SelectItem value="MLS">Medium Long Shot (MLS)</SelectItem>
                      <SelectItem value="LS">Long Shot (LS)</SelectItem>
                      <SelectItem value="ELS">Extreme Long Shot (ELS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camera-framing">Framing</Label>
                  <Select
                    value={cameraSettings.framing}
                    onValueChange={(value) => setCameraSettings({ ...cameraSettings, framing: value })}
                  >
                    <SelectTrigger id="camera-framing">
                      <SelectValue placeholder="Select framing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Centered">Centered</SelectItem>
                      <SelectItem value="Rule of Thirds">Rule of Thirds</SelectItem>
                      <SelectItem value="Dutch Angle">Dutch Angle</SelectItem>
                      <SelectItem value="Over the Shoulder">Over the Shoulder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camera-dof">Depth of Field</Label>
                  <Select
                    value={cameraSettings.depthOfField}
                    onValueChange={(value) => setCameraSettings({ ...cameraSettings, depthOfField: value })}
                  >
                    <SelectTrigger id="camera-dof">
                      <SelectValue placeholder="Select depth of field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shallow">Shallow</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Deep">Deep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camera-type">Camera Type</Label>
                  <Select
                    value={cameraSettings.type}
                    onValueChange={(value) => setCameraSettings({ ...cameraSettings, type: value })}
                  >
                    <SelectTrigger id="camera-type">
                      <SelectValue placeholder="Select camera type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Film">Film</SelectItem>
                      <SelectItem value="IMAX">IMAX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Style Selection</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visual-style">Visual Style</Label>
                  <Select
                    value={selectedStyle?.id || ""}
                    onValueChange={(value) => {
                      const style = styles.find((s) => s.id === value)
                      if (style) setSelectedStyle(style)
                    }}
                  >
                    <SelectTrigger id="visual-style">
                      <SelectValue placeholder="Select visual style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director-style">Director Style</Label>
                  <Select
                    value={selectedDirectorStyle?.id || ""}
                    onValueChange={(value) => {
                      const style = directorStyles.find((s) => s.id === value)
                      if (style) setSelectedDirectorStyle(style)
                    }}
                  >
                    <SelectTrigger id="director-style">
                      <SelectValue placeholder="Select director style" />
                    </SelectTrigger>
                    <SelectContent>
                      {directorStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGeneratePrompt}
              disabled={isLoading("generatePrompt") || !selectedShot || !selectedStyle}
              className="w-full"
            >
              {isLoading("generatePrompt") ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Prompt"
              )}
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Generated Prompts</h3>

              {generatedPrompts.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <Label htmlFor="prompt-select">Select Prompt</Label>
                    <Select
                      value={currentPromptIndex.toString()}
                      onValueChange={(value) => setCurrentPromptIndex(Number.parseInt(value))}
                    >
                      <SelectTrigger id="prompt-select">
                        <SelectValue placeholder="Select a prompt" />
                      </SelectTrigger>
                      <SelectContent>
                        {generatedPrompts.map((prompt, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            Prompt {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {generatedPrompts[currentPromptIndex] && (
                    <Accordion type="single" collapsible defaultValue="concise">
                      <AccordionItem value="concise">
                        <AccordionTrigger className="font-medium">
                          Concise Prompt
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(generatedPrompts[currentPromptIndex].concise, "Concise")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-3 bg-muted rounded-md">{generatedPrompts[currentPromptIndex].concise}</div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="normal">
                        <AccordionTrigger className="font-medium">
                          Normal Prompt
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(generatedPrompts[currentPromptIndex].normal, "Normal")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-3 bg-muted rounded-md">{generatedPrompts[currentPromptIndex].normal}</div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="detailed">
                        <AccordionTrigger className="font-medium">
                          Detailed Prompt
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(generatedPrompts[currentPromptIndex].detailed, "Detailed")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-3 bg-muted rounded-md">{generatedPrompts[currentPromptIndex].detailed}</div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  No prompts generated yet. Select a shot and generate a prompt.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Current Style</h3>
              {selectedStyle ? (
                <div className="p-4 border rounded-md space-y-2">
                  <p>
                    <span className="font-medium">Style:</span> {selectedStyle.name}
                  </p>
                  {selectedStyle.genre && (
                    <p>
                      <span className="font-medium">Genre:</span> {selectedStyle.genre}
                    </p>
                  )}
                  {selectedStyle.descriptors && (
                    <p>
                      <span className="font-medium">Descriptors:</span> {selectedStyle.descriptors}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  No style selected. Select a style from the Styles tab.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Current Director Style</h3>
              {selectedDirectorStyle ? (
                <div className="p-4 border rounded-md space-y-2">
                  <p>
                    <span className="font-medium">Director:</span> {selectedDirectorStyle.name}
                  </p>
                  {selectedDirectorStyle.visualStyle && (
                    <p>
                      <span className="font-medium">Visual Style:</span> {selectedDirectorStyle.visualStyle}
                    </p>
                  )}
                  {selectedDirectorStyle.narrativeApproach && (
                    <p>
                      <span className="font-medium">Narrative Approach:</span> {selectedDirectorStyle.narrativeApproach}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  No director style selected. Select a director style from the Styles tab.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
