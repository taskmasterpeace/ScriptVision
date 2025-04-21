"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { useLoadingStore } from "@/lib/stores/loading-store"
import type { Shot } from "@/lib/types"
import { ChevronDown, ChevronRight, Copy, Edit, Filter, X, Download, Upload } from "lucide-react"

export default function ShotListManager() {
  const { toast } = useToast()
  const { shotList, updateShot, addShots } = useProjectStore()
  const { isLoading } = useLoadingStore()

  // State for selected shots (for batch operations)
  const [selectedShots, setSelectedShots] = useState<Set<string>>(new Set())

  // State for filtering
  const [filters, setFilters] = useState({
    scene: "",
    shotSize: "",
    people: "",
    location: "",
    search: "",
  })

  // State for grouping
  const [groupByScene, setGroupByScene] = useState(true)

  // State for expanded scenes (when grouped)
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set())

  // Filtered shot list
  const [filteredShots, setFilteredShots] = useState<Shot[]>([])

  // Group shots by scene
  const shotsByScene = filteredShots.reduce(
    (acc, shot) => {
      const scene = shot.scene
      if (!acc[scene]) {
        acc[scene] = []
      }
      acc[scene].push(shot)
      return acc
    },
    {} as Record<string, Shot[]>,
  )

  // Sort scenes numerically
  const sortedScenes = Object.keys(shotsByScene).sort((a, b) => {
    const numA = Number.parseInt(a.replace(/\D/g, ""))
    const numB = Number.parseInt(b.replace(/\D/g, ""))
    return numA - numB
  })

  // Apply filters to shot list
  useEffect(() => {
    let result = [...shotList]

    if (filters.scene) {
      result = result.filter((shot) => shot.scene === filters.scene)
    }

    if (filters.shotSize) {
      result = result.filter((shot) => shot.shotSize === filters.shotSize)
    }

    if (filters.people) {
      result = result.filter((shot) => shot.people.toLowerCase().includes(filters.people.toLowerCase()))
    }

    if (filters.location) {
      result = result.filter((shot) => shot.location.toLowerCase().includes(filters.location.toLowerCase()))
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (shot) =>
          shot.description.toLowerCase().includes(searchLower) ||
          shot.action.toLowerCase().includes(searchLower) ||
          shot.dialogue.toLowerCase().includes(searchLower) ||
          shot.people.toLowerCase().includes(searchLower) ||
          shot.location.toLowerCase().includes(searchLower),
      )
    }

    setFilteredShots(result)
  }, [shotList, filters])

  // Toggle shot selection
  const toggleShotSelection = (shotId: string) => {
    const newSelection = new Set(selectedShots)
    if (newSelection.has(shotId)) {
      newSelection.delete(shotId)
    } else {
      newSelection.add(shotId)
    }
    setSelectedShots(newSelection)
  }

  // Select all shots in a scene
  const selectAllInScene = (scene: string) => {
    const newSelection = new Set(selectedShots)
    shotsByScene[scene].forEach((shot) => {
      newSelection.add(shot.id)
    })
    setSelectedShots(newSelection)
  }

  // Deselect all shots in a scene
  const deselectAllInScene = (scene: string) => {
    const newSelection = new Set(selectedShots)
    shotsByScene[scene].forEach((shot) => {
      newSelection.delete(shot.id)
    })
    setSelectedShots(newSelection)
  }

  // Toggle scene expansion
  const toggleSceneExpansion = (scene: string) => {
    const newExpanded = new Set(expandedScenes)
    if (newExpanded.has(scene)) {
      newExpanded.delete(scene)
    } else {
      newExpanded.add(scene)
    }
    setExpandedScenes(newExpanded)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      scene: "",
      shotSize: "",
      people: "",
      location: "",
      search: "",
    })
  }

  // Duplicate selected shots
  const duplicateSelectedShots = () => {
    if (selectedShots.size === 0) {
      toast({
        title: "No shots selected",
        description: "Please select at least one shot to duplicate.",
        variant: "destructive",
      })
      return
    }

    const shotsToDuplicate = shotList.filter((shot) => selectedShots.has(shot.id))
    const duplicatedShots = shotsToDuplicate.map((shot) => ({
      ...shot,
      id: crypto.randomUUID(),
      shot: `${shot.shot}.1`, // Append .1 to indicate it's a duplicate
    }))

    addShots(duplicatedShots)

    toast({
      title: "Shots duplicated",
      description: `${duplicatedShots.length} shot(s) have been duplicated.`,
    })
  }

  // Export selected shots as JSON
  const exportSelectedShots = () => {
    if (selectedShots.size === 0) {
      toast({
        title: "No shots selected",
        description: "Please select at least one shot to export.",
        variant: "destructive",
      })
      return
    }

    const shotsToExport = shotList.filter((shot) => selectedShots.has(shot.id))
    const jsonString = JSON.stringify(shotsToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "shot-list-export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Shots exported",
      description: `${shotsToExport.length} shot(s) have been exported to JSON.`,
    })
  }

  // Import shots from JSON
  const importShots = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedShots = JSON.parse(content) as Shot[]

        // Validate imported shots
        if (!Array.isArray(importedShots)) {
          throw new Error("Invalid format: Expected an array of shots")
        }

        // Generate new IDs for imported shots to avoid conflicts
        const shotsWithNewIds = importedShots.map((shot) => ({
          ...shot,
          id: crypto.randomUUID(),
        }))

        addShots(shotsWithNewIds)

        toast({
          title: "Shots imported",
          description: `${shotsWithNewIds.length} shot(s) have been imported.`,
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The selected file contains invalid data.",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
  }

  // Get unique values for filter dropdowns
  const uniqueScenes = [...new Set(shotList.map((shot) => shot.scene))].sort((a, b) => {
    const numA = Number.parseInt(a.replace(/\D/g, ""))
    const numB = Number.parseInt(b.replace(/\D/g, ""))
    return numA - numB
  })

  const uniqueShotSizes = [...new Set(shotList.map((shot) => shot.shotSize))].filter(Boolean).sort()

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Shot List Manager</CardTitle>
        <CardDescription>Organize, filter, and perform batch operations on your shots</CardDescription>
      </CardHeader>

      <CardContent>
        {shotList.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">No shots available. Generate a shot list first.</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 p-4 border rounded-md bg-muted/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Shots
                </h3>
                {Object.values(filters).some(Boolean) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                    <X className="h-4 w-4 mr-1" /> Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="scene-filter" className="text-xs">
                    Scene
                  </Label>
                  <Select value={filters.scene} onValueChange={(value) => setFilters({ ...filters, scene: value })}>
                    <SelectTrigger id="scene-filter">
                      <SelectValue placeholder="All scenes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All scenes</SelectItem>
                      {uniqueScenes.map((scene) => (
                        <SelectItem key={scene} value={scene}>
                          Scene {scene}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shot-size-filter" className="text-xs">
                    Shot Size
                  </Label>
                  <Select
                    value={filters.shotSize}
                    onValueChange={(value) => setFilters({ ...filters, shotSize: value })}
                  >
                    <SelectTrigger id="shot-size-filter">
                      <SelectValue placeholder="All sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sizes</SelectItem>
                      {uniqueShotSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="people-filter" className="text-xs">
                    People
                  </Label>
                  <Input
                    id="people-filter"
                    placeholder="Filter by people"
                    value={filters.people}
                    onChange={(e) => setFilters({ ...filters, people: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location-filter" className="text-xs">
                    Location
                  </Label>
                  <Input
                    id="location-filter"
                    placeholder="Filter by location"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="search-filter" className="text-xs">
                    Search
                  </Label>
                  <Input
                    id="search-filter"
                    placeholder="Search all fields"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Batch Operations */}
            <div className="mb-6 p-4 border rounded-md bg-muted/10">
              <h3 className="text-sm font-medium mb-4">Batch Operations</h3>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={duplicateSelectedShots}
                  disabled={selectedShots.size === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Selected ({selectedShots.size})
                </Button>

                <Button variant="outline" size="sm" onClick={exportSelectedShots} disabled={selectedShots.size === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected ({selectedShots.size})
                </Button>

                <div className="relative">
                  <Button variant="outline" size="sm" asChild>
                    <label>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Shots
                      <input type="file" accept=".json" className="sr-only" onChange={importShots} />
                    </label>
                  </Button>
                </div>

                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedShots(new Set())}
                    disabled={selectedShots.size === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="mb-6 flex items-center">
              <Label className="flex items-center cursor-pointer">
                <Checkbox
                  checked={groupByScene}
                  onCheckedChange={(checked) => setGroupByScene(checked as boolean)}
                  className="mr-2"
                />
                Group by Scene
              </Label>
            </div>

            {/* Shot List */}
            <div className="border rounded-md overflow-hidden">
              {filteredShots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No shots match your filters.</p>
                </div>
              ) : groupByScene ? (
                // Grouped by scene
                <div>
                  {sortedScenes.map((scene) => (
                    <div key={scene} className="border-b last:border-b-0">
                      <div
                        className="flex items-center p-3 bg-muted/20 cursor-pointer"
                        onClick={() => toggleSceneExpansion(scene)}
                      >
                        {expandedScenes.has(scene) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}

                        <h3 className="font-medium">Scene {scene}</h3>
                        <Badge variant="outline" className="ml-2">
                          {shotsByScene[scene].length} shot{shotsByScene[scene].length !== 1 ? "s" : ""}
                        </Badge>

                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              selectAllInScene(scene)
                            }}
                            className="h-7 text-xs"
                          >
                            Select All
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deselectAllInScene(scene)
                            }}
                            className="h-7 text-xs"
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>

                      {expandedScenes.has(scene) && (
                        <div className="divide-y">
                          {shotsByScene[scene].map((shot) => (
                            <div
                              key={shot.id}
                              className={`p-3 flex items-start hover:bg-muted/10 ${
                                selectedShots.has(shot.id) ? "bg-muted/20" : ""
                              }`}
                            >
                              <Checkbox
                                checked={selectedShots.has(shot.id)}
                                onCheckedChange={() => toggleShotSelection(shot.id)}
                                className="mt-1 mr-3"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center mb-1">
                                  <span className="font-medium">Shot {shot.shot}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {shot.shotSize}
                                  </Badge>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{shot.description}</p>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {shot.people && <span>People: {shot.people}</span>}

                                  {shot.location && <span>Location: {shot.location}</span>}
                                </div>
                              </div>

                              <Button variant="ghost" size="icon" className="ml-2">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Flat list
                <div className="divide-y">
                  {filteredShots.map((shot) => (
                    <div
                      key={shot.id}
                      className={`p-3 flex items-start hover:bg-muted/10 ${
                        selectedShots.has(shot.id) ? "bg-muted/20" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedShots.has(shot.id)}
                        onCheckedChange={() => toggleShotSelection(shot.id)}
                        className="mt-1 mr-3"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <span className="font-medium">
                            Scene {shot.scene}, Shot {shot.shot}
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {shot.shotSize}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{shot.description}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {shot.people && <span>People: {shot.people}</span>}

                          {shot.location && <span>Location: {shot.location}</span>}
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="ml-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredShots.length} of {shotList.length} shots
              {selectedShots.size > 0 && ` (${selectedShots.size} selected)`}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
