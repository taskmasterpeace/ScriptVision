'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Shot,
  Subject,
  Style,
  DirectorStyle,
  GeneratedPrompt,
  Project,
  CameraSettings,
  MusicLabFormData,
} from '@/lib/types';
import { generateAIResponse, generateJSONResponse } from '@/lib/ai-service';
import { storage } from '../db';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';

// First, import the loading store at the top of the file
import { useLoadingStore } from '@/lib/stores/loading-store';
import { mockDirectorStyles } from '@/lib/utils/project';
import { shortListSchema, subjectSchema } from '@/lib/utils/schema';
import { z } from 'zod';

interface ProjectState {
  projectName: string;
  script: string;
  shotList: Shot[];
  subjects: Subject[];
  proposedSubjects: Subject[];
  styles: Style[];
  directorStyles: DirectorStyle[];
  selectedStyle: Style | null;
  selectedDirectorStyle: DirectorStyle | null;
  generatedPrompts: GeneratedPrompt[];
  workflowProgress: {
    scriptCompleted: boolean;
    shotListCompleted: boolean;
    subjectsCompleted: boolean;
    promptsCompleted: boolean;
    stylesCompleted: boolean;
  };

  // Project actions
  setProjectName: (name: string) => void;
  setScript: (script: string) => void;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  deleteProject: (name: string) => Promise<void>;
  listProjects: () => Promise<Project[]>;
  projects: Project[];

  // Shot list actions
  generateShotList: () => Promise<void>;
  updateShot: (shot: Shot) => void;
  generateBulkDirectorsNotes: () => Promise<void>;
  // Add the addShots method to the ProjectState interface
  addShots: (shots: Shot[]) => void;

  // Subject actions
  extractSubjects: () => Promise<void>;
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  mergeProposedSubjects: () => void;

  // Style actions
  addStyle: (style: Style) => void;
  updateStyle: (style: Style) => void;
  deleteStyle: (id: string) => void;
  setSelectedStyle: (style: Style) => void;
  setSelectedDirectorStyle: (style: DirectorStyle) => void;

  // Prompt actions
  generatePrompt: (
    shot: Shot,
    activeSubjects: Subject[],
    cameraSettings: CameraSettings
  ) => Promise<void>;

  // Music Lab actions
  generateVideoTreatment: (formData: MusicLabFormData) => Promise<string>;

  setKeytoState: <K extends keyof ProjectState>(
    key: K,
    value: ProjectState[K]
  ) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projectName: '',
      script: '',
      shotList: [],
      subjects: [],
      proposedSubjects: [],
      projects: [],
      styles: [
        {
          id: uuidv4(),
          name: 'Cinematic',
          prefix: 'cinematic still, movie scene,',
          suffix: 'film grain, dramatic lighting, 35mm film',
          genre: 'Drama',
          descriptors: 'cinematic, dramatic, film-like',
        },
        {
          id: uuidv4(),
          name: 'Noir',
          prefix: 'film noir style,',
          suffix: 'high contrast, shadows, moody, black and white',
          genre: 'Crime',
          descriptors: 'moody, shadowy, high-contrast',
        },
      ],
      directorStyles: mockDirectorStyles,
      selectedStyle: null,
      selectedDirectorStyle: null,
      generatedPrompts: [],
      workflowProgress: {
        scriptCompleted: false,
        shotListCompleted: false,
        subjectsCompleted: false,
        promptsCompleted: false,
        stylesCompleted: false,
      },

      setKeytoState: <K extends keyof ProjectState>(
        key: K,
        value: ProjectState[K]
      ) => {
        const { projectName, projects } = get();
        const current = projects.find((p) => p.name === projectName);
        if (!current) return;

        set({
          projects: projects.map((p) =>
            p.id === current.id
              ? { ...p, [key]: value, lastModified: new Date().toISOString() }
              : p
          ),
        });
      },

      // Project actions
      setProjectName: (name) => set({ projectName: name }),

      setScript: (script) => {
        const workflowProgress = get().workflowProgress;
        set({
          script,
          workflowProgress: {
            ...workflowProgress,
            scriptCompleted: Boolean(script && script.length > 0),
          },
        });
      },

