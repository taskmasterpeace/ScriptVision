"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { ShotListColumns } from "@/lib/columns/shot-list-columns"
import type { Shot } from "@/lib/types"
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react"

// Import the loading store at the top of the file
import { useLoadingStore } from "@/lib/stores/loading-store"
import ShotSuggestions from "@/components/shot-suggestions"
import ShotListManager from "@/components/shot-list-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Replace the existing component with this updated version
export default function ShotListTab() {
  const { toast } = useToast()
  const { shotList, updateShot, generateBulkDirectorsNotes, script } = useProjectStore()
  const { isLoading } = useLoadingStore()
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [localShotList, setLocalShotList] = useState<Shot[]>([])

  // Update local shot list when the store changes
  useEffect(() => {
    setLocalShotList(shotList)
    console.log("Shot list updated:", shotList)
  }, [shotList])

  const handleRowClick = (shot: Shot) => {
    setSelectedShot(shot)
    setIsDialogOpen(true)
  }

  const handleSaveShot = () => {
    if (selectedShot) {
      updateShot(selectedShot)
      setIsDialogOpen(false)
      toast({
        title: "Shot Updated",
        description: `Shot ${selectedShot.shot} has been updated.`,
      })
    }
  }

  const handleGenerateBulkNotes = async () => {
    if (localShotList.length === 0) {
      toast({
        title: "No Shots Available",
        description: "Please generate a shot list first.",
        variant: "destructive",
      })
      return
    }

    try {
      await generateBulkDirectorsNotes()
      toast({
        title: "Director's Notes Generated",
        description: "Director's notes have been generated for all shots.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate director's notes.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {shotList.length > 0 ? (
        <Tabs defaultValue="manager" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="manager">Shot Manager</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="manager">
            <ShotListManager />

            {/* Director's Notes Generator */}
            <Card>
              <CardHeader>
                <CardTitle>Director's Notes</CardTitle>
                <CardDescription>Generate detailed director's notes for all shots</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Generate detailed director's notes for all shots in your shot list to guide the visual style and mood.
                </p>
                <Button
                  onClick={handleGenerateBulkNotes}
                  disabled={isLoading("generateDirectorsNotes") || localShotList.length === 0}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {isLoading("generateDirectorsNotes") ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Director's Notes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Shot List</CardTitle>
                  <CardDescription>View and edit your shot list in table format</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {localShotList.length > 0 ? (
                  <>
                    <div className="mb-4 p-2 bg-muted/20 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Showing {localShotList.length} shots. Click on any row to edit details.
                      </p>
                    </div>
                    <DataTable columns={ShotListColumns} data={localShotList} onRowClick={handleRowClick} />
                  </>
                ) : (
                  <div className="text-center py-12 border rounded-md bg-muted/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Shot List Available</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {script
                        ? "You need to generate a shot list from your script first."
                        : "You need to enter a script and generate a shot list first."}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.document.getElementById("script-tab-trigger")?.click()}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go to Script Tab
                    </Button>
                  </div>
                )}

                {selectedShot && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Shot</DialogTitle>
                        <DialogDescription>
                          Edit details for Scene {selectedShot.scene}, Shot {selectedShot.shot}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="scene">Scene</Label>
                          <Input
                            id="scene"
                            value={selectedShot.scene}
                            onChange={(e) => setSelectedShot({ ...selectedShot, scene: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shot">Shot</Label>
                          <Input
                            id="shot"
                            value={selectedShot.shot}
                            onChange={(e) => setSelectedShot({ ...selectedShot, shot: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shotSize">Shot Size</Label>
                          <Select
                            value={selectedShot.shotSize}
                            onValueChange={(value) => setSelectedShot({ ...selectedShot, shotSize: value })}
                          >
                            <SelectTrigger id="shotSize">
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
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={selectedShot.location}
                            onChange={(e) => setSelectedShot({ ...selectedShot, location: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Shot Description</Label>
                          <Textarea
                            id="description"
                            value={selectedShot.description}
                            onChange={(e) => setSelectedShot({ ...selectedShot, description: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="people">People</Label>
                          <Input
                            id="people"
                            value={selectedShot.people}
                            onChange={(e) => setSelectedShot({ ...selectedShot, people: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="action">Action</Label>
                          <Textarea
                            id="action"
                            value={selectedShot.action}
                            onChange={(e) => setSelectedShot({ ...selectedShot, action: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="dialogue">Dialogue</Label>
                          <Textarea
                            id="dialogue"
                            value={selectedShot.dialogue}
                            onChange={(e) => setSelectedShot({ ...selectedShot, dialogue: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="directorsNotes">Director's Notes</Label>
                          <Textarea
                            id="directorsNotes"
                            value={selectedShot.directorsNotes || ""}
                            onChange={(e) => setSelectedShot({ ...selectedShot, directorsNotes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveShot}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>

              {localShotList.length > 0 && (
                <CardFooter className="flex flex-col space-y-4">
                  <div className="w-full p-4 border rounded-md bg-muted/30">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-5 w-5" /> Generate Director's Notes
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Generate detailed director's notes for all shots in your shot list to guide the visual style and
                      mood.
                    </p>

                    <Button
                      onClick={handleGenerateBulkNotes}
                      disabled={isLoading("generateDirectorsNotes") || localShotList.length === 0}
                      className="w-full md:w-auto"
                      size="lg"
                    >
                      {isLoading("generateDirectorsNotes") ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Director's Notes"
                      )}
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shot List</CardTitle>
              <CardDescription>View and edit your shot list, or generate director's notes</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 border rounded-md bg-muted/10">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Shot List Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {script
                  ? "You need to generate a shot list from your script first."
                  : "You need to enter a script and generate a shot list first."}
              </p>
              <Button variant="outline" onClick={() => window.document.getElementById("script-tab-trigger")?.click()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Script Tab
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add the Shot Suggestions component if we have a shot list */}
      {shotList.length > 0 && <ShotSuggestions />}
    </>
  )
}
