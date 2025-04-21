"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { useLoadingStore } from "@/lib/stores/loading-store"
import { useAILogsStore } from "@/lib/stores/ai-logs-store"
import { useProjectStore } from "@/lib/stores/project-store"
import { generateAIResponse } from "@/lib/ai-service"

// Add to the YouTubeTranscript interface to support custom transcripts
export interface YouTubeTranscript {
  id: string
  videoId: string | null // Can be null for custom transcripts
  title: string
  channelTitle: string | null // Can be null for custom transcripts
  transcript: string
  thumbnailUrl: string | null // Can be null for custom transcripts
  selected: boolean
  source: "youtube" | "custom" // Add source field to distinguish between YouTube and custom transcripts
}

export interface Chapter {
  id: string
  title: string
  bulletPoints: BulletPoint[]
  expanded: boolean
}

export interface BulletPoint {
  id: string
  text: string
  selected: boolean
}

export interface GeneratedChapter {
  id: string
  chapterId: string
  title: string
  content: string
  timestamp: string
}

export interface EmotionalEnhancement {
  id: string
  chapterId: string
  originalContent: string
  enhancedContent: string
  emotionalImpact: string
  changes: string[]
  timestamp: string
}

export interface ChapterSuggestion {
  id: string
  chapterId: string | null // null for new chapter suggestions
  title: string
  reason: string
  bulletPoints: string[]
  selected: boolean
}

export interface EmotionalSuggestion {
  id: string
  chapterId: string
  type: "dialog" | "scene" | "character" | "pacing"
  suggestion: string
  emotionalImpact: string
  selected: boolean
}

// Add to the ScriptCreationState interface
interface ScriptCreationState {
  // Story Theme
  storyTheme: string
  storyTitle: string
  storyGenre: string
  targetAudience: string

  // Research
  searchQuery: string
  searchResults: YouTubeTranscript[]
  selectedTranscripts: YouTubeTranscript[]

  // Outline
  chapters: Chapter[]
  chapterSuggestions: ChapterSuggestion[]

  // Add these new properties
  outlineDirections: {
    storyStructure: "three-act" | "hero-journey" | "five-act"
    perspective: "first-person" | "third-person" | "multiple-pov"
    tone: "light" | "dark" | "neutral"
    additionalNotes: string
  }

  // Write
  generatedChapters: GeneratedChapter[]

  // Enhance
  enhancedChapters: EmotionalEnhancement[]
  emotionalSuggestions: EmotionalSuggestion[]

  // Actions
  setStoryTheme: (theme: string) => void
  setStoryTitle: (title: string) => void
  setStoryGenre: (genre: string) => void
  setTargetAudience: (audience: string) => void

  searchYouTube: (query: string) => Promise<void>
  toggleTranscriptSelection: (id: string) => void

  generateOutline: () => Promise<void>
  addChapter: (title: string) => void
  updateChapter: (id: string, title: string) => void
  deleteChapter: (id: string) => void
  addBulletPoint: (chapterId: string, text: string) => void
  updateBulletPoint: (chapterId: string, id: string, text: string) => void
  deleteBulletPoint: (chapterId: string, id: string) => void
  toggleBulletPointSelection: (chapterId: string, id: string) => void
  analyzeAndSuggestChapters: () => Promise<void>
  toggleChapterSuggestionSelection: (id: string) => void
  applySelectedChapterSuggestions: () => void

  generateChapter: (chapterId: string) => Promise<void>
  generateAllChapters: () => Promise<void>
  updateGeneratedChapter: (id: string, content: string) => void

  analyzeEmotionalImpact: (chapterId: string) => Promise<void>
  generateEmotionalSuggestions: (chapterId: string) => Promise<void>
  toggleEmotionalSuggestionSelection: (id: string) => void
  applySelectedEmotionalSuggestions: (chapterId: string) => Promise<void>

  finalizeScript: () => void
  resetScriptCreation: () => void

  // Add these new actions
  addCustomTranscript: (title: string, transcript: string) => void
  updateCustomTranscript: (id: string, title: string, transcript: string) => void
  deleteTranscript: (id: string) => void

