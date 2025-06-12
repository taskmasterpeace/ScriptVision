'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/lib/stores/project-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Shot, Subject } from '@/lib/types';
import { AlertCircle, Copy, Download, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import BulkPromptAnalysis from './bulk-prompt-analysis';

// Import the loading store at the top of the file
import { useLoadingStore } from '@/lib/stores/loading-store';

export default function PromptsTab() {
  const { toast } = useToast();
  const {
    shotList,
    subjects,
    styles,
    directorStyles,
    selectedStyle,
    selectedDirectorStyle,
    generatedPrompts,
    generatePrompt,
    setSelectedStyle,
    setSelectedDirectorStyle,
  } = useProjectStore();

  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [cameraSettings, setCameraSettings] = useState({
    shot: 'none',
    move: 'none',
    size: 'none',
    framing: 'none',
    depthOfField: 'none',
    type: 'none',
    name: 'none',
    lensType: 'none',
  });

  // Use the loading store
  const { isLoading } = useLoadingStore();

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('shot-selection');

  // Track the number of prompts to detect changes
  const [promptCount, setPromptCount] = useState(generatedPrompts.length);

  // State for selected prompts for export
  const [selectedPrompts, setSelectedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);
  const [bulkGenerationShots, setBulkGenerationShots] = useState<string[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState(0);
  const [bulkGenerationTotal, setBulkGenerationTotal] = useState(0);

  // Update currentPromptIndex when new prompts are generated
  useEffect(() => {
    if (generatedPrompts.length > promptCount) {
      setCurrentPromptIndex(generatedPrompts.length - 1);
      setPromptCount(generatedPrompts.length);
    }
  }, [generatedPrompts.length, promptCount]);

  // Check if the minimum requirements are met to generate a prompt
  const canGeneratePrompt = selectedShot !== null && selectedStyle !== null;

  // Helper function to apply LORA replacements to a prompt
  const applyLoraReplacements = (
    prompt: string,
    activeSubjects: Subject[]
  ): string => {
    // Start with an empty array of LORA triggers
    const loraTriggers: string[] = [];
    let modifiedPrompt = prompt;

    // Process each subject with a LORA trigger
    activeSubjects.forEach((subject) => {
      if (subject.loraTrigger && subject.loraTrigger.trim()) {
        // Add to the beginning LORA triggers
        loraTriggers.push(subject.loraTrigger.trim());

        // Replace the subject name with the LORA trigger in the prompt
        const nameRegex = new RegExp(`\\b${subject.name}\\b`, 'gi');
        modifiedPrompt = modifiedPrompt.replace(
          nameRegex,
          subject.loraTrigger.trim()
        );

        // Also replace aliases if they exist
        if (subject.alias) {
          const aliasRegex = new RegExp(`\\b${subject.alias}\\b`, 'gi');
          modifiedPrompt = modifiedPrompt.replace(
            aliasRegex,
            subject.loraTrigger.trim()
          );
        }
      }
    });

    // Combine all LORA triggers at the beginning of the prompt
    if (loraTriggers.length > 0) {
      return `${loraTriggers.join(', ')} ${modifiedPrompt}`;
    }

    return modifiedPrompt;
  };

  const handleGeneratePrompt = async () => {
    if (!selectedShot) {
      toast({
        title: 'Shot Required',
        description: 'Please select a shot to generate a prompt.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedStyle) {
      toast({
        title: 'Style Required',
        description: 'Please select a visual style from the Styles tab.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const activeSubjects = subjects.filter(
        (subject) => subject.active && selectedSubjects.includes(subject.id)
      );

      // Filter out "none" values from camera settings
      const filteredCameraSettings = Object.fromEntries(
        Object.entries(cameraSettings).filter(([_, value]) => value !== 'none')
      );

      await generatePrompt(
        selectedShot,
        activeSubjects,
        filteredCameraSettings
      );

      // Update the current prompt index to show the newly generated prompt
      setCurrentPromptIndex(generatedPrompts.length);

      // Switch to the generated prompts tab
      setActiveTab('generated-prompts');

      toast({
        title: 'Prompt Generated',
        description: 'Visual prompt has been successfully generated.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate prompt.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: `${type} prompt has been copied to clipboard.`,
    });
  };

  // Get the active subjects for the current selection
  const activeSelectedSubjects = subjects.filter(
    (subject) => subject.active && selectedSubjects.includes(subject.id)
  );

  // Apply LORA replacements to the current prompt if it exists
  const currentPrompt = generatedPrompts[currentPromptIndex];
  const processedPrompt = currentPrompt
    ? {
        ...currentPrompt,
        concise: applyLoraReplacements(
          currentPrompt.concise,
          activeSelectedSubjects
        ),
        normal: applyLoraReplacements(
          currentPrompt.normal,
          activeSelectedSubjects
        ),
        detailed: applyLoraReplacements(
          currentPrompt.detailed,
          activeSelectedSubjects
        ),
      }
    : null;

  // Toggle prompt selection for export
  const togglePromptSelection = (promptId: string) => {
    setSelectedPrompts((prev) => ({
      ...prev,
      [promptId]: !prev[promptId],
    }));
  };

  // Toggle expanded state for a prompt
  const toggleExpandPrompt = (promptId: string) => {
    setExpandedPrompts((prev) =>
      prev.includes(promptId)
        ? prev.filter((id) => id !== promptId)
        : [...prev, promptId]
    );
  };

  // Export selected prompts as CSV
  const exportSelectedPrompts = () => {
    const selectedPromptIds = Object.entries(selectedPrompts)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedPromptIds.length === 0) {
      toast({
        title: 'No Prompts Selected',
        description: 'Please select at least one prompt to export.',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    let csvContent = 'Shot,Scene,Description,PromptType,Prompt\n';

    selectedPromptIds.forEach((promptId) => {
      const prompt = generatedPrompts.find((p) => p.id === promptId);
      if (!prompt) return;

      const shot = shotList.find((s) => s.id === prompt.shotId);
      if (!shot) return;

      // Add concise prompt
      csvContent += `"${shot.shot}","${shot.scene}","${shot.description.replace(/"/g, '""')}","Concise","${prompt.concise.replace(/"/g, '""')}"\n`;

      // Add normal prompt
      csvContent += `"${shot.shot}","${shot.scene}","${shot.description.replace(/"/g, '""')}","Normal","${prompt.normal.replace(/"/g, '""')}"\n`;

      // Add detailed prompt
      csvContent += `"${shot.shot}","${shot.scene}","${shot.description.replace(/"/g, '""')}","Detailed","${prompt.detailed.replace(/"/g, '""')}"\n`;
    });

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'visual_prompts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `${selectedPromptIds.length} prompts exported as CSV.`,
    });
  };

  // Toggle selection of a shot for bulk generation
  const toggleBulkGenerationShot = (shotId: string) => {
    setBulkGenerationShots((prev) =>
      prev.includes(shotId)
        ? prev.filter((id) => id !== shotId)
        : [...prev, shotId]
    );
  };

  // Select all shots for bulk generation
  const selectAllShotsForBulkGeneration = () => {
    setBulkGenerationShots(shotList.map((shot) => shot.id));
  };

  // Deselect all shots for bulk generation
  const deselectAllShotsForBulkGeneration = () => {
    setBulkGenerationShots([]);
  };

  // Generate prompts in bulk for selected shots
  const handleBulkGeneration = async () => {
    if (bulkGenerationShots.length === 0) {
      toast({
        title: 'No Shots Selected',
        description: 'Please select at least one shot for bulk generation.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedStyle) {
      toast({
        title: 'Style Required',
        description: 'Please select a visual style from the Styles tab.',
        variant: 'destructive',
      });
      return;
    }

    setIsBulkGenerating(true);
    setBulkGenerationProgress(0);
    setBulkGenerationTotal(bulkGenerationShots.length);

    try {
      // Filter out "none" values from camera settings
      const filteredCameraSettings = Object.fromEntries(
        Object.entries(cameraSettings).filter(([_, value]) => value !== 'none')
      );

      const activeSubjects = subjects.filter(
        (subject) => subject.active && selectedSubjects.includes(subject.id)
      );

      // Process each shot
      for (let i = 0; i < bulkGenerationShots.length; i++) {
        const shotId = bulkGenerationShots[i];
        const shot = shotList.find((s) => s.id === shotId);

        if (shot) {
          await generatePrompt(shot, activeSubjects, filteredCameraSettings);
          setBulkGenerationProgress(i + 1);
        }
      }

      // Switch to the generated prompts tab
      setActiveTab('generated-prompts');

      toast({
        title: 'Bulk Generation Complete',
        description: `Generated prompts for ${bulkGenerationProgress} shots.`,
      });
    } catch (error) {
      toast({
        title: 'Bulk Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate prompts in bulk.',
        variant: 'destructive',
      });
    } finally {
      setIsBulkGenerating(false);
    }
  };

  // Select all prompts for export
  const selectAllPrompts = () => {
    const allPrompts = generatedPrompts.reduce(
      (acc, prompt) => {
        acc[prompt.id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );

    setSelectedPrompts(allPrompts);
  };

  // Deselect all prompts
  const deselectAllPrompts = () => {
    setSelectedPrompts({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Generator</CardTitle>
        <CardDescription>
          Generate detailed visual prompts for AI image generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="shot-selection">Shot Selection</TabsTrigger>
            <TabsTrigger value="style-selection">Style Selection</TabsTrigger>
            <TabsTrigger value="camera-settings">
              Camera Settings (Optional)
            </TabsTrigger>
            <TabsTrigger value="bulk-generation">Bulk Generation</TabsTrigger>
            <TabsTrigger value="generated-prompts">
              Generated Prompts{' '}
              {generatedPrompts.length > 0 && `(${generatedPrompts.length})`}
            </TabsTrigger>
            <TabsTrigger value="prompt-analysis">Prompt Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="shot-selection">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Shot Selection</h3>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm text-red-500">Required</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shot-select">Select Shot</Label>
                  <Select
                    value={selectedShot?.id || ''}
                    onValueChange={(value) => {
                      const shot = shotList.find((s) => s.id === value);
                      setSelectedShot(shot || null);
                    }}
                  >
                    <SelectTrigger id="shot-select">
                      <SelectValue placeholder="Select a shot" />
                    </SelectTrigger>
                    <SelectContent>
                      {shotList.map((shot) => (
                        <SelectItem key={shot.id} value={shot.id || 'none'}>
                          Scene {shot.scene}, Shot {shot.shot} -{' '}
                          {shot.description.substring(0, 30)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedShot && (
                  <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                    <p>
                      <span className="font-medium">Scene:</span>{' '}
                      {selectedShot.scene}
                    </p>
                    <p>
                      <span className="font-medium">Shot:</span>{' '}
                      {selectedShot.shot}
                    </p>
                    <p>
                      <span className="font-medium">Description:</span>{' '}
                      {selectedShot.description}
                    </p>
                    {selectedShot.directorsNotes && (
                      <p>
                        <span className="font-medium">Director's Notes:</span>{' '}
                        {selectedShot.directorsNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Subject Selection</h3>
                <div className="h-48 overflow-y-auto border rounded-md p-2">
                  {subjects.filter((subject) => subject.active).length > 0 ? (
                    subjects
                      .filter((subject) => subject.active)
                      .map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center space-x-2 py-1"
                        >
                          <input
                            type="checkbox"
                            id={`subject-${subject.id}`}
                            checked={selectedSubjects.includes(subject.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjects([
                                  ...selectedSubjects,
                                  subject.id,
                                ]);
                              } else {
                                setSelectedSubjects(
                                  selectedSubjects.filter(
                                    (id) => id !== subject.id
                                  )
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label
                            htmlFor={`subject-${subject.id}`}
                            className="text-sm"
                          >
                            {subject.name} ({subject.category})
                            {subject.loraTrigger && (
                              <span className="ml-2 text-xs text-blue-500 font-mono">
                                {subject.loraTrigger}
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      No active subjects available. Add subjects in the Subjects
                      tab.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('style-selection')}
                >
                  Skip to Style Selection
                </Button>
                <Button onClick={() => setActiveTab('style-selection')}>
                  Continue to Style Selection
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style-selection">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Style Selection</h3>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm text-red-500">Required</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visual-style">Visual Style</Label>
                    <Select
                      value={selectedStyle?.id || ''}
                      onValueChange={(value) => {
                        const style = styles.find((s) => s.id === value);
                        if (style) setSelectedStyle(style);
                      }}
                    >
                      <SelectTrigger id="visual-style">
                        <SelectValue placeholder="Select visual style" />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((style) => (
                          <SelectItem key={style.id} value={style.id || 'none'}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="director-style">
                      Director Style (Optional)
                    </Label>
                    <Select
                      value={selectedDirectorStyle?.id || ''}
                      onValueChange={(value) => {
                        const style = directorStyles.find(
                          (s) => s.id === value
                        );
                        if (style) setSelectedDirectorStyle(style);
                      }}
                    >
                      <SelectTrigger id="director-style">
                        <SelectValue placeholder="Select director style" />
                      </SelectTrigger>
                      <SelectContent>
                        {directorStyles.map((style) => (
                          <SelectItem key={style.id} value={style.id || 'none'}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedStyle && (
                  <div className="p-4 border rounded-md space-y-2">
                    <p>
                      <span className="font-medium">Style:</span>{' '}
                      {selectedStyle.name}
                    </p>
                    {selectedStyle.genre && (
                      <p>
                        <span className="font-medium">Genre:</span>{' '}
                        {selectedStyle.genre}
                      </p>
                    )}
                    {selectedStyle.descriptors && (
                      <p>
                        <span className="font-medium">Descriptors:</span>{' '}
                        {selectedStyle.descriptors}
                      </p>
                    )}
                  </div>
                )}

                {selectedDirectorStyle && (
                  <div className="p-4 border rounded-md space-y-2">
                    <p>
                      <span className="font-medium">Director:</span>{' '}
                      {selectedDirectorStyle.name}
                    </p>
                    {selectedDirectorStyle.visualStyle && (
                      <p>
                        <span className="font-medium">Visual Style:</span>{' '}
                        {selectedDirectorStyle.visualStyle}
                      </p>
                    )}
                    {selectedDirectorStyle.narrativeApproach && (
                      <p>
                        <span className="font-medium">Narrative Approach:</span>{' '}
                        {selectedDirectorStyle.narrativeApproach}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('shot-selection')}
                >
                  Back to Shot Selection
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('camera-settings')}
                  >
                    Continue to Camera Settings
                  </Button>
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={isLoading('generatePrompt') || !canGeneratePrompt}
                  >
                    {isLoading('generatePrompt') ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Prompt'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="camera-settings">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Camera Settings</h3>
                  <span className="text-sm text-muted-foreground">
                    Optional
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="camera-shot">Camera Shot</Label>
                    <Select
                      value={cameraSettings.shot}
                      onValueChange={(value) =>
                        setCameraSettings({ ...cameraSettings, shot: value })
                      }
                    >
                      <SelectTrigger id="camera-shot">
                        <SelectValue placeholder="Select camera shot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Static">Static</SelectItem>
                        <SelectItem value="Handheld">Handheld</SelectItem>
                        <SelectItem value="Steadicam">Steadicam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camera-move">Camera Movement</Label>
                    <Select
                      value={cameraSettings.move}
                      onValueChange={(value) =>
                        setCameraSettings({ ...cameraSettings, move: value })
                      }
                    >
                      <SelectTrigger id="camera-move">
                        <SelectValue placeholder="Select movement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Pan">Pan</SelectItem>
                        <SelectItem value="Tilt">Tilt</SelectItem>
                        <SelectItem value="Dolly">Dolly</SelectItem>
                        <SelectItem value="Tracking">Tracking</SelectItem>
                        <SelectItem value="Crane">Crane</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camera-size">Shot Size</Label>
                    <Select
                      value={cameraSettings.size}
                      onValueChange={(value) =>
                        setCameraSettings({ ...cameraSettings, size: value })
                      }
                    >
                      <SelectTrigger id="camera-size">
                        <SelectValue placeholder="Select shot size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="ECU">
                          Extreme Close-Up (ECU)
                        </SelectItem>
                        <SelectItem value="CU">Close-Up (CU)</SelectItem>
                        <SelectItem value="MCU">
                          Medium Close-Up (MCU)
                        </SelectItem>
                        <SelectItem value="MS">Medium Shot (MS)</SelectItem>
                        <SelectItem value="MLS">
                          Medium Long Shot (MLS)
                        </SelectItem>
                        <SelectItem value="LS">Long Shot (LS)</SelectItem>
                        <SelectItem value="ELS">
                          Extreme Long Shot (ELS)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camera-framing">Framing</Label>
                    <Select
                      value={cameraSettings.framing}
                      onValueChange={(value) =>
                        setCameraSettings({ ...cameraSettings, framing: value })
                      }
                    >
                      <SelectTrigger id="camera-framing">
                        <SelectValue placeholder="Select framing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Centered">Centered</SelectItem>
                        <SelectItem value="Rule of Thirds">
                          Rule of Thirds
                        </SelectItem>
                        <SelectItem value="Dutch Angle">Dutch Angle</SelectItem>
                        <SelectItem value="Over the Shoulder">
                          Over the Shoulder
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camera-dof">Depth of Field</Label>
                    <Select
                      value={cameraSettings.depthOfField}
                      onValueChange={(value) =>
                        setCameraSettings({
                          ...cameraSettings,
                          depthOfField: value,
                        })
                      }
                    >
                      <SelectTrigger id="camera-dof">
                        <SelectValue placeholder="Select depth of field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Shallow">Shallow</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Deep">Deep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camera-type">Camera Type</Label>
                    <Select
                      value={cameraSettings.type}
                      onValueChange={(value) =>
                        setCameraSettings({ ...cameraSettings, type: value })
                      }
                    >
                      <SelectTrigger id="camera-type">
                        <SelectValue placeholder="Select camera type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Digital">Digital</SelectItem>
                        <SelectItem value="Film">Film</SelectItem>
                        <SelectItem value="IMAX">IMAX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('style-selection')}
                >
                  Back to Style Selection
                </Button>
                <Button
                  onClick={handleGeneratePrompt}
                  disabled={isLoading('generatePrompt') || !canGeneratePrompt}
                >
                  {isLoading('generatePrompt') ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Prompt'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk-generation">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Bulk Prompt Generation
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    Generate prompts for multiple shots at once
                  </span>
                </div>

                <div className="p-4 border rounded-md bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Select Shots for Bulk Generation
                    </h4>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllShotsForBulkGeneration}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAllShotsForBulkGeneration}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <div className="h-64 overflow-y-auto border rounded-md p-2">
                    {shotList.length > 0 ? (
                      shotList.map((shot) => (
                        <div
                          key={shot.id}
                          className="flex items-center space-x-2 py-1 border-b last:border-b-0"
                        >
                          <Checkbox
                            id={`bulk-shot-${shot.id}`}
                            checked={bulkGenerationShots.includes(shot.id)}
                            onCheckedChange={() =>
                              toggleBulkGenerationShot(shot.id)
                            }
                          />
                          <label
                            htmlFor={`bulk-shot-${shot.id}`}
                            className="text-sm flex-1"
                          >
                            Scene {shot.scene}, Shot {shot.shot} -{' '}
                            {shot.description.substring(0, 50)}
                            {shot.description.length > 50 ? '...' : ''}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-muted-foreground">
                        No shots available. Create shots in the Shot List tab.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {bulkGenerationShots.length} of {shotList.length} shots
                        selected
                      </span>
                    </div>
                    <Button
                      onClick={handleBulkGeneration}
                      disabled={
                        isBulkGenerating ||
                        bulkGenerationShots.length === 0 ||
                        !selectedStyle ||
                        isLoading('generatePrompt')
                      }
                    >
                      {isBulkGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating {bulkGenerationProgress} of{' '}
                          {bulkGenerationTotal}...
                        </>
                      ) : (
                        'Generate Prompts for Selected Shots'
                      )}
                    </Button>
                  </div>

                  {isBulkGenerating && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(bulkGenerationProgress / bulkGenerationTotal) * 100}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-md bg-muted/30 space-y-4">
                  <h4 className="font-medium">
                    Style and Settings for Bulk Generation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Bulk generation will use the style and camera settings
                    you've configured in the previous tabs.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">
                        Selected Style
                      </h5>
                      {selectedStyle ? (
                        <p className="text-sm">{selectedStyle.name}</p>
                      ) : (
                        <p className="text-sm text-red-500">
                          No style selected
                        </p>
                      )}
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">
                        Selected Director Style
                      </h5>
                      {selectedDirectorStyle ? (
                        <p className="text-sm">{selectedDirectorStyle.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('style-selection')}
                    className="mt-2"
                  >
                    Change Style Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generated-prompts">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Generated Prompts</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllPrompts}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllPrompts}
                    >
                      Deselect All
                    </Button>
                    <Button
                      size="sm"
                      onClick={exportSelectedPrompts}
                      disabled={
                        Object.values(selectedPrompts).filter(Boolean)
                          .length === 0
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                  </div>
                </div>

                {generatedPrompts.length > 0 ? (
                  <div className="space-y-6">
                    {generatedPrompts.map((prompt, index) => {
                      const shot = shotList.find((s) => s.id === prompt.shotId);
                      if (!shot) return null;

                      // Apply LORA replacements
                      const processedPrompt = {
                        ...prompt,
                        concise: applyLoraReplacements(
                          prompt.concise,
                          activeSelectedSubjects
                        ),
                        normal: applyLoraReplacements(
                          prompt.normal,
                          activeSelectedSubjects
                        ),
                        detailed: applyLoraReplacements(
                          prompt.detailed,
                          activeSelectedSubjects
                        ),
                      };

                      const isExpanded = expandedPrompts.includes(prompt.id);
                      const isSelected = selectedPrompts[prompt.id] || false;

                      return (
                        <div
                          key={prompt.id}
                          className={`border rounded-lg overflow-hidden ${
                            isSelected ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between p-4 bg-muted/20">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`prompt-${prompt.id}`}
                                checked={isSelected}
                                onCheckedChange={() =>
                                  togglePromptSelection(prompt.id)
                                }
                              />
                              <div>
                                <h4 className="font-medium">
                                  Scene {shot.scene}, Shot {shot.shot}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {shot.description.substring(0, 50)}...
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandPrompt(prompt.id)}
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </Button>
                          </div>

                          <div className={`p-4 ${isExpanded ? '' : 'hidden'}`}>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium">
                                    Concise Prompt
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      copyToClipboard(
                                        processedPrompt.concise,
                                        'Concise'
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                                  {processedPrompt.concise}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium">Normal Prompt</h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      copyToClipboard(
                                        processedPrompt.normal,
                                        'Normal'
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                                  {processedPrompt.normal}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium">
                                    Detailed Prompt
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      copyToClipboard(
                                        processedPrompt.detailed,
                                        'Detailed'
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                                  {processedPrompt.detailed}
                                </div>
                              </div>
                            </div>
                          </div>

                          {!isExpanded && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium">
                                    Concise
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      copyToClipboard(
                                        processedPrompt.concise,
                                        'Concise'
                                      )
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="p-2 bg-muted rounded-md font-mono text-xs h-20 overflow-y-auto">
                                  {processedPrompt.concise}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium">
                                    Normal
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      copyToClipboard(
                                        processedPrompt.normal,
                                        'Normal'
                                      )
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="p-2 bg-muted rounded-md font-mono text-xs h-20 overflow-y-auto">
                                  {processedPrompt.normal}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium">
                                    Detailed
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      copyToClipboard(
                                        processedPrompt.detailed,
                                        'Detailed'
                                      )
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="p-2 bg-muted rounded-md font-mono text-xs h-20 overflow-y-auto">
                                  {processedPrompt.detailed}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    <p>No prompts generated yet.</p>
                    <Button
                      onClick={handleGeneratePrompt}
                      disabled={
                        isLoading('generatePrompt') || !canGeneratePrompt
                      }
                      className="mt-4"
                    >
                      {isLoading('generatePrompt') ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Prompt'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Summary of current selections */}
              <div className="space-y-4 mt-8 p-4 border rounded-md bg-muted/10">
                <h3 className="text-lg font-medium">Current Selections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Shot</h4>
                    {selectedShot ? (
                      <p>
                        Scene {selectedShot.scene}, Shot {selectedShot.shot}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No shot selected</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Style</h4>
                    {selectedStyle ? (
                      <p>{selectedStyle.name}</p>
                    ) : (
                      <p className="text-muted-foreground">No style selected</p>
                    )}
                  </div>
                </div>

                {activeSelectedSubjects.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Selected Subjects with LORA
                    </h4>
                    <div className="space-y-1">
                      {activeSelectedSubjects
                        .filter((subject) => subject.loraTrigger)
                        .map((subject) => (
                          <div key={subject.id} className="flex items-center">
                            <span className="text-sm">{subject.name}:</span>
                            <span className="ml-2 text-xs font-mono text-blue-500">
                              {subject.loraTrigger}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={isLoading('generatePrompt') || !canGeneratePrompt}
                  >
                    {isLoading('generatePrompt') ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate New Prompt'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompt-analysis">
            <BulkPromptAnalysis />
          </TabsContent>
        </Tabs>

        {/* Fixed action bar at the bottom */}
        <div className="mt-8 pt-4 border-t flex items-center justify-between">
          <div>
            {!canGeneratePrompt && (
              <div className="text-sm text-amber-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>
                  {!selectedShot && !selectedStyle
                    ? 'Please select a shot and a visual style'
                    : !selectedShot
                      ? 'Please select a shot'
                      : 'Please select a visual style'}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={handleGeneratePrompt}
            disabled={isLoading('generatePrompt') || !canGeneratePrompt}
            size="lg"
          >
            {isLoading('generatePrompt') ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Prompt'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
