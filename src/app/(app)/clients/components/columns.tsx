"use client"

import { type ColumnDef } from "@tanstack/react-table"
import type { Client } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye } from "lucide-react"
import { ViewClientDetailsDialog } from "./view-client-details-dialog"

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex items-center gap-3">
          <span className="font-medium">{client.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original
 
      return (
        <ViewClientDetailsDialog client={client}>
            <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View
            </Button>
        </ViewClientDetailsDialog>
      )
    },
  },
]
