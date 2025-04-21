"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface TemplateVariable {
  name: string
  description: string
  example: string
  enabled: boolean // Track if the variable is enabled
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: TemplateVariable[]
  category: "shotList" | "subjects" | "directorsNotes" | "visualPrompt" | "videoTreatment" | "shotSuggestions" | "other"
}

interface TemplateState {
  templates: PromptTemplate[]
  getTemplate: (id: string) => PromptTemplate | undefined
  updateTemplate: (id: string, template: Partial<PromptTemplate>) => void
  updateTemplateVariable: (templateId: string, variableName: string, enabled: boolean) => void
  resetToDefaults: () => void
}

// Default templates
const defaultTemplates: PromptTemplate[] = [
  {
    id: "shot-list-generation",
    name: "Shot List Generation",
    description: "Template used to generate a shot list from a script",
    category: "shotList",
    template: `Generate a detailed shot list from the following script. Break it down into scenes and shots with the following information for each shot:
- Scene number
- Shot number
- Shot size (ECU, CU, MCU, MS, MLS, LS, ELS)
- Description
- People in the shot
- Action
- Dialogue
- Location

SCRIPT:
{{script}}`,
    variables: [
      {
        name: "script",
        description: "The full script text",
        example: "EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...",
        enabled: true,
      },
    ],
  },
  {
    id: "subject-extraction",
    name: "Subject Extraction",
    description: "Template used to extract subjects from a script",
    category: "subjects",
    template: `Extract all subjects from the following script. Categorize them as:
- People (characters)
- Places (locations)
- Props (important objects)

For each subject, provide:
- Name
- Category
- Brief description
- Alias (if any)

SCRIPT:
{{script}}`,
    variables: [
      {
        name: "script",
        description: "The full script text",
        example: "EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...",
        enabled: true,
      },
    ],
  },
  {
    id: "directors-notes",
    name: "Director's Notes Generation",
    description: "Template used to generate director's notes for a shot",
    category: "directorsNotes",
    template: `Generate detailed director's notes for the following shot {{directorStyle}}. Focus on visual style, camera movement, lighting, and performance direction.

SHOT DETAILS:
Scene: {{scene}}
Shot: {{shot}}
Description: {{description}}
Shot Size: {{shotSize}}
People: {{people}}
Action: {{action}}
Location: {{location}}`,
    variables: [
      {
        name: "directorStyle",
        description: "Optional director style reference",
        example: "in the style of Christopher Nolan",
        enabled: true,
      },
      {
        name: "scene",
        description: "Scene number",
        example: "1",
        enabled: true,
      },
      {
        name: "shot",
        description: "Shot number",
        example: "3",
        enabled: true,
      },
      {
        name: "description",
        description: "Shot description",
        example: "John enters the building",
        enabled: true,
      },
      {
        name: "shotSize",
        description: "Shot size",
        example: "MS",
        enabled: true,
      },
      {
        name: "people",
        description: "People in the shot",
        example: "John",
        enabled: true,
      },
      {
        name: "action",
        description: "Action in the shot",
        example: "John pushes through the revolving door",
        enabled: true,
      },
      {
        name: "location",
        description: "Shot location",
        example: "Office building entrance",
        enabled: true,
      },
    ],
  },
  {
    id: "visual-prompt",
    name: "Visual Prompt Generation",
    description: "Template used to generate visual prompts for AI image generation",
    category: "visualPrompt",
    template: `Generate three prompts (concise, normal, and detailed) based on the following information:

Subjects: {{subject_info}}
Shot Description: {{shot_description}}
Director's Notes: {{directors_notes}}
Highlighted Script: {{highlighted_text}}
Full Script: {{full_script}}
End Parameters: {{end_parameters}}
Style: {{style}}
Style Prefix: {{style_prefix}}
Director's Style: {{director_style}}
Camera Shot: {{camera_shot}}
Camera Move: {{camera_move}}
Camera Size: {{camera_size}}
Framing: {{camera_framing}}
Depth of Field: {{camera_depth_of_field}}
Camera Type: {{camera_type}}
Camera Name: {{camera_name}}

Important:
1. Integrate Camera Work Seamlessly: Incorporate the camera work description seamlessly into the scene description.
2. Positive Descriptions: Describe the scene positively. Avoid phrases like "no additional props" or "no objects present." Focus on what is in the scene.
3. Include Provided Camera Information Only: Only include camera information if it's provided in the input.
4. Exclude Style Information from Prompts: Never include style information or stylistic adjectives (like 'vibrant', 'moody') in the image prompt unless specified in the Director's Notes, Director's Style, or character description. Style is handled in the Style and Style Prefix only.
5. Generate Three Separate Paragraphs: Generate three separate paragraphs without headings:
   Concise: About 20 words. Do not include the camera name in this prompt.
   Normal: About 50 words.
   Detailed: About 100 words.
   Separate each paragraph with a space.
6. Enhance Depth and Setting Details:
   - Main Subject Placement: Carefully consider the placement of the main subject within the scene to create a sense of depth and focus.
   - Foreground, Middle Ground, Background: Include elements in the foreground, middle ground, and background to enhance dimensionality. Use these layers to guide the viewer's eye and add complexity to the scene.
   - Incorporate Specified Elements: If specific foreground or background elements are provided, integrate them thoughtfully to frame the subject or add depth.
   - Generate Additional Details: When specific setting details are not provided, creatively generate appropriate and relevant elements that align with the overall scene and context. These could include environmental features, objects, or textures that enhance the setting.
   - Consistency and Relevance: Ensure that all added elements are consistent with the setting, time period, and context. Avoid introducing inconsistencies or elements that might distract from the main subject.
   - Cohesive Composition: Balance all elements to create a cohesive and visually engaging composition. Consider how each component interacts with others to contribute to the overall scene.
7. Adapt Subject Descriptions Based on Framing:
   Close-ups:
   - People: Focus on facial features, expressions, and upper body details visible in the frame.
   - Animals: Highlight distinguishing features, textures, and expressions that are prominent in a close-up.
   - Objects/Things: Emphasize key details, textures, and defining characteristics of the item.
   - Places: Zoom in on specific elements or features of the location that are important or visually striking.
   Medium Shots:
   - People: Describe visible clothing, posture, and general body language.
   - Animals: Include the animal's posture, movement, and notable physical traits.
   - Objects/Things: Provide an overview of the object's size, shape, and how it interacts with its immediate surroundings.
   - Places: Capture a portion of the location, showing context and how elements within the space relate to each other.
   Wide or Establishing Shots:
   - People and Animals: Mention their placement within the larger scene, focusing on actions or interactions visible from a distance.
   - Objects/Things: Describe the object's position in relation to the environment, emphasizing its role or significance within the setting.
   - Places: Provide a broad view of the location, highlighting major landmarks, landscapes, or spatial relationships that define the setting.
8. Ensure Consistency Across Prompts: Prioritize the most important visual elements for each shot type to maintain consistency across the three prompt lengths.
9. Balance Elements in Each Prompt: For each prompt length, maintain a balance between character details, setting description, and action appropriate to the shot type and framing.
10. Include Relevant Subject Details: Incorporate descriptions of active subjects provided in the 'Subjects' field into the prompts, but only include details visible in the current shot type.
11. Script Adherence: {{script_adherence}}
12. Avoid Unnecessary Phrases: Do not include meta-commentary or evaluative statements about the composition, such as "The overall composition captures...". Focus on directly describing the scene.
13. Position of Camera Name: Place the camera name at the end of the normal and detailed prompts ONLY if it is included. It is not a priority item like shot size and should not be included in the concise prompt unless essential. It should be worded "Shot on a {{camera_name}}"
14. Describing Multiple Subjects:
   - Clearly identify each subject in the scene.
   - For close-ups and medium shots, focus on the interaction between subjects, their expressions, and body language.
   - For wide shots, emphasize the placement and actions of subjects within the environment.
   - Ensure that descriptions of multiple subjects are balanced and that the main subject remains the focal point.
15. Align with Director's Vision:
   - Incorporate any thematic elements, motifs, or specific visual styles mentioned in the Director's Notes or Director's Style.
   - Reflect the intended mood and atmosphere as per the director's guidance while maintaining factual descriptions.
   - Use any specified terminology or language style preferred by the director.
16. Camera and Lens Information: Only include camera name if explicitly provided in the input. Do not use placeholders.
17. Time of Day and Lighting:
   - If the time of day is specified, include relevant details about lighting, shadows, and atmosphere.
   - Describe how the lighting conditions affect the appearance of subjects and the setting (e.g., soft morning light, harsh midday sun, warm sunset hues).
   - Incorporate any specific lighting setups or effects if provided in the input.
18. Convey Emotion and Atmosphere:
   - When specified, integrate emotional tones or atmospheres into the scene description (e.g., tense, joyful, mysterious).
   - Use factual descriptions to convey emotions through actions, expressions, and environmental details without relying on stylistic adjectives unless specified.
   - Ensure that the emotional context aligns with the overall scene and director's vision.
19. Handling Ambiguity and Missing Information:
   - If specific details are missing, make logical and contextually appropriate assumptions to enrich the scene.
   - Ensure that any assumptions made do not conflict with provided information.
   - Avoid introducing elements that could alter the intended meaning or focus of the scene.

Prompt Structure:
Implement a modular structure that prioritizes key elements in this order:
[Camera Movement only if provided; if provided, must start prompt with it] [Shot Size] of [Subject(s)][Subject Description relevant to shot size] [Action/Pose] in [Setting: interior or exterior].

[Camera Settings: Name, etc.]

[Additional Details: Foreground elements to reinforce the setting, background elements to further set the setting, time of day to dictate the lighting, depth of field effects, etc.]

Guidelines:
- Start with the subject: Begin your prompt by clearly stating the main subject or focus of the image.
- Use descriptive language: Provide detailed descriptions of the subject and environment.
- Include technical details: Incorporate camera angles, lighting conditions, or other technical aspects to further guide the image generation.
- Add modifiers: Include adjectives and descriptive phrases to refine the image's appearance, mood, and style. Do not add style elements that is handled in the Style and Style Prefix only. The key is to provide clear, descriptive information about what you want to see in the image.`,
    variables: [
      {
        name: "subject_info",
        description: "Information about the subjects in the scene",
        example: "John: Main character, mid-30s, business attire",
        enabled: true,
      },
      {
        name: "shot_description",
        description: "Description of the shot",
        example: "John enters the office building through revolving doors",
        enabled: true,
      },
      {
        name: "directors_notes",
        description: "Notes from the director about the shot",
        example: "Focus on John's determined expression as he enters",
        enabled: true,
      },
      {
        name: "highlighted_text",
        description: "Highlighted portion of the script",
        example: "JOHN pushes through the revolving door with purpose",
        enabled: true,
      },
      {
        name: "full_script",
        description: "The full script text",
        example: "EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...",
        enabled: true,
      },
      {
        name: "end_parameters",
        description: "Additional parameters for the shot",
        example: "Focus on the contrast between the busy street and quiet lobby",
        enabled: true,
      },
      {
        name: "style",
        description: "Visual style for the image",
        example: "Cinematic",
        enabled: true,
      },
      {
        name: "style_prefix",
        description: "Prefix for the style",
        example: "cinematic still, movie scene,",
        enabled: true,
      },
      {
        name: "director_style",
        description: "Director's style reference",
        example: "Christopher Nolan: High contrast, IMAX-scale visuals",
        enabled: true,
      },
      {
        name: "camera_shot",
        description: "Camera shot type",
        example: "Static",
        enabled: true,
      },
      {
        name: "camera_move",
        description: "Camera movement",
        example: "Tracking",
        enabled: true,
      },
      {
        name: "camera_size",
        description: "Camera shot size",
        example: "Medium Shot (MS)",
        enabled: true,
      },
      {
        name: "camera_framing",
        description: "Camera framing",
        example: "Rule of Thirds",
        enabled: true,
      },
      {
        name: "camera_depth_of_field",
        description: "Depth of field",
        example: "Shallow",
        enabled: true,
      },
      {
        name: "camera_type",
        description: "Camera type",
        example: "Digital",
        enabled: true,
      },
      {
        name: "camera_name",
        description: "Camera name",
        example: "ARRI Alexa",
        enabled: true,
      },
      {
        name: "script_adherence",
        description: "Instructions for script adherence",
        example: "Strictly adhere to the script details",
        enabled: true,
      },
    ],
  },
  {
    id: "video-treatment",
    name: "Video Treatment Generation",
    description: "Template used to generate a video treatment for a music video",
    category: "videoTreatment",
    template: `Generate a detailed music video treatment for the following song:

ARTIST: {{artistName}}
SONG TITLE: {{songTitle}}
GENRE: {{genre}}

LYRICS:
{{lyrics}}

CREATIVE CONCEPT:
{{concept}}

VISUAL DESCRIPTORS:
{{visualDescriptors}}

NUMBER OF WARDROBES: {{wardrobeCount}}
WARDROBE DETAILS:
{{wardrobeDetails}}

The treatment should include:
- Core concept
- Visual approach for each section (intro, verses, chorus, bridge, outro)
- Key visual motifs
- Lyric cues for specific visuals
- Transitions between sections`,
    variables: [
      {
        name: "artistName",
        description: "Artist name",
        example: "Taylor Swift",
        enabled: true,
      },
      {
        name: "songTitle",
        description: "Song title",
        example: "Blank Space",
        enabled: true,
      },
      {
        name: "genre",
        description: "Music genre",
        example: "Pop",
        enabled: true,
      },
      {
        name: "lyrics",
        description: "Song lyrics",
        example: "Nice to meet you, where you been?\nI could show you incredible things...",
        enabled: true,
      },
      {
        name: "concept",
        description: "Creative concept",
        example: "A surreal journey through a mansion that represents the artist's mind",
        enabled: true,
      },
      {
        name: "visualDescriptors",
        description: "Visual descriptors",
        example: "High contrast, saturated colors, baroque styling",
        enabled: true,
      },
      {
        name: "wardrobeCount",
        description: "Number of wardrobes",
        example: "3",
        enabled: true,
      },
      {
        name: "wardrobeDetails",
        description: "Wardrobe details",
        example: "1. Elegant white dress, 2. Black gothic outfit, 3. Red power suit",
        enabled: true,
      },
    ],
  },
  // Add the new Shot Suggestions template
  {
    id: "shot-suggestions",
    name: "Shot Suggestions Analysis",
    description: "Template used to analyze a script and shot list to suggest additional shots",
    category: "shotSuggestions",
    template: `Analyze this script and existing shot list. Suggest additional shots that might be missing or would enhance the visual storytelling.

SCRIPT:
{{script}}

EXISTING SHOT LIST:
{{existingShots}}

Please suggest additional shots that would improve the visual storytelling. Consider the following types of shots that are often valuable:

1. Establishing shots: Wide shots that establish the location or setting
2. Reaction shots: Close-ups of characters reacting to events or dialogue
3. Insert shots: Close-ups of important objects or details
4. Transitional shots: Shots that help transition between scenes or locations
5. Emotional beats: Shots that emphasize emotional moments in the story
6. Visual motifs: Shots that reinforce themes or motifs in the story

For each suggested shot, provide:
- Scene number
- Shot number (can be a decimal if it fits between existing shots, e.g., 3.5)
- Description of the shot
- Recommended shot size (ECU, CU, MCU, MS, MLS, LS, ELS)
- Reason why this shot would enhance the visual storytelling

Format each suggestion as follows:
Scene [number], Shot [number]: [description]
Shot Size: [size]
Reason: [explanation]

Aim to suggest 3-7 additional shots that would significantly improve the visual storytelling.`,
    variables: [
      {
        name: "script",
        description: "The full script text",
        example: "EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...",
        enabled: true,
      },
      {
        name: "existingShots",
        description: "The existing shot list",
        example: "Scene 1, Shot 1: Establishing shot of city street\nScene 1, Shot 2: John walking down the street",
        enabled: true,
      },
    ],
  },
]

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [...defaultTemplates],

      getTemplate: (id: string) => {
        return get().templates.find((template) => template.id === id)
      },

      updateTemplate: (id: string, updatedTemplate: Partial<PromptTemplate>) => {
        const templates = get().templates
        const index = templates.findIndex((template) => template.id === id)

        if (index !== -1) {
          const newTemplates = [...templates]
          newTemplates[index] = { ...newTemplates[index], ...updatedTemplate }
          set({ templates: newTemplates })
        }
      },

      updateTemplateVariable: (templateId: string, variableName: string, enabled: boolean) => {
        const templates = get().templates
        const templateIndex = templates.findIndex((template) => template.id === templateId)

        if (templateIndex !== -1) {
          const template = templates[templateIndex]
          const variableIndex = template.variables.findIndex((v) => v.name === variableName)

          if (variableIndex !== -1) {
            const newTemplates = [...templates]
            newTemplates[templateIndex].variables[variableIndex].enabled = enabled
            set({ templates: newTemplates })
          }
        }
      },

      resetToDefaults: () => {
        set({ templates: [...defaultTemplates] })
      },
    }),
    {
      name: "scriptvision-templates",
    },
  ),
)
