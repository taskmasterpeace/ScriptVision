'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useProjectStore } from '@/lib/stores/project-store';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { shotList } = useProjectStore();

  return (
    <Card className="mt-6 border-dashed border-yellow-500">
      <CardHeader className="pb-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-between">
              <CardTitle className="text-md flex items-center">
                <Bug className="h-4 w-4 mr-2" /> Debug Panel
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Shot List State</h3>
                  <div className="bg-muted p-3 rounded-md overflow-auto max-h-[300px]">
                    <pre className="text-xs">
                      {JSON.stringify(shotList, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Current shot list:', shotList);
                    }}
                  >
                    Log to Console
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
}
