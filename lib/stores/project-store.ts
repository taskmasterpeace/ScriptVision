"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import type {
  Shot,
  Subject,
  Style,
  DirectorStyle,
  GeneratedPrompt,
  Project,
  CameraSettings,
  MusicLabFormData,
} from "@/lib/types"
import { generateAIResponse } from "@/lib/ai-service"
import { createClient } from "@supabase/supabase-js"

// First, import the loading store at the top of the file
import { useLoadingStore } from "@/lib/stores/loading-store"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a singleton for the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

const getSupabase = () => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

interface ProjectState {
  projectName: string
  script: string
  shotList: Shot[]
  subjects: Subject[]
  proposedSubjects: Subject[]
  styles: Style[]
  directorStyles: DirectorStyle[]
  selectedStyle: Style | null
  selectedDirectorStyle: DirectorStyle | null
  generatedPrompts: GeneratedPrompt[]
  workflowProgress: {
    scriptCompleted: boolean
    shotListCompleted: boolean
    subjectsCompleted: boolean
    promptsCompleted: boolean
  }

  // Project actions
  setProjectName: (name: string) => void
  setScript: (script: string) => void
  saveProject: () => Promise<void>
  loadProject: (name: string) => Promise<void>
  deleteProject: (name: string) => Promise<void>
  listProjects: () => Promise<any[]>

  // Shot list actions
  generateShotList: () => Promise<void>
  updateShot: (shot: Shot) => void
  generateBulkDirectorsNotes: () => Promise<void>
  // Add the addShots method to the ProjectState interface
  addShots: (shots: Shot[]) => void

  // Subject actions
  extractSubjects: () => Promise<void>
  addSubject: (subject: Subject) => void
  updateSubject: (subject: Subject) => void
  deleteSubject: (id: string) => void
  mergeProposedSubjects: () => void

  // Style actions
  addStyle: (style: Style) => void
  updateStyle: (style: Style) => void
  deleteStyle: (id: string) => void
  setSelectedStyle: (style: Style) => void
  setSelectedDirectorStyle: (style: DirectorStyle) => void

  // Prompt actions
  generatePrompt: (shot: Shot, activeSubjects: Subject[], cameraSettings: CameraSettings) => Promise<void>

  // Music Lab actions
  generateVideoTreatment: (formData: MusicLabFormData) => Promise<string>
}

// Mock data for initial state
const mockDirectorStyles: DirectorStyle[] = [
  {
    id: uuidv4(),
    name: "Christopher Nolan",
    visualStyle: "High contrast, IMAX-scale visuals, practical effects",
    narrativeApproach: "Non-linear storytelling, complex narratives",
    camerawork: "IMAX cameras, steady movements, wide angles",
    lighting: "Natural lighting with high contrast",
    editing: "Cross-cutting between timelines",
    color: "Desaturated color palette",
    sound: "Immersive sound design with Hans Zimmer scores",
    performance: "Restrained, intellectual performances",
  },
  {
    id: uuidv4(),
    name: "Wes Anderson",
    visualStyle: "Symmetrical compositions, vibrant color palettes",
    narrativeApproach: "Quirky, deadpan humor with emotional depth",
    camerawork: "Centered framing, snap zooms, overhead shots",
    lighting: "Bright, even lighting",
    editing: "Precise cuts, chapter titles",
    color: "Pastel colors, yellow tints",
    sound: "Curated vintage music",
    performance: "Deadpan delivery, ensemble casts",
  },
  {
    id: uuidv4(),
    name: "Quentin Tarantino",
    visualStyle: "70s exploitation aesthetic, extreme close-ups",
    narrativeApproach: "Non-linear, chapter-based storytelling",
    camerawork: "Trunk shots, foot fetish shots, long takes",
    lighting: "Dramatic, stylized lighting",
    editing: "Jump cuts, split screens",
    color: "Saturated colors, blood reds",
    sound: "Eclectic soundtrack, punchy sound effects",
    performance: "Verbose dialogue, larger-than-life characters",
  },
]

