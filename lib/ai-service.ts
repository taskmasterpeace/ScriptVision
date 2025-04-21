// AI service implementation using OpenAI API
import { useTemplateStore } from "@/lib/stores/template-store"
import { useAILogsStore } from "@/lib/stores/ai-logs-store"
import { useModelStore, type ApplicationPhase } from "@/lib/stores/model-store"

// Helper function to check if we're in a preview environment
const isPreviewEnvironment = () => {
  return (
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.NODE_ENV === "development")
  )
}

export async function generateAIResponse(prompt: string, context: string): Promise<string> {
  console.log("AI Prompt:", prompt)
  console.log("Context:", context)

  // Get the appropriate template based on the prompt
  let templateId = ""
  let phase: ApplicationPhase | null = null

  if (prompt.includes("shot list") && !prompt.includes("suggest")) {
    templateId = "shot-list-generation"
    phase = "shotListGeneration"
  } else if (prompt.includes("subjects")) {
    templateId = "subject-extraction"
    phase = "subjectExtraction"
  } else if (prompt.includes("director's notes")) {
    templateId = "directors-notes"
    phase = "directorsNotes"
  } else if (prompt.includes("visual prompts")) {
    templateId = "visual-prompt"
    phase = "visualPrompt"
  } else if (prompt.includes("video treatment")) {
    templateId = "video-treatment"
    phase = "videoTreatment"
  } else if (prompt.includes("suggest") && prompt.includes("shot")) {
    templateId = "shot-suggestions"
    phase = "shotListGeneration" // Use the same model as shot list generation
  }

  // Get the selected model for this phase
  const modelStore = useModelStore.getState()
  const selectedModelId = phase ? modelStore.getModelForPhase(phase) : null
  const selectedModel = selectedModelId
    ? modelStore.availableModels.find((model) => model.id === selectedModelId)
    : null

  // Process the template if we have one
  let processedPrompt = prompt
  if (templateId) {
    const variables: Record<string, string> = {}

    // Parse context into variables
    if (templateId === "shot-list-generation" || templateId === "subject-extraction") {
      variables.script = context
    } else if (templateId === "directors-notes") {
      // Parse shot details from context
      const match = context.match(/Scene: (.*), Shot: (.*), Description: (.*)/)
      if (match) {
        variables.scene = match[1]
        variables.shot = match[2]
        variables.description = match[3]
      }

      // Check if there's a director style
      if (prompt.includes("in the style of")) {
        const styleMatch = prompt.match(/in the style of (.*)/)
        if (styleMatch) {
          variables.directorStyle = styleMatch[1]
        }
      }
    } else if (templateId === "visual-prompt") {
      // For visual prompts, we're passing a JSON object as context
      try {
        const contextObj = JSON.parse(context)

        // Map all possible variables from the context object
        if (contextObj.shot) {
          variables.shot_description = contextObj.shot.description || ""
          variables.camera_size = contextObj.shot.shotSize || ""
        }

        if (contextObj.style) {
          variables.style = contextObj.style.name || ""
          variables.style_prefix = contextObj.style.prefix || ""
        }

        if (contextObj.directorStyle) {
          variables.director_style = `${contextObj.directorStyle.name}: ${contextObj.directorStyle.visualStyle}` || ""
        }

        if (contextObj.cameraSettings) {
          variables.camera_shot = contextObj.cameraSettings.shot || ""
          variables.camera_move = contextObj.cameraSettings.move || ""
          variables.camera_framing = contextObj.cameraSettings.framing || ""
          variables.camera_depth_of_field = contextObj.cameraSettings.depthOfField || ""
          variables.camera_type = contextObj.cameraSettings.type || ""
          variables.camera_name = contextObj.cameraSettings.name || ""
        }

        if (contextObj.subjects && Array.isArray(contextObj.subjects)) {
          variables.subject_info = contextObj.subjects.map((s: any) => `${s.name}: ${s.description}`).join("\n")
        }

        // Add any other variables that might be in the context
        Object.entries(contextObj).forEach(([key, value]) => {
          if (typeof value === "string" && !variables[key]) {
            variables[key] = value
          }
        })
      } catch (e) {
        console.error("Failed to parse context as JSON:", e)
      }
    } else if (templateId === "video-treatment") {
      // For video treatments, we're passing a JSON object as context
      try {
        const formData = JSON.parse(context)
        variables.artistName = formData.artistName || ""
        variables.songTitle = formData.songTitle || ""
        variables.genre = formData.genre || ""
        variables.lyrics = formData.lyrics || ""
        variables.concept = formData.concept || ""
        variables.visualDescriptors = formData.visualDescriptors || ""
        variables.wardrobeCount = formData.wardrobeCount || "1"
        variables.wardrobeDetails = formData.wardrobeDetails || ""
      } catch (e) {
        console.error("Failed to parse context as JSON:", e)
      }
    } else if (templateId === "shot-suggestions") {
      // For shot suggestions, we're passing a JSON object as context
      try {
        const contextObj = JSON.parse(context)
        variables.script = contextObj.script || ""
        variables.existingShots = contextObj.existingShots || ""
      } catch (e) {
        console.error("Failed to parse context as JSON:", e)
      }
    }

    processedPrompt = processTemplate(templateId, variables)
  }

  // Log the prompt being sent
  const aiLogsStore = useAILogsStore.getState()
  aiLogsStore.addLog({
    type: "prompt",
    template: templateId,
    content: processedPrompt,
    metadata: {
      originalPrompt: prompt,
      context: context,
      model: selectedModel ? selectedModel.name : "Default",
      modelId: selectedModelId || "default",
      usedMockData: modelStore.useMockData || isPreviewEnvironment(),
    },
  })

  // Debug logging
  console.log(`Using model: ${selectedModel ? selectedModel.name : "Default"} (${selectedModelId || "default"})`)
  console.log(`Using mock data: ${modelStore.useMockData || isPreviewEnvironment()}`)
  console.log(`API Key available: ${Boolean(modelStore.apiKey)}`)
  console.log(`Is preview environment: ${isPreviewEnvironment()}`)

  // If we're not using mock data and not in a preview environment, try to call the API
  if (!modelStore.useMockData && !isPreviewEnvironment()) {
    try {
      // Get the OpenAI API configuration
      const { apiKey } = modelStore

      if (!apiKey) {
        console.warn("OpenAI API key is missing. Using mock data instead.")
        throw new Error("OpenAI API key is missing. Please configure it in the Models tab.")
      }

      // Set up headers with API key
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      }

      // Use the model ID if specified, otherwise use a default model
      let modelId = selectedModelId
      if (!modelId) {
        if (phase === "shotListGeneration" || phase === "subjectExtraction") {
          modelId = "gpt-4o" // Default to GPT-4o for these tasks if no model is selected
        } else {
          modelId = "gpt-4o" // Default fallback for any task
        }
      }

      // Create the request payload following OpenAI API format
      const payload = {
        model: modelId,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant specialized in visual prompts and film production.",
          },
          {
            role: "user",
            content: processedPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000, // Increased token limit for longer responses
      }

      console.log(`Calling OpenAI API with model: ${modelId}`)
      console.log("Payload:", payload)

      // Make the API call to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`API request failed: ${response.status} ${response.statusText}`)
        console.error(`Error data: ${errorData}`)
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      // Extract the response content from the API response
      const aiResponse =
        data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : "No response content received from API"

      // Log the response received
      aiLogsStore.addLog({
        type: "response",
        template: templateId,
        content: aiResponse,
        metadata: {
          model: selectedModel ? selectedModel.name : modelId,
          modelId: selectedModelId || modelId,
          usedMockData: false,
          usage: data.usage || null,
        },
      })

      return aiResponse
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      // Log the error
      aiLogsStore.addLog({
        type: "response",
        template: templateId,
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        metadata: {
          model: selectedModel ? selectedModel.name : "Error",
          modelId: selectedModelId || "error",
          usedMockData: false,
          error: true,
        },
      })

      // Fall back to mock responses
      console.log("Falling back to mock response")
    }
  }

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate mock response based on the prompt
  let response = ""
  if (prompt.includes("shot list") && !prompt.includes("suggest")) {
    response = mockShotListResponse()
  } else if (prompt.includes("subjects")) {
    response = mockSubjectsResponse()
  } else if (prompt.includes("director's notes")) {
    response = mockDirectorsNotesResponse()
  } else if (prompt.includes("visual prompts")) {
    response = mockVisualPromptsResponse()
  } else if (prompt.includes("video treatment")) {
    response = mockVideoTreatmentResponse()
  } else if (prompt.includes("suggest") && prompt.includes("shot")) {
    response = mockShotSuggestionsResponse()
  } else {
    response = "AI generated response based on your prompt and context."
  }

  // Log the response received
  aiLogsStore.addLog({
    type: "response",
    template: templateId,
    content: response,
    metadata: {
      model: selectedModel ? selectedModel.name : "Mock",
      modelId: selectedModelId || "mock",
      usedMockData: true,
    },
  })

  return response
}

