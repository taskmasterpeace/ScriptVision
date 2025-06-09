"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { storage } from "../db"

export type ImageGenerationSettings = {
  aspectRatio: string
  guidance: number
  numInferenceSteps: number
  seed: number | null
  numOutputs: number
  loraWeights: string
}

export type GeneratedImage = {
  id: string
  promptId: string
  imageUrl: string
  timestamp: string
  settings: ImageGenerationSettings
  status: "pending" | "generating" | "completed" | "failed"
  error?: string
  predictionId?: string // Add this field to store the Replicate prediction ID
}

interface ImageGenerationState {
  selectedPromptIds: string[]
  generatedImages: GeneratedImage[]
  defaultSettings: ImageGenerationSettings
  isGenerating: boolean

  // Actions
  selectPrompt: (promptId: string) => void
  unselectPrompt: (promptId: string) => void
  togglePromptSelection: (promptId: string) => void
  selectAllPrompts: (promptIds: string[]) => void
  clearPromptSelection: () => void

  updateDefaultSettings: (settings: Partial<ImageGenerationSettings>) => void

  addGeneratedImage: (image: GeneratedImage) => void
  updateImageStatus: (imageId: string, status: GeneratedImage["status"], error?: string) => void
  removeGeneratedImage: (imageId: string) => void

  setIsGenerating: (isGenerating: boolean) => void

  updateImagePredictionId: (imageId: string, predictionId: string) => void
}

const defaultImageSettings: ImageGenerationSettings = {
  aspectRatio: "1:1",
  guidance: 3,
  numInferenceSteps: 28,
  seed: null,
  numOutputs: 1,
  loraWeights: "",
}

export const useImageGenerationStore = create<ImageGenerationState>()(
  persist(
    (set) => ({
      selectedPromptIds: [],
      generatedImages: [],
      defaultSettings: { ...defaultImageSettings },
      isGenerating: false,

      selectPrompt: (promptId: string) =>
        set((state) => ({
          selectedPromptIds: [...state.selectedPromptIds, promptId],
        })),

      unselectPrompt: (promptId: string) =>
        set((state) => ({
          selectedPromptIds: state.selectedPromptIds.filter((id) => id !== promptId),
        })),

      togglePromptSelection: (promptId: string) =>
        set((state) => {
          if (state.selectedPromptIds.includes(promptId)) {
            return {
              selectedPromptIds: state.selectedPromptIds.filter((id) => id !== promptId),
            }
          } else {
            return {
              selectedPromptIds: [...state.selectedPromptIds, promptId],
            }
          }
        }),

      selectAllPrompts: (promptIds: string[]) =>
        set({
          selectedPromptIds: promptIds,
        }),

      clearPromptSelection: () =>
        set({
          selectedPromptIds: [],
        }),

      updateDefaultSettings: (settings: Partial<ImageGenerationSettings>) =>
        set((state) => ({
          defaultSettings: { ...state.defaultSettings, ...settings },
        })),

      addGeneratedImage: (image: GeneratedImage) =>
        set((state) => ({
          generatedImages: [...state.generatedImages, image],
        })),

      updateImageStatus: (imageId: string, status: GeneratedImage["status"], error?: string) =>
        set((state) => ({
          generatedImages: state.generatedImages.map((img) =>
            img.id === imageId ? { ...img, status, ...(error ? { error } : {}) } : img,
          ),
        })),

      removeGeneratedImage: (imageId: string) =>
        set((state) => ({
          generatedImages: state.generatedImages.filter((img) => img.id !== imageId),
        })),

      setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

      updateImagePredictionId: (imageId: string, predictionId: string) =>
        set((state) => ({
          generatedImages: state.generatedImages.map((img) => (img.id === imageId ? { ...img, predictionId } : img)),
        })),
    }),
    {
      name: "scriptvision-image-generation",
      storage: createJSONStorage(() => storage)
    },
  ),
)
