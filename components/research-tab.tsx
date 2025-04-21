"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useScriptCreationStore } from "@/lib/stores/script-creation-store"
import { useLoadingStore } from "@/lib/stores/loading-store"
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Youtube,
  Check,
  ExternalLink,
  Loader2,
  FileText,
  Plus,
  Edit,
  Trash,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export default function ResearchTab() {
  const { toast } = useToast()
  const { isLoading } = useLoadingStore()
  const {
    storyTheme,
    searchQuery,
    searchResults,
    selectedTranscripts,
    searchYouTube,
    toggleTranscriptSelection,
    addCustomTranscript,
    updateCustomTranscript,
    deleteTranscript,
  } = useScriptCreationStore()

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || storyTheme || "")
  const [isAddTranscriptOpen, setIsAddTranscriptOpen] = useState(false)
  const [isEditTranscriptOpen, setIsEditTranscriptOpen] = useState(false)
  const [newTranscript, setNewTranscript] = useState({ title: "", content: "" })
  const [editingTranscript, setEditingTranscript] = useState<{ id: string; title: string; content: string } | null>(
    null,
  )

  const handleSearch = async () => {
    if (!localSearchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term to find YouTube videos.",
        variant: "destructive",
      })
      return
    }

    try {
      await searchYouTube(localSearchQuery)
      toast({
        title: "Search Complete",
        description: "YouTube search results have been loaded.",
      })
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search YouTube videos.",
        variant: "destructive",
      })
    }
  }

  const handleAddTranscript = () => {
    if (!newTranscript.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your transcript.",
        variant: "destructive",
      })
      return
    }

    if (!newTranscript.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter the transcript content.",
        variant: "destructive",
      })
      return
    }

    addCustomTranscript(newTranscript.title, newTranscript.content)
    setNewTranscript({ title: "", content: "" })
    setIsAddTranscriptOpen(false)

    toast({
      title: "Transcript Added",
      description: "Your custom transcript has been added and selected.",
    })
  }

  const handleUpdateTranscript = () => {
    if (!editingTranscript) return

    if (!editingTranscript.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your transcript.",
        variant: "destructive",
      })
      return
    }

    if (!editingTranscript.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter the transcript content.",
        variant: "destructive",
      })
      return
    }

    updateCustomTranscript(editingTranscript.id, editingTranscript.title, editingTranscript.content)
    setEditingTranscript(null)
    setIsEditTranscriptOpen(false)

    toast({
      title: "Transcript Updated",
      description: "Your custom transcript has been updated.",
    })
  }

  const handleDeleteTranscript = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the transcript "${title}"?`)) {
      deleteTranscript(id)

      toast({
        title: "Transcript Deleted",
        description: `Transcript "${title}" has been deleted.`,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research</CardTitle>
        <CardDescription>Find inspiration from YouTube videos or add your own transcripts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="youtube" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4" />
              YouTube Search
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <FileText className="h-4 w-4" />
              Custom Transcripts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search YouTube for inspiration..."
                  className="pl-8"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading("youtubeSearch") || !localSearchQuery.trim()}
                className="gap-2"
              >
                {isLoading("youtubeSearch") ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4" />
                    Search YouTube
                  </>
                )}
              </Button>
            </div>

            {searchResults.filter((r) => r.source === "youtube").length === 0 ? (
              <div className="text-center py-12 border rounded-md">
                <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Search Results</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Search for YouTube videos related to your story theme to find inspiration.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {searchResults
                  .filter((r) => r.source === "youtube")
                  .map((result) => (
                    <Card key={result.id} className={`overflow-hidden ${result.selected ? "border-primary" : ""}`}>
                      <div className="relative">
                        <img
                          src={result.thumbnailUrl || "/placeholder.svg"}
                          alt={result.title}
                          className="w-full h-32 object-cover"
                        />
                        {result.selected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-2 mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{result.channelTitle}</p>
                        <div className="flex justify-between items-center">
                          <Button
                            variant={result.selected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTranscriptSelection(result.id)}
                          >
                            {result.selected ? "Selected" : "Select"}
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            <span className="text-xs">View on YouTube</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Your Custom Transcripts</h3>
              <Dialog open={isAddTranscriptOpen} onOpenChange={setIsAddTranscriptOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Transcript
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Custom Transcript</DialogTitle>
                    <DialogDescription>
                      Add your own transcript for inspiration. This could be a story, article, or any text that might
                      inspire your script.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="transcript-title" className="text-sm font-medium">
                        Transcript Title
                      </label>
                      <Input
                        id="transcript-title"
                        placeholder="Enter a descriptive title..."
                        value={newTranscript.title}
                        onChange={(e) => setNewTranscript({ ...newTranscript, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="transcript-content" className="text-sm font-medium">
                        Transcript Content
                      </label>
                      <Textarea
                        id="transcript-content"
                        placeholder="Paste or type your transcript here..."
                        className="min-h-[200px]"
                        value={newTranscript.content}
                        onChange={(e) => setNewTranscript({ ...newTranscript, content: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTranscriptOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTranscript}>Add Transcript</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {searchResults.filter((r) => r.source === "custom").length === 0 ? (
              <div className="text-center py-12 border rounded-md">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Custom Transcripts</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Add your own transcripts to use as inspiration for your story.
                </p>
                <Dialog open={isAddTranscriptOpen} onOpenChange={setIsAddTranscriptOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Transcript
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults
                  .filter((r) => r.source === "custom")
                  .map((result) => (
                    <Card key={result.id} className={result.selected ? "border-primary" : ""}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{result.title}</h3>
                            {result.selected && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog
                              open={isEditTranscriptOpen && editingTranscript?.id === result.id}
                              onOpenChange={(open) => {
                                setIsEditTranscriptOpen(open)
                                if (!open) setEditingTranscript(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingTranscript({
                                      id: result.id,
                                      title: result.title,
                                      content: result.transcript,
                                    })
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Custom Transcript</DialogTitle>
                                  <DialogDescription>Update your custom transcript.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <label htmlFor="edit-transcript-title" className="text-sm font-medium">
                                      Transcript Title
                                    </label>
                                    <Input
                                      id="edit-transcript-title"
                                      placeholder="Enter a descriptive title..."
                                      value={editingTranscript?.title || ""}
                                      onChange={(e) =>
                                        setEditingTranscript((prev) =>
                                          prev ? { ...prev, title: e.target.value } : null,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor="edit-transcript-content" className="text-sm font-medium">
                                      Transcript Content
                                    </label>
                                    <Textarea
                                      id="edit-transcript-content"
                                      placeholder="Paste or type your transcript here..."
                                      className="min-h-[200px]"
                                      value={editingTranscript?.content || ""}
                                      onChange={(e) =>
                                        setEditingTranscript((prev) =>
                                          prev ? { ...prev, content: e.target.value } : null,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsEditTranscriptOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateTranscript}>Update Transcript</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTranscript(result.id, result.title)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md p-3 bg-muted/30 mt-2">
                          <ScrollArea className="h-24">
                            <p className="text-sm whitespace-pre-line">{result.transcript}</p>
                          </ScrollArea>
                        </div>
                        <div className="mt-3">
                          <Button
                            variant={result.selected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTranscriptSelection(result.id)}
                          >
                            {result.selected ? "Deselect" : "Select for Inspiration"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-2">Selected Transcripts for Inspiration</h3>
          {selectedTranscripts.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Check className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No transcripts selected. Select YouTube videos or add custom transcripts.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTranscripts.map((transcript) => (
                <div key={transcript.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  {transcript.source === "youtube" ? (
                    <Youtube className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium flex-1">{transcript.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => toggleTranscriptSelection(transcript.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => document.getElementById("story-theme-tab-trigger")?.click()}
        >
          <ArrowLeft className="h-4 w-4" /> Back: Story Theme
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (selectedTranscripts.length === 0) {
              toast({
                title: "No Transcripts Selected",
                description: "Please select at least one transcript before proceeding.",
                variant: "destructive",
              })
              return
            }
            document.getElementById("outline-tab-trigger")?.click()
          }}
        >
          Next: Outline <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
