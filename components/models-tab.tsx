"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useModelStore, type ApplicationPhase } from "@/lib/stores/model-store";
import { AlertTriangle, Check, RefreshCw, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ModelsTab() {
  const { toast } = useToast();
  const {
    apiKey,
    replicateApiToken,
    useMockData,
    phaseModelMapping,
    setApiKey,
    setReplicateApiToken,
    setUseMockData,
    setModelForPhase,
    resetToDefaults,
    isLoading,
    availableModels,
    fetchApiModels,
    selectedProviders,
    saveModel,
    loadModel,
    setSelectedProvider,
  } = useModelStore();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [replicateApiTokenInput, setReplicateApiTokenInput] =
    useState(replicateApiToken);
  const [activeTab, setActiveTab] = useState<string>("models");

  // Fetch models from API
  useEffect(() => {
    fetchApiModels();
    loadModel();
  }, []);

  // Get unique providers from available models (case-insensitive)
  const availableProviders = useMemo(() => {
    const providers = Array.from(
      new Set(availableModels.map((m) => m.provider))
    ).sort((a, b) => a.localeCompare(b));
    return providers;
  }, [availableModels]);

  // Get filtered models for a specific phase
  const getFilteredModels = (phase: string) => {
    const selectedProvider = selectedProviders[phase] || "openai";

    if (selectedProvider === "openai") {
      return availableModels?.filter((model) => model.provider.toLowerCase() === "openai");
    }

    return availableModels.filter(
      (model) => model.provider.toLowerCase() === selectedProvider.toLowerCase()
    );
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved.",
    });
  };

  const handleSaveReplicateApiToken = () => {
    setReplicateApiToken(replicateApiTokenInput);
    toast({
      title: "Replicate API Token Saved",
      description: "Your Replicate API token has been saved.",
    });
  };

  const handleToggleMockData = (checked: boolean) => {
    setUseMockData(checked);
    toast({
      title: checked ? 'Using Mock Data' : 'Using Live API',
      description: checked
        ? "The application will use mock data instead of making API calls."
        : "The application will make real API calls to OpenAI.",
    });
  };

  const handleSetModelForPhase = (phase: ApplicationPhase, modelId: string) => {
    const provider = selectedProviders[phase];
    setModelForPhase(phase, modelId, provider);
    saveModel();
    toast({
      title: 'Model Updated',
      description: `Model for ${getPhaseDisplayName(phase)} has been updated.`,
    });
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    toast({
      title: "Models Reset",
      description:
        "All model settings have been reset to their default values.",
    });
  };

  const getPhaseDisplayName = (phase: ApplicationPhase): string => {
    switch (phase) {
      case "shotListGeneration":
        return "Shot List Generation";
      case "subjectExtraction":
        return "Subject Extraction";
      case "directorsNotes":
        return "Director's Notes";
      case "visualPrompt":
        return "Visual Prompt";
      case "videoTreatment":
        return "Video Treatment";
      case "shotSuggestions":
        return "Shot Suggestions";
      case "outlineGeneration":
        return "Outline Generation";
      default:
        return phase;
    }
  };

  return (
    <Tabs
      defaultValue="models"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="models">Models</TabsTrigger>
        <TabsTrigger value="openai">OpenAI API</TabsTrigger>
        <TabsTrigger value="replicate">Replicate API</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="models" className="space-y-4">
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleResetToDefaults}
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(phaseModelMapping).map(([phase, config]) => (
            <Card key={`${phase}-${config.model}`} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex justify-between gap-2 items-center p-4 bg-muted/50">
                  <div>
                    <h3 className="font-medium">
                      {getPhaseDisplayName(phase as ApplicationPhase)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select the model to use for this phase
                    </p>
                  </div>
                  <div>
                    <Select
                      key={`${phase}-${selectedProviders[phase]}`}
                      value={selectedProviders[phase] || "openai"}
                      onValueChange={(value) => {
                        setSelectedProvider(phase, value);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProviders.map((provider) => (
                          <SelectItem
                            key={provider}
                            value={provider.toLowerCase()}
                            className="cursor-pointer"
                          >
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div
                  key={`${phase}-${selectedProviders[phase]}`}
                  className="p-4 space-y-2 h-52 overflow-y-auto"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : getFilteredModels(phase).length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No models found for the selected provider
                    </div>
                  ) : (
                    getFilteredModels(phase)
                      .map((model) => (
                      <div
                        key={`${model.provider}-${model.model}`}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 ${config.model === model.model ? "bg-muted" : ""
                        }`}
                        onClick={() =>
                          handleSetModelForPhase(
                            phase as ApplicationPhase,
                            model.model
                          )
                        }
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium">{model.model}</span>
                            {/* {model.recommended && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )} */}
                          </div>
                          <p className="text-xs text-muted-foreground">
                              {model.description || "No description available"}
                          </p>
                        </div>
                        {config.model === model.model && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="openai" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-api-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <Button onClick={handleSaveApiKey} disabled={!apiKeyInput}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored locally in your browser and is never
                  sent to our servers.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <Label htmlFor="use-mock-data">Use Mock Data</Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, the application will use mock data instead of
                    making API calls.
                  </p>
                </div>
                <Switch
                  id="use-mock-data"
                  checked={useMockData}
                  onCheckedChange={handleToggleMockData}
                />
              </div>

              {!apiKey && !useMockData && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 text-amber-800 rounded-md">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    No API key provided. Please enter your OpenAI API key or
                    enable mock data mode.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="replicate" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="replicate-api-token">Replicate API Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="replicate-api-token"
                    type="password"
                    placeholder="r8_..."
                    value={replicateApiTokenInput}
                    onChange={(e) => setReplicateApiTokenInput(e.target.value)}
                  />
                  <Button
                    onClick={handleSaveReplicateApiToken}
                    disabled={!replicateApiTokenInput}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your Replicate API token is stored locally in your browser and
                  is never sent to our servers.
                </p>
              </div>

              <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md">
                <h4 className="font-medium mb-2">About Replicate</h4>
                <p className="text-sm mb-2">
                  Replicate runs machine learning models in the cloud. We use it
                  to generate images from your prompts.
                </p>
                <p className="text-sm">
                  To get a Replicate API token, sign up at{' '}
                  <a
                    href="https://replicate.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    replicate.com
                  </a>{' '}
                  and create a token in your account settings.
                </p>
              </div>

              {!replicateApiToken && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 text-amber-800 rounded-md">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    No Replicate API token provided. You'll need this to
                    generate images in the Image Generation phase.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-medium">Advanced Settings</h3>
              <p className="text-sm text-muted-foreground">
                These settings are for advanced users who want more control over
                the AI behavior.
              </p>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm">
                  More advanced settings will be added in future updates,
                  including temperature control, custom system prompts, and
                  more.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
