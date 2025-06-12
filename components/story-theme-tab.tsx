'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';
import { ArrowRight } from 'lucide-react';
import { useTabsStore } from '@/lib/stores/tabs-store';

export default function StoryThemeTab() {
  const { setActiveTab } = useTabsStore();
  const { toast } = useToast();
  const {
    storyTheme,
    storyTitle,
    storyGenre,
    targetAudience,
    setStoryTheme,
    setStoryTitle,
    setStoryGenre,
    setTargetAudience,
  } = useScriptCreationStore();

  const [localTheme, setLocalTheme] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localGenre, setLocalGenre] = useState('');
  const [localAudience, setLocalAudience] = useState('');

  const handleSave = () => {
    if (!localTheme.trim()) {
      toast({
        title: 'Story Theme Required',
        description: 'Please enter a story theme to continue.',
        variant: 'destructive',
      });
      return;
    }

    setStoryTheme(localTheme);
    setStoryTitle(localTitle);
    setStoryGenre(localGenre);
    setTargetAudience(localAudience);

    toast({
      title: 'Story Details Saved',
      description: 'Your story details have been saved.',
    });
  };

  useEffect(() => {
    setLocalTheme(storyTheme);
    setLocalTitle(storyTitle);
    setLocalGenre(storyGenre);
    setLocalAudience(targetAudience);
  }, [storyTheme, storyTitle, storyGenre, targetAudience]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Define Your Story</CardTitle>
        <CardDescription>
          Start by defining the core theme and details of your story
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="story-theme">
            Story Theme or Concept <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="story-theme"
            placeholder="Describe the central theme or concept of your story..."
            className="min-h-[100px]"
            value={localTheme}
            onChange={(e) => setLocalTheme(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Example: "A journey of self-discovery where the protagonist learns
            that true strength comes from vulnerability"
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="story-title">Working Title (Optional)</Label>
          <Input
            id="story-title"
            placeholder="Enter a working title for your story"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="story-genre">Genre (Optional)</Label>
            <Select value={localGenre} onValueChange={setLocalGenre}>
              <SelectTrigger id="story-genre">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drama">Drama</SelectItem>
                <SelectItem value="comedy">Comedy</SelectItem>
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="thriller">Thriller</SelectItem>
                <SelectItem value="horror">Horror</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="scifi">Science Fiction</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience (Optional)</Label>
            <Select value={localAudience} onValueChange={setLocalAudience}>
              <SelectTrigger id="target-audience">
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Audience</SelectItem>
                <SelectItem value="children">Children</SelectItem>
                <SelectItem value="teens">Teenagers</SelectItem>
                <SelectItem value="youngAdults">Young Adults</SelectItem>
                <SelectItem value="adults">Adults</SelectItem>
                <SelectItem value="seniors">Seniors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSave}>Save Story Details</Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (!storyTheme) {
              toast({
                title: 'Save Story Details First',
                description:
                  'Please save your story details before proceeding.',
                variant: 'destructive',
              });
              return;
            }
            setActiveTab('research');
          }}
        >
          Next: Research <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
