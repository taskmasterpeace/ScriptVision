"use client"

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

// Mock data for initial state
export const mockDirectorStyles: DirectorStyle[] = [
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
export function parseAIShotList(shotListText: string): Shot[] {
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

// Expose the parseAIShotList function to the window object for debugging
// if (typeof window !== "undefined") {
//   ;(window as any).parseAIShotList = parseAIShotList
// }

// Helper function to extract shot details from a text block
export function extractShotDetails(text: string, sceneNumber: string, shotNumber: string): Shot | null {
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

// Helper function to parse the AI-generated subjects into structured data
export function parseAISubjects(subjectsText: string): Subject[] {
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
  