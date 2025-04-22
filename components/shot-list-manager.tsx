"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { useLoadingStore } from "@/lib/stores/loading-store"
import type { Shot } from "@/lib/types"
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Edit,
  Filter,
  X,
  Download,
  Upload,
  Search,
  SortAsc,
  SortDesc,
  List,
  Grid,
} from "lucide-react"

// Add a new ShotCard component for grid view
const ShotCard = ({
  shot,
  isSelected,
  onSelect,
  onEdit,
}: {
  shot: Shot
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
}) => {
  return (
    <div className={`p-4 border rounded-md ${isSelected ? "bg-muted/20 border-primary" : "hover:bg-muted/10"}`}>
      <div className="flex items-start mb-2">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mt-1 mr-3" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <span className="font-medium">Shot {shot.shot}</span>
              <Badge variant="secondary" className="ml-2">
                {shot.shotSize}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{shot.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {shot.people && <span>People: {shot.people}</span>}
        {shot.location && <span>Location: {shot.location}</span>}
      </div>
    </div>
  )
}

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

  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: "scene",
    direction: "asc" as "asc" | "desc",
  })

  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    scene: true,
    shot: true,
    shotSize: true,
    description: true,
    people: true,
    location: true,
    directorsNotes: true,
  })

  // Filtered shot list
  const [filteredShots, setFilteredShots] = useState<Shot[]>([])

  // Apply filters and sorting to shot list
  useEffect(() => {
    let result = [...shotList]

    // Apply filters
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
          shot.location.toLowerCase().includes(searchLower) ||
          `scene ${shot.scene} shot ${shot.shot}`.toLowerCase().includes(searchLower),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue

      // Handle numeric sorting for scene and shot
      if (sortConfig.key === "scene") {
        aValue = Number.parseInt(a.scene) || 0
        bValue = Number.parseInt(b.scene) || 0
      } else if (sortConfig.key === "shot") {
        aValue = Number.parseFloat(a.shot.replace(/[^0-9.]/g, "")) || 0
        bValue = Number.parseFloat(b.shot.replace(/[^0-9.]/g, "")) || 0
      } else {
        // Handle string sorting for other fields
        aValue = a[sortConfig.key as keyof Shot] || ""
        bValue = b[sortConfig.key as keyof Shot] || ""
      }

      // Compare based on direction
      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredShots(result)
  }, [shotList, filters, sortConfig])

  // Group shots by scene
  const shotsByScene = useMemo(() => {
    return filteredShots.reduce(
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
  }, [filteredShots])

  // Sort scenes numerically
  const sortedScenes = useMemo(() => {
    return Object.keys(shotsByScene).sort((a, b) => {
      const numA = Number.parseInt(a.replace(/\D/g, ""))
      const numB = Number.parseInt(b.replace(/\D/g, ""))
      return numA - numB
    })
  }, [shotsByScene])

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

  // Select all shots
  const selectAllShots = () => {
    const newSelection = new Set<string>()
    filteredShots.forEach((shot) => {
      newSelection.add(shot.id)
    })
    setSelectedShots(newSelection)
  }

  // Deselect all shots
  const deselectAllShots = () => {
    setSelectedShots(new Set())
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

  // Expand all scenes
  const expandAllScenes = () => {
    const newExpanded = new Set<string>()
    sortedScenes.forEach((scene) => {
      newExpanded.add(scene)
    })
    setExpandedScenes(newExpanded)
  }

  // Collapse all scenes
  const collapseAllScenes = () => {
    setExpandedScenes(new Set())
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

  // Toggle sort direction or change sort key
  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      // Toggle direction if same key
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      })
    } else {
      // Set new key with default asc direction
      setSortConfig({
        key,
        direction: "asc",
      })
    }
  }

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns({
      ...visibleColumns,
      [column]: !visibleColumns[column as keyof typeof visibleColumns],
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

  // Export selected shots as CSV
  const exportShotsAsCSV = () => {
    if (selectedShots.size === 0) {
      toast({
        title: "No shots selected",
        description: "Please select at least one shot to export.",
        variant: "destructive",
      })
      return
    }

    const shotsToExport = shotList.filter((shot) => selectedShots.has(shot.id))

    // Define CSV headers
    const headers = [
      "Scene",
      "Shot",
      "Shot Size",
      "Description",
      "People",
      "Action",
      "Dialogue",
      "Location",
      "Director's Notes",
    ]

    // Create CSV content
    let csvContent = headers.join(",") + "\n"

    shotsToExport.forEach((shot) => {
      // Escape fields that might contain commas
      const escapeCsvField = (field: string) => {
        if (!field) return ""
        // If field contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }

      const row = [
        escapeCsvField(shot.scene),
        escapeCsvField(shot.shot),
        escapeCsvField(shot.shotSize),
        escapeCsvField(shot.description),
        escapeCsvField(shot.people),
        escapeCsvField(shot.action),
        escapeCsvField(shot.dialogue),
        escapeCsvField(shot.location),
        escapeCsvField(shot.directorsNotes || ""),
      ]

      csvContent += row.join(",") + "\n"
    })

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "shot-list-export.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Shots exported as CSV",
      description: `${shotsToExport.length} shot(s) have been exported to CSV.`,
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
            {/* Tabs for different views */}
            <Tabs defaultValue="view" className="mb-6">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="view">View & Filter</TabsTrigger>
                <TabsTrigger value="batch">Batch Operations</TabsTrigger>
                <TabsTrigger value="settings">Display Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="view">
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
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search-filter"
                          placeholder="Search all fields"
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Options */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Label className="flex items-center cursor-pointer">
                      <Checkbox
                        checked={groupByScene}
                        onCheckedChange={(checked) => setGroupByScene(checked as boolean)}
                        className="mr-2"
                      />
                      Group by Scene
                    </Label>

                    {groupByScene && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={expandAllScenes} className="h-8">
                          <ChevronDown className="h-3 w-3 mr-1" /> Expand All
                        </Button>
                        <Button variant="outline" size="sm" onClick={collapseAllScenes} className="h-8">
                          <ChevronRight className="h-3 w-3 mr-1" /> Collapse All
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>

                    <Select
                      value={`${sortConfig.key}-${sortConfig.direction}`}
                      onValueChange={(value) => {
                        const [key, direction] = value.split("-")
                        setSortConfig({
                          key,
                          direction: direction as "asc" | "desc",
                        })
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scene-asc">Scene (Ascending)</SelectItem>
                        <SelectItem value="scene-desc">Scene (Descending)</SelectItem>
                        <SelectItem value="shot-asc">Shot (Ascending)</SelectItem>
                        <SelectItem value="shot-desc">Shot (Descending)</SelectItem>
                        <SelectItem value="shotSize-asc">Shot Size (A-Z)</SelectItem>
                        <SelectItem value="shotSize-desc">Shot Size (Z-A)</SelectItem>
                        <SelectItem value="location-asc">Location (A-Z)</SelectItem>
                        <SelectItem value="location-desc">Location (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="batch">
                {/* Batch Operations */}
                <div className="mb-6 p-4 border rounded-md bg-muted/10">
                  <h3 className="text-sm font-medium mb-4">Batch Operations</h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={duplicateSelectedShots}
                      disabled={selectedShots.size === 0}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Selected ({selectedShots.size})
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportSelectedShots}
                      disabled={selectedShots.size === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as JSON ({selectedShots.size})
                    </Button>

                    <Button variant="outline" size="sm" onClick={exportShotsAsCSV} disabled={selectedShots.size === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as CSV ({selectedShots.size})
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={selectAllShots}>
                      Select All Shots
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={deselectAllShots}
                      disabled={selectedShots.size === 0}
                    >
                      Deselect All
                    </Button>

                    <div className="ml-auto">
                      <Badge variant="outline">
                        {selectedShots.size} of {filteredShots.length} shots selected
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                {/* Display Settings */}
                <div className="mb-6 p-4 border rounded-md bg-muted/10">
                  <h3 className="text-sm font-medium mb-4">Display Settings</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.scene}
                        onCheckedChange={() => toggleColumnVisibility("scene")}
                      />
                      <span>Scene</span>
                    </Label>

                    <Label className="flex items-center space-x-2">
                      <Checkbox checked={visibleColumns.shot} onCheckedChange={() => toggleColumnVisibility("shot")} />
                      <span>Shot</span>
                    </Label>

                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.shotSize}
                        onCheckedChange={() => toggleColumnVisibility("shotSize")}
                      />
                      <span>Shot Size</span>
                    </Label>

                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.description}
                        onCheckedChange={() => toggleColumnVisibility("description")}
                      />
                      <span>Description</span>
                    </Label>

                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.people}
                        onCheckedChange={() => toggleColumnVisibility("people")}
                      />
                      <span>People</span>
                    </Label>

                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.location}
                        onCheckedChange={() => toggleColumnVisibility("location")}
                      />
                      <span>Location</span>
                    </Label>

                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.directorsNotes}
                        onCheckedChange={() => toggleColumnVisibility("directorsNotes")}
                      />
                      <span>Director's Notes</span>
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Shot List */}
            <div className="border rounded-md overflow-hidden">
              {filteredShots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No shots match your filters.</p>
                </div>
              ) : viewMode === "grid" ? (
                // Grid view
                <div className="p-4">
                  {groupByScene ? (
                    // Grouped by scene in grid view
                    <div className="space-y-6">
                      {sortedScenes.map((scene) => (
                        <div key={scene} className="border rounded-md overflow-hidden">
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
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {shotsByScene[scene].map((shot) => (
                                <ShotCard
                                  key={shot.id}
                                  shot={shot}
                                  isSelected={selectedShots.has(shot.id)}
                                  onSelect={() => toggleShotSelection(shot.id)}
                                  onEdit={() => {
                                    // Edit functionality would go here
                                    toast({
                                      title: "Edit Shot",
                                      description: `Editing Scene ${shot.scene}, Shot ${shot.shot}`,
                                    })
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Flat grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredShots.map((shot) => (
                        <ShotCard
                          key={shot.id}
                          shot={shot}
                          isSelected={selectedShots.has(shot.id)}
                          onSelect={() => toggleShotSelection(shot.id)}
                          onEdit={() => {
                            // Edit functionality would go here
                            toast({
                              title: "Edit Shot",
                              description: `Editing Scene ${shot.scene}, Shot ${shot.shot}`,
                            })
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : groupByScene ? (
                // Grouped by scene in list view
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
                                  {visibleColumns.shotSize && (
                                    <Badge variant="secondary" className="ml-2">
                                      {shot.shotSize}
                                    </Badge>
                                  )}
                                </div>

                                {visibleColumns.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{shot.description}</p>
                                )}

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  {visibleColumns.people && shot.people && <span>People: {shot.people}</span>}
                                  {visibleColumns.location && shot.location && <span>Location: {shot.location}</span>}
                                  {visibleColumns.directorsNotes && shot.directorsNotes && (
                                    <span>Notes: {shot.directorsNotes}</span>
                                  )}
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
                  <div className="p-2 bg-muted/10 flex items-center text-sm font-medium border-b">
                    <div className="w-8 flex justify-center">
                      <Checkbox
                        checked={selectedShots.size === filteredShots.length && filteredShots.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllShots()
                          } else {
                            deselectAllShots()
                          }
                        }}
                      />
                    </div>

                    {visibleColumns.scene && (
                      <div className="w-20 px-2 cursor-pointer flex items-center" onClick={() => handleSort("scene")}>
                        Scene
                        {sortConfig.key === "scene" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </div>
                    )}

                    {visibleColumns.shot && (
                      <div className="w-20 px-2 cursor-pointer flex items-center" onClick={() => handleSort("shot")}>
                        Shot
                        {sortConfig.key === "shot" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </div>
                    )}

                    {visibleColumns.shotSize && (
                      <div
                        className="w-24 px-2 cursor-pointer flex items-center"
                        onClick={() => handleSort("shotSize")}
                      >
                        Size
                        {sortConfig.key === "shotSize" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </div>
                    )}

                    {visibleColumns.description && <div className="flex-1 px-2">Description</div>}

                    {visibleColumns.people && (
                      <div
                        className="w-32 px-2 hidden md:block cursor-pointer flex items-center"
                        onClick={() => handleSort("people")}
                      >
                        People
                        {sortConfig.key === "people" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </div>
                    )}

                    {visibleColumns.location && (
                      <div
                        className="w-32 px-2 hidden md:block cursor-pointer flex items-center"
                        onClick={() => handleSort("location")}
                      >
                        Location
                        {sortConfig.key === "location" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </div>
                    )}

                    <div className="w-10"></div>
                  </div>

                  {filteredShots.map((shot) => (
                    <div
                      key={shot.id}
                      className={`p-3 flex items-center hover:bg-muted/10 ${
                        selectedShots.has(shot.id) ? "bg-muted/20" : ""
                      }`}
                    >
                      <div className="w-8 flex justify-center">
                        <Checkbox
                          checked={selectedShots.has(shot.id)}
                          onCheckedChange={() => toggleShotSelection(shot.id)}
                        />
                      </div>

                      {visibleColumns.scene && <div className="w-20 px-2 truncate">{shot.scene}</div>}

                      {visibleColumns.shot && <div className="w-20 px-2 truncate">{shot.shot}</div>}

                      {visibleColumns.shotSize && (
                        <div className="w-24 px-2 truncate">
                          <Badge variant="secondary">{shot.shotSize}</Badge>
                        </div>
                      )}

                      {visibleColumns.description && <div className="flex-1 px-2 truncate">{shot.description}</div>}

                      {visibleColumns.people && <div className="w-32 px-2 truncate hidden md:block">{shot.people}</div>}

                      {visibleColumns.location && (
                        <div className="w-32 px-2 truncate hidden md:block">{shot.location}</div>
                      )}

                      <div className="w-10 flex justify-end">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
              <div>
                Showing {filteredShots.length} of {shotList.length} shots
                {selectedShots.size > 0 && ` (${selectedShots.size} selected)`}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Back to Top
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
