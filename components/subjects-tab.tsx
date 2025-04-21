"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { DataTable } from "@/components/ui/data-table"
import { SubjectsColumns } from "@/lib/columns/subjects-columns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, RefreshCw } from "lucide-react"
import { useLoadingStore } from "@/lib/stores/loading-store"
import type { Subject } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SubjectsTab() {
  const { toast } = useToast()
  const {
    script,
    subjects,
    proposedSubjects,
    extractSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    mergeProposedSubjects,
  } = useProjectStore()
  const { isLoading } = useLoadingStore()

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: "",
    category: "People",
    description: "",
    alias: "",
    loraTrigger: "",
    active: true,
  })
  const [showSuccess, setShowSuccess] = useState(false)

  // Show success message when subjects are extracted
  useEffect(() => {
    if (proposedSubjects.length > 0) {
      setShowSuccess(true)
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [proposedSubjects])

  const handleExtractSubjects = async () => {
    if (!script.trim()) {
      toast({
        title: "Script is Empty",
        description: "Please enter a script before extracting subjects.",
        variant: "destructive",
      })
      return
    }

    try {
      await extractSubjects()
      toast({
        title: "Subjects Extracted",
        description: "Subjects have been extracted from your script.",
      })
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract subjects.",
        variant: "destructive",
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

    addSubject(newSubject as Subject)
    setIsAddDialogOpen(false)
    setNewSubject({
      name: "",
      category: "People",
      description: "",
      alias: "",
      loraTrigger: "",
      active: true,
    })

    toast({
      title: "Subject Added",
      description: `${newSubject.name} has been added to your subjects.`,
    })
  }

  const handleUpdateSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsEditDialogOpen(true)
  }

  const handleSaveSubject = () => {
    if (selectedSubject) {
      updateSubject(selectedSubject)
      setIsEditDialogOpen(false)
      toast({
        title: "Subject Updated",
        description: `${selectedSubject.name} has been updated.`,
      })
    }
  }

  const handleDeleteSubject = (id: string) => {
    deleteSubject(id)
    toast({
      title: "Subject Deleted",
      description: "The subject has been deleted.",
    })
  }

  const handleMergeSubjects = () => {
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
      description: `${proposedSubjects.length} subjects have been merged into your subject list.`,
    })
  }

  return (
    <>
      <Tabs defaultValue="current">
        <TabsList className="mb-4">
          <TabsTrigger value="current">
            Current Subjects <Badge className="ml-2">{subjects.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="proposed">
            Proposed Subjects <Badge className="ml-2">{proposedSubjects.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>Manage characters, locations, and props in your script</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </CardHeader>
            <CardContent>
              {subjects.length > 0 ? (
                <DataTable columns={SubjectsColumns(handleUpdateSubject, handleDeleteSubject)} data={subjects} />
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Subjects Available</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {script
                      ? "You can extract subjects from your script or add them manually."
                      : "You need to enter a script first to extract subjects."}
                  </p>
                  {script ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline" onClick={handleExtractSubjects} disabled={isLoading("extractSubjects")}>
                        {isLoading("extractSubjects") ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Extract Subjects
                          </>
                        )}
                      </Button>
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Manually
                      </Button>
                    </div>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposed">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Proposed Subjects</CardTitle>
                <CardDescription>Review and merge AI-extracted subjects from your script</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExtractSubjects}
                  disabled={isLoading("extractSubjects") || !script}
                >
                  {isLoading("extractSubjects") ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Extract
                    </>
                  )}
                </Button>
                <Button onClick={handleMergeSubjects} disabled={proposedSubjects.length === 0}>
                  Merge All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSuccess && proposedSubjects.length > 0 && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Subjects Extracted Successfully</AlertTitle>
                  <AlertDescription>
                    {proposedSubjects.length} subjects have been extracted from your script. Review and merge them into
                    your subject list.
                  </AlertDescription>
                </Alert>
              )}

              {proposedSubjects.length > 0 ? (
                <DataTable
                  columns={SubjectsColumns(handleUpdateSubject, handleDeleteSubject, true)}
                  data={proposedSubjects}
                />
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Proposed Subjects</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {script
                      ? "Click the Extract button to analyze your script and extract subjects."
                      : "You need to enter a script first to extract subjects."}
                  </p>
                  {script ? (
                    <Button variant="outline" onClick={handleExtractSubjects} disabled={isLoading("extractSubjects")}>
                      {isLoading("extractSubjects") ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Extract Subjects
                        </>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Add a character, location, or prop to your script</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={newSubject.category}
                onValueChange={(value) =>
                  setNewSubject({ ...newSubject, category: value as "People" | "Places" | "Props" })
                }
              >
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="People">People (Characters)</SelectItem>
                  <SelectItem value="Places">Places (Locations)</SelectItem>
                  <SelectItem value="Props">Props (Objects)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alias" className="text-right">
                Alias
              </Label>
              <Input
                id="alias"
                value={newSubject.alias}
                onChange={(e) => setNewSubject({ ...newSubject, alias: e.target.value })}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loraTrigger" className="text-right">
                LORA Trigger
              </Label>
              <Input
                id="loraTrigger"
                value={newSubject.loraTrigger}
                onChange={(e) => setNewSubject({ ...newSubject, loraTrigger: e.target.value })}
                className="col-span-3"
                placeholder="e.g., <lora:character_name:1.0>"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={newSubject.description}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="active"
                  checked={newSubject.active}
                  onCheckedChange={(checked) => setNewSubject({ ...newSubject, active: checked })}
                />
                <Label htmlFor="active" className="ml-2">
                  {newSubject.active ? "Yes" : "No"}
                </Label>
              </div>
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

      {/* Edit Subject Dialog */}
      {selectedSubject && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>Edit details for subject "{selectedSubject.name}"</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={selectedSubject.name}
                  onChange={(e) => setSelectedSubject({ ...selectedSubject, name: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={selectedSubject.category}
                  onValueChange={(value) =>
                    setSelectedSubject({ ...selectedSubject, category: value as "People" | "Places" | "Props" })
                  }
                >
                  <SelectTrigger id="edit-category" className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="People">People (Characters)</SelectItem>
                    <SelectItem value="Places">Places (Locations)</SelectItem>
                    <SelectItem value="Props">Props (Objects)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-alias" className="text-right">
                  Alias
                </Label>
                <Input
                  id="edit-alias"
                  value={selectedSubject.alias}
                  onChange={(e) => setSelectedSubject({ ...selectedSubject, alias: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-loraTrigger" className="text-right">
                  LORA Trigger
                </Label>
                <Input
                  id="edit-loraTrigger"
                  value={selectedSubject.loraTrigger || ""}
                  onChange={(e) => setSelectedSubject({ ...selectedSubject, loraTrigger: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., <lora:character_name:1.0>"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={selectedSubject.description}
                  onChange={(e) => setSelectedSubject({ ...selectedSubject, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-active" className="text-right">
                  Active
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="edit-active"
                    checked={selectedSubject.active}
                    onCheckedChange={(checked) => setSelectedSubject({ ...selectedSubject, active: checked })}
                  />
                  <Label htmlFor="edit-active" className="ml-2">
                    {selectedSubject.active ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSubject}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
