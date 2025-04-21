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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StylesColumns } from "@/lib/columns/styles-columns"
import { DirectorStylesColumns } from "@/lib/columns/director-styles-columns"
import type { Style, DirectorStyle } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StylesTab() {
  const { toast } = useToast()
  const { styles, directorStyles, addStyle, updateStyle, deleteStyle, setSelectedStyle, setSelectedDirectorStyle } =
    useProjectStore()
  const [selectedStyle, setLocalSelectedStyle] = useState<Style | null>(null)
  const [newStyle, setNewStyle] = useState<Partial<Style>>({
    name: "",
    prefix: "",
    suffix: "",
    genre: "",
    descriptors: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleStyleRowClick = (style: Style) => {
    setLocalSelectedStyle(style)
    setIsDialogOpen(true)
  }

  const handleDirectorStyleRowClick = (directorStyle: DirectorStyle) => {
    setSelectedDirectorStyle(directorStyle)
    toast({
      title: "Director Style Selected",
      description: `"${directorStyle.name}" style has been selected.`,
    })
  }

  const handleSaveStyle = () => {
    if (selectedStyle) {
      updateStyle(selectedStyle)
      setIsDialogOpen(false)
      toast({
        title: "Style Updated",
        description: `Style "${selectedStyle.name}" has been updated.`,
      })
    }
  }

  const handleDeleteStyle = () => {
    if (selectedStyle) {
      deleteStyle(selectedStyle.id)
      setIsDialogOpen(false)
      toast({
        title: "Style Deleted",
        description: `Style "${selectedStyle.name}" has been deleted.`,
      })
    }
  }

  const handleAddStyle = () => {
    if (!newStyle.name?.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the style.",
        variant: "destructive",
      })
      return
    }

    addStyle({
      ...newStyle,
      name: newStyle.name,
      prefix: newStyle.prefix || "",
      suffix: newStyle.suffix || "",
      genre: newStyle.genre || "",
      descriptors: newStyle.descriptors || "",
    } as Style)

    setNewStyle({
      name: "",
      prefix: "",
      suffix: "",
      genre: "",
      descriptors: "",
    })

    setIsAddDialogOpen(false)
    toast({
      title: "Style Added",
      description: `Style "${newStyle.name}" has been added.`,
    })
  }

  const handleSelectStyle = (style: Style) => {
    setSelectedStyle(style)
    toast({
      title: "Style Selected",
      description: `"${style.name}" style has been selected.`,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Visual Styles</CardTitle>
          <CardDescription>Manage visual styles and director styles for your project</CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
          Add Style
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visual">
          <TabsList className="mb-4">
            <TabsTrigger value="visual">Visual Styles</TabsTrigger>
            <TabsTrigger value="director">Director Styles</TabsTrigger>
          </TabsList>

          <TabsContent value="visual">
            {styles.length > 0 ? (
              <DataTable
                columns={StylesColumns}
                data={styles}
                onRowClick={handleStyleRowClick}
                onSelect={handleSelectStyle}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No visual styles available. Add a new style to get started.
              </div>
            )}
          </TabsContent>

          <TabsContent value="director">
            {directorStyles.length > 0 ? (
              <DataTable
                columns={DirectorStylesColumns}
                data={directorStyles}
                onRowClick={handleDirectorStyleRowClick}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">No director styles available.</div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Style Dialog */}
        {selectedStyle && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Style</DialogTitle>
                <DialogDescription>Edit details for style "{selectedStyle.name}"</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedStyle.name}
                    onChange={(e) => setLocalSelectedStyle({ ...selectedStyle, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix</Label>
                  <Textarea
                    id="prefix"
                    value={selectedStyle.prefix}
                    onChange={(e) => setLocalSelectedStyle({ ...selectedStyle, prefix: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Textarea
                    id="suffix"
                    value={selectedStyle.suffix}
                    onChange={(e) => setLocalSelectedStyle({ ...selectedStyle, suffix: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={selectedStyle.genre}
                    onChange={(e) => setLocalSelectedStyle({ ...selectedStyle, genre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptors">Descriptors</Label>
                  <Textarea
                    id="descriptors"
                    value={selectedStyle.descriptors}
                    onChange={(e) => setLocalSelectedStyle({ ...selectedStyle, descriptors: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="destructive" onClick={handleDeleteStyle}>
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveStyle}>Save Changes</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Style Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Style</DialogTitle>
              <DialogDescription>Add a new visual style to your project</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newStyle.name}
                  onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-prefix">Prefix</Label>
                <Textarea
                  id="new-prefix"
                  value={newStyle.prefix}
                  onChange={(e) => setNewStyle({ ...newStyle, prefix: e.target.value })}
                  placeholder="Style prefix to add before the prompt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-suffix">Suffix</Label>
                <Textarea
                  id="new-suffix"
                  value={newStyle.suffix}
                  onChange={(e) => setNewStyle({ ...newStyle, suffix: e.target.value })}
                  placeholder="Style suffix to add after the prompt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-genre">Genre</Label>
                <Input
                  id="new-genre"
                  value={newStyle.genre}
                  onChange={(e) => setNewStyle({ ...newStyle, genre: e.target.value })}
                  placeholder="Film genre (e.g., Noir, Sci-Fi)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-descriptors">Descriptors</Label>
                <Textarea
                  id="new-descriptors"
                  value={newStyle.descriptors}
                  onChange={(e) => setNewStyle({ ...newStyle, descriptors: e.target.value })}
                  placeholder="Key visual descriptors for this style"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStyle}>Add Style</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
