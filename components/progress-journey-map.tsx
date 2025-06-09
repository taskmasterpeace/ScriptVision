'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/lib/stores/project-store';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';
import { useImageGenerationStore } from '@/lib/stores/image-generation-store';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Youtube,
  List,
  FileText,
  Sparkles,
  Camera,
  Users,
  Palette,
  Wand2,
  CheckCircle,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  phase: 'creation' | 'production' | 'generation';
  isCompleted: (state: any) => boolean;
  tabValue: string;
}

export function ProgressJourneyMap({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const projectState = useProjectStore();
  const scriptCreationState = useScriptCreationStore();
  const imageGenerationState = useImageGenerationStore();
  const [completionPercentage, setCompletionPercentage] = useState({
    creation: 0,
    production: 0,
    generation: 0,
    overall: 0,
  });

  const journeySteps: JourneyStep[] = [
    {
      id: 'story-theme',
      label: 'Theme',
      icon: <BookOpen className="h-5 w-5" />,
      phase: 'creation',
      isCompleted: () =>
        Boolean(
          scriptCreationState.storyTheme &&
            scriptCreationState.storyTheme.length > 0
        ),
      tabValue: 'story-theme',
    },
    {
      id: 'research',
      label: 'Research',
      icon: <Youtube className="h-5 w-5" />,
      phase: 'creation',
      isCompleted: () => scriptCreationState.selectedTranscripts.length > 0,
      tabValue: 'research',
    },
    {
      id: 'outline',
      label: 'Outline',
      icon: <List className="h-5 w-5" />,
      phase: 'creation',
      isCompleted: () => scriptCreationState.chapters.length > 0,
      tabValue: 'outline',
    },
    {
      id: 'write',
      label: 'Write',
      icon: <FileText className="h-5 w-5" />,
      phase: 'creation',
      isCompleted: () => scriptCreationState.generatedChapters.length > 0,
      tabValue: 'write',
    },
    {
      id: 'enhance',
      label: 'Enhance',
      icon: <Sparkles className="h-5 w-5" />,
      phase: 'creation',
      isCompleted: () => scriptCreationState.enhancedChapters.length > 0,
      tabValue: 'enhance',
    },
    {
      id: 'script',
      label: 'Script',
      icon: <FileText className="h-5 w-5" />,
      phase: 'production',
      isCompleted: () =>
        Boolean(projectState.script && projectState.script.length > 0),
      tabValue: 'script',
    },
    {
      id: 'shotlist',
      label: 'Shots',
      icon: <Camera className="h-5 w-5" />,
      phase: 'production',
      isCompleted: () => projectState.shotList.length > 0,
      tabValue: 'shotlist',
    },
    {
      id: 'subjects',
      label: 'Subjects',
      icon: <Users className="h-5 w-5" />,
      phase: 'production',
      isCompleted: () => projectState.subjects.length > 0,
      tabValue: 'subjects',
    },
    {
      id: 'styles',
      label: 'Styles',
      icon: <Palette className="h-5 w-5" />,
      phase: 'production',
      isCompleted: () => Boolean(projectState.selectedStyle),
      tabValue: 'styles',
    },
    {
      id: 'prompts',
      label: 'Prompts',
      icon: <Wand2 className="h-5 w-5" />,
      phase: 'production',
      isCompleted: () => projectState.generatedPrompts.length > 0,
      tabValue: 'prompts',
    },
    {
      id: 'images',
      label: 'Images',
      icon: <ImageIcon className="h-5 w-5" />,
      phase: 'generation',
      isCompleted: () => imageGenerationState.generatedImages.length > 0,
      tabValue: 'images',
    },
  ];

  // Calculate completion percentages
  useEffect(() => {
    const creationSteps = journeySteps.filter(
      (step) => step.phase === 'creation'
    );
    const productionSteps = journeySteps.filter(
      (step) => step.phase === 'production'
    );
    const generationSteps = journeySteps.filter(
      (step) => step.phase === 'generation'
    );

    const creationCompleted = creationSteps.filter((step) =>
      step.isCompleted(scriptCreationState)
    ).length;
    const productionCompleted = productionSteps.filter((step) =>
      step.isCompleted(projectState)
    ).length;
    const generationCompleted = generationSteps.filter((step) =>
      step.isCompleted(imageGenerationState)
    ).length;
    const totalCompleted =
      creationCompleted + productionCompleted + generationCompleted;

    setCompletionPercentage({
      creation: Math.round((creationCompleted / creationSteps.length) * 100),
      production: Math.round(
        (productionCompleted / productionSteps.length) * 100
      ),
      generation: Math.round(
        (generationCompleted / generationSteps.length) * 100
      ),
      overall: Math.round((totalCompleted / journeySteps.length) * 100),
    });
  }, [projectState, scriptCreationState, imageGenerationState]);

  const creationSteps = journeySteps.filter(
    (step) => step.phase === 'creation'
  );
  const productionSteps = journeySteps.filter(
    (step) => step.phase === 'production'
  );
  const generationSteps = journeySteps.filter(
    (step) => step.phase === 'generation'
  );

  return (
    <div className="mb-6 bg-card border rounded-lg p-6 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Your Story Journey</h3>
          <p className="text-sm text-muted-foreground">
            Track your progress through the story creation process
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm font-medium">Creation</span>
            <span className="text-sm font-bold">
              {completionPercentage.creation}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-sm font-medium">Production</span>
            <span className="text-sm font-bold">
              {completionPercentage.production}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium">Generation</span>
            <span className="text-sm font-bold">
              {completionPercentage.generation}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium">Overall</span>
            <span className="text-sm font-bold">
              {completionPercentage.overall}%
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Overall progress bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 rounded-full">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage.overall}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Creation Phase */}
          <div className="relative">
            <div className="absolute -top-3 left-0 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage.creation}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-purple-800 dark:text-purple-300">
                  Script Creation
                </h4>
                <span className="text-sm font-bold text-purple-800 dark:text-purple-300">
                  {completionPercentage.creation}% Complete
                </span>
              </div>

              <div className="flex overflow-x-auto pb-2 gap-2">
                {creationSteps.map((step, index) => {
                  const isCompleted = step.isCompleted(scriptCreationState);
                  const isActive = activeTab === step.tabValue;

                  return (
                    <button
                      key={step.id}
                      onClick={() => onTabChange(step.tabValue)}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-all',
                          isActive
                            ? 'bg-purple-600 text-white ring-4 ring-purple-200'
                            : isCompleted
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </motion.div>
                        )}
                        {step.icon}
                      </div>
                      <span className="text-xs font-medium text-center">
                        {step.label}
                      </span>
                      {index < creationSteps.length - 1 && (
                        <div className="absolute top-6 left-[calc(100%-6px)] w-[calc(100%-12px)] h-0.5 bg-gray-200 -z-10"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Production Phase */}
          <div className="relative">
            <div className="absolute -top-3 left-0 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage.production}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-amber-800 dark:text-amber-300">
                  Production
                </h4>
                <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {completionPercentage.production}% Complete
                </span>
              </div>

              <div className="flex overflow-x-auto pb-2 gap-2">
                {productionSteps.map((step, index) => {
                  const isCompleted = step.isCompleted(projectState);
                  const isActive = activeTab === step.tabValue;

                  return (
                    <button
                      key={step.id}
                      onClick={() => onTabChange(step.tabValue)}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-all',
                          isActive
                            ? 'bg-amber-600 text-white ring-4 ring-amber-200'
                            : isCompleted
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </motion.div>
                        )}
                        {step.icon}
                      </div>
                      <span className="text-xs font-medium text-center">
                        {step.label}
                      </span>
                      {index < productionSteps.length - 1 && (
                        <div className="absolute top-6 left-[calc(100%-6px)] w-[calc(100%-12px)] h-0.5 bg-gray-200 -z-10"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generation Phase */}
          <div className="relative">
            <div className="absolute -top-3 left-0 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage.generation}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="border rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
                  Image Generation
                </h4>
                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  {completionPercentage.generation}% Complete
                </span>
              </div>

              <div className="flex overflow-x-auto pb-2 gap-2">
                {generationSteps.map((step, index) => {
                  const isCompleted = step.isCompleted(imageGenerationState);
                  const isActive = activeTab === step.tabValue;

                  return (
                    <button
                      key={step.id}
                      onClick={() => onTabChange(step.tabValue)}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-all',
                          isActive
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                            : isCompleted
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </motion.div>
                        )}
                        {step.icon}
                      </div>
                      <span className="text-xs font-medium text-center">
                        {step.label}
                      </span>
                      {index < generationSteps.length - 1 && (
                        <div className="absolute top-6 left-[calc(100%-6px)] w-[calc(100%-12px)] h-0.5 bg-gray-200 -z-10"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
