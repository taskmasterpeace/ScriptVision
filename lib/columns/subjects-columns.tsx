import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { Subject } from "@/lib/types"
import { CheckCircle2, XCircle } from "lucide-react"

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
]
