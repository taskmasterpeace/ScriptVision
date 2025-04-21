"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DirectorStyle } from "@/lib/types"

export const DirectorStylesColumns: ColumnDef<DirectorStyle>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "visualStyle",
    header: "Visual Style",
    cell: ({ row }) => {
      const style = row.getValue("visualStyle") as string
      return <div className="max-w-[300px] truncate">{style}</div>
    },
  },
  {
    accessorKey: "narrativeApproach",
    header: "Narrative Approach",
    cell: ({ row }) => {
      const approach = row.getValue("narrativeApproach") as string
      return <div className="max-w-[300px] truncate">{approach}</div>
    },
  },
  {
    accessorKey: "camerawork",
    header: "Camerawork",
    cell: ({ row }) => {
      const camerawork = row.getValue("camerawork") as string
      return <div className="max-w-[200px] truncate">{camerawork}</div>
    },
  },
]