// Function to process a template with variables
export function processTemplate(templateId: string, variables: Record<string, string>): string {
  const templateStore = useTemplateStore.getState()
  const template = templateStore.getTemplate(templateId)

  if (!template) {
    console.error(`Template with ID ${templateId} not found`)
    return ""
  }

  let processedTemplate = template.template

  // Add specific instructions for subject extraction
  if (templateId === "subject-extraction") {
    processedTemplate = `${processedTemplate}

Please format your response as follows:
### People (Characters)
1. **Character Name**
   - **Category**: People
   - **Description**: Brief description of the character
   - **Alias**: Any alias or nickname (or "None")

### Places (Locations)
1. **Location Name**
   - **Category**: Places
   - **Description**: Brief description of the location
   - **Alias**: Any alias or alternate name (or "None")

### Props (Important Objects)
1. **Object Name**
   - **Category**: Props
   - **Description**: Brief description of the object
   - **Alias**: Any alias or alternate name (or "None")
`
  }

  // Process variables
  template.variables.forEach((variable) => {
    const variablePlaceholder = `{{${variable.name}}}`

    if (variable.enabled) {
      // Replace enabled variables with their values
      const value = variables[variable.name] || ""
      processedTemplate = processedTemplate.replace(new RegExp(variablePlaceholder, "g"), value)
    } else {
      // For disabled variables, we need to handle different cases:

      // Case 1: Variable is on its own line with label (e.g., "Label: {{variable}}")
      processedTemplate = processedTemplate.replace(new RegExp(`^.*?${variablePlaceholder}.*?$`, "gm"), "")

      // Case 2: Variable is part of a line but not the only content
      processedTemplate = processedTemplate.replace(new RegExp(`\\s*\\w+:\\s*${variablePlaceholder}\\s*`, "g"), "")

      // Case 3: Any remaining instances of the variable
      processedTemplate = processedTemplate.replace(new RegExp(variablePlaceholder, "g"), "")
    }
  })

  // Clean up any empty lines or double spaces that might result from removing variables
  processedTemplate = processedTemplate
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Replace triple newlines with double
    .replace(/\n\n\n+/g, "\n\n") // Replace any sequence of 3+ newlines with double
    .replace(/ {2,}/g, " ") // Replace multiple spaces with a single space
    .replace(/\n\s*\n$/g, "\n") // Remove trailing empty lines
    .replace(/^\s*\n/, "") // Remove leading empty lines
    .replace(/:\s*\n/g, ":\n") // Clean up any labels with empty values
    .replace(/:\s*,/g, ",") // Clean up any empty values in comma-separated lists
    .replace(/,\s*,/g, ",") // Clean up consecutive commas
    .replace(/,\s*\n/g, "\n") // Clean up trailing commas at end of lines
    .replace(/$$\s*$$/g, "") // Remove empty parentheses
    .replace(/\[\s*\]/g, "") // Remove empty brackets
    .replace(/\s+\./g, ".") // Fix spacing before periods

  return processedTemplate
}

