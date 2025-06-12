'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/lib/stores/project-store';
import {
  useImageGenerationStore,
  type GeneratedImage,
  type ImageGenerationSettings,
} from '@/lib/stores/image-generation-store';
import { useModelStore } from '@/lib/stores/model-store';
import {
  createPrediction,
  waitForPrediction,
  cancelPrediction,
  generateMockImageUrl,
} from '@/lib/replicate-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertTriangle,
  Download,
  FileUp,
  ImageIcon,
  Loader2,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Papa from 'papaparse';

export default function BulkImageGeneration() {
  const { toast } = useToast();
  const { generatedPrompts } = useProjectStore();
  const { replicateApiToken } = useModelStore();
  const {
    selectedPromptIds,
    generatedImages,
    defaultSettings,
    isGenerating,
    selectPrompt,
    unselectPrompt,
    togglePromptSelection,
    selectAllPrompts,
    clearPromptSelection,
    updateDefaultSettings,
    addGeneratedImage,
    updateImageStatus,
    updateImagePredictionId,
    removeGeneratedImage,
    setIsGenerating,
  } = useImageGenerationStore();

  const [activeTab, setActiveTab] = useState('csv-upload');
  const [showSettings, setShowSettings] = useState(false);
  const [customSettings, setCustomSettings] = useState<ImageGenerationSettings>(
    { ...defaultSettings }
  );
  const [csvData, setCsvData] = useState<
    Array<{ prompt: string; id?: string; name?: string }>
  >([]);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if the Replicate API token is set
  const isReplicateConfigured = Boolean(replicateApiToken);

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Check if the CSV has the required columns
        const firstRow = results.data[0] as any;
        if (!firstRow || !('prompt' in firstRow)) {
          toast({
            title: 'Invalid CSV format',
            description: "The CSV file must contain a 'prompt' column.",
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        // Process the data
        const processedData = results.data
          .filter((row: any) => row.prompt && typeof row.prompt === 'string')
          .map((row: any) => ({
            prompt: row.prompt,
            id: row.id || uuidv4(),
            name: row.name || `Prompt ${row.id || 'unnamed'}`,
          }));

        setCsvData(processedData);
        setGenerationProgress({ current: 0, total: processedData.length });

        toast({
          title: 'CSV uploaded successfully',
          description: `Loaded ${processedData.length} prompts from the CSV file.`,
        });

        setIsUploading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast({
          title: 'Error parsing CSV',
          description: error.message,
          variant: 'destructive',
        });
        setIsUploading(false);
      },
    });
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Generate images from CSV data
  const generateImagesFromCSV = async () => {
    if (csvData.length === 0) {
      toast({
        title: 'No prompts loaded',
        description: 'Please upload a CSV file with prompts first.',
        variant: 'destructive',
      });
      return;
    }

    if (!isReplicateConfigured) {
      toast({
        title: 'Replicate API not configured',
        description: 'Please add your Replicate API token in the Models tab.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: csvData.length });

    try {
      // Process each prompt in the CSV
      for (let i = 0; i < csvData.length; i++) {
        const promptData = csvData[i];

        // Create a placeholder for the image
        const imageId = uuidv4();
        const newImage: GeneratedImage = {
          id: imageId,
          promptId: promptData.id || uuidv4(),
          imageUrl: '',
          timestamp: new Date().toISOString(),
          settings: { ...customSettings },
          status: 'generating',
          csvPrompt: promptData.prompt,
          csvName: promptData.name,
        };

        addGeneratedImage(newImage);

        try {
          // Create a prediction using the Replicate API
          const prediction = await createPrediction(
            promptData.prompt,
            customSettings
          );

          // Store the prediction ID with the image
          updateImagePredictionId(imageId, prediction.id);

          // Wait for the prediction to complete
          const result = await waitForPrediction(prediction.id);

          if (
            result.status === 'succeeded' &&
            result.output &&
            result.output.length > 0
          ) {
            // Update the image with the generated URL
            const updatedImage = {
              ...newImage,
              imageUrl: result.output[0],
              status: 'completed' as const,
            };

            // Remove the old placeholder and add the updated image
            removeGeneratedImage(imageId);
            addGeneratedImage(updatedImage);
          } else {
            updateImageStatus(
              imageId,
              'failed',
              result.error || 'No image was generated'
            );
          }
        } catch (error) {
          console.error(
            `Error generating image for prompt ${promptData.id}:`,
            error
          );
          updateImageStatus(
            imageId,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        // Update progress
        setGenerationProgress({ current: i + 1, total: csvData.length });
      }

      // Switch to the generated images tab
      setActiveTab('generated-images');

      toast({
        title: 'Bulk generation complete',
        description: `Generated images for ${csvData.length} prompts.`,
      });
    } catch (error) {
      console.error('Error in bulk image generation:', error);
      toast({
        title: 'Generation failed',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle downloading an image
  const handleDownloadImage = (image: GeneratedImage) => {
    if (!image.imageUrl) return;

    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `image-${image.id.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Image downloaded',
      description: 'The image has been downloaded to your device.',
    });
  };

  // Handle removing an image
  const handleRemoveImage = (imageId: string) => {
    removeGeneratedImage(imageId);

    toast({
      title: 'Image removed',
      description: 'The image has been removed from your collection.',
    });
  };

  // Handle canceling generation
  const handleCancelGeneration = async (imageId: string) => {
    const image = generatedImages.find((img) => img.id === imageId);
    if (!image || image.status !== 'generating' || !image.predictionId) return;

    try {
      // Cancel the prediction using the Replicate API
      await cancelPrediction(image.predictionId);

      // Update the image status
      updateImageStatus(imageId, 'failed', 'Generation canceled by user');

      toast({
        title: 'Generation canceled',
        description: 'The image generation has been canceled.',
      });
    } catch (error) {
      console.error('Error canceling generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel image generation.',
        variant: 'destructive',
      });
    }
  };

  // Update settings
  const handleUpdateSettings = () => {
    updateDefaultSettings(customSettings);
    setShowSettings(false);

    toast({
      title: 'Settings updated',
      description: 'Your image generation settings have been updated.',
    });
  };

  // Reset settings to defaults
  const handleResetSettings = () => {
    const defaultImageSettings = {
      aspectRatio: '1:1',
      guidance: 3,
      numInferenceSteps: 28,
      seed: null,
      numOutputs: 1,
      loraWeights: '',
    };

    setCustomSettings(defaultImageSettings);
    updateDefaultSettings(defaultImageSettings);

    toast({
      title: 'Settings reset',
      description: 'Image generation settings have been reset to defaults.',
    });
  };

  // Download a CSV template
  const downloadCSVTemplate = () => {
    const csvContent =
      'prompt,id,name\n"A cinematic shot of a mountain landscape",1,Mountain Scene\n"A close-up portrait of a person with dramatic lighting",2,Portrait';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'prompt_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Template downloaded',
      description: 'CSV template has been downloaded to your device.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Image Generation</CardTitle>
      </CardHeader>
      <CardContent>
        {!isReplicateConfigured && (
          <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">
                Replicate API Not Configured
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                To generate images, you need to add your Replicate API token in
                the Models tab.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() =>
                  (window.location.href = '#developer-tab-trigger')
                }
              >
                Go to Models Tab
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="csv-upload">CSV Upload</TabsTrigger>
            <TabsTrigger value="generated-images">
              Generated Images{' '}
              {generatedImages.filter((img) => img.csvPrompt).length > 0 &&
                `(${generatedImages.filter((img) => img.csvPrompt).length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv-upload">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Upload Prompts CSV</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a CSV file with prompts to generate images in bulk
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCSVTemplate}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {showSettings ? 'Hide Settings' : 'Show Settings'}
                  </Button>
                </div>
              </div>

              <div className="border-2 border-dashed rounded-md p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-4" />

                <h3 className="font-medium mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Upload a CSV file with a 'prompt' column containing the text
                  prompts for image generation. Optionally include 'id' and
                  'name' columns.
                </p>

                <Button onClick={triggerFileUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select CSV File
                    </>
                  )}
                </Button>
              </div>

              {showSettings && (
                <Card className="border-dashed">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">
                      Image Generation Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                        <Select
                          value={customSettings.aspectRatio}
                          onValueChange={(value) =>
                            setCustomSettings({
                              ...customSettings,
                              aspectRatio: value,
                            })
                          }
                        >
                          <SelectTrigger id="aspect-ratio">
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="16:9">
                              16:9 (Landscape)
                            </SelectItem>
                            <SelectItem value="9:16">
                              9:16 (Portrait)
                            </SelectItem>
                            <SelectItem value="3:2">
                              3:2 (Standard Photo)
                            </SelectItem>
                            <SelectItem value="2:3">
                              2:3 (Portrait Photo)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lora-weights">
                          LoRA Weights (Optional)
                        </Label>
                        <Input
                          id="lora-weights"
                          placeholder="e.g., fofr/flux-80s-cyberpunk"
                          value={customSettings.loraWeights}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              loraWeights: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Add a style using LoRA weights from Replicate
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guidance">
                          Guidance Scale: {customSettings.guidance}
                        </Label>
                        <Input
                          id="guidance"
                          type="range"
                          min={0}
                          max={10}
                          step={0.1}
                          value={customSettings.guidance}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              guidance: Number.parseFloat(e.target.value),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          How closely to follow the prompt (higher = more
                          faithful)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="steps">
                          Inference Steps: {customSettings.numInferenceSteps}
                        </Label>
                        <Input
                          id="steps"
                          type="range"
                          min={1}
                          max={50}
                          step={1}
                          value={customSettings.numInferenceSteps}
                          onChange={(e) =>
                            setCustomSettings({
                              ...customSettings,
                              numInferenceSteps: Number.parseInt(
                                e.target.value
                              ),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          More steps = higher quality but slower generation
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seed">Random Seed (Optional)</Label>
                        <Input
                          id="seed"
                          type="number"
                          placeholder="Leave empty for random"
                          value={
                            customSettings.seed !== null
                              ? customSettings.seed
                              : ''
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value === ''
                                ? null
                                : Number.parseInt(e.target.value);
                            setCustomSettings({
                              ...customSettings,
                              seed: value,
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Set for reproducible results
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="num-outputs">Number of Outputs</Label>
                        <Select
                          value={customSettings.numOutputs.toString()}
                          onValueChange={(value) =>
                            setCustomSettings({
                              ...customSettings,
                              numOutputs: Number.parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger id="num-outputs">
                            <SelectValue placeholder="Select number of outputs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 image</SelectItem>
                            <SelectItem value="2">2 images</SelectItem>
                            <SelectItem value="3">3 images</SelectItem>
                            <SelectItem value="4">4 images</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetSettings}
                      >
                        Reset to Defaults
                      </Button>
                      <Button size="sm" onClick={handleUpdateSettings}>
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {csvData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Loaded Prompts</h3>
                    <Badge variant="outline">{csvData.length} prompts</Badge>
                  </div>

                  <div className="border rounded-md max-h-[300px] overflow-y-auto">
                    <div className="p-3 bg-muted/20 border-b grid grid-cols-12 gap-2 font-medium text-sm">
                      <div className="col-span-1">#</div>
                      <div className="col-span-3">Name</div>
                      <div className="col-span-8">Prompt</div>
                    </div>

                    <div className="divide-y">
                      {csvData.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 grid grid-cols-12 gap-2 text-sm"
                        >
                          <div className="col-span-1">{index + 1}</div>
                          <div className="col-span-3">
                            {item.name || `Prompt ${index + 1}`}
                          </div>
                          <div className="col-span-8 font-mono line-clamp-2">
                            {item.prompt}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={generateImagesFromCSV}
                      disabled={isGenerating || !isReplicateConfigured}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating {generationProgress.current} of{' '}
                          {generationProgress.total}...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Generate {csvData.length} Images
                        </>
                      )}
                    </Button>
                  </div>

                  {isGenerating && (
                    <Progress
                      value={
                        (generationProgress.current /
                          generationProgress.total) *
                        100
                      }
                      className="h-2"
                    />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="generated-images">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Generated Images from CSV</h3>

                <Button
                  onClick={() => setActiveTab('csv-upload')}
                  variant="outline"
                >
                  Back to CSV Upload
                </Button>
              </div>

              {generatedImages.filter((img) => img.csvPrompt).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedImages
                    .filter((img) => img.csvPrompt)
                    .map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="relative aspect-square bg-muted/30">
                          {image.status === 'generating' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              <span className="sr-only">
                                Generating image...
                              </span>
                            </div>
                          ) : image.status === 'failed' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                              <p className="text-sm text-center text-destructive">
                                {image.error || 'Failed to generate image'}
                              </p>
                            </div>
                          ) : (
                            <img
                              src={image.imageUrl || generateMockImageUrl()}
                              alt={image.csvName || 'Generated image'}
                              className="w-full h-full object-cover"
                            />
                          )}

                          <div className="absolute top-2 right-2 flex gap-1">
                            {image.status === 'generating' && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                                onClick={() => handleCancelGeneration(image.id)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">
                                  Cancel generation
                                </span>
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                              onClick={() => handleRemoveImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove image</span>
                            </Button>

                            {image.status === 'completed' && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                                onClick={() => handleDownloadImage(image)}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download image</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-3">
                          <div className="text-sm font-medium mb-1 truncate">
                            {image.csvName || 'Unnamed prompt'}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2 font-mono">
                            {image.csvPrompt || 'No prompt available'}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {image.settings.aspectRatio}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Steps: {image.settings.numInferenceSteps}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              CFG: {image.settings.guidance}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">
                    No images generated from CSV yet.
                  </p>
                  <Button
                    onClick={() => setActiveTab('csv-upload')}
                    className="mt-4"
                  >
                    Upload CSV
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
