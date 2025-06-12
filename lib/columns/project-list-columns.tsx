'use client';

import type { ColumnDef } from '@tanstack/react-table';

interface ProjectListItem {
  name: string;
  lastModified: string;
  shotCount: number;
  subjectCount: number;
  promptCount: number;
}

export const ProjectListColumns: ColumnDef<ProjectListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Project Name',
  },
  {
    accessorKey: 'lastModified',
    header: 'Last Modified',
    cell: ({ row }) => {
      const date = new Date(row.getValue('lastModified') as string);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'shotCount',
    header: 'Shots',
  },
  {
    accessorKey: 'subjectCount',
    header: 'Subjects',
  },
  {
    accessorKey: 'promptCount',
    header: 'Prompts',
  },
];
