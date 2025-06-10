'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';
import { Loader2, FileText, List, CheckCircle2 } from 'lucide-react';
import { useLoadingStore } from '@/lib/stores/loading-store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StoryOutlineType } from '@/lib/types/script.type';

const outlineTypeOptions = [
  {
    value: 'linear-framework-simple-complexity',
    label: 'Linear Framework - Simple Complexity',
  },
  {
    value: 'dynamic-framework-moderate-complexity',
    label: 'Dynamic Framework - Moderate Complexity',
  },
  {
    value: 'developmental-framework-moderate-complexity',
    label: 'Developmental Framework - Moderate Complexity',
  },
  {
    value: 'thematic-framework-complex-complexity',
    label: 'Thematic Framework - Complex Complexity',
  },
  {
    value: 'dynamic-framework-complex-complexity',
    label: 'Dynamic Framework - Complex Complexity',
  },
];

export default function OutlineTab() {
  const { toast } = useToast();
  const {
    outline,
    setOutline,
    generateOutline,
    outlineDirections,
    setOutlineDirections: updateOutlineDirections,
  } = useScriptCreationStore();
  const { isLoading } = useLoadingStore();
  const [localOutline, setLocalOutline] = useState(outline);
  const [outlineDirectionsLocal, setOutlineDirectionsLocal] =
    useState(outlineDirections);

  const [showSuccess, setShowSuccess] = useState(false);

  // Update local outline when the store changes
  useEffect(() => {
    setLocalOutline(outline);
  }, [outline]);

  // Update local outline directions when the store changes
  useEffect(() => {
    setOutlineDirectionsLocal(outlineDirections);
  }, [outlineDirections]);

  // Show success message when outline is generated
  useEffect(() => {
    if (outline && outline.trim() !== '') {
      setShowSuccess(true);
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [outline]);

  const handleSaveOutline = () => {
    setOutline(localOutline);
    toast({
      title: 'Outline Saved',
      description: 'Your outline has been saved.',
    });
  };

  const handleGenerateOutline = async () => {
    try {
      // Save the outline directions first
      updateOutlineDirections({
        outlineType: outlineDirectionsLocal.outlineType as StoryOutlineType,
      });

      await generateOutline();

      toast({
        title: 'Outline Generated',
        description: 'Your outline has been generated successfully.',
      });
      setShowSuccess(true);

      // Hide the success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate outline.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Tabs defaultValue="editor">
      <TabsList className="mb-4">
        <TabsTrigger value="editor">Outline Editor</TabsTrigger>
        <TabsTrigger value="wizard">Outline Wizard</TabsTrigger>
      </TabsList>

      <TabsContent value="editor">
        <Card>
          <CardHeader>
            <CardTitle>Story Outline</CardTitle>
            <CardDescription>
              Create or edit your story outline with chapters and bullet points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your outline here..."
              className="min-h-[400px] font-mono text-sm"
              value={localOutline}
              onChange={(e) => setLocalOutline(e.target.value)}
            />

            {showSuccess && outline && outline.trim() !== '' && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">
                  Outline Generated Successfully
                </AlertTitle>
                <AlertDescription>
                  Your outline has been generated and is ready to use.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row w-full gap-4">
              <Button onClick={handleSaveOutline} className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                Save Outline
              </Button>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="wizard">
        <Card>
          <CardHeader>
            <CardTitle>Outline Wizard</CardTitle>
            <CardDescription>
              Generate an outline based on your preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outlineType">Outline Type</Label>
                <Select
                  value={outlineDirectionsLocal.outlineType}
                  onValueChange={(value) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      outlineType: value as StoryOutlineType,
                    })
                  }
                >
                  <SelectTrigger id="outlineType">
                    <SelectValue placeholder="Select Outline Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlineTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showSuccess && outline && outline.trim() !== '' && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">
                  Outline Generated Successfully
                </AlertTitle>
                <AlertDescription>
                  Your outline has been generated. Switch to the Outline Editor
                  tab to view and edit it.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateOutline}
              className="w-full"
              disabled={isLoading('generateOutline')}
            >
              {isLoading('generateOutline') ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <List className="mr-2 h-4 w-4" />
                  Generate Outline
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
