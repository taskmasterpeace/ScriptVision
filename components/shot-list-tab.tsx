'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { DataTable } from '@/components/ui/data-table';
import { ShotListColumns } from '@/lib/columns/shot-list-columns';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useLoadingStore } from '@/lib/stores/loading-store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ShotSuggestions from '@/components/shot-suggestions';

export default function ShotListTab() {
  const { toast } = useToast();
  const { shotList, script, generateShotList } = useProjectStore();
  const { isLoading } = useLoadingStore();
  const [showSuccess, setShowSuccess] = useState(false);

  // Show success message when shot list is generated
  useEffect(() => {
    if (shotList.length > 0) {
      setShowSuccess(true);
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [shotList]);

  const handleGenerateShotList = async () => {
    if (!script.trim()) {
      toast({
        title: 'Script Required',
        description: 'Please enter a script before generating a shot list.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await generateShotList();
      toast({
        title: 'Shot List Generated',
        description: `${shotList.length} shots have been generated from your script.`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate shot list.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Shot List</CardTitle>
          <CardDescription>
            Manage your shot list for production
          </CardDescription>
        </div>
        <Button
          onClick={handleGenerateShotList}
          disabled={isLoading('generateShotList') || !script}
        >
          {isLoading('generateShotList') ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Shot List'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {showSuccess && shotList.length > 0 && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">
              Shot List Generated Successfully
            </AlertTitle>
            <AlertDescription>
              {shotList.length} shots have been generated from your script.
            </AlertDescription>
          </Alert>
        )}

        {shotList.length > 0 ? (
          <>
            <DataTable columns={ShotListColumns} data={shotList} />
            {/* Shot Suggestions component */}
            <ShotSuggestions />
          </>
        ) : (
          <div className="text-center py-12 border rounded-md bg-muted/10">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Shot List Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {script
                ? 'Generate a shot list from your script to get started.'
                : 'You need to enter a script first to generate a shot list.'}
            </p>
            {script ? (
              <Button
                variant="outline"
                onClick={handleGenerateShotList}
                disabled={isLoading('generateShotList')}
              >
                {isLoading('generateShotList') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Shot List'
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  window.document.getElementById('script-tab-trigger')?.click()
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Script Tab
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
