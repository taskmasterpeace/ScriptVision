'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../db';
import { defaultTemplates } from '../utils/template';

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  enabled: boolean; // Track if the variable is enabled
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  category:
    | 'shotList'
    | 'subjects'
    | 'directorsNotes'
    | 'visualPrompt'
    | 'videoTreatment'
    | 'shotSuggestions'
    | 'outlineGeneration'
    | 'storyGeneration'
    | 'other';
}

interface TemplateState {
  templates: PromptTemplate[]
  getTemplate: (id: string) => PromptTemplate | undefined
  selectedTemplate: PromptTemplate | null
  setSelectedTemplate: (template: PromptTemplate | null) => void

  updateTemplate: (id: string, updatedTemplate: Partial<PromptTemplate>) => void
  updateTemplateVariable: (templateId: string, variableName: string, enabled: boolean) => void
  // DB actions
  init: () => Promise<void>
  loadTemplate: () => Promise<void>

  resetToDefaults: () => Promise<void>
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [...defaultTemplates],
      selectedTemplate: null,

      getTemplate: (id: string) => {
        return get().templates.find((template) => template.id === id)
      },

      setSelectedTemplate: (template: PromptTemplate | null) => {
        set({ selectedTemplate: template })
      },

      updateTemplate: (
        id: string,
        updatedTemplate: Partial<PromptTemplate>
      ) => {
        const templates = get().templates;
        const index = templates.findIndex((template) => template.id === id);

        if (index !== -1) {
          const newTemplates = [...templates]
          const existingTemplate = newTemplates[index]

          // Preserve variables that might not be in the update
          const variables = updatedTemplate.variables !== undefined 
              ? updatedTemplate.variables
            : existingTemplate.variables

          const updated = {
            ...existingTemplate,
            ...updatedTemplate,
            variables
          }
          newTemplates[index] = updated

          // Update selected template if it's the one being modified
          const currentSelected = get().selectedTemplate
          if (currentSelected && currentSelected.id === id) {
            set({ selectedTemplate: updated })
          }
          set({ templates: newTemplates })
        }
      },

      updateTemplateVariable: (
        templateId: string,
        variableName: string,
        enabled: boolean
      ) => {
        const templates = get().templates;
        const templateIndex = templates.findIndex(
          (template) => template.id === templateId
        );

        if (templateIndex !== -1) {
          const template = templates[templateIndex];
          const variableIndex = template.variables.findIndex(
            (v) => v.name === variableName
          );

          if (variableIndex !== -1) {
            const newTemplates = [...templates]
            newTemplates[templateIndex].variables[variableIndex].enabled = enabled
            set({ templates: newTemplates })
          }
        }
      },

      loadTemplate: async (): Promise<void> => {
        try {
          const templates = get().templates
          if (templates) {
            // Only update if we have valid templates
            if (Array.isArray(templates) && templates.length > 0) {
              // Merge with default templates to ensure new templates are added in updates
              const mergedTemplates = defaultTemplates.map(defaultTemplate => {
                const savedTemplate = templates.find(t => t.id === defaultTemplate.id)
                return savedTemplate || defaultTemplate
              })
              set({ templates: mergedTemplates })
            }
          }
          // If no templates found or parsing failed, initialize with defaults
          set({ templates: defaultTemplates })
        } catch (error) {
          console.error("Error loading templates:", error)
          // If loading fails, use defaults and save them
          set({ templates: defaultTemplates })
        }
      },

      init: async () => {
        try {
          // First load any saved templates
          await get().loadTemplate()

          // Then ensure we have the latest defaults
          const templates = get().templates
          const hasUpdates = defaultTemplates.some(defaultTemplate => {
            return !templates.some(t => t.id === defaultTemplate.id)
          })

          if (hasUpdates) {
            // If there are new default templates, merge them in
            const mergedTemplates = defaultTemplates.map(defaultTemplate => {
              const existing = templates.find(t => t.id === defaultTemplate?.id)
              return existing || defaultTemplate
            })
            set({ templates: mergedTemplates })
          }
        } catch (error) {
          console.error("Error initializing templates:", error)
          // If loading fails, reset to defaults and save them
          await get().resetToDefaults()
        }
      },

      resetToDefaults: async (): Promise<void> => {
        set({ templates: defaultTemplates, selectedTemplate: null })
      },
    }),
    {
      name: "scriptvision-templates",
      storage: createJSONStorage(() => storage),
    },
  ),
  )
