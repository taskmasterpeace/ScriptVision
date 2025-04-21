"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useScriptCreationStore } from "@/lib/stores/script-creation-store"
import { useLoadingStore } from "@/lib/stores/loading-store"
import { ArrowLeft, ArrowRight, Plus, Trash, Edit, Sparkles, Loader2, Check, ChevronRight } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function OutlineTab() {
  const { toast } = useToast()
  const { isLoading } = useLoadingStore()
  const {
    storyTheme,
    storyTitle,
    storyGenre,
    chapters,
    chapterSuggestions,
    generateOutline,
    addChapter,
    updateChapter,
    deleteChapter,
    addBulletPoint,
    updateBulletPoint,
    deleteBulletPoint,
    toggleBulletPointSelection,
    analyzeAndSuggestChapters,
    toggleChapterSuggestionSelection,
    applySelectedChapterSuggestions,
  } = useScriptCreationStore()

  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [editingChapter, setEditingChapter] = useState<{ id: string; title: string } | null>(null)
  const [newBulletPoint, setNewBulletPoint] = useState<{ chapterId: string; text: string } | null>(null)
  const [editingBulletPoint, setEditingBulletPoint] = useState<{ chapterId: string; id: string; text: string } | null>(
    null,
  )
  const [isAddChapterDialogOpen, setIsAddChapterDialogOpen] = useState(false)
  const [isEditChapterDialogOpen, setIsEditChapterDialogOpen] = useState(false)
  const [isAddBulletDialogOpen, setIsAddBulletDialogOpen] = useState(false)
  const [isEditBulletDialogOpen, setIsEditBulletDialogOpen] = useState(false)
  const [isOutlineWizardOpen, setIsOutlineWizardOpen] = useState(false)

  // New state for the outline wizard
  const [outlineWizardStep, setOutlineWizardStep] = useState(1)
  const [outlineDirections, setOutlineDirections] = useState({
    storyStructure: "three-act", // three-act, hero-journey, five-act
    perspective: "third-person", // first-person, third-person, multiple-pov
    tone: "neutral", // light, dark, neutral
    additionalNotes: "",
    customPrompt: "", // Add this new field
  })

  const handleGenerateOutline = async () => {
    try {
      await generateOutline()
      toast({
        title: "Outline Generated",
        description: "Your story outline has been generated successfully.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate outline.",
        variant: "destructive",
      })
    }
  }

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "Chapter Title Required",
        description: "Please enter a title for the new chapter.",
        variant: "destructive",
      })
      return
    }

    addChapter(newChapterTitle)
    setNewChapterTitle("")
    setIsAddChapterDialogOpen(false)

    toast({
      title: "Chapter Added",
      description: `Chapter "${newChapterTitle}" has been added.`,
    })
  }

  const handleUpdateChapter = () => {
    if (!editingChapter) return

    if (!editingChapter.title.trim()) {
      toast({
        title: "Chapter Title Required",
        description: "Please enter a title for the chapter.",
        variant: "destructive",
      })
      return
    }

    updateChapter(editingChapter.id, editingChapter.title)
    setEditingChapter(null)
    setIsEditChapterDialogOpen(false)

    toast({
      title: "Chapter Updated",
      description: "Chapter title has been updated.",
    })
  }

  const handleDeleteChapter = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the chapter "${title}"?`)) {
      deleteChapter(id)

      toast({
        title: "Chapter Deleted",
        description: `Chapter "${title}" has been deleted.`,
      })
    }
  }

  const handleAddBulletPoint = () => {
    if (!newBulletPoint) return

    if (!newBulletPoint.text.trim()) {
      toast({
        title: "Bullet Point Text Required",
        description: "Please enter text for the bullet point.",
        variant: "destructive",
      })
      return
    }

    addBulletPoint(newBulletPoint.chapterId, newBulletPoint.text)
    setNewBulletPoint(null)
    setIsAddBulletDialogOpen(false)

    toast({
      title: "Bullet Point Added",
      description: "Bullet point has been added to the chapter.",
    })
  }

  const handleUpdateBulletPoint = () => {
    if (!editingBulletPoint) return

    if (!editingBulletPoint.text.trim()) {
      toast({
        title: "Bullet Point Text Required",
        description: "Please enter text for the bullet point.",
        variant: "destructive",
      })
      return
    }

    updateBulletPoint(editingBulletPoint.chapterId, editingBulletPoint.id, editingBulletPoint.text)
    setEditingBulletPoint(null)
    setIsEditBulletDialogOpen(false)

    toast({
      title: "Bullet Point Updated",
      description: "Bullet point has been updated.",
    })
  }

  const handleDeleteBulletPoint = (chapterId: string, id: string) => {
    deleteBulletPoint(chapterId, id)

    toast({
      title: "Bullet Point Deleted",
      description: "Bullet point has been deleted.",
    })
  }

  const handleAnalyzeAndSuggest = async () => {
    try {
      await analyzeAndSuggestChapters()
      toast({
        title: "Analysis Complete",
        description: "Chapter suggestions have been generated.",
      })
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze outline.",
        variant: "destructive",
      })
    }
  }

  const handleApplySuggestions = () => {
    applySelectedChapterSuggestions()

    toast({
      title: "Suggestions Applied",
      description: "Selected chapter suggestions have been applied to your outline.",
    })
  }

  // Update the handleOutlineWizardNext function to use the store's outlineDirections
  const handleOutlineWizardNext = () => {
    if (outlineWizardStep < 4) {
      setOutlineWizardStep(outlineWizardStep + 1)
    } else {
      // On the final step, update the store's outlineDirections and generate the outline
      useScriptCreationStore.getState().setOutlineDirections(outlineDirections)
      setIsOutlineWizardOpen(false)
      handleGenerateOutline()
    }
  }

  const handleOutlineWizardBack = () => {
    if (outlineWizardStep > 1) {
      setOutlineWizardStep(outlineWizardStep - 1)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Story Outline</CardTitle>
            <CardDescription>Create and organize your story structure</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isOutlineWizardOpen} onOpenChange={setIsOutlineWizardOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Outline Wizard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Story Outline Wizard</DialogTitle>
                  <DialogDescription>
                    Guide the AI in creating your story outline with specific directions
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${outlineWizardStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        1
                      </div>
                      <span className={outlineWizardStep >= 1 ? "font-medium" : "text-muted-foreground"}>
                        Structure
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${outlineWizardStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        2
                      </div>
                      <span className={outlineWizardStep >= 2 ? "font-medium" : "text-muted-foreground"}>
                        Perspective
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${outlineWizardStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        3
                      </div>
                      <span className={outlineWizardStep >= 3 ? "font-medium" : "text-muted-foreground"}>Tone</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${outlineWizardStep >= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        4
                      </div>
                      <span className={outlineWizardStep >= 4 ? "font-medium" : "text-muted-foreground"}>Prompt</span>
                    </div>
                  </div>

                  {outlineWizardStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Story Structure</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose the overall structure for your story outline.
                      </p>

                      <RadioGroup
                        value={outlineDirections.storyStructure}
                        onValueChange={(value) => setOutlineDirections({ ...outlineDirections, storyStructure: value })}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="three-act" id="three-act" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="three-act" className="font-medium">
                              Three-Act Structure
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Classic beginning, middle, and end structure with setup, confrontation, and resolution.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="hero-journey" id="hero-journey" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="hero-journey" className="font-medium">
                              Hero's Journey
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              The protagonist goes on an adventure, faces challenges, and returns transformed.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="five-act" id="five-act" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="five-act" className="font-medium">
                              Five-Act Structure
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Exposition, rising action, climax, falling action, and resolution.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {outlineWizardStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Narrative Perspective</h3>
                      <p className="text-sm text-muted-foreground mb-4">Choose the point of view for your story.</p>

                      <RadioGroup
                        value={outlineDirections.perspective}
                        onValueChange={(value) => setOutlineDirections({ ...outlineDirections, perspective: value })}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="first-person" id="first-person" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="first-person" className="font-medium">
                              First Person
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Told from the protagonist's perspective using "I" or "we".
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="third-person" id="third-person" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="third-person" className="font-medium">
                              Third Person
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Narrated from an outside perspective using "he," "she," or "they".
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="multiple-pov" id="multiple-pov" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="multiple-pov" className="font-medium">
                              Multiple Perspectives
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Story told from multiple characters' viewpoints.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {outlineWizardStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Story Tone</h3>
                      <p className="text-sm text-muted-foreground mb-4">Choose the overall tone for your story.</p>

                      <RadioGroup
                        value={outlineDirections.tone}
                        onValueChange={(value) => setOutlineDirections({ ...outlineDirections, tone: value })}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="light" id="light" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="light" className="font-medium">
                              Light/Uplifting
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Optimistic, hopeful, and positive emotional tone.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="neutral" id="neutral" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="neutral" className="font-medium">
                              Neutral/Balanced
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Balanced emotional tone with both light and serious moments.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="dark" id="dark" />
                          <div className="grid gap-1.5">
                            <Label htmlFor="dark" className="font-medium">
                              Dark/Serious
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              More serious, dramatic, or intense emotional tone.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {outlineWizardStep === 4 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Custom Story Prompt</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Define your story in your own words. You can specify exactly what kind of story you want to
                        create.
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="custom-prompt" className="text-sm font-medium">
                          Custom Prompt
                        </Label>
                        <Textarea
                          id="custom-prompt"
                          placeholder="Examples: 'Create a compelling news story about climate change activism', 'Craft an engaging narrative about a detective solving a mysterious case', 'Tell a heartwarming story about reconnecting with family'..."
                          className="min-h-[150px]"
                          value={outlineDirections.customPrompt}
                          onChange={(e) => setOutlineDirections({ ...outlineDirections, customPrompt: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          This prompt will guide the AI in creating your outline. Be as specific or open-ended as you
                          like.
                        </p>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Outline Summary</h4>
                        <div className="bg-muted/30 p-3 rounded-md text-sm">
                          <p>
                            <span className="font-medium">Theme:</span> {storyTheme || "Not specified"}
                          </p>
                          <p>
                            <span className="font-medium">Title:</span> {storyTitle || "Not specified"}
                          </p>
                          <p>
                            <span className="font-medium">Genre:</span> {storyGenre || "Not specified"}
                          </p>
                          <p>
                            <span className="font-medium">Structure:</span>{" "}
                            {outlineDirections.storyStructure === "three-act"
                              ? "Three-Act Structure"
                              : outlineDirections.storyStructure === "hero-journey"
                                ? "Hero's Journey"
                                : "Five-Act Structure"}
                          </p>
                          <p>
                            <span className="font-medium">Perspective:</span>{" "}
                            {outlineDirections.perspective === "first-person"
                              ? "First Person"
                              : outlineDirections.perspective === "third-person"
                                ? "Third Person"
                                : "Multiple Perspectives"}
                          </p>
                          <p>
                            <span className="font-medium">Tone:</span>{" "}
                            {outlineDirections.tone === "light"
                              ? "Light/Uplifting"
                              : outlineDirections.tone === "dark"
                                ? "Dark/Serious"
                                : "Neutral/Balanced"}
                          </p>
                          <p>
                            <span className="font-medium">Transcripts:</span>{" "}
                            {useScriptCreationStore.getState().selectedTranscripts.length} selected
                          </p>
                          {outlineDirections.customPrompt && (
                            <p>
                              <span className="font-medium">Custom Prompt:</span>{" "}
                              {outlineDirections.customPrompt.length > 100
                                ? `${outlineDirections.customPrompt.substring(0, 100)}...`
                                : outlineDirections.customPrompt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  {outlineWizardStep > 1 && (
                    <Button variant="outline" onClick={handleOutlineWizardBack}>
                      Back
                    </Button>
                  )}
                  <Button onClick={handleOutlineWizardNext}>
                    {outlineWizardStep < 4 ? "Next" : "Generate Outline"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleGenerateOutline}
              disabled={isLoading("generateOutline") || !storyTheme}
              variant="outline"
              className="gap-2"
            >
              {isLoading("generateOutline") ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Quick Generate
                </>
              )}
            </Button>
            <Dialog open={isAddChapterDialogOpen} onOpenChange={setIsAddChapterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Chapter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Chapter</DialogTitle>
                  <DialogDescription>Enter a title for your new chapter.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Chapter title"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddChapterDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddChapter}>Add Chapter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {chapters.length === 0 ? (
          <div className="text-center py-12 border rounded-md">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Outline Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Generate an outline based on your story theme and research, or add chapters manually.
            </p>
            <div className="flex gap-2 justify-center">
              <Dialog open={isOutlineWizardOpen} onOpenChange={setIsOutlineWizardOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Outline Wizard
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button
                onClick={handleGenerateOutline}
                disabled={isLoading("generateOutline") || !storyTheme}
                variant="outline"
                className="gap-2"
              >
                {isLoading("generateOutline") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Quick Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Accordion type="multiple" defaultValue={chapters.map((c) => c.id)} className="w-full">
              {chapters.map((chapter, index) => (
                <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-md mb-4 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Chapter {index + 1}
                      </span>
                      <AccordionTrigger className="hover:no-underline py-0 h-10">
                        <h3 className="font-medium text-left">{chapter.title}</h3>
                      </AccordionTrigger>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog
                        open={isEditChapterDialogOpen && editingChapter?.id === chapter.id}
                        onOpenChange={(open) => {
                          setIsEditChapterDialogOpen(open)
                          if (!open) setEditingChapter(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingChapter({ id: chapter.id, title: chapter.title })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Chapter</DialogTitle>
                            <DialogDescription>Update the title for this chapter.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Input
                              placeholder="Chapter title"
                              value={editingChapter?.title || ""}
                              onChange={(e) =>
                                setEditingChapter((prev) => (prev ? { ...prev, title: e.target.value } : null))
                              }
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditChapterDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateChapter}>Update Chapter</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteChapter(chapter.id, chapter.title)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="pt-2 pb-4 px-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {chapter.bulletPoints.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            No bullet points yet. Add some key points for this chapter.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {chapter.bulletPoints.map((point) => (
                              <div key={point.id} className="flex items-start gap-2 group">
                                <Checkbox
                                  id={point.id}
                                  checked={point.selected}
                                  onCheckedChange={() => toggleBulletPointSelection(chapter.id, point.id)}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={point.id}
                                    className={`text-sm ${!point.selected ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {point.text}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Dialog
                                    open={isEditBulletDialogOpen && editingBulletPoint?.id === point.id}
                                    onOpenChange={(open) => {
                                      setIsEditBulletDialogOpen(open)
                                      if (!open) setEditingBulletPoint(null)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          setEditingBulletPoint({
                                            chapterId: chapter.id,
                                            id: point.id,
                                            text: point.text,
                                          })
                                        }
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Bullet Point</DialogTitle>
                                        <DialogDescription>Update this bullet point.</DialogDescription>
                                      </DialogHeader>
                                      <div className="py-4">
                                        <Input
                                          placeholder="Bullet point text"
                                          value={editingBulletPoint?.text || ""}
                                          onChange={(e) =>
                                            setEditingBulletPoint((prev) =>
                                              prev ? { ...prev, text: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditBulletDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button onClick={handleUpdateBulletPoint}>Update</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleDeleteBulletPoint(chapter.id, point.id)}
                                  >
                                    <Trash className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Dialog
                        open={isAddBulletDialogOpen && newBulletPoint?.chapterId === chapter.id}
                        onOpenChange={(open) => {
                          setIsAddBulletDialogOpen(open)
                          if (!open) setNewBulletPoint(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setNewBulletPoint({ chapterId: chapter.id, text: "" })}
                          >
                            <Plus className="h-3 w-3" />
                            Add Bullet Point
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Bullet Point</DialogTitle>
                            <DialogDescription>Add a new bullet point to this chapter.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Input
                              placeholder="Bullet point text"
                              value={newBulletPoint?.text || ""}
                              onChange={(e) =>
                                setNewBulletPoint((prev) => (prev ? { ...prev, text: e.target.value } : null))
                              }
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddBulletDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddBulletPoint}>Add</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="flex justify-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleAnalyzeAndSuggest}
                disabled={isLoading("analyzeOutline") || chapters.length === 0}
              >
                {isLoading("analyzeOutline") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze & Suggest Improvements
                  </>
                )}
              </Button>
            </div>

            {chapterSuggestions.length > 0 && (
              <Card className="border-dashed border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Suggestions
                  </CardTitle>
                  <CardDescription>Review and apply these suggestions to improve your outline</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {chapterSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="border rounded-md p-3 bg-background">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={suggestion.id}
                              checked={suggestion.selected}
                              onCheckedChange={() => toggleChapterSuggestionSelection(suggestion.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Label htmlFor={suggestion.id} className="font-medium">
                                  {suggestion.chapterId ? "Enhance: " : "New Chapter: "}
                                  {suggestion.title}
                                </Label>
                                {suggestion.chapterId && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    Existing Chapter
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                              <div className="pl-4 border-l-2 border-primary/20 space-y-1">
                                {suggestion.bulletPoints.map((point, i) => (
                                  <p key={i} className="text-sm">
                                    • {point}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleApplySuggestions}
                    disabled={!chapterSuggestions.some((s) => s.selected)}
                    className="w-full gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Apply Selected Suggestions
                  </Button>
                </CardFooter>
              </Card>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => document.getElementById("research-tab-trigger")?.click()}
        >
          <ArrowLeft className="h-4 w-4" /> Back: Research
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (chapters.length === 0) {
              toast({
                title: "No Outline Created",
                description: "Please create an outline before proceeding.",
                variant: "destructive",
              })
              return
            }
            document.getElementById("write-tab-trigger")?.click()
          }}
        >
          Next: Write <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