function mockShotListResponse(): string {
  return `Scene 1, Shot 1
Shot Size: ELS (Extreme Long Shot)
Description: Establishing shot of the city skyline at dawn
People: None
Action: Camera pans slowly across the city skyline as the sun rises
Dialogue: None
Location: City skyline

Scene 1, Shot 2
Shot Size: MS (Medium Shot)
Description: John walking down the busy street
People: John
Action: John walks purposefully down the busy street, checking his watch
Dialogue: None
Location: Downtown street

Scene 1, Shot 3
Shot Size: MLS (Medium Long Shot)
Description: John enters the building
People: John
Action: John pushes through the revolving door and enters the lobby
Dialogue: None
Location: Office building entrance`
}

function mockSubjectsResponse(): string {
  return `People:
- John: Main character, mid-30s, business attire, determined personality
- Sarah: Supporting character, early 30s, John's colleague, professional appearance
- David: Office manager, 50s, stern demeanor, always in formal suits

Places:
- Downtown Street: Busy urban setting, morning rush hour, tall buildings
- Office Building: Modern glass skyscraper, corporate headquarters
- Conference Room: Large meeting space with glass walls, executive furniture
- Cafe: Small coffee shop near the office, casual atmosphere

Props:
- Briefcase: Brown leather briefcase carried by John, contains important documents
- Smartphone: John's latest model smartphone, essential communication device
- Coffee Cup: Disposable cup from the cafe, appears in multiple scenes
- Presentation Folder: Red folder containing the proposal documents`
}

