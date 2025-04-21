"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Subject } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

export const SubjectsColumns: ColumnDef<Subject>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return (
        <Badge variant={category === "People" ? "default" : category === "Places" ? "secondary" : "outline"}>
          {category}
        </Badge>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      return <div className="max-w-[300px] truncate">{description}</div>
    },
  },
  {
    accessorKey: "alias",
    header: "Alias",
  },
  {
    accessorKey: "active",
    header: "Active",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean
      return active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
    },
  },
]
