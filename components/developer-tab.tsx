'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  useTemplateStore,
  type PromptTemplate,
  type TemplateVariable,
} from '@/lib/stores/template-store';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  RefreshCw,
  Info,
  Play,
  MessageSquare,
  FileCode,
  Cpu,
  ClipboardCopy,
} from 'lucide-react';
import AILogsTab from './ai-logs-tab';
import ModelsTab from './models-tab';
import { processTemplate } from '@/lib/ai-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DeveloperTab() {
  const { toast } = useToast()
  const { templates, updateTemplate, updateTemplateVariable, resetToDefaults, selectedTemplate, setSelectedTemplate } = useTemplateStore()
  const [editedTemplate, setEditedTemplate] = useState<Partial<PromptTemplate>>({})
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [previewInput, setPreviewInput] = useState<Record<string, string>>({})
  const [previewOutput, setPreviewOutput] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"templates" | "logs" | "models">("models") // Default to models tab
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Debug effect to check templates loading
  useEffect(() => {
    setDebugInfo(`Templates loaded: ${templates.length}`);
  }, [templates]);

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({});

    // Initialize preview input with example values
    const initialPreviewInput: Record<string, string> = {};
    template.variables.forEach((variable) => {
      initialPreviewInput[variable.name] = variable.example;
    });
    setPreviewInput(initialPreviewInput);
    setPreviewOutput('');
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;

    updateTemplate(selectedTemplate.id, editedTemplate)
    setEditedTemplate({})
    toast({
      title: 'Template Updated',
      description: `Template "${selectedTemplate.name}" has been updated.`,
    });
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    setSelectedTemplate(null);
    setEditedTemplate({});
    toast({
      title: 'Templates Reset',
      description: 'All templates have been reset to their default values.',
    });
  };

  const handleToggleVariable = (variable: TemplateVariable) => {
    if (!selectedTemplate) return;

    updateTemplateVariable(
      selectedTemplate.id,
      variable.name,
      !variable.enabled
    );
  };

  const handlePreviewInputChange = (variableName: string, value: string) => {
    setPreviewInput((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const handleGeneratePreview = () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    try {
      // Create variables object from preview inputs
      const variables: Record<string, string> = {};
      selectedTemplate.variables.forEach((variable) => {
        if (variable.enabled) {
          variables[variable.name] = previewInput[variable.name] || '';
        }
      });

      // Use the same processTemplate function that's used in the AI service
      const processedTemplate = processTemplate(selectedTemplate.id, variables);
      setPreviewOutput(processedTemplate);

      toast({
        title: 'Preview Generated',
        description: 'Template preview has been generated with your inputs.',
      });
    } catch (error) {
      toast({
        title: 'Preview Generation Failed',
        description: 'Failed to generate preview. Please check your inputs.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'shotList':
        return 'Shot List';
      case 'subjects':
        return 'Subjects';
      case 'directorsNotes':
        return "Director's Notes";
      case 'visualPrompt':
        return 'Visual Prompt';
      case 'videoTreatment':
        return 'Video Treatment';
      case 'other':
        return 'Other';
      case 'shotSuggestions':
        return 'Shot Suggestions';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'shotList':
        return 'bg-blue-500';
      case 'subjects':
        return 'bg-green-500';
      case 'directorsNotes':
        return 'bg-purple-500';
      case 'visualPrompt':
        return 'bg-amber-500';
      case 'videoTreatment':
        return 'bg-pink-500';
      case 'other':
        return 'bg-slate-500';
      case 'shotSuggestions':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredTemplates =
    activeCategory === 'all'
      ? templates
      : templates.filter((template) => template.category === activeCategory);

  const highlightVariables = (text: string, variables: TemplateVariable[]) => {
    if (!text) return '';

    // Create a map of variable names to their enabled status
    const variableStatusMap = variables.reduce(
      (acc, variable) => {
        acc[variable.name] = variable.enabled;
        return acc;
      },
      {} as Record<string, boolean>
    );

    // Replace {{variable}} with highlighted spans, using different styles for enabled vs disabled
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const isEnabled = variableStatusMap[variableName] !== false; // Default to enabled if not found

      if (isEnabled) {
        return `<span class="bg-amber-100 dark:bg-amber-900 px-1 rounded">{{${variableName}}}</span>`;
      } else {
        return `<span class="bg-red-100 dark:bg-red-900 px-1 rounded line-through opacity-60" title="This variable is disabled and will be removed from the prompt">{{${variableName}}}</span>`;
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Developer Tools</CardTitle>
            <CardDescription>
              Advanced tools for customizing AI prompt templates, models, and
              monitoring AI interactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'models' ? 'default' : 'outline'}
              onClick={() => setActiveTab('models')}
              className="flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              API & Models
            </Button>
            <Button
              variant={activeTab === 'templates' ? 'default' : 'outline'}
              onClick={() => setActiveTab('templates')}
              className="flex items-center gap-2"
            >
              <FileCode className="h-4 w-4" />
              Templates
            </Button>
            <Button
              variant={activeTab === 'logs' ? 'default' : 'outline'}
              onClick={() => setActiveTab('logs')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              AI Logs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Debug info - will be removed in final version */}
        {debugInfo && activeTab === 'templates' && (
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
            Debug: {debugInfo}
          </div>
        )}

        {activeTab === 'models' && <ModelsTab />}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Reset All Templates
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Templates?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all prompt templates to their default
                      values. Any customizations you've made will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetToDefaults}>
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Prompt Templates</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>About Prompt Templates</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p>
                          Prompt templates are used to generate AI prompts
                          throughout the application. They contain variables
                          (shown as <code>{'{{variable}}'}</code>) that are
                          replaced with actual values when used.
                        </p>
                        <p>
                          Editing these templates allows you to customize how
                          the AI generates content for different features.
                        </p>
                        <h4 className="font-medium mt-4">Tips:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            Keep variable names unchanged to ensure they're
                            properly replaced
                          </li>
                          <li>
                            Use clear, specific instructions for best AI results
                          </li>
                          <li>You can always reset to defaults if needed</li>
                          <li>
                            Toggle variables on/off to include or exclude them
                            from the final prompt
                          </li>
                        </ul>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    variant={activeCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setActiveCategory('all')}
                    size="sm"
                  >
                    All Templates
                  </Button>
                  <Button
                    variant={
                      activeCategory === 'shotList' ? 'default' : 'outline'
                    }
                    onClick={() => setActiveCategory('shotList')}
                    size="sm"
                  >
                    Shot List
                  </Button>
                  <Button
                    variant={
                      activeCategory === 'subjects' ? 'default' : 'outline'
                    }
                    onClick={() => setActiveCategory('subjects')}
                    size="sm"
                  >
                    Subjects
                  </Button>
                  <Button
                    variant={
                      activeCategory === 'directorsNotes'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => setActiveCategory('directorsNotes')}
                    size="sm"
                  >
                    Director's Notes
                  </Button>
                  <Button
                    variant={
                      activeCategory === 'visualPrompt' ? 'default' : 'outline'
                    }
                    onClick={() => setActiveCategory('visualPrompt')}
                    size="sm"
                  >
                    Visual Prompts
                  </Button>
                  <Button
                    variant={
                      activeCategory === 'videoTreatment'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => setActiveCategory('videoTreatment')}
                    size="sm"
                  >
                    Video Treatment
                  </Button>
                  <Button
                    variant={
                      activeCategory === 'shotSuggestions'
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => setActiveCategory('shotSuggestions')}
                    size="sm"
                  >
                    Shot Suggestions
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="divide-y">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${selectedTemplate?.id === template.id
                              ? 'bg-muted'
                              : ''
                            }`}
                          onClick={() => handleSelectTemplate(template)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge
                              className={`${getCategoryColor(template.category)} text-white`}
                            >
                              {getCategoryName(template.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <span>{template.variables.length} variables</span>
                            <span className="mx-2">•</span>
                            <span>
                              {
                                template.variables.filter((v) => v.enabled)
                                  .length
                              }{' '}
                              enabled
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        {templates.length === 0
                          ? 'No templates found. Try resetting to defaults.'
                          : 'No templates found in this category.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                {selectedTemplate ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          {selectedTemplate.name}
                        </h3>
                        <Badge
                          className={`${getCategoryColor(selectedTemplate.category)} text-white`}
                        >
                          {getCategoryName(selectedTemplate.category)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={
                            editedTemplate.name !== undefined
                              ? editedTemplate.name
                              : selectedTemplate.name
                          }
                          onChange={(e) =>
                            setEditedTemplate({
                              ...editedTemplate,
                              name: e.target.value,
                            })
                          }
                          aria-label="Template name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-description">
                          Description
                        </Label>
                        <Input
                          id="template-description"
                          value={
                            editedTemplate.description !== undefined
                              ? editedTemplate.description
                              : selectedTemplate.description
                          }
                          onChange={(e) =>
                            setEditedTemplate({
                              ...editedTemplate,
                              description: e.target.value,
                            })
                          }
                          aria-label="Template description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-category">Category</Label>
                        <Select
                          value={
                            editedTemplate.category !== undefined
                              ? editedTemplate.category
                              : selectedTemplate.category
                          }
                          onValueChange={(value) =>
                            setEditedTemplate({
                              ...editedTemplate,
                              category: value as
                                | 'shotList'
                                | 'subjects'
                                | 'directorsNotes'
                                | 'visualPrompt'
                                | 'videoTreatment'
                                | 'shotSuggestions'
                                | 'other',
                            })
                          }
                        >
                          <SelectTrigger
                            id="template-category"
                            aria-label="Template category"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shotList">Shot List</SelectItem>
                            <SelectItem value="subjects">Subjects</SelectItem>
                            <SelectItem value="directorsNotes">
                              Director's Notes
                            </SelectItem>
                            <SelectItem value="visualPrompt">
                              Visual Prompt
                            </SelectItem>
                            <SelectItem value="videoTreatment">
                              Video Treatment
                            </SelectItem>
                            <SelectItem value="shotSuggestions">
                              Shot Suggestions
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-content">
                          Template Content
                        </Label>
                        <Textarea
                          id="template-content"
                          value={
                            editedTemplate.template !== undefined
                              ? editedTemplate.template
                              : selectedTemplate.template
                          }
                          onChange={(e) =>
                            setEditedTemplate({
                              ...editedTemplate,
                              template: e.target.value,
                            })
                          }
                          className="min-h-[300px] font-mono text-sm"
                          aria-label="Template content"
                        />
                      </div>

                      <div className="pt-4">
                        <Accordion
                          type="multiple"
                          defaultValue={['variables', 'preview']}
                        >
                          <AccordionItem value="variables">
                            <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                Template Variables
                                <Badge variant="outline" className="ml-2">
                                  {selectedTemplate.variables.length} total /{' '}
                                  {
                                    selectedTemplate.variables.filter(
                                      (v) => v.enabled
                                    ).length
                                  }{' '}
                                  enabled
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">
                                    Toggle variables to include or exclude them
                                    from the final prompt.
                                    <span className="font-medium text-amber-600 dark:text-amber-400 ml-1">
                                      Disabled variables will be completely
                                      removed from the prompt.
                                    </span>
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Enable all variables
                                      if (selectedTemplate) {
                                        selectedTemplate.variables.forEach(
                                          (variable) => {
                                            if (!variable.enabled) {
                                              handleToggleVariable(variable);
                                            }
                                          }
                                        );
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    Enable All
                                  </Button>
                                </div>
                                <div className="border rounded-md overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium">
                                          Variable
                                        </th>
                                        <th className="px-4 py-2 text-left text-sm font-medium">
                                          Description
                                        </th>
                                        <th className="px-4 py-2 text-left text-sm font-medium">
                                          Example
                                        </th>
                                        <th className="px-4 py-2 text-center text-sm font-medium">
                                          Enabled
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {selectedTemplate.variables.map(
                                        (variable) => (
                                          <tr
                                            key={variable.name}
                                            className={
                                              variable.enabled
                                                ? ''
                                                : 'bg-muted/30'
                                            }
                                          >
                                            <td className="px-4 py-2 font-mono text-sm">{`{{${variable.name}}}`}</td>
                                            <td className="px-4 py-2 text-sm">
                                              {variable.description}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-muted-foreground">
                                              <div
                                                className="max-w-[200px] truncate"
                                                title={variable.example}
                                              >
                                                {variable.example}
                                              </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                              <div className="flex items-center justify-center">
                                                <Switch
                                                  checked={variable.enabled}
                                                  onCheckedChange={() =>
                                                    handleToggleVariable(
                                                      variable
                                                    )
                                                  }
                                                  aria-label={`Toggle ${variable.name}`}
                                                />
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="preview">
                            <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                Template Preview
                                <Badge variant="outline" className="ml-2">
                                  Test your template with sample values
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedTemplate.variables
                                    .filter((v) => v.enabled)
                                    .map((variable) => (
                                      <div
                                        key={variable.name}
                                        className="space-y-2"
                                      >
                                        <Label
                                          htmlFor={`preview-${variable.name}`}
                                          className="flex items-center gap-2"
                                        >
                                          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{`{{${variable.name}}}`}</span>
                                          <span>{variable.description}</span>
                                        </Label>
                                        <Textarea
                                          id={`preview-${variable.name}`}
                                          value={
                                            previewInput[variable.name] || ''
                                          }
                                          onChange={(e) =>
                                            handlePreviewInputChange(
                                              variable.name,
                                              e.target.value
                                            )
                                          }
                                          placeholder={variable.example}
                                          className="h-20 resize-y"
                                          aria-label={`Preview value for ${variable.name}`}
                                        />
                                      </div>
                                    ))}
                                </div>

                                {selectedTemplate.variables.some(
                                  (v) => !v.enabled
                                ) && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-sm">
                                      <p className="font-medium">
                                        Disabled Variables
                                      </p>
                                      <p className="mt-1">
                                        The following variables are disabled and
                                        will be completely removed from the
                                        prompt:
                                        {selectedTemplate.variables
                                          .filter((v) => !v.enabled)
                                          .map((v) => (
                                            <span
                                              key={v.name}
                                              className="inline-block mx-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-xs"
                                            >
                                              {v.name}
                                            </span>
                                          ))}
                                      </p>
                                    </div>
                                  )}

                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleGeneratePreview}
                                    disabled={isGenerating}
                                    className="mt-4"
                                    aria-label="Generate preview"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    {isGenerating
                                      ? 'Generating...'
                                      : 'Generate Preview'}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      // Reset preview inputs to example values
                                      const initialPreviewInput: Record<
                                        string,
                                        string
                                      > = {};
                                      selectedTemplate.variables.forEach(
                                        (variable) => {
                                          if (variable.enabled) {
                                            initialPreviewInput[variable.name] =
                                              variable.example;
                                          }
                                        }
                                      );
                                      setPreviewInput(initialPreviewInput);
                                    }}
                                    className="mt-4"
                                    aria-label="Reset to examples"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reset to Examples
                                  </Button>
                                </div>

                                {previewOutput && (
                                  <div className="border rounded-md p-4 bg-muted/30 mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-medium">
                                        Preview Output:
                                      </h4>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            previewOutput
                                          );
                                          toast({
                                            title: 'Copied to clipboard',
                                            description:
                                              'The preview output has been copied to your clipboard.',
                                          });
                                        }}
                                        className="h-8 gap-1"
                                        aria-label="Copy to clipboard"
                                      >
                                        <ClipboardCopy className="h-3.5 w-3.5" />
                                        Copy
                                      </Button>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[400px] p-2 bg-muted/50 rounded">
                                      {previewOutput}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="templateStructure">
                            <AccordionTrigger>
                              Template Structure
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="border rounded-md p-4 bg-muted/30 mt-2">
                                <pre
                                  className="whitespace-pre-wrap text-sm font-mono"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightVariables(
                                      editedTemplate.template !== undefined
                                        ? editedTemplate.template
                                        : selectedTemplate.template,
                                      selectedTemplate.variables
                                    ),
                                  }}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveTemplate}
                        disabled={Object.keys(editedTemplate).length === 0}
                        className="gap-1"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px] border rounded-md bg-muted/10">
                    <div className="text-center p-8">
                      <h3 className="text-lg font-medium mb-2">
                        Select a Template
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Select a prompt template from the list to view and edit
                        its content.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && <AILogsTab />}
      </CardContent>
    </Card>
  );
}
