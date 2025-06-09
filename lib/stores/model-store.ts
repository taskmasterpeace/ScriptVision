'use client';

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { del, keys } from "idb-keyval"
import { Model } from "../types"
import { storage } from "../db"

export type PhaseModelMapping = {
  [key in ApplicationPhase]: Model
}

export type ApplicationPhase =
  | 'shotListGeneration'
  | 'subjectExtraction'
  | 'directorsNotes'
  | 'visualPrompt'
  | 'videoTreatment'
  | 'shotSuggestions'
  | 'outlineGeneration';

interface ModelState {
  apiKey: string
  replicateApiToken: string
  useMockData: boolean
  availableModels: Model[]
  isLoading: boolean
  selectedProviders: Record<string, string>
  phaseModelMapping: PhaseModelMapping
  setApiKey: (key: string) => void
  setReplicateApiToken: (token: string) => void
  setUseMockData: (useMock: boolean) => void
  setModelForPhase: (phase: ApplicationPhase, modelId: string, provider: string) => void
  getModelForPhase: (phase: ApplicationPhase) => string
  setSelectedProvider: (phase: string, provider: string) => void
  fetchApiModels: () => Promise<void>

  // Model actions
  resetModelsDB: () => void
  loadModel: () => Promise<void>
  saveModel: () => Promise<void>

  resetToDefaults: () => void
}

// Default phase-model mapping
const defaultPhaseModelMapping: PhaseModelMapping = {
  shotListGeneration: {
    id: "shotListGeneration",
    provider: "openai",
    model: "gpt-4o-mini",
    lastUpdated: new Date().toISOString()
  },
  subjectExtraction: {
    id: "subjectExtraction",
    provider: "openai",
    model: "gpt-4o-mini",
    lastUpdated: new Date().toISOString()
  },
  directorsNotes: {
    id: "directorsNotes",
    provider: "openai",
    model: "gpt-4o-mini",  
    lastUpdated: new Date().toISOString()
  },
  visualPrompt: {
    id: "visualPrompt",
    provider: "openai",
    model: "gpt-4o-mini",
    lastUpdated: new Date().toISOString()
  },
  videoTreatment: {
    id: "videoTreatment",
    provider: "openai",
    model: "gpt-4o-mini",
    lastUpdated: new Date().toISOString()
  },
  shotSuggestions: {
    id: "shotSuggestions",
    provider: "openai",
    model: "gpt-4o-mini",
    lastUpdated: new Date().toISOString()
  },
  outlineGeneration: {
    id: "outlineGeneration",
    provider: "openai",
    model: "gpt-4o-mini",
    lastUpdated: new Date().toISOString()
  }
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      replicateApiToken: '',
      useMockData: true, // Default to using mock data
      availableModels: [],
      selectedProviders: {},
      isLoading: false,
      phaseModelMapping: { ...defaultPhaseModelMapping },

      setApiKey: (key: string) => {
        set({ apiKey: key });
        // If a key is provided, automatically disable mock data
        if (key) {
          set({ useMockData: false });
        }
      },

      setReplicateApiToken: (token: string) => {
        set({ replicateApiToken: token });
      },

      setUseMockData: (useMock: boolean) => {
        set({ useMockData: useMock });
      },

      setModelForPhase: (phase: ApplicationPhase, modelId: string, provider: string) => {
        set((state) => ({
          phaseModelMapping: {
            ...state.phaseModelMapping,
            [phase]: {
              provider,
              model: modelId,
              lastUpdated: new Date().toISOString()
            }
          }
        }));
      },

      getModelForPhase: (phase: ApplicationPhase) => {
        return get().phaseModelMapping[phase]?.model || '';
      },

      fetchApiModels: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("https://api.requesty.ai/router/models");
          if (!response.ok) throw new Error("Failed to fetch models");
          const data = await response.json();
          set({ availableModels: data });
        } catch (error) {
          console.error("Error fetching models:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      setSelectedProvider: (phase: string, provider: string) => {
        set((state) => ({
          selectedProviders: {
            ...state.selectedProviders,
            [phase]: provider,
          },
        }));
      },

      // Reset models to default values
      resetModelsDB: async () => {
        try {
          // Clear all existing model data from IndexedDB
          const allKeys = await keys();
          await Promise.all(allKeys.map(key => del(key)));

          // Create a new state with default values
          const defaultState = {
            phaseModelMapping: { ...defaultPhaseModelMapping },
            selectedProviders: Object.entries(defaultPhaseModelMapping).reduce<Record<string, string>>((acc, [phase, config]) => {
              acc[phase] = config.provider;
              return acc;
            }, {})
          };

          // Update the state
          set({
            ...defaultState,
            apiKey: get().apiKey,
            replicateApiToken: get().replicateApiToken,
            useMockData: get().useMockData,
            availableModels: [...get().availableModels],
            isLoading: false
          });

          // Save the default configuration to IndexedDB
          await get().saveModel();
        } catch (error) {
          console.error('Error resetting models to defaults:', error)
          throw error
        }
      },

      // Save the current model configuration to IndexedDB
      saveModel: async () => {
        try {
          const { phaseModelMapping } = get()
          // We just need to ensure the state is updated

          set({ phaseModelMapping: phaseModelMapping })
        } catch (error) {
          console.error('Error saving model configuration:', error)
        }
      },

      // Load the model configuration from IndexedDB
      loadModel: async () => {
        try {
          // The persist middleware automatically loads the state from IndexedDB
          // This method is kept for backward compatibility
          const savedState = get().phaseModelMapping
          if (savedState) {
            
            // Create default selected providers
            const defaultSelectedProviders = Object.keys(defaultPhaseModelMapping).reduce<Record<string, string>>((acc, phase) => {
              acc[phase] = 'openai';
              return acc;
            }, {})

            // Update selectedProviders based on loaded phaseModelMapping
            const loadedSelectedProviders = Object.entries(savedState || {}).reduce<Record<string, string>>(
              (acc, [phase, config]) => {
                if (config && typeof config === 'object' && 'provider' in config) {
                  acc[phase] = config.provider as string;
                } else {
                  acc[phase] = 'openai';
                }
                return acc;
              },
              { ...defaultSelectedProviders }
            );

            // Update the state with loaded values
            set({
              ...get(), // Keep existing state
              phaseModelMapping: {
                ...defaultPhaseModelMapping,
                ...(savedState || {})
              },
              selectedProviders: loadedSelectedProviders
            });
          }
        } catch (error) {
          console.error('Error loading model configuration:', error);
        }
      },

      resetToDefaults: () => {
        set({
          phaseModelMapping: { ...defaultPhaseModelMapping },
        })
        set((state) => ({
          selectedProviders: {
            ...state.selectedProviders,
            shotListGeneration: "openai",
            subjectExtraction: "openai",
            directorsNotes: "openai",
            visualPrompt: "openai",
            videoTreatment: "openai",
            shotSuggestions: "openai",
          }
        }))
        // Reset the database to default models db
        get().resetModelsDB()
      },
    }),
    {
      name: "scriptvision-models",
      storage: createJSONStorage(() => storage),
    },
  ),
  )