  // Add this new action
  setOutlineDirections: (directions: Partial<ScriptCreationState["outlineDirections"]>) => void
}

// Add the implementation in the store
export const useScriptCreationStore = create<ScriptCreationState>()(
  persist(
    (set, get) => ({
      // Initial state
      storyTheme: "",
      storyTitle: "",
      storyGenre: "",
      targetAudience: "",

      searchQuery: "",
      searchResults: [],
      selectedTranscripts: [],

      chapters: [],
      chapterSuggestions: [],

      // Add the new property
      outlineDirections: {
        storyStructure: "three-act",
        perspective: "third-person",
        tone: "neutral",
        additionalNotes: "",
      },

      generatedChapters: [],

      enhancedChapters: [],
      emotionalSuggestions: [],

      // Actions
      setStoryTheme: (theme) => set({ storyTheme: theme }),
      setStoryTitle: (title) => set({ storyTitle: title }),
      setStoryGenre: (genre) => set({ storyGenre: genre }),
      setTargetAudience: (audience) => set({ targetAudience: audience }),

      // Update the searchYouTube function to include the source field
      searchYouTube: async (query) => {
        useLoadingStore.getState().setLoading("youtubeSearch", true)

        try {
          // In a real implementation, this would call the YouTube API
          // For now, we'll simulate the API call with mock data
          await new Promise((resolve) => setTimeout(resolve, 1500))

          // Mock search results
          const mockResults: YouTubeTranscript[] = [
            {
              id: uuidv4(),
              videoId: "abc123",
              title: "How to Write a Compelling Story",
              channelTitle: "StoryTelling Mastery",
              transcript:
                "Today we're going to talk about storytelling. The key elements of a good story include character, plot, setting, and theme...",
              thumbnailUrl: "/open-book-glow.png",
              selected: false,
              source: "youtube",
            },
            {
              id: uuidv4(),
              videoId: "def456",
              title: `Understanding ${query} - A Deep Dive`,
              channelTitle: "Expert Analysis",
              transcript: `In this video, we'll explore ${query} in detail. We'll cover the history, the key concepts, and why it matters in today's world...`,
              thumbnailUrl: "/data-analysis-dashboard.png",
              selected: false,
              source: "youtube",
            },
            {
              id: uuidv4(),
              videoId: "ghi789",
              title: `The Ultimate Guide to ${query}`,
              channelTitle: "MasterClass Online",
              transcript: `Welcome to our comprehensive guide on ${query}. In this video, we'll break down everything you need to know to become an expert...`,
              thumbnailUrl: "/colorful-guide-arrows.png",
              selected: false,
              source: "youtube",
            },
          ]

          set({
            searchQuery: query,
            searchResults: mockResults,
          })
        } catch (error) {
          console.error("Failed to search YouTube:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("youtubeSearch", false)
        }
      },

      // Update the toggleTranscriptSelection function to include the source field
      toggleTranscriptSelection: (id) => {
        set((state) => {
          const updatedResults = state.searchResults.map((result) =>
            result.id === id ? { ...result, selected: !result.selected } : result,
          )

          const updatedSelected = updatedResults
            .filter((result) => result.selected)
            .map(({ id, videoId, title, channelTitle, transcript, thumbnailUrl, source }) => ({
              id,
              videoId,
              title,
              channelTitle,
              transcript,
              thumbnailUrl,
              selected: true,
              source,
            }))

          return {
            searchResults: updatedResults,
            selectedTranscripts: updatedSelected,
          }
        })
      },

      // Add the new action implementation
      setOutlineDirections: (directions) => {
        set((state) => ({
          outlineDirections: {
            ...state.outlineDirections,
            ...directions,
          },
        }))
      },

      // Update the generateOutline function to use the outline directions
      generateOutline: async () => {
        const { storyTheme, storyTitle, storyGenre, selectedTranscripts, outlineDirections } = get()

        if (!storyTheme) {
          throw new Error("Please define a story theme first")
        }

        if (selectedTranscripts.length === 0) {
          throw new Error("Please select at least one transcript for inspiration")
        }

        useLoadingStore.getState().setLoading("generateOutline", true)

        try {
          // Prepare the context for the AI
          const transcriptsText = selectedTranscripts
            .map((t) => `SOURCE: ${t.title}\nCONTENT: ${t.transcript}`)
            .join("\n\n")

          const promptContext = {
            theme: storyTheme,
            title: storyTitle || "Untitled",
            genre: storyGenre || "Not specified",
            transcripts: transcriptsText,
            structure: outlineDirections.storyStructure,
            perspective: outlineDirections.perspective,
            tone: outlineDirections.tone,
            additionalNotes: outlineDirections.additionalNotes,
          }

          // Call the AI service
          const outlineResponse = await generateAIResponse(
            "Generate a story outline with chapters and bullet points",
            JSON.stringify(promptContext),
          )

          // Log the AI response
          useAILogsStore.getState().addLog({
            type: "response",
            template: "story-outline",
            content: outlineResponse,
          })

          // Parse the AI response into structured data
          // In a real implementation, we would parse the AI's JSON response
          // For now, we'll create mock chapters

          const mockChapters: Chapter[] = [
            {
              id: uuidv4(),
              title: "Introduction to the World",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "Establish the setting and time period", selected: true },
                { id: uuidv4(), text: "Introduce the protagonist and their normal life", selected: true },
                { id: uuidv4(), text: "Hint at the central conflict or theme", selected: true },
              ],
            },
            {
              id: uuidv4(),
              title: "The Inciting Incident",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "Something disrupts the protagonist's normal life", selected: true },
                { id: uuidv4(), text: "The protagonist is forced to make a choice", selected: true },
                { id: uuidv4(), text: "Introduction of the main conflict", selected: true },
              ],
            },
            {
              id: uuidv4(),
              title: "Rising Action",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "Protagonist begins their journey", selected: true },
                { id: uuidv4(), text: "Introduction of allies and enemies", selected: true },
                { id: uuidv4(), text: "A series of escalating challenges", selected: true },
              ],
            },
            {
              id: uuidv4(),
              title: "The Midpoint",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "A major revelation or reversal", selected: true },
                { id: uuidv4(), text: "The stakes are raised significantly", selected: true },
                { id: uuidv4(), text: "The protagonist commits fully to their goal", selected: true },
              ],
            },
            {
              id: uuidv4(),
              title: "Complications and Higher Stakes",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "New obstacles emerge", selected: true },
                { id: uuidv4(), text: "Relationships are tested", selected: true },
                { id: uuidv4(), text: "The protagonist faces their biggest setback", selected: true },
              ],
            },
            {
              id: uuidv4(),
              title: "Climax",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "The final confrontation", selected: true },
                { id: uuidv4(), text: "The protagonist must use everything they've learned", selected: true },
                { id: uuidv4(), text: "The main conflict reaches its peak", selected: true },
              ],
            },
            {
              id: uuidv4(),
              title: "Resolution",
              expanded: true,
              bulletPoints: [
                { id: uuidv4(), text: "The aftermath of the climax", selected: true },
                { id: uuidv4(), text: "Character arcs are completed", selected: true },
                { id: uuidv4(), text: "The new normal is established", selected: true },
              ],
            },
          ]

          set({ chapters: mockChapters })
        } catch (error) {
          console.error("Failed to generate outline:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("generateOutline", false)
        }
      },

      addChapter: (title) => {
        set((state) => ({
          chapters: [
            ...state.chapters,
            {
              id: uuidv4(),
              title,
              expanded: true,
              bulletPoints: [],
            },
          ],
        }))
      },

      updateChapter: (id, title) => {
        set((state) => ({
          chapters: state.chapters.map((chapter) => (chapter.id === id ? { ...chapter, title } : chapter)),
        }))
      },

      deleteChapter: (id) => {
        set((state) => ({
          chapters: state.chapters.filter((chapter) => chapter.id !== id),
        }))
      },

      addBulletPoint: (chapterId, text) => {
        set((state) => ({
          chapters: state.chapters.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  bulletPoints: [...chapter.bulletPoints, { id: uuidv4(), text, selected: true }],
                }
              : chapter,
          ),
        }))
      },

      updateBulletPoint: (chapterId, id, text) => {
        set((state) => ({
          chapters: state.chapters.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  bulletPoints: chapter.bulletPoints.map((point) => (point.id === id ? { ...point, text } : point)),
                }
              : chapter,
          ),
        }))
      },

      deleteBulletPoint: (chapterId, id) => {
        set((state) => ({
          chapters: state.chapters.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  bulletPoints: chapter.bulletPoints.filter((point) => point.id !== id),
                }
              : chapter,
          ),
        }))
      },

      toggleBulletPointSelection: (chapterId, id) => {
        set((state) => ({
          chapters: state.chapters.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  bulletPoints: chapter.bulletPoints.map((point) =>
                    point.id === id ? { ...point, selected: !point.selected } : point,
                  ),
                }
              : chapter,
          ),
        }))
      },

      analyzeAndSuggestChapters: async () => {
        const { chapters, storyTheme, storyGenre } = get()

        if (chapters.length === 0) {
          throw new Error("Please generate an outline first")
        }

        useLoadingStore.getState().setLoading("analyzeOutline", true)

        try {
          // Prepare the context for the AI
          const chaptersText = chapters
            .map((c) => {
              const bulletPoints = c.bulletPoints.map((p) => `- ${p.text}`).join("\n")
              return `CHAPTER: ${c.title}\nBULLET POINTS:\n${bulletPoints}`
            })
            .join("\n\n")

          const promptContext = {
            theme: storyTheme,
            genre: storyGenre || "Not specified",
            chapters: chaptersText,
          }

          // Call the AI service
          const analysisResponse = await generateAIResponse(
            "Analyze story outline and suggest improvements",
            JSON.stringify(promptContext),
          )

          // Log the AI response
          useAILogsStore.getState().addLog({
            type: "response",
            template: "outline-analysis",
            content: analysisResponse,
          })

          // Parse the AI response into structured data
          // In a real implementation, we would parse the AI's JSON response
          // For now, we'll create mock suggestions

          const mockSuggestions: ChapterSuggestion[] = [
            {
              id: uuidv4(),
              chapterId: null,
              title: "Character Background",
              reason:
                "Adding a chapter that explores the protagonist's background will deepen character motivation and audience connection.",
              bulletPoints: [
                "Explore protagonist's childhood and formative experiences",
                "Reveal a past trauma or defining moment",
                "Establish key relationships that shaped the character",
              ],
              selected: false,
            },
            {
              id: uuidv4(),
              chapterId: chapters[2]?.id || null,
              title: "Expanded Rising Action",
              reason:
                "The rising action could benefit from more specific challenges that test different aspects of the protagonist's character.",
              bulletPoints: [
                "Add a moral dilemma that challenges the protagonist's values",
                "Include a moment of self-doubt or internal conflict",
                "Create a false victory before a major setback",
              ],
              selected: false,
            },
            {
              id: uuidv4(),
              chapterId: chapters[5]?.id || null,
              title: "Enhanced Climax",
              reason:
                "The climax could be more impactful with additional emotional stakes and clearer thematic resolution.",
              bulletPoints: [
                "Raise personal stakes by threatening a key relationship",
                "Create a moment where the protagonist must apply their greatest lesson",
                "Tie the resolution directly to the central theme",
              ],
              selected: false,
            },
          ]

          set({ chapterSuggestions: mockSuggestions })
        } catch (error) {
          console.error("Failed to analyze outline:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("analyzeOutline", false)
        }
      },

      toggleChapterSuggestionSelection: (id) => {
        set((state) => ({
          chapterSuggestions: state.chapterSuggestions.map((suggestion) =>
            suggestion.id === id ? { ...suggestion, selected: !suggestion.selected } : suggestion,
          ),
        }))
      },

      applySelectedChapterSuggestions: () => {
        const { chapters, chapterSuggestions } = get()

        const selectedSuggestions = chapterSuggestions.filter((s) => s.selected)

        if (selectedSuggestions.length === 0) {
          return
        }

        const updatedChapters = [...chapters]

        // Apply each selected suggestion
        selectedSuggestions.forEach((suggestion) => {
          if (suggestion.chapterId === null) {
            // This is a new chapter suggestion
            updatedChapters.push({
              id: uuidv4(),
              title: suggestion.title,
              expanded: true,
              bulletPoints: suggestion.bulletPoints.map((text) => ({
                id: uuidv4(),
                text,
                selected: true,
              })),
            })
          } else {
            // This is an enhancement to an existing chapter
            const chapterIndex = updatedChapters.findIndex((c) => c.id === suggestion.chapterId)

            if (chapterIndex !== -1) {
              // Add the suggested bullet points to the chapter
              suggestion.bulletPoints.forEach((text) => {
                updatedChapters[chapterIndex].bulletPoints.push({
                  id: uuidv4(),
                  text,
                  selected: true,
                })
              })
            }
          }
        })

        // Remove applied suggestions
        const remainingSuggestions = chapterSuggestions.filter((s) => !s.selected)

        set({
          chapters: updatedChapters,
          chapterSuggestions: remainingSuggestions,
        })
      },

      generateChapter: async (chapterId) => {
        const { chapters, storyTheme, storyTitle, storyGenre } = get()

        const chapter = chapters.find((c) => c.id === chapterId)

        if (!chapter) {
          throw new Error("Chapter not found")
        }

        useLoadingStore.getState().setLoading(`generateChapter-${chapterId}`, true)

        try {
          // Prepare the context for the AI
          const selectedBulletPoints = chapter.bulletPoints
            .filter((p) => p.selected)
            .map((p) => p.text)
            .join("\n- ")

          const promptContext = {
            theme: storyTheme,
            title: storyTitle || "Untitled",
            genre: storyGenre || "Not specified",
            chapterTitle: chapter.title,
            bulletPoints: `- ${selectedBulletPoints}`,
          }

          // Call the AI service
          const chapterContent = await generateAIResponse(
            "Generate a story chapter based on outline",
            JSON.stringify(promptContext),
          )

          // Log the AI response
          useAILogsStore.getState().addLog({
            type: "response",
            template: "chapter-generation",
            content: chapterContent,
          })

          // Create the generated chapter
          const generatedChapter: GeneratedChapter = {
            id: uuidv4(),
            chapterId,
            title: chapter.title,
            content: chapterContent,
            timestamp: new Date().toISOString(),
          }

          // Add to or update the generated chapters
          set((state) => {
            const existingIndex = state.generatedChapters.findIndex((c) => c.chapterId === chapterId)

            if (existingIndex !== -1) {
              // Update existing chapter
              const updatedChapters = [...state.generatedChapters]
              updatedChapters[existingIndex] = generatedChapter
              return { generatedChapters: updatedChapters }
            } else {
              // Add new chapter
              return { generatedChapters: [...state.generatedChapters, generatedChapter] }
            }
          })
        } catch (error) {
          console.error(`Failed to generate chapter ${chapterId}:`, error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading(`generateChapter-${chapterId}`, false)
        }
      },

      generateAllChapters: async () => {
        const { chapters } = get()

        if (chapters.length === 0) {
          throw new Error("Please generate an outline first")
        }

        useLoadingStore.getState().setLoading("generateAllChapters", true)

        try {
          // Generate each chapter sequentially
          for (const chapter of chapters) {
            await get().generateChapter(chapter.id)
          }
        } catch (error) {
          console.error("Failed to generate all chapters:", error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading("generateAllChapters", false)
        }
      },

      updateGeneratedChapter: (id, content) => {
        set((state) => ({
          generatedChapters: state.generatedChapters.map((chapter) =>
            chapter.id === id ? { ...chapter, content } : chapter,
          ),
        }))
      },

      analyzeEmotionalImpact: async (chapterId) => {
        const { generatedChapters } = get()

        const chapter = generatedChapters.find((c) => c.chapterId === chapterId)

        if (!chapter) {
          throw new Error("Generated chapter not found")
        }

        useLoadingStore.getState().setLoading(`analyzeEmotion-${chapterId}`, true)

        try {
          // Prepare the context for the AI
          const promptContext = {
            chapterTitle: chapter.title,
            content: chapter.content,
          }

          // Call the AI service
          const analysisResponse = await generateAIResponse(
            "Analyze emotional impact of story chapter",
            JSON.stringify(promptContext),
          )

          // Log the AI response
          useAILogsStore.getState().addLog({
            type: "response",
            template: "emotional-analysis",
            content: analysisResponse,
          })

          // Parse the AI response into structured data
          // In a real implementation, we would parse the AI's JSON response
          // For now, we'll create mock suggestions

          const mockSuggestions: EmotionalSuggestion[] = [
            {
              id: uuidv4(),
              chapterId,
              type: "dialog",
              suggestion:
                "Add a moment of vulnerability where the protagonist reveals their deepest fear to a trusted ally.",
              emotionalImpact: "Increases audience empathy and raises emotional stakes",
              selected: false,
            },
            {
              id: uuidv4(),
              chapterId,
              type: "scene",
              suggestion:
                "Include a quiet moment of reflection after the major conflict, showing how the character has been changed by events.",
              emotionalImpact: "Creates emotional resonance and emphasizes character growth",
              selected: false,
            },
            {
              id: uuidv4(),
              chapterId,
              type: "pacing",
              suggestion:
                "Slow down the pacing during the emotional climax, using shorter sentences and more sensory details.",
              emotionalImpact: "Heightens tension and makes the emotional payoff more impactful",
              selected: false,
            },
          ]

          set((state) => ({
            emotionalSuggestions: [
              ...state.emotionalSuggestions.filter((s) => s.chapterId !== chapterId),
              ...mockSuggestions,
            ],
          }))
        } catch (error) {
          console.error(`Failed to analyze emotional impact for chapter ${chapterId}:`, error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading(`analyzeEmotion-${chapterId}`, false)
        }
      },

      generateEmotionalSuggestions: async (chapterId) => {
        // This is similar to analyzeEmotionalImpact but focuses on generating specific suggestions
        await get().analyzeEmotionalImpact(chapterId)
      },

      toggleEmotionalSuggestionSelection: (id) => {
        set((state) => ({
          emotionalSuggestions: state.emotionalSuggestions.map((suggestion) =>
            suggestion.id === id ? { ...suggestion, selected: !suggestion.selected } : suggestion,
          ),
        }))
      },

      applySelectedEmotionalSuggestions: async (chapterId) => {
        const { generatedChapters, emotionalSuggestions } = get()

        const chapter = generatedChapters.find((c) => c.chapterId === chapterId)

        if (!chapter) {
          throw new Error("Generated chapter not found")
        }

        const selectedSuggestions = emotionalSuggestions.filter((s) => s.chapterId === chapterId && s.selected)

        if (selectedSuggestions.length === 0) {
          return
        }

        useLoadingStore.getState().setLoading(`enhanceChapter-${chapterId}`, true)

        try {
          // Prepare the context for the AI
          const suggestionsText = selectedSuggestions
            .map((s) => `- ${s.type.toUpperCase()}: ${s.suggestion}`)
            .join("\n")

          const promptContext = {
            chapterTitle: chapter.title,
            originalContent: chapter.content,
            suggestions: suggestionsText,
          }

          // Call the AI service
          const enhancedContent = await generateAIResponse(
            "Enhance story chapter with emotional impact",
            JSON.stringify(promptContext),
          )

          // Log the AI response
          useAILogsStore.getState().addLog({
            type: "response",
            template: "emotional-enhancement",
            content: enhancedContent,
          })

          // Create the enhanced chapter
          const enhancement: EmotionalEnhancement = {
            id: uuidv4(),
            chapterId,
            originalContent: chapter.content,
            enhancedContent,
            emotionalImpact: selectedSuggestions.map((s) => s.emotionalImpact).join("; "),
            changes: selectedSuggestions.map((s) => s.suggestion),
            timestamp: new Date().toISOString(),
          }

          // Add to or update the enhanced chapters
          set((state) => {
            const existingIndex = state.enhancedChapters.findIndex((c) => c.chapterId === chapterId)

            if (existingIndex !== -1) {
              // Update existing enhancement
              const updatedEnhancements = [...state.enhancedChapters]
              updatedEnhancements[existingIndex] = enhancement
              return {
                enhancedChapters: updatedEnhancements,
                // Remove applied suggestions
                emotionalSuggestions: state.emotionalSuggestions.filter(
                  (s) => s.chapterId !== chapterId || !s.selected,
                ),
              }
            } else {
              // Add new enhancement
              return {
                enhancedChapters: [...state.enhancedChapters, enhancement],
                // Remove applied suggestions
                emotionalSuggestions: state.emotionalSuggestions.filter(
                  (s) => s.chapterId !== chapterId || !s.selected,
                ),
              }
            }
          })
        } catch (error) {
          console.error(`Failed to enhance chapter ${chapterId}:`, error)
          throw error
        } finally {
          useLoadingStore.getState().setLoading(`enhanceChapter-${chapterId}`, false)
        }
      },

      finalizeScript: () => {
        const { enhancedChapters, generatedChapters } = get()
        const projectStore = useProjectStore.getState()

        // Combine all chapters into a single script
        // Prefer enhanced chapters when available

        const chapterMap = new Map<string, string>()

        // First add all generated chapters
        generatedChapters.forEach((chapter) => {
          chapterMap.set(chapter.chapterId, chapter.content)
        })

        // Then override with enhanced chapters where available
        enhancedChapters.forEach((enhancement) => {
          chapterMap.set(enhancement.chapterId, enhancement.enhancedContent)
        })

        // Convert to array and sort by chapter order
        const { chapters } = get()
        const orderedChapterIds = chapters.map((c) => c.id)

        const scriptParts: string[] = []

        orderedChapterIds.forEach((chapterId) => {
          const content = chapterMap.get(chapterId)
          if (content) {
            const chapter = chapters.find((c) => c.id === chapterId)
            if (chapter) {
              scriptParts.push(`# ${chapter.title}\n\n${content}\n\n`)
            }
          }
        })

        const finalScript = scriptParts.join("")

        // Set the script in the project store
        projectStore.setScript(finalScript)
      },

      resetScriptCreation: () => {
        set({
          storyTheme: "",
          storyTitle: "",
          storyGenre: "",
          targetAudience: "",

          searchQuery: "",
          searchResults: [],
          selectedTranscripts: [],

          chapters: [],
          chapterSuggestions: [],

          generatedChapters: [],

          enhancedChapters: [],
          emotionalSuggestions: [],
        })
      },

      // Add these new implementations
      addCustomTranscript: (title, transcript) => {
        const newTranscript: YouTubeTranscript = {
          id: uuidv4(),
          videoId: null,
          title,
          channelTitle: null,
          transcript,
          thumbnailUrl: null,
          selected: true,
          source: "custom",
        }

        set((state) => ({
          searchResults: [...state.searchResults, newTranscript],
          selectedTranscripts: [...state.selectedTranscripts, newTranscript],
        }))
      },

      updateCustomTranscript: (id, title, transcript) => {
        set((state) => {
          const updatedResults = state.searchResults.map((result) =>
            result.id === id ? { ...result, title, transcript } : result,
          )

          const updatedSelected = state.selectedTranscripts.map((result) =>
            result.id === id ? { ...result, title, transcript } : result,
          )

          return {
            searchResults: updatedResults,
            selectedTranscripts: updatedSelected,
          }
        })
      },

      deleteTranscript: (id) => {
        set((state) => ({
          searchResults: state.searchResults.filter((result) => result.id !== id),
          selectedTranscripts: state.selectedTranscripts.filter((result) => result.id !== id),
        }))
      },
    }),
    {
      name: "scriptvision-script-creation",
    },
  ),
)
