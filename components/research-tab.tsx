'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';
import { useLoadingStore } from '@/lib/stores/loading-store';
import numeral from 'numeral';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Youtube,
  Check,
  ExternalLink,
  Loader2,
  FileText,
  Plus,
  Edit,
  Trash,
  Eye,
  Heart,
  MessageCircle,
  CheckIcon,
  PlusIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import YoutubeFilterBar from './Research/filter-bar';
import ReactPlayer from 'react-player';
import { useTabsStore } from '@/lib/stores/tabs-store';

export default function ResearchTab() {
  const { setActiveTab } = useTabsStore();
  const { toast } = useToast();
  const { isLoading } = useLoadingStore();
  const {
    storyTheme,
    searchQuery,
    searchResults,
    selectedTranscripts,
    searchYouTube,
    fetchTranscript,
    toggleTranscriptSelection,
    removeSelectedTranscript,
    addCustomTranscript,
    updateCustomTranscript,
    deleteTranscript,
    skipOutlineGeneration,
    setSearchQuery,
  } = useScriptCreationStore();

  const [localSearchQuery, setLocalSearchQuery] = useState(
    searchQuery || storyTheme || ''
  );
  const [isAddTranscriptOpen, setIsAddTranscriptOpen] = useState(false);
  const [isEditTranscriptOpen, setIsEditTranscriptOpen] = useState(false);
  const [newTranscript, setNewTranscript] = useState({
    title: '',
    content: '',
  });
  const [editingTranscript, setEditingTranscript] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);

  const [viewingTranscript, setViewingTranscript] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!localSearchQuery.trim()) {
      toast({
        title: 'Search Query Required',
        description: 'Please enter a search term to find YouTube videos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await searchYouTube(localSearchQuery);
      setSearchQuery(localSearchQuery);
      toast({
        title: 'Search Complete',
        description: 'YouTube search results have been loaded.',
      });
    } catch (error) {
      toast({
        title: 'Search Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to search YouTube videos.',
        variant: 'destructive',
      });
    }
  };

  const handleAddTranscript = () => {
    if (!newTranscript.title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for your transcript.',
        variant: 'destructive',
      });
      return;
    }

    if (!newTranscript.content.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter the transcript content.',
        variant: 'destructive',
      });
      return;
    }

    addCustomTranscript(newTranscript.title, newTranscript.content);
    setNewTranscript({ title: '', content: '' });
    setIsAddTranscriptOpen(false);

    toast({
      title: 'Transcript Added',
      description: 'Your custom transcript has been added and selected.',
    });
  };

  const handleUpdateTranscript = () => {
    if (!editingTranscript) return;

    if (!editingTranscript.title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for your transcript.',
        variant: 'destructive',
      });
      return;
    }

    if (!editingTranscript.content.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter the transcript content.',
        variant: 'destructive',
      });
      return;
    }

    updateCustomTranscript(
      editingTranscript.id,
      editingTranscript.title,
      editingTranscript.content
    );
    setEditingTranscript(null);
    setIsEditTranscriptOpen(false);

    toast({
      title: 'Transcript Updated',
      description: 'Your custom transcript has been updated.',
    });
  };

  const handleDeleteTranscript = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the transcript "${title}"?`)) {
      deleteTranscript(id);

      toast({
        title: 'Transcript Deleted',
        description: `Transcript "${title}" has been deleted.`,
      });
    }
  };

  function formatNumberWithSuffix(number: number | undefined | null): string {
    if (number === null || number === undefined) return '';
    if (number < 1000) return Number(number).toString();
    return numeral(number).format('0.0a');
  }

  const handleSkipOutline = async () => {
    try {
      await skipOutlineGeneration();
      if (selectedTranscripts.length === 0) {
        toast({
          title: 'No Transcripts Selected',
          description:
            'Please select at least one transcript before proceeding.',
          variant: 'destructive',
        });
        return;
      }
      setActiveTab('write');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research</CardTitle>
        <CardDescription>
          Find inspiration from YouTube videos or add your own transcripts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="youtube" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4" />
              YouTube Search
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <FileText className="h-4 w-4" />
              Custom Transcripts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search YouTube for inspiration..."
                  className="pl-8"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={
                  isLoading('youtubeSearch') || !localSearchQuery.trim()
                }
                className="gap-2"
              >
                {isLoading('youtubeSearch') ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4" />
                    Search YouTube
                  </>
                )}
              </Button>
            </div>
            <YoutubeFilterBar />

            {searchResults.filter((r) => r.source === 'youtube').length ===
            0 ? (
              <div className="text-center py-12 border rounded-md">
                <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Search Results</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Search for YouTube videos related to your story theme to find
                  inspiration.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4 mt-4">
                {searchResults
                  ?.filter((r) => r?.source === 'youtube')
                  ?.map((result, index) => {
                    return (
                      <Card
                        className={`w-[450px] h-[400px] bg-black overflow-hidden relative transition-all duration-300 hover:shadow-xl group  ${
                          result.selected
                            ? 'ring-2 ring-primary ring-offset-2'
                            : ''
                        } `}
                        key={
                          (typeof result.id === 'string'
                            ? result.id
                            : (result.id as { videoId: string }).videoId) ||
                          index
                        }
                      >
                        <div
                          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background p-1.5 rounded-full cursor-pointer"
                          onClick={() => toggleTranscriptSelection(result.id)}
                        >
                          {result.selected ? (
                            <CheckIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <PlusIcon className="h-5 w-5" />
                          )}
                        </div>
                        {typeof result?.id === 'string' && result?.id && (
                          <ReactPlayer
                            url={`https://www.youtube.com/watch?v=${result?.id}`}
                            className="!w-[450px] !h-[400px]"
                            controls
                          />
                        )}
                        <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/30 rounded-full cursor-pointer flex items-center w-[330px] justify-around text-white">
                          {result.statistics?.viewCount ? (
                            <div className="flex items-center gap-2">
                              <Eye />
                              {formatNumberWithSuffix(
                                Number(result.statistics.viewCount)
                              )}
                            </div>
                          ) : null}

                          {result.statistics?.likeCount ? (
                            <div className="flex items-center gap-2">
                              <Heart />
                              {formatNumberWithSuffix(
                                Number(result.statistics.likeCount)
                              )}
                            </div>
                          ) : null}

                          {result.statistics?.commentCount ? (
                            <div className="flex items-center gap-2">
                              <MessageCircle />
                              {formatNumberWithSuffix(
                                Number(result.statistics.commentCount)
                              )}
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Your Custom Transcripts</h3>
              <Dialog
                open={isAddTranscriptOpen}
                onOpenChange={setIsAddTranscriptOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Transcript
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Custom Transcript</DialogTitle>
                    <DialogDescription>
                      Add your own transcript for inspiration. This could be a
                      story, article, or any text that might inspire your
                      script.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="transcript-title"
                        className="text-sm font-medium"
                      >
                        Transcript Title
                      </label>
                      <Input
                        id="transcript-title"
                        placeholder="Enter a descriptive title..."
                        value={newTranscript.title}
                        onChange={(e) =>
                          setNewTranscript({
                            ...newTranscript,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="transcript-content"
                        className="text-sm font-medium"
                      >
                        Transcript Content
                      </label>
                      <Textarea
                        id="transcript-content"
                        placeholder="Paste or type your transcript here..."
                        className="min-h-[200px]"
                        value={newTranscript.content}
                        onChange={(e) =>
                          setNewTranscript({
                            ...newTranscript,
                            content: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddTranscriptOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddTranscript}>
                      Add Transcript
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {searchResults.filter((r) => r.source === 'custom').length === 0 ? (
              <div className="text-center py-12 border rounded-md">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Custom Transcripts
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Add your own transcripts to use as inspiration for your story.
                </p>
                <Dialog
                  open={isAddTranscriptOpen}
                  onOpenChange={setIsAddTranscriptOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Transcript
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults
                  .filter((r) => r.source === 'custom')
                  .map((result) => (
                    <Card
                      key={result.id}
                      className={result.selected ? 'border-primary' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {result.snippet.title}
                            </h3>
                            {result.selected && (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                Selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog
                              open={
                                isEditTranscriptOpen &&
                                editingTranscript?.id === result.id
                              }
                              onOpenChange={(open) => {
                                setIsEditTranscriptOpen(open);
                                if (!open) setEditingTranscript(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingTranscript({
                                      id: result.id,
                                      title: result.snippet.title,
                                      content: result.transcript,
                                    })
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Edit Custom Transcript
                                  </DialogTitle>
                                  <DialogDescription>
                                    Update your custom transcript.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <label
                                      htmlFor="edit-transcript-title"
                                      className="text-sm font-medium"
                                    >
                                      Transcript Title
                                    </label>
                                    <Input
                                      id="edit-transcript-title"
                                      placeholder="Enter a descriptive title..."
                                      value={editingTranscript?.title || ''}
                                      onChange={(e) =>
                                        setEditingTranscript((prev) =>
                                          prev
                                            ? { ...prev, title: e.target.value }
                                            : null
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label
                                      htmlFor="edit-transcript-content"
                                      className="text-sm font-medium"
                                    >
                                      Transcript Content
                                    </label>
                                    <Textarea
                                      id="edit-transcript-content"
                                      placeholder="Paste or type your transcript here..."
                                      className="min-h-[200px]"
                                      value={editingTranscript?.content || ''}
                                      onChange={(e) =>
                                        setEditingTranscript((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                content: e.target.value,
                                              }
                                            : null
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      setIsEditTranscriptOpen(false)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateTranscript}>
                                    Update Transcript
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteTranscript(
                                  result.id,
                                  result.snippet.title
                                )
                              }
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md p-3 bg-muted/30 mt-2">
                          <ScrollArea className="h-24">
                            <p className="text-sm whitespace-pre-line">
                              {result.transcript}
                            </p>
                          </ScrollArea>
                        </div>
                        <div className="mt-3">
                          <Button
                            variant={result.selected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleTranscriptSelection(result.id)}
                          >
                            {result.selected
                              ? 'Deselect'
                              : 'Select for Inspiration'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-2">
            Selected Transcripts for Inspiration
          </h3>
          {selectedTranscripts.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Check className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No transcripts selected. Select YouTube videos or add custom
                transcripts.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTranscripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
                >
                  {transcript.source === 'youtube' ? (
                    <Youtube className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium flex-1">
                    {transcript.snippet.title}
                  </span>
                  <div className="flex gap-2">
                    {!transcript.transcript ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetchTranscript(transcript.id);
                            toast({
                              title: 'Transcript Fetched',
                              description:
                                'The transcript has been successfully fetched.',
                            });
                          } catch (error) {
                            toast({
                              title: 'Failed to fetch transcript',
                              description:
                                error instanceof Error
                                  ? error.message
                                  : 'An error occurred',
                              variant: 'destructive',
                            });
                          }
                        }}
                        disabled={isLoading(`fetchTranscript-${transcript.id}`)}
                      >
                        {isLoading(`fetchTranscript-${transcript.id}`) ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-4 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          'Fetch Transcript'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                        onClick={() =>
                          setViewingTranscript({
                            id: transcript.id,
                            title: transcript.snippet.title,
                            content: transcript.transcript,
                          })
                        }
                      >
                        View Transcript
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedTranscript(transcript.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Transcript Viewer Modal */}
      <Dialog
        open={!!viewingTranscript}
        onOpenChange={(open) => !open && setViewingTranscript(null)}
      >
        <DialogContent className="max-w-3xl max-h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingTranscript?.title}</DialogTitle>
            <DialogDescription>Transcript Content</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 bg-muted/30 rounded-md text-sm overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {viewingTranscript?.content ? (
                viewingTranscript.content
              ) : (
                <p className="text-muted-foreground text-center">
                  No transcript content available.
                </p>
              )}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CardFooter className="flex justify-between gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setActiveTab('story-theme')}
        >
          <ArrowLeft className="h-4 w-4" /> Back: Story Theme
        </Button>
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            className="gap-2"
            disabled={isLoading('storyGeneration')}
            onClick={handleSkipOutline}
          >
            {isLoading('storyGeneration') ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skip : Outline...
              </>
            ) : (
              <>
                Skip : Outline
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (selectedTranscripts.length === 0) {
                toast({
                  title: 'No Transcripts Selected',
                  description:
                    'Please select at least one transcript before proceeding.',
                  variant: 'destructive',
                });
                return;
              }
              setActiveTab('outline');
            }}
          >
            Next: Outline <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
