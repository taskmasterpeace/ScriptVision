'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Style } from '@/lib/types';

export const StylesColumns: ColumnDef<Style>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'genre',
    header: 'Genre',
  },
  {
    accessorKey: 'prefix',
    header: 'Prefix',
    cell: ({ row }) => {
      const prefix = row.getValue('prefix') as string;
      return <div className="max-w-[200px] truncate">{prefix}</div>;
    },
  },
  {
    accessorKey: 'suffix',
    header: 'Suffix',
    cell: ({ row }) => {
      const suffix = row.getValue('suffix') as string;
      return <div className="max-w-[200px] truncate">{suffix}</div>;
    },
  },
  {
    accessorKey: 'descriptors',
    header: 'Descriptors',
    cell: ({ row }) => {
      const descriptors = row.getValue('descriptors') as string;
      return <div className="max-w-[200px] truncate">{descriptors}</div>;
    },
  },
];
