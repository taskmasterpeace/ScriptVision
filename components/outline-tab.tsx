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
import { Input } from '@/components/ui/input';
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

export default function OutlineTab() {
  const { toast } = useToast();
  const {
    outline,
    setOutline,
    generateOutline,
    outlineDirections,
    setOutlineDirections: updateOutlineDirections,
    selectedTranscripts,
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
      updateOutlineDirections(outlineDirectionsLocal);

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
                <Label htmlFor="title">Story Title</Label>
                <Input
                  id="title"
                  value={outlineDirectionsLocal.title}
                  onChange={(e) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter a title for your story"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select
                  value={outlineDirectionsLocal.genre}
                  onValueChange={(value) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      genre: value,
                    })
                  }
                >
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="sci-fi">Science Fiction</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Main Theme</Label>
                <Input
                  id="theme"
                  value={outlineDirectionsLocal.theme}
                  onChange={(e) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      theme: e.target.value,
                    })
                  }
                  placeholder="e.g., Redemption, Coming of age, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="structure">Story Structure</Label>
                <Select
                  value={outlineDirectionsLocal.structure}
                  onValueChange={(value) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      structure: value,
                    })
                  }
                >
                  <SelectTrigger id="structure">
                    <SelectValue placeholder="Select a structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="three-act">
                      Three-Act Structure
                    </SelectItem>
                    <SelectItem value="hero-journey">Hero's Journey</SelectItem>
                    <SelectItem value="save-the-cat">Save the Cat</SelectItem>
                    <SelectItem value="seven-point">
                      Seven-Point Structure
                    </SelectItem>
                    <SelectItem value="non-linear">Non-Linear</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perspective">Narrative Perspective</Label>
                <Select
                  value={outlineDirectionsLocal.perspective}
                  onValueChange={(value) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      perspective: value,
                    })
                  }
                >
                  <SelectTrigger id="perspective">
                    <SelectValue placeholder="Select a perspective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first-person">First Person</SelectItem>
                    <SelectItem value="second-person">Second Person</SelectItem>
                    <SelectItem value="third-person">Third Person</SelectItem>
                    <SelectItem value="multiple-pov">Multiple POV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select
                  value={outlineDirectionsLocal.tone}
                  onValueChange={(value) =>
                    setOutlineDirectionsLocal({
                      ...outlineDirectionsLocal,
                      tone: value,
                    })
                  }
                >
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="optimistic">Optimistic</SelectItem>
                    <SelectItem value="pessimistic">Pessimistic</SelectItem>
                    <SelectItem value="satirical">Satirical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customPrompt">Custom Prompt (Optional)</Label>
              <Textarea
                id="customPrompt"
                value={outlineDirectionsLocal.customPrompt}
                onChange={(e) =>
                  setOutlineDirectionsLocal({
                    ...outlineDirectionsLocal,
                    customPrompt: e.target.value,
                  })
                }
                placeholder="Add any specific instructions or ideas for your outline"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="additionalNotes"
                value={outlineDirectionsLocal.additionalNotes}
                onChange={(e) =>
                  setOutlineDirectionsLocal({
                    ...outlineDirectionsLocal,
                    additionalNotes: e.target.value,
                  })
                }
                placeholder="Add any additional notes or context"
                className="min-h-[100px]"
              />
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
