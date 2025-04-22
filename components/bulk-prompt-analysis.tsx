"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowRight, Check, Copy, Loader2, RefreshCw } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { generateAIResponse } from "@/lib/ai-service"
import { useLoadingStore } from "@/lib/stores/loading-store"

export default function BulkPromptAnalysis() {
  const { toast } = useToast()
  const { isLoading, setLoading, clearLoading } = useLoadingStore()
  const { shotList, script, generatedPrompts, addGeneratedPrompt } = useProjectStore()

  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([])
  const [analysisResults, setAnalysisResults] = useState<string>("")
  const [generatedAlternatives, setGeneratedAlternatives] = useState<
    Array<{
      id: string
      originalPromptId: string
      concise: string
      normal: string
      detailed: string
    }>
  >([])
  const [activeTab, setActiveTab] = useState<string>("select-prompts")
  const [customContext, setCustomContext] = useState<string>("")
  const [isGeneratingAlternatives, setIsGeneratingAlternatives] = useState(false)

  // Toggle prompt selection
  const togglePromptSelection = (promptId: string) => {
    if (selectedPromptIds.includes(promptId)) {
      setSelectedPromptIds(selectedPromptIds.filter((id) => id !== promptId))
    } else {
      setSelectedPromptIds([...selectedPromptIds, promptId])
    }
  }

  // Select all prompts
  const selectAllPrompts = () => {
    setSelectedPromptIds(generatedPrompts.map((p) => p.id))
  }

  // Clear prompt selection
  const clearPromptSelection = () => {
    setSelectedPromptIds([])
  }

  // Analyze selected prompts
  const analyzePrompts = async () => {
    if (selectedPromptIds.length === 0) {
      toast({
        title: "No prompts selected",
        description: "Please select at least one prompt to analyze.",
        variant: "destructive",
      })
      return
    }

    setLoading("analyzePrompts")

    try {
      // Get the selected prompts
      const selectedPrompts = generatedPrompts.filter((p) => selectedPromptIds.includes(p.id))

      // Create a context object with the script and selected prompts
      const context = {
        script: script,
        prompts: selectedPrompts.map((p) => ({
          id: p.id,
          shotId: p.shotId,
          concise: p.concise,
          normal: p.normal,
          detailed: p.detailed,
        })),
      }

      // Add custom context if provided
      if (customContext.trim()) {
        context.customContext = customContext.trim()
      }

      // Generate the analysis
      const analysisPrompt =
        "Analyze these visual prompts and provide insights on their strengths, weaknesses, and consistency."
      const analysis = await generateAIResponse(analysisPrompt, JSON.stringify(context))

      setAnalysisResults(analysis)
      setActiveTab("analysis-results")

      toast({
        title: "Analysis complete",
        description: `Analyzed ${selectedPrompts.length} prompts successfully.`,
      })
    } catch (error) {
      console.error("Error analyzing prompts:", error)
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      clearLoading("analyzePrompts")
    }
  }

  // Generate alternative prompts
  const generateAlternativePrompts = async () => {
    if (selectedPromptIds.length === 0) {
      toast({
        title: "No prompts selected",
        description: "Please select at least one prompt to generate alternatives for.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingAlternatives(true)

    try {
      // Get the selected prompts
      const selectedPrompts = generatedPrompts.filter((p) => selectedPromptIds.includes(p.id))
      const alternatives = []

      // Process each prompt
      for (const prompt of selectedPrompts) {
        // Get the corresponding shot
        const shot = shotList.find((s) => s.id === prompt.shotId)

        if (!shot) continue

        // Create a context object
        const context = {
          script: script,
          shot: shot,
          originalPrompt: {
            concise: prompt.concise,
            normal: prompt.normal,
            detailed: prompt.detailed,
          },
          customContext: customContext.trim(),
        }

        // Generate alternative prompts
        const alternativePrompt =
          "Generate alternative visual prompts for this shot that are different from the original but still capture the essence of the scene."
        const alternativeResponse = await generateAIResponse(alternativePrompt, JSON.stringify(context))

        try {
          // Try to parse the response as JSON
          const parsedResponse = JSON.parse(alternativeResponse)

          if (parsedResponse.concise && parsedResponse.normal && parsedResponse.detailed) {
            alternatives.push({
              id: uuidv4(),
              originalPromptId: prompt.id,
              concise: parsedResponse.concise,
              normal: parsedResponse.normal,
              detailed: parsedResponse.detailed,
            })
          }
        } catch (parseError) {
          // If parsing fails, try to extract the prompts from the text
          const conciseMatch = alternativeResponse.match(/Concise:?\s*(.*?)(?=Normal:|$)/is)
          const normalMatch = alternativeResponse.match(/Normal:?\s*(.*?)(?=Detailed:|$)/is)
          const detailedMatch = alternativeResponse.match(/Detailed:?\s*(.*?)(?=$)/is)

          if (conciseMatch && normalMatch && detailedMatch) {
            alternatives.push({
              id: uuidv4(),
              originalPromptId: prompt.id,
              concise: conciseMatch[1].trim(),
              normal: normalMatch[1].trim(),
              detailed: detailedMatch[1].trim(),
            })
          }
        }
      }

      setGeneratedAlternatives(alternatives)
      setActiveTab("alternative-prompts")

      toast({
        title: "Alternatives generated",
        description: `Generated alternatives for ${alternatives.length} prompts.`,
      })
    } catch (error) {
      console.error("Error generating alternative prompts:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAlternatives(false)
    }
  }

  // Save an alternative prompt
  const saveAlternativePrompt = (alternative: any) => {
    const originalPrompt = generatedPrompts.find((p) => p.id === alternative.originalPromptId)

    if (!originalPrompt) {
      toast({
        title: "Error",
        description: "Original prompt not found.",
        variant: "destructive",
      })
      return
    }

    // Create a new prompt based on the alternative
    const newPrompt = {
      id: uuidv4(),
      shotId: originalPrompt.shotId,
      concise: alternative.concise,
      normal: alternative.normal,
      detailed: alternative.detailed,
      timestamp: new Date().toISOString(),
    }

    // Add the new prompt
    addGeneratedPrompt(newPrompt)

    toast({
      title: "Alternative saved",
      description: "The alternative prompt has been saved.",
    })
  }

  // Copy prompt to clipboard
  const copyPromptToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${type} prompt copied to clipboard.`,
    })
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Bulk Prompt Analysis & Generation</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="select-prompts">Select Prompts</TabsTrigger>
            <TabsTrigger value="analysis-results">Analysis Results</TabsTrigger>
            <TabsTrigger value="alternative-prompts">Alternative Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="select-prompts">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPrompts}>
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
                  <Button
                    onClick={analyzePrompts}
                    disabled={selectedPromptIds.length === 0 || isLoading("analyzePrompts")}
                  >
                    {isLoading("analyzePrompts") ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Analyze Prompts
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={generateAlternativePrompts}
                    disabled={selectedPromptIds.length === 0 || isGeneratingAlternatives}
                  >
                    {isGeneratingAlternatives ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Generate Alternatives
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="custom-context">Additional Context (Optional)</Label>
                <Textarea
                  id="custom-context"
                  placeholder="Add any specific instructions or context for the analysis and alternative generation..."
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="border rounded-md">
                <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
                  <h3 className="font-medium">Available Prompts</h3>
                  <Badge variant="outline">
                    {selectedPromptIds.length} of {generatedPrompts.length} selected
                  </Badge>
                </div>

                {generatedPrompts.length > 0 ? (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
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

          <TabsContent value="analysis-results">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Analysis Results</h3>

                <Button variant="outline" size="sm" onClick={() => setActiveTab("select-prompts")}>
                  Back to Selection
                </Button>
              </div>

              {analysisResults ? (
                <div className="border rounded-md p-4 whitespace-pre-wrap">{analysisResults}</div>
              ) : (
                <div className="p-8 text-center border rounded-md bg-muted/10">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No analysis results yet. Select prompts and run analysis.</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  onClick={generateAlternativePrompts}
                  disabled={selectedPromptIds.length === 0 || isGeneratingAlternatives}
                >
                  {isGeneratingAlternatives ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Generate Alternatives
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alternative-prompts">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Alternative Prompts</h3>

                <Button variant="outline" size="sm" onClick={() => setActiveTab("select-prompts")}>
                  Back to Selection
                </Button>
              </div>

              {generatedAlternatives.length > 0 ? (
                <div className="space-y-6">
                  {generatedAlternatives.map((alternative) => {
                    const originalPrompt = generatedPrompts.find((p) => p.id === alternative.originalPromptId)
                    const shot = originalPrompt ? shotList.find((s) => s.id === originalPrompt.shotId) : null
                    const shotInfo = shot ? `Scene ${shot.scene}, Shot ${shot.shot}` : "Unknown Shot"

                    return (
                      <Card key={alternative.id} className="border-dashed">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{shotInfo}</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => saveAlternativePrompt(alternative)}>
                              <Check className="h-4 w-4 mr-2" />
                              Save Alternative
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Concise</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyPromptToClipboard(alternative.concise, "Concise")}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <div className="p-2 bg-muted rounded-md text-sm font-mono">{alternative.concise}</div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Normal</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyPromptToClipboard(alternative.normal, "Normal")}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <div className="p-2 bg-muted rounded-md text-sm font-mono">{alternative.normal}</div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Detailed</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyPromptToClipboard(alternative.detailed, "Detailed")}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <div className="p-2 bg-muted rounded-md text-sm font-mono">{alternative.detailed}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md bg-muted/10">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No alternative prompts generated yet.</p>
                  <Button
                    onClick={generateAlternativePrompts}
                    disabled={selectedPromptIds.length === 0 || isGeneratingAlternatives}
                    className="mt-4"
                  >
                    Generate Alternatives
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
