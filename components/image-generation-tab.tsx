"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import {
  useImageGenerationStore,
  type GeneratedImage,
  type ImageGenerationSettings,
} from "@/lib/stores/image-generation-store"
import { useModelStore } from "@/lib/stores/model-store"
import { createPrediction, waitForPrediction, cancelPrediction, generateMockImageUrl } from "@/lib/replicate-service"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { v4 as uuidv4 } from "uuid"
import { AlertTriangle, Copy, Download, ImageIcon, Loader2, Settings, Trash2, X } from "lucide-react"
import BulkImageGeneration from "./bulk-image-generation"

export default function ImageGenerationTab() {
  const { toast } = useToast()
  const { generatedPrompts, shotList } = useProjectStore()
  const { replicateApiToken } = useModelStore()
  const {
    selectedPromptIds,
    generatedImages,
    defaultSettings,
    isGenerating,
    selectPrompt,
    unselectPrompt,
    togglePromptSelection,
    selectAllPrompts,
    clearPromptSelection,
    updateDefaultSettings,
    addGeneratedImage,
    updateImageStatus,
    updateImagePredictionId,
    removeGeneratedImage,
    setIsGenerating,
  } = useImageGenerationStore()

  const [activeTab, setActiveTab] = useState("prompt-selection")
  const [showSettings, setShowSettings] = useState(false)
  const [customSettings, setCustomSettings] = useState<ImageGenerationSettings>({ ...defaultSettings })

  // Check if the Replicate API token is set
  const isReplicateConfigured = Boolean(replicateApiToken)

  // Generate images for selected prompts
  const handleGenerateImages = async () => {
    if (selectedPromptIds.length === 0) {
      toast({
        title: "No prompts selected",
        description: "Please select at least one prompt to generate images.",
        variant: "destructive",
      })
      return
    }

    if (!isReplicateConfigured) {
      toast({
        title: "Replicate API not configured",
        description: "Please add your Replicate API token in the Models tab.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Process each selected prompt
      for (const promptId of selectedPromptIds) {
        const prompt = generatedPrompts.find((p) => p.id === promptId)
        if (!prompt) continue

        // Create a placeholder for the image
        const imageId = uuidv4()
        const newImage: GeneratedImage = {
          id: imageId,
          promptId,
          imageUrl: "",
          timestamp: new Date().toISOString(),
          settings: { ...customSettings },
          status: "generating",
        }

        addGeneratedImage(newImage)

        try {
          // Create a prediction using the Replicate API
          const prediction = await createPrediction(prompt.normal, customSettings)

          // Store the prediction ID with the image
          updateImagePredictionId(imageId, prediction.id)

          // Wait for the prediction to complete
          const result = await waitForPrediction(prediction.id)

          if (result.status === "succeeded" && result.output && result.output.length > 0) {
            // Update the image with the generated URL
            const updatedImage = {
              ...newImage,
              imageUrl: result.output[0],
              status: "completed" as const,
            }

            // Remove the old placeholder and add the updated image
            removeGeneratedImage(imageId)
            addGeneratedImage(updatedImage)
          } else {
            updateImageStatus(imageId, "failed", result.error || "No image was generated")
          }
        } catch (error) {
          console.error(`Error generating image for prompt ${promptId}:`, error)
          updateImageStatus(imageId, "failed", error instanceof Error ? error.message : "Unknown error")
        }
      }

      // Switch to the generated images tab
      setActiveTab("generated-images")

      toast({
        title: "Image generation complete",
        description: `Generated images for ${selectedPromptIds.length} prompts.`,
      })
    } catch (error) {
      console.error("Error in image generation process:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle downloading an image
  const handleDownloadImage = (image: GeneratedImage) => {
    if (!image.imageUrl) return

    const link = document.createElement("a")
    link.href = image.imageUrl
    link.download = `image-${image.id.substring(0, 8)}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Image downloaded",
      description: "The image has been downloaded to your device.",
    })
  }

  // Handle removing an image
  const handleRemoveImage = (imageId: string) => {
    removeGeneratedImage(imageId)

    toast({
      title: "Image removed",
      description: "The image has been removed from your collection.",
    })
  }

  // Select all prompts
  const handleSelectAllPrompts = () => {
    const allPromptIds = generatedPrompts.map((prompt) => prompt.id)
    selectAllPrompts(allPromptIds)
  }

  // Get the prompt for an image
  const getPromptForImage = (image: GeneratedImage) => {
    return generatedPrompts.find((p) => p.id === image.promptId)
  }

  // Copy prompt to clipboard
  const copyPromptToClipboard = (promptId: string) => {
    const prompt = generatedPrompts.find((p) => p.id === promptId)
    if (!prompt) return

    navigator.clipboard.writeText(prompt.normal)
    toast({
      title: "Prompt copied",
      description: "The prompt has been copied to your clipboard.",
    })
  }

  // Update settings
  const handleUpdateSettings = () => {
    updateDefaultSettings(customSettings)
    setShowSettings(false)

    toast({
      title: "Settings updated",
      description: "Your image generation settings have been updated.",
    })
  }

  // Reset settings to defaults
  const handleResetSettings = () => {
    const defaultImageSettings = {
      aspectRatio: "1:1",
      guidance: 3,
      numInferenceSteps: 28,
      seed: null,
      numOutputs: 1,
      loraWeights: "",
    }

    setCustomSettings(defaultImageSettings)
    updateDefaultSettings(defaultImageSettings)

    toast({
      title: "Settings reset",
      description: "Image generation settings have been reset to defaults.",
    })
  }

  const handleCancelGeneration = async (imageId: string) => {
    const image = generatedImages.find((img) => img.id === imageId)
    if (!image || image.status !== "generating" || !image.predictionId) return

    try {
      // Cancel the prediction using the Replicate API
      await cancelPrediction(image.predictionId)

      // Update the image status
      updateImageStatus(imageId, "failed", "Generation canceled by user")

      toast({
        title: "Generation canceled",
        description: "The image generation has been canceled.",
      })
    } catch (error) {
      console.error("Error canceling generation:", error)
      toast({
        title: "Error",
        description: "Failed to cancel image generation.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Generation</CardTitle>
        <CardDescription>Generate images from your visual prompts using AI</CardDescription>
      </CardHeader>

      <CardContent>
        {!isReplicateConfigured && (
          <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">Replicate API Not Configured</h3>
              <p className="text-sm text-amber-700 mt-1">
                To generate images, you need to add your Replicate API token in the Models tab.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => (window.location.href = "#developer-tab-trigger")}
              >
                Go to Models Tab
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="prompt-selection">Prompt Selection</TabsTrigger>
            <TabsTrigger value="generated-images">
              Generated Images {generatedImages.length > 0 && `(${generatedImages.length})`}
            </TabsTrigger>
            <TabsTrigger value="bulk-generation">Bulk Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt-selection">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllPrompts}>
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearPromptSelection}
                    disabled={selectedPromptIds.length === 0}
                  >
                    Deselect All
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="h-4 w-4 mr-1" />
                    {showSettings ? "Hide Settings" : "Show Settings"}
                  </Button>

                  <Button
                    onClick={handleGenerateImages}
                    disabled={selectedPromptIds.length === 0 || isGenerating || !isReplicateConfigured}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate Images
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {showSettings && (
                <Card className="border-dashed">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Image Generation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                        <Select
                          value={customSettings.aspectRatio}
                          onValueChange={(value) => setCustomSettings({ ...customSettings, aspectRatio: value })}
                        >
                          <SelectTrigger id="aspect-ratio">
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                            <SelectItem value="3:2">3:2 (Standard Photo)</SelectItem>
                            <SelectItem value="2:3">2:3 (Portrait Photo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lora-weights">LoRA Weights (Optional)</Label>
                        <Input
                          id="lora-weights"
                          placeholder="e.g., fofr/flux-80s-cyberpunk"
                          value={customSettings.loraWeights}
                          onChange={(e) => setCustomSettings({ ...customSettings, loraWeights: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Add a style using LoRA weights from Replicate</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guidance">Guidance Scale: {customSettings.guidance}</Label>
                        <Slider
                          id="guidance"
                          min={0}
                          max={10}
                          step={0.1}
                          value={[customSettings.guidance]}
                          onValueChange={(value) => setCustomSettings({ ...customSettings, guidance: value[0] })}
                        />
                        <p className="text-xs text-muted-foreground">
                          How closely to follow the prompt (higher = more faithful)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="steps">Inference Steps: {customSettings.numInferenceSteps}</Label>
                        <Slider
                          id="steps"
                          min={1}
                          max={50}
                          step={1}
                          value={[customSettings.numInferenceSteps]}
                          onValueChange={(value) =>
                            setCustomSettings({ ...customSettings, numInferenceSteps: value[0] })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          More steps = higher quality but slower generation
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seed">Random Seed (Optional)</Label>
                        <Input
                          id="seed"
                          type="number"
                          placeholder="Leave empty for random"
                          value={customSettings.seed !== null ? customSettings.seed : ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number.parseInt(e.target.value)
                            setCustomSettings({ ...customSettings, seed: value })
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Set for reproducible results</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="num-outputs">Number of Outputs</Label>
                        <Select
                          value={customSettings.numOutputs.toString()}
                          onValueChange={(value) =>
                            setCustomSettings({ ...customSettings, numOutputs: Number.parseInt(value) })
                          }
                        >
                          <SelectTrigger id="num-outputs">
                            <SelectValue placeholder="Select number of outputs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 image</SelectItem>
                            <SelectItem value="2">2 images</SelectItem>
                            <SelectItem value="3">3 images</SelectItem>
                            <SelectItem value="4">4 images</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={handleResetSettings}>
                        Reset to Defaults
                      </Button>
                      <Button size="sm" onClick={handleUpdateSettings}>
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="border rounded-md">
                <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
                  <h3 className="font-medium">Available Prompts</h3>
                  <Badge variant="outline">
                    {selectedPromptIds.length} of {generatedPrompts.length} selected
                  </Badge>
                </div>

                {generatedPrompts.length > 0 ? (
                  <div className="divide-y">
                    {generatedPrompts.map((prompt) => {
                      const isSelected = selectedPromptIds.includes(prompt.id)
                      const shot = shotList.find((s) => s.id === prompt.shotId)
                      const shotInfo = shot ? `Scene ${shot.scene}, Shot ${shot.shot}` : "Unknown Shot"

                      return (
                        <div
                          key={prompt.id}
                          className={`p-4 flex items-start hover:bg-muted/10 ${isSelected ? "bg-muted/20" : ""}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePromptSelection(prompt.id)}
                            className="mt-1 mr-3"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <span className="font-medium">{shotInfo}</span>
                              <Badge variant="outline" className="ml-2">
                                {new Date(prompt.timestamp).toLocaleDateString()}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground line-clamp-2 mb-1 font-mono">
                              {prompt.concise}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={() => copyPromptToClipboard(prompt.id)}>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Prompt
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No prompts available. Generate prompts in the Prompts tab first.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generated-images">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Generated Images</h3>

                <Button onClick={() => setActiveTab("prompt-selection")} variant="outline">
                  Back to Prompt Selection
                </Button>
              </div>

              {generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedImages.map((image) => {
                    const prompt = getPromptForImage(image)

                    return (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="relative aspect-square bg-muted/30">
                          {image.status === "generating" ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              <span className="sr-only">Generating image...</span>
                            </div>
                          ) : image.status === "failed" ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                              <p className="text-sm text-center text-destructive">
                                {image.error || "Failed to generate image"}
                              </p>
                            </div>
                          ) : (
                            <img
                              src={image.imageUrl || generateMockImageUrl()}
                              alt={prompt?.concise || "Generated image"}
                              className="w-full h-full object-cover"
                            />
                          )}

                          <div className="absolute top-2 right-2 flex gap-1">
                            {image.status === "generating" && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                                onClick={() => handleCancelGeneration(image.id)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel generation</span>
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                              onClick={() => handleRemoveImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove image</span>
                            </Button>

                            {image.status === "completed" && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                                onClick={() => handleDownloadImage(image)}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download image</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground line-clamp-2 font-mono">
                            {prompt?.concise || "No prompt available"}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {image.settings.aspectRatio}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Steps: {image.settings.numInferenceSteps}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              CFG: {image.settings.guidance}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">No images generated yet. Select prompts and generate images.</p>
                  <Button onClick={() => setActiveTab("prompt-selection")} className="mt-4">
                    Select Prompts
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bulk-generation">
            <BulkImageGeneration />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
