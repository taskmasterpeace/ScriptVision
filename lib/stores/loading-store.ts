'use client';

import { create } from 'zustand';

export type LoadingKey =
  | 'generateShotList'
  | 'extractSubjects'
  | 'generateDirectorsNotes'
  | 'generatePrompt'
  | 'generateTreatment'
  | 'suggestShots'
  | string;

interface LoadingState {
  loadingStates: Record<LoadingKey, boolean>;
  setLoading: (key: LoadingKey, isLoading: boolean) => void;
  isLoading: (key: LoadingKey) => boolean;
  anyLoading: () => boolean;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  loadingStates: {
    generateShotList: false,
    extractSubjects: false,
    generateDirectorsNotes: false,
    generatePrompt: false,
    generateTreatment: false,
    suggestShots: false,
  },

  setLoading: (key, isLoading) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: isLoading },
    })),

  isLoading: (key) => get().loadingStates[key],

  anyLoading: () => Object.values(get().loadingStates).some(Boolean),
}));
