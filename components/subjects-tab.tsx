"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { SubjectsColumns } from "@/lib/columns/subjects-columns"
import type { Subject } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
// Import the loading store at the top of the file
import { useLoadingStore } from "@/lib/stores/loading-store"

export default function SubjectsTab() {
  const { toast } = useToast()
  const {
    subjects,
    proposedSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    mergeProposedSubjects,
    extractSubjects,
    script,
  } = useProjectStore()
  const { isLoading } = useLoadingStore()
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: "",
    category: "People",
    description: "",
    alias: "",
    loraTrigger: "",
    active: true,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  const handleRowClick = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDialogOpen(true)
  }

  const handleSaveSubject = () => {
    if (selectedSubject) {
      updateSubject(selectedSubject)
      setIsDialogOpen(false)
      toast({
        title: "Subject Updated",
        description: `Subject "${selectedSubject.name}" has been updated.`,
      })
    }
  }

  const handleDeleteSubject = () => {
    if (selectedSubject) {
      deleteSubject(selectedSubject.id)
      setIsDialogOpen(false)
      toast({
        title: "Subject Deleted",
        description: `Subject "${selectedSubject.name}" has been deleted.`,
      })
    }
  }

  const handleAddSubject = () => {
    if (!newSubject.name?.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the subject.",
        variant: "destructive",
      })
      return
    }

    addSubject({
      ...newSubject,
      name: newSubject.name,
      category: newSubject.category || "People",
      description: newSubject.description || "",
      alias: newSubject.alias || "",
      loraTrigger: newSubject.loraTrigger || "",
      active: newSubject.active !== undefined ? newSubject.active : true,
    } as Subject)

    setNewSubject({
      name: "",
      category: "People",
      description: "",
      alias: "",
      loraTrigger: "",
      active: true,
    })

    setIsAddDialogOpen(false)
    toast({
      title: "Subject Added",
      description: `Subject "${newSubject.name}" has been added.`,
    })
  }

  const handleExtractSubjects = async () => {
    if (!script.trim()) {
      toast({
        title: "Script Required",
        description: "Please enter a script before extracting subjects.",
        variant: "destructive",
      })
      return
    }

    try {
      await extractSubjects()

      // Switch to the proposed tab after extraction
      setActiveTab("proposed")

      toast({
        title: "Subjects Extracted",
        description: `${proposedSubjects.length} subjects have been extracted from your script.`,
      })
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract subjects.",
        variant: "destructive",
      })
    }
  }

  const handleMergeProposedSubjects = () => {
    if (proposedSubjects.length === 0) {
      toast({
        title: "No Proposed Subjects",
        description: "There are no proposed subjects to merge.",
        variant: "destructive",
      })
      return
    }

    mergeProposedSubjects()
    toast({
      title: "Subjects Merged",
      description: `${proposedSubjects.length} proposed subjects have been merged.`,
    })

    // Switch to active tab after merging
    setActiveTab("active")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subjects Management</CardTitle>
          <CardDescription>Manage characters, locations, and props for your project</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
            Add Subject
          </Button>
          {proposedSubjects.length > 0 && (
            <Button onClick={handleMergeProposedSubjects}>Merge Proposed ({proposedSubjects.length})</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Subjects</TabsTrigger>
            <TabsTrigger value="proposed">
              Proposed Subjects {proposedSubjects.length > 0 && `(${proposedSubjects.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {subjects.length > 0 ? (
              <DataTable columns={SubjectsColumns} data={subjects} onRowClick={handleRowClick} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Subjects Available</h3>
                <p className="mb-6">Add subjects manually or extract them from your script.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                    Add Subject Manually
                  </Button>
                  {script ? (
                    <Button variant="outline" onClick={handleExtractSubjects} disabled={isLoading("extractSubjects")}>
                      {isLoading("extractSubjects") ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        "Extract from Script"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => window.document.getElementById("script-tab-trigger")?.click()}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go to Script Tab
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="proposed">
            {isLoading("extractSubjects") ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Extracting Subjects</h3>
                <p className="text-muted-foreground">
                  Analyzing your script to identify characters, locations, and props...
                </p>
              </div>
            ) : proposedSubjects.length > 0 ? (
              <DataTable columns={SubjectsColumns} data={proposedSubjects} onRowClick={handleRowClick} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Proposed Subjects</h3>
                <p className="mb-6">Extract subjects from your script to see them here.</p>
                {script ? (
                  <Button variant="outline" onClick={handleExtractSubjects} disabled={isLoading("extractSubjects")}>
                    {isLoading("extractSubjects") ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      "Extract from Script"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => window.document.getElementById("script-tab-trigger")?.click()}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to Script Tab
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Subject Dialog */}
        {selectedSubject && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subject</DialogTitle>
                <DialogDescription>Edit details for subject "{selectedSubject.name}"</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedSubject.name}
                    onChange={(e) => setSelectedSubject({ ...selectedSubject, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={selectedSubject.category}
                    onValueChange={(value) =>
                      setSelectedSubject({ ...selectedSubject, category: value as "People" | "Places" | "Props" })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="People">People</SelectItem>
                      <SelectItem value="Places">Places</SelectItem>
                      <SelectItem value="Props">Props</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedSubject.description}
                    onChange={(e) => setSelectedSubject({ ...selectedSubject, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">Alias</Label>
                  <Input
                    id="alias"
                    value={selectedSubject.alias}
                    onChange={(e) => setSelectedSubject({ ...selectedSubject, alias: e.target.value })}
                  />
                </div>

                {/* Add LORA Trigger field */}
                <div className="space-y-2">
                  <Label htmlFor="loraTrigger">LORA Trigger Word</Label>
                  <Input
                    id="loraTrigger"
                    value={selectedSubject.loraTrigger || ""}
                    onChange={(e) => setSelectedSubject({ ...selectedSubject, loraTrigger: e.target.value })}
                    placeholder="e.g., <lora:character_name:1.0>"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If provided, this trigger word will be inserted at the beginning of prompts and replace the
                    subject's name.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={selectedSubject.active}
                    onCheckedChange={(checked) => setSelectedSubject({ ...selectedSubject, active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="destructive" onClick={handleDeleteSubject}>
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSubject}>Save Changes</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Subject Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>Add a new character, location, or prop to your project</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-category">Category</Label>
                <Select
                  value={newSubject.category}
                  onValueChange={(value) =>
                    setNewSubject({ ...newSubject, category: value as "People" | "Places" | "Props" })
                  }
                >
                  <SelectTrigger id="new-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="People">People</SelectItem>
                    <SelectItem value="Places">Places</SelectItem>
                    <SelectItem value="Props">Props</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-alias">Alias</Label>
                <Input
                  id="new-alias"
                  value={newSubject.alias}
                  onChange={(e) => setNewSubject({ ...newSubject, alias: e.target.value })}
                />
              </div>

              {/* Add LORA Trigger field */}
              <div className="space-y-2">
                <Label htmlFor="new-loraTrigger">LORA Trigger Word</Label>
                <Input
                  id="new-loraTrigger"
                  value={newSubject.loraTrigger}
                  onChange={(e) => setNewSubject({ ...newSubject, loraTrigger: e.target.value })}
                  placeholder="e.g., <lora:character_name:1.0>"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If provided, this trigger word will be inserted at the beginning of prompts and replace the subject's
                  name.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="new-active"
                  checked={newSubject.active}
                  onCheckedChange={(checked) => setNewSubject({ ...newSubject, active: checked })}
                />
                <Label htmlFor="new-active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubject}>Add Subject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