function mockDirectorsNotesResponse(): string {
  return `For this shot, focus on creating tension through tight framing. Use shallow depth of field to isolate the character from the background, emphasizing their emotional state. The camera should maintain a slight handheld feel to enhance the sense of unease and emotional instability.

Lighting should be high contrast with strong shadows falling across the character's face, creating a visual representation of their internal conflict. Consider using a cooler color temperature for the background while keeping the character in warmer tones to create visual separation.

Guide the actor to maintain subtle micro-expressions that hint at their internal struggle rather than obvious emotional displays. Their body language should be slightly rigid, suggesting contained tension.

The pacing of this shot should be deliberate - hold on the character's face slightly longer than comfortable to build tension before cutting. This moment serves as a pivotal character beat that will pay off later in the narrative.`
}

function mockVisualPromptsResponse(): string {
  return `Medium shot of woman in rain-soaked alley.

Medium shot of woman walking cautiously through rain-soaked alley. Neon lights reflect in puddles. Camera follows with slight handheld movement.

Medium shot of woman in black coat walking cautiously through narrow rain-soaked alley. Neon signs from nearby businesses cast colorful reflections in puddles. Steam rises from vents. Camera follows with slight handheld movement. Shallow depth of field isolates the woman against the blurred urban background. Shot on a digital camera with anamorphic lens.`
}

function mockVideoTreatmentResponse(): string {
  return `**Music Video Treatment**

**Core Concept:**
A visual journey through emotional landscapes, exploring themes of transformation through surreal imagery and symbolic transitions.

**Intro Visuals:**
Wide shot of empty urban landscape at dawn. Soft golden light filters through buildings.
*(Lyric Cue: "Opening line")* - Close-up of artist's face, contemplative.

**Verse 1 Visuals:**
Artist moves through surreal environments that transform with each step.
*(Lyric Cue: "Key lyric")* - Artist touches wall, which ripples like water.

**Chorus Visuals:**
Environment expands into vast, otherworldly landscape.
*(Visual Motif: Release and freedom)*

**Bridge Visuals:**
Complete visual transformation. Most experimental sequence.
*(Lyric Cue: "Bridge climax")* - Artist undergoes visual metamorphosis.

**Outro Visuals:**
Return to opening location, but transformed by the journey.`
}

// Add a new mock response for shot suggestions
function mockShotSuggestionsResponse(): string {
  return `Based on my analysis of your script and existing shot list, here are some additional shots that would enhance the visual storytelling:

Scene 1, Shot 1.5: Close-up of John's determined expression
Shot Size: CU
Reason: This reaction shot would emphasize John's emotional state and motivation before he enters the building.

Scene 1, Shot 2.5: Insert shot of John's watch showing the time
Shot Size: ECU
Reason: This would establish the time pressure John is under and explain why he's walking purposefully.

Scene 2, Shot 1: Establishing shot of the office interior
Shot Size: LS
Reason: An establishing shot would help orient the viewer to the new location and show the scale of the office environment.

Scene 2, Shot 3.5: Over-the-shoulder shot of John looking at Sarah
Shot Size: MS
Reason: This would establish the relationship between these two characters and create visual interest through shot variety.

Scene 3, Shot 2: Close-up of the presentation folder being opened
Shot Size: CU
Reason: This insert shot would emphasize the importance of the documents and create a moment of anticipation.`
}
