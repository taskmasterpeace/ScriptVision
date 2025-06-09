'use client';

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
import { useAILogsStore, type AILogEntry } from '@/lib/stores/ai-logs-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Copy,
  Download,
  Trash2,
  Search,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

export default function AILogsTab() {
  const { toast } = useToast();
  const { logs, clearLogs } = useAILogsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AILogEntry | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'all' | 'prompts' | 'responses'>(
    'all'
  );

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: 'Content has been copied to clipboard.',
    });
  };

  const handleExportLogs = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `ai-logs-${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: 'Logs Exported',
        description: 'AI logs have been exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export logs. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClearLogs = () => {
    clearLogs();
    toast({
      title: 'Logs Cleared',
      description: 'All AI logs have been cleared.',
    });
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Filter and sort logs
  const filteredLogs = logs.filter((log) => {
    // Filter by type
    if (activeTab === 'prompts' && log.type !== 'prompt') return false;
    if (activeTab === 'responses' && log.type !== 'response') return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.content.toLowerCase().includes(searchLower) ||
        (log.template && log.template.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();

    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTemplateLabel = (templateId: string) => {
    switch (templateId) {
      case 'shot-list-generation':
        return 'Shot List';
      case 'subject-extraction':
        return 'Subjects';
      case 'directors-notes':
        return "Director's Notes";
      case 'visual-prompt':
        return 'Visual Prompt';
      case 'video-treatment':
        return 'Video Treatment';
      default:
        return templateId;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>AI Logs</CardTitle>
          <CardDescription>
            Monitor and inspect AI prompts and responses
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all AI interaction logs. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearLogs}>
                  Clear Logs
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortDirection}
              className="h-10 w-10"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Logs</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderLogsList(sortedLogs)}
            </TabsContent>

            <TabsContent value="prompts" className="mt-4">
              {renderLogsList(sortedLogs)}
            </TabsContent>

            <TabsContent value="responses" className="mt-4">
              {renderLogsList(sortedLogs)}
            </TabsContent>
          </Tabs>
        </div>

        {selectedLog && (
          <Dialog
            open={!!selectedLog}
            onOpenChange={(open) => !open && setSelectedLog(null)}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedLog.type === 'prompt' ? 'AI Prompt' : 'AI Response'}
                  {selectedLog.template && (
                    <Badge className="ml-2">
                      {getTemplateLabel(selectedLog.template)}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{formatTimestamp(selectedLog.timestamp)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(selectedLog.content)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                <div className="border rounded-md p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[400px]">
                    {selectedLog.content}
                  </pre>
                </div>

                {selectedLog.metadata && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Metadata</h4>
                    <div className="border rounded-md p-4 bg-muted/30">
                      <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[200px]">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );

  function renderLogsList(logs: AILogEntry[]) {
    if (logs.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No logs available. AI interactions will appear here.
        </div>
      );
    }

    return (
      <div className="border rounded-md overflow-hidden">
        <div className="divide-y">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={log.type === 'prompt' ? 'outline' : 'default'}
                  >
                    {log.type === 'prompt' ? 'Prompt' : 'Response'}
                  </Badge>
                  {log.template && (
                    <Badge variant="secondary" className="text-xs">
                      {getTemplateLabel(log.template)}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              <p className="text-sm mt-2 line-clamp-2 font-mono">
                {log.content}
              </p>
              <div className="flex justify-end mt-1">
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span className="text-xs">View Details</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
