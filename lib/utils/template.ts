import { PromptTemplate } from '@/lib/stores/template-store';

// Default templates
export const defaultTemplates: PromptTemplate[] = [
  {
    id: 'shot-list-generation',
    name: 'Shot List Generation',
    description: 'Template used to generate a shot list from a script',
    category: 'shotList',
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
        name: 'script',
        description: 'The full script text',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },
  {
    id: 'subject-extraction',
    name: 'Subject Extraction',
    description: 'Template used to extract subjects from a script',
    category: 'subjects',
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
        name: 'script',
        description: 'The full script text',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },
  {
    id: 'directors-notes',
    name: "Director's Notes Generation",
    description: "Template used to generate director's notes for a shot",
    category: 'directorsNotes',
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
        name: 'directorStyle',
        description: 'Optional director style reference',
        example: 'in the style of Christopher Nolan',
        enabled: true,
      },
      {
        name: 'scene',
        description: 'Scene number',
        example: '1',
        enabled: true,
      },
      {
        name: 'shot',
        description: 'Shot number',
        example: '3',
        enabled: true,
      },
      {
        name: 'description',
        description: 'Shot description',
        example: 'John enters the building',
        enabled: true,
      },
      {
        name: 'shotSize',
        description: 'Shot size',
        example: 'MS',
        enabled: true,
      },
      {
        name: 'people',
        description: 'People in the shot',
        example: 'John',
        enabled: true,
      },
      {
        name: 'action',
        description: 'Action in the shot',
        example: 'John pushes through the revolving door',
        enabled: true,
      },
      {
        name: 'location',
        description: 'Shot location',
        example: 'Office building entrance',
        enabled: true,
      },
    ],
  },
  {
    id: 'visual-prompt',
    name: 'Visual Prompt Generation',
    description:
      'Template used to generate visual prompts for AI image generation',
    category: 'visualPrompt',
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
        name: 'subject_info',
        description: 'Information about the subjects in the scene',
        example: 'John: Main character, mid-30s, business attire',
        enabled: true,
      },
      {
        name: 'shot_description',
        description: 'Description of the shot',
        example: 'John enters the office building through revolving doors',
        enabled: true,
      },
      {
        name: 'directors_notes',
        description: 'Notes from the director about the shot',
        example: "Focus on John's determined expression as he enters",
        enabled: true,
      },
      {
        name: 'highlighted_text',
        description: 'Highlighted portion of the script',
        example: 'JOHN pushes through the revolving door with purpose',
        enabled: true,
      },
      {
        name: 'full_script',
        description: 'The full script text',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
      {
        name: 'end_parameters',
        description: 'Additional parameters for the shot',
        example:
          'Focus on the contrast between the busy street and quiet lobby',
        enabled: true,
      },
      {
        name: 'style',
        description: 'Visual style for the image',
        example: 'Cinematic',
        enabled: true,
      },
      {
        name: 'style_prefix',
        description: 'Prefix for the style',
        example: 'cinematic still, movie scene,',
        enabled: true,
      },
      {
        name: 'director_style',
        description: "Director's style reference",
        example: 'Christopher Nolan: High contrast, IMAX-scale visuals',
        enabled: true,
      },
      {
        name: 'camera_shot',
        description: 'Camera shot type',
        example: 'Static',
        enabled: true,
      },
      {
        name: 'camera_move',
        description: 'Camera movement',
        example: 'Tracking',
        enabled: true,
      },
      {
        name: 'camera_size',
        description: 'Camera shot size',
        example: 'Medium Shot (MS)',
        enabled: true,
      },
      {
        name: 'camera_framing',
        description: 'Camera framing',
        example: 'Rule of Thirds',
        enabled: true,
      },
      {
        name: 'camera_depth_of_field',
        description: 'Depth of field',
        example: 'Shallow',
        enabled: true,
      },
      {
        name: 'camera_type',
        description: 'Camera type',
        example: 'Digital',
        enabled: true,
      },
      {
        name: 'camera_name',
        description: 'Camera name',
        example: 'ARRI Alexa',
        enabled: true,
      },
      {
        name: 'script_adherence',
        description: 'Instructions for script adherence',
        example: 'Strictly adhere to the script details',
        enabled: true,
      },
    ],
  },
  {
    id: 'video-treatment',
    name: 'Video Treatment Generation',
    description:
      'Template used to generate a video treatment for a music video',
    category: 'videoTreatment',
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
        name: 'artistName',
        description: 'Artist name',
        example: 'Taylor Swift',
        enabled: true,
      },
      {
        name: 'songTitle',
        description: 'Song title',
        example: 'Blank Space',
        enabled: true,
      },
      {
        name: 'genre',
        description: 'Music genre',
        example: 'Pop',
        enabled: true,
      },
      {
        name: 'lyrics',
        description: 'Song lyrics',
        example:
          'Nice to meet you, where you been?\nI could show you incredible things...',
        enabled: true,
      },
      {
        name: 'concept',
        description: 'Creative concept',
        example:
          "A surreal journey through a mansion that represents the artist's mind",
        enabled: true,
      },
      {
        name: 'visualDescriptors',
        description: 'Visual descriptors',
        example: 'High contrast, saturated colors, baroque styling',
        enabled: true,
      },
      {
        name: 'wardrobeCount',
        description: 'Number of wardrobes',
        example: '3',
        enabled: true,
      },
      {
        name: 'wardrobeDetails',
        description: 'Wardrobe details',
        example:
          '1. Elegant white dress, 2. Black gothic outfit, 3. Red power suit',
        enabled: true,
      },
    ],
  },
  // Add the new Shot Suggestions template
  {
    id: 'shot-suggestions',
    name: 'Shot Suggestions Analysis',
    description:
      'Template used to analyze a script and shot list to suggest additional shots',
    category: 'shotSuggestions',
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
        name: 'script',
        description: 'The full script text',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
      {
        name: 'existingShots',
        description: 'The existing shot list',
        example:
          'Scene 1, Shot 1: Establishing shot of city street\nScene 1, Shot 2: John walking down the street',
        enabled: true,
      },
    ],
  },
  // Story Theme Template
  {
    id: 'story-theme-generation',
    name: 'Story Theme Generation',
    description: 'Template used to generate story themes and concepts',
    category: 'videoTreatment',
    template: `Generate compelling story themes and concepts based on the following inputs:

WORKING TITLE: {{workingTitle}}
GENRE: {{genre}}
TARGET AUDIENCE: {{targetAudience}}
CORE CONCEPT: {{coreConcept}}
TONE: {{tone}}
SETTING: {{setting}}
TIMEFRAME: {{timeframe}}

Please provide:
1. A refined story concept with a clear thematic focus
2. Three potential thematic statements that could guide the story
3. Key emotional beats that should be hit throughout the narrative
4. Visual motifs that could reinforce the themes
5. Character archetypes that would best serve this theme
6. Potential conflicts that naturally arise from the theme

Ensure the themes are:
- Universally relatable yet specific enough to be compelling
- Suitable for the specified genre and audience
- Rich with potential for visual storytelling
- Conducive to character growth and transformation`,
    variables: [
      {
        name: 'workingTitle',
        description: 'Working title of the story',
        example: 'The Last Light',
        enabled: true,
      },
      {
        name: 'genre',
        description: 'Genre of the story',
        example: 'Science Fiction',
        enabled: true,
      },
      {
        name: 'targetAudience',
        description: 'Target audience',
        example: 'Young Adults (18-25)',
        enabled: true,
      },
      {
        name: 'coreConcept',
        description: 'Core concept of the story',
        example: 'A world where memories can be transferred between people',
        enabled: true,
      },
      {
        name: 'tone',
        description: 'Tone of the story',
        example: 'Contemplative with moments of tension',
        enabled: true,
      },
      {
        name: 'setting',
        description: 'Setting of the story',
        example: 'Near-future urban metropolis',
        enabled: true,
      },
      {
        name: 'timeframe',
        description: 'Timeframe of the story',
        example: 'Over the course of one week',
        enabled: true,
      },
    ],
  },

  // Outline Generation Template
  {
    id: 'outline-generation',
    name: 'Story Outline Generation',
    description: 'Template used to generate a structured story outline',
    category: 'videoTreatment',
    template: `Create a detailed story outline based on the following information:

TITLE: {{title}}
GENRE: {{genre}}
THEME: {{theme}}
PROTAGONIST: {{protagonist}}
ANTAGONIST: {{antagonist}}
SETTING: {{setting}}
TIMEFRAME: {{timeframe}}
DESIRED LENGTH: {{desiredLength}}
STRUCTURE TYPE: {{structureType}}

Generate a comprehensive outline that includes:

1. HOOK/OPENING: An engaging opening that establishes the world and introduces the protagonist
2. INCITING INCIDENT: The event that disrupts the status quo and sets the story in motion
3. FIRST ACT TURNING POINT: The moment that fully commits the protagonist to their journey
4. MIDPOINT: A significant event that raises the stakes and shifts the direction of the story
5. SECOND ACT TURNING POINT: A major setback or revelation that forces the protagonist to change approach
6. CLIMAX: The final confrontation or resolution of the main conflict
7. RESOLUTION: The aftermath and new status quo

For each section, provide:
- Brief description of key events
- Character development moments
- Thematic elements being explored
- Emotional beats
- Potential visual moments that would translate well to screen

Ensure the outline follows the {{structureType}} structure while maintaining narrative coherence and emotional resonance.`,
    variables: [
      {
        name: 'title',
        description: 'Title of the story',
        example: 'The Memory Merchant',
        enabled: true,
      },
      {
        name: 'genre',
        description: 'Genre of the story',
        example: 'Science Fiction Thriller',
        enabled: true,
      },
      {
        name: 'theme',
        description: 'Main theme of the story',
        example: 'The commodification of human experience',
        enabled: true,
      },
      {
        name: 'protagonist',
        description: 'Main character description',
        example: 'Maya Chen, 32, memory technician with a troubled past',
        enabled: true,
      },
      {
        name: 'antagonist',
        description: 'Main opposing force',
        example: 'Elias Vorn, CEO of MemoryCorp with hidden agenda',
        enabled: true,
      },
      {
        name: 'setting',
        description: 'Setting of the story',
        example: 'Neo-Tokyo, 2087, a city divided by technology access',
        enabled: true,
      },
      {
        name: 'timeframe',
        description: 'Timeframe of the story',
        example: 'Three intense days',
        enabled: true,
      },
      {
        name: 'desiredLength',
        description: 'Desired length of the final story',
        example: 'Feature film (90-120 minutes)',
        enabled: true,
      },
      {
        name: 'structureType',
        description: 'Narrative structure to follow',
        example: 'Three-act structure',
        enabled: true,
      },
    ],
  },

  // Chapter Generation Template
  {
    id: 'chapter-generation',
    name: 'Chapter Generation',
    description: 'Template used to generate individual chapters or scenes',
    category: 'videoTreatment',
    template: `Generate a detailed chapter/scene based on the following parameters:

TITLE: {{title}}
CHAPTER POSITION: {{chapterPosition}}
PREVIOUS CHAPTER SUMMARY: {{previousChapterSummary}}
CHARACTERS PRESENT: {{charactersPresent}}
LOCATION: {{location}}
TIME OF DAY: {{timeOfDay}}
WEATHER/ATMOSPHERE: {{atmosphere}}
KEY PLOT POINTS TO COVER: {{plotPoints}}
EMOTIONAL TONE: {{emotionalTone}}
DESIRED LENGTH: {{desiredLength}}

Create a fully realized chapter/scene that includes:

1. SETTING DESCRIPTION: Vivid, sensory details that establish the location and atmosphere
2. CHARACTER INTRODUCTIONS: How characters appear and their initial state of mind
3. DIALOGUE: Natural, character-specific conversations that reveal personality and advance the plot
4. ACTION: Clear description of what happens in the scene
5. INTERNAL THOUGHTS: Character perspectives and reactions where appropriate
6. SENSORY DETAILS: Sights, sounds, smells, textures that make the scene immersive
7. EMOTIONAL BEATS: Key emotional moments and shifts
8. ENDING: How the scene concludes and transitions to the next

Writing style guidelines:
- POV: {{pointOfView}}
- TENSE: {{tense}}
- STYLE: {{writingStyle}}
- PACING: {{pacing}}

Ensure the chapter advances the overall narrative while standing as a compelling scene in its own right.`,
    variables: [
      {
        name: 'title',
        description: 'Title of the chapter/scene',
        example: 'The Forgotten Memory',
        enabled: true,
      },
      {
        name: 'chapterPosition',
        description: 'Position in the overall story',
        example: 'Opening chapter',
        enabled: true,
      },
      {
        name: 'previousChapterSummary',
        description: 'Summary of previous events',
        example: "Maya discovered a corrupted memory file that shouldn't exist",
        enabled: true,
      },
      {
        name: 'charactersPresent',
        description: 'Characters in the scene',
        example: 'Maya Chen, Dr. Elias Vorn, Security Guard #1',
        enabled: true,
      },
      {
        name: 'location',
        description: 'Location of the scene',
        example: "MemoryCorp's underground lab, Level 3",
        enabled: true,
      },
      {
        name: 'timeOfDay',
        description: 'Time of day',
        example: 'Late night, around 2 AM',
        enabled: true,
      },
      {
        name: 'atmosphere',
        description: 'Weather and atmosphere',
        example: 'Sterile, cold, with humming machinery and flickering lights',
        enabled: true,
      },
      {
        name: 'plotPoints',
        description: 'Key plot points to cover',
        example:
          'Maya confronts Elias, discovers the truth about the memory files, narrowly escapes security',
        enabled: true,
      },
      {
        name: 'emotionalTone',
        description: 'Emotional tone of the scene',
        example: 'Tense, paranoid, with underlying dread',
        enabled: true,
      },
      {
        name: 'desiredLength',
        description: 'Desired length',
        example: '1500-2000 words',
        enabled: true,
      },
      {
        name: 'pointOfView',
        description: 'Point of view',
        example: "Third person limited (Maya's perspective)",
        enabled: true,
      },
      {
        name: 'tense',
        description: 'Tense',
        example: 'Present tense',
        enabled: true,
      },
      {
        name: 'writingStyle',
        description: 'Writing style',
        example: 'Terse, noir-inspired prose with technical jargon',
        enabled: true,
      },
      {
        name: 'pacing',
        description: 'Pacing',
        example: 'Quick, urgent pacing with short paragraphs',
        enabled: true,
      },
    ],
  },

  // Chapter Enhancement Template
  {
    id: 'chapter-enhancement',
    name: 'Chapter Enhancement',
    description: 'Template used to enhance and refine existing chapters',
    category: 'videoTreatment',
    template: `Enhance and refine the following chapter/scene based on these parameters:

ORIGINAL CONTENT:
{{originalContent}}

ENHANCEMENT FOCUS:
{{enhancementFocus}}

SPECIFIC ELEMENTS TO IMPROVE:
- Dialogue: {{improveDialogue}}
- Description: {{improveDescription}}
- Character Development: {{improveCharacterDevelopment}}
- Pacing: {{improvePacing}}
- Emotional Impact: {{improveEmotionalImpact}}
- Sensory Details: {{improveSensoryDetails}}
- Thematic Elements: {{improveThematicElements}}

STYLE GUIDANCE:
- Tone Adjustment: {{toneAdjustment}}
- Voice Consistency: {{voiceConsistency}}
- Genre Conventions: {{genreConventions}}

TECHNICAL REQUIREMENTS:
- Word Count: {{wordCountTarget}}
- Reading Level: {{readingLevel}}

Please enhance the provided content while maintaining its core narrative and character integrity. Focus particularly on the specified improvement areas while ensuring the overall piece remains cohesive and aligned with the story's vision.

For each enhancement area marked "Yes," provide significant improvements. For those marked "No" or left blank, maintain the original approach.`,
    variables: [
      {
        name: 'originalContent',
        description: 'The original chapter/scene content',
        example: '[Paste the original chapter text here]',
        enabled: true,
      },
      {
        name: 'enhancementFocus',
        description: 'Primary focus of enhancement',
        example: 'Deepen emotional resonance and character development',
        enabled: true,
      },
      {
        name: 'improveDialogue',
        description: 'Dialogue improvement needs',
        example:
          'Yes - Make dialogue more distinct between characters and reveal more subtext',
        enabled: true,
      },
      {
        name: 'improveDescription',
        description: 'Description improvement needs',
        example:
          'Yes - Add more vivid environmental details that reflect the mood',
        enabled: true,
      },
      {
        name: 'improveCharacterDevelopment',
        description: 'Character development improvement needs',
        example: "Yes - Show more of Maya's internal conflict about her past",
        enabled: true,
      },
      {
        name: 'improvePacing',
        description: 'Pacing improvement needs',
        example: 'Yes - Slow down the middle section to build more tension',
        enabled: true,
      },
      {
        name: 'improveEmotionalImpact',
        description: 'Emotional impact improvement needs',
        example: 'Yes - Make the revelation scene more powerful',
        enabled: true,
      },
      {
        name: 'improveSensoryDetails',
        description: 'Sensory details improvement needs',
        example: 'Yes - Add more tactile and auditory elements',
        enabled: true,
      },
      {
        name: 'improveThematicElements',
        description: 'Thematic elements improvement needs',
        example: 'Yes - Strengthen the theme of memory as identity',
        enabled: true,
      },
      {
        name: 'toneAdjustment',
        description: 'Tone adjustment needs',
        example: 'Slightly darker with moments of unexpected beauty',
        enabled: true,
      },
      {
        name: 'voiceConsistency',
        description: 'Voice consistency needs',
        example:
          'Maintain the technical, precise narration established earlier',
        enabled: true,
      },
      {
        name: 'genreConventions',
        description: 'Genre conventions to emphasize',
        example:
          'Lean more into noir elements while maintaining sci-fi foundation',
        enabled: true,
      },
      {
        name: 'wordCountTarget',
        description: 'Target word count',
        example: 'Expand to approximately 2500 words',
        enabled: true,
      },
      {
        name: 'readingLevel',
        description: 'Target reading level',
        example: 'Adult - college level vocabulary acceptable',
        enabled: true,
      },
    ],
  },

  // Character Development Template
  {
    id: 'character-development',
    name: 'Character Development',
    description: 'Template used to develop detailed character profiles',
    category: 'videoTreatment',
    template: `Create a comprehensive character profile based on the following parameters:

CHARACTER NAME: {{characterName}}
ROLE IN STORY: {{characterRole}}
AGE: {{characterAge}}
GENDER: {{characterGender}}
OCCUPATION: {{characterOccupation}}
PHYSICAL DESCRIPTION: {{physicalDescription}}
STORY WORLD CONTEXT: {{storyWorldContext}}

Generate a detailed character profile that includes:

1. BACKGROUND & HISTORY:
   - Formative experiences
   - Family dynamics
   - Educational/professional background
   - Key life events that shaped them

2. PSYCHOLOGY:
   - Personality traits (using the Big Five or other framework)
   - Core values and beliefs
   - Fears and insecurities
   - Desires and motivations
   - Cognitive patterns and biases

3. INTERPERSONAL DYNAMICS:
   - Communication style
   - Relationship patterns
   - How they are perceived by others vs. self-perception
   - Social strengths and weaknesses

4. CHARACTER ARC POTENTIAL:
   - Starting psychological state
   - Internal conflicts
   - Potential growth trajectory
   - Thematic relevance of their journey

5. EXTERNAL TRAITS:
   - Speech patterns and vocabulary
   - Mannerisms and habits
   - Clothing style and presentation
   - Distinctive features or accessories

6. PRACTICAL ELEMENTS:
   - Skills and abilities
   - Resources and limitations
   - Social connections
   - Role in advancing the plot

Ensure the character is:
- Psychologically consistent yet complex
- Suited to their role in the narrative
- Capable of growth and change
- Distinctive and memorable`,
    variables: [
      {
        name: 'characterName',
        description: "Character's full name",
        example: 'Maya Chen',
        enabled: true,
      },
      {
        name: 'characterRole',
        description: "Character's role in the story",
        example: 'Protagonist',
        enabled: true,
      },
      {
        name: 'characterAge',
        description: "Character's age",
        example: '32',
        enabled: true,
      },
      {
        name: 'characterGender',
        description: "Character's gender",
        example: 'Female',
        enabled: true,
      },
      {
        name: 'characterOccupation',
        description: "Character's occupation",
        example: 'Memory technician at MemoryCorp',
        enabled: true,
      },
      {
        name: 'physicalDescription',
        description: 'Physical description',
        example:
          '5\'7", athletic build, short black hair with blue highlights, distinctive neural implant scar behind right ear',
        enabled: true,
      },
      {
        name: 'storyWorldContext',
        description: 'Context within the story world',
        example:
          "In 2087 Neo-Tokyo, memory technicians are elite specialists who can extract, modify, and implant memories. They're bound by strict ethical codes and government regulations.",
        enabled: true,
      },
    ],
  },

  // Setting Development Template
  {
    id: 'setting-development',
    name: 'Setting Development',
    description: 'Template used to develop detailed story settings',
    category: 'videoTreatment',
    template: `Create a comprehensive setting profile based on the following parameters:

SETTING NAME: {{settingName}}
SETTING TYPE: {{settingType}}
TIME PERIOD: {{timePeriod}}
GENRE: {{genre}}
SCALE: {{scale}}
STORY RELEVANCE: {{storyRelevance}}

Generate a detailed setting profile that includes:

1. PHYSICAL CHARACTERISTICS:
   - Geography and topography
   - Climate and weather patterns
   - Notable landmarks and locations
   - Architecture and infrastructure
   - Natural resources and environmental factors

2. SOCIOCULTURAL ELEMENTS:
   - Dominant culture(s) and subcultures
   - Social hierarchies and power structures
   - Economic systems and class divisions
   - Religious/spiritual beliefs and practices
   - Arts, entertainment, and cultural expressions

3. HISTORICAL CONTEXT:
   - Origin and development
   - Major historical events
   - Evolution over time
   - Collective memory and historical narratives

4. POLITICAL LANDSCAPE:
   - Governance structures
   - Laws and enforcement
   - Political factions and tensions
   - International/external relations (if applicable)

5. TECHNOLOGICAL FRAMEWORK:
   - Level of technological development
   - Distribution and access to technology
   - Impact of technology on daily life
   - Unique technological elements

6. SENSORY LANDSCAPE:
   - Sights (colors, lighting, visual textures)
   - Sounds (ambient noise, music, silence)
   - Smells and tastes
   - Tactile elements and physical sensations

7. THEMATIC ELEMENTS:
   - How the setting embodies or reflects key themes
   - Symbolic aspects of the environment
   - Mood and atmosphere
   - Constraints and opportunities the setting creates for characters

Ensure the setting is:
- Internally consistent yet complex
- Rich with storytelling possibilities
- Distinctive and memorable
- Appropriate for the genre and narrative needs`,
    variables: [
      {
        name: 'settingName',
        description: 'Name of the setting',
        example: 'Neo-Tokyo',
        enabled: true,
      },
      {
        name: 'settingType',
        description: 'Type of setting',
        example: 'Futuristic metropolis',
        enabled: true,
      },
      {
        name: 'timePeriod',
        description: 'Time period',
        example: '2087, sixty years after the Great Data Collapse',
        enabled: true,
      },
      {
        name: 'genre',
        description: 'Genre of the story',
        example: 'Science fiction with noir elements',
        enabled: true,
      },
      {
        name: 'scale',
        description: 'Scale of the setting',
        example: 'Massive urban sprawl with 40 million inhabitants',
        enabled: true,
      },
      {
        name: 'storyRelevance',
        description: 'Relevance to the story',
        example:
          'Primary setting where memory technology was pioneered and is now central to the economy and social structure',
        enabled: true,
      },
    ],
  },

  // Dialogue Enhancement Template
  {
    id: 'dialogue-enhancement',
    name: 'Dialogue Enhancement',
    description: 'Template used to enhance and refine dialogue',
    category: 'videoTreatment',
    template: `Enhance and refine the following dialogue based on these parameters:

ORIGINAL DIALOGUE:
{{originalDialogue}}

CHARACTERS INVOLVED:
{{charactersInvolved}}

SCENE CONTEXT:
{{sceneContext}}

DIALOGUE GOALS:
{{dialogueGoals}}

ENHANCEMENT FOCUS:
- Character Voice Distinction: {{enhanceCharacterVoices}}
- Subtext/Layering: {{enhanceSubtext}}
- Conflict/Tension: {{enhanceConflict}}
- Exposition Management: {{improveExposition}}
- Pacing/Rhythm: {{improvePacing}}
- Authenticity: {{improveAuthenticity}}
- Emotional Impact: {{enhanceEmotionalImpact}}

STYLE GUIDANCE:
- Dialogue Style: {{dialogueStyle}}
- Cultural/Period Accuracy: {{culturalAccuracy}}
- Technical Jargon Level: {{jargonLevel}}

Please enhance the provided dialogue while maintaining its core purpose and character integrity. Focus particularly on the specified improvement areas while ensuring the conversation flows naturally and serves the narrative.

For each enhancement area marked "Yes," provide significant improvements. For those marked "No" or left blank, maintain the original approach.`,
    variables: [
      {
        name: 'originalDialogue',
        description: 'The original dialogue content',
        example: '[Paste the original dialogue here]',
        enabled: true,
      },
      {
        name: 'charactersInvolved',
        description: 'Characters participating in the dialogue',
        example:
          'Maya Chen (protagonist, memory technician), Dr. Elias Vorn (antagonist, CEO)',
        enabled: true,
      },
      {
        name: 'sceneContext',
        description: 'Context of the scene',
        example:
          'Maya has discovered corrupted memory files and is confronting Elias in his office, suspecting him of illegal memory manipulation',
        enabled: true,
      },
      {
        name: 'dialogueGoals',
        description: 'Goals of this dialogue exchange',
        example:
          "Reveal Elias's true motives while maintaining tension; Maya needs information without revealing how much she already knows",
        enabled: true,
      },
      {
        name: 'enhanceCharacterVoices',
        description: 'Character voice distinction needs',
        example:
          'Yes - Make Elias sound more educated and calculating, Maya more direct and technical',
        enabled: true,
      },
      {
        name: 'enhanceSubtext',
        description: 'Subtext enhancement needs',
        example:
          'Yes - Add layers of meaning where characters say one thing but mean another',
        enabled: true,
      },
      {
        name: 'enhanceConflict',
        description: 'Conflict enhancement needs',
        example:
          'Yes - Increase the underlying tension while keeping the conversation outwardly professional',
        enabled: true,
      },
      {
        name: 'improveExposition',
        description: 'Exposition improvement needs',
        example:
          'Yes - Make the technical explanations more natural and less obvious',
        enabled: true,
      },
      {
        name: 'improvePacing',
        description: 'Pacing improvement needs',
        example:
          'Yes - Vary the rhythm with some quick exchanges and some longer statements',
        enabled: true,
      },
      {
        name: 'improveAuthenticity',
        description: 'Authenticity improvement needs',
        example:
          'Yes - Make the dialogue sound more like natural speech with interruptions and imperfections',
        enabled: true,
      },
      {
        name: 'enhanceEmotionalImpact',
        description: 'Emotional impact enhancement needs',
        example:
          'Yes - Make the moment when Maya realizes Elias is lying more powerful',
        enabled: true,
      },
      {
        name: 'dialogueStyle',
        description: 'Dialogue style guidance',
        example:
          'Noir-influenced, terse, with technical jargon appropriate to memory science',
        enabled: true,
      },
      {
        name: 'culturalAccuracy',
        description: 'Cultural/period accuracy needs',
        example:
          'Include references to 2087 Neo-Tokyo culture and corporate language',
        enabled: true,
      },
      {
        name: 'jargonLevel',
        description: 'Technical jargon level',
        example:
          "Moderate - use memory technology terms but ensure they're understandable in context",
        enabled: true,
      },
    ],
  },

  // Script Formatting Template
  {
    id: 'script-formatting',
    name: 'Script Formatting',
    description:
      'Template used to format content into proper screenplay format',
    category: 'videoTreatment',
    template: `Convert the following content into proper screenplay format:

ORIGINAL CONTENT:
{{originalContent}}

FORMAT TYPE: {{formatType}}

FORMATTING GUIDELINES:
- Scene Headings: {{sceneHeadingStyle}}
- Character Names: {{characterNameStyle}}
- Dialogue Format: {{dialogueFormatStyle}}
- Action Description: {{actionDescriptionStyle}}
- Transitions: {{transitionStyle}}
- Special Instructions: {{specialInstructions}}

Please convert the provided content into professional screenplay format following industry standards. Ensure all elements (scene headings, action, character names, dialogue, parentheticals, and transitions) are properly formatted.

The formatted script should be ready for production use, with proper spacing, capitalization, and layout according to the specified format type.`,
    variables: [
      {
        name: 'originalContent',
        description: 'The original content to format',
        example: '[Paste the original content here]',
        enabled: true,
      },
      {
        name: 'formatType',
        description: 'Type of script format',
        example: 'Feature Film Screenplay (US Standard)',
        enabled: true,
      },
      {
        name: 'sceneHeadingStyle',
        description: 'Scene heading style',
        example: 'Standard INT./EXT. LOCATION - TIME format, all caps',
        enabled: true,
      },
      {
        name: 'characterNameStyle',
        description: 'Character name style',
        example: 'ALL CAPS, centered above dialogue',
        enabled: true,
      },
      {
        name: 'dialogueFormatStyle',
        description: 'Dialogue format style',
        example: 'Standard width (33 spaces), centered under character name',
        enabled: true,
      },
      {
        name: 'actionDescriptionStyle',
        description: 'Action description style',
        example: 'Full width, single-spaced, present tense',
        enabled: true,
      },
      {
        name: 'transitionStyle',
        description: 'Transition style',
        example:
          'Standard transitions (CUT TO:, DISSOLVE TO:) right-aligned, all caps',
        enabled: true,
      },
      {
        name: 'specialInstructions',
        description: 'Special formatting instructions',
        example:
          'Include camera directions only when absolutely necessary for story comprehension',
        enabled: true,
      },
    ],
  },

  // Linear Framework - Simple Complexity
  {
    id: 'linear-framework-simple-complexity',
    name: 'Linear Framework - Simple Complexity',
    description: 'Linear Framework - Simple Complexity',
    category: 'outlineGeneration',
    template: `Create a chronological journey outline from the following content: {STORY_OR_TRANSCRIPT}

Organize the narrative into 4 time-based phases following this exact structure:

**I. Origins & Foundation (Early Period)**
- Background, formative experiences, and initial influences
- Key people, places, and events that shaped the foundation
- Early challenges, discoveries, or pivotal moments

**II. Entry & Evolution (Development Period)**  
- First major steps into their field/journey
- Learning experiences, relationships, and skill building
- Initial successes, failures, and adaptations

**III. Breaking Barriers (Achievement Period)**
- Major breakthroughs, innovations, or milestone moments
- Recognition, expansion, and establishing reputation
- Overcoming significant obstacles or limitations

**IV. Elevation & Impact (Current/Legacy Period)**
- Current status, major accomplishments, and influence
- Ongoing projects, future vision, and lasting contributions
- Legacy building and continued evolution

Focus on clear temporal progression. Each section should build naturally from the previous one, showing growth and development over time. Include specific dates, ages, or time markers when available.`,
    variables: [
      {
        name: 'STORY_OR_TRANSCRIPT',
        description: 'The story or transcript to generate an outline for',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },

  // Dynamic Framework - Moderate Complexity
  {
    id: 'dynamic-framework-moderate-complexity',
    name: 'Dynamic Framework - Moderate Complexity',
    description: 'Dynamic Framework - Moderate Complexity',
    category: 'outlineGeneration',
    template: `Create a challenge and response outline from the following content: {STORY_OR_TRANSCRIPT}

Organize the narrative into 4 problem-solution cycles following this exact structure:

**I. [Primary Challenge Title]**
- *Problem:* Core obstacle, barrier, or systemic issue faced
- *Response:* Specific actions, strategies, or approaches taken
- *Impact:* Results achieved and lessons learned

**II. [Secondary Challenge Title]**
- *Problem:* Next major difficulty or resistance encountered  
- *Response:* Adaptive solutions and tactical decisions made
- *Impact:* Outcomes and ripple effects on broader situation

**III. [Tertiary Challenge Title]**
- *Problem:* Complex or multi-faceted challenge requiring innovation
- *Response:* Creative or bold approaches to address the issue
- *Impact:* Transformation achieved and new standards set

**IV. [Ongoing Challenge Title]**
- *Problem:* Current or persistent challenge requiring sustained effort
- *Response:* Long-term strategies and continued commitment
- *Impact:* Ongoing influence and future implications

Each challenge should represent a distinct type of obstacle (personal, professional, systemic, etc.). Show clear cause-and-effect relationships between problems and solutions. Focus on decision-making processes and adaptive strategies.`,
    variables: [
      {
        name: 'STORY_OR_TRANSCRIPT',
        description: 'The story or transcript to generate an outline for',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },

  // Developmental Framework - Moderate Complexity
  {
    id: 'developmental-framework-moderate-complexity',
    name: 'Developmental Framework - Moderate Complexity',
    description: 'Developmental Framework - Moderate Complexity',
    category: 'outlineGeneration',
    template: `Create a character transformation outline from the following content: {STORY_OR_TRANSCRIPT}

  Organize the narrative into 4 developmental stages following this exact structure:

  **I. The [Starting Identity] (Initial State)**
  - Core personality traits, beliefs, and limitations
  - Initial motivations, fears, and worldview
  - Early behaviors and relationship patterns

  **II. The [Learning Phase Identity] (Growth State)**
  - New experiences that challenged initial assumptions
  - Mentors, influences, and learning opportunities
  - First attempts at change and skill development

  **III. The [Breakthrough Identity] (Transformation State)**
  - Key moments of insight, courage, or breakthrough
  - Major shifts in capability, confidence, or perspective
  - Innovation, leadership, or creative contributions

  **IV. The [Current Identity] (Evolved State)**
  - Present-day character traits and capabilities
  - Leadership style, influence, and impact on others
  - Vision for continued growth and future development

  Focus on internal growth and psychological development. Show how external events shaped internal change. Highlight pivotal moments where the person's fundamental approach or identity shifted. Each stage should demonstrate clear character evolution.`,
    variables: [
      {
        name: 'STORY_OR_TRANSCRIPT',
        description: 'The story or transcript to generate an outline for',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },

  // Thematic Framework - Complex Complexity
  {
    id: 'thematic-framework-complex-complexity',
    name: 'Thematic Framework - Complex Complexity',
    description: 'Thematic Framework - Complex Complexity',
    category: 'outlineGeneration',
    template: `Create a thematic pillars outline from the following content: {STORY_OR_TRANSCRIPT}

Organize the narrative around 4 core values/principles following this exact structure:

**I. [Core Value #1]: "[Value Statement]"**
- How this principle manifests in their work/life
- Specific examples and consistent behaviors
- Challenges faced in upholding this value
- Impact on their success and relationships

**II. [Core Value #2]: "[Value Statement]"**
- Evidence of this principle across different contexts
- Decisions made based on this value
- Conflicts or trade-offs involving this principle
- How it differentiates them from others

**III. [Core Value #3]: "[Value Statement]"**
- Ways this value drives their innovations or approaches
- Sacrifices made or risks taken for this principle
- How they inspire others through this value
- Long-term commitment and consistency

**IV. [Core Value #4]: "[Value Statement]"**
- Integration of this value with their broader mission
- Evolution of how they express this principle
- Future vision based on this value
- Legacy they want to build around this principle

Focus on the underlying values that drive all decisions and actions. Show how these principles create consistency across different situations. Each pillar should be a fundamental belief that explains their choices and behaviors.`,
    variables: [
      {
        name: 'STORY_OR_TRANSCRIPT',
        description: 'The story or transcript to generate an outline for',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },

  // Dynamic Framework - Complex Complexity
  {
    id: 'dynamic-framework-complex-complexity',
    name: 'Dynamic Framework - Complex Complexity',
    description: 'Dynamic Framework - Complex Complexity',
    category: 'outlineGeneration',
    template: `Create a conflict and resolution outline from the following content: {STORY_OR_TRANSCRIPT}

Organize the narrative into 4 tension-resolution cycles following this exact structure:

**I. Internal Conflicts**
- Self-doubt, identity struggles, or personal limitations
- Values conflicts and difficult choices
- Fear, ambition, or perfectionism tensions
- Personal growth resolutions and breakthroughs

**II. External Conflicts**
- Industry resistance, gatekeepers, or systemic barriers
- Competition, criticism, or professional challenges
- Resource limitations or opportunity constraints
- Strategic victories and relationship building

**III. Pivotal Moments**
- Crisis points requiring major decisions
- Make-or-break situations and their outcomes
- Unexpected opportunities or setbacks
- Transformation achieved through adversity

**IV. Resolution & Ongoing Impact**
- Current status and conflicts resolved
- Ongoing tensions and how they're managed
- Influence on industry or community standards
- Future challenges and preparedness strategies

Focus on dramatic tension and high-stakes moments. Show how conflicts create pressure that leads to growth or change. Each section should build dramatic intensity. Highlight moments where the stakes were highest and how those conflicts were ultimately resolved or transformed.`,
    variables: [
      {
        name: 'STORY_OR_TRANSCRIPT',
        description: 'The story or transcript to generate an outline for',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },
  // auto outline generation framework
  {
    id: 'auto-outline-generation',
    name: 'Auto Outline Generation',
    description: 'Auto Outline Generation',
    category: 'outlineGeneration',
    template: `You are an expert story structure analyst. Your task is to analyze the provided content, determine the optimal outline framework(s), and automatically generate the best possible outline.

CONTENT TO ANALYZE: {STORY_OR_TRANSCRIPT}

## ANALYSIS PHASE

First, evaluate the content against these criteria:

**Content Type Indicators:**
- Biography/Life Story: Personal journey with clear timeline
- Business/Career Focus: Professional achievements and challenges
- Innovation/Creative: New ideas, artistic expression, or breakthrough moments
- Advocacy/Social Impact: Fighting for causes or systemic change
- Overcoming Adversity: Struggles, failures, and comebacks
- Leadership/Influence: Building movements or inspiring others

**Narrative Strength Indicators:**
- Clear Timeline: Strong chronological progression
- Value-Driven: Consistent principles guide all decisions
- Problem-Solving: Series of challenges overcome
- Transformation: Dramatic personal/professional evolution
- Conflict-Heavy: High tensions, opposition, dramatic moments
- Multi-Dimensional: Complex story requiring multiple perspectives

**Audience & Purpose:**
- Inspirational: Motivate others through example
- Educational: Teach lessons or provide guidance
- Entertainment: Engage with compelling narrative
- Professional: Business/career development context
- Academic: Analytical or research purposes
- Marketing: Brand building or promotional content

## FRAMEWORK SELECTION LOGIC

Based on your analysis, automatically select from these options:

### SINGLE FRAMEWORKS

**1. Chronological Journey** - Use when:
- Clear life progression with distinct phases
- Timeline is the strongest organizing principle
- Audience wants to understand "how they got here"
- Simple, accessible narrative needed

**2. Challenge & Response** - Use when:
- Story centers on problem-solving
- Multiple distinct obstacles overcome
- Audience wants strategic insights
- Focus on resilience and adaptation

**3. Character Arc Transformation** - Use when:
- Dramatic personal evolution is central
- Internal growth drives external success
- Audience interested in psychological development
- Inspirational/motivational purpose

**4. Thematic Pillars** - Use when:
- Strong value system drives all actions
- Consistent principles across different contexts
- Audience wants to understand core beliefs
- Brand building or leadership development focus

**5. Conflict & Resolution** - Use when:
- High-drama narrative with clear tensions
- Stakes and opposition are prominent
- Entertainment value is important
- Audience enjoys compelling, dramatic stories

### HYBRID FRAMEWORKS

**6. Chronological + Challenge & Response** - Use when:
- Strong timeline with distinct problem-solving phases
- Each time period had signature challenges
- Audience wants both progression and strategy insights

**7. Character Arc + Thematic Pillars** - Use when:
- Personal transformation driven by core values
- Values evolved or deepened over time
- Audience interested in both growth and principles

**8. Conflict & Resolution + Character Arc** - Use when:
- External conflicts drove internal transformation
- Dramatic tension shaped personality development
- Audience wants both drama and inspiration

**9. Challenge & Response + Thematic Pillars** - Use when:
- Problems were solved through consistent value application
- Values were tested and proven through challenges
- Audience wants both strategy and principle insights

**10. Chronological + Thematic Pillars** - Use when:
- Values manifested differently in each life phase
- Timeline shows evolution of principle application
- Audience wants both progression and core belief understanding

## OUTPUT INSTRUCTIONS

1. **Framework Selection** (1-2 sentences explaining your choice)
2. **Complete Outline** using the selected framework's exact structure
3. **Alternative Framework Note** (brief mention of second-best option)

---

## FRAMEWORK TEMPLATES IN MEMORY

### Template 1: Chronological Journey
**I. Origins & Foundation (Early Period)**
**II. Entry & Evolution (Development Period)**
**III. Breaking Barriers (Achievement Period)**
**IV. Elevation & Impact (Current/Legacy Period)**

### Template 2: Challenge & Response
**I. [Primary Challenge Title]**
- Problem/Response/Impact
**II. [Secondary Challenge Title]**
- Problem/Response/Impact
**III. [Tertiary Challenge Title]**
- Problem/Response/Impact
**IV. [Ongoing Challenge Title]**
- Problem/Response/Impact

### Template 3: Character Arc Transformation
**I. The [Starting Identity] (Initial State)**
**II. The [Learning Phase Identity] (Growth State)**
**III. The [Breakthrough Identity] (Transformation State)**
**IV. The [Current Identity] (Evolved State)**

### Template 4: Thematic Pillars
**I. [Core Value #1]: "[Value Statement]"**
**II. [Core Value #2]: "[Value Statement]"**
**III. [Core Value #3]: "[Value Statement]"**
**IV. [Core Value #4]: "[Value Statement]"**

### Template 5: Conflict & Resolution
**I. Internal Conflicts**
**II. External Conflicts**
**III. Pivotal Moments**
**IV. Resolution & Ongoing Impact**

### Template 6: Chronological + Challenge & Response
**I. Origins & Foundation (Early Period) + Primary Challenges**
- Time period background + Core problems/responses
**II. Entry & Evolution (Development Period) + Learning Challenges**
- Development phase + Skill-building obstacles/solutions
**III. Breaking Barriers (Achievement Period) + Breakthrough Challenges**
- Achievement phase + Major barriers overcome
**IV. Elevation & Impact (Current/Legacy Period) + Ongoing Challenges**
- Current status + Present problems/approaches

### Template 7: Character Arc + Thematic Pillars
**I. The [Starting Identity] - Core Value Formation**
- Initial character + emerging principles
**II. The [Learning Phase Identity] - Value Testing**
- Character growth + principles under pressure
**III. The [Breakthrough Identity] - Value Mastery**
- Transformation + principles fully integrated
**IV. The [Current Identity] - Value Leadership**
- Evolved character + inspiring others through principles

### Template 8: Conflict & Resolution + Character Arc
**I. Internal Conflicts → Character Foundation**
- Internal tensions + how they shaped initial identity
**II. External Conflicts → Character Testing**
- External pressures + how they forced growth
**III. Pivotal Moments → Character Transformation**
- Crisis points + breakthrough moments in development
**IV. Resolution & Ongoing Impact → Character Mastery**
- Current resolved state + influence on others' development

### Template 9: Challenge & Response + Thematic Pillars
**I. [Primary Challenge] Through [Core Value #1]**
- Problem + value-based solution + principle demonstrated
**II. [Secondary Challenge] Through [Core Value #2]**
- Problem + value-based solution + principle demonstrated
**III. [Tertiary Challenge] Through [Core Value #3]**
- Problem + value-based solution + principle demonstrated
**IV. [Ongoing Challenge] Through [Core Value #4]**
- Problem + value-based solution + principle demonstrated

### Template 10: Chronological + Thematic Pillars
**I. Origins & Foundation - Core Values Emergence**
- Early period + initial value formation
**II. Entry & Evolution - Values in Practice**
- Development period + principles tested in real world
**III. Breaking Barriers - Values Under Pressure**
- Achievement period + principles during major challenges
**IV. Elevation & Impact - Values as Leadership**
- Current period + principles inspiring others

## EXECUTION

Now analyze the provided content and automatically generate the optimal outline following the selected framework's structure. Provide No addition commentary
`,
    variables: [
      {
        name: 'STORY_OR_TRANSCRIPT',
        description: 'The story or transcript to generate an outline for',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },

  // Outline Skip
  {
    id: 'story-generation',
    name: 'Story Generation',
    description: 'Story Generation',
    category: 'storyGeneration',
    template: `Story Generation Prompt

You are an expert biographical storyteller who transforms raw interviews, blogs, notes and scattered information into compelling, engaging narratives that captivate readers from the first sentence to the last.

## YOUR MISSION
Transform this raw material into a **compelling, interesting, and engaging story** that reads like a professionally crafted feature article. Create a narrative that makes readers think "I can't put this down" and leaves them inspired or intrigured by the subject's journey. It must be compelling interesting and engaging.

## WRITING STANDARDS
- **Length Target:** 2,500-4,000 words (substantial, immersive read)
- **Tone:** Cinematic and dramatic, yet authentic and grounded
- **Style:** Blend of literary narrative with journalistic precision
- **Engagement Level:** Every paragraph should propel the reader forward

## STRUCTURAL REQUIREMENTS

### Opening Hook (150-200 words)
- Start with a vivid scene, striking detail, or provocative statement
- Introduce the subject in an unexpected or compelling way
- Create immediate intrigue about what makes this person remarkable
- Avoid generic biographical openings

### Story Architecture
Choose the most compelling framework from the source material:
- **Hero's Journey:** If transformation/overcoming odds is central
- **David vs. Goliath:** If fighting systems/underdogs is prominent  
- **Innovation Story:** If creating something new is the focus
- **Redemption Arc:** If comeback/second chances drive the narrative
- **Trailblazer Tale:** If breaking barriers/being first is key

### Narrative Techniques to Deploy
1. **Scene Setting:** Paint vivid pictures of key moments
2. **Character Development:** Show personality through actions and dialogue
3. **Tension Building:** Create anticipation and stakes
4. **Conflict Emphasis:** Highlight obstacles and opposition
5. **Emotional Resonance:** Connect struggles to universal themes
6. **Momentum Maintenance:** Each section should end with forward pull

## CONTENT EXTRACTION GUIDELINES

### From Interview Transcripts, Extract:
- **Personality Markers:** Speech patterns, humor, attitude, values
- **Pivotal Moments:** Turning points, crises, breakthroughs
- **Specific Details:** Names, places, dates, quotes, anecdotes
- **Hidden Gems:** Throwaway comments that reveal character depth
- **Conflict Points:** Tensions, opposition, difficult decisions
- **Unique Angles:** What makes this story different/special

### Transform Scattered Information Into:
- **Coherent Timeline:** Even if non-linear presentation
- **Character Depth:** Internal motivations and external pressures
- **Stakes Clarity:** What was at risk and why it mattered
- **Resolution Impact:** How outcomes changed everything

## WRITING EXECUTION STANDARDS

### Paragraph Crafting
- **Opening Sentences:** Hook readers with intrigue or revelation
- **Middle Development:** Build tension, provide context, advance plot
- **Closing Sentences:** Create momentum toward next section

### Dialogue Integration
- Use direct quotes to reveal personality and key moments
- Clean up transcript language while preserving authentic voice
- Balance dialogue with narrative description

### Pacing Control
- **Fast Pacing:** Action sequences, conflict moments, breakthroughs
- **Slow Pacing:** Character development, background, reflection
- **Rhythm Variation:** Mix short punchy paragraphs with longer descriptive ones

### Emotional Architecture
- **Early:** Curiosity and connection
- **Middle:** Investment and tension
- **Climax:** High stakes and resolution
- **End:** Satisfaction and inspiration

## QUALITY MARKERS

### Compelling Elements
- Reader can visualize scenes clearly
- Personality emerges through actions, not just description
- Stakes feel real and significant
- Obstacles seem genuinely challenging
- Victories feel earned and meaningful

### Interesting Factors
- Unexpected angles or revelations
- Unique details that surprise readers
- Fresh perspective on familiar themes
- Insider insights into specific worlds/industries
- Human moments that create connection

### Engaging Techniques
- Cliffhangers between sections
- Questions that demand answers
- Emotional investment in outcomes
- Relatable struggles despite unique circumstances
- Forward momentum that prevents stopping

## SECTION DEVELOPMENT TEMPLATE

### Section Opening Pattern
"[Compelling scene or revelation] + [Context that raises stakes] + [Forward momentum toward resolution/conflict]"

### Section Content Structure
1. **Hook:** Immediate engagement
2. **Context:** Necessary background woven naturally
3. **Development:** Character growth or plot advancement
4. **Conflict:** Tension or obstacle introduction
5. **Transition:** Bridge to next section with intrigue

### Section Closing Pattern
"[Resolution of immediate tension] + [New question or challenge raised] + [Hint at what's coming next without a spoiler]"

## FINAL REQUIREMENTS

- **Title:** Create a compelling title that captures the essence
- **Subheadings:** Use 4-6 evocative section headers (not generic)
- **Length:** Substantial enough for deep immersion
- **Authenticity:** Stay true to facts while maximizing narrative impact
- **Universality:** Connect specific journey to broader human themes

## EXECUTION COMMAND

Analyze the provided source material and create a compelling, interesting, and engaging story that transforms raw information into a narrative readers won't be able to put down. Focus on the most dramatic, inspiring, and unique elements while maintaining authenticity and emotional truth.

The story should read like a feature article from a top-tier publication - professionally crafted, deeply engaging, and impossible to stop reading once started.


SOURCE MATERIAL: {TRANSCRIPT_OR_DATA}
`,

    variables: [
      {
        name: 'TRANSCRIPT_OR_DATA',
        description: 'The transcript or data to generate a story from',
        example: 'EXT. CITY STREET - DAY\n\nJOHN walks down the busy street...',
        enabled: true,
      },
    ],
  },
];