      saveProject: async () => {
        const { projectName, script, shotList, subjects, generatedPrompts } =
          get();

        // TODO: Check if project with same name already exists or not

        const projects = get().projects;
        const newProject: Project = {
          id: uuidv4(),
          name: projectName,
          script,
          shotList,
          subjects,
          generatedPrompts,
          lastModified: new Date().toISOString(),
        };

        const newProjectList = [...projects, newProject];

        set({ projects: newProjectList });
      },
      loadProject: async (projectId) => {
        const projects = get().projects;
        let project = projects.find((p) => p.id === projectId); // prefer ID
        if (!project) project = projects.find((p) => p.name === projectId); // fallback

        if (project) {
          set({
            projectName: project.name,
            script: project.script,
            shotList: project.shotList,
            subjects: project.subjects,
            generatedPrompts: project.generatedPrompts,
            workflowProgress: {
              scriptCompleted: Boolean(
                project.script && project.script.length > 0
              ),
              shotListCompleted: project.shotList.length > 0,
              subjectsCompleted: project.subjects.length > 0,
              promptsCompleted: project.generatedPrompts.length > 0,
              stylesCompleted: false,
            },
          });
          get().setKeytoState('shotList', project.shotList);
          get().setKeytoState('subjects', project.subjects);
          get().setKeytoState('generatedPrompts', project.generatedPrompts);
          useScriptCreationStore.getState().loadProject(project.id);
          return;
        }
      },

      deleteProject: async (name) => {
        try {
          const projects = get().projects;
          const newProjectList = projects.filter((p) => p.name !== name);
          set({ projects: newProjectList });
        } catch (error) {
          console.error('Error deleting project:', error);
        }
      },

      listProjects: async () => {
        try {
          const projects = get().projects;
          return projects;
        } catch (error) {
          console.error('Error listing projects:', error);
          return [];
        }
      },

      // Shot list actions
      generateShotList: async () => {
        const { script } = get();
        if (!script.trim()) {
        }

        useLoadingStore.getState().setLoading('generateShotList', true);

        try {
          // TODO: replace this with actual variable
          const promptContext = {
            script_theme: 'drama',
            script: script,
            director_style: 'cinematic',
            shot_frequency: 'single_sentence',
          };

          // Output should be type of shortListSchema
          const response: z.infer<typeof shortListSchema> =
            await generateJSONResponse(
              'shotListGeneration',
              'generate-shot-list',
              promptContext,
              shortListSchema
            );

          const shots = response.shots;
          const workflowProgress = get().workflowProgress;

          set({
            shotList: shots.map((shot) => ({
              id: uuidv4(),
              ...shot,
            })),
            workflowProgress: {
              ...workflowProgress,
              shotListCompleted: true,
            },
          });
        } catch (error) {
          console.error('Failed to generate shot list:', error);
          throw error;
        } finally {
          useLoadingStore.getState().setLoading('generateShotList', false);
        }
      },

      updateShot: (updatedShot) => {
        const { shotList } = get();

        const updatedShotList = shotList.map((shot) =>
          shot.id === updatedShot.id ? updatedShot : shot
        );

        set({ shotList: updatedShotList });
      },

      generateBulkDirectorsNotes: async () => {
        const { shotList, selectedDirectorStyle } = get();

        if (shotList.length === 0) {
          throw new Error('No shots available');
        }

        useLoadingStore.getState().setLoading('generateDirectorsNotes', true);

        try {
          // In a real implementation, this would call an AI service for each shot
          const updatedShotList = await Promise.all(
            shotList.map(async (shot) => {
              const directorStyle = selectedDirectorStyle
                ? `in the style of ${selectedDirectorStyle.name}`
                : '';

              const notes = await generateAIResponse(
                `Generate director's notes for this shot ${directorStyle}`,
                `Scene: ${shot.scene}, Shot: ${shot.shot}, Description: ${shot.description}`
              );

              return {
                ...shot,
                directorsNotes: notes,
              };
            })
          );

          set({ shotList: updatedShotList });
        } catch (error) {
          console.error("Failed to generate director's notes:", error);
          throw error;
        } finally {
          useLoadingStore
            .getState()
            .setLoading('generateDirectorsNotes', false);
        }
      },
      // Add the implementation in the store
      addShots: (shots) => {
        const { shotList } = get();

        // Sort the shots by scene and shot number
        const updatedShotList = [...shotList, ...shots].sort((a, b) => {
          // First compare scene numbers
          const sceneA = Number.parseInt(a.scene, 10) || 0;
          const sceneB = Number.parseInt(b.scene, 10) || 0;

          if (sceneA !== sceneB) {
            return sceneA - sceneB;
          }

          // If scenes are the same, compare shot numbers
          const shotA = Number.parseFloat(a.shot.replace(/[^0-9.]/g, '')) || 0;
          const shotB = Number.parseFloat(b.shot.replace(/[^0-9.]/g, '')) || 0;
          return shotA - shotB;
        });

        set({ shotList: updatedShotList });
      },

