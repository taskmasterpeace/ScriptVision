'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectStore } from '@/lib/stores/project-store';
import { useLoadingStore } from '@/lib/stores/loading-store';

export default function MusicLabTab() {
  const { toast } = useToast();
  const { generateVideoTreatment } = useProjectStore();
  const { isLoading } = useLoadingStore();
  const [videoTreatment, setVideoTreatment] = useState('');

  const [formData, setFormData] = useState({
    artistName: '',
    songTitle: '',
    genre: '',
    lyrics: '',
    concept: '',
    visualDescriptors: '',
    wardrobeCount: '1',
    wardrobeDetails: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateTreatment = async () => {
    if (!formData.lyrics.trim()) {
      toast({
        title: 'Lyrics Required',
        description: 'Please enter song lyrics to generate a video treatment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const treatment = await generateVideoTreatment(formData);
      setVideoTreatment(treatment);
      toast({
        title: 'Treatment Generated',
        description: 'Video treatment has been successfully generated.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate video treatment.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Music Lab</CardTitle>
        <CardDescription>
          Generate video treatment concepts and prompts from song lyrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="input">
          <TabsList className="mb-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="treatment" disabled={!videoTreatment}>
              Treatment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistName">Artist Name</Label>
                    <Input
                      id="artistName"
                      name="artistName"
                      value={formData.artistName}
                      onChange={handleInputChange}
                      placeholder="Artist name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="songTitle">Song Title</Label>
                    <Input
                      id="songTitle"
                      name="songTitle"
                      value={formData.songTitle}
                      onChange={handleInputChange}
                      placeholder="Song title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    placeholder="Music genre (e.g., Pop, Hip-Hop, Rock)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lyrics">Lyrics</Label>
                  <Textarea
                    id="lyrics"
                    name="lyrics"
                    value={formData.lyrics}
                    onChange={handleInputChange}
                    placeholder="Paste song lyrics here..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="concept">Creative Concept/Direction</Label>
                  <Textarea
                    id="concept"
                    name="concept"
                    value={formData.concept}
                    onChange={handleInputChange}
                    placeholder="Describe your creative concept or direction for the video..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visualDescriptors">Visual Descriptors</Label>
                  <Textarea
                    id="visualDescriptors"
                    name="visualDescriptors"
                    value={formData.visualDescriptors}
                    onChange={handleInputChange}
                    placeholder="Key visual elements, mood, atmosphere, color palette..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wardrobeCount">Number of Wardrobes</Label>
                    <Input
                      id="wardrobeCount"
                      name="wardrobeCount"
                      type="number"
                      min="1"
                      value={formData.wardrobeCount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wardrobeDetails">Wardrobe Descriptions</Label>
                  <Textarea
                    id="wardrobeDetails"
                    name="wardrobeDetails"
                    value={formData.wardrobeDetails}
                    onChange={handleInputChange}
                    placeholder="Describe the different wardrobes/looks for the video..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerateTreatment}
                  disabled={
                    isLoading('generateTreatment') || !formData.lyrics.trim()
                  }
                  className="w-full mt-4"
                >
                  {isLoading('generateTreatment')
                    ? 'Generating...'
                    : 'Generate Video Treatment'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="treatment">
            <div className="space-y-4">
              <div className="p-6 border rounded-md bg-muted/30 whitespace-pre-line">
                {videoTreatment}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(videoTreatment);
                    toast({
                      title: 'Copied to Clipboard',
                      description:
                        'Video treatment has been copied to clipboard.',
                    });
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
