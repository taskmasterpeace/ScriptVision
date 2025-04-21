"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { Subject } from "@/lib/types"
import { CheckCircle2, Edit, Trash, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Change from an array to a function that returns an array
export const SubjectsColumns = (
  updateSubject?: (subject: Subject) => void,
  deleteSubject?: (id: string) => void,
  isProposed = false,
): ColumnDef<Subject>[] => [
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
        <Badge variant="outline" className="capitalize">
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
    accessorKey: "loraTrigger",
    header: "LORA Trigger",
    cell: ({ row }) => {
      const loraTrigger = row.original.loraTrigger
      return loraTrigger ? (
        <div className="max-w-[200px] truncate font-mono text-xs">{loraTrigger}</div>
      ) : (
        <span className="text-muted-foreground text-xs">None</span>
      )
    },
  },
  {
    accessorKey: "active",
    header: "Active",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean
      return active ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
    },
  },
  // Add actions column if update and delete functions are provided
  ...(updateSubject && deleteSubject
    ? [
        {
          id: "actions",
          cell: ({ row }) => {
            const subject = row.original
            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Create a dialog to edit the subject
                    const updatedSubject = { ...subject }
                    updateSubject(updatedSubject)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Are you sure you want to delete ${subject.name}?`)) {
                      deleteSubject(subject.id)
                    }
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )
          },
        },
      ]
    : []),
]