      // Subject actions
      extractSubjects: async () => {
        const { script, shotList } = get();

        if (!script.trim()) {
          throw new Error('Script is empty');
        }

        useLoadingStore.getState().setLoading('extractSubjects', true);

        try {
          // Process the template with variables
          const context = {
            script: script,
            shot_list: JSON.stringify(shotList) || 'No shot list available',
          };

          // Call the AI service to extract subjects
          const response: z.infer<typeof subjectSchema> =
            await generateJSONResponse(
              'subjectExtraction',
              'subject-extraction',
              context,
              subjectSchema
            );

          // Parse the AI response into structured data
          const subjects = response.subjects.map((subject) => ({
            ...subject,
            id: uuidv4(),
          }));

          // If no subjects were parsed, throw an error
          if (subjects.length === 0) {
            console.error(
              'Failed to parse subjects from AI response:',
              subjects
            );
            throw new Error(
              'Failed to parse subjects from AI response. Please try again.'
            );
          }

          set({ proposedSubjects: subjects });
          get().setKeytoState('subjects', subjects);
        } catch (error) {
          console.error('Failed to extract subjects:', error);
          throw error;
        } finally {
          useLoadingStore.getState().setLoading('extractSubjects', false);
        }
      },

      addSubject: (subject) => {
        const { subjects } = get();
        const newSubject = {
          ...subject,
          id: subject.id || uuidv4(),
        };

        const updatedSubjects = [...subjects, newSubject];
        const workflowProgress = get().workflowProgress;

        set({
          subjects: updatedSubjects,
          workflowProgress: {
            ...workflowProgress,
            subjectsCompleted: updatedSubjects.length > 0,
          },
        });
        get().setKeytoState('subjects', updatedSubjects);
      },

      updateSubject: (updatedSubject) => {
        const { subjects, proposedSubjects } = get();

        // Check if the subject is in the main subjects list
        if (subjects.some((s) => s.id === updatedSubject.id)) {
          const updatedSubjects = subjects.map((subject) =>
            subject.id === updatedSubject.id ? updatedSubject : subject
          );

          set({ subjects: updatedSubjects });
          get().setKeytoState('subjects', updatedSubjects);
        }
        // Check if the subject is in the proposed subjects list
        else if (proposedSubjects.some((s) => s.id === updatedSubject.id)) {
          const updatedProposedSubjects = proposedSubjects.map((subject) =>
            subject.id === updatedSubject.id ? updatedSubject : subject
          );

          set({ proposedSubjects: updatedProposedSubjects });
        }
      },

      deleteSubject: (id) => {
        const { subjects, proposedSubjects } = get();

        // Check if the subject is in the main subjects list
        if (subjects.some((s) => s.id === id)) {
          const updatedSubjects = subjects.filter(
            (subject) => subject.id !== id
          );
          const workflowProgress = get().workflowProgress;

          set({
            subjects: updatedSubjects,
            workflowProgress: {
              ...workflowProgress,
              subjectsCompleted: updatedSubjects.length > 0,
            },
          });
          get().setKeytoState('subjects', updatedSubjects);
        }
        // Check if the subject is in the proposed subjects list
        else if (proposedSubjects.some((s) => s.id === id)) {
          set({
            proposedSubjects: proposedSubjects.filter(
              (subject) => subject.id !== id
            ),
          });
          get().setKeytoState(
            'proposedSubjects',
            proposedSubjects.filter((subject) => subject.id !== id)
          );
        }
      },

      mergeProposedSubjects: () => {
        const { subjects, proposedSubjects } = get();

        // Merge proposed subjects into the main subjects list
        // Avoid duplicates by name
        const existingNames = new Set(
          subjects.map((s) => s.name.toLowerCase())
        );
        const newSubjects = proposedSubjects.filter(
          (s) => !existingNames.has(s.name.toLowerCase())
        );
        const updatedSubjects = [...subjects, ...newSubjects];
        const workflowProgress = get().workflowProgress;

        set({
          subjects: updatedSubjects,
          proposedSubjects: [],
          workflowProgress: {
            ...workflowProgress,
            subjectsCompleted: updatedSubjects.length > 0,
          },
        });
        get().setKeytoState('subjects', updatedSubjects);
      },

