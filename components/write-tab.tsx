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
  FileText,
  Sparkles,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTabsStore } from '@/lib/stores/tabs-store';

export default function WriteTab() {
  const { setActiveTab } = useTabsStore();
  const { toast } = useToast();
  const { isLoading } = useLoadingStore();
  const {
    chapters,
    generatedChapters,
    generateChapter,
    generateAllChapters,
    updateGeneratedChapter,
  } = useScriptCreationStore();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Set the first chapter as selected when the component loads or when chapters change
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  // Update edited content when selected chapter changes
  useEffect(() => {
    if (selectedChapterId) {
      const generatedChapter = generatedChapters.find(
        (c) => c.chapterId === selectedChapterId
      );
      if (generatedChapter) {
        setEditedContent(generatedChapter.content);
      } else {
        setEditedContent('');
      }
      setIsEditing(false);
    }
  }, [selectedChapterId, generatedChapters]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const generatedChapter = generatedChapters.find(
    (c) => c.chapterId === selectedChapterId
  );

  const handleGenerateChapter = async () => {
    if (!selectedChapterId) return;

    try {
      await generateChapter(selectedChapterId);
      toast({
        title: 'Chapter Generated',
        description: 'Your chapter has been generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate chapter.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAllChapters = async () => {
    try {
      await generateAllChapters();
      toast({
        title: 'All Chapters Generated',
        description: 'All chapters have been generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate chapters.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdits = () => {
    if (!selectedChapterId || !generatedChapter) return;

    updateGeneratedChapter(generatedChapter.id, editedContent);
    setIsEditing(false);

    toast({
      title: 'Chapter Updated',
      description: 'Your edits have been saved.',
    });
  };

  const handleCancelEdits = () => {
    if (!generatedChapter) return;

    setEditedContent(generatedChapter.content);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Write Your Story</CardTitle>
            <CardDescription>
              Generate and edit your story chapters
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateAllChapters}
              disabled={
                isLoading('generateAllChapters') || chapters.length === 0
              }
              className="gap-2"
            >
              {isLoading('generateAllChapters') ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate All Chapters
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {chapters.length === 0 ? (
          <div className="text-center py-12 border rounded-md">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Outline Created</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Please go back to the Outline tab and create your story structure
              first.
            </p>
            <Button variant="outline" onClick={() => setActiveTab('outline')}>
              Go to Outline
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
                    {chapters.map((chapter, index) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {index + 1}. {chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Chapter Status</h3>
                <div className="grid grid-cols-1 gap-2">
                  {chapters.map((chapter, index) => {
                    const isGenerated = generatedChapters.some(
                      (c) => c.chapterId === chapter.id
                    );
                    const isSelected = selectedChapterId === chapter.id;
                    const isGenerating = isLoading(
                      `generateChapter-${chapter.id}`
                    );

                    return (
                      <Button
                        key={chapter.id}
                        variant={
                          isSelected
                            ? 'default'
                            : isGenerated
                              ? 'outline'
                              : 'ghost'
                        }
                        className={`justify-start h-auto py-2 px-3 ${isSelected ? '' : 'border border-dashed'}`}
                        onClick={() => setSelectedChapterId(chapter.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-muted text-xs">
                            {index + 1}
                          </span>
                          <span className="text-sm truncate text-left flex-1">
                            {chapter.title}
                          </span>
                          {isGenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isGenerated ? (
                            <div className="h-2 w-2 rounded-full bg-green-500" />
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
              {selectedChapter ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-medium">
                      {selectedChapter.title}
                    </h2>
                    {!generatedChapter ? (
                      <Button
                        onClick={handleGenerateChapter}
                        disabled={isLoading(
                          `generateChapter-${selectedChapterId}`
                        )}
                        className="gap-2"
                      >
                        {isLoading(`generateChapter-${selectedChapterId}`) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Chapter
                          </>
                        )}
                      </Button>
                    ) : isEditing ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancelEdits}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdits} className="gap-2">
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleGenerateChapter}
                          disabled={isLoading(
                            `generateChapter-${selectedChapterId}`
                          )}
                          className="gap-2"
                        >
                          {isLoading(`generateChapter-${selectedChapterId}`) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border rounded-md">
                    {!generatedChapter ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Chapter Not Generated Yet
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-4">
                          Generate this chapter to start writing your story.
                        </p>
                        <Button
                          onClick={handleGenerateChapter}
                          disabled={isLoading(
                            `generateChapter-${selectedChapterId}`
                          )}
                          className="gap-2"
                        >
                          {isLoading(`generateChapter-${selectedChapterId}`) ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate Chapter
                            </>
                          )}
                        </Button>
                      </div>
                    ) : isEditing ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[500px] border-0 rounded-none font-serif text-base"
                      />
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <div className="p-6 font-serif text-base whitespace-pre-line">
                          {generatedChapter.content}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] border rounded-md">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Chapter</h3>
                  <p className="text-muted-foreground max-w-md text-center">
                    Select a chapter from the list to view, generate, or edit
                    its content.
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
          onClick={() => setActiveTab('outline')}
        >
          <ArrowLeft className="h-4 w-4" /> Back: Outline
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (generatedChapters.length === 0) {
              toast({
                title: 'No Chapters Generated',
                description:
                  'Please generate at least one chapter before proceeding.',
                variant: 'destructive',
              });
              return;
            }
            setActiveTab('enhance');
          }}
        >
          Next: Enhance <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
