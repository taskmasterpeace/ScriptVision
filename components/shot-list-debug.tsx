'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useProjectStore } from '@/lib/stores/project-store';
import { v4 as uuidv4 } from 'uuid';
import type { Shot } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ShotListDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [rawShotList, setRawShotList] = useState('');
  const { addShots } = useProjectStore();
  const { toast } = useToast();

  const testParser = () => {
    try {
      // Access the parseAIShotList function from the window object
      const parseAIShotList = (window as any).parseAIShotList;

      if (!parseAIShotList) {
        toast({
          title: 'Parser not available',
          description:
            'The shot list parser function is not available on the window object.',
          variant: 'destructive',
        });
        return;
      }

      const shots = parseAIShotList(rawShotList);

      toast({
        title: 'Parser test results',
        description: `Successfully parsed ${shots.length} shots.`,
      });

      console.log('Parsed shots:', shots);
    } catch (error) {
      toast({
        title: 'Parser test failed',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });

      console.error('Parser test failed:', error);
    }
  };

  const importRawShots = () => {
    try {
      // Try to parse as JSON first
      try {
        const jsonShots = JSON.parse(rawShotList);

        // Check if it's an array
        if (Array.isArray(jsonShots)) {
          // Ensure each shot has an ID
          const shotsWithIds = jsonShots.map((shot: Partial<Shot>) => ({
            ...shot,
            id: shot.id || uuidv4(),
          }));

          addShots(shotsWithIds as Shot[]);

          toast({
            title: 'Shots imported',
            description: `Successfully imported ${shotsWithIds.length} shots from JSON.`,
          });

          return;
        }
      } catch (e) {
        // Not valid JSON, continue with text parsing
      }

      // Access the parseAIShotList function from the window object
      const parseAIShotList = (window as any).parseAIShotList;

      if (!parseAIShotList) {
        toast({
          title: 'Parser not available',
          description:
            'The shot list parser function is not available on the window object.',
          variant: 'destructive',
        });
        return;
      }

      const shots = parseAIShotList(rawShotList);

      if (shots.length === 0) {
        toast({
          title: 'Import failed',
          description: 'No shots could be parsed from the input.',
          variant: 'destructive',
        });
        return;
      }

      addShots(shots);

      toast({
        title: 'Shots imported',
        description: `Successfully imported ${shots.length} shots.`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });

      console.error('Import failed:', error);
    }
  };

  if (!isOpen) {
    return (
      <div className="mt-4">
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Show Shot List Debug Panel
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Shot List Debug Panel
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Hide
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Paste raw shot list text here to test the parser or import shots
              directly:
            </p>
            <Textarea
              value={rawShotList}
              onChange={(e) => setRawShotList(e.target.value)}
              rows={10}
              className="font-mono text-xs"
              placeholder="Paste raw shot list text here..."
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={testParser}>
              Test Parser
            </Button>
            <Button variant="default" onClick={importRawShots}>
              Import Shots
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Debug tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Open the browser console to see detailed parsing logs</li>
              <li>The parser function is exposed as window.parseAIShotList</li>
              <li>
                You can also paste JSON directly if it matches the Shot
                interface structure
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