      // Style actions
      addStyle: (style) => {
        const { styles } = get();
        const newStyle = {
          ...style,
          id: style.id || uuidv4(),
        };

        set({ styles: [...styles, newStyle] });
      },

      updateStyle: (updatedStyle) => {
        const { styles } = get();

        const updatedStyles = styles.map((style) =>
          style.id === updatedStyle.id ? updatedStyle : style
        );

        set({ styles: updatedStyles });
      },

      deleteStyle: (id) => {
        const { styles, selectedStyle } = get();
        const updatedStyles = styles.filter((style) => style.id !== id);

        // If we're deleting the currently selected style, deselect it
        const newSelectedStyle =
          selectedStyle && selectedStyle.id === id ? null : selectedStyle;
        const workflowProgress = get().workflowProgress;

        set({
          styles: updatedStyles,
          selectedStyle: newSelectedStyle,
          workflowProgress: {
            ...workflowProgress,
            stylesCompleted: Boolean(newSelectedStyle),
          },
        });
      },

      setSelectedStyle: (style) => {
        const workflowProgress = get().workflowProgress;
        set({
          selectedStyle: style,
          workflowProgress: {
            ...workflowProgress,
            stylesCompleted: Boolean(style),
          },
        });
      },

      setSelectedDirectorStyle: (style) => {
        set({ selectedDirectorStyle: style });
      },

      // Prompt actions
      generatePrompt: async (shot, activeSubjects, cameraSettings) => {
        const {
          script,
          selectedStyle,
          selectedDirectorStyle,
          generatedPrompts,
        } = get();

        if (!selectedStyle) {
          throw new Error('No style selected');
        }

        useLoadingStore.getState().setLoading('generatePrompt', true);

        try {
          // Filter out "none" values from camera settings
          const filteredCameraSettings = Object.fromEntries(
            Object.entries(cameraSettings).filter(
              ([_, value]) => value !== 'none'
            )
          );

          // In a real implementation, this would call an AI service
          const promptContext = {
            shot,
            subjects: activeSubjects,
            style: selectedStyle,
            directorStyle: selectedDirectorStyle,
            script,
            cameraSettings: filteredCameraSettings,
          };

          // Generate the prompt using AI
          const promptText = await generateAIResponse(
            'Generate visual prompts for AI image generation',
            JSON.stringify(promptContext)
          );

          // This is a simplified mock implementation
          const newPrompt: GeneratedPrompt = {
            id: uuidv4(),
            shotId: shot.id,
            concise: `${selectedStyle.prefix} Medium shot of ${shot.people} in ${shot.location}. ${selectedStyle.suffix}`,
            normal: `${selectedStyle.prefix} Medium shot of ${shot.people} ${shot.action} in ${shot.location}. Camera follows the movement. ${selectedStyle.suffix}`,
            detailed: `${selectedStyle.prefix} Medium shot of ${shot.people} ${shot.action} in ${shot.location}. ${shot.description} Camera follows the movement with a slight handheld feel. ${filteredCameraSettings.depthOfField ? filteredCameraSettings.depthOfField + ' depth of field.' : ''} ${selectedStyle.suffix}`,
            timestamp: new Date().toISOString(),
          };

          const updatedPrompts = [...generatedPrompts, newPrompt];
          const workflowProgress = get().workflowProgress;

          set({
            generatedPrompts: updatedPrompts,
            workflowProgress: {
              ...workflowProgress,
              promptsCompleted: true,
            },
          });
          get().setKeytoState('generatedPrompts', updatedPrompts);
        } catch (error) {
          console.error('Failed to generate prompt:', error);
          throw error;
        } finally {
          useLoadingStore.getState().setLoading('generatePrompt', false);
        }
      },

      // Music Lab actions
      generateVideoTreatment: async (formData) => {
        useLoadingStore.getState().setLoading('generateTreatment', true);

        try {
          // In a real implementation, this would call an AI service
          const treatmentText = await generateAIResponse(
            'Generate a video treatment for this song',
            JSON.stringify(formData)
          );

          return treatmentText;
        } catch (error) {
          console.error('Failed to generate video treatment:', error);
          throw error;
        } finally {
          useLoadingStore.getState().setLoading('generateTreatment', false);
        }
      },
    }),
    {
      name: 'scriptvision-storage',
      storage: createJSONStorage(() => storage),
      // partialize: (state) => ({
      //   styles: state.styles,
      //   directorStyles: state.directorStyles,
      // }),
    }
  )
);
