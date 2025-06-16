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
import { useToast } from '@/hooks/use-toast';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';
import { useLoadingStore } from '@/lib/stores/loading-store';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Heart,
  Check,
  Lightbulb,
  Diff,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTabsStore } from '@/lib/stores/tabs-store';
import { useProjectStore } from '@/lib/stores/project-store';

export default function EnhanceTab() {
  const { setActiveTab: setActiveTabStore } = useTabsStore();
  const { toast } = useToast();
  const { isLoading } = useLoadingStore();
  const {
    chapters,
    generatedChapters,
    enhancedChapters,
    emotionalSuggestions,
    analyzeEmotionalImpact,
    generateEmotionalSuggestions,
    toggleEmotionalSuggestionSelection,
    applySelectedEmotionalSuggestions,
    finalizeScript,
  } = useScriptCreationStore();
  const { script } = useProjectStore();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [clickButton, setClickButton] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'enhanced'>(
    'original'
  );

  // Set the first chapter as selected when the component loads or when chapters change
  useEffect(() => {
    if (generatedChapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(generatedChapters[0].chapterId);
    }
  }, [generatedChapters, selectedChapterId]);

  // Update active tab when selected chapter changes
  useEffect(() => {
    if (selectedChapterId) {
      const hasEnhancement = enhancedChapters.some(
        (c) => c.chapterId === selectedChapterId
      );
      setActiveTab(hasEnhancement ? 'enhanced' : 'original');
    }
  }, [selectedChapterId, enhancedChapters]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const generatedChapter = generatedChapters.find(
    (c) => c.chapterId === selectedChapterId
  );
  const enhancedChapter = enhancedChapters.find(
    (c) => c.chapterId === selectedChapterId
  );
  const chapterSuggestions = emotionalSuggestions.filter(
    (s) => s.chapterId === selectedChapterId
  );

  const handleAnalyzeEmotionalImpact = async () => {
    if (!selectedChapterId) return;

    try {
      await analyzeEmotionalImpact(selectedChapterId);
      toast({
        title: 'Analysis Complete',
        description: 'Emotional impact analysis has been completed.',
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to analyze emotional impact.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedChapterId) return;

    try {
      await generateEmotionalSuggestions(selectedChapterId);
      toast({
        title: 'Suggestions Generated',
        description: 'Emotional enhancement suggestions have been generated.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate suggestions.',
        variant: 'destructive',
      });
    }
  };

  const handleApplySuggestions = async () => {
    if (!selectedChapterId) return;

    try {
      await applySelectedEmotionalSuggestions(selectedChapterId);
      toast({
        title: 'Enhancements Applied',
        description: 'Selected emotional enhancements have been applied.',
      });
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to apply enhancements.',
        variant: 'destructive',
      });
    }
  };

  const handleFinalizeScript = () => {
    setClickButton(true);
    finalizeScript();

    toast({
      title: 'Script Finalized',
      description:
        'Your script has been finalized and is ready for production.',
    });

    // Navigate to the script tab
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Enhance Emotional Impact</CardTitle>
            <CardDescription>
              Optimize your story for emotional resonance
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleFinalizeScript}
              disabled={
                generatedChapters.length === 0 || clickButton || script !== ''
              }
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Finalize Script
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {generatedChapters.length === 0 ? (
          <div className="text-center py-12 border rounded-md">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Chapters Generated</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Please go back to the Write tab and generate your chapters first.
            </p>
            <Button
              variant="outline"
              onClick={() => setActiveTabStore('write')}
            >
              Go to Write
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Chapters</h3>
                <Select
                  value={selectedChapterId || ''}
                  onValueChange={setSelectedChapterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {generatedChapters.map((chapter, index) => {
                      const originalChapter = chapters.find(
                        (c) => c.id === chapter.chapterId
                      );
                      const isEnhanced = enhancedChapters.some(
                        (c) => c.chapterId === chapter.chapterId
                      );

                      return (
                        <SelectItem key={chapter.id} value={chapter.chapterId}>
                          <div className="flex items-center gap-2">
                            <span>
                              {index + 1}. {originalChapter?.title}
                            </span>
                            {isEnhanced && (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Enhancement Status</h3>
                <div className="grid grid-cols-1 gap-2">
                  {generatedChapters.map((chapter, index) => {
                    const originalChapter = chapters.find(
                      (c) => c.id === chapter.chapterId
                    );
                    const isEnhanced = enhancedChapters.some(
                      (c) => c.chapterId === chapter.chapterId
                    );
                    const isSelected = selectedChapterId === chapter.chapterId;
                    const isAnalyzing = isLoading(
                      `analyzeEmotion-${chapter.chapterId}`
                    );
                    const isEnhancing = isLoading(
                      `enhanceChapter-${chapter.chapterId}`
                    );

                    return (
                      <Button
                        key={chapter.id}
                        variant={
                          isSelected
                            ? 'default'
                            : isEnhanced
                              ? 'outline'
                              : 'ghost'
                        }
                        className={`justify-start h-auto py-2 px-3 ${isSelected ? '' : 'border border-dashed'}`}
                        onClick={() => setSelectedChapterId(chapter.chapterId)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <p className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-muted text-xs text-black">
                            {index + 1}
                          </p>
                          <p className="text-sm truncate text-left flex-1">
                            {originalChapter?.title}
                          </p>
                          {isAnalyzing || isEnhancing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isEnhanced ? (
                            <Sparkles className="h-3 w-3 text-primary" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              {selectedChapter && generatedChapter ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-medium">
                      {selectedChapter.title}
                    </h2>
                    <div className="flex gap-2">
                      {enhancedChapter ? (
                        <Button
                          variant="outline"
                          onClick={handleGenerateSuggestions}
                          disabled={isLoading(
                            `analyzeEmotion-${selectedChapterId}`
                          )}
                          className="gap-2"
                        >
                          {isLoading(`analyzeEmotion-${selectedChapterId}`) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Generate More Suggestions
                        </Button>
                      ) : (
                        <Button
                          onClick={handleAnalyzeEmotionalImpact}
                          disabled={isLoading(
                            `analyzeEmotion-${selectedChapterId}`
                          )}
                          className="gap-2"
                        >
                          {isLoading(`analyzeEmotion-${selectedChapterId}`) ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4" />
                              Analyze Emotional Impact
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-3 space-y-4">
                      {enhancedChapter ? (
                        <Tabs
                          value={activeTab}
                          onValueChange={(value) =>
                            setActiveTab(value as 'original' | 'enhanced')
                          }
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="original">Original</TabsTrigger>
                            <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
                          </TabsList>
                          <TabsContent
                            value="original"
                            className="border rounded-md p-0"
                          >
                            <ScrollArea className="h-[500px]">
                              <div className="p-6 font-serif text-base whitespace-pre-line">
                                {generatedChapter.content}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                          <TabsContent
                            value="enhanced"
                            className="border rounded-md p-0"
                          >
                            <ScrollArea className="h-[500px]">
                              <div className="p-6 font-serif text-base whitespace-pre-line">
                                {enhancedChapter.enhancedContent}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="border rounded-md p-0">
                          <ScrollArea className="h-[500px]">
                            <div className="p-6 font-serif text-base whitespace-pre-line">
                              {generatedChapter.content}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {enhancedChapter && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Diff className="h-4 w-4 text-primary" />
                              Changes Made
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0">
                            <ul className="space-y-2 text-sm">
                              {enhancedChapter.changes.map((change, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span>{change}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter className="py-3">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">
                                Emotional Impact:
                              </span>{' '}
                              {enhancedChapter.emotionalImpact}
                            </p>
                          </CardFooter>
                        </Card>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Enhancement Suggestions
                          </h3>
                          {chapterSuggestions.length > 0 && (
                            <Button
                              size="sm"
                              onClick={handleApplySuggestions}
                              disabled={
                                !chapterSuggestions.some((s) => s.selected) ||
                                isLoading(`enhanceChapter-${selectedChapterId}`)
                              }
                              className="gap-1"
                            >
                              {isLoading(
                                `enhanceChapter-${selectedChapterId}`
                              ) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Apply Selected
                            </Button>
                          )}
                        </div>

                        {chapterSuggestions.length === 0 ? (
                          <div className="text-center py-8 border rounded-md">
                            <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                            <h3 className="text-sm font-medium mb-2">
                              No Suggestions Yet
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-3">
                              Analyze this chapter to get suggestions for
                              enhancing its emotional impact.
                            </p>
                            <Button
                              size="sm"
                              onClick={handleAnalyzeEmotionalImpact}
                              disabled={isLoading(
                                `analyzeEmotion-${selectedChapterId}`
                              )}
                              className="gap-1"
                            >
                              {isLoading(
                                `analyzeEmotion-${selectedChapterId}`
                              ) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Heart className="h-3 w-3" />
                              )}
                              Analyze Now
                            </Button>
                          </div>
                        ) : (
                          <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-3">
                              {chapterSuggestions.map((suggestion) => (
                                <div
                                  key={suggestion.id}
                                  className="border rounded-md p-3 bg-background"
                                >
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      id={suggestion.id}
                                      checked={suggestion.selected}
                                      onCheckedChange={() =>
                                        toggleEmotionalSuggestionSelection(
                                          suggestion.id
                                        )
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge
                                          variant="outline"
                                          className="text-xs capitalize"
                                        >
                                          {suggestion.type}
                                        </Badge>
                                      </div>
                                      <p className="text-sm mb-2">
                                        {suggestion.suggestion}
                                      </p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-red-400" />
                                        {suggestion.emotionalImpact}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] border rounded-md">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Chapter</h3>
                  <p className="text-muted-foreground max-w-md text-center">
                    Select a chapter from the list to analyze and enhance its
                    emotional impact.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setActiveTabStore('write')}
        >
          <ArrowLeft className="h-4 w-4" /> Back: Write
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            setActiveTabStore('script');
          }}
        >
          Next: Script <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