// Helper function to parse the AI-generated shot list into structured data
function parseAIShotList(shotListText: string): Shot[] {
  const shots: Shot[] = []
  console.log("Raw shot list text:", shotListText)

  // First, try to identify scene blocks
  const sceneRegex = /#{1,3}\s*Scene\s+(\d+)[^#]*?(?=#{1,3}\s*Scene|$)/gi
  let sceneMatch
  const sceneMatches = []

  while ((sceneMatch = sceneRegex.exec(shotListText)) !== null) {
    sceneMatches.push({
      sceneNumber: sceneMatch[1],
      content: sceneMatch[0],
      index: sceneMatch.index,
    })
  }

  // If we couldn't find scene blocks with the regex, try an alternative approach
  if (sceneMatches.length === 0) {
    // Split by double newlines and look for "Scene" headers
    const blocks = shotListText.split(/\n\s*\n/).filter((block) => block.trim())

    for (const block of blocks) {
      const sceneHeaderMatch = block.match(/^(?:Scene|SCENE)\s+(\d+)/i)

      if (sceneHeaderMatch) {
        sceneMatches.push({
          sceneNumber: sceneHeaderMatch[1],
          content: block,
          index: shotListText.indexOf(block),
        })
      }
    }
  }

  console.log(`Found ${sceneMatches.length} scene blocks`)

  // Process each scene block
  for (const scene of sceneMatches) {
    // Look for shot blocks within the scene
    const shotBlockRegex =
      /(?:Shot|#{1,4})\s+(\d+)[^\n]*\n(?:-\s*\*\*Scene[^]*?(?=(?:Shot|#{1,4})|$)|[^]*?(?=(?:Shot|#{1,4})|$))/gi
    let shotMatch
    let shotContent = scene.content

    // If we can't find shots with the regex, try to split by bullet points or numbered items
    if (!shotContent.match(shotBlockRegex)) {
      // Try to find shots by looking for "Shot" or "Shot Number" patterns
      const alternativeShotRegex =
        /[-*•]?\s*(?:\*\*)?(?:Shot(?:\s+Number)?:?\s*|Shot\s+Size:?\s*|Description:?\s*)[^]*/gi
      shotContent = shotContent.replace(alternativeShotRegex, (match) => `\n\nShot ${match}`)
    }

    while ((shotMatch = shotBlockRegex.exec(shotContent)) !== null) {
      const shotNumber = shotMatch[1]
      const shotBlock = shotMatch[0]

      // Extract shot details using various patterns to handle different formats
      const shotSizeMatch =
        shotBlock.match(/Shot\s+Size:?\s*([^\n]+)/i) ||
        shotBlock.match(/\*\*Shot\s+Size:?\*\*\s*([^\n]+)/i) ||
        shotBlock.match(/Size:?\s*([^\n]+)/i)

      const descriptionMatch =
        shotBlock.match(/Description:?\s*([^\n]+)/i) || shotBlock.match(/\*\*Description:?\*\*\s*([^\n]+)/i)

      const peopleMatch =
        shotBlock.match(/People(?:\s+in\s+the\s+Shot)?:?\s*([^\n]+)/i) ||
        shotBlock.match(/\*\*People(?:\s+in\s+the\s+Shot)?:?\*\*\s*([^\n]+)/i)

      const actionMatch = shotBlock.match(/Action:?\s*([^\n]+)/i) || shotBlock.match(/\*\*Action:?\*\*\s*([^\n]+)/i)

      const dialogueMatch =
        shotBlock.match(/Dialogue:?\s*([^\n]+)/i) || shotBlock.match(/\*\*Dialogue:?\*\*\s*([^\n]+)/i)

      const locationMatch =
        shotBlock.match(/Location:?\s*([^\n]+)/i) || shotBlock.match(/\*\*Location:?\*\*\s*([^\n]+)/i)

      // Create the shot object with extracted information
      const shot: Shot = {
        id: uuidv4(),
        scene: scene.sceneNumber,
        shot: shotNumber,
        shotSize: shotSizeMatch ? shotSizeMatch[1].trim() : "",
        description: descriptionMatch ? descriptionMatch[1].trim() : "",
        people: peopleMatch ? peopleMatch[1].trim() : "",
        action: actionMatch ? actionMatch[1].trim() : "",
        dialogue: dialogueMatch ? dialogueMatch[1].trim() : "",
        location: locationMatch ? locationMatch[1].trim() : "",
      }

      // If we couldn't extract a description but have other content, use that
      if (!shot.description) {
        // Try to extract a description from the content
        const lines = shotBlock
          .split("\n")
          .filter(
            (line) =>
              !line.match(/Shot\s+\d+/i) &&
              !line.match(/Scene\s+\d+/i) &&
              !line.match(/Shot\s+Size/i) &&
              !line.match(/People/i) &&
              !line.match(/Action/i) &&
              !line.match(/Dialogue/i) &&
              !line.match(/Location/i) &&
              line.trim(),
          )

        if (lines.length > 0) {
          shot.description = lines[0].replace(/^[-*•\s]+/, "").trim()
        }
      }

      console.log("Created shot:", shot)
      shots.push(shot)
    }

    // If we couldn't find any shots with the regex, try a more direct approach
    if (shots.length === 0 || !shots.some((s) => s.scene === scene.sceneNumber)) {
      // Look for patterns like "Shot 1" or "#### Shot 1" or bullet points
      const lines = scene.content.split("\n")
      let currentShot: Partial<Shot> | null = null

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Check if this is a new shot
        const shotHeaderMatch = trimmedLine.match(/(?:#{1,4}\s*)?(?:Shot|SHOT)\s+(\d+)/i)

        if (shotHeaderMatch) {
          // Save previous shot if exists
          if (currentShot?.scene && currentShot?.shot) {
            shots.push({
              id: uuidv4(),
              scene: currentShot.scene,
              shot: currentShot.shot,
              shotSize: currentShot.shotSize || "",
              description: currentShot.description || "",
              people: currentShot.people || "",
              action: currentShot.action || "",
              dialogue: currentShot.dialogue || "",
              location: currentShot.location || "",
            })
          }

          // Start new shot
          currentShot = {
            scene: scene.sceneNumber,
            shot: shotHeaderMatch[1],
          }
        }
        // Check for shot properties
        else if (currentShot) {
          if (trimmedLine.match(/Shot\s+Size:?\s*/i)) {
            currentShot.shotSize = trimmedLine.replace(/Shot\s+Size:?\s*/i, "").trim()
          } else if (trimmedLine.match(/Description:?\s*/i)) {
            currentShot.description = trimmedLine.replace(/Description:?\s*/i, "").trim()
          } else if (trimmedLine.match(/People(?:\s+in\s+the\s+Shot)?:?\s*/i)) {
            currentShot.people = trimmedLine.replace(/People(?:\s+in\s+the\s+Shot)?:?\s*/i, "").trim()
          } else if (trimmedLine.match(/Action:?\s*/i)) {
            currentShot.action = trimmedLine.replace(/Action:?\s*/i, "").trim()
          } else if (trimmedLine.match(/Dialogue:?\s*/i)) {
            currentShot.dialogue = trimmedLine.replace(/Dialogue:?\s*/i, "").trim()
          } else if (trimmedLine.match(/Location:?\s*/i)) {
            currentShot.location = trimmedLine.replace(/Location:?\s*/i, "").trim()
          }
          // If line doesn't match any property but starts with a bullet or dash, it might be a description
          else if (trimmedLine.match(/^[-*•]/) && !currentShot.description) {
            currentShot.description = trimmedLine.replace(/^[-*•\s]+/, "").trim()
          }
        }
      }

      // Save the last shot if exists
      if (currentShot?.scene && currentShot?.shot) {
        shots.push({
          id: uuidv4(),
          scene: currentShot.scene,
          shot: currentShot.shot,
          shotSize: currentShot.shotSize || "",
          description: currentShot.description || "",
          people: currentShot.people || "",
          action: currentShot.action || "",
          dialogue: currentShot.dialogue || "",
          location: currentShot.location || "",
        })
      }
    }
  }

  // If we still couldn't extract any shots, try a last-resort approach
  if (shots.length === 0) {
    console.log("Using last-resort shot extraction approach")

    // Look for any patterns that might indicate a shot
    const shotPatterns = [
      // Pattern: "Scene X, Shot Y: Description"
      /Scene\s+(\d+),\s+Shot\s+(\d+)(?::\s*|\s+)([^\n]+)/gi,
      // Pattern: "Shot Y (Scene X): Description"
      /Shot\s+(\d+)\s+$$Scene\s+(\d+)$$(?::\s*|\s+)([^\n]+)/gi,
      // Pattern: "Shot Y: Description" (assume Scene 1 if not specified)
      /Shot\s+(\d+)(?::\s*|\s+)([^\n]+)/gi,
    ]

    for (const pattern of shotPatterns) {
      let match
      while ((match = pattern.exec(shotListText)) !== null) {
        // Extract scene and shot numbers based on the pattern
        let sceneNumber, shotNumber, description

        if (pattern.source.includes("\\(Scene")) {
          // Pattern: "Shot Y (Scene X): Description"
          shotNumber = match[1]
          sceneNumber = match[2]
          description = match[3]
        } else if (pattern.source.includes("Scene\\s+$$\\d+$$")) {
          // Pattern: "Scene X, Shot Y: Description"
          sceneNumber = match[1]
          shotNumber = match[2]
          description = match[3]
        } else {
          // Pattern: "Shot Y: Description" (assume Scene 1)
          shotNumber = match[1]
          sceneNumber = "1"
          description = match[2]
        }

        // Create a basic shot object
        const shot: Shot = {
          id: uuidv4(),
          scene: sceneNumber,
          shot: shotNumber,
          description: description.trim(),
          shotSize: "",
          people: "",
          action: "",
          dialogue: "",
          location: "",
        }

        // Try to extract additional details from surrounding text
        const shotIndex = match.index
        const nextShotIndex = shotListText.indexOf("Shot", shotIndex + 5)
        const contextText =
          nextShotIndex > shotIndex
            ? shotListText.substring(shotIndex, nextShotIndex)
            : shotListText.substring(shotIndex, shotIndex + 500)

        // Extract shot size
        const sizeMatch = contextText.match(/(?:Shot\s+Size|Size):\s*([^\n]+)/i)
        if (sizeMatch) shot.shotSize = sizeMatch[1].trim()

        // Extract people
        const peopleMatch = contextText.match(/People(?:\s+in\s+the\s+Shot)?:\s*([^\n]+)/i)
        if (peopleMatch) shot.people = peopleMatch[1].trim()

        // Extract action
        const actionMatch = contextText.match(/Action:\s*([^\n]+)/i)
        if (actionMatch) shot.action = actionMatch[1].trim()

        // Extract dialogue
        const dialogueMatch = contextText.match(/Dialogue:\s*([^\n]+)/i)
        if (dialogueMatch) shot.dialogue = dialogueMatch[1].trim()

        // Extract location
        const locationMatch = contextText.match(/Location:\s*([^\n]+)/i)
        if (locationMatch) shot.location = locationMatch[1].trim()

        console.log("Created shot (last resort):", shot)
        shots.push(shot)
      }

      // If we found shots with this pattern, stop trying others
      if (shots.length > 0) break
    }
  }

  console.log(`Total shots parsed: ${shots.length}`)
  return shots
}

// Add this at the end of the file, after the parseAIShotList function:

// Expose the parseAIShotList function to the window object for debugging
if (typeof window !== "undefined") {
  ;(window as any).parseAIShotList = parseAIShotList
}

// Helper function to extract shot details from a text block
function extractShotDetails(text: string, sceneNumber: string, shotNumber: string): Shot | null {
  // Extract shot properties
  const shotSizeMatch =
    text.match(/(?:Shot size|Shot Size):\s*([^\n]+)/i) ||
    text.match(/\*\*Shot size:\*\*\s*([^\n]+)/i) ||
    text.match(/- \*\*Shot size:\*\*\s*([^\n]+)/i)

  const descriptionMatch =
    text.match(/(?:Description):\s*([^\n]+)/i) ||
    text.match(/\*\*Description:\*\*\s*([^\n]+)/i) ||
    text.match(/- \*\*Description:\*\*\s*([^\n]+)/i)

  const peopleMatch =
    text.match(/(?:People|People in the shot):\s*([^\n]+)/i) ||
    text.match(/\*\*People( in the shot)?:\*\*\s*([^\n]+)/i) ||
    text.match(/- \*\*People( in the shot)?:\*\*\s*([^\n]+)/i)

  const actionMatch =
    text.match(/(?:Action):\s*([^\n]+)/i) ||
    text.match(/\*\*Action:\*\*\s*([^\n]+)/i) ||
    text.match(/- \*\*Action:\*\*\s*([^\n]+)/i)

  const dialogueMatch =
    text.match(/(?:Dialogue):\s*([^\n]+)/i) ||
    text.match(/\*\*Dialogue:\*\*\s*([^\n]+)/i) ||
    text.match(/- \*\*Dialogue:\*\*\s*([^\n]+)/i)

  const locationMatch =
    text.match(/(?:Location):\s*([^\n]+)/i) ||
    text.match(/\*\*Location:\*\*\s*([^\n]+)/i) ||
    text.match(/- \*\*Location:\*\*\s*([^\n]+)/i)

  // If we couldn't extract the basic information, return null
  if (!shotSizeMatch && !descriptionMatch) return null

  return {
    id: uuidv4(),
    scene: sceneNumber,
    shot: shotNumber,
    shotSize: shotSizeMatch ? (shotSizeMatch[1] || "").trim() : "",
    description: descriptionMatch ? (descriptionMatch[1] || "").trim() : "",
    people: peopleMatch ? (peopleMatch[1] || peopleMatch[2] || "").trim() : "",
    action: actionMatch ? (actionMatch[1] || "").trim() : "",
    dialogue: dialogueMatch ? (dialogueMatch[1] || "").trim() : "",
    location: locationMatch ? (locationMatch[1] || "").trim() : "",
  }
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projectName: "",
      script: "",
      shotList: [],
      subjects: [],
      proposedSubjects: [],
      styles: [
        {
          id: uuidv4(),
          name: "Cinematic",
          prefix: "cinematic still, movie scene,",
          suffix: "film grain, dramatic lighting, 35mm film",
          genre: "Drama",
          descriptors: "cinematic, dramatic, film-like",
        },
        {
          id: uuidv4(),
          name: "Noir",
          prefix: "film noir style,",
          suffix: "high contrast, shadows, moody, black and white",
          genre: "Crime",
          descriptors: "moody, shadowy, high-contrast",
        },
      ],
      directorStyles: mockDirectorStyles,
      selectedStyle: null,
      selectedDirectorStyle: null,
      generatedPrompts: [],
      workflowProgress: {
        scriptCompleted: false,
        shotListCompleted: false,
        subjectsCompleted: false,
        stylesCompleted: false,
        promptsCompleted: false,
      },

      // Project actions
      setProjectName: (name) => set({ projectName: name }),

      setScript: (script) => {
        const workflowProgress = get().workflowProgress
        set({
          script,
          workflowProgress: {
            ...workflowProgress,
            scriptCompleted: Boolean(script && script.length > 0),
          },
        })
      },

      saveProject: async () => {
        const { projectName, script, shotList, subjects, generatedPrompts } = get()
        const supabase = getSupabase()

        if (supabase) {
          try {
            // Check if project exists
            const { data: existingProject } = await supabase
              .from("projects")
              .select("id")
              .eq("name", projectName)
              .single()

            const projectData = {
              name: projectName,
              last_modified: new Date().toISOString(),
              data: {
                script,
                shotList,
                subjects,
                generatedPrompts,
              },
            }

            if (existingProject) {
              // Update existing project
              await supabase.from("projects").update(projectData).eq("id", existingProject.id)
            } else {
              // Create new project
              await supabase.from("projects").insert(projectData)
            }
          } catch (error) {
            console.error("Error saving project to Supabase:", error)
            // Fallback to localStorage if Supabase fails
            localStorage.setItem(
              `scriptvision_project_${projectName}`,
              JSON.stringify({
                name: projectName,
                lastModified: new Date().toISOString(),
                script,
                shotList,
                subjects,
                generatedPrompts,
              }),
            )
          }
        } else {
          // Fallback to localStorage if Supabase is not available
          localStorage.setItem(
            `scriptvision_project_${projectName}`,
            JSON.stringify({
              name: projectName,
              lastModified: new Date().toISOString(),
              script,
              shotList,
              subjects,
              generatedPrompts,
            }),
          )
        }
      },

      loadProject: async (name) => {
        const supabase = getSupabase()

        try {
          if (supabase) {
            // Try to load from Supabase
            const { data: projectData, error } = await supabase.from("projects").select("*").eq("name", name).single()

            if (error) throw error

            if (projectData) {
              const { data } = projectData

              set({
                projectName: projectData.name,
                script: data.script,
                shotList: data.shotList,
                subjects: data.subjects,
                generatedPrompts: data.generatedPrompts,
                workflowProgress: {
                  scriptCompleted: Boolean(data.script && data.script.length > 0),
                  shotListCompleted: data.shotList.length > 0,
                  subjectsCompleted: data.subjects.length > 0,
                  stylesCompleted: Boolean(get().selectedStyle),
                  promptsCompleted: data.generatedPrompts.length > 0,
                },
              })
              return
            }
          }
        } catch (error) {
          console.error("Error loading from Supabase:", error)
        }

        // Fallback to localStorage
        try {
          const projectData = localStorage.getItem(`scriptvision_project_${name}`)

          if (!projectData) {
            throw new Error(`Project "${name}" not found`)
          }

          const project: Project = JSON.parse(projectData)

          set({
            projectName: project.name,
            script: project.script,
            shotList: project.shotList,
            subjects: project.subjects,
            generatedPrompts: project.generatedPrompts,
            workflowProgress: {
              scriptCompleted: Boolean(project.script && project.script.length > 0),
              shotListCompleted: project.shotList.length > 0,
              subjectsCompleted: project.subjects.length > 0,
              stylesCompleted: Boolean(get().selectedStyle),
              promptsCompleted: project.generatedPrompts.length > 0,
            },
          })
        } catch (error) {
          throw error
        }
      },

      deleteProject: async (name) => {
        const supabase = getSupabase()

        try {
          if (supabase) {
            // Try to delete from Supabase
            await supabase.from("projects").delete().eq("name", name)
          }
        } catch (error) {
          console.error("Error deleting from Supabase:", error)
        }

        // Also remove from localStorage as fallback
        localStorage.removeItem(`scriptvision_project_${name}`)
      },

      listProjects: async () => {
        const projects = []
        const supabase = getSupabase()

        try {
          if (supabase) {
            // Try to list from Supabase
            const { data, error } = await supabase
              .from("projects")
              .select("name, last_modified, data")
              .order("last_modified", { ascending: false })

            if (!error && data) {
              return data.map((project) => ({
                name: project.name,
                lastModified: project.last_modified,
                shotCount: project.data.shotList?.length || 0,
                subjectCount: project.data.subjects?.length || 0,
                promptCount: project.data.generatedPrompts?.length || 0,
              }))
            }
          }
        } catch (error) {
          console.error("Error listing projects from Supabase:", error)
        }

        // Fallback to localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)

          if (key?.startsWith("scriptvision_project_")) {
            const projectData = localStorage.getItem(key)

            if (projectData) {
              const project: Project = JSON.parse(projectData)

              projects.push({
                name: project.name,
                lastModified: project.lastModified,
                shotCount: project.shotList.length,
                subjectCount: project.subjects.length,
                promptCount: project.generatedPrompts.length,
              })
            }
          }
        }

        return projects
      },

      // Shot list actions
      generateShotList: async () => {
        const { script } = get()

        if (!script.trim()) {
          throw new Error("Script is empty")
        }

        useLoadingStore.getState().setLoading("generateShotList", true)

        try {
          // Use the new structured output function
          const { generateStructuredShotList } = await import("@/lib/ai-service")
          const shots = await generateStructuredShotList(script)

          console.log("Structured shots:", shots)

          // If no shots were parsed, throw an error
          if (shots.length === 0) {
            throw new Error("Failed to generate shot list. Please try again.")
          }

          const workflowProgress = get().workflowProgress
          set({
            shotList: shots,
            workflowProgress: {
              ...workflowProgress,
              shotListCompleted: true,
            },
          })
        } catch (error) {
          console.error("Failed to generate shot list:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("generateShotList", false)
        }
      },

      updateShot: (updatedShot) => {
        const { shotList } = get()

        const updatedShotList = shotList.map((shot) => (shot.id === updatedShot.id ? updatedShot : shot))

        set({ shotList: updatedShotList })
      },

      generateBulkDirectorsNotes: async () => {
        const { shotList, selectedDirectorStyle } = get()

        if (shotList.length === 0) {
          throw new Error("No shots available")
        }

        useLoadingStore.getState().setLoading("generateDirectorsNotes", true)

        try {
          // In a real implementation, this would call an AI service for each shot
          const updatedShotList = await Promise.all(
            shotList.map(async (shot) => {
              const directorStyle = selectedDirectorStyle ? `in the style of ${selectedDirectorStyle.name}` : ""

              const notes = await generateAIResponse(
                `Generate director's notes for this shot ${directorStyle}`,
                `Scene: ${shot.scene}, Shot: ${shot.shot}, Description: ${shot.description}`,
              )

              return {
                ...shot,
                directorsNotes: notes,
              }
            }),
          )

          set({ shotList: updatedShotList })
        } catch (error) {
          console.error("Failed to generate director's notes:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("generateDirectorsNotes", false)
        }
      },
      // Add the implementation in the store
      addShots: (shots) => {
        const { shotList } = get()

        // Sort the shots by scene and shot number
        const updatedShotList = [...shotList, ...shots].sort((a, b) => {
          // First compare scene numbers
          const sceneA = Number.parseInt(a.scene, 10) || 0
          const sceneB = Number.parseInt(b.scene, 10) || 0

          if (sceneA !== sceneB) {
            return sceneA - sceneB
          }

          // If scenes are the same, compare shot numbers
          const shotA = Number.parseFloat(a.shot.replace(/[^0-9.]/g, "")) || 0
          const shotB = Number.parseFloat(b.shot.replace(/[^0-9.]/g, "")) || 0
          return shotA - shotB
        })

        set({ shotList: updatedShotList })
      },

      // Subject actions
      extractSubjects: async () => {
        const { script } = get()

        if (!script.trim()) {
          throw new Error("Script is empty")
        }

        useLoadingStore.getState().setLoading("extractSubjects", true)

        try {
          // Call the AI service to extract subjects
          const subjectsText = await generateAIResponse(
            "Extract subjects (characters, locations, props) from this script",
            script,
          )
          console.log("Subjects extraction response:", subjectsText)

          // Parse the AI response into structured data
          const subjects = parseAISubjects(subjectsText)

          // If no subjects were parsed, throw an error
          if (subjects.length === 0) {
            console.error("Failed to parse subjects from AI response:", subjectsText)
            throw new Error("Failed to parse subjects from AI response. Please try again.")
          }

          set({ proposedSubjects: subjects })
        } catch (error) {
          console.error("Failed to extract subjects:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("extractSubjects", false)
        }
      },

      addSubject: (subject) => {
        const { subjects } = get()
        const newSubject = {
          ...subject,
          id: subject.id || uuidv4(),
        }

        const updatedSubjects = [...subjects, newSubject]
        const workflowProgress = get().workflowProgress

        set({
          subjects: updatedSubjects,
          workflowProgress: {
            ...workflowProgress,
            subjectsCompleted: updatedSubjects.length > 0,
          },
        })
      },

      updateSubject: (updatedSubject) => {
        const { subjects, proposedSubjects } = get()

        // Check if the subject is in the main subjects list
        if (subjects.some((s) => s.id === updatedSubject.id)) {
          const updatedSubjects = subjects.map((subject) =>
            subject.id === updatedSubject.id ? updatedSubject : subject,
          )

          set({ subjects: updatedSubjects })
        }
        // Check if the subject is in the proposed subjects list
        else if (proposedSubjects.some((s) => s.id === updatedSubject.id)) {
          const updatedProposedSubjects = proposedSubjects.map((subject) =>
            subject.id === updatedSubject.id ? updatedSubject : subject,
          )

          set({ proposedSubjects: updatedProposedSubjects })
        }
      },

      deleteSubject: (id) => {
        const { subjects, proposedSubjects } = get()

        // Check if the subject is in the main subjects list
        if (subjects.some((s) => s.id === id)) {
          const updatedSubjects = subjects.filter((subject) => subject.id !== id)
          const workflowProgress = get().workflowProgress

          set({
            subjects: updatedSubjects,
            workflowProgress: {
              ...workflowProgress,
              subjectsCompleted: updatedSubjects.length > 0,
            },
          })
        }
        // Check if the subject is in the proposed subjects list
        else if (proposedSubjects.some((s) => s.id === id)) {
          set({ proposedSubjects: proposedSubjects.filter((subject) => subject.id !== id) })
        }
      },

      mergeProposedSubjects: () => {
        const { subjects, proposedSubjects } = get()

        // Merge proposed subjects into the main subjects list
        // Avoid duplicates by name
        const existingNames = new Set(subjects.map((s) => s.name.toLowerCase()))
        const newSubjects = proposedSubjects.filter((s) => !existingNames.has(s.name.toLowerCase()))
        const updatedSubjects = [...subjects, ...newSubjects]
        const workflowProgress = get().workflowProgress

        set({
          subjects: updatedSubjects,
          proposedSubjects: [],
          workflowProgress: {
            ...workflowProgress,
            subjectsCompleted: updatedSubjects.length > 0,
          },
        })
      },

      // Style actions
      addStyle: (style) => {
        const { styles } = get()
        const newStyle = {
          ...style,
          id: style.id || uuidv4(),
        }

        set({ styles: [...styles, newStyle] })
      },

      updateStyle: (updatedStyle) => {
        const { styles } = get()

        const updatedStyles = styles.map((style) => (style.id === updatedStyle.id ? updatedStyle : style))

        set({ styles: updatedStyles })
      },

      deleteStyle: (id) => {
        const { styles, selectedStyle } = get()
        const updatedStyles = styles.filter((style) => style.id !== id)

        // If we're deleting the currently selected style, deselect it
        const newSelectedStyle = selectedStyle && selectedStyle.id === id ? null : selectedStyle
        const workflowProgress = get().workflowProgress

        set({
          styles: updatedStyles,
          selectedStyle: newSelectedStyle,
          workflowProgress: {
            ...workflowProgress,
            stylesCompleted: Boolean(newSelectedStyle),
          },
        })
      },

      setSelectedStyle: (style) => {
        const workflowProgress = get().workflowProgress
        set({
          selectedStyle: style,
          workflowProgress: {
            ...workflowProgress,
            stylesCompleted: Boolean(style),
          },
        })
      },

      setSelectedDirectorStyle: (style) => {
        set({ selectedDirectorStyle: style })
      },

      // Prompt actions
      generatePrompt: async (shot, activeSubjects, cameraSettings) => {
        const { script, selectedStyle, selectedDirectorStyle, generatedPrompts } = get()

        if (!selectedStyle) {
          throw new Error("No style selected")
        }

        useLoadingStore.getState().setLoading("generatePrompt", true)

        try {
          // In a real implementation, this would call an AI service
          const promptContext = {
            shot,
            subjects: activeSubjects,
            style: selectedStyle,
            directorStyle: selectedDirectorStyle,
            script,
            cameraSettings,
          }

          // Generate the prompt using AI
          const promptText = await generateAIResponse(
            "Generate visual prompts for AI image generation",
            JSON.stringify(promptContext),
          )

          // This is a simplified mock implementation
          const newPrompt: GeneratedPrompt = {
            id: uuidv4(),
            shotId: shot.id,
            concise: `${selectedStyle.prefix} Medium shot of ${shot.people} in ${shot.location}. ${selectedStyle.suffix}`,
            normal: `${selectedStyle.prefix} Medium shot of ${shot.people} ${shot.action} in ${shot.location}. Camera follows the movement. ${selectedStyle.suffix}`,
            detailed: `${selectedStyle.prefix} Medium shot of ${shot.people} ${shot.action} in ${shot.location}. ${shot.description} Camera follows the movement with a slight handheld feel. ${cameraSettings.depthOfField} depth of field. ${selectedStyle.suffix}`,
            timestamp: new Date().toISOString(),
          }

          const updatedPrompts = [...generatedPrompts, newPrompt]
          const workflowProgress = get().workflowProgress

          set({
            generatedPrompts: updatedPrompts,
            workflowProgress: {
              ...workflowProgress,
              promptsCompleted: true,
            },
          })
        } catch (error) {
          console.error("Failed to generate prompt:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("generatePrompt", false)
        }
      },

      // Music Lab actions
      generateVideoTreatment: async (formData) => {
        useLoadingStore.getState().setLoading("generateTreatment", true)

        try {
          // In a real implementation, this would call an AI service
          const treatmentText = await generateAIResponse(
            "Generate a video treatment for this song",
            JSON.stringify(formData),
          )

          return treatmentText
        } catch (error) {
          console.error("Failed to generate video treatment:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("generateTreatment", false)
        }
      },
    }),
    {
      name: "scriptvision-storage",
      partialize: (state) => ({
        styles: state.styles,
        directorStyles: state.directorStyles,
      }),
    },
  ),
)

// Helper function to parse the AI-generated subjects into structured data
function parseAISubjects(subjectsText: string): Subject[] {
  const subjects: Subject[] = []
  console.log("Raw AI response for subjects:", subjectsText)

  // Try to identify sections for People, Places, and Props
  // Updated regex to be more flexible with different heading formats
  const peopleSection = subjectsText.match(
    /(?:People|People $Characters$|Characters)(?:\s*$.*?$)?:([^]*?)(?=(?:Places|Locations|Props|$))/i,
  )
  const placesSection = subjectsText.match(
    /(?:Places|Locations)(?:\s*$.*?$)?:([^]*?)(?=(?:People|Characters|Props|$))/i,
  )
  const propsSection = subjectsText.match(
    /(?:Props|Objects|Important Objects)(?:\s*$.*?$)?:([^]*?)(?=(?:People|Characters|Places|Locations|$))/i,
  )

  console.log("Parsed sections:", {
    peopleSection: peopleSection ? "Found" : "Not found",
    placesSection: placesSection ? "Found" : "Not found",
    propsSection: propsSection ? "Found" : "Not found",
  })

  // Process numbered or bulleted lists in each section
  const processSection = (section: RegExpMatchArray | null, category: "People" | "Places" | "Props") => {
    if (!section || !section[1]) return

    const sectionText = section[1]
    console.log(`Processing ${category} section:`, sectionText)

    // Try to match numbered items (1. Item name)
    const numberedItems = sectionText.match(/\d+\.\s+(?:\*\*)?([^*\n]+)(?:\*\*)?(?:[^\n]*\n+(?:\s+[-•].*\n+)*)/g)

    // Try to match bulleted items (- Item name or • Item name)
    const bulletedItems = sectionText.match(/[-•]\s+(?:\*\*)?([^*\n]+)(?:\*\*)?(?:[^\n]*\n+(?:\s+[-•].*\n+)*)/g)

    // Try to match items with asterisks (**Item name**)
    const boldItems = sectionText.match(/\*\*([^*]+)\*\*([^]*?)(?=\*\*|$)/g)

    console.log(`Found items in ${category}:`, {
      numbered: numberedItems?.length || 0,
      bulleted: bulletedItems?.length || 0,
      bold: boldItems?.length || 0,
    })

    // Process numbered items
    if (numberedItems && numberedItems.length > 0) {
      numberedItems.forEach((item) => {
        const nameMatch = item.match(/\d+\.\s+(?:\*\*)?([^*\n:]+)(?:\*\*)?/)
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim()

          // Extract description
          let description = ""
          const descMatch = item.match(/Description(?:\*\*)?:\s*([^]*?)(?=\n\s*(?:Alias|Category|$))/i)
          if (descMatch && descMatch[1]) {
            description = descMatch[1].trim()
          } else {
            // If no explicit description field, use everything after the name
            const fullText = item.replace(/\d+\.\s+(?:\*\*)?[^*\n:]+(?:\*\*)?/, "").trim()
            description = fullText.replace(/(?:Alias|Category)(?:\*\*)?:.*$/gim, "").trim()
          }

          // Extract alias
          let alias = ""
          const aliasMatch = item.match(/Alias(?:\*\*)?:\s*([^]*?)(?=\n\s*(?:Description|Category|$))/i)
          if (aliasMatch && aliasMatch[1]) {
            alias = aliasMatch[1].replace(/None/i, "").trim()
          }

          subjects.push({
            id: uuidv4(),
            name,
            category,
            description,
            alias,
            active: true,
          })
        }
      })
    }
    // Process bulleted items
    else if (bulletedItems && bulletedItems.length > 0) {
      bulletedItems.forEach((item) => {
        const nameMatch = item.match(/[-•]\s+(?:\*\*)?([^*\n:]+)(?:\*\*)?/)
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim()

          // Extract description
          let description = ""
          const descMatch = item.match(/Description(?:\*\*)?:\s*([^]*?)(?=\n\s*(?:Alias|Category|$))/i)
          if (descMatch && descMatch[1]) {
            description = descMatch[1].trim()
          } else {
            // If no explicit description field, use everything after the name
            const fullText = item.replace(/[-•]\s+(?:\*\*)?[^*\n:]+(?:\*\*)?/, "").trim()
            description = fullText.replace(/(?:Alias|Category)(?:\*\*)?:.*$/gim, "").trim()
          }

          // Extract alias
          let alias = ""
          const aliasMatch = item.match(/Alias(?:\*\*)?:\s*([^]*?)(?=\n\s*(?:Description|Category|$))/i)
          if (aliasMatch && aliasMatch[1]) {
            alias = aliasMatch[1].replace(/None/i, "").trim()
          }

          subjects.push({
            id: uuidv4(),
            name,
            category,
            description,
            alias,
            active: true,
          })
        }
      })
    }
    // Process bold items
    else if (boldItems && boldItems.length > 0) {
      boldItems.forEach((item) => {
        const nameMatch = item.match(/\*\*([^*]+)\*\*/)
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim()

          // Extract description
          let description = ""
          const descMatch = item.match(/Description(?:\*\*)?:\s*([^]*?)(?=\n\s*(?:Alias|Category|$))/i)
          if (descMatch && descMatch[1]) {
            description = descMatch[1].trim()
          } else {
            // If no explicit description field, use everything after the name
            const fullText = item.replace(/\*\*[^*]+\*\*/, "").trim()
            description = fullText.replace(/(?:Alias|Category)(?:\*\*)?:.*$/gim, "").trim()
          }

          // Extract alias
          let alias = ""
          const aliasMatch = item.match(/Alias(?:\*\*)?:\s*([^]*?)(?=\n\s*(?:Description|Category|$))/i)
          if (aliasMatch && aliasMatch[1]) {
            alias = aliasMatch[1].replace(/None/i, "").trim()
          }

          subjects.push({
            id: uuidv4(),
            name,
            category,
            description,
            alias,
            active: true,
          })
        }
      })
    }
    // Fallback: Try to extract subjects from plain text
    else {
      // Split by lines and look for patterns
      const lines = sectionText.split("\n")
      let currentSubject: Partial<Subject> | null = null

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Check if this is a new subject (starts with a name-like pattern)
        const nameMatch = trimmedLine.match(/^(?:\d+\.\s+)?(?:\*\*)?([^*:]+)(?:\*\*)?(?::|$)/)
        if (nameMatch && nameMatch[1] && !trimmedLine.match(/^(?:Description|Alias|Category):/i)) {
          // Save previous subject if exists
          if (currentSubject?.name) {
            subjects.push({
              id: uuidv4(),
              name: currentSubject.name,
              category,
              description: currentSubject.description || "",
              alias: currentSubject.alias || "",
              active: true,
            })
          }

          // Start new subject
          currentSubject = {
            name: nameMatch[1].trim(),
            category,
            description: "",
            alias: "",
          }
        }
        // Check if this is a description line
        else if (currentSubject && trimmedLine.match(/^(?:\*\*)?Description(?:\*\*)?:/i)) {
          currentSubject.description = trimmedLine.replace(/^(?:\*\*)?Description(?:\*\*)?:\s*/i, "").trim()
        }
        // Check if this is an alias line
        else if (currentSubject && trimmedLine.match(/^(?:\*\*)?Alias(?:\*\*)?:/i)) {
          const aliasText = trimmedLine.replace(/^(?:\*\*)?Alias(?:\*\*)?:\s*/i, "").trim()
          currentSubject.alias = aliasText.replace(/None/i, "").trim()
        }
        // Otherwise, append to description
        else if (currentSubject) {
          currentSubject.description += " " + trimmedLine
        }
      }

      // Save the last subject if exists
      if (currentSubject?.name) {
        subjects.push({
          id: uuidv4(),
          name: currentSubject.name,
          category,
          description: currentSubject.description || "",
          alias: currentSubject.alias || "",
          active: true,
        })
      }
    }
  }

  // Process each section
  processSection(peopleSection, "People")
  processSection(placesSection, "Places")
  processSection(propsSection, "Props")

  // If we still couldn't extract subjects, try a more aggressive approach
  if (subjects.length === 0) {
    console.log("No subjects extracted with standard methods, trying fallback approach")

    // Look for any patterns that might indicate a subject
    const subjectPatterns = [
      // Bold name followed by category
      /\*\*([^*]+)\*\*\s*-\s*\*\*Category\*\*:\s*([^*\n]+)/g,
      // Numbered item with bold name
      /\d+\.\s+\*\*([^*]+)\*\*/g,
      // Any bold text that might be a name
      /\*\*([^*]+)\*\*/g,
    ]

    for (const pattern of subjectPatterns) {
      let match
      while ((match = pattern.exec(subjectsText)) !== null) {
        const name = match[1].trim()

        // Determine category based on context
        let category: "People" | "Places" | "Props" = "People" // Default
        if (
          subjectsText.indexOf(name) > subjectsText.toLowerCase().indexOf("places") &&
          subjectsText.indexOf(name) < subjectsText.toLowerCase().indexOf("props")
        ) {
          category = "Places"
        } else if (subjectsText.indexOf(name) > subjectsText.toLowerCase().indexOf("props")) {
          category = "Props"
        }

        // Extract description - look for text after the name until the next pattern
        const nameIndex = subjectsText.indexOf(name)
        const nextNameIndex = subjectsText.indexOf("**", nameIndex + name.length + 2)
        let description = ""

        if (nextNameIndex > nameIndex) {
          description = subjectsText.substring(nameIndex + name.length, nextNameIndex).trim()
          // Clean up the description
          description = description
            .replace(/^\s*-\s*\*\*Category\*\*:[^*\n]+/g, "")
            .replace(/\*\*Description\*\*:\s*/g, "")
            .replace(/\*\*Alias\*\*:[^*\n]+/g, "")
            .trim()
        }

        // Only add if we don't already have this subject
        if (!subjects.some((s) => s.name === name)) {
          subjects.push({
            id: uuidv4(),
            name,
            category,
            description,
            alias: "",
            active: true,
          })
        }
      }

      // If we found subjects with this pattern, stop trying others
      if (subjects.length > 0) break
    }
  }

  console.log("Final extracted subjects:", subjects)
  return subjects
}
