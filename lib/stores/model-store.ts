'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../db';

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  contextWindow: number;
  costPer1KTokens: number;
  recommended: boolean;
};

export type ApplicationPhase =
  | 'shotListGeneration'
  | 'subjectExtraction'
  | 'directorsNotes'
  | 'visualPrompt'
  | 'videoTreatment'
  | 'shotSuggestions';

interface ModelState {
  apiKey: string;
  replicateApiToken: string;
  useMockData: boolean;
  availableModels: AIModel[];
  phaseModelMapping: Record<ApplicationPhase, string>;
  setApiKey: (key: string) => void;
  setReplicateApiToken: (token: string) => void;
  setUseMockData: (useMock: boolean) => void;
  setModelForPhase: (phase: ApplicationPhase, modelId: string) => void;
  getModelForPhase: (phase: ApplicationPhase) => string;
  resetToDefaults: () => void;
}

// Default models
const defaultModels: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description:
      "OpenAI's most advanced model, optimized for both vision and language tasks.",
    capabilities: [
      'Text generation',
      'Creative writing',
      'Complex reasoning',
      'Detailed analysis',
    ],
    contextWindow: 128000,
    costPer1KTokens: 0.01,
    recommended: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description:
      'A powerful model with a good balance of capabilities and cost.',
    capabilities: ['Text generation', 'Creative writing', 'Complex reasoning'],
    contextWindow: 128000,
    costPer1KTokens: 0.01,
    recommended: false,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'A fast and cost-effective model for simpler tasks.',
    capabilities: ['Text generation', 'Basic reasoning', 'Fast responses'],
    contextWindow: 16000,
    costPer1KTokens: 0.0015,
    recommended: false,
  },
];

// Default phase-model mapping
const defaultPhaseModelMapping: Record<ApplicationPhase, string> = {
  shotListGeneration: 'gpt-4o',
  subjectExtraction: 'gpt-4o',
  directorsNotes: 'gpt-4o',
  visualPrompt: 'gpt-4o',
  videoTreatment: 'gpt-4o',
  shotSuggestions: 'gpt-4o',
};

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      replicateApiToken: '',
      useMockData: true, // Default to using mock data
      availableModels: [...defaultModels],
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

      setModelForPhase: (phase: ApplicationPhase, modelId: string) => {
        set((state) => ({
          phaseModelMapping: {
            ...state.phaseModelMapping,
            [phase]: modelId,
          },
        }));
      },

      getModelForPhase: (phase: ApplicationPhase) => {
        return (
          get().phaseModelMapping[phase] || defaultPhaseModelMapping[phase]
        );
      },

      resetToDefaults: () => {
        set({
          availableModels: [...defaultModels],
          phaseModelMapping: { ...defaultPhaseModelMapping },
        });
      },
    }),
    {
      name: 'scriptvision-models',
      storage: createJSONStorage(() => storage),
    }
  )
);
