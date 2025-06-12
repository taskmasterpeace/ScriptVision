'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Shot } from '@/lib/types';

export const ShotListColumns: ColumnDef<Shot>[] = [
  {
    accessorKey: 'scene',
    header: 'Scene',
  },
  {
    accessorKey: 'shot',
    header: 'Shot',
  },
  {
    accessorKey: 'shotSize',
    header: 'Size',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      return <div className="max-w-[300px] truncate">{description}</div>;
    },
  },
  {
    accessorKey: 'people',
    header: 'People',
  },
  {
    accessorKey: 'location',
    header: 'Location',
  },
  {
    accessorKey: 'directorsNotes',
    header: "Director's Notes",
    cell: ({ row }) => {
      const notes = row.getValue('directorsNotes') as string;
      return notes ? (
        <div className="max-w-[200px] truncate">{notes}</div>
      ) : (
        <div className="text-muted-foreground italic">None</div>
      );
    },
  },
];
