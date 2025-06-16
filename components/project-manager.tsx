'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/lib/stores/project-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { ProjectListColumns } from '@/lib/columns/project-list-columns';
import { Save, FolderOpen, Trash2 } from 'lucide-react';

export default function ProjectManager() {
  const { toast } = useToast();
  const {
    projectName,
    setProjectName,
    saveProject,
    loadProject,
    deleteProject,
    listProjects,
  } = useProjectStore();

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [selectedProjectToLoad, setSelectedProjectToLoad] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const [selectedProjectToDelete, setSelectedProjectToDelete] = useState<
    string | null
  >(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshProjectList();
  }, []);

  const refreshProjectList = async () => {
    try {
      const projectList = await listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to list projects:', error);
    }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a project name to save.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveProject();
      await refreshProjectList();
      toast({
        title: 'Project Saved',
        description: `Project "${projectName}" has been saved.`,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description:
          error instanceof Error ? error.message : 'Failed to save project.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = async () => {
    if (!selectedProjectToLoad) {
      toast({
        title: 'No Project Selected',
        description: 'Please select a project to load.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await loadProject(selectedProjectToLoad.id);
      setIsLoadDialogOpen(false);
      toast({
        title: 'Project Loaded',
        description: `Project "${selectedProjectToLoad.name}" has been loaded.`,
      });
    } catch (error) {
      toast({
        title: 'Load Failed',
        description:
          error instanceof Error ? error.message : 'Failed to load project.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectToDelete) return;

    try {
      await deleteProject(selectedProjectToDelete);
      await refreshProjectList();
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Project Deleted',
        description: `Project "${selectedProjectToDelete}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete project.',
        variant: 'destructive',
      });
    }
  };

  const handleProjectRowClick = (project: any) => {
    if (isLoadDialogOpen) {
      setSelectedProjectToLoad({ name: project.name, id: project.id });
    } else if (isDeleteDialogOpen) {
      setSelectedProjectToDelete(project.name);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="max-w-xs"
          />

          <Button
            onClick={handleSaveProject}
            disabled={isSaving || !projectName.trim()}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Project'}
          </Button>

          <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Load Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Load Project</DialogTitle>
                <DialogDescription>Select a project to load</DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {projects.length > 0 ? (
                  <DataTable
                    columns={ProjectListColumns}
                    data={projects}
                    onRowClick={handleProjectRowClick}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No saved projects found.
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsLoadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLoadProject}
                  disabled={isLoading || !selectedProjectToLoad}
                >
                  {isLoading ? 'Loading...' : 'Load Project'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProjectToDelete(null);
                  setIsDeleteDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>
                  Select a project to delete
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {projects.length > 0 ? (
                  <DataTable
                    columns={ProjectListColumns}
                    data={projects}
                    onRowClick={handleProjectRowClick}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No projects found.
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProjectToDelete(null);
                    setIsDeleteDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedProjectToDelete) {
                      handleDeleteProject();
                      setIsDeleteDialogOpen(false);
                    }
                  }}
                  disabled={!selectedProjectToDelete}
                  variant="destructive"
                >
                  Delete Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
